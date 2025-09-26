import * as React from "react";
import { Box, Stack, styled, Tab, Tabs } from '@mui/material';
import { ValidatorForm } from 'react-material-ui-form-validator';
import RenderFormContols from "components/formcontrols";
import OneToManyForm from "./onetomany_form";;
import Helper from "shared/helper";

const sections = ["Vitals"];

const StyledTab = styled((props) => <Tab disableRipple {...props} />)(
  ({ theme }) => ({
    textTransform: 'none',
    fontWeight: theme.typography.fontWeightRegular,
    fontSize: theme.typography.pxToRem(15),
    marginRight: theme.spacing(1),
    color: 'rgba(0, 0, 0, 0.7)',
    border: "1px solid #E7E7E7",
    borderRadius: 8,
    "&:hover": {
      color: "rgba(98, 77, 227, 0.7)",
    },
  }),
);

const Component = (props) => {

    const { onInputChange, onSubmit, shadow, onTableRowUpdated } = props;
    const form = React.useRef(null);

    const border = shadow ? "1px solid #9E9E9E !important" : null;
    const borderRadius = shadow ? "8px !important" : null;

    const sectionRefs = React.useRef({});
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
    

    const getTabs = () => {
        let allTabs = [...sections];

        Object.entries(props.controls).forEach(([section, fields]) => {
        fields.forEach((f) => {
            if (f.type === "textarea") {
            allTabs.push(f.label || f.name); // use label if available
            }
        });
        });

        return allTabs;
    };

    const handleTabClick = (tab) => {
        const el = sectionRefs.current[tab];
        if (el && el.scrollIntoView) {
          el.scrollIntoView({ behavior: "smooth", block: "center" });
        }
    };

    return (
        <Box sx={{ width: '100%' }}>
            <Tabs variant="scrollable" scrollButtons="auto">
                {getTabs().map((tab, index) => (
                <StyledTab
                    key={index}
                    label={tab}
                    onClick={() => handleTabClick(tab)}
                    sx={{ fontSize: '14px', fontWeight: '500' }}
                />
                ))}
            </Tabs>
            <ValidatorForm ref={form} onSubmit={handleSubmit}>
                <Stack sx={{ width: '100%', mb: 5 }}>
                    <Box sx={{ float: "left", minWidth: "95%", mt: 4, border, borderRadius, p: 5 }}
                      ref={(el) => (sectionRefs.current['Vitals'] = el)}
                    >
                        <RenderFormContols shadow={true} location="Vitals" mode={props.mode} title={"Vitals"}
                            controls={props.controls.Vitals} options={props.options} onInputChange={OnInputChange} />
                    </Box>

                    <Box sx={{ float: "left", minWidth: "95%", mt: 4 }}>
                        <RenderFormContols shadow={true} location="prescription" mode={props.mode} review={false}
                            controls={props.controls.prescription} options={props.options} onInputChange={OnInputChange} 
                            registerRef={(label, el) => { sectionRefs.current[label] = el }} />
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
                            // return (
                            //     <Box key={index} sx={{ float: "left", minWidth: "95%", mt: 4, border, borderRadius, p: 5 }}>
                            //         <RenderFormControls shadow={true} location={x} mode={props.mode} title={UIComponentTitle}
                            //             controls={props.controls[x]} options={props.options} onInputChange={OnInputChange} />
                            //             {/* {props.controls[x].find(item => item.key === 'Type') && (
                            //                 <CheckInput mode={mode} label={x.label} id={x.key} name={x.key} value={x.value || x.default}
                            //                     validationMessages={x.validationMessages} OnInputChange={OnInputChange} sx={{ width: x.width }} dataTestId={x.key} />
                                    
                            //         )}
                            //         <DropDown mode={mode} id={x.key} name={x.key} value={x.value} options={GetDropDownOptions(x.source)} valueId={x.valueId} size="small"
                            //                 nameId={x.nameId} contentId={x.contentId} defaultLabel={`Select ${x.label}`} sx={{ width: x.width }}
                            //                 validators={x.validators} validationMessages={x.validationMessages} onDropDownChange={OnInputChange} dataTestId={x.key} /> */}
                            //     </Box>
                            // )
                        })}
                </Stack >
            </ValidatorForm>
        </Box>
    );

}

export default Component;