import {
    GetDefaultSettingsResponse,
    DefaultSetting,
} from '../../../src/typedefs/defaultSetting';
import { apiRequest, apiRequestNoAuth } from './utils';

export function getDefaultSettingsList(token: string): Promise<GetDefaultSettingsResponse> {
    return apiRequest(token, 'GET', '/api/defaultSettings');
}

export function getDefaultSettingsByName(token: string, name: string): Promise<DefaultSetting> {
    return apiRequest(token, 'GET', `/api/defaultSettings/${name}`);
}

export function getApplicationSetting(): Promise<DefaultSetting> {
    return apiRequestNoAuth('GET', '/api/defaultSettings/applications/enabled');
}

export function deleteDefaultSetting(token: string, id: number): Promise<any> {
    return apiRequest(token, 'DELETE', `/api/defaultSettings/${id}`);
}

// eslint-disable-next-line max-len
export function updateDefaultSetting(token: string, setting: DefaultSetting): Promise<GetDefaultSettingsResponse> {
    return apiRequest(token, 'PUT', `/api/defaultSettings/${setting.settingId}`, setting);
}

export function createDefaultSetting(token: string, setting: DefaultSetting): Promise<DefaultSetting> {
    return apiRequest(token, 'POST', '/api/defaultSettings', setting);
}
