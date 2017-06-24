import { expect } from 'chai';
import * as d from '../../decorators';
import { IModelMeta } from '../../models/meta';
import { Model } from '../../models/model';
import { TextField } from '../../fields/';
import { validate, IValidationContext } from '../validate';
import { VALIDATION_MESSAGES as msg } from '../../validation/validationmsg';
import { ModelRegistry } from '../../registry/registry';
import { InMemoryBackend } from '../../backends/inmemory/backend';

describe('validate()', () => {
    let registry: ModelRegistry;

    class TestModel extends Model {
        @d.IntegerField({ minValue: 10 })
            id: number;
        @d.TextField()
            name: string;
        @d.DateField({ required: false })
            date: Date;
        
        testMethod() {
            return true;
        }
    }

    let validModel = new TestModel({
        id: 11, name: 'Fred'
    });

    beforeEach(() => {
        registry = new ModelRegistry();
        registry.registerBackend('default', new InMemoryBackend());
        registry.register(TestModel);

        TestModel.prototype.validate = () => undefined;
        TestModel.prototype.validateAsync = () => Promise.resolve();
    });


    it('should return a valid result if valid object is passed', () => {

        let test = new TestModel({
            id: 11,
            name: 'Harry',
            date: new Date()
        });

        return validate(registry, test, {operation: 'create'})
            .then((res) => {
                expect(res.valid).to.equal(true);
            });
    });

    it('should reject if model not registered', () => {
        class UnregisteredModel extends Model {}
        let test = new UnregisteredModel();
        return validate(registry, test, {operation: 'create'})
            .then(() => { throw new Error('expected to reject'); })
            .catch((err) => {
                expect(err.message).to.contain('is not registered');
            });
    });

    it('should return an invalid result if extra fields are present', () => {

        let test = new TestModel({
            id: 11,
            name: 'Harry',
            date: new Date(),
            extra: 'stuff'
        });

        return validate(registry, test, {operation: 'create'})
            .then((res) => {
                expect(res.valid).to.equal(false);
                expect(res.modelErrors.length).to.equal(1);
                expect(res.modelErrors[0]['message']).to.equal(msg.extra_field('extra'));
                expect(res.modelErrors[0]['code']).to.equal('extra_field');
            });
    });

    it('should return an invalid result if a field value is invalid', () => {

        let test = new TestModel({
            id: 2,
            name: 'Harry',
            date: new Date()
        });

        return validate(registry, test, {operation: 'create'})
            .then((res) => {
                expect(res.valid).to.equal(false);
                expect(res.fieldErrors['id'].length).to.equal(1);
                expect(res.fieldErrors['id'][0]['message']).to.equal(msg.min_value('id', 10));
                expect(res.fieldErrors['id'][0]['code']).to.equal('min_value');
            });
    });

    it('should return an invalid result if a required field is not set', () => {

        let test = new TestModel({
            id: 11
        });

        return validate(registry, test, {operation: 'create'})
            .then((res) => {
                expect(res.valid).to.equal(false);
                expect(res.fieldErrors['name'].length).to.equal(1);
                expect(res.fieldErrors['name'][0]['message']).to.equal(msg.required('name'));
                expect(res.fieldErrors['name'][0]['code']).to.equal('required');
            });
    });

    it('should reject if validation timeout expires', () => {
        let delayModelMeta: IModelMeta<any> = {
            fields: []
        };
        let delayField = new TextField('test');
        delayField.asyncValidators.push((...args: any[]) => {
            return new Promise<void>((resolve, reject) => {
                setTimeout(() => {
                    resolve();
                }, 10000);
            });
        });
        delayModelMeta.fields.push(delayField);

        class DelayModel extends Model {}
        registry.register(DelayModel, delayModelMeta);
        let test = new DelayModel();

        return validate(registry, test, {operation: 'create'}, { timeout: 10})
            .then(() => { throw new Error('expected to reject'); })
            .catch((err) => {
                expect(err.message).to.contain('timed out');
            });
    });

    it('should return a valid result if model.validate does not set an error', () => {

        TestModel.prototype.validate = () => undefined;

        return validate(registry, validModel, {operation: 'create'})
            .then((res) => {
                expect(res.valid).to.equal(true);
                expect(res.fieldErrors).to.deep.equal({});
            });
    });

    it('should return an invalid result if model.validate sets an error', () => {

        TestModel.prototype.validate = (vc: IValidationContext) => {
            vc.result.addFieldError('name', 'That name is too stupid!', 'daftness', { stupidityLevel: 10 });
        };

        return validate(registry, validModel, {operation: 'create'})
            .then((res) => {
                expect(res.valid).to.equal(false);
                expect(res.fieldErrors['name'].length).to.equal(1);
                expect(res.fieldErrors['name'][0]).to.deep.equal({
                    message: 'That name is too stupid!',
                    code: 'daftness',
                    stupidityLevel: 10
                });
            });
    });

    it('should reject if model validate() throws an error', () => {

        TestModel.prototype.validate = (vc: IValidationContext) => {
            throw new Error('Validator epic fail...');
        };

        return validate(registry, validModel, {operation: 'create'})
            .then(() => { throw new Error('expected to reject'); })
            .catch((err) => {
                expect(err.message).to.contain('Validator epic fail...');
            });
    });

    it('should return an invalid result if model validateAsync() fails', () => {

        TestModel.prototype.validateAsync = (vc: IValidationContext) => {
            return new Promise<void>((resolve, reject) => {
                vc.result.addFieldError('name', 'Google says that name is stupid', 'daftness', { stupidRank: 99 });
                resolve();
            });
        };

        return validate(registry, validModel, {operation: 'create'})
            .then((res) => {
                expect(res.valid).to.equal(false);
                expect(res.fieldErrors['name'].length).to.equal(1);
                expect(res.fieldErrors['name'][0]).to.deep.equal({
                    message: 'Google says that name is stupid',
                    code: 'daftness',
                    stupidRank: 99
                });
            });
    });

    it('should reject if model validateAsync() throws an error', () => {

        TestModel.prototype.validateAsync = (vc: IValidationContext) => {
            throw new Error('Async Validator epic fail...');
        };

        return validate(registry, validModel, {operation: 'create'})
            .then(() => { throw new Error('expected to reject'); })
            .catch((err) => {
                expect(err.message).to.contain('Async Validator epic fail...');
            });
    });

    it('should reject if model validateAsync() rejects', () => {

        TestModel.prototype.validateAsync = (vc: IValidationContext) => {
            return Promise.reject(new Error('Can handle rejection...'));
        };

        return validate(registry, validModel, {operation: 'create'})
            .then(() => { throw new Error('expected to reject'); })
            .catch((err) => {
                expect(err.message).to.contain('Can handle rejection...');
            });
    });

    it('should reject if model validateAsync times out', () => {

        TestModel.prototype.validateAsync = (vc: IValidationContext) => {
            return new Promise<void>((resolve, reject) => {
                setTimeout(() => {
                    resolve();
                }, 1000);
            });
        };

        return validate(registry, validModel, {operation: 'create'}, { timeout: 10 })
            .then(() => { throw new Error('expected to reject'); })
            .catch((err) => {
                expect(err.message).to.contain('timed out');
            });
    });

});
