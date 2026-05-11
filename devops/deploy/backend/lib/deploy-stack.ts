import * as cdk from 'aws-cdk-lib';
import { App, CfnOutput, Duration, RemovalPolicy, Stack, StackProps, Tags } from 'aws-cdk-lib';
import { aws_ec2 as ec2 } from 'aws-cdk-lib';
import { aws_iam as iam } from 'aws-cdk-lib';
import { aws_certificatemanager as acm } from 'aws-cdk-lib';
import { aws_route53 as route53 } from 'aws-cdk-lib';
import { aws_rds as rds } from 'aws-cdk-lib';
import { aws_ssm as ssm } from 'aws-cdk-lib';
import { aws_sqs as sqs } from 'aws-cdk-lib';
import { aws_lambda as lambda } from 'aws-cdk-lib';
import { aws_lambda_event_sources as lambdaEventSources } from 'aws-cdk-lib';
import { DatabaseInstanceEngine, MysqlEngineVersion } from 'aws-cdk-lib/aws-rds';
import { aws_s3 as s3 } from 'aws-cdk-lib';
import * as ecr from 'aws-cdk-lib/aws-ecr';
import * as cognito from 'aws-cdk-lib/aws-cognito';
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import * as origins from 'aws-cdk-lib/aws-cloudfront-origins';
import * as route53Targets from 'aws-cdk-lib/aws-route53-targets';
import * as events from 'aws-cdk-lib/aws-events';
import * as targets from 'aws-cdk-lib/aws-events-targets';

export class DeployStack extends Stack {
  constructor(scope: App, id: string, props?: StackProps) {
    super(scope, id, props);
    const account = Stack.of(this).account;
    const region = Stack.of(this).region;

    const vpc = ec2.Vpc.fromLookup(this, 'ImportVPC',{isDefault: true});

    const forgetrakEnvironment = process.env.FORGETRAK_ENVIRONMENT_NAME || 'forgetrak-prod';

    // fck-nat: cheap NAT instance in the default VPC for Lambda outbound internet
    const fckNatSg = new ec2.SecurityGroup(this, 'FckNatSg', {
      vpc,
      description: 'fck-nat instance security group',
      allowAllOutbound: true,
    });
    fckNatSg.addIngressRule(ec2.Peer.ipv4(vpc.vpcCidrBlock), ec2.Port.allTraffic(), 'Allow VPC traffic through NAT');

    const fckNatInstance = new ec2.Instance(this, 'FckNatInstance', {
      vpc,
      vpcSubnets: { subnetType: ec2.SubnetType.PUBLIC },
      instanceType: ec2.InstanceType.of(ec2.InstanceClass.T4G, ec2.InstanceSize.MICRO),
      machineImage: ec2.MachineImage.lookup({
        name: 'fck-nat-al2023-*-arm64-*',
        owners: ['568608671756'],
      }),
      securityGroup: fckNatSg,
    });
    (fckNatInstance.node.defaultChild as ec2.CfnInstance).sourceDestCheck = false;

    // Private subnets in the default VPC for Lambda placement
    const privateRouteTable = new ec2.CfnRouteTable(this, 'PrivateRouteTable', {
      vpcId: vpc.vpcId,
      tags: [{ key: 'Name', value: `${forgetrakEnvironment}-private-rt` }],
    });
    new ec2.CfnRoute(this, 'NatRoute', {
      routeTableId: privateRouteTable.ref,
      destinationCidrBlock: '0.0.0.0/0',
      instanceId: fckNatInstance.instanceId,
    });

    const privateSubnets = [`${region}b`, `${region}c`].map((az, i) => {
      const cfnSubnet = new ec2.CfnSubnet(this, `PrivateSubnet${i}`, {
        vpcId: vpc.vpcId,
        cidrBlock: `172.31.${128 + i}.0/24`,
        availabilityZone: az,
        tags: [{ key: 'Name', value: `${forgetrakEnvironment}-private-${az}` }],
      });
      new ec2.CfnSubnetRouteTableAssociation(this, `PrivateRtAssoc${i}`, {
        subnetId: cfnSubnet.ref,
        routeTableId: privateRouteTable.ref,
      });
      return ec2.Subnet.fromSubnetAttributes(this, `LambdaSubnet${i}`, {
        subnetId: cfnSubnet.ref,
        availabilityZone: az,
        routeTableId: privateRouteTable.ref,
      });
    });

    const zone = route53.HostedZone.fromHostedZoneAttributes(this, 'trackbossZone', 
        {
            hostedZoneId: 'Z01677201PBLHEH8PE24N',
            zoneName: 'hogbackmx.com'
        },
    );

    const forgeTrakZone = route53.HostedZone.fromHostedZoneAttributes(this, 'forgeTrakZone',
        {
            hostedZoneId: 'Z08084702HFW0EXZKUGNQ',
            zoneName: 'forgetrak.com'
        },
    );

    const hogbackmxCert = new acm.DnsValidatedCertificate(this, 'backendCertificateApi', {
        domainName: '*.hogbackmx.com',
        hostedZone: zone,
        region: 'us-east-1',
    });

    const forgeTrakCert = new acm.DnsValidatedCertificate(this, 'forgeTrakCertificate', {
        domainName: '*.forgetrak.com',
        hostedZone: forgeTrakZone,
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

    const communicationQueue = `${forgetrakEnvironment}-queue`;

    // create queue
    const emailQueue = new sqs.Queue(this, 'forgetrak-email-queue', {
        queueName: `${communicationQueue}-EMAIL`,
        visibilityTimeout: Duration.minutes(10),
    });

    const textQueue = new sqs.Queue(this, 'forgetrak-text-queue', {
        queueName: `${communicationQueue}-TEXT`,
        visibilityTimeout: Duration.minutes(10),
    });
    
    const rdsParamGroup = new rds.ParameterGroup(this, 'trackbossRdsParamGroup', {
      engine: DatabaseInstanceEngine.mysql({ version: MysqlEngineVersion.VER_5_7 }),
      description: 'RDS MySql parameter group to allow the use of triggers.', 
    });  
    rdsParamGroup.addParameter('log_bin_trust_function_creators','1');

    // New CDK-managed RDS instance (replacement for the legacy clickops praclubmanager2-dev).
    // Side-by-side with the imported instance above during migration.
    const newRdsEngine = DatabaseInstanceEngine.mysql({ version: MysqlEngineVersion.VER_8_4_8 });

    const newRdsParamGroup = new rds.ParameterGroup(this, 'forgetrakRdsParamGroup', {
      engine: newRdsEngine,
      description: 'RDS MySQL 8.4 parameter group (allow trigger creation).',
    });
    newRdsParamGroup.addParameter('log_bin_trust_function_creators', '1');

    const newRdsSg = new ec2.SecurityGroup(this, 'forgetrakRdsSg', {
      vpc,
      allowAllOutbound: true,
      description: 'Security group for forgetrak RDS instance',
    });

    const forgeTrakRdsInstance = new rds.DatabaseInstance(this, 'forgetrakRds', {
      engine: newRdsEngine,
      instanceType: ec2.InstanceType.of(ec2.InstanceClass.T3, ec2.InstanceSize.MICRO),
      vpc,
      vpcSubnets: { subnetType: ec2.SubnetType.PUBLIC },
      publiclyAccessible: true,
      allocatedStorage: 20,
      storageType: rds.StorageType.GP2,
      credentials: rds.Credentials.fromGeneratedSecret('admin', {
        secretName: `${forgetrakEnvironment}-rds-credentials`,
      }),
      databaseName: 'forgetrak',
      parameterGroup: newRdsParamGroup,
      securityGroups: [newRdsSg],
      backupRetention: Duration.days(7),
      deletionProtection: true,
      removalPolicy: RemovalPolicy.RETAIN,
      instanceIdentifier: `${forgetrakEnvironment}-db`,
    });

    new CfnOutput(this, 'forgetrakRdsEndpoint', {
      value: forgeTrakRdsInstance.dbInstanceEndpointAddress,
    });
    new CfnOutput(this, 'forgetrakRdsSecretArn', {
      value: forgeTrakRdsInstance.secret?.secretArn ?? '',
    });
    
    // inbound handling for text messages
    const inboundMemberCommLambda = new lambda.Function(this, 'inboundMemberCommHandler', {
        runtime: lambda.Runtime.NODEJS_24_X,
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
    
    const appRunnerRole = new iam.Role(this, 'trackboss-api-role', {
        assumedBy: new iam.ServicePrincipal('tasks.apprunner.amazonaws.com'),
        roleName: `${process.env.TRACKBOSS_ENVIRONMENT_NAME}-api-runner-role`
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
    [cognitoClientId, cognitoPoolId, accountParam, regionParam].forEach((ssmParam) => {
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
    
    const dataBackupLambda = new lambda.DockerImageFunction(this, 'DbBackupFn', {
        code: lambda.DockerImageCode.fromImageAsset('../../../lambda/backup'),
        memorySize: 1024,
        timeout: Duration.minutes(10),
        vpc,
        vpcSubnets: { subnets: privateSubnets },
        environment: {
            DB_HOST: forgeTrakRdsInstance.instanceEndpoint.hostname,
            DB_NAME: 'pradb',
            DB_USER: '',
            DB_PASS: '',
            BUCKET: databackupBucket.bucketName,
            PREFIX: 'db-backups/',
        },
      });
    
    databackupBucket.grantWrite(dataBackupLambda);
    databackupBucket.grantReadWrite(dataBackupLambda);

    forgeTrakRdsInstance.connections.allowDefaultPortFrom(dataBackupLambda, 'Data backup lambda to new RDS');
    forgeTrakRdsInstance.secret?.grantRead(dataBackupLambda);

    const cognitoTenantIdsInjection = new lambda.Function(this, 'cognitoTenantIdsInjection', {
        runtime: lambda.Runtime.NODEJS_24_X,
        tracing: lambda.Tracing.ACTIVE,
        code: lambda.Code.fromAsset('../../../lambda/cognitoTokenInjection'),
        handler: 'injectCognitoToken.handler',
        environment: {},
        timeout: Duration.minutes(10),
    });

    // Grant Cognito permission to invoke the Lambda
    cognitoTenantIdsInjection.addPermission('CognitoInvoke', {
        principal: new iam.ServicePrincipal('cognito-idp.amazonaws.com'),
        sourceArn: cognitoPool.userPoolArn,
    });

    const forgeTrakApiLambda = new lambda.DockerImageFunction(this, 'forgeTrakApiLambda', {
        code: lambda.DockerImageCode.fromEcr(ecr.Repository.fromRepositoryName(this, 'forgetrak-lambda-repo', 'forgetrak/forgetrakapi'), {
            tagOrDigest: 'latest',
        }),
        memorySize: 1024,
        timeout: Duration.minutes(10),
        vpc,
        vpcSubnets: { subnets: privateSubnets },        
        role: iam.Role.fromRoleName(this, 'forgetrak-lambda-role', 'ec2_aws_access'),
        environment: {
            FORGETRAK_ENVIRONMENT: forgetrakEnvironment,
            COGNITO_POOL_ID: cognitoPoolId.stringValue,
            COGNITO_CLIENT_ID: cognitoClientId.stringValue,
            MYSQL_HOST: forgeTrakRdsInstance.dbInstanceEndpointAddress,
            MYSQL_USER: forgeTrakRdsInstance.secret?.secretValueFromJson('username').unsafeUnwrap() || '',
            MYSQL_PASS: forgeTrakRdsInstance.secret?.secretValueFromJson('password').unsafeUnwrap() || '',
            MYSQL_DB: 'forgetrak',
        },
        functionName: `${forgetrakEnvironment}-api-backend`,
    });

    forgeTrakRdsInstance.connections.allowDefaultPortFrom(forgeTrakApiLambda, 'forgeTrak API lambda to new RDS');
    forgeTrakRdsInstance.secret?.grantRead(forgeTrakApiLambda);

    const forgeTrakApiUrl = forgeTrakApiLambda.addFunctionUrl({
        authType: lambda.FunctionUrlAuthType.NONE,
    });

    const forgeTrakApiDomain = cdk.Fn.select(2, cdk.Fn.split('/', forgeTrakApiUrl.url));

    const forgeTrakDistribution = new cloudfront.Distribution(this, 'forgeTrakApiDistribution', {
        defaultBehavior: {
            origin: new origins.HttpOrigin(forgeTrakApiDomain, {
                protocolPolicy: cloudfront.OriginProtocolPolicy.HTTPS_ONLY,
            }),
            viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
            allowedMethods: cloudfront.AllowedMethods.ALLOW_ALL,
            cachePolicy: cloudfront.CachePolicy.CACHING_DISABLED,
            originRequestPolicy: cloudfront.OriginRequestPolicy.ALL_VIEWER_EXCEPT_HOST_HEADER,
        },
        domainNames: ['api.forgetrak.com'],
        certificate: forgeTrakCert,
    });

    new route53.ARecord(this, 'forgeTrakApiAlias', {
        zone: forgeTrakZone,
        recordName: 'api',
        target: route53.RecordTarget.fromAlias(
            new route53Targets.CloudFrontTarget(forgeTrakDistribution),
        ),
    });

    new CfnOutput(this, 'forgeTrakApiLambdaUrl', {
        value: forgeTrakApiUrl.url,
    });

    new CfnOutput(this, 'forgeTrakApiCustomDomain', {
        value: 'https://api.forgetrak.com',
    });

    const billingRunnerLambda = new lambda.Function(this, 'billingRunnerLambda', {
        runtime: lambda.Runtime.NODEJS_24_X,
        tracing: lambda.Tracing.ACTIVE,
        code: lambda.Code.fromAsset('../../../lambda/billing'),
        handler: 'billingRunner.handler',
        environment: {
            COGNITO_USERNAME: process.env.BILLING_COGNITO_USERNAME || '',
            COGNITO_PASSWORD: process.env.BILLING_COGNITO_PASSWORD || '',
            COGNITO_CLIENT_ID: process.env.COGNITO_CLIENT_ID || '',
            API_BASE_URL: process.env.BILLING_API_BASE_URL || '',
            FORGETRAK_ENVIRONMENT: forgetrakEnvironment,
        },
        timeout: Duration.minutes(10),
        functionName: `${forgetrakEnvironment}-billing-job`,
    });

    new events.Rule(this, 'billingRunnerSchedule', {
        schedule: events.Schedule.cron({ minute: '35', hour: '2' }),
        targets: [new targets.LambdaFunction(billingRunnerLambda)],
    });

    // The next last resource goes here (adding this so I don't forget in a year when I inevitably need to add more infra and forget about this comment)
  };
}
