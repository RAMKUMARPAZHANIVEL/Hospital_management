import React, { useState, useEffect } from "react";
import { Typography, Grid, Stack, Box, Divider, IconButton, useTheme, Button } from '@mui/material';
import { Add as AddBoxIcon } from '@mui/icons-material';
import { Container } from "components";
import { SearchInput, CustomDialog, TextInput } from "components";
import { GetAppointmentsMulti, GetAppointmentsCount, SetAppointmentSingle } from "shared/services";
import Support from "shared/support";
import Helper from "shared/helper";
import { DataTable } from '../../childs';
import { ValidatorForm } from 'react-material-ui-form-validator';
import MenuItem from '@mui/material/MenuItem';
import FormHelperText from '@mui/material/FormHelperText';
import FormControl from '@mui/material/FormControl';
import Select from '@mui/material/Select';
import dayjs, { Dayjs } from "dayjs";
import Session from "shared/session";
import { useNavigate } from "react-router-dom";

const tableActions = [{ name: "View Details", type: "view" }];

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
  { headerName: "Status", field: "Status", flex: 1, editable: false },
  { headerName: "Complaints", field: "Complaints", flex: 1, editable: false },
];


const startOfMonth = dayjs().startOf("month").format("YYYY-MM-DD");
const today = dayjs().format("YYYY-MM-DD");

const filtermap = [
    { title: "Appointments Today", label: 'Today', filter: `Date eq ${today}` },
    { title: "Upcoming Appointments", label: 'Upcoming', filter: `Date ge ${today}` },
    { title: "Appointments This Month", label: 'Past', filter: `Date ge ${startOfMonth} and Date le ${today}` }
]

const Component = (props) => {
    const { title, selectedItem } = props;
    const theme = useTheme();
    const [initialize, setInitialize] = useState(false);
    const [pageInfo, setPageInfo] = useState({ page: 0, pageSize: 5 });
    const [rowsCount, setRowsCount] = useState(0);
    const [rows, setRows] = useState([]);
    const [searchStr, setSearchStr] = useState("");
    const [sortBy, setSortBy] = useState(null);
    const [actions, setActions] = useState({ id: 0, action: null });
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
            query = filters.join("and");
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

        let _rows = [];
        await GetAppointmentsMulti(query, expands)
            .then(async (res) => {
                if (res.status) {
                    _rows = res.values || [];
                    for (let i = 0; i < _rows.length; i++) {
                        _rows[i].id = Helper.GetGUID();
                    }
                } else {
                    console.log(res.statusText);
                }
            });

        setRows(_rows);
        global.Busy(false);
    }

    const OnPageClicked = (e) => { setPageInfo({ page: 0, pageSize: 5 }); if (e) setPageInfo(e); }
    const OnSortClicked = (e) => { setSortBy(e); }
    const OnSearchChanged = (e) => { setSearchStr(e); }

    const OnActionClicked = (id, type, childId) => {
        let _route, searchParams = [], query;
        const { AppointmentIssuedPrescription } = rows.find(r => r.AppointmentId === id);

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
    useEffect(() => { setInitialize(true); }, [sortBy, pageInfo, searchStr, filterIndex]);
    useEffect(() => { setInitialize(true); }, []);

    useEffect(() => setFilterIndex(selectedItem-1), [selectedItem]);

    const handleChange = (event) => {
        setFilterIndex(event.target.value);
    };

    return (
        <Box sx={{ width: '100%', borderBottom: "1px solid #E4E4E4" }}>
            <Box style={{ width: '100%' }}>
                <Stack direction="row" sx={{ width: "100%", justifyContent: 'space-between', alignItems: "center", my: '16px' }}>
                    <Typography noWrap variant="subheader" component="div">
                        {title}
                    </Typography>
                    <Stack direction="row" alignItems="center">
                        <SearchInput searchStr={searchStr} onSearchChanged={OnSearchChanged} />
                        <FormControl sx={{ m: 1, minWidth: 120 }}>
                            <Select
                                value={filterIndex}
                                onChange={handleChange}
                                displayEmpty
                                sx={{ width: '120px' }}
                            >
                              {filtermap.map(({ label }, key) => (
                                  <MenuItem key={key} value={Number(key)}>
                                     {label}
                                  </MenuItem>
                               ))}
                            </Select>
                        </FormControl>
                    </Stack>
                </Stack>
            </Box>
            
            <Box style={{ width: '100%' }}>
                <DataTable keyId={'AppointmentId'} columns={columns} rowsCount={rowsCount} rows={rows} noView={true}
                    sortBy={sortBy} pageInfo={pageInfo} onActionClicked={OnActionClicked}
                    onSortClicked={OnSortClicked} onPageClicked={OnPageClicked} childId={'AppointmentBookedBy'} Actions={tableActions} />
            </Box>
        </Box>
    )

}

export default Component;
