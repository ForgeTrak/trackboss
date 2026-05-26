import React, { useEffect, useState, useContext } from 'react';
import { Center, SimpleGrid, VStack } from '@chakra-ui/react';
import moment from 'moment';
import { useAppToast } from '../hooks/useAppToast';
import Header from '../components/Header';
import WorkPointsCard from '../components/WorkPointsCard';
import ImportantLinksCard from '../components/cards/dashboard/ImportantLinksCard';
import EventCard from '../components/EventCard';
import GreetingText from '../components/GreetingText';
import { getEventMonthDay, getTimeOfDay } from '../controller/utils';
import TrackStatusCard from '../components/cards/dashboard/TrackStatusCard';
import { updateRidingAreaStatus, getRidingAreaStatuses } from '../controller/ridingAreaStatus';
import { RidingAreaStatus } from '../../../src/typedefs/ridingAreaStatus';
import { signupForOpenEventJob } from '../controller/job';
import { Link } from '../../../src/typedefs/link';
import { Bill } from '../../../src/typedefs/bill';
import { UserContext } from '../contexts/UserContext';
import getDashboardData from '../controller/dashboard';

function Dashboard() {
    const { state } = useContext(UserContext);
    const toast = useAppToast();
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

    useEffect(() => {
        async function getData() {
            if (!state.user) return;
            const data = await getDashboardData(state.token, state.user.membershipId);

            // Event card props
            if (data.eventList && data.eventList.length > 0) {
                const event = data.eventList[0];
                const startTime = event.start.toString();
                setEventCardProps({
                    title: event.title,
                    start: getEventMonthDay(startTime),
                    end: getEventMonthDay(event.end.toString()),
                    time: getTimeOfDay(startTime),
                    fullDate: moment(event.start).format('MM-DD-YYYY'),
                    id: event.eventId,
                    eventType: event.eventType.toLowerCase(),
                    description: event.eventDescription,
                });
            }

            // Work points percentage
            const workPoints = data.workPoints?.total || 0;
            const threshold = data.threshold?.threshold || 0;
            if (threshold > 0) {
                setPercent(Math.ceil((workPoints / threshold) * 100));
            }

            // Riding area statuses
            setRidingAreaStatuses(data.ridingAreaStatuses || []);

            // Links
            setDashboardLinks(data.links || []);

            // Bills
            const bills = (data.bills || []) as Bill[];
            const today = new Date();
            let billYear = today.getFullYear() - 1;
            const isAfterNovember = (today.getMonth() > 10);
            const isAfterBillingStart = (today.getMonth() === 10) && (today.getDate() >= 24);
            if (isAfterNovember || isAfterBillingStart) {
                billYear = today.getFullYear();
            }
            const displayBill = bills.filter((bill) => bill.year === billYear);
            setLastBill(displayBill[0]);

            // Gate code
            setGateCode(data.gateCode?.gateCode || data.gateCode?.message || '');
        }
        getData();
    }, [state.user]);

    async function updateArea(updatedArea: RidingAreaStatus) {
        await updateRidingAreaStatus(state.token, (updatedArea.id || 0), updatedArea);
        await loadTrackStatuses();
    }

    return (
        <VStack align="left" gap="2em">
            <Header title="Dashboard" activeButtonId={1} />
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
                <SimpleGrid columns={[1, null, 3]} gap="20px">
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
                                        toast.success({
                                            title: 'Signed in!',
                                            description: `You've been signed into ${eventCardProps.title}`,
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
                    />
                </SimpleGrid>
            </Center>
            <TrackStatusCard
                areaStatusList={ridingAreaStatuses}
                isAdmin={state.user?.memberType === 'Admin'}
                // eslint-disable-next-line react/jsx-no-bind
                updateArea={updateArea}
            />
        </VStack>
    );
}

export default Dashboard;
