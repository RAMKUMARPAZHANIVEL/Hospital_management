import React from 'react';
import RenderFormContols from "./formcontrols";
import DoctorJsonConfig from "config/stepper_config.json";
import * as Api from "shared/services";
import { GetMetaDataInfo } from "shared/common";
import Helper from "shared/helper";
import { useNavigate } from 'react-router-dom';

const screenItems = ['doctor', 'address'];

const Component = React.forwardRef((props, ref) => {

    const { setIsSubmitted, onEditClicked } = props;
    const [form, setForm] = React.useState(null);
    const [dropDownOptions, setDropDownOptions] = React.useState([]);
    const [row, setRow] = React.useState({});

    const navigate = useNavigate();
    React.useImperativeHandle(ref, () => ({
        submit: () => form.current.submit()
    }));

    const OnSubmit = async (e) => {
        // setIsSubmitted(true);
        navigate("/review");
    }

    const OnEditClicked = (e) => {
        if (onEditClicked) OnEditClicked(e);
    }

    const doctorid = props.row['doctor'].find((x) => x.key === 'DoctorId').value || 0;

    const FetchDoctorDetails = async (enums) => {

        let item = {}, tmp;

        screenItems.forEach(elm => {
            let items = [];
            for (let prop of DoctorJsonConfig[elm]) {
                items.push({ ...prop, value: null });
            }
            item[elm] = items;
        });

        global.Busy(true);
        // Get Doctor Details
        let rslt = await Api.GetDoctorSingle(doctorid, "$expand=DoctorImage");
        if (rslt.status) {

            const doctor = rslt.values;

            for (let prop in doctor) {
                const tItem = item['doctor'].find((x) => x.key === prop);
                if (tItem) {
                    if (prop === 'Gender' || prop === 'Type') {
                        const dpItems = enums.find((z) => z.Name === tItem.source).Values;
                        const _value = dpItems.find((m) => m.Name === doctor[prop]).Value;
                        item['doctor'].find((x) => x.key === prop).value = parseInt(_value);
                    } else {
                        item['doctor'].find((x) => x.key === prop).value = doctor[prop];
                    }
                }
            }

            // Address
            if (doctor.Address) {
                Object.keys(doctor.Address).forEach(x => {
                    if(item['address'].some(z => z.key === x)) item['address'].find(z => z.key === x).value = doctor.Address[x];
                })
            }

            // Main Image
            if (doctor.DoctorDoctorImage) {
                tmp = {};
                ['DocData', 'DocId', 'FileName', 'FileType', 'Date'].forEach((x) => {
                    tmp[x] = doctor.DoctorImage[x]
                });

                if (tmp.DocId > 0) {
                    rslt = await Api.GetDocumentSingleMedia(tmp.DocId, true);
                    if (rslt.status) tmp['DocData'] = rslt.values;
                }
                item['doctor'].find((x) => x.key === "DoctorImage").value = tmp;
            }
        }

        setRow(item);
        global.Busy(false);
    }

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


    React.useEffect(() => {
        const fetchData = async () => {
            if (doctorid) {
                await FetchDropdownItems().then(async (enums) => {
                    await FetchDoctorDetails(enums);
                });
            }
        };
        fetchData();
    }, [doctorid]);

    return (
        <>
            <RenderFormContols {...props} row={row} excludestepper={true} shadow={true} review={true}
                onEditClicked={OnEditClicked} setForm={setForm} onSubmit={OnSubmit} />
        </>
    )
});

export default Component;