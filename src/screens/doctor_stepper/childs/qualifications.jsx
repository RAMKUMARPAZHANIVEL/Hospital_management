import React, { useState, useEffect } from "react";
import { Typography, Grid, Stack, Box, Divider, IconButton, useTheme, Button } from '@mui/material';
import { Add as AddBoxIcon } from '@mui/icons-material';
import { Container } from "components";
import { SearchInput, CustomDialog, TextInput } from "components";
import { GetPatientsMulti, GetPatientsCount, SetPatientSingle } from "shared/services";
import Support from "shared/support";
import Helper from "shared/helper";
import { DataTable } from '../childs';
import { ValidatorForm } from 'react-material-ui-form-validator';

const columns = [
    { headerName: "Degree", field: "Degree", flex: 1, editable: true },
    { headerName: "University", field: "University", flex: 1, editable: true },
    { headerName: "Year", field: "Year", flex: 1, editable: true }
];

const dataColumns = [
    { key: "QualificationId", type: "keyid" },
    { key: "Degree", label: "Degree", type: "text", value: null },
    { key: "University", label: "University", type: "text", value: null },
    { key: "Year", label: "Year", type: "text", value: null }
];

const httpMethods = { add: 'POST', edit: 'PATCH', delete: 'DELETE' };
const httpMethodResponse = {
    POST: { success: 'created', failed: 'creating' },
    PATCH: { success: 'updated', failed: 'updating' },
    DELETE: { success: 'deleted', failed: 'deleting' }
};

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
    const [patient, setPatient] = useState({ 
    PatientId: null,
    FullName: null,
    Age: null,
    Gender: null,
    Email: null,
    PhoneNumber: null
    });
    const form = React.useRef(null);

    const LoadData = async () => {

        let query = null, filters = [];
        setRows([]);
        setRowsCount(0);

        global.Busy(true);

        if (!Helper.IsNullValue(searchStr)) {
            filters.push(`$filter=contains(FullName, '${searchStr}')`);
        }

        if (!Helper.IsJSONEmpty(filters)) {
            query = filters.join("&");
        }

        await GetPatientsCount(query)
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
        await GetPatientsMulti(query)
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
    const OnInputChange = (e) => { setPatient((prev) => ({ ...prev, [e.name]: e.value })); }

    const OnActionClicked = (id, type) => {
        ClearSettings();
        setActions({ id, action: type });
        if (type === 'edit' || type === 'delete') {
            const { 
            PatientId,
            FullName,
            Age,
            Gender,
            Email,
            PhoneNumber
            } = rows.find((x) => x.PatientId === id);
            setPatient({ 
            PatientId,
            FullName,
            Age,
            Gender,
            Email,
            PhoneNumber
            });
        }
    }

    const ClearSettings = () => {
        setActions({ id: 0, action: null });
        setPatient({ 
        PatientId: null,
        FullName: null,
        Age: null,
        Gender: null,
        Email: null,
        PhoneNumber: null
        });
    }

    const OnCloseClicked = (e) => {
        if (!e) {
            ClearSettings();
            return;
        }
        if (actions.action === 'add' || actions.action === 'edit') {
            if (form) form.current.submit();
        } else if (actions.action === 'delete') {
            handleSubmit();
        }
    }

    const handleSubmit = async () => {
        const httpMethod = httpMethods[actions.action] || null;
        await DoAction({ httpMethod, ...patient })
            .then((status) => {
                if (status) {
                    setInitialize(true);
                    ClearSettings();
                    setPageInfo({ page: 0, pageSize: 5 });
                }
            });
    }

    const DoAction = async (params) => {
        return new Promise(async (resolve) => {
            const { success, failed } = httpMethodResponse[params.httpMethod];
            global.Busy(true);
            let data = { ...params, Deleted: params.httpMethod === 'DELETE' };
            delete data["httpMethod"];
            
            let dataItems = Helper.CloneObject(dataColumns);
            dataItems.forEach(e => {
                e.value = data[e.key];
            });

            let numfields = Helper.GetAllNumberFields(dataItems);
            if (numfields.length > 0) Helper.UpdateNumberFields(dataItems, numfields);

            const { status } = await Support.AddOrUpdatePatient(dataItems);
            if (status) {
                global.AlertPopup("success", `Record is ${success} successful!`);
            } else {
                global.AlertPopup("error", `Something went wroing while ${failed} record!`);
            }
            global.Busy(false);
            return resolve(status);
        });
    }

    if (initialize) { setInitialize(false); LoadData(); }
    useEffect(() => { setInitialize(true); }, [sortBy, pageInfo, searchStr]);
    useEffect(() => { setInitialize(true); }, []);

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
                            <Button variant="contained" startIcon={<AddBoxIcon sx={{ width : 16 }}/>}
                                sx={{ borderRadius : 2, fontSize: 12, fontWeight: 700, height: 32, textTransform: "unset" }}
                                onClick={() => OnActionClicked(undefined, 'add')}
                            >
                            Add Patient
                            </Button>
                    </Stack>
                </Box>
                <Divider />
                <Box style={{ width: '100%' }}>
                    <DataTable keyId={'PatientId'} columns={columns} rowsCount={rowsCount} rows={rows} noView={true}
                        sortBy={sortBy} pageInfo={pageInfo} onActionClicked={OnActionClicked}
                        onSortClicked={OnSortClicked} onPageClicked={OnPageClicked} />
                </Box>

                <CustomDialog open={actions.action == 'delete'} action={actions.action} title={"Confirmation"} onCloseClicked={OnCloseClicked}>
                    <Typography gutterBottom>
                        Are you sure? You want to delete?
                    </Typography>
                </CustomDialog>

                <CustomDialog width="auto" open={actions.action == 'add'} action={actions.action} title={"Add Patients"} onCloseClicked={OnCloseClicked}>
                    <ValidatorForm ref={form} onSubmit={handleSubmit}>
                        <Grid container rowSpacing={1} columnSpacing={{ xs: 1, sm: 2, md: 3 }}>
                            <Grid item xs={6}>
                                <Typography noWrap gutterBottom>Enter FullName</Typography>
                            </Grid>
                            <Grid item xs={6}>
                                <TextInput editable={true} id={"FullName"} name={"FullName"} value={patient.FullName} validators={[]}
                                    validationMessages={[]} OnInputChange={OnInputChange} />
                            </Grid>
                            <Grid item xs={6}>
                                <Typography noWrap gutterBottom>Enter Age</Typography>
                            </Grid>
                            <Grid item xs={6}>
                                <TextInput editable={true} id={"Age"} name={"Age"} value={patient.Age} validators={[]}
                                    validationMessages={[]} OnInputChange={OnInputChange} />
                            </Grid>
                            <Grid item xs={6}>
                                <Typography noWrap gutterBottom>Enter Gender</Typography>
                            </Grid>
                            <Grid item xs={6}>
                                <TextInput editable={true} id={"Gender"} name={"Gender"} value={patient.Gender} validators={[]}
                                    validationMessages={[]} OnInputChange={OnInputChange} />
                            </Grid>
                            <Grid item xs={6}>
                                <Typography noWrap gutterBottom>Enter Email</Typography>
                            </Grid>
                            <Grid item xs={6}>
                                <TextInput editable={true} id={"Email"} name={"Email"} value={patient.Email} validators={[]}
                                    validationMessages={[]} OnInputChange={OnInputChange} />
                            </Grid>
                            <Grid item xs={6}>
                                <Typography noWrap gutterBottom>Enter PhoneNumber</Typography>
                            </Grid>
                            <Grid item xs={6}>
                                <TextInput editable={true} id={"PhoneNumber"} name={"PhoneNumber"} value={patient.PhoneNumber} validators={[]}
                                    validationMessages={[]} OnInputChange={OnInputChange} />
                            </Grid>
                        </Grid>
                    </ValidatorForm>
                </CustomDialog>

                <CustomDialog width="auto" open={actions.action == 'edit'} action={actions.action} title={"Edit Product Type"} onCloseClicked={OnCloseClicked}>
                    <ValidatorForm ref={form} onSubmit={handleSubmit}>
                        <Grid container rowSpacing={1} columnSpacing={{ xs: 1, sm: 2, md: 3 }}>
                            <Grid item xs={6}>
                                <Typography noWrap gutterBottom>Enter FullName</Typography>
                            </Grid>
                            <Grid item xs={6}>
                                <TextInput editable={true} id={"FullName"} name={"FullName"} value={patient.FullName} validators={[]}
                                    validationMessages={[]} OnInputChange={OnInputChange} />
                            </Grid>
                            <Grid item xs={6}>
                                <Typography noWrap gutterBottom>Enter Age</Typography>
                            </Grid>
                            <Grid item xs={6}>
                                <TextInput editable={true} id={"Age"} name={"Age"} value={patient.Age} validators={[]}
                                    validationMessages={[]} OnInputChange={OnInputChange} />
                            </Grid>
                            <Grid item xs={6}>
                                <Typography noWrap gutterBottom>Enter Gender</Typography>
                            </Grid>
                            <Grid item xs={6}>
                                <TextInput editable={true} id={"Gender"} name={"Gender"} value={patient.Gender} validators={[]}
                                    validationMessages={[]} OnInputChange={OnInputChange} />
                            </Grid>
                            <Grid item xs={6}>
                                <Typography noWrap gutterBottom>Enter Email</Typography>
                            </Grid>
                            <Grid item xs={6}>
                                <TextInput editable={true} id={"Email"} name={"Email"} value={patient.Email} validators={[]}
                                    validationMessages={[]} OnInputChange={OnInputChange} />
                            </Grid>
                            <Grid item xs={6}>
                                <Typography noWrap gutterBottom>Enter PhoneNumber</Typography>
                            </Grid>
                            <Grid item xs={6}>
                                <TextInput editable={true} id={"PhoneNumber"} name={"PhoneNumber"} value={patient.PhoneNumber} validators={[]}
                                    validationMessages={[]} OnInputChange={OnInputChange} />
                            </Grid>
                        </Grid>
                    </ValidatorForm>
                </CustomDialog>

            </Container>
        </>
    )

}

export default Component;