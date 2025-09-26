import React from 'react';
import RenderFormContols from "./formcontrols";
import Support from "shared/support";
import Helper from "shared/helper";
import Session from "shared/session";

const Component = React.forwardRef((props, ref) => {
    const { enums, setIsSubmitted, tag } = props;
    const [form, setForm] = React.useState(null);

    React.useImperativeHandle(ref, () => ({
        submit: () => form.current.submit()
    }));

    const OnSubmit = async (e) => {
        let rslt, data, doctorImage, doctorId, numfields;
        let doctor = props.row['doctor'];

        numfields = Helper.GetAllNumberFields(doctor);
        if (numfields.length > 0) Helper.UpdateNumberFields(doctor, numfields);

        // Add Or Update doctor
        const username = Session.Retrieve("Username");
        doctor.push({ key: "UserKey", value: username });

        rslt = await Support.AddOrUpdateDoctor(doctor, enums, ['DoctorImage']);
        if (rslt.status) {
            doctorId = rslt.id;
            doctor.find((x) => x.key === 'DoctorId').value = rslt.id;
            props.row['doctor'].find((x) => x.key === 'DoctorId').value = rslt.id;
            Session.Store("DoctorId", doctorId);
        } else { return; }

        // Add doctor Main Image
        doctorImage = doctor.find((x) => x.key === 'DoctorImage');
        if(doctorImage.value) {
            rslt = await Support.AddOrUpdateDocument(doctorImage);
            if (rslt.status) {
                doctor.find((x) => x.key === 'DoctorImage')['value'] = rslt.id;
                // Add Or Update doctor
                data = [
                    { key: "DoctorId", value: parseInt(doctorId) },
                    { key: "DoctorDoctorImage", value: parseInt(rslt.id) }
                ];
                rslt = await Support.AddOrUpdateDoctor(data);
                if (!rslt.status) return;
    
            } else { return; }
        }

        global.AlertPopup("success", "Doctor is created successfully!");
        setIsSubmitted(true);
    }

    const OnInputChange = async (e) => {
        const { name, value } = e;
        let rows = props.row[tag];
        rows.find((x) => x.key == name).value = value;
        props.row[tag] = rows;
    }

    return (
        <>
            <RenderFormContols {...props}
                setForm={setForm} type="doctor" onInputChange={OnInputChange} onSubmit={OnSubmit} />
        </>
    )
});

export default Component;