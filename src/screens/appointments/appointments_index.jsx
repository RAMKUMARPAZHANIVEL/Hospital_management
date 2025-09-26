import React, { useState, useEffect } from "react";
import { Typography, Grid, Stack, Box, Divider, IconButton, useTheme, Button, Tabs, Tab, styled } from '@mui/material';
import { Container, Pagination } from "components";
import { SearchInput, CustomDialog, TextInput } from "components";
import { GetAppointmentsMulti, GetAppointmentsCount, SetAppointmentSingle } from "shared/services";
import Helper from "shared/helper";
import { DataTable } from '../childs';
import dayjs, { Dayjs } from "dayjs";
import { DatePicker, LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { useNavigate } from "react-router-dom";
import Session from "shared/session";
import * as Api from "shared/services";
import isSameOrAfter from 'dayjs/plugin/isSameOrAfter';
import InfoCard from "./childs/info_card";

dayjs.extend(isSameOrAfter);

const tableActions = [{ name: "View Details", type: "view" }];

const StyledTab = styled((props) => <Tab disableRipple {...props} />)(
  ({ theme }) => ({
    textTransform: 'none',
    fontWeight: theme.typography.fontWeightRegular,
    fontSize: theme.typography.pxToRem(15),
    marginRight: theme.spacing(1),
    color: 'rgba(0, 0, 0, 0.7)',
    '&.Mui-selected': {
      color: 'rgba(98, 77, 227, 1)',
      fontWeight: '700'
    },
    '&.Mui-focusVisible': {
      backgroundColor: 'rgba(100, 95, 228, 0.32)',
    },
  }),
);


const RenderNextAppointment = () => {
    const [row, setRow] = useState({});
    const [initialize, setInitialize] = useState(false);
    const NavigateTo = useNavigate();

    const getLatestAppointment = (slots) => {
       const now = dayjs();

       return slots
        .filter(slot => {
            const slotTime = dayjs(`${slot.Date}T${slot.StartTime}`);
            return slot.Status === 'Pending' && slotTime.isSameOrAfter(now);
        })
        .sort((a, b) =>
            dayjs(`${b.Date}T${b.StartTime}`).diff(dayjs(`${a.Date}T${a.StartTime}`))
        )[0];
    };

    const fetchData = async () => {
        return new Promise(async (resolve) => {
            let query = null, filters = [];
            setRow({});

            const DoctorId = Session.Retrieve("Id");
            const defaultFilter = `$filter=AppointmentConsultedDoctor eq ${DoctorId} and Status eq healthNestBe.AppointmentStatus'Pending'&$expand=BookedBy`

            filters.push(defaultFilter);

            if (!Helper.IsJSONEmpty(filters)) {
                query = filters.join("&");
            }

            global.Busy(true);
            await Api.GetAppointmentsMulti(query)
                .then(async (res) => {
                    if(res.status) {
                        const _Appointment = getLatestAppointment(res.values);
                        if(!Helper.IsJSONEmpty(_Appointment)) {
                            const query = `$filter=AppointmentConsultedDoctor eq ${DoctorId} and AppointmentBookedBy eq ${_Appointment.BookedBy.PatientId} and Status eq healthNestBe.AppointmentStatus'Completed'`
                            const rslt1 = await Api.GetAppointmentsCount(query);
                            const appointmentCount = rslt1.values;
                            let _row = {
                                id: _Appointment.AppointmentId,
                                childId: _Appointment.BookedBy.PatientId,
                                prop1: _Appointment.BookedBy.FullName,
                                prop2: `Appointments Completed: ${appointmentCount}`,
                                prop3: `${_Appointment.BookedBy.Age || 'Nil'} years, ${_Appointment.BookedBy.Gender}`,
                                prop4: ``,
                                prop5: `${Helper.ToDate(_Appointment.Date, "MMM Do")}, ${_Appointment.StartTime}`,
                            };
        
                            _Appointment.BookedBy?.PatientProfilePicture &&
                                await Api.GetDocumentSingleMedia(_Appointment.BookedBy?.PatientProfilePicture, true, null).then((resI) => {
                                    _row = { ..._row, logo: resI.values };
                                })
        
                            setRow(_row);
                        }
                    }
                    global.Busy(false);
                });
            });
    }

    const onActionClicked = (id, type, childId) => {
        let _route, query, searchParams = [];
        if(!Helper.IsNullValue(id)) {
            searchParams.push(`appointment=${id}`);
        }

        if(!Helper.IsNullValue(childId)) {
            searchParams.push(`patient=${childId}`);
        }

        if (!Helper.IsJSONEmpty(searchParams)) {
            query = searchParams.join("&");
        }
        
        if (type === 'view') _route = `/Patients/view?${query}`;
        if (_route) NavigateTo(_route);
    }

    if (initialize) { setInitialize(false); fetchData(); }

    useEffect(() => { setInitialize(true); }, []);

    return(
          <Box sx={{ width: '100%' }}>
                <Typography noWrap variant="subheader" component="div">
                    Appointments
                </Typography>

                {!Helper.IsJSONEmpty(row) && (
                   <>
                        <Typography variant='caption' component="div" sx={{ my: 1}}>
                            You have an upcoming appointment with {row.prop1} on {row.prop5}. Tap below to view details.
                        </Typography>

                        <InfoCard row={row || {}}  onActionClicked={onActionClicked} />
                   </>
                )}
          </Box>
    )
}

const columns = [
  {
    headerName: "FullName",
    field: "BookedBy.FullName",
    flex: 1,
    editable: false,
    valueGetter: (value, row) => Helper.getNestedValue(row, "BookedBy.FullName") || ''
  },
  {
    headerName: "Age",
    field: "BookedBy.Age",
    flex: 1,
    editable: false,
    valueGetter: (value, row) => Helper.getNestedValue(row, "BookedBy.Age") || ''
  },
  {
    headerName: "Gender",
    field: "BookedBy.Gender",
    flex: 1,
    editable: false,
    valueGetter: (value, row) => Helper.getNestedValue(row, "BookedBy.Gender") || ''
  },
  { headerName: "StartTime", field: "StartTime", flex: 1, editable: false },
  { 
     headerName: "Status", field: "Status", flex: 1, editable: true,
     type: 'singleSelect',
     valueOptions: ['Completed', 'Pending', 'Cancelled', 'Rescheduled'],
   },
];

const startOfMonth = dayjs().startOf("month").format("YYYY-MM-DD");
const today = dayjs().format("YYYY-MM-DD");

const filtermap = [
    { title: "Appointments Today", label: 'Today', filter: `Date eq ${today}` },
    { title: "Upcoming Appointments", label: 'Upcoming', filter: `Date ge ${today}` },
    { title: "Appointments This Month", label: 'Past', filter: `Date ge ${startOfMonth} and Date le ${today}` }
]

const AppointmentStatus = [
    { value: '0', label: 'Completed' },
    { value: '1', label: 'Pending' },
    { value: '2', label: 'Cancelled' },
    { value: '3', label: 'Rescheduled' },
]

const Component = (props) => {
    const { title } = props;
    const theme = useTheme();
    const [initialize, setInitialize] = useState(false);
    const [pageInfo, setPageInfo] = useState({ page: 0, pageSize: 5 });
    const [rowsCount, setRowsCount] = useState(0);
    const [rows, setRows] = useState({});
    const [searchStr, setSearchStr] = useState("");
    const [sortBy, setSortBy] = useState(null);
    const [filterIndex, setFilterIndex] = useState(0);

    const NavigateTo = useNavigate();

    const LoadData = async () => {

        let query = null, filters = [], expands = 'BookedBy';
        setRows([]);
        setRowsCount(0);

        global.Busy(true);

        const Id = Session.Retrieve("Id");
        const dQery = `$filter=AppointmentConsultedDoctor eq ${parseInt(Id)}`;

        if (!Helper.IsNullValue(searchStr)) {
            filters.push(`$filter=contains(Complaints, '${searchStr}')`);
        }

         if(!Helper.IsNullValue(filterIndex)) {
            filters.push(`${dQery} and ${filtermap[filterIndex].filter}`);
        }     

        if (!Helper.IsJSONEmpty(filters)) {
            query = filters.join("&");
        }

        await GetAppointmentsCount(query)
            .then(async (res) => {
                if (res.status) {
                    setRowsCount(parseInt(res.values));
                } else {
                    console.log(res.statusText);
                }
            });

        if (!Helper.IsJSONEmpty(sortBy)) {
            filters.push(`$orderby=${sortBy.field} ${sortBy.sort}`);
        }

        const _top = pageInfo.pageSize;
        const _skip = pageInfo.page * pageInfo.pageSize;
        filters.push(`$skip=${_skip}`);
        filters.push(`$top=${_top}`);

        if (!Helper.IsJSONEmpty(filters)) {
            query = filters.join("&");
        }

        let _rows = {};
        await GetAppointmentsMulti(query, expands)
            .then(async (res) => {
                if (res.status) {
                     _rows = Helper.GroupBy(res.values, "Date");
                } else {
                    console.log(res.statusText);
                }
            });

        setRows(_rows);
        global.Busy(false);
    }

    const OnSortClicked = (e) => { setSortBy(e); }
    const OnSearchChanged = (e) => { setSearchStr(e); }
    const OnPageClicked = (newPage) => {
        setPageInfo({ page: 0, pageSize: pageInfo.pageSize }); if (newPage) setPageInfo({ page: newPage, pageSize: pageInfo.pageSize }); 
    };

    const OnActionClicked = async (id, type, childId, data) => {
        let _route, query, searchParams = [], raw = {};

        if(type === 'save') {
            const status = AppointmentStatus.find(x => x.label === data.Status).value;
            if(status) {
                raw['Status'] = status;
                raw['AppointmentId'] = id;

                await Api.SetAppointmentSingle(raw).then(res => {
                    if(res.status) {
                        global.AlertPopup('success', 'Appointment is updated successfully!');
                        setInitialize(true);
                        return;
                    }
                })
            }
        }

        const _rows = Object.values(rows).flat();
        const { AppointmentIssuedPrescription } = _rows.find(r => r.AppointmentId === id);

        if (!Helper.IsNullValue(AppointmentIssuedPrescription)) {
            searchParams.push(`prescription=${AppointmentIssuedPrescription}`);
        }

        if(!Helper.IsNullValue(id)) {
            searchParams.push(`appointment=${id}`);
        }

        if(!Helper.IsNullValue(childId)) {
            searchParams.push(`patient=${childId}`);
        }

        if (!Helper.IsJSONEmpty(searchParams)) {
            query = searchParams.join("&");
        }

        if (type === 'view') _route = `/Patients/view?${query}`;

        if (_route) NavigateTo(_route);
    }

    if (initialize) { setInitialize(false); LoadData(); }
    useEffect(() => { setInitialize(true); }, [pageInfo, filterIndex]);

    useEffect(() => { setInitialize(true); }, []);

    return (
        <LocalizationProvider dateAdapter={AdapterDayjs}>
            <Box sx={{ width: '100%', borderBottom: "1px solid #E4E4E4", p: 4 }}>
                <RenderNextAppointment />

                <Box sx={{ width: '100%', my: 2, borderBottom: 1, borderColor: 'divider'  }}>
                    <Tabs value={filterIndex} onChange={(e, v) => setFilterIndex(v)}>
                        {filtermap.map((tab, key) => (
                            <StyledTab
                                key={key+1}
                                label={tab.title}
                                sx={{ fontSize: '14px', fontWeight: '500' }}
                            />
                        ))}
                    </Tabs>
                </Box>
                
                <Stack direction={'column'} gap={3} sx={{ mt: 2 }}>
                    {/* {!Helper.IsNullValue(filterIndex) && (
                        <Stack direction="row" sx={{ width: "100%", justifyContent: 'space-between', alignItems: "center", my: '16px' }}>
                            <DatePicker
                                views={["year", "month"]}
                                label="Select month"
                                value={selectedMonth}
                                onChange={(v) => {
                                    if (!v) return;
                                    setSelectedMonth(dayjs(v).startOf("month"));
                                }}
                                sx={{ my: 2, width: '200px' }}
                            />
                            <SearchInput searchStr={searchStr} onSearchChanged={OnSearchChanged} />
                        </Stack>        
                     )} */}
                     
                     {!Helper.IsJSONEmpty(rows) ? (
                          Object.keys(rows).map(key => (
                            <Box sx={{ border: '1px solid #E7E7E7', borderRadius: 2 }}>
                                <Typography noWrap variant="subheader" component="div" sx={{ fontWeight: "bold", fontSize: "24px", py: 2, px: 4, borderBottom: '1px solid #E7E7E7' }}>
                                    {dayjs(key).format("MMMM DD YYYY")}
                                </Typography>
                                <DataTable keyId={'AppointmentId'} columns={columns} rowsCount={rowsCount} rows={rows[key]}
                                    sortBy={sortBy} pageInfo={pageInfo} onActionClicked={OnActionClicked}
                                    onSortClicked={OnSortClicked} onPageClicked={OnPageClicked} childId={'AppointmentBookedBy'} Actions={tableActions} hideFooter={true}
                                />
                            </Box>
                          ))
                        ) : (
                            <Box component={"div"} sx={{
                                mt: 2,
                                display: "flex", width: '100%',
                                height: 150, backgroundColor: "background.surface",
                                justifyContent: "center", alignItems: "center",
                                border: "1px solid lightgray"
                            }}>
                                <Typography noWrap variant="colorcaption" component="div" sx={{ fontSize: "0.95rem" }}>
                                    No appointments found
                                </Typography>
                            </Box>
                        )
                     }
                     {!Helper.IsJSONEmpty(rows) && rowsCount/pageInfo.pageSize > 1 && 
                        <Pagination
                            page={pageInfo.page}
                            pageSize={pageInfo.pageSize}
                            rowCount={rowsCount}
                            onPageChange={OnPageClicked}
                        />
                    }
                </Stack>
            </Box>
        </LocalizationProvider>
    )

}

export default Component;
