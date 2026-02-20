export const handler = async (event) => {
  const rawTenantIds = event.request.userAttributes["custom:tenant_ids"];

  if (!rawTenantIds) return event;

  let tenantIds;

  try {
    tenantIds = JSON.parse(rawTenantIds);
  } catch {
    tenantIds = [rawTenantIds];
  }

  const activeTenant =
    event.request.clientMetadata?.active_tenant_id ||
    tenantIds[0];

  event.response = {
    claimsOverrideDetails: {
      claimsToAddOrOverride: {
        tenant_ids: JSON.stringify(tenantIds),
        active_tenant_id: activeTenant
      },
      accessTokenClaimsToAddOrOverride: {
        active_tenant_id: activeTenant
      }
    }
  };

  return event;
};
