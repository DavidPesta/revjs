
import { expect } from 'chai';
import * as fld from '../../../fields';
import * as vld from '../record';
import { VALIDATION_MESSAGES as msg } from '../../validationmsg';

import { ModelValidationResult } from '../../validationresult';
import { IModelOperation } from '../../../operations/operation';
import { IValidationOptions } from '../../../operations/validate';
import { ModelManager } from '../../../models/manager';
import { InMemoryBackend } from '../../../backends/inmemory/backend';
import { expectValidationFailure } from './utils';

class TestModel {
    id: any;
    name: any;
    record: any;
    recordList: any;
}

class TestRelatedModel {}
class TestUnrelatedModel {}

let idField = new fld.IntegerField('id');
let nameField = new fld.TextField('name', {
    minLength: 5, maxLength: 10,
    minValue: 'ddd', maxValue: 'jjj',
    regEx: /^abc\d.$/  // abc[number][anything]
});
let recordField = new fld.RecordField('record', { model: 'TestRelatedModel' });
let recordListField = new fld.RecordField('recordList', { model: 'TestRelatedModel' });

let manager = new ModelManager();
manager.registerBackend('default', new InMemoryBackend());
manager.register(TestModel, {
    fields: [
        idField, nameField, recordField
    ]
});

let op: IModelOperation = {
    operation: 'create'
};
let opts: IValidationOptions = {
    timeout: 200
};

describe('rev.fields.validators.record', () => {
    let vResult: ModelValidationResult;

    beforeEach(() => {
        vResult = new ModelValidationResult();
    });

    describe('recordClassValidator()', () => {

        it('returns valid = true when record is not defined', () => {
            let test = new TestModel();
            vld.recordClassValidator(manager, test, recordField, op, vResult, opts);
            expect(vResult.valid).to.equal(true);
        });

        it('returns valid = true when record is null', () => {
            let test = new TestModel();
            test.record = null;
            vld.recordClassValidator(manager, test, recordField, op, vResult, opts);
            expect(vResult.valid).to.equal(true);
        });

        it('returns valid = true when the value is an instance of the correct class', () => {
            let test = new TestModel();
            test.record = new TestRelatedModel();
            vld.recordClassValidator(manager, test, recordField, op, vResult, opts);
            expect(vResult.valid).to.equal(true);
        });

        it('returns valid = false when the value is not an instance of the correct class', () => {
            let test = new TestModel();
            test.record = new TestUnrelatedModel();
            vld.recordClassValidator(manager, test, recordField, op, vResult, opts);
            expectValidationFailure('invalid_record_class', recordField.name, msg.invalid_record_class(recordField.name), vResult);
        });

        it('returns valid = false when the value is not an object', () => {
            let test = new TestModel();
            test.record = 222;
            vld.recordClassValidator(manager, test, recordField, op, vResult, opts);
            expectValidationFailure('invalid_record_class', recordField.name, msg.invalid_record_class(recordField.name), vResult);
        });

    });

    describe('recordListClassValidator()', () => {

        it('returns valid = true when record is not defined', () => {
            let test = new TestModel();
            vld.recordListClassValidator(manager, test, recordListField, op, vResult, opts);
            expect(vResult.valid).to.equal(true);
        });

        it('returns valid = false when record is null', () => {
            let test = new TestModel();
            test.recordList = null;
            vld.recordListClassValidator(manager, test, recordListField, op, vResult, opts);
            expectValidationFailure('invalid_record_list_data', recordListField.name, msg.invalid_record_list_data(recordListField.name), vResult);
        });

        it('returns valid = true when the value is an empty array', () => {
            let test = new TestModel();
            test.recordList = [];
            vld.recordListClassValidator(manager, test, recordListField, op, vResult, opts);
            expect(vResult.valid).to.equal(true);
        });

        it('returns valid = true when array has an instance of the correct class', () => {
            let test = new TestModel();
            test.recordList = [new TestRelatedModel()];
            vld.recordListClassValidator(manager, test, recordListField, op, vResult, opts);
            expect(vResult.valid).to.equal(true);
        });

        it('returns valid = false when field is just an instance of the correct class', () => {
            let test = new TestModel();
            test.recordList = new TestRelatedModel();
            vld.recordListClassValidator(manager, test, recordListField, op, vResult, opts);
            expectValidationFailure('invalid_record_list_data', recordListField.name, msg.invalid_record_list_data(recordListField.name), vResult);
        });

        it('returns valid = false when array has an instance of the wrong class', () => {
            let test = new TestModel();
            test.recordList = [new TestUnrelatedModel()];
            vld.recordListClassValidator(manager, test, recordListField, op, vResult, opts);
            expectValidationFailure('invalid_record_list_class', recordListField.name, msg.invalid_record_list_class(recordListField.name), vResult);
        });

        it('returns valid = false when array has a correct class and an invalid class instance', () => {
            let test = new TestModel();
            test.recordList = [new TestRelatedModel(), new TestUnrelatedModel()];
            vld.recordListClassValidator(manager, test, recordListField, op, vResult, opts);
            expectValidationFailure('invalid_record_list_class', recordListField.name, msg.invalid_record_list_class(recordListField.name), vResult);
        });

        it('returns valid = false when the value is not an array', () => {
            let test = new TestModel();
            test.recordList = {};
            vld.recordListClassValidator(manager, test, recordListField, op, vResult, opts);
            expectValidationFailure('invalid_record_list_data', recordListField.name, msg.invalid_record_list_data(recordListField.name), vResult);
        });

        it('returns valid = false when the array contains a value that is not an object', () => {
            let test = new TestModel();
            test.recordList = [222];
            vld.recordListClassValidator(manager, test, recordListField, op, vResult, opts);
            expectValidationFailure('invalid_record_list_class', recordListField.name, msg.invalid_record_list_class(recordListField.name), vResult);
        });

    });

});
