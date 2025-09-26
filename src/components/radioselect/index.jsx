import * as React from "react";
import { Radio, RadioGroup, FormControlLabel, FormControl, FormHelperText, Typography, Box } from "@mui/material";
import { ValidatorComponent } from "react-material-ui-form-validator";

class RadioValidator extends ValidatorComponent {
    renderValidatorComponent() {
        const { label, options, ...rest } = this.props;

        return (
            <FormControl component="fieldset" error={!this.state.isValid}>
                <RadioGroup {...rest}>
                    {options.map((opt, i) => (
                        <FormControlLabel
                            key={i}
                            value={opt.value}
                            control={<Radio color="secondary" />}
                            label={
                                <Box>
                                    <Typography variant="body1" fontWeight="bold">{opt.name}</Typography>
                                    {opt.description && (
                                        <Typography variant="body2" color="text.secondary">
                                            {opt.description}
                                        </Typography>
                                    )}
                                </Box>
                            }
                        />
                    ))}
                </RadioGroup>
                {this.errorText()}
            </FormControl>
        );
    }

    errorText() {
        if (this.state.isValid) return null;
        return <FormHelperText>{this.getErrorMessage()}</FormHelperText>;
    }
}

const Component = (props) => {
    const {
        mode,
        id,
        name,
        value,
        options,
        validators,
        validationMessages,
        onChange,
        dataTestId
    } = props;

    const disabled = mode === "view";
    const [selectedValue, setSelectedValue] = React.useState(value || "");

    const handleChange = (event) => {
        const { name, value } = event.target;
        setSelectedValue(value);
        if (onChange) onChange({ name, value });
    };

    return (
        <RadioValidator
            id={id}
            name={name}
            value={selectedValue}
            onChange={handleChange}
            options={options}
            validators={validators}
            errorMessages={validationMessages}
            disabled={disabled}
            inputProps={{ "data-testid": dataTestId }}
        />
    );
};

export default Component;
