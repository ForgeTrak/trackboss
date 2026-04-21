#!/bin/bash
export PROJECT_ROOT=$1
if [ -z $1 ]; then
  echo "Please specify a project root."
  exit -1
fi;
cd $PROJECT_ROOT
gitCommitId=`git rev-parse --short HEAD`
backendChanges=`git status --porcelain src/`

imageName="forgetrak/forgetrakapi:latest"
imageNameCommit="forgetrak/forgetrak:$gitCommitId"
dockerRegistry="425610073499.dkr.ecr.us-east-1.amazonaws.com"
echo "Building docker image for $gitCommitId"
docker build --platform linux/amd64 -t $imageName .
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin $dockerRegistry
docker tag $imageName $dockerRegistry/$imageName
docker tag $imageName $dockerRegistry/$imageNameCommit
docker push $dockerRegistry/$imageName
docker push $dockerRegistry/$imageNameCommit

