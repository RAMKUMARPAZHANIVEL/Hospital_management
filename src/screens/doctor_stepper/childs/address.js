import React from 'react';
import RenderFormContols from "./formcontrols";
import Support from "shared/support";
import Helper from "shared/helper";

const Component = React.forwardRef((props, ref) => {

    const { enums, setIsSubmitted, tag } = props;
    const [form, setForm] = React.useState(null);

    React.useImperativeHandle(ref, () => ({
        submit: () => form.current.submit()
    }));

    const AddOrUpdateAddress = async () => {

        return new Promise(async (resolve) => {

            let rslt, data, doctorId, complex;

            doctorId = props.row['doctor'].find((x) => x.key === 'DoctorId').value || 0;

            let childItem = props.row['address'];
            let numfields = Helper.GetAllNumberFields(childItem);
            if (numfields.length > 0) Helper.UpdateNumberFields(childItem, numfields);

            // Add Or Update doctor address
                data = [
                    { key: "DoctorId", value: parseInt(doctorId) },
                ];
                complex = { "Address" : childItem };
                rslt = await Support.AddOrUpdateDoctor(data, enums, [], complex);
                if (!rslt.status) return resolve(false);

            return resolve(true);

        });
    }

    const OnSubmit = async (e) => {

        if (e) e.preventDefault();

        await AddOrUpdateAddress().then((status) => {
            if (status) {
                global.AlertPopup("success", "Address is updated successfully!");
                setIsSubmitted(true);
            }
        });

    }

    const OnInputChange = async (e) => {
        const { name, value } = e;
        let doctors = props.row[tag];
        doctors.find((x) => x.key == name).value = value;
        props.row[tag] = doctors;
    }

    return (
        <>
            <RenderFormContols {...props} setForm={setForm} type="address" onInputChange={OnInputChange} onSubmit={OnSubmit} />
        </>
    )
});

export default Component;