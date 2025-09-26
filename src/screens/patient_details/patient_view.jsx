
import { useEffect, useState } from "react";
import { Typography, Grid, Stack, Button, Box, Divider } from '@mui/material';
import { ArrowLeft as ArrowLeftIcon, Edit as EditIcon } from '@mui/icons-material';
import { Container } from "components";
import { useNavigate, useParams } from "react-router-dom";
import RenderFormContols from "./child/formcontrols";
import Helper from "shared/helper";
import * as Api from "shared/services";

import { Extract } from "./child/extract";
import InfoCard from "./child/info_card";

const RenderPatient = ({ patientId }) => {
    const [row, setRow] = useState({});
    const [initialize, setInitialize] = useState(false);
    const NavigateTo = useNavigate();

    const fetchData = async () => {
        return new Promise(async (resolve) => {
            global.Busy(true);
            let query = null, filters = [];
            setRow({});

            if (!Helper.IsJSONEmpty(filters)) {
                query = filters.join("&");
            }

            global.Busy(true);
            await Api.GetPatientSingle(patientId)
                .then(async (res) => {
                    if(res.status) {
                        const patient = res.values;
                        if(!Helper.IsJSONEmpty(patient)) {
               
                            let _row = {
                                id: patient.PatientId,
                                prop1: patient.FullName,
                                prop2: patient.Email,
                                prop3: `Gender: ${patient.Gender}`,
                                prop4: `Age & DOB: ${patient.Age || 'Nil'}, ${patient.DateOfBirth}`,
                                prop5: `Contact: ${patient.PhoneNumber}`,
                                prop6: `Emergency Contact: ${patient.EmergencyContact}`
                            };
        
                            patient?.PatientProfilePicture &&
                                await Api.GetDocumentSingleMedia(patient?.PatientProfilePicture, true, null).then((resI) => {
                                    _row = { ..._row, logo: resI.values };
                                })
        
                            setRow(_row);
                        }
                    }
                });
            });
    }

    if (initialize) { setInitialize(false); fetchData(); }

    useEffect(() => { setInitialize(true); }, []);

    return(
          <Box sx={{ width: '100%' }}>
                {!Helper.IsJSONEmpty(row) && (
                    <InfoCard row={row || {}} />
                )}
          </Box>
    )
}

const Component = (props) => {
    const { title } = props;
    const NavigateTo = useNavigate();
    const { id } = useParams();
    const [initialized, setInitialized] = useState(false);
    const [row, setRow] = useState({});
    const [dropDownOptions, setDropDownOptions] = useState([]);

    const fetchData = async () => {

        await Extract(id).then(rslt => {
            const { row, options } = rslt;
            setRow(row);
            setDropDownOptions(options);
        })

    };

    if (initialized) { setInitialized(false); fetchData(); }

    useEffect(() => { setInitialized(true); }, [id]);

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
                    <Stack direction="row" sx={{ justifyContent: 'flex-end', alignItems: "center", my: '16px', gap: 2 }}>                          
                        <Button variant="outlined" startIcon={<ArrowLeftIcon />}
                         onClick={() => NavigateTo(-1)}
                        > Back </Button>
                    </Stack>
                </Box>
                
                <RenderPatient patientId={id} />

                <RenderFormContols shadow={true} {...props} mode={"view"} options={dropDownOptions} controls={row} />
            </Container>
        </>

    );

};

export default Component;