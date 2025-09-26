import React, { useState, useEffect } from "react";
import { Typography, Grid, Stack, Box, Divider, IconButton, useTheme, Button } from '@mui/material';
import { Add as AddBoxIcon } from '@mui/icons-material';
import { Container } from "components";
import { SearchInput, CustomDialog, TextInput } from "components";
import { GetPaymentsMulti, GetPaymentsCount, SetPaymentSingle } from "shared/services";
import Support from "shared/support";
import Helper from "shared/helper";
import { DataTable } from '../../childs';
import { ValidatorForm } from 'react-material-ui-form-validator';
import Session from "shared/session";

const tableActions = [{ name: "View Details", type: "view" }];

const columns = [
    { headerName: "PaidBy", field: "PaidBy", flex: 1, editable: false },
    { headerName: "Date", field: "Date", flex: 1, editable: false },
    { headerName: "Time", field: "Time", flex: 1, editable: false },
    { headerName: "Amount", field: "Amount", flex: 1, editable: false },
    { headerName: "Method", field: "Method", flex: 1, editable: false },
    { headerName: "Status", field: "Status", flex: 1, editable: false },
];

const Component = (props) => {
    const { title } = props;
    const theme = useTheme();
    const [initialize, setInitialize] = useState(false);
    const [pageInfo, setPageInfo] = useState({ page: 0, pageSize: 5 });
    const [rowsCount, setRowsCount] = useState(0);
    const [rows, setRows] = useState([]);
    const [searchStr, setSearchStr] = useState("");
    const [sortBy, setSortBy] = useState(null);
    const [actions, setActions] = useState({ id: 0, action: null });

    const LoadData = async () => {

        let query = null, filters = [];
        setRows([]);
        setRowsCount(0);

        global.Busy(true);

        const Id = Session.Retrieve("Id");
        filters.push(`$filter=PaymentPaidTo eq ${parseInt(Id)}`);

        if (!Helper.IsNullValue(searchStr)) {
            filters.push(`$filter=contains(Time, '${searchStr}')`);
        }

        if (!Helper.IsJSONEmpty(filters)) {
            query = filters.join("&");
        }

        await GetPaymentsCount(query)
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
        await GetPaymentsMulti(query)
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
    const OnInputChange = (e) => { setPayment((prev) => ({ ...prev, [e.name]: e.value })); }

    const OnActionClicked = (id, type) => {
        setActions({ id, action: type });
    }

    if (initialize) { setInitialize(false); LoadData(); }
    useEffect(() => { setInitialize(true); }, [sortBy, pageInfo, searchStr]);
    useEffect(() => { setInitialize(true); }, []);

    return (
        <>
            <Box sx={{ width: '100%' }}>
                <Box style={{ width: '100%' }}>
                    <Stack direction="row" sx={{ width: "100%", justifyContent: 'space-between', alignItems: "center", my: '16px' }}>
                        <Typography noWrap variant="subheader" component="div">
                            {title}
                        </Typography>

                        <SearchInput searchStr={searchStr} onSearchChanged={OnSearchChanged} />
                    </Stack>
                </Box>
                <Divider />
                <Box style={{ width: '100%' }}>
                    <DataTable keyId={'PaymentId'} columns={columns} rowsCount={rowsCount} rows={rows} noView={true}
                        sortBy={sortBy} pageInfo={pageInfo} onActionClicked={OnActionClicked}
                        onSortClicked={OnSortClicked} onPageClicked={OnPageClicked} actions={tableActions} />
                </Box>
            </Box>
        </>
    )

}

export default Component;
