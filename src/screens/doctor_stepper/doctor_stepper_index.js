import React from 'react';
import Container from "components/container";
import { GetMetaDataInfo } from "shared/common";
import { Box, Grid, Stack, Button, Typography } from '@mui/material';
import { ArrowLeft as ArrowLeftIcon } from '@mui/icons-material';
import DoctorJsonConfig from "config/stepper_config.json";
import { DoctorForm, DoctorReviewForm, AddressForm } from "./childs";
import * as Api from "shared/services";
import { useNavigate } from "react-router-dom";
import Stepper from "components/stepper";
import Session from "shared/session";

const steps = ['Account Information', 'address', 'Review'];
const styles = { maxWidth: '920px', margin: 'auto' };

const FetchDropdownItems = async (items = ['Specialty']) => {
    return new Promise(async (resolve) => {

        global.Busy(true);

        // Default get all enums list items
        let res = await GetMetaDataInfo();

        const enums = res.filter((x) => x.Type === 'Enum') || [];
        const otherItems = items.filter(x => enums.findIndex(z => z.Name === x) === -1);

        // Extract the required entities as enums
        for (let i = 0; i < otherItems.length; i++) {
            const item = otherItems[i];
            await Api.GetEntityInfo('Specialti' + 'es').then(rslt => {
                if (rslt.status) {
                    enums.push({ Name: item, Type: 'Entity', Values: rslt.values });
                }
            });
        }

        global.Busy(false);
        return resolve(enums);
    });
};

const Component = (props) => {
    const { title } = props;
    const [initialize, setInitialize] = React.useState(false);
    const [isSubmitted, setIsSubmitted] = React.useState(false);
    const [jumpStep, setJumpStep] = React.useState(0);
    const [stepperComponents, setStepperComponents] = React.useState([]);
    const inputRefs = React.useRef({ doctorForm: null });
    const [state, setState] = React.useState(false);

    const NavigateTo = useNavigate();

    const OnStepClicked = (e) => { setJumpStep(e); }

    const PrepareStepperComponents = async (item, enums) => {
        return new Promise(async (resolve) => {

            const _items = [];

            _items.push(<DoctorForm
                name="doctor" tag="doctor" ref={r => inputRefs.current['doctor'] = r} setIsSubmitted={setIsSubmitted}
                row={item} enums={enums} />);

            _items.push(<AddressForm
                name="addressForm" tag="address" ref={r => inputRefs.current['addressForm'] = r} setIsSubmitted={setIsSubmitted}
                row={item} enums={enums} />);

            _items.push(<DoctorReviewForm
                name="review" tag="all" ref={r => inputRefs.current['review'] = r} setIsSubmitted={setIsSubmitted}
                onStepClicked={OnStepClicked} row={item} enums={enums} />);

            setStepperComponents(_items);

            return resolve(true);
        });

    }

    const FetchEnumTypes = async () => {
        return new Promise(async (resolve) => {
            global.Busy(true);
            await GetMetaDataInfo()
                .then(async (res2) => {
                    const enums = res2.filter((x) => x.Type === 'Enum') || [];
                    global.Busy(false);
                    return resolve(enums);
                });
        });
    }

    const FetchDoctorDetails = async () => {
        return new Promise(async (resolve) => {
            let item = {};
            const Username = Session.Retrieve("Username");

            ['doctor', 'address'].forEach(elm => {
                let items = [];
                for (let prop of DoctorJsonConfig[elm]) {
                    if(prop.key === 'Email')  items.push({ ...prop, value: Username });
                    else items.push({ ...prop, value: null });
                }
                item[elm] = items;
            });
            // setRow(item);
            setState(!state);
            return resolve(item);
        });
    }

    const fetchData = async () => {
        await FetchDropdownItems().then(async (enums) => {
            await FetchDoctorDetails().then(async (item) => {
                await PrepareStepperComponents(item, enums);
            });
        });
    };

    const handleReset = () => {
        setJumpStep(0);
        setInitialize(true);
    }

    if (initialize) { setInitialize(false); fetchData(); }
    React.useEffect(() => { setInitialize(true); }, []);

    return (
        <>
            <Container {...props} styles={styles} >
                <Box sx={{ width: '100%', height: 50 }}>
                    <Stack direction="row" sx={{ display: "flex", alignItems: "center" }}>
                        <Box sx={{ width: "100%" }}>
                            <Typography noWrap variant="subheader" component="div">
                                {title}
                            </Typography>
                        </Box>
                        <Grid container sx={{ justifyContent: 'flex-end' }}>
                            <Button variant="contained" startIcon={<ArrowLeftIcon />}
                                onClick={() => NavigateTo("/dashboard")}
                            >Back</Button>
                        </Grid>
                    </Stack>
                </Box>
                <Stepper requiredSubmit={true} inputRefs={inputRefs.current} isSubmitted={isSubmitted} setIsSubmitted={setIsSubmitted}
                    steps={steps} step={jumpStep} stepComponents={stepperComponents} handleReset={handleReset} />
            </Container>
        </>
    )
}

export default Component;
