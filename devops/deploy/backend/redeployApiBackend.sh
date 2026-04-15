#!/bin/bash
if [ -z $1 ]; then
  echo "Please specify an environment name."
  exit -1
fi;
if [ -z $2 ]; then
  echo "Please specify a project root."
  exit -1
fi;

apprunner_arn=`aws apprunner list-services | jq -c '.ServiceSummaryList[] | select( .ServiceName | contains("trackbossapirunner"))' | jq -r .ServiceArn`
aws apprunner start-deployment --service-arn $apprunner_arn

aws lambda update-function-code \
    --function-name trackboss-backendhost-sta-forgeTrakApiLambdaAF7B02-jnarLYprPQq4 \
    --image-uri 425610073499.dkr.ecr.us-east-1.amazonaws.com/pra/trackbossapi:latest
