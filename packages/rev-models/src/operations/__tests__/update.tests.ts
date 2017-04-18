
import { expect } from 'chai';
import * as rewire from 'rewire';

import { Model } from '../../models/model';
import * as d from '../../decorators';
import * as update from '../update';
import { MockBackend } from './mock-backend';
import { ModelValidationResult } from '../../validation/validationresult';
import { initialiseMeta } from '../../models/meta';
import { DEFAULT_UPDATE_OPTIONS, IUpdateOptions } from '../update';

let GENDERS = [
    ['male', 'Male'],
    ['female', 'Female']
];

class TestModel extends Model {
    @d.TextField()
        name: string;
    @d.SelectionField({ selection: GENDERS })
        gender: string;
    @d.IntegerField({ required: false, minValue: 10 })
        age: number;
    @d.EmailField({ required: false })
        email: string;
}

initialiseMeta(TestModel);

let rewired = rewire('../update');
let rwUpdate: typeof update & typeof rewired = rewired as any;
let mockBackend: MockBackend;

describe('rev.operations.update()', () => {

    let options: IUpdateOptions;

    beforeEach(() => {
        options = {
            where: {}
        };
        mockBackend = new MockBackend();
        rwUpdate.__set__('backends', {
            get: () => mockBackend
        });
    });

    it('calls backend.update() and returns successful result if model is valid', () => {
        let model = new TestModel();
        model.name = 'Bob';
        model.gender = 'male';
        return rwUpdate.update(model, options)
            .then((res) => {
                expect(mockBackend.updateStub.callCount).to.equal(1);
                let updateCall = mockBackend.updateStub.getCall(0);
                expect(updateCall.args[0]).to.equal(model);
                expect(res.success).to.be.true;
                expect(res.validation).to.be.instanceOf(ModelValidationResult);
                expect(res.validation.valid).to.be.true;
            });
    });

    it('calls backend.update() with DEFAULT_UPDATE_OPTIONS if no options are set', () => {
        let model = new TestModel();
        model.name = 'Bob';
        model.gender = 'male';
        let testOpts = Object.assign({}, DEFAULT_UPDATE_OPTIONS, options);
        return rwUpdate.update(model, options)
            .then((res) => {
                expect(mockBackend.updateStub.callCount).to.equal(1);
                let readCall = mockBackend.updateStub.getCall(0);
                expect(readCall.args[0]).to.equal(model);
                expect(readCall.args[1]).to.equal(options.where);
                expect(readCall.args[3]).to.deep.equal(testOpts);
            });
    });

    it('calls backend.update() with overridden options if they are set', () => {
        let model = new TestModel();
        model.name = 'Bob';
        model.gender = 'male';
        options.validation = {};
        return rwUpdate.update(model, options)
            .then((res) => {
                expect(mockBackend.updateStub.callCount).to.equal(1);
                let readCall = mockBackend.updateStub.getCall(0);
                expect(readCall.args[0]).to.equal(model);
                expect(readCall.args[1]).to.equal(options.where);
                expect(readCall.args[3].validation).to.deep.equal({});
            });
    });

    it('rejects if model metadata is not initialised', () => {
        class UnregisteredModel extends Model {}
        let model = new UnregisteredModel();
        return expect(rwUpdate.update(model))
            .to.be.rejectedWith('MetadataError');
    });

    it('rejects if backends.get fails (e.g. invalid backend specified)', () => {
        let model = new TestModel();
        let expectedError = new Error('epic fail!');
        rwUpdate.__set__('backends', {
            get: () => { throw expectedError; }
        });
        return expect(rwUpdate.update(model))
            .to.be.rejectedWith(expectedError);
    });

    it('rejects when where clause is not specified', () => {
        let model = new TestModel();
        return expect(rwUpdate.update(model))
            .to.be.rejectedWith('update() must be called with a where clause');
    });

    it('rejects with unsuccessful result when model fields do not pass validation', () => {
        let model = new TestModel();
        model.name = 'Bill';
        model.gender = 'fish';
        model.age = 9;
        model.email = 'www.google.com';
        return rwUpdate.update(model, options)
            .then((res) => { throw new Error('expected reject'); })
            .catch((res) => {
                expect(res).to.be.instanceof(Error);
                expect(res.message).to.equal('ValidationError');
                expect(res.result).to.exist;
                expect(res.result.success).to.be.false;
                expect(res.result.validation).to.be.instanceOf(ModelValidationResult);
                expect(res.result.validation.valid).to.be.false;
            });
    });

    it('rejects with any operation errors added by the backend', () => {
        let model = new TestModel();
        model.name = 'Bob';
        model.gender = 'male';
        mockBackend.errorsToAdd = ['some_backend_error'];
        return rwUpdate.update(model, options)
            .then((res) => { throw new Error('expected reject'); })
            .catch((res) => {
                expect(res).to.be.instanceof(Error);
                expect(res.result).to.exist;
                expect(res.result.success).to.be.false;
                expect(res.result.errors.length).to.equal(1);
                expect(res.result.errors[0].message).to.equal('some_backend_error');
            });
    });

    it('rejects with any operation errors added by the backend', () => {
        let model = new TestModel();
        model.name = 'Bob';
        model.gender = 'male';
        mockBackend.errorsToAdd = ['some_backend_error'];
        return rwUpdate.update(model, options)
            .then((res) => { throw new Error('expected reject'); })
            .catch((res) => {
                expect(res).to.be.instanceof(Error);
                expect(res.result).to.exist;
                expect(res.result.success).to.be.false;
                expect(res.result.errors.length).to.equal(1);
                expect(res.result.errors[0].message).to.equal('some_backend_error');
            });
    });

    it('rejects with expected error when backend.update rejects', () => {
        let expectedError = new Error('epic fail!');
        let model = new TestModel();
        model.name = 'Bob';
        model.gender = 'male';
        mockBackend.errorToThrow = expectedError;
        return expect(rwUpdate.update(model, options))
            .to.be.rejectedWith(expectedError);
    });

});
