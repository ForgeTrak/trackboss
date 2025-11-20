import React, { useEffect, useState, useContext } from 'react';
import { ChakraProvider, Center, SimpleGrid, VStack, useToast } from '@chakra-ui/react';
import theme from '../theme';
import Header from '../components/Header';
import WorkPointsCard from '../components/WorkPointsCard';
import ImportantLinksCard from '../components/cards/dashboard/ImportantLinksCard';
import EventCard from '../components/EventCard';
import { getEventCardProps } from '../controller/event';
import { getWorkPointsTotal } from '../controller/workPoints';
import { getBillsForMembership, getYearlyThresholdValue } from '../controller/billing';
import GreetingText from '../components/GreetingText';
import { getTodaysDate } from '../controller/utils';
import { getGateCodeLatest } from '../controller/gateCode';
import { GateCode } from '../../../src/typedefs/gateCode';
import TrackStatusCard from '../components/cards/dashboard/TrackStatusCard';
import { getRidingAreaStatuses, updateRidingAreaStatus } from '../controller/ridingAreaStatus';
import { RidingAreaStatus } from '../../../src/typedefs/ridingAreaStatus';
import { signupForOpenEventJob } from '../controller/job';
import { Link } from '../../../src/typedefs/link';
import { getLinks } from '../controller/links';
import { Bill } from '../../../src/typedefs/bill';
import { UserContext } from '../contexts/UserContext';

async function getEventCardPropsLocal(token: string): Promise<any | undefined> {
    const nowString = getTodaysDate();
    const props = await getEventCardProps(token, `${nowString}-`);
    return props;
}

async function getWorkPointsPercentage(token: string, membershipId: number) {
    const workPoints = await getWorkPointsTotal(token, membershipId);
    const threshold = await getYearlyThresholdValue(token);
    if (workPoints && threshold) {
        return Math.ceil((workPoints / threshold) * 100);
    }
    // else
    return 0;
}

function Dashboard() {
    const { state } = useContext(UserContext);
    const toast = useToast();
    const [eventCardProps, setEventCardProps] = useState<any>();
    const [percent, setPercent] = useState<number>(0);
    const [gateCode, setGateCode] = useState<string>('');
    const [ridingAreaStatuses, setRidingAreaStatuses] = useState<RidingAreaStatus[]>([]);
    // eslint-disable-next-line no-unused-vars
    const [dashboardLinks, setDashboardLinks] = useState<Link[]>([]);
    const [lastBill, setLastBill] = useState<Bill>();

    const allowsSignIn = (
        ((eventCardProps?.eventType === 'work day') || (eventCardProps?.eventType === 'meeting')) &&
        (state.user?.memberType === 'Admin')
    );

    async function loadTrackStatuses() {
        const statuses = await getRidingAreaStatuses(state.token);
        setRidingAreaStatuses(statuses);
    }

    async function loadLinks() {
        const links = await getLinks(state.token);
        setDashboardLinks(links as Link[]);
    }

    async function loadBills() {
        const bills = await getBillsForMembership(state.token, state.user?.membershipId || 0) as Bill[];
        const today = new Date();
        let billYear = today.getFullYear() - 1;
        const isAfterNovember = (today.getMonth() > 10);
        const isAfterBillingStart = (today.getMonth() === 10) && (today.getDate() >= 24);
        if (isAfterNovember || isAfterBillingStart) {
            billYear = today.getFullYear();
        }
        const displayBill = bills.filter((bill) => bill.year === billYear);
        setLastBill(displayBill[0]);
    }

    useEffect(() => {
        async function getData() {
            try {
                setEventCardProps(await getEventCardPropsLocal(state.token));
            } catch (error) {
                console.error(error);
            }
            if (state.user) {
                setPercent(await getWorkPointsPercentage(state.token, state.user.membershipId));
            }
            await loadTrackStatuses();
            await loadLinks();
            await loadBills();
        }
        getData();
    }, [state.user]);

    useEffect(() => {
        async function getData() {
            setEventCardProps(await getEventCardPropsLocal(state.token));
            if (state.user) {
                setPercent(await getWorkPointsPercentage(state.token, state.user.membershipId));
            }
            await loadTrackStatuses();
            await loadLinks();
            await loadBills();
        }
        getData();
    }, []);

    useEffect(() => {
        async function getData() {
            const latestGateCode = await getGateCodeLatest(state.token, state.user?.membershipId) as GateCode;
            setGateCode(latestGateCode.gateCode || latestGateCode.message || '');
        }
        getData();
    });

    async function updateArea(updatedArea: RidingAreaStatus) {
        await updateRidingAreaStatus(state.token, (updatedArea.id || 0), updatedArea);
        await loadTrackStatuses();
    }

    return (
        <ChakraProvider theme={theme}>
            <VStack align="left" spacing="2em">
                <Header title="Track Boss Dashboard" activeButtonId={1} />
                {
                    state.user && lastBill && (
                        <GreetingText
                            name={`${state.user.firstName} ${state.user.lastName}`}
                            billYear={lastBill?.year || (new Date()).getFullYear() - 1}
                            gateCode={gateCode}
                            lastBill={lastBill}
                        />
                    )
                }
                <Center>
                    <SimpleGrid columns={[1, null, 3]} spacing="20px">
                        <WorkPointsCard percent={percent} year={(new Date()).getFullYear()} />
                        {
                            eventCardProps ? (
                                <EventCard
                                    date={eventCardProps.start}
                                    startTime={eventCardProps.time}
                                    name={eventCardProps.title}
                                    endDate={eventCardProps.end}
                                    id={eventCardProps.id}
                                    allowsSignIn={allowsSignIn}
                                    description={eventCardProps.description}
                                    signupHandler={
                                        async () => {
                                            try {
                                                await signupForOpenEventJob(
                                                    state.token,
                                                    eventCardProps.id,
                                                    state.user?.memberId || 0,
                                                );
                                            } catch (error) {
                                                // eslint-disable-next-line no-console
                                                console.error(error);
                                            }
                                            toast({
                                                containerStyle: {
                                                    background: 'orange',
                                                },
                                                // eslint-disable-next-line max-len
                                                title: 'Signed in!',
                                                description: `You've been signed into ${eventCardProps.title}`,
                                                status: 'success',
                                                duration: 5000,
                                                isClosable: true,
                                            });
                                        }
                                    }
                                />
                            ) : (
                                <EventCard
                                    date=""
                                    startTime=""
                                    name=""
                                    endDate=""
                                    description=""
                                    id={0}
                                    signupHandler={() => false}
                                    allowsSignIn={false}
                                />
                            )
                        }
                        <ImportantLinksCard
                            dashboardLinks={dashboardLinks}
                            memberId={state.user?.memberId || 0}
                            jwt={state.token}
                        />
                    </SimpleGrid>
                </Center>
            </VStack>
            <Center>
                <TrackStatusCard
                    areaStatusList={ridingAreaStatuses}
                    isAdmin={state.user?.memberType === 'Admin'}
                    // eslint-disable-next-line react/jsx-no-bind
                    updateArea={updateArea}
                />
            </Center>
        </ChakraProvider>
    );
}

export default Dashboard;
