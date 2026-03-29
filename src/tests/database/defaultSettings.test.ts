jest.mock('../../database/pool');
const { mockQuery } = require('../../database/pool') as { mockQuery: jest.Mock };

import {
    deleteDefaultSetting,
    getAllDefaultSettings,
    getDefaultSetting,
    getDefaultSettingValue,
    insertDefaultSetting,
    updateDefaultSetting,
} from '../../database/defaultSettings';

describe('database/defaultSettings', () => {
    beforeEach(() => mockQuery.mockReset());

    const dbRow = {
        default_setting_id: 1,
        default_setting_name: 'KEY',
        default_setting_value: 'val',
        default_setting_type: 't',
        default_setting_display_name: 'Label',
    };

    it('getDefaultSettingValue returns value', async () => {
        mockQuery.mockResolvedValueOnce([[dbRow]]);
        await expect(getDefaultSettingValue('KEY', 't1')).resolves.toBe('val');
    });

    it('getDefaultSetting maps row', async () => {
        mockQuery.mockResolvedValueOnce([[dbRow]]);
        const s = await getDefaultSetting('KEY', 't1');
        expect(s.settingName).toBe('KEY');
    });

    it('getAllDefaultSettings maps all', async () => {
        mockQuery.mockResolvedValueOnce([[dbRow]]);
        const all = await getAllDefaultSettings('t1');
        expect(all).toHaveLength(1);
    });

    it('deleteDefaultSetting throws not found when no rows', async () => {
        mockQuery.mockResolvedValueOnce([{ affectedRows: 0 } as any]);
        await expect(deleteDefaultSetting(1, 't1')).rejects.toThrow('not found');
    });

    it('insertDefaultSetting returns insertId', async () => {
        mockQuery.mockResolvedValueOnce([{ insertId: 44 } as any]);
        await expect(
            insertDefaultSetting(
                {
                    settingName: 'n',
                    settingValue: 'v',
                    settingType: 't',
                    settingDisplayName: 'd',
                } as any,
                't1',
            ),
        ).resolves.toBe(44);
    });

    it('insertDefaultSetting maps errno 1452 to user input error', async () => {
        mockQuery.mockRejectedValueOnce({ errno: 1452 });
        await expect(
            insertDefaultSetting(
                { settingName: 'n', settingValue: 'v', settingType: 't', settingDisplayName: 'd' } as any,
                't1',
            ),
        ).rejects.toThrow('user input error');
    });

    it('updateDefaultSetting throws not found when no rows updated', async () => {
        mockQuery.mockResolvedValueOnce([{ affectedRows: 0 } as any]);
        await expect(
            updateDefaultSetting(
                1,
                {
                    settingId: 1,
                    settingName: 'n',
                    settingValue: 'v',
                    settingType: 't',
                    settingDisplayName: 'd',
                } as any,
                't1',
            ),
        ).rejects.toThrow('not found');
    });

    it('updateDefaultSetting reloads row after success', async () => {
        mockQuery
            .mockResolvedValueOnce([{ affectedRows: 1 } as any])
            .mockResolvedValueOnce([[dbRow]]);
        const s = await updateDefaultSetting(
            1,
            {
                settingId: 1,
                settingName: 'KEY',
                settingValue: 'v2',
                settingType: 't',
                settingDisplayName: 'Label',
            } as any,
            't1',
        );
        expect(s.settingValue).toBe('val');
    });

    it('getDefaultSettingValue maps query failure to internal server error', async () => {
        mockQuery.mockRejectedValueOnce(new Error('timeout'));
        await expect(getDefaultSettingValue('KEY', 't1')).rejects.toThrow('internal server error');
    });

    it('getDefaultSetting maps query failure to internal server error', async () => {
        mockQuery.mockRejectedValueOnce(new Error('down'));
        await expect(getDefaultSetting('KEY', 't1')).rejects.toThrow('internal server error');
    });

    it('getAllDefaultSettings maps query failure to internal server error', async () => {
        mockQuery.mockRejectedValueOnce(new Error('bad'));
        await expect(getAllDefaultSettings('t1')).rejects.toThrow('internal server error');
    });

    it('deleteDefaultSetting succeeds when rows affected', async () => {
        mockQuery.mockResolvedValueOnce([{ affectedRows: 1 } as any]);
        await expect(deleteDefaultSetting(1, 't1')).resolves.toBeUndefined();
    });

    it('deleteDefaultSetting maps query failure to internal server error', async () => {
        mockQuery.mockRejectedValueOnce(new Error('timeout'));
        await expect(deleteDefaultSetting(1, 't1')).rejects.toThrow('internal server error');
    });

    it('insertDefaultSetting maps other errno to internal server error', async () => {
        mockQuery.mockRejectedValueOnce(Object.assign(new Error('db'), { errno: 5000 }));
        await expect(
            insertDefaultSetting(
                { settingName: 'n', settingValue: 'v', settingType: 't', settingDisplayName: 'd' } as any,
                't1',
            ),
        ).rejects.toThrow('internal server error');
    });

    it('insertDefaultSetting rethrows errors without errno', async () => {
        const err = new Error('weird');
        mockQuery.mockRejectedValueOnce(err);
        await expect(
            insertDefaultSetting(
                { settingName: 'n', settingValue: 'v', settingType: 't', settingDisplayName: 'd' } as any,
                't1',
            ),
        ).rejects.toBe(err);
    });

    it('updateDefaultSetting maps FK violations to user input error', async () => {
        mockQuery.mockRejectedValueOnce(Object.assign(new Error('fk'), { errno: 1451 }));
        await expect(
            updateDefaultSetting(
                1,
                {
                    settingId: 1,
                    settingName: 'n',
                    settingValue: 'v',
                    settingType: 't',
                    settingDisplayName: 'd',
                } as any,
                't1',
            ),
        ).rejects.toThrow('user input error');
    });

    it('updateDefaultSetting maps other errno to internal server error', async () => {
        mockQuery.mockRejectedValueOnce(Object.assign(new Error('db'), { errno: 9999 }));
        await expect(
            updateDefaultSetting(
                1,
                {
                    settingId: 1,
                    settingName: 'n',
                    settingValue: 'v',
                    settingType: 't',
                    settingDisplayName: 'd',
                } as any,
                't1',
            ),
        ).rejects.toThrow('internal server error');
    });

    it('updateDefaultSetting rethrows errors without errno', async () => {
        const err = new Error('weird');
        mockQuery.mockRejectedValueOnce(err);
        await expect(
            updateDefaultSetting(
                1,
                {
                    settingId: 1,
                    settingName: 'n',
                    settingValue: 'v',
                    settingType: 't',
                    settingDisplayName: 'd',
                } as any,
                't1',
            ),
        ).rejects.toBe(err);
    });
});
