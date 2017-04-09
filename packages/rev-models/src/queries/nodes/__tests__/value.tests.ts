import { expect } from 'chai';

import * as d from '../../../decorators';
import { initialiseMeta } from '../../../models/meta';
import { QueryParser } from '../../queryparser';
import { ValueOperator } from '../value';
import { Model } from '../../../models/model';

class TestModel extends Model {
    @d.IntegerField()
        id: number;
    @d.TextField()
        name: string;
    @d.BooleanField()
        active: boolean;
}

initialiseMeta(TestModel);

let parser = new QueryParser();

describe('class ValueOperator<T> - constructor', () => {

    it('throws if operator is not a field operator', () => {
        expect(() => {
            new ValueOperator(parser, '$and', [], TestModel, null);
        }).to.throw('unrecognised field operator');
    });

    it('throws if value is not a valid field value', () => {
        expect(() => {
            new ValueOperator(parser, '$eq', undefined, TestModel, null);
        }).to.throw('invalid field value');
        expect(() => {
            new ValueOperator(parser, '$eq', {}, TestModel, null);
        }).to.throw('invalid field value');
    });

    it('stores the operator and value as public properties', () => {
        let node = new ValueOperator(parser, '$eq', 12, TestModel, null);
        expect(node.operator).to.equal('$eq');
        expect(node.value).to.equal(12);
    });

});
