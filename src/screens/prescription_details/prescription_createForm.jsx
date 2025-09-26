import { useEffect, useState } from "react";
import { Box, Typography, Grid2 as Grid, Stack, Button, Divider } from '@mui/material';
import { Container } from "components";
import RenderFormContols from "./child/formcontrols";
import { useNavigate, useParams } from "react-router-dom";
import Support from "shared/support";
import { ArrowLeft as ArrowLeftIcon } from '@mui/icons-material';
import Helper from "shared/helper";

import { Extract, MapItems } from "./child/extract";


const Component = (props) => {

    const [form, setForm] = useState(null);
    const [row, setRow] = useState({});
    const [initialized, setInitialized] = useState(false);
    const [state, setState] = useState(false);
    const [showButton, setShowButton] = useState(true);
    const [dropDownOptions, setDropDownOptions] = useState([]);
    const NavigateTo = useNavigate();
    const [showUpdate, setShowUpdate] = useState(false);
    const { title } = props;

    const { id } = useParams();

    const OnSubmit = async () => {
        let rslt, data, prodImages, prescriptionId, numfields;
        const mapItems = MapItems;

        let prescription = row['prescription'];
        let nestedObj = {};

        numfields = Helper.GetAllNumberFields(prescription);
        if (numfields.length > 0) Helper.UpdateNumberFields(prescription, numfields);

         for (const mapItem of mapItems) {
            if(mapItem.type === 'complex') {
                  const key = mapItem.uicomponent;
                  let complex = row[key];
                  numfields = Helper.GetAllNumberFields(complex);
                  if (numfields.length > 0) Helper.UpdateNumberFields(complex, numfields);
                nestedObj = { ...nestedObj, [key] : complex }
            }
        } 

        // Add Or Update Prescription
        rslt = await Support.AddOrUpdatePrescription(prescription, []);
        if (rslt.status) {
            prescriptionId = rslt.id;
            const data1 = [
                { key: "AppointmentId", value: parseInt(id)},
                { key: "AppointmentIssuedPrescription", value: parseInt(prescriptionId)}
            ]
            const rslt1 = await Support.AddOrUpdateAppointment(data1);

            if (!rslt1.status) return;
        } else { return; }

        for (let i = 0; i < mapItems.length; i++) {
            // Add or Update the Prescription and navigation entity if it is deos not exist
            let navItem = prescription.find(x => x.uicomponent === mapItems[i].uicomponent);
            if (!Helper.IsJSONEmpty(navItem) && Helper.IsNullValue(navItem.value)) {
                let childItem = row[navItem.uicomponent];

                numfields = Helper.GetAllNumberFields(childItem);
                if (numfields.length > 0) Helper.UpdateNumberFields(childItem, numfields);
                rslt = await mapItems[i].func(childItem, dropDownOptions);

                if (rslt.status) {
                    data = [
                        { key: "PrescriptionId", value: parseInt(prescriptionId) },
                        { key: navItem.key, value: parseInt(rslt.id) }
                    ];
                    rslt = await Support.AddOrUpdatePrescription(data);

                    if (!rslt.status) return;

                } else { return; }
            }
        }

        
        global.AlertPopup("success", "Prescription is created successfully!");
        setShowUpdate(false);
        NavigateTo(-1);
    }

    const OnInputChange = (e) => {
        const { name, value, location, ...others } = e;
        let _row = row;
        let _index = row[location].findIndex((x) => x.key === name && x.type !== "keyid");
        if (_index > -1) {
            const item = _row[location][_index];
            let tValue = Helper.IsNullValue(value) ? null : value;
            if (tValue === 'CNONE') tValue = null;
            _row[location][_index].value = tValue;
            setRow(_row);
            setShowUpdate(true);
            if (!Helper.IsNullValue(item['uicomponent'])) {
                UpdateMappingPannel(_row, item, tValue);
            }
        }
    }

    const UpdateMappingPannel = (_row, item, value) => {

        const { uicomponent, source, valueId } = item;
        const { Values } = dropDownOptions.find(x => x.Name === source);
        const obj = value ? Values.find(x => x[valueId] === value) : null;
        let _rowMap = _row[uicomponent] || [];

        for (let i = 0; i < _rowMap.length; i++) {

            let tmpField = _rowMap[i];
            let bEditable = true;
            let _cValue = null;

            if (!Helper.IsNullValue(obj)) {
                _cValue = obj[tmpField.key];
                if (tmpField.type === 'dropdown') {
                    const _dValues = dropDownOptions.find(x => x.Name === _rowMap[i].source).Values;
                    _cValue = _dValues.find(x => x.Name === _cValue)[_rowMap[i].valueId];
                } else if (tmpField.type === 'date') {
                    _cValue = Helper.ToDate(_cValue, "YYYY-MM-DD");
                }
                bEditable = false;
            }

            tmpField.editable = bEditable;
            tmpField.value = _cValue;

            _rowMap[i] = tmpField;

        }
        if (_row[uicomponent]) _row[uicomponent] = _rowMap;
        setRow(_row);
        setState(!state);
    };

    const OnSubmitForm = (e) => {
        e.preventDefault();
        form.current.submit();
    }

    const fetchData = async () => {
        await Extract().then(rslt => {
            const { row, options } = rslt;
            setRow(row);
            setDropDownOptions(options);
            setState(!state);
        })
    };

    useEffect(() => { setShowButton(true); }, []);
    if (initialized) { setInitialized(false); fetchData(); }
    useEffect(() => { setInitialized(true); }, []);

    return (

        <>
            <Container {...props}>
                <Box style={{ width: '100%' }}>
                    <Box sx={{ width: '100%', mb: 2.5 }}>
                        <Typography noWrap variant="subheader" component="div">
                            {title}
                        </Typography>
                    </Box>
                    <Divider />
                    <Stack direction="row" sx={{ width: "100%", justifyContent: 'flex-end', alignItems: "center", mt: '16px', gap: 3 }}>                          
                        <Button variant="contained" startIcon={<ArrowLeftIcon />}
                          onClick={() => NavigateTo(-1)}
                        > Back </Button>
                    </Stack>
                </Box>
                <RenderFormContols shadow={true} {...props} setForm={setForm} onInputChange={OnInputChange}
                    controls={row} onSubmit={OnSubmit} options={dropDownOptions} />
                {showUpdate && (
                    <>
                        <Divider />
                        <Box sx={{ width: '100%' }}>
                            <Grid container sx={{ flex: 1, alignItems: "center", justifyContent: 'flex-start', gap: 1, py: 2 }}>
                                {showButton && <Button variant="contained" onClick={(e) => OnSubmitForm(e)} >Save</Button>}
                                <Button variant="outlined" onClick={() => NavigateTo(-1)}>Cancel</Button>
                            </Grid>
                        </Box>
                    </>
                )}
            </Container >
        </>

    );

};

export default Component;