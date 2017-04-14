import { QueryNode } from './query';
import { IQueryParser, IQueryNode } from '../types';
import { isFieldValue } from '../query';
import { Model } from '../../models/model';

export class ValueListOperator<T extends Model> extends QueryNode<T> {

    constructor(
            parser: IQueryParser,
            operator: string,
            public values: any[],
            model: new() => T,
            parent: IQueryNode<T>) {

        super(parser, operator, model, parent);
        if (!(this.operator in parser.FIELD_OPERATORS)) {
            throw new Error(`unrecognised field operator '${this.operator}'`);
        }
        if (!this.values || !(this.values instanceof Array)) {
            throw new Error(`value for '${this.operator}' must be an array`);
        }
        for (let elem of this.values) {
            if (!isFieldValue(elem)) {
                throw new Error(`invalid field value '${elem}'`);
            }
        }
    }
}
