import * as React from "react";
import { Box } from '@mui/material';
import { ValidatorForm } from 'react-material-ui-form-validator';
import {RenderFormControls} from "components";
import CustomTable from "./customtable";
import Helper from "shared/helper";

const formconfig = [
    { label: "Types of availability", key: "Type", type: 'custom',  }
]
const Component = (props) => {

    const { onInputChange, onSubmit, shadow, onTableRowUpdated } = props;
    const form = React.useRef(null);

    const border = shadow ? "1px solid #9E9E9E !important" : null;
    const borderRadius = shadow ? "8px !important" : null;
    const elementKeys = Object.keys(props.controls);

    const handleSubmit = () => {
        if (onSubmit) onSubmit();
    }

    const OnInputChange = (e) => {
        if (onInputChange) onInputChange(e);
    }

    const OnTableRowUpdated = (e) => {
        const { id, rows, keyIdName, action, data, location } = e;
        let items = rows || [];
        if (action === 'add') {
            const guid = Helper.GetGUID();
            items = [...items, { action, id: guid, [keyIdName]: guid, ...data }];
        } else if (action === 'edit') {
            const updatedItems = [...items];
            const index = updatedItems.findIndex(x => x.id === id);
            updatedItems[index] = { action, ...data };
            items = updatedItems;
        } else if (action === 'delete') {
            let updatedItems = [...items];
            updatedItems.find(x => x.id === id).action = 'delete';
            items = updatedItems;
        }
        if (onTableRowUpdated) onTableRowUpdated({ location, items });
    }

    const GetDropDownOptions = (e) => {
        return options.find((x) => x.Name === e)?.Values;
    }

    React.useEffect(() => {
        if (props.setForm) props.setForm(form);
    }, [props, form]);

    React.useEffect(() => {
        ValidatorForm.addValidationRule('isTruthy', value => value);
    }, []);

    return (
        <Box sx={{ width: '100%' }}>
            <ValidatorForm ref={form} onSubmit={handleSubmit}>
                <Box style={{ display: 'block', width: '100%', marginBottom: 5 }}>

                    {elementKeys && elementKeys.map((x, index) => {
                        const { child, UIComponentTitle, values } = props.controls[x].find(z => z.type === 'keyid');
                        if (child) {
                            return (
                                <Box key={index} sx={{ float: "left", minWidth: "95%", mt: 4 }}>
                                    <CustomTable location={x} title={UIComponentTitle} mode={props.mode}
                                        controls={props.controls[x]} rows={values.filter(m => m.action !== 'delete')} options={props.options} onTableRowUpdated={OnTableRowUpdated} />
                                </Box>
                            )
                        }
                        return (
                            <Box key={index} sx={{ float: "left", minWidth: "95%", mt: 4, border, borderRadius, p: 5 }}>
                                <RenderFormControls shadow={true} location={x} mode={props.mode} title={UIComponentTitle}
                                    controls={props.controls[x]} options={props.options} onInputChange={OnInputChange} />
                                 {/* {props.controls[x].find(item => item.key === 'Type') && (
                                     <CheckInput mode={mode} label={x.label} id={x.key} name={x.key} value={x.value || x.default}
                                           validationMessages={x.validationMessages} OnInputChange={OnInputChange} sx={{ width: x.width }} dataTestId={x.key} />
                                
                                )}
                                <DropDown mode={mode} id={x.key} name={x.key} value={x.value} options={GetDropDownOptions(x.source)} valueId={x.valueId} size="small"
                                        nameId={x.nameId} contentId={x.contentId} defaultLabel={`Select ${x.label}`} sx={{ width: x.width }}
                                        validators={x.validators} validationMessages={x.validationMessages} onDropDownChange={OnInputChange} dataTestId={x.key} /> */}
                            </Box>
                        )
                    })}

                </Box>
            </ValidatorForm>
        </Box>
    );

}

export default Component;