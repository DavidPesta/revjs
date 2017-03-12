import { expect } from 'chai';
import { IFieldOptions, Field, DEFAULT_FIELD_OPTIONS } from '../field';
import { requiredValidator } from '../validators';
import { ModelValidationResult } from '../../models/validation';
import { IModel, IModelOperation } from '../../models/index';
import { IModelMeta } from '../../models/meta';

function quickValidAsyncValidator<T extends IModel>(model: T, field: Field, meta: IModelMeta<T>, operation: IModelOperation, result: ModelValidationResult) {
    return new Promise<void>((resolve, reject) => {
        resolve();
    });
}

function quickInvalidAsyncValidator<T extends IModel>(model: T, field: Field, meta: IModelMeta<T>, operation: IModelOperation, result: ModelValidationResult) {
    return new Promise<void>((resolve, reject) => {
        result.addFieldError('name', 'name field is invalid');
        resolve();
    });
}

function slowInvalidAsyncValidator<T extends IModel>(model: T, field: Field, meta: IModelMeta<T>, operation: IModelOperation, result: ModelValidationResult) {
    return new Promise<void>((resolve, reject) => {
        setTimeout(() => {
            result.addFieldError('name', 'name field is invalid');
            resolve();
        }, 8000);
    });
}

describe('rev.fields.field', () => {
    let testOp: IModelOperation = {
        name: 'create'
    };

    describe('Field - constructor()', () => {

        it('creates a field with properties as expected', () => {
            let opts: IFieldOptions = {
                required: true
            };
            let test = new Field('name', opts);
            expect(test.name).to.equal('name');
            expect(test.options).to.deep.equal(opts);
        });

        it('cannot be created without a name', () => {
            expect(() => {
                new Field(undefined, undefined);
            }).to.throw('new fields must have a name');
        });

        it('sets default field options if they are not specified', () => {
            let test = new Field('name');
            expect(test.options).to.deep.equal(DEFAULT_FIELD_OPTIONS);
        });

        it('throws an error if options is not an object', () => {
            expect(() => {
                new Field('name', () => '33');
            }).to.throw('the options parameter must be an object');
        });

        it('adds the "required" validator if options.required is true', () => {
            let test = new Field('name', { required: true });
            expect(test.validators[0]).to.equal(requiredValidator);
        });

        it('adds the "required" validator if options.required is not specified', () => {
            let test = new Field('name', { });
            expect(test.validators[0]).to.equal(requiredValidator);
        });

        it('does not add any validators if options.required is false', () => {
            let test = new Field('name', { required: false });
            expect(test.validators.length).to.equal(0);
        });

    });

    describe('Field - validate()', () => {
        let testModel = {
            name: null as any
        };
        let testMeta = {
            fields: [new Field('name')]
        };
        let result: ModelValidationResult;

        beforeEach(() => {
            result = new ModelValidationResult();
        });

        it('returns a resolved promise when validation completes - no validators', () => {
            let test = new Field('name', { required: false });
            return expect(
                test.validate(testModel, testMeta, testOp, result)
            ).to.eventually.have.property('valid', true);
        });

        it('returns a resolved promise when validation completes - required validator', () => {
            let test = new Field('name', { required: true });
            testModel.name = 'Frank';
            return expect(
                test.validate(testModel, testMeta, testOp, result)
            ).to.eventually.have.property('valid', true);
        });

        it('validation fails as expected when required field not set', () => {
            let test = new Field('name', { required: true });
            return expect(
                test.validate({ name: null }, testMeta, testOp, result)
            ).to.eventually.have.property('valid', false);
        });

        it('throws an error if a model instance is not passed', () => {
            let test = new Field('name');
            expect(() => {
                test.validate('test' as any, testMeta, testOp, result);
            }).to.throw('not a model instance');
        });

        it('returns valid = true when validation completes with a valid async validator', () => {
            let test = new Field('name', { required: false });
            test.asyncValidators.push(quickValidAsyncValidator);
            return expect(
                test.validate(testModel, testMeta, testOp, result)
            ).to.eventually.have.property('valid', true);
        });

        it('returns valid = false when validation completes with an invalid async validator', () => {
            let test = new Field('name', { required: false });
            test.asyncValidators.push(quickInvalidAsyncValidator);
            return expect(
                test.validate(testModel, testMeta, testOp, result)
            ).to.eventually.have.property('valid', false);
        });

        it('returns valid = false when validation completes with a valid and an invalid async validator', () => {
            let test = new Field('name', { required: false });
            test.asyncValidators.push(quickValidAsyncValidator);
            test.asyncValidators.push(quickInvalidAsyncValidator);
            return expect(
                test.validate(testModel, testMeta, testOp, result)
            ).to.eventually.have.property('valid', false);
        });

        it('returns a rejected promise when async validation times out', () => {
            let test = new Field('name', { required: false });
            test.asyncValidators.push(slowInvalidAsyncValidator);
            return expect(
                test.validate(testModel, testMeta, testOp, result, {
                    timeout: 100
                })
            ).to.be.rejectedWith('timed out');
        });

    });

});
