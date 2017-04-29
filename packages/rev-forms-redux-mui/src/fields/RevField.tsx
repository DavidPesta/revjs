
import * as React from 'react';
import { Field } from 'redux-form';
import { IRevFormMeta } from '../forms/RevForm';
import { ModelRegistry } from 'rev-models';
import * as fields from 'rev-models/lib/fields';
import { IModelFieldComponentProps } from './types';

import TextField from './TextField';
import BooleanField from './BooleanField';
import DateField from './DateField';
import NumberField from './NumberField';
import SelectionField from './SelectionField';

// TODO: Provide this via a provider...
const registry = new ModelRegistry();

export interface IRevFieldProps {
    name: string;
}

export default class RevField extends React.Component<IRevFieldProps, void> {

    static contextTypes = {
        revFormMeta: React.PropTypes.object
    };

    cProps: IModelFieldComponentProps = {} as any;

    constructor(props: IRevFieldProps, context: any) {
        super(props);
        let revFormMeta: IRevFormMeta = context.revFormMeta;
        if (!revFormMeta) {
            throw new Error('RevField Error: must be nested inside a RevForm.');
        }
        this.cProps.modelMeta = registry.getModelMeta(revFormMeta.model);
        if (!(props.name in this.cProps.modelMeta.fieldsByName)) {
            throw new Error(`RevField Error: Model '${revFormMeta.model}' does not have a field called '${props.name}'.`);
        }
        this.cProps.field = this.cProps.modelMeta.fieldsByName[props.name];
    }

    render() {
        // TODO: Put these in an object so they can be replaced

        if (this.cProps.field instanceof fields.TextField) {
            return (
                <Field name={this.props.name} component={TextField} props={this.cProps} />
            );
        }
        else if (this.cProps.field instanceof fields.NumberField) {
            return (
                <Field name={this.props.name} component={NumberField} props={this.cProps} />
            );
        }
        else if (this.cProps.field instanceof fields.BooleanField) {
            return (
                <Field name={this.props.name} component={BooleanField} props={this.cProps} />
            );
        }
        else if (this.cProps.field instanceof fields.SelectionField) {
            return (
                <Field name={this.props.name} component={SelectionField} props={this.cProps} />
            );
        }
        else if (this.cProps.field instanceof fields.DateField) {
            return (
                <Field name={this.props.name} component={DateField} props={this.cProps} />
            );
        }
    }

}
