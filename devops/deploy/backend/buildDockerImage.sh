#!/bin/bash
set -euo pipefail
export PROJECT_ROOT=${1:-}
if [ -z "$PROJECT_ROOT" ]; then
  echo "Please specify a project root."
  exit 1
fi;
cd $PROJECT_ROOT
gitCommitId=`git rev-parse --short HEAD`

imageName="forgetrak/forgetrakapi:latest"
imageNameCommit="forgetrak/forgetrakapi:$gitCommitId"
dockerRegistry="425610073499.dkr.ecr.us-east-1.amazonaws.com"
builderName="forgetrak-builder"

aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin $dockerRegistry
docker buildx inspect $builderName >/dev/null 2>&1 || docker buildx create --name $builderName --driver docker-container

echo "Building docker image for $gitCommitId"
docker buildx build --builder $builderName \
  --platform linux/amd64 \
  --provenance=false --sbom=false \
  --output type=image,push=true,oci-mediatypes=false \
  -t $dockerRegistry/$imageName \
  -t $dockerRegistry/$imageNameCommit \
  .

manifestMediaType=`docker buildx imagetools inspect --raw $dockerRegistry/$imageName | jq -r '.mediaType'`
if [ "$manifestMediaType" != "application/vnd.docker.distribution.manifest.v2+json" ]; then
  echo "Unexpected manifest media type '$manifestMediaType' - Lambda requires a single Docker V2 Schema 2 manifest."
  exit 1
fi;
echo "Pushed $dockerRegistry/$imageName with manifest type $manifestMediaType"
