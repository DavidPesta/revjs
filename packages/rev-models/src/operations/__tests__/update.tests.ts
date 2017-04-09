
import { expect } from 'chai';
import * as rewire from 'rewire';

import { Model } from '../../models/model';
import * as d from '../../decorators';
import * as update from '../update';
import { MockBackend } from './mock-backend';
import { ModelValidationResult } from '../../validation/validationresult';
import { initialiseMeta } from '../../models/meta';
import { OPERATION_MESSAGES as msg } from '../operationmsg';

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

    let whereClause = {}; // where-clause stuff TO DO!

    beforeEach(() => {
        mockBackend = new MockBackend();
        rwUpdate.__set__('backends', {
            get: () => mockBackend
        });
    });

    it('calls backend.update() and returns successful result if model is valid', () => {
        let model = new TestModel();
        model.name = 'Bob';
        model.gender = 'male';
        return rwUpdate.update(model, whereClause)
            .then((res) => {
                expect(mockBackend.updateStub.callCount).to.equal(1);
                let updateCall = mockBackend.updateStub.getCall(0);
                expect(updateCall.args[0]).to.equal(model);
                expect(res.success).to.be.true;
                expect(res.validation).to.be.instanceOf(ModelValidationResult);
                expect(res.validation.valid).to.be.true;
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

    it('rejects when model is not a singleton and where clause is not specified', () => {
        let model = new TestModel();
        return expect(rwUpdate.update(model))
            .to.be.rejectedWith('update() must be called with a where clause for non-singleton models');
    });

    it('completes with unsuccessful result when model required fields not set', () => {
        let model = new TestModel();
        return rwUpdate.update(model, whereClause)
            .then((res) => {
                expect(res.success).to.be.false;
                expect(res.errors.length).to.equal(1);
                expect(res.errors[0].message).to.equal(msg.failed_validation('TestModel'));
                expect(res.errors[0]['code']).to.equal('failed_validation');
                expect(res.validation).to.be.instanceOf(ModelValidationResult);
                expect(res.validation.valid).to.be.false;
            });
    });

    it('completes with unsuccessful result when model fields do not pass validation', () => {
        let model = new TestModel();
        model.name = 'Bill';
        model.gender = 'fish';
        model.age = 9;
        model.email = 'www.google.com';
        return rwUpdate.update(model, whereClause)
            .then((res) => {
                expect(res.success).to.be.false;
                expect(res.errors.length).to.equal(1);
                expect(res.errors[0].message).to.equal(msg.failed_validation('TestModel'));
                expect(res.errors[0]['code']).to.equal('failed_validation');
                expect(res.validation).to.be.instanceOf(ModelValidationResult);
                expect(res.validation.valid).to.be.false;
            });
    });

    it('returns any operation errors added by the backend', () => {
        let model = new TestModel();
        model.name = 'Bob';
        model.gender = 'male';
        mockBackend.errorsToAdd = ['error_from_backend'];
        return rwUpdate.update(model, whereClause)
            .then((res) => {
                expect(res.success).to.be.false;
                expect(res.errors.length).to.equal(1);
                expect(res.errors[0].message).to.equal('error_from_backend');
            });
    });

    it('rejects when backend.update rejects', () => {
        let expectedError = new Error('epic fail!');
        let model = new TestModel();
        model.name = 'Bob';
        model.gender = 'male';
        mockBackend.updateStub.returns(Promise.reject(expectedError));
        return expect(rwUpdate.update(model, whereClause))
            .to.be.rejectedWith(expectedError);
    });

});
