import * as React from "react";
import { Box, Stack } from '@mui/material';
import { ValidatorForm } from 'react-material-ui-form-validator';
import RenderFormContols from "components/formcontrols";
import Helper from "shared/helper";
import OneToManyForm from "./onetomany_form";;

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

    React.useEffect(() => {
        if (props.setForm) props.setForm(form);
    }, [props, form]);

    React.useEffect(() => {
        ValidatorForm.addValidationRule('isTruthy', value => value);
    }, []);

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

    return (
        <Box sx={{ width: '100%' }}>
            <ValidatorForm ref={form} onSubmit={handleSubmit}>
                <Stack sx={{ width: '100%', mb: 5 }}>
                    <Box sx={{ float: "left", minWidth: "95%", mt: 4, border, borderRadius, p: 5 }}>
                        <RenderFormContols shadow={true} location="doctor" mode={props.mode} title={"Doctor"}
                            controls={props.controls.doctor} options={props.options} onInputChange={OnInputChange} />
                    </Box>
                    
                    <Box sx={{ float: "left", minWidth: "95%", mt: 4, border, borderRadius, p: 5 }}>
                        <RenderFormContols shadow={true} location="Address" mode={props.mode} title={"Address"}
                            controls={props.controls.Address} options={props.options} onInputChange={OnInputChange} />
                    </Box>

                       {elementKeys && elementKeys.map((x, index) => {
                            const { child, UIComponentTitle, values } = props.controls[x].find(z => z.type === 'keyid');
                            if (child) {
                                return (
                                    <Box key={index} sx={{ float: "left", minWidth: "95%", mt: 4 }}>
                                        <OneToManyForm location={x} title={UIComponentTitle} mode={props.mode}
                                            config={props.controls[x]} values={values.filter(m => m.action !== 'delete')} options={props.options} onTableRowUpdated={OnTableRowUpdated} />
                                    </Box>
                                )
                            }
                        })}
                </Stack >
            </ValidatorForm>
        </Box>
    );

}

export default Component;