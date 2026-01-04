import { App, CfnOutput, Duration, RemovalPolicy, Stack, StackProps, Tags } from 'aws-cdk-lib';
import { aws_ec2 as ec2 } from 'aws-cdk-lib';
import { aws_iam as iam } from 'aws-cdk-lib';
import { aws_certificatemanager as acm } from 'aws-cdk-lib';
import { aws_route53 as route53 } from 'aws-cdk-lib';
import { aws_rds as rds } from 'aws-cdk-lib';
import { aws_logs as logs } from 'aws-cdk-lib';
import { aws_ssm as ssm } from 'aws-cdk-lib';
import { aws_sqs as sqs } from 'aws-cdk-lib';
import { aws_lambda as lambda } from 'aws-cdk-lib';
import { aws_lambda_event_sources as lambdaEventSources } from 'aws-cdk-lib';
import { DatabaseInstanceEngine, MysqlEngineVersion } from 'aws-cdk-lib/aws-rds';
import { aws_secretsmanager as secretsmanager } from 'aws-cdk-lib';
import { SecretValue } from 'aws-cdk-lib';
import { aws_s3 as s3 } from 'aws-cdk-lib';
import * as apprunner from '@aws-cdk/aws-apprunner-alpha';
import * as ecr from 'aws-cdk-lib/aws-ecr';
import * as cognito from 'aws-cdk-lib/aws-cognito';

export class DeployStack extends Stack {
  constructor(scope: App, id: string, props?: StackProps) {
    super(scope, id, props);
    const account = Stack.of(this).account;
    const region = Stack.of(this).region;

    const vpc = ec2.Vpc.fromLookup(this, 'ImportVPC',{isDefault: true});
    
    const environmentName = process.env.TRACKBOSS_ENVIRONMENT_NAME || 'trackboss';

    const zone = route53.HostedZone.fromHostedZoneAttributes(this, 'trackbossZone', 
        {
            hostedZoneId: 'Z01677201PBLHEH8PE24N',
            zoneName: 'hogbackmx.com'
        },
    );

    const hogbackmxCert = new acm.DnsValidatedCertificate(this, 'backendCertificateApi', {
        domainName: '*.hogbackmx.com',
        hostedZone: zone,
        region: 'us-east-1',
    });

    const dockerReg = `${account}.dkr.ecr.${region}.amazonaws.com`;
    const dockerImg = `${dockerReg}/pra/trackbossapi:latest`;
    
    // attach to RDS from app runner
    const appRunnerRdsInbound = new ec2.SecurityGroup(this, 'appRunnerRdsInbound', {
        vpc,
        allowAllOutbound: true,
        description: 'inbound rules for database',
    });

    const rdsInstance = rds.DatabaseInstance.fromDatabaseInstanceAttributes(this, 'trackBossAppDb', {
      instanceIdentifier: 'praclubmanager2-dev',
      instanceEndpointAddress: `arn:aws:rds:${region}:${account}:db:praclubmanager2-dev`,
      port: 3306,
      securityGroups: [appRunnerRdsInbound],
    });
    rdsInstance.connections.addSecurityGroup(appRunnerRdsInbound);

    const availabilityZones = [`${region}b`, `${region}c`];
    const vpcConnector = new apprunner.VpcConnector(this, 'VpcConnector', {
        vpc,
        vpcSubnets: vpc.selectSubnets({ availabilityZones }),
        vpcConnectorName: `${environmentName}vpcConnector`,
    });
 
    const trackbossApiService = new apprunner.Service(this, `${environmentName}-api-runner`, {
        cpu: apprunner.Cpu.ONE_VCPU,
        instanceRole: iam.Role.fromRoleName(this, 'trackboss-role', 'ec2_aws_access'),
        source: apprunner.Source.fromEcr({
          imageConfiguration: {
            environmentVariables: {
                MYSQL_DB: 'pradb',
                MYSQL_HOST: 'instance',
                MYSQL_USER: 'user',
                MYSQL_PASS: 'pass',
            },
            port: 3000,
          },
          repository: ecr.Repository.fromRepositoryName(this, 'trackboss-repo', 'pra/trackbossapi'),
          tagOrDigest: 'latest',
        }),
        vpcConnector,
    });

    vpc.selectSubnets({ availabilityZones }).subnets.forEach(subnet => {
        rdsInstance.connections.allowFrom(ec2.Peer.ipv4(subnet.ipv4CidrBlock), ec2.Port.tcp(3306), 'App runner MySQL');
    });
    availabilityZones.forEach((az) => {
        const publicIp = new ec2.CfnEIP(this, `${environmentName}-${az}-elasticIp`);
    });
    const taggableInfra = [trackbossApiService];
    taggableInfra.forEach(infraElement => {
        Tags.of(infraElement).add('EnvironmentName', environmentName);
        Tags.of(infraElement).add('Name', `${environmentName}-api`);  
    });

    const applicationLogsGroup = new logs.LogGroup(
      this, 'LogGroup', {
        logGroupName: `${environmentName}-api-logs`
      }
    );

    // create queue
    const emailQueue = new sqs.Queue(this, 'trackboss-email-queue', {
        queueName: 'trackboss-queue-EMAIL',
        visibilityTimeout: Duration.minutes(10),
    });

    const textQueue = new sqs.Queue(this, 'trackboss-text-queue', {
        queueName: 'trackboss-queue-TEXT',
        visibilityTimeout: Duration.minutes(10),
    });
    
    const rdsParamGroup = new rds.ParameterGroup(this, 'trackbossRdsParamGroup', {
      engine: DatabaseInstanceEngine.mysql({ version: MysqlEngineVersion.VER_5_7 }),
      description: 'RDS MySql parameter group to allow the use of triggers.', 
    });  
    rdsParamGroup.addParameter('log_bin_trust_function_creators','1');
    
    // inbound handling for text messages
    const inboundMemberCommLambda = new lambda.Function(this, 'inboundMemberCommHandler', {
        runtime: lambda.Runtime.NODEJS_22_X,
        tracing: lambda.Tracing.ACTIVE,
        code: lambda.Code.fromAsset('../../../lambda'),
        handler: 'messageProcessor.handler',
        environment: {},
        timeout: Duration.minutes(10),
    });
    emailQueue.grantConsumeMessages(inboundMemberCommLambda);
    textQueue.grantConsumeMessages(inboundMemberCommLambda);
    const memberCommIamPolicy = new iam.PolicyStatement();
    memberCommIamPolicy.addActions('ses:SendEmail', 'ses:SendRawEmail');
    memberCommIamPolicy.addActions('ses:SendEmail', 'ses:SendHtmlEmail');
    memberCommIamPolicy.addResources('*');
    memberCommIamPolicy.addActions('sns:Publish');
    memberCommIamPolicy.addResources('*');
    inboundMemberCommLambda.addToRolePolicy(memberCommIamPolicy);
    inboundMemberCommLambda.addEventSource(new lambdaEventSources.SqsEventSource(emailQueue));
    inboundMemberCommLambda.addEventSource(new lambdaEventSources.SqsEventSource(textQueue));

    const apiLambda = new lambda.Function(this, 'ApiLambda', {
        runtime: lambda.Runtime.NODEJS_16_X,
        code: lambda.Code.fromAsset('../../../lambda/api'),
        handler: 'lambda.handler',
    });
    
    const cognitoPoolId = new ssm.StringParameter(this, 'cognitoPoolId', {
      allowedPattern: '.*',
      parameterName: 'cognitoPoolId',
      stringValue: process.env.COGNITO_POOL_ID || '',
      tier: ssm.ParameterTier.STANDARD,
    });
    
    const cognitoClientId = new ssm.StringParameter(this, 'cognitoClientId', {
      allowedPattern: '.*',
      parameterName: 'cognitoClientId',
      stringValue: process.env.COGNITO_CLIENT_ID || '',
      tier: ssm.ParameterTier.STANDARD,
    });

    const clubEmail = new ssm.StringParameter(this, 'clubEmail', {
      allowedPattern: '.*',
      parameterName: 'clubEmail',
      stringValue: process.env.CLUB_EMAIL || '',
      tier: ssm.ParameterTier.STANDARD,
    });

    const trackbossEnvironmentName = new ssm.StringParameter(this, 'trackbossEnvironmentName', {
        allowedPattern: '.*',
        parameterName: 'trackbossEnvironmentName',
        stringValue: 'trackboss',
        tier: ssm.ParameterTier.STANDARD,
    });

    const accountParam = new ssm.StringParameter(this, 'account', {
        allowedPattern: '.*',
        parameterName: 'account',
        stringValue: account,
        tier: ssm.ParameterTier.STANDARD,
    });

    const regionParam = new ssm.StringParameter(this, 'region', {
        allowedPattern: '.*',
        parameterName: 'region',
        stringValue: region,
        tier: ssm.ParameterTier.STANDARD,
    });

    const squareSsm = new secretsmanager.Secret(this, 'squareInfo', {
        secretName: '/trackboss/app/square',
        secretObjectValue: {
          locationId: SecretValue.unsafePlainText(process.env.SQUARE_LOCATION || ''),
          token: new SecretValue(process.env.SQUARE_TOKEN || ''),
        },
    });
    
    const appRunnerRole = new iam.Role(this, 'trackboss-api-role', {
        assumedBy: new iam.ServicePrincipal('tasks.apprunner.amazonaws.com'),
        roleName: `${trackbossEnvironmentName.stringValue}-api-runner-role`
    });

    // role for apprunner
    const appRunnerSesPolicy = new iam.PolicyStatement();
    appRunnerSesPolicy.addActions('ses:SendEmail', 'ses:SendRawEmail');
    appRunnerSesPolicy.addActions('ses:SendEmail', 'ses:SendHtmlEmail');
    appRunnerSesPolicy.addAllResources();
    appRunnerRole.addToPolicy(appRunnerSesPolicy);
    
    const appRunnerSnsPolicy = new iam.PolicyStatement();
    appRunnerSnsPolicy.addActions('sns:Publish');
    appRunnerSnsPolicy.addAllResources();
    appRunnerRole.addToPolicy(appRunnerSnsPolicy);
    
    const appRunnerParamStorePolicy = new iam.PolicyStatement();
    [cognitoClientId, cognitoPoolId, clubEmail, trackbossEnvironmentName, accountParam, regionParam].forEach((ssmParam) => {
        appRunnerParamStorePolicy.addActions('ssm:GetParameter');
        appRunnerParamStorePolicy.addResources(ssmParam.parameterArn);
    });
    appRunnerRole.addToPolicy(appRunnerParamStorePolicy);

    const appRunnerSqsPolicy = new iam.PolicyStatement();
    [emailQueue, textQueue].forEach((sqsQueue) => {
        appRunnerSqsPolicy.addActions('sqs:SendMessage');
        appRunnerSqsPolicy.addResources(sqsQueue.queueArn);
    });
    appRunnerRole.addToPolicy(appRunnerSqsPolicy);

    const appRunnerSecretsManagerPolicy = new iam.PolicyStatement();
    appRunnerSecretsManagerPolicy.addActions('secretsmanager:GetSecretValue');
    appRunnerSecretsManagerPolicy.addResources(squareSsm.secretArn);
    appRunnerRole.addToPolicy(appRunnerSecretsManagerPolicy);
    
    const appRunnerCloudWatchLogsPolicy = new iam.PolicyStatement();
    appRunnerCloudWatchLogsPolicy.addActions('logs:PutLogEvents');
    appRunnerCloudWatchLogsPolicy.addActions('logs:DescribeLogStreams');
    appRunnerCloudWatchLogsPolicy.addActions('logs:CreateLogStreams');
    appRunnerCloudWatchLogsPolicy.addAllResources();
    appRunnerRole.addToPolicy(appRunnerCloudWatchLogsPolicy);

    const cognitoPool = cognito.UserPool.fromUserPoolId(this, 'cognitoUserPool', cognitoPoolId.stringValue);
    const appRunnerCognitoPolicy = new iam.PolicyStatement();
    appRunnerCognitoPolicy.addActions('cognito-idp:AdminAddUserToGroup');
    appRunnerCognitoPolicy.addActions('cognito-idp:AdminCreateUser');
    appRunnerCognitoPolicy.addActions('cognito-idp:AdminDeleteUser');
    appRunnerCognitoPolicy.addActions('cognito-idp:AdminSetUserPassword');
    appRunnerCognitoPolicy.addActions('cognito-idp:AdminUpdateUserAttributes');
    appRunnerCognitoPolicy.addResources(cognitoPool.userPoolArn);
    appRunnerRole.addToPolicy(appRunnerCognitoPolicy);

    const databackupBucket = new s3.Bucket(this, 'forgeTrakDataBackup', {
        bucketName: 'forgetrak-data-backup',
        // lifecycle rules are somewhat flippant, but this is a backup of
        // data that is already in RDS Backups and easily re-creatable
        removalPolicy: RemovalPolicy.DESTROY,
        autoDeleteObjects: true,
        versioned: true,
        encryption: s3.BucketEncryption.S3_MANAGED,
        publicReadAccess: false,
    });
    const fn = new lambda.DockerImageFunction(this, 'DbBackupFn', {
        code: lambda.DockerImageCode.fromImageAsset('../../../lambda/backup'),
        memorySize: 1024,
        timeout: Duration.minutes(10),
        vpc,
        allowPublicSubnet: true,
        environment: {
            DB_HOST: rdsInstance.dbInstanceEndpointAddress,
            DB_NAME: 'pradb',
            DB_USER: '',
            DB_PASSWORD: '',
            BUCKET: databackupBucket.bucketName,
            PREFIX: 'db-backups/',
        },
      });

    
  }

}
