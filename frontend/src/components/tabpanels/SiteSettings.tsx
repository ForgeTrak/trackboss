import React, { useContext, useEffect, useState } from 'react';
import { Box, Text, Input, Link, SimpleGrid } from '@chakra-ui/react';
import { useAppToast } from '../../hooks/useAppToast';
import { UserContext } from '../../contexts/UserContext';
import { DefaultSetting } from '../../../../src/typedefs/defaultSetting';
import { getDefaultSettingsList, updateDefaultSetting } from '../../controller/defaultSettings';
import WrappedSwitchInput from '../input/WrappedSwitchInput';

function SiteSettings() {
    const { state } = useContext(UserContext);
    const [defaultSettings, setDefaultSettings] = useState<DefaultSetting[]>();

    const toast = useAppToast();

    async function getSettingsData() {
        let allSettings : DefaultSetting[] = [];
        try {
            allSettings = await getDefaultSettingsList(state.token) as DefaultSetting[];
        } catch (error) {
            // console.log(error);
        }
        setDefaultSettings(allSettings);
    }

    useEffect(() => {
        getSettingsData();
    }, []);

    function invertBooleanString(str:string) {
        let flipped = '';
        if (str === 'true') {
            flipped = 'false';
        }
        if (str === 'false') {
            flipped = 'true';
        }
        return flipped;
    }

    return (
        <Box>
            <SimpleGrid columns={2} gap={5} maxWidth={700}>
                {
                    // eslint-disable-next-line arrow-body-style
                    defaultSettings?.map((setting) => {
                        let settingInput;
                        if (setting.settingType === 'boolean') {
                            const newValue = invertBooleanString(setting.settingValue);
                            settingInput = (
                                <WrappedSwitchInput
                                    maxWidth={150}
                                    defaultChecked={setting.settingValue === 'true'}
                                    wrapperText={setting.settingDisplayName}
                                    toastMessage={`Flipped setting ${setting.settingDisplayName}`}
                                    onSwitchChange={
                                        async () => {
                                            const updatedSetting = {
                                                settingId: setting.settingId,
                                                settingName: setting.settingName,
                                                settingType: setting.settingType,
                                                settingValue: newValue,
                                                settingDisplayName: setting.settingDisplayName,
                                            };
                                            await updateDefaultSetting(state.token, updatedSetting);
                                        }
                                    }
                                />
                            );
                        } else if (setting.settingType === 'string') {
                            settingInput = (
                                <Box maxWidth={250}>
                                    <Text size="sm">{setting.settingDisplayName}</Text>
                                    <Input
                                        variant="outline"
                                        colorPalette="orange"
                                        placeholder={setting.settingValue}
                                        onChange={
                                            async (e) => {
                                                const updatedSetting = {
                                                    settingId: setting.settingId,
                                                    settingName: setting.settingName,
                                                    settingType: setting.settingType,
                                                    settingValue: e.target.value,
                                                    settingDisplayName: setting.settingDisplayName,
                                                };
                                                await updateDefaultSetting(state.token, updatedSetting);
                                                toast.success({
                                                    // eslint-disable-next-line max-len
                                                    description: `${setting.settingDisplayName} set to ${e.target.value}`,
                                                    duration: 2000,
                                                });
                                            }
                                        }
                                    />
                                </Box>
                            );
                        }
                        return settingInput;
                    })
                }
            </SimpleGrid>
            {
                (state.user?.memberType === 'Admin') && (
                    <Link
                        href={`${import.meta.env.VITE_API_URL}/api/defaultSettings/admin/dataBackup?id=${state.token}`}
                        mt={4}
                    >
                        Download all data as mysql compatible restore file
                    </Link>
                )
            }
        </Box>
    );
}
export default SiteSettings;
