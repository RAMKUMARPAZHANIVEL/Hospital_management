import { useEffect, useState } from "react";
import { Typography, Grid2 as Grid, Stack, Button, Box, Divider } from '@mui/material';
import { ArrowLeft as ArrowLeftIcon } from '@mui/icons-material';
import { useTheme } from '@mui/material/styles';
import { Container } from "components";
import { useNavigate, useParams } from "react-router-dom";
import RenderFormContols from "./child/formcontrols";
import Support from "shared/support";
import Helper from "shared/helper";

import { Extract, MapItems } from "./child/extract";

const Component = (props) => {
    const { title } = props;
    const [form, setForm] = useState(null);
    const NavigateTo = useNavigate();
    const { id } = useParams();
    const [initialized, setInitialized] = useState(false);
    const [state, setState] = useState(false);
    const [row, setRow] = useState({});
    const [backRow, setBackupRow] = useState({});
    const [showUpdate, setShowUpdate] = useState(false);
    const [dropDownOptions, setDropDownOptions] = useState([]);
    const [childCollections, setChildCollections] = useState([]);
    const [doctorQualifications, setDoctorQualifications] = useState([]);

    const TrackChanges = (name) => {
        const source = JSON.parse(JSON.stringify(backRow[name]));
        const target = JSON.parse(JSON.stringify(row[name]));

        let changes = [];
        for (let prop of source) {
            let value1 = source.find((x) => x.key === prop.key).value ?? "";
            let value2 = target.find((x) => x.key === prop.key).value ?? "";

            if (prop.key === 'DoctorImage') {
                value1 = value1.DocName ?? "";
                value2 = value2.DocName ?? "";
            }
            if (value1.toString() !== value2.toString()) {
                changes.push(prop.key);
            }
        }

        return changes;
    }

    const UpdateBackUp = (name) => {
        if (name) {
            let obj = Helper.CloneObject(row[name]);
            let bItems = [];
            for (let prop of obj) {
                bItems.push({ key: prop.key, value: prop.value });
            }
            setBackupRow((prev) => ({ ...prev, [name]: bItems }));
            setState(!state);
        }
    }


    const extractComplexUpdates = () => {
        let nestedObj = {}, numfields = {};
        for (const mapItem of MapItems) {
            if(mapItem.type === 'complex') {
                const key = mapItem.uicomponent;
                let changes = TrackChanges(key);
                if (changes.length > 0) {
                    let tmp = changes.filter((x) => (mapItem.exclude || []).indexOf(x) === -1);
                    if (tmp.length > 0) {
                        let newObject = row[mapItem.uicomponent];
                        numfields = Helper.GetAllNumberFields(newObject);
                        if (numfields.length > 0) Helper.UpdateNumberFields(newObject, numfields);
                        nestedObj = { ...nestedObj, [key] : newObject }
                    }
                }
            }   
        }
        return nestedObj;
    }

   const OnSubmit = async () => {
        let rslt, data, prodImages, doctorId, changes, numfields, complex;
        const mapItems = MapItems;

        // Attach inline objects
        let doctor = row['doctor'];
        doctorId = row['doctor'].find((x) => x.type === 'keyid').value;

        const nestedObj = extractComplexUpdates();      

        let inlineObjs = childCollections.filter(x => !x.child);
        inlineObjs.forEach(x => {
            let vObj = {};
            let obj = row[x.name];
            numfields = Helper.GetAllNumberFields(obj);
            if (numfields.length > 0) Helper.UpdateNumberFields(obj, numfields);
            const tmp = Object.values(obj);
            tmp.filter((x) => x.value).map((x) => {
                if (x.type === 'dropdown' && !Helper.IsNullValue(x.value)) {
                    vObj[x.key] = dropDownOptions.find((z) => z.Name === x.source).Values.find((m) => parseInt(m[x.valueId]) === parseInt(x.value))[x.valueId];
                } else if (numberItems.indexOf(x.key) > -1) {
                    if (x.value) vObj[x.key] = parseFloat(x.value);
                } else {
                    vObj[x.key] = x.value;
                }
            });
            doctor.push({ key: x.property, value: vObj, type: "inline" });
        });

        // Add or Update Collection Items
        let updateChild = [];
        inlineObjs = childCollections.filter(x => x.child) || [];
        inlineObjs.forEach(x => {
            let _org = row[x.name];
            let _obj = row[x.name].find(z => z.type === 'keyid');
            let _values = _obj?.values;
            let _keyId = _obj?.key;
            let filterRowItems = Helper.CloneObject(_values).filter(x => ['add', 'edit', 'delete'].indexOf(x.action) > -1);
            let valueList = [];
            filterRowItems.forEach(m => {
                delete m['id'];
                switch (m['action']) {
                    case 'add': break;
                    case 'edit': m.Edited = true; break;
                    case 'delete': m.Deleted = true; break;
                }
                if (m['action'] === 'delete') {
                    m.Deleted = true;
                } else if (m['action'] === 'add') {
                    delete m[_keyId];
                }
                delete m['id'];
                delete m['action'];
                
                let oValues = Object.keys(m);
                let newFldList = [];
                oValues.forEach(z => {
                    if(z === "Deleted") newFldList.push({ key : "Deleted", value : true  })
                    let fld = _org.find(k => k.key === z);
                    if (fld) {
                        fld.value = m[z];
                        if (fld.type === 'dropdown' && !Helper.IsNullValue(fld.value)) {
                            fld.value = dropDownOptions.find((z) => z.Name === fld.source).Values.find((k) => k[fld.nameId] === fld.value)[fld.valueId];
                            if (fld.enum) {
                                fld.value = fld.value?.toString();
                            }
                        }
                        newFldList.push(fld);
                    }
                });

                numfields = Helper.GetAllNumberFields(newFldList);
                if (numfields.length > 0) Helper.UpdateNumberFields(newFldList, numfields);

                let tmp2 = {};

                newFldList.forEach(j => {
                    tmp2 = { ...tmp2, [j.key]: j.value };
                });

                updateChild.push(tmp2);

            });

        });

        if (inlineObjs.length === 0) {
            global.AlertPopup("error", "Atleaset one child item should exist!");
            return;
        }

        changes = TrackChanges('doctor');
        if (changes.length > 0 && changes.indexOf('DoctorImage') > -1) {
            data = doctor.find((x) => x.key === 'DoctorImage');
            rslt = await Support.AddOrUpdateDocument(data);
            if (rslt.status) {
                let newImageId = parseInt(rslt.id);
                data = [
                    { key: "DoctorId", value: parseInt(doctorId) },
                    { key: "DoctorDoctorImage", value: newImageId }
                ];
                rslt = await Support.AddOrUpdateDoctor(data, dropDownOptions);
                if (!rslt.status) return;

                let newValues = doctor.find((x) => x.key === 'DoctorImage').value;
                newValues = { ...newValues, DocId: newImageId };
                row['doctor'].find((x) => x.key === 'DoctorImage').value = newValues;
                                // Update Back for next tracking purpose
                UpdateBackUp('doctor');

            } else { return; }
        }

        // Add Or Update Doctor
        changes = TrackChanges('doctor');
        if (changes.length > 0 || !Helper.IsJSONEmpty(nestedObj)) {
            numfields = Helper.GetAllNumberFields(doctor);
            if (numfields.length > 0) Helper.UpdateNumberFields(doctor, numfields);

            rslt = await Support.AddOrUpdateDoctor(doctor, dropDownOptions, ["DoctorImage"], nestedObj);
            if (rslt.status) {
                doctorId = rslt.id;
            } else { return; }
        }

        
        

        let bAllStatus = false;
        for (let i = 0; i < updateChild.length; i++) {
            let _data = updateChild[i];
                        let QualificationsDoctorMapId = null;
            if (_data.Deleted && !Helper.IsNullValue(_data.QualificationId)) {
                QualificationsDoctorMapId = doctorQualifications.find(x => x.QualificationId === _data.QualificationId && x.DoctorId === doctorId).Id;
            }
            rslt = await Support.AddOrUpdateDoctorQualifications(QualificationsDoctorMapId, doctorId, _data);
            bAllStatus = !bAllStatus ? rslt.status : bAllStatus;
        }
        if (!bAllStatus && updateChild.length > 0) {
            global.AlertPopup("error", "Somthing went wrong to update!");
            return;
        }

        for (let i = 0; i < mapItems.length; i++) {

            // Check is there any changes
            const mapItem = MapItems[i];
            changes = TrackChanges(mapItem.uicomponent);

            if (changes.length > 0) {
                // Add or Update the Doctor and navigation entity if it is deos not exist
                let navItem = doctor.find(x => x.uicomponent === mapItems[i].uicomponent);
                if (!Helper.IsJSONEmpty(navItem) && Helper.IsNullValue(navItem.value)) {
                    let childItem = row[navItem.uicomponent];
                    numfields = Helper.GetAllNumberFields(childItem);
                    if (numfields.length > 0) Helper.UpdateNumberFields(childItem, numfields);

                    rslt = await mapItems[i].func(childItem, dropDownOptions);
                    if (rslt.status) {
                        data = [
                            { key: "DoctorId", value: parseInt(doctorId) },
                            { key: navItem.key, value: parseInt(rslt.id) }
                        ];
                        rslt = await Support.AddOrUpdateDoctor(data, dropDownOptions);
                        if (!rslt.status) return;

                        // Update Back for next tracking purpose
                        UpdateBackUp(mapItem.target);

                    } else { return; }
                }
            }
        }

        
        global.AlertPopup("success", "Doctor is updated successfully!");
        setShowUpdate(false);
        NavigateTo(-1);
    }

    const OnSubmitForm = (e) => {
        e.preventDefault();
        form.current.submit();
    }

    const OnInputChange = (e) => {
        const { name, value, location, ...others } = e;
        let _row = row;
        let _index = row[location].findIndex((x) => x.key === name && x.type !== "keyid");
        if (_index > -1) {
            const item = _row[location][_index];
            let tValue = Helper.IsNullValue(value) ? null : value;
            if (tValue === 'CNONE') tValue = null;
            _row[location][_index].value = value;
            setRow(_row);
            setShowUpdate(true);
            if (!Helper.IsNullValue(item['mapitem'])) {
                UpdateMappingPannel(_row, item, tValue);
            }
        }
    }

    const UpdateMappingPannel = (_row, item, value) => {

        const { mapitem, source, valueId } = item;
        const { Values } = dropDownOptions.find(x => x.Name === source);
        const obj = value ? Values.find(x => x[valueId] === value) : null;
        let _rowMap = _row[mapitem] || [];

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
        if (_row[mapitem]) _row[mapitem] = _rowMap;
        setRow(_row);
        setState(!state);
    };

    const fetchData = async () => {

        await Extract(id).then(rslt => {
            const { row, options, collections, mapitems, backRow } = rslt;
            setRow(row);
            setChildCollections(collections);
            setDropDownOptions(options);
            setBackupRow(backRow);
            setDoctorQualifications(mapitems)
            setState(!state);
        })

    };

    if (initialized) { setInitialized(false); fetchData(); }

    useEffect(() => { setInitialized(true); }, [id]);

    const OnTableRowUpdated = (e) => {
        const { location, items } = e;
        let _row = { ...row };
        _row[location].find(x => x.type === 'keyid').values = items;
        setRow(_row);
        setShowUpdate(true);
    }

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
                    <Stack direction="row" sx={{ width: "100%", justifyContent: 'flex-end', alignItems: "center", my: '16px', gap: 3 }}>                          
                        <Button variant="contained" startIcon={<ArrowLeftIcon />}
                          onClick={() => NavigateTo(-1)}
                        > Back </Button>
                    </Stack>
                </Box>
                <RenderFormContols {...props} shadow={true} setForm={setForm} mode={"edit"} controls={row} options={dropDownOptions}
                    onInputChange={OnInputChange} onSubmit={OnSubmit}  onTableRowUpdated={OnTableRowUpdated} />

                {showUpdate && (
                    <>
                        <Divider />
                        <Box sx={{ width: '100%' }}>
                            <Grid container sx={{ flex: 1, alignItems: "center", justifyContent: 'flex-start', gap: 1, py: 2 }}>
                                <Button variant="contained" onClick={(e) => OnSubmitForm(e)}>Update</Button>
                                <Button variant="outlined" onClick={() => NavigateTo(-1)}>Cancel</Button>
                            </Grid>
                        </Box>
                    </>
                )}
            </Container>
        </>

    );

};

export default Component;
