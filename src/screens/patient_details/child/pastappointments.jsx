import React, { useState, useEffect } from "react";
import { Stack, Box, Typography, useTheme , Chip, Button } from '@mui/material';
import { useNavigate } from "react-router-dom";
import { Container } from "components";
import { DataTable } from '../../childs';
import * as Api from "shared/services";

import { SearchInput, CustomDialog } from "components";
import Helper from "shared/helper";
import { Add as AddBoxIcon } from '@mui/icons-material';
import dayjs from "dayjs";
import Session from 'shared/session';

const tableActions = [{ name: "View Details", type: "view" }];

const columns = [
  { headerName: "Date", field: "Date", flex: 1, eeditable: false },
  { headerName: "StartTime", field: "StartTime", flex: 1, eeditable: false },
  { headerName: "Status", field: "Status", flex: 1, eeditable: false },
  { headerName: "Complaints", field: "Complaints", flex: 1, eeditable: false },
];

const getAddressStyle = (address) => {
    const colorMap = {
    };
    return {

        backgroundColor: "#FBE7E8",
        color: colorMap[address?.toUpperCase()] || "#607D8B", 
        borderRadius: "22px",
        fontSize:"12px",
        fontWeight:500,
        padding:"0px"
    };
}
const getMedicalInformationStyle = (medicalInformation) => {
    const colorMap = {
    };
    return {

        backgroundColor: "#FBE7E8",
        color: colorMap[medicalInformation?.toUpperCase()] || "#607D8B", 
        borderRadius: "22px",
        fontSize:"12px",
        fontWeight:500,
        padding:"0px"
    };
}

const PrescirptionView = () => {
    return(
        <>
        </>
    )
}
const defaultError = "Something went wroing while creating record!";

const startOfMonth = dayjs().startOf("month").format("YYYY-MM-DD");
const today = dayjs().format("YYYY-MM-DD");

const filtermap = [
    { title: "Past Appointments", label: 'Past', filter: `Date le ${today}` }
]

const Component = (props) => {
    const { title, patientId } = props;
    const theme = useTheme();
    const [initialize, setInitialize] = useState(false);
    const [pageInfo, setPageInfo] = useState({ page: 0, pageSize: 5 });
    const [sortBy, setSortBy] = useState(null);
    const [rowsCount, setRowsCount] = useState(0);
    const [rows, setRows] = useState([]);
    const [searchStr, setSearchStr] = useState("");
    const [showConfirm, setShowConfirm] = useState(false);
    const [deletedId, setDeletedId] = useState(0);

    const NavigateTo = useNavigate();

    const FetchResults = async () => {

        let query = null, filters = [], expands = 'ConsultedDoctor';
        setRows([]);
        setRowsCount(0);
        setDeletedId(0);
        setShowConfirm(false);

        global.Busy(true);

        const Id = Session.Retrieve("Id");
        const dQery = `$filter=AppointmentConsultedDoctor eq ${parseInt(Id)} and AppointmentBookedBy eq ${patientId}`;

        if (!Helper.IsNullValue(searchStr)) {
            filters.push(`$filter=contains(Complaints, '${searchStr}')`);
        }

        filters.push(`${dQery} and ${filtermap[0].filter}`);

        if (!Helper.IsJSONEmpty(filters)) {
            query = filters.join("&");
        }

        await Api.GetAppointmentsCount(query)
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


        await Api.GetAppointmentsMulti(query, expands)
            .then(async (res) => {
                if (res.status) {
                    _rows = res.values || [];
                    if (_rows.length > 0) {
                        _rows.forEach(x => {
                            x.id = Helper.GetGUID();
                        });
                    }
                } else {
                    console.log(res.statusText);
                }
            });

        setRows(_rows);
        global.Busy(false);
        return _rows;
    }

    const OnSearchChanged = (e) => { setSearchStr(e); }

    const OnSortClicked = (e) => { setSortBy(e); }

    const OnPageClicked = (e) => { setPageInfo({ page: 0, pageSize: 5 }); if (e) setPageInfo(e); }

    const OnDeleteClicked = (e) => { setDeletedId(e); }

    const OnCloseClicked = async (e) => {
        if (e) {
            const rslt = await Api.SetAppointmentSingle({ AppointmentId: deletedId, Deleted: true });
            if (rslt.status) {
                setInitialize(true);
                global.AlertPopup("success", "Record is deleted successful.!");
            } else {
                const msg = rslt.statusText || defaultError;
                global.AlertPopup("error", msg);
            }
        } else {
            setDeletedId(0);
            setShowConfirm(false);
        }
    }

    const OnActionClicked = (id, type, childId) => {
        let _route, query, searchParams = [];

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

    if (initialize) { setInitialize(false); FetchResults(); }

    useEffect(() => { setInitialize(true); }, [sortBy, pageInfo, searchStr]);

    useEffect(() => { setInitialize(true); }, []);

    useEffect(() => { if (deletedId > 0) setShowConfirm(true); }, [deletedId]);

    return (

        <>
            <Box style={{ width: '100%' }}>
                <Box sx={{ width: '100%'}}>
                    <Typography noWrap variant="subheader" component="div">
                        {title}
                    </Typography>
                </Box>
                
                <Stack direction="row" sx={{ width: "100%", justifyContent: 'space-between', alignItems: "center", my: '16px' }}>
                    <SearchInput searchStr={searchStr} onSearchChanged={OnSearchChanged} />
                </Stack>
            </Box>
            <Box style={{ width: '100%' }}>
                <DataTable keyId={'AppointmentId'} columns={columns} rowsCount={rowsCount} rows={rows} sortBy={sortBy} pageInfo={pageInfo} onActionClicked={OnActionClicked}
                    onSortClicked={OnSortClicked} onPageClicked={OnPageClicked} title="Appointments" noView={true} childId={'AppointmentBookedBy'} Actions={tableActions} />
            </Box>
            <CustomDialog open={showConfirm} action={'delete'} title={"Confirmation"} onCloseClicked={OnCloseClicked}>
                <Typography gutterBottom>
                    Are you sure? You want to delete?
                </Typography>
            </CustomDialog>
        </>

    );

};

export default Component;