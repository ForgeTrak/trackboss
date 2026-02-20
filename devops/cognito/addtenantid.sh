#!/bin/bash

POOL_ID=
TENANT_ID=

TENANT_JSON="[\\\"$TENANT_ID\\\"]"

for username in $(aws cognito-idp list-users \
  --user-pool-id "$POOL_ID" \
  --query "Users[].Username" \
  --output text); do

  echo "Updating $username"

aws cognito-idp admin-update-user-attributes \
  --user-pool-id "$POOL_ID" \
  --username "$username" \
  --user-attributes "[{\"Name\":\"custom:tenant_ids\",\"Value\":\"$TENANT_JSON\"}]"

done
