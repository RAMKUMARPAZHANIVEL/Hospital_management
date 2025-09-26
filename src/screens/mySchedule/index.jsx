import { useEffect, useState } from "react";
import { Box, Typography } from '@mui/material';
import { Container } from "components";
import Helper from "shared/helper";
import AvailabilityScheduler from "./childs/AvailabilityScheduler";
import * as Api from "shared/services";
import Session from "shared/session";

const Component = (props) => {

    const [initialized, setInitialized] = useState(false);
    const [rows, setRows] = useState([]);

    const { title } = props;

    const sortByTime = (slots) => {
        return slots.sort((a, b) => a.StartTime.localeCompare(b.StartTime));
    }
    
    const fetchData = async () => {
        let query;
        let expands = [], filters = [];

        const doctorId = Session.Retrieve("Id");
        expands = "Slots"
        filters.push(`$filter=AvailabilityDoctor eq ${doctorId}`);

        if (!Helper.IsJSONEmpty(filters)) {
            query = filters.join("&");
        }
        
        global.Busy(true);
        const res = await Api.GetAvailabilitiesMulti(query, expands);
        global.Busy(false);
        if(res.status) {
            const _rows = res.values.map(x => ({ ...x, Slots: sortByTime(x.Slots) }));
            setRows(_rows);
        }
    }



    if (initialized) { setInitialized(false); fetchData(); }
    useEffect(() => { setInitialized(true); }, []);

    const onSave = async (data) => {
         // Add Or Update doctor
       global.Busy(true);
       const rslt = await Api.SetAvailabilitySingle(data);
       global.Busy(false);
        if (rslt.status) {
            global.AlertPopup('success', "Schedule is created successfully!")
        } else { return; }
    }

    return (

        <>
            <Container {...props}>
                <Box style={{ width: '100%' }}>
                    <Box sx={{ width: '100%', mb: 3 }}>
                        <Typography noWrap variant="subheader" component="div">
                            {title}
                        </Typography>
                    </Box>
                </Box>
                <AvailabilityScheduler onSave={onSave} initialDbData={rows} />
            </Container >
        </>

    );

};

export default Component;
