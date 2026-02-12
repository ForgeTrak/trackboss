/* eslint-disable react/jsx-curly-newline */
import React, { useEffect, useState } from 'react';
import {
    Accordion,
    AccordionButton,
    AccordionIcon,
    AccordionItem,
    AccordionPanel,
    Box, Button, ChakraProvider, Divider, Image, Input, Link, SimpleGrid, Stat,
    StatHelpText, StatLabel, StatNumber, Text, VStack,
} from '@chakra-ui/react';
import { BsTrash2, BsPersonPlus } from 'react-icons/bs';
import PhoneInput, { isValidPhoneNumber } from 'react-phone-number-input/input';
import 'react-phone-number-input/style.css';
import { isEmail } from 'validator';
import Autocomplete from 'react-google-autocomplete';
import DatePicker from 'react-date-picker';
import moment from 'moment';
import _ from 'lodash';

import theme from '../theme';
import { useAppDisclosure } from '../hooks/useAppDisclosure';
import { applicationExists } from '../controller/membershipApplication';
import { memberExistsByEmail } from '../controller/member';
import SimpleAlertModal from '../components/modals/SimpleAlertModal';
import { getApplicationSetting } from '../controller/defaultSettings';

function ApplicationForm() {
    const chakraStyleForNonChakra = {
        width: '70%',
        font: 'Russo One',
        padding: '12px 20px',
        margin: '8px 0;',
        display: 'inline-block',
        border: '1px solid #ccc',
        borderRadius: '0.375rem',
    };
    const [season, setSeason] = useState<number>();

    const [firstName, setFirstName] = useState<string>();
    const [lastName, setLastName] = useState<string>();
    const [address, setAddress] = useState<string>();
    const [zip, setZip] = useState<string>();
    const [city, setCity] = useState<string>();
    const [state, setState] = useState<string>();
    const [email, setEmail] = useState<string>('');
    const [phone, setPhone] = useState<string>();
    const [birthDate, setBirthDate] = useState<Date>();
    const [occupation, setOccupation] = useState<string>();
    const [referredBy, setReferredBy] = useState<string>();
    const [applicationJson, setApplicationJson] = useState<string>();
    const [fullName, setFullName] = useState<string>('');
    const [newFamilyFirst, setNewFamilyFirst] = useState<string>('');
    const [newFamilyLast, setNewFamilyLast] = useState<string>('');
    const [newFamilyDob, setNewFamilyDob] = useState<Date>();

    const [familyMembers, setFamilyMembers] = useState<any[]>([]);

    const [alertMsg, setAlertMsg] = useState<string>();
    const { isOpen, onOpen, onClose } = useAppDisclosure();
    const { isOpen: isConfirmOpen, onOpen: onConfirmOpen, onClose: onConfirmClose } = useAppDisclosure();
    const [isEnabled, setIsEnabled] = useState<boolean>();

    const eightteenYearsAgo = moment().subtract(18, 'years').toDate();

    async function getEnabledSetting() {
        const enabledSetting = await getApplicationSetting();
        setIsEnabled(enabledSetting.settingValue === 'true');
    }

    useEffect(() => {
        const date = new Date();
        const month = date.getMonth();
        if (month >= 6) {
            setSeason(date.getFullYear() + 1);
        } else {
            setSeason(date.getFullYear());
        }
        document.title = `PRA application - ${season} season`;
        getEnabledSetting();
    });

    let applicationForm = (
        <ChakraProvider theme={theme}>
            <Box
                mt={0}
                pt={0}
                ml={5}
                borderWidth="20 px"
                borderRadius="lg"
                width="75%"
                backgroundColor="white"
            >
                <SimpleGrid columns={2} maxWidth={800} m={5}>
                    <Box maxW={200}>
                        <Image width={200} height={90} src="logo192.png" />
                    </Box>
                    <Text fontSize="2xl">
                        {`Palmyra Racing Association Application - ${season} season`}
                    </Text>
                </SimpleGrid>
                <Box paddingBottom={2} m={5}>
                    <Text>
                        Applications for membership are open from September 1st - January 31st. Applications will be
                        reviewed in February, and you will be notified of acceptance via the email provided on the
                        application by the end of February. Please note that acceptance will be pending payment of
                        new membership dues, waiver of liability, minor waivers, and attestation of rules,
                        code of conduct, and possession of health insurance.
                    </Text>
                </Box>
                <Box paddingBottom={2} m={5}>
                    <Text>
                        Please complete all sections of the application. Those applying for family membership will be
                        required to submit names and dates of birth for all family members. The current year’s dues
                        are $575 and are subject to change for the following year.
                    </Text>
                </Box>
                <Box paddingBottom={5} m={5}>
                    <Text>
                        For ease of processing, we are only accepting applications online. If you need assistance with
                        completing or submitting an application, please contact the Secretary at &nbsp;
                        <Link href="mailto:hogbacksecretary@gmail.com">hogbacksecretary@gmail.com</Link>
                    </Text>
                </Box>
                <Box ml={5}>
                    <Text fontSize="lg">
                        Primary Member
                    </Text>
                </Box>
                <SimpleGrid columns={{ sm: 1, md: 2 }} m={5}>
                    <Box m={2}>
                        <Text>First Name*</Text>
                        <Input
                            isRequired
                            value={firstName}
                            onChange={
                                (e) => {
                                    let nameValue = e.target.value;
                                    if (nameValue) {
                                        nameValue = nameValue.replace(/\s/g, '');
                                        nameValue = _.capitalize(nameValue);
                                        if (nameValue && lastName) {
                                            setFullName(`${firstName} ${lastName}`);
                                        }
                                    }
                                    setFirstName(nameValue);
                                }
                            }
                        />
                    </Box>
                    <Box m={2}>
                        <Text>Last Name*</Text>
                        <Input
                            isRequired
                            value={lastName}
                            onChange={
                                (e) => {
                                    let lastNameValue = e.target.value;
                                    if (lastNameValue) {
                                        lastNameValue = lastNameValue.replace(/\s/g, '');
                                        lastNameValue = _.capitalize(lastNameValue);
                                        if (lastNameValue && firstName) {
                                            setFullName(`${firstName} ${lastNameValue}`);
                                        }
                                    }
                                    setLastName(lastNameValue);
                                }
                            }
                        />
                    </Box>
                </SimpleGrid>
                <SimpleGrid m={5}>
                    <Box m={2}>
                        <Text>Street Address*</Text>
                        <Text fontSize="xs">
                            Please type your address as it will auto complete. We just need a street address - apartment
                            or unit numbers not required.
                        </Text>
                        <Autocomplete
                            inputAutocompleteValue="address"
                            style={chakraStyleForNonChakra}
                            apiKey="AIzaSyA8N7kdBhP-1M3Y393FNDL71-nWanO9lBI"
                            options={
                                {
                                    types: ['address'],
                                    componentRestrictions: { country: 'us' },
                                }
                            }
                            onPlaceSelected={
                                (place: any) => {
                                    let mapsStreetAddress = '';
                                    let mapsZipCode = '';
                                    place.address_components.forEach((component: any) => {
                                        const attributeShort = component.short_name;
                                        const attributeLong = component.long_name;
                                        const attributeType = component.types[0];
                                        switch (attributeType) {
                                            case 'street_number':
                                                mapsStreetAddress = attributeShort;
                                                break;
                                            case 'route':
                                                mapsStreetAddress = `${mapsStreetAddress} ${attributeLong}`;
                                                break;
                                            case 'locality':
                                                setCity(attributeShort);
                                                break;
                                            case 'administrative_area_level_1':
                                                setState(attributeShort);
                                                break;
                                            case 'postal_code':
                                                mapsZipCode = attributeShort;
                                                break;
                                            case 'postal_code_suffix':
                                                mapsZipCode = `${mapsZipCode}-${attributeShort}`;
                                                break;
                                            default:
                                                break;
                                        }
                                    });
                                    setAddress(mapsStreetAddress);
                                    setZip(mapsZipCode);
                                }
                            }
                        />
                    </Box>
                </SimpleGrid>
                <SimpleGrid columns={{ sm: 1, md: 2 }} m={5}>
                    <Box m={2}>
                        <Text>Phone*</Text>
                        <Text fontSize="xs">You can just type the numbers - we handle all the rest!</Text>
                        <PhoneInput
                            autocomplete="new-password"
                            style={chakraStyleForNonChakra}
                            defaultCountry="US"
                            value={phone}
                            onChange={setPhone}
                        />
                    </Box>
                    <Box m={2}>
                        <Text>eMail*</Text>
                        <Text fontSize="xs">This is used for all communications regarding your application.</Text>
                        <Input
                            onChange={
                                async (e) => {
                                    let emailValue = e.target.value;
                                    emailValue = emailValue.replace(/\s/gi, '');
                                    e.target.value = emailValue;
                                    setEmail(emailValue);
                                    if (isEmail(emailValue)) {
                                        const appExists = await applicationExists(emailValue);
                                        if (appExists.exists) {
                                            setAlertMsg(
                                                `We have an existing application for ${emailValue}.  Your
                                                information is stored; for further info please contact us!`,
                                            );
                                            setEmail('');
                                            e.target.value = '';
                                            onOpen();
                                        }
                                        const memberExists = await memberExistsByEmail(emailValue);
                                        if (memberExists.exists && emailValue) {
                                            setAlertMsg(
                                                `We have an existing membership for ${emailValue}.  There is
                                                no need to re-apply; you can renew annually using Trackboss.`,
                                            );
                                            setEmail('');
                                            e.target.value = '';
                                            onOpen();
                                        }
                                    }
                                }
                            }
                        />
                    </Box>
                </SimpleGrid>
                <SimpleGrid columns={{ sm: 1, md: 3 }} m={5}>
                    <Box m={2}>
                        <Text>Date of Birth*</Text>
                        <Text fontSize="xs">Primary members MUST be over 18.</Text>
                        <DatePicker
                            defaultActiveStartDate={eightteenYearsAgo}
                            value={birthDate}
                            required
                            minDate={moment().subtract(85, 'years').toDate()}
                            maxDate={eightteenYearsAgo}
                            onChange={
                                (e: any) => {
                                    setBirthDate(e);
                                }
                            }
                        />
                    </Box>
                    <Box m={2}>
                        <Text>Occupation</Text>
                        <Text fontSize="xs">Knowing what you do you can help us help you.</Text>
                        <Input
                            value={occupation}
                            onChange={
                                (e) => {
                                    setOccupation(_.startCase(e.target.value));
                                }
                            }
                        />
                    </Box>
                    <Box m={2}>
                        <Text>Referred By</Text>
                        <Text fontSize="xs">This can be an existing, or former member of PRA.</Text>
                        <Input
                            value={referredBy}
                            onChange={
                                (e) => {
                                    setReferredBy(e.target.value);
                                }
                            }
                        />
                    </Box>
                </SimpleGrid>
                <Accordion defaultIndex={0}>
                    <AccordionItem>
                        <AccordionButton>
                            Family members (Anyone besides the person filling out this application goes here)
                            <AccordionIcon />
                        </AccordionButton>
                        <AccordionPanel>
                            <VStack>
                                <SimpleGrid columns={{ sm: 2, md: 4 }} spacing={4} mb={2} width="100%">
                                    <Input
                                        placeholder="First Name"
                                        value={newFamilyFirst}
                                        onChange={
                                            (e) => {
                                                let nameValue = e.target.value;
                                                nameValue = nameValue.replace(/\s/g, '');
                                                nameValue = _.capitalize(nameValue);
                                                e.target.value = nameValue;
                                                setNewFamilyFirst(e.target.value);
                                            }
                                        }
                                    />
                                    <Input
                                        placeholder="Last Name"
                                        value={newFamilyLast}
                                        onChange={
                                            (e) => {
                                                let nameValue = e.target.value;
                                                nameValue = nameValue.replace(/\s/g, '');
                                                nameValue = _.capitalize(nameValue);
                                                e.target.value = nameValue;
                                                setNewFamilyLast(e.target.value);
                                            }
                                        }
                                    />
                                    <DatePicker
                                        required
                                        minDate={moment().subtract(85, 'years').toDate()}
                                        maxDate={new Date()}
                                        value={newFamilyDob}
                                        defaultValue="hi"
                                        disableCalendar
                                        onChange={
                                            (e: any) => {
                                                setNewFamilyDob(e);
                                            }
                                        }
                                    />
                                    <Button
                                        backgroundColor="orange.300"
                                        color="white"
                                        leftIcon={<BsPersonPlus />}
                                        width={50}
                                        isDisabled={!newFamilyFirst || !newFamilyLast || !newFamilyDob}
                                        onClick={
                                            () => {
                                                setFamilyMembers(
                                                    [
                                                        ...familyMembers,
                                                        {
                                                            id: _.uniqueId(),
                                                            firstName: newFamilyFirst,
                                                            lastName: newFamilyLast,
                                                            dob: newFamilyDob,
                                                        },
                                                    ],
                                                );
                                                setNewFamilyFirst('');
                                                setNewFamilyLast('');
                                                setNewFamilyDob(undefined);
                                            }
                                        }
                                    />
                                </SimpleGrid>
                                <Box>
                                    <SimpleGrid columns={{ sm: 4, md: 6 }} spacing={4} mt={2} mb={2}>
                                        {
                                            familyMembers.map((familyMember, index) => (
                                                <>
                                                    <Stat>
                                                        <StatLabel>
                                                            {`Family member ${index + 1}`}
                                                        </StatLabel>
                                                        <StatNumber>
                                                            {`${familyMember.firstName} ${familyMember.lastName}`}
                                                        </StatNumber>
                                                        <StatHelpText>
                                                            {
                                                                // eslint-disable-next-line max-len
                                                                `${moment(new Date()).diff(familyMember.dob, 'years')} years old`
                                                            }
                                                        </StatHelpText>
                                                    </Stat>
                                                    <Button
                                                        backgroundColor="red"
                                                        color="white"
                                                        width={55}
                                                        height={25}
                                                        leftIcon={<BsTrash2 />}
                                                        onClick={
                                                            () => {
                                                                setFamilyMembers(
                                                                    // eslint-disable-next-line max-len
                                                                    familyMembers.filter((a) => a.id !== familyMember.id),
                                                                );
                                                            }
                                                        }
                                                    />
                                                </>
                                            ))
                                        }
                                    </SimpleGrid>

                                    <Text fontSize="xs">
                                        Family members consist of anyone in a household who is either a child, spouse
                                        or domestic partner. Please note: children aged 18 and up must be in the same
                                        household, and either a student, active miltary, or disabled adult to be on a
                                        family membership. Any children outside of these categories should apply for
                                        their own membership, even if they still reside at your address.  Attestation
                                        of insurance is required for all family members if your application is accepted.
                                    </Text>
                                </Box>
                            </VStack>
                        </AccordionPanel>
                    </AccordionItem>
                </Accordion>
                <SimpleGrid m={7}>
                    <Box maxWidth="50%">
                        <Text>Signature</Text>
                        <Text fontSize="2xl" as="em">{`${fullName}`}</Text>
                        <Divider />
                        <Text fontSize="xs">
                            By signing in this field you agree to have your application reviewed by the PRA board
                            (including background searches) as well as to recieve communications via email and
                            text message about your application.
                        </Text>
                    </Box>
                </SimpleGrid>
                <Button
                    backgroundColor="orange.300"
                    color="white"
                    isLoading={
                        !_.every([firstName, lastName, address, zip, city,
                            state, isEmail(email), isValidPhoneNumber(phone || ''), birthDate])
                    }
                    loadingText="Please complete all fields"
                    onClick={
                        () => {
                            const application = {
                                firstName,
                                lastName,
                                address,
                                city,
                                state,
                                zip,
                                email,
                                phone,
                                birthDate,
                                occupation,
                                referredBy,
                                familyMembers,
                            };
                            setApplicationJson(JSON.stringify(application));

                            fetch(`${process.env.REACT_APP_API_URL}/api/membershipApplication`, {
                                method: 'POST',
                                mode: 'cors',
                                headers: {
                                    'Content-Type': 'application/json',
                                    'Access-Control-Allow-Origin': '*',
                                    'Access-Control-Allow-Methods': 'POST,PATCH,OPTIONS',
                                    'Access-Control-Allow-Private-Network': 'true',
                                },
                                body: JSON.stringify(application),
                            });

                            setEmail('');
                            onConfirmOpen();
                        }
                    }
                    m={5}
                >
                    Submit
                </Button>
            </Box>
            <SimpleAlertModal
                title="Existing PRA member or applicant"
                message={alertMsg}
                isOpen={isOpen}
                onClose={onClose}
            />
            <SimpleAlertModal
                title="Application submitted"
                message={
                    `Your application has been submitted and we've sent a confirmation email. Redirecting back to our
                    main website now.${applicationJson}.`
                }
                isOpen={isConfirmOpen}
                onClose={
                    () => {
                        onConfirmClose();
                        window.location.href = 'https://palmyramx.com';
                    }
                }
            />
        </ChakraProvider>
    );
    if (!isEnabled) {
        applicationForm = (
            <Box>
                <SimpleGrid columns={2} maxWidth={800} m={5}>
                    <Box maxW={200}>
                        <Image width={200} height={90} src="logo192.png" />
                    </Box>
                    <Text fontSize="2xl">
                        {`Palmyra Racing Association Application - ${season} season`}
                    </Text>
                </SimpleGrid>
                <Box>
                    Thanks for your interest.  Applications are currently closed.  They are typically open
                    from September 1 to January 31.
                </Box>
            </Box>
        );
    }
    return applicationForm;
}

export default ApplicationForm;
