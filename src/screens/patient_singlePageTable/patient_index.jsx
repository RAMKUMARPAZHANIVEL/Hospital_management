import React, { useState, useEffect } from "react";
import { Stack, Box, Typography, useTheme , Chip, Button } from '@mui/material';
import { useNavigate } from "react-router-dom";
import { Container } from "components";
import { DataTable } from '../childs';
import * as Api from "shared/services";

import { SearchInput, CustomDialog } from "components";
import Helper from "shared/helper";
import { Add as AddBoxIcon } from '@mui/icons-material';

const tableActions = [{ name: "View Details", type: "view" }];

const columns = [
    { headerName: "FullName", field: "FullName", flex: 1, editable: false },
    { headerName: "Age", field: "Age", flex: 1, editable: false },
    { headerName: "Gender", field: "Gender", flex: 1, editable: false },
    { headerName: "Email", field: "Email", flex: 1, editable: false },
    { headerName: "PhoneNumber", field: "PhoneNumber", flex: 1, editable: false },
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
const defaultError = "Something went wroing while creating record!";

const Component = (props) => {
    const { title } = props;
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

        let query = null, filters = [];
        setRows([]);
        setRowsCount(0);
        setDeletedId(0);
        setShowConfirm(false);

        global.Busy(true);

        if (!Helper.IsNullValue(searchStr)) {
            filters.push(`$filter=contains(FullName, '${searchStr}')`);
        }

        if (!Helper.IsJSONEmpty(filters)) {
            query = filters.join("&");
        }

        await Api.GetPatientsCount(query)
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


        await Api.GetPatientsMulti(query, "")
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
            const rslt = await Api.SetPatientSingle({ PatientId: deletedId, Deleted: true });
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

    const OnActionClicked = (id, type) => {
        let _route;
        if (type === 'edit') _route = `/Patients/edit/${id}`;
        if (type === 'view') _route = `/Patients/view/${id}`;
        if (type === 'delete') setDeletedId(id);;
        if (_route) NavigateTo(_route);
    }

    if (initialize) { setInitialize(false); FetchResults(); }

    useEffect(() => { setInitialize(true); }, [sortBy, pageInfo, searchStr]);

    useEffect(() => { setInitialize(true); }, []);

    useEffect(() => { if (deletedId > 0) setShowConfirm(true); }, [deletedId]);

    return (

        <>
            <Container {...props}>
                <Box style={{ width: '100%' }}>
                    <Box sx={{ width: '100%', borderBottom: "1px solid #E4E4E4", mb: 2.5  }}>
                        <Typography noWrap variant="subheader" component="div">
                            {title}
                        </Typography>
                    </Box>
                    
                    <Stack direction="row" sx={{ width: "100%", justifyContent: 'space-between', alignItems: "center", my: '16px' }}>
                        <SearchInput searchStr={searchStr} onSearchChanged={OnSearchChanged} />
                    </Stack>
                </Box>
                <Box style={{ width: '100%' }}>
                    <DataTable keyId={'PatientId'} columns={columns} rowsCount={rowsCount} rows={rows} sortBy={sortBy} pageInfo={pageInfo} onActionClicked={OnActionClicked}
                        onSortClicked={OnSortClicked} onPageClicked={OnPageClicked} title="Leads" noView={true} Actions={tableActions} />
                </Box>
                <CustomDialog open={showConfirm} action={'delete'} title={"Confirmation"} onCloseClicked={OnCloseClicked}>
                    <Typography gutterBottom>
                        Are you sure? You want to delete?
                    </Typography>
                </CustomDialog>
            </Container>
        </>

    );

};

export default Component;