#!/bin/bash
aws lambda update-function-code \
    --function-name forgetrak-prod-api-backend \
    --image-uri 425610073499.dkr.ecr.us-east-1.amazonaws.com/forgetrak/forgetrakapi:latest
