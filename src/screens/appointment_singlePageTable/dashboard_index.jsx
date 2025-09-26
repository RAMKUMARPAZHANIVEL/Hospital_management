

import React, { useState, useEffect } from "react";
import Container from "components/container";
import { Box, Grid, Stack, Typography } from '@mui/material';
import { CounterContainer } from "components";
import Helper from "shared/helper";
import * as Api from "shared/services";
import { Appointments, Payments } from "./childs";
import moment from "moment";
import dayjs from "dayjs";
import Session from "shared/session";

const GreetingHeader = (props) => {
    const { title } = props;

    const now = dayjs();
    const hour = now.hour();
    let greeting = "Good Morning!";
    if (hour >= 12 && hour < 17) {
        greeting = "Good Afternoon!";
    } else if (hour >= 17) {
        greeting = "Good Evening!";
    }

    const formattedDate = now.format("dddd, Do MMMM"); // Thursday, 11th June
    const formattedTime = now.format("h:mm a"); // 2:07 pm

    return (
        <Stack
            direction="row"
            sx={{
                width: "100%",
                justifyContent: "space-between",
                alignItems: "center",
                my: "32px",
            }}
            >
            <Box>
                <Typography
                    noWrap
                    variant="h6"
                    component="div"
                    sx={{ fontWeight: "bold" }}
                >
                   {title}
                </Typography>
                <Typography
                    noWrap
                    variant="h4"
                    component="div"
                    sx={{ fontWeight: 600, color: "primary.main" }}
                >
                   {greeting}
                </Typography>
            </Box>

            <Box>
                <Typography
                    noWrap
                    variant="h6"
                    component="div"
                    sx={{ fontWeight: "bold" }}
                >
                   {formattedDate}
                </Typography>
                <Typography
                    noWrap
                    variant="h4"
                    component="div"
                    sx={{ fontWeight: 600, color: "primary.main" }}
                >
                    {formattedTime}
                </Typography>
            </Box>
        </Stack>
    );
};

const defaultFilter = "";

const Component = (props) => {

    const [initialize, setInitialize] = useState(false);
    const [selectedItem, setSelectedItem] = useState(0);
    const [counts, setCounts] = useState({
        todaysCount: 0, todaysGrowth: 0,
        upcomingCount: 0, upcomingGrowth: 0,
        pastCount: 0, pastGrowth: 0,
        paymentsCount: 0, paymentsGrowth: 0,
    });
    const [title, setTitle] = useState('');
    const [state, setState] = useState(false);

    const fetchDoctor = async () => {
        return new Promise(async (resolve) => {
            global.Busy(true);
            let query = null, Id;

            const username = Session.Retrieve("Username");
            query = `$filter=UserKey eq '${username}'`

            await Api.GetDoctorsMulti(query)
                .then(async (res) => {
                    if(res.status) {
                        const { DoctorId, FullName } = res.values?.at(0);
                        setTitle(FullName);
                        Session.Store("Id", DoctorId);
                        Id = DoctorId;
                    }
                });
                resolve(Id);
            });
    }

    const GetDayPercentage = (list, field, type) => {
        const prevDate = Helper.AlterDate(null, type, -1);
        const curDate = Helper.AlterDate(null, 't');
        const getDateList = list.filter((x) => !Helper.IsNullValue(x[field]));
        const prevDayCount = getDateList.filter((x) => Helper.IsDateEqual(x[field], prevDate)).length;
        const curDayCount = getDateList.filter((x) => Helper.IsDateEqual(x[field], curDate)).length;
        if (parseInt(curDayCount) === 0 || parseInt(prevDayCount) === 0) return 0;
        const diffCount = parseInt(curDayCount) - parseInt(prevDayCount);
        return (parseInt(diffCount) / parseInt(prevDayCount)) * 100;
    }

    const GetCounts = (list) => {
        const today = moment().startOf("day");
        const curMonth = today.month();
        const prevMonth = today.clone().subtract(1, "month").month();
        const cutoffDay = today.date();

        const getDateList = list.filter((x) => !Helper.IsNullValue(x.Date));

        // 1. Today's appointments
        const todaysList = getDateList.filter((x) =>
            Helper.IsDateEqual(x.Date, today)
        );

        // 2. Appointments growth vs yesterday
        const todaysGrowth = GetDayPercentage(list, "Date", "d");

        // 3. Upcoming appointments
        const upcomingList = getDateList.filter((x) =>
            moment(x.Date).isAfter(today, "day")
        );
        const upcomingCount = upcomingList.length;

        // 4. Upcoming growth (days until last appointment date)
        const lastUpcoming = upcomingList.length
            ? moment.max(upcomingList.map(a => moment(a.Date)))
            : null;
        const upcomingGrowth = lastUpcoming
            ? lastUpcoming.diff(today, "days")
            : 0;

        // 5. Past count (this month before today)
        const pastList = getDateList.filter((x) =>
            moment(x.Date).isBefore(today, "day") &&
            moment(x.Date).month() === curMonth
        );

        // 6. Past growth (this month till today vs previous month till same date)
        const currentMonthTillToday = getDateList.filter((x) => {
            const d = moment(x.Date);
            return (
                d.month() === curMonth &&
                d.date() <= cutoffDay
            );
        }).length;

        const prevMonthTillToday = getDateList.filter((x) => {
            const d = moment(x.Date);
            return (
                d.month() === prevMonth &&
                d.date() <= cutoffDay
            );
        }).length;

        const pastGrowth = currentMonthTillToday - prevMonthTillToday;
  
        return {
            todaysCount: todaysList.length,
            todaysGrowth,
            upcomingCount,
            upcomingGrowth,
            pastCount : pastList.length,
            pastGrowth : `${pastGrowth}%`,
        };
    };

    const GetChildCount = (list) => {
        const today = moment();
        const curMonth = today.month();
        const prevMonth = today.clone().subtract(1, "month").month();

        // Filter valid payment records
        const validList = list.filter(x => 
            !Helper.IsNullValue(x['Date']) && 
            !Helper.IsNullValue(x['Amount'])
        );

        // Sum helper
        const sumByMonth = (month) => {
            return validList
                .filter(x => moment(x['Date']).month() === month)
                .reduce((sum, x) => sum + parseFloat(x['Amount'] || 0), 0);
        };

        const curMonthTotal = sumByMonth(curMonth);
        const prevMonthTotal = sumByMonth(prevMonth);

        // Percentage change (avoid divide-by-zero)
        const percentageChange =
            prevMonthTotal === 0
                ? 0
                : ((curMonthTotal - prevMonthTotal) / prevMonthTotal) * 100;

        return {
            paymentsCount: curMonthTotal,
            paymentsGrowth: `${percentageChange}%`
        };
    };

    const FetchUserResults = async () => {
        global.Busy(true);
        let query = null;

        const Id = Session.Retrieve("Id");
        query = `$filter=AppointmentConsultedDoctor eq ${parseInt(Id)}`;

        let rslt = await Api.GetAppointmentsMulti(query);
        global.Busy(false);
        if (rslt.status) {
            let appointmentsList = rslt.values || [];
            const counts = GetCounts(appointmentsList);
            setCounts(prev => ({ ...prev, ...counts }));
        } else {
            console.log(rslt.statusText);
        }

        setState(!state);
    }

    const FetchChildResults = async () => {
        global.Busy(true);
        let rslt = await Api.GetPaymentsMulti();
        global.Busy(false);

        if (rslt.status) {
            let childsList = rslt.values || [];
            childsList.forEach(x => x.id = x.PaymentId);

            // Alter data until have actual data. 
            childsList.forEach((x, index) => x.Date = (index % 3) === 0 ? Helper.AlterDate(null, 'd', -1) : Helper.AlterDate(null, 'd', -index));
            // let paymentsList = childsList.filter(x => !Helper.IsArrayNull(x));

            const childCount = GetChildCount(childsList);
            setCounts(prev => ({ ...prev, ...childCount }));

        } else {
            console.log(rslt.statusText);
        }
        setState(!state);
    }

    const FetchResults = async () => {
        const Id = await fetchDoctor();
        await FetchUserResults(Id);
        await FetchChildResults();
    }

    if (initialize) { setInitialize(false); setSelectedItem(1); }
    useEffect(() => { setInitialize(true); }, []);
    useEffect(() => { FetchResults(); }, [selectedItem]);

    return (

        <>
            <Container {...props}>
                <GreetingHeader title={title} />    
            
                <Grid container rowGap={6}>
                    <Stack direction={"row"} columnGap={3}>
                        <CounterContainer id={1} selected={selectedItem} title="Appointments Today" count={counts.todaysCount} onItemSeleted={(e) => setSelectedItem(e)}
                           trendingValue={counts.todaysGrowth} trendingUpLabel={"more than yesterday"} trendingDownLabel={"less than yesterday"} Icon="PersonIcon" />
                        <CounterContainer id={2} selected={selectedItem} title="Upcoming Appointments" count={counts.upcomingCount} onItemSeleted={(e) => setSelectedItem(e)}
                            trendingValue={counts.upcomingGrowth} trendingUpLabel={"days remaining"} trendingDownLabel={"no days remaining"}  Icon="TimeIcon" />
                        <CounterContainer id={3} selected={selectedItem} title="Appointments This Month" count={counts.pastCount} onItemSeleted={(e) => setSelectedItem(e)}
                            trendingValue={counts.pastGrowth} trendingUpLabel={"from past month"} trendingDownLabel={"from past month"} Icon="LocationIcon" />
                        <CounterContainer id={4} selected={selectedItem} title="Revenue This Month" count={counts.paymentsCount} onItemSeleted={(e) => setSelectedItem(e)}
                            trendingValue={counts.paymentsGrowth} trendingUpLabel={"from past month"} trendingDownLabel={"from past month"} Icon="TradingIcon" />
                    </Stack>
                    {selectedItem === 1 ? <Appointments title="Appointments Today" selectedItem={selectedItem} /> : null}
                    {selectedItem === 2 ? <Appointments title="Upcoming Appointments" selectedItem={selectedItem} /> : null}
                    {selectedItem === 3 ? <Appointments title="Appointments This Month" selectedItem={selectedItem} /> : null}
                    {selectedItem === 4 ? <Payments title={"Revenue This Month"} /> : null}
                </Grid>
            </Container>
        </>

    );

};

export default Component;