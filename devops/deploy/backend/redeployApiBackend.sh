#!/bin/bash
aws lambda update-function-code \
    --function-name trackboss-backendhost-sta-forgeTrakApiLambdaAF7B02-jnarLYprPQq4 \
    --image-uri 425610073499.dkr.ecr.us-east-1.amazonaws.com/pra/trackbossapi:latest
