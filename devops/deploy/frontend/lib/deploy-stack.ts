/* eslint-disable import/prefer-default-export */
import { App, CfnOutput, Duration, RemovalPolicy, Stack, StackProps } from 'aws-cdk-lib';
import { aws_s3 as s3 } from 'aws-cdk-lib';
import { aws_s3_deployment as s3Deployment } from 'aws-cdk-lib';
import { aws_certificatemanager as acm } from 'aws-cdk-lib';
import { aws_cloudfront as cloudfront } from 'aws-cdk-lib';
import { aws_cloudfront_origins as origins } from 'aws-cdk-lib';
import { aws_route53 as route53 } from 'aws-cdk-lib';

export class DeployStack extends Stack {
  constructor(scope: App, id: string, props?: StackProps) {
    super(scope, id, props);
    const environmentName = process.env.TRACKBOSS_ENVIRONMENT_NAME || 'trackboss';
    const domains = [`${environmentName}.hogbackmx.com`, 'app.forgetrak.com'];
    const bucketName = `${environmentName}-frontend-deploy-bucket`;
    const certArns = [
        'arn:aws:acm:us-east-1:425610073499:certificate/6bdd2367-df28-4226-866d-8d057ce0f496',
        'arn:aws:acm:us-east-1:425610073499:certificate/30c14c8a-e6fb-4bf7-b8ac-c933c89065ac'
    ];
    const zone = route53.HostedZone.fromHostedZoneAttributes(this, 'trackbossZone',
        {
            hostedZoneId: 'Z01677201PBLHEH8PE24N',
            zoneName: 'hogbackmx.com'
        },
    );

    const forgetrakZone = route53.HostedZone.fromHostedZoneAttributes(this, 'forgeTrakZone',
        {
            hostedZoneId: 'Z08084702HFW0EXZKUGNQ',
            zoneName: 'forgetrak.com'
        },
    );

    for (let index = 0; index < domains.length; index++) {
      let domain = domains[index];
      const deploymentBucket = new s3.Bucket(this, bucketName+domain, {
        bucketName: domain+'-frontend',
        // lifecycle rules are flippant, but this is ephemeral build stuff
        removalPolicy: RemovalPolicy.DESTROY,
        autoDeleteObjects: true,
        versioned: false,
        encryption: s3.BucketEncryption.S3_MANAGED,
        // it is a public website after all!
        blockPublicAccess: s3.BlockPublicAccess.BLOCK_ACLS_ONLY,
        publicReadAccess: true,
        websiteIndexDocument: 'index.html',
        websiteErrorDocument: 'error.html',
      });

      // eslint-disable-next-line no-unused-vars
      const deployment = new s3Deployment.BucketDeployment(this, 'deployStaticWebsite'+domain, {
        sources: [s3Deployment.Source.asset('../../../frontend/build')],
        destinationBucket: deploymentBucket,
      });

      const certificate = acm.Certificate.fromCertificateArn(
        this,
        'Certificate'+domain,
        // found using aws acm list-certificates --region us-east-1
        certArns[index],
      );

      const cachePolicy = new cloudfront.CachePolicy(this, 'cachePolicy'+domain, {
        cachePolicyName: `${environmentName}-frontEndCachePolicy`,
        comment: 'A default policy for a Track Boss environment',
        defaultTtl: Duration.minutes(10),
      });

      // eslint-disable-next-line no-unused-vars
      const distribution = new cloudfront.Distribution(this, 'applyToCdnDistribution'+domain, {
        defaultBehavior: {
          cachePolicy,
          origin: new origins.S3Origin(deploymentBucket),
          viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
        },
        domainNames: [domain],
        certificate: certificate,
      });
        if (index === 0) {
            const dnsARecord = new route53.ARecord(this, 'TrackBossApiAliasRecord', {
                zone,
                recordName: `${process.env.TRACKBOSS_ENVIRONMENT_NAME}.hogbackmx.com`,
                target: route53.RecordTarget.fromAlias({
                    bind() {
                        return {
                            dnsName: distribution.domainName,
                            hostedZoneId: 'Z2FDTNDATAQYW2',
                        }
                    }
                })
            });
        } else {
            const dnsARecordForgeTrak = new route53.ARecord(this, 'forgeTrakAppAliasRecord', {
                zone: forgetrakZone,
                recordName: `app.forgetrak.com`,
                target: route53.RecordTarget.fromAlias({
                    bind() {
                        return {
                            dnsName: distribution.domainName,
                            hostedZoneId: 'Z2FDTNDATAQYW2',
                        }
                    }
                })
            });
        }


      const cloudfrontOutput = new CfnOutput(this, 'bucketName', {
        value: distribution.domainName,
        description: 'Distribution domain name',
        exportName: `distributionDomainName-${process.env.TRACKBOSS_ENVIRONMENT_NAME}`,
      });
    }
  }
}
