import { apiRequestNoAuth } from './utils';
import { Tenant } from '../../../src/typedefs/tenant';

export default function getTenantBySlug(slug: string): Promise<Tenant> {
    return apiRequestNoAuth('GET', `/api/tenant/slug/${slug}`);
}
