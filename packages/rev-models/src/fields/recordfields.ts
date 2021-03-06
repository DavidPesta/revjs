
import { Field, IFieldOptions } from './field';
import * as validators from '../validation/validators';

export interface IRecordFieldOptions extends IFieldOptions {
    model: string;
}

export class RecordField extends Field {
    options: IRecordFieldOptions;

    constructor(
            name: string,
            options: IRecordFieldOptions) {
        super(name, options);

        if (!options.model || typeof options.model != 'string') {
            throw new Error('RecordFieldError: options.model must be a non-empty string');
        }

        this.validators.push(validators.recordClassValidator);

    }
}

export class RecordListField extends Field {
    options: IRecordFieldOptions;

    constructor(
            name: string,
            options: IRecordFieldOptions) {
        super(name, options);

        if (!options.model || typeof options.model != 'string') {
            throw new Error('RecordFieldError: options.model must be a non-empty string');
        }

        this.validators.push(validators.recordListClassValidator);

    }
}
