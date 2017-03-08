import { Field, IFieldOptions } from './field';
import * as validators from './validators';

export interface INumberFieldOptions extends IFieldOptions {
    minValue?: number | string;
    maxValue?: number | string;
}

export class NumberField extends Field {
    options: INumberFieldOptions;

    constructor(name: string, options?: INumberFieldOptions) {
        super(name, options);
        this.validators.push(validators.numberValidator);
        if (typeof this.options.minValue != 'undefined') {
            this.validators.push(validators.minValueValidator);
        }
        if (typeof this.options.maxValue != 'undefined') {
            this.validators.push(validators.maxValueValidator);
        }
    }
}

export class IntegerField extends NumberField {
    constructor(name: string, options?: INumberFieldOptions) {
        super(name, options);
        let validatorIdx = this.options.required ? 2 : 1;
        this.validators.splice(validatorIdx, 0, validators.integerValidator);
    }
}
