
import * as React from 'react';

import MUIDatePicker from 'material-ui/DatePicker';

import { IModelFieldComponentProps } from './types';

export const DateField: React.StatelessComponent<IModelFieldComponentProps> = (props) => {

    const onChange = (event: null, date: any) => {
        props.input.onChange(date);
    };

    let value = props.input.value || null;

    return (
        <MUIDatePicker
            name={props.field.name}
            floatingLabelText={props.field.options.label || props.field.name}
            value={value}
            onChange={onChange}
            onFocus={props.input.onFocus}
            onDismiss={props.input.onBlur as any}
            autoOk={true}
            fullWidth={true}
        />
    );
};
