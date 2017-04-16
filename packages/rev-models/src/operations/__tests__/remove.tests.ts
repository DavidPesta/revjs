
import { expect } from 'chai';
import * as rewire from 'rewire';

import { Model } from '../../models/model';
import * as d from '../../decorators';
import * as remove from '../remove';
import { MockBackend } from './mock-backend';
import { initialiseMeta } from '../../models/meta';
import { DEFAULT_REMOVE_OPTIONS } from '../remove';

class TestModel extends Model {
    @d.TextField()
        name: string;
    @d.IntegerField()
        age: number;
}

initialiseMeta(TestModel);

let rewired = rewire('../remove');
let rwRemove: typeof remove & typeof rewired = rewired as any;
let mockBackend: MockBackend;

describe('rev.operations.remove()', () => {

    let whereClause = {}; // where-clause stuff TO DO!

    beforeEach(() => {
        mockBackend = new MockBackend();
        rwRemove.__set__('backends', {
            get: () => mockBackend
        });
    });

    it('calls backend.remove() and returns successful result if model is valid', () => {
        return rwRemove.remove(TestModel, whereClause)
            .then((res) => {
                expect(mockBackend.removeStub.callCount).to.equal(1);
                let removeCall = mockBackend.removeStub.getCall(0);
                expect(removeCall.args[0]).to.equal(TestModel);
                expect(removeCall.args[1]).to.equal(whereClause);
                expect(res.success).to.be.true;
            });
    });

    it('calls backend.read() with DEFAULT_REMOVE_OPTIONS if no options are set', () => {
        return rwRemove.remove(TestModel, whereClause, null)
            .then((res) => {
                expect(mockBackend.removeStub.callCount).to.equal(1);
                let readCall = mockBackend.removeStub.getCall(0);
                expect(readCall.args[0]).to.equal(TestModel);
                expect(readCall.args[1]).to.deep.equal({});
                expect(readCall.args[3]).to.deep.equal(DEFAULT_REMOVE_OPTIONS);
            });
    });

    it('calls backend.read() with overridden options if they are set', () => {
        return rwRemove.remove(TestModel, whereClause, { somekey: 10 })
            .then((res) => {
                expect(mockBackend.removeStub.callCount).to.equal(1);
                let readCall = mockBackend.removeStub.getCall(0);
                expect(readCall.args[0]).to.equal(TestModel);
                expect(readCall.args[1]).to.deep.equal({});
                expect(readCall.args[3].somekey).to.equal(10);
            });
    });

    it('rejects if passed model is not a model constructor', () => {
        let model: any = {};
        return expect(rwRemove.remove(model, whereClause))
            .to.be.rejectedWith('not a model constructor');
    });

    it('rejects if registry.getMeta fails (e.g. model not registered)', () => {
        class UnregisteredModel extends Model {}
        return expect(rwRemove.remove(UnregisteredModel, whereClause))
            .to.be.rejectedWith('MetadataError');
    });

    it('rejects if backends.get fails (e.g. invalid backend specified)', () => {
        let expectedError = new Error('epic fail!');
        rwRemove.__set__('backends', {
            get: () => { throw expectedError; }
        });
        return expect(rwRemove.remove(TestModel, whereClause))
            .to.be.rejectedWith(expectedError);
    });

    it('rejects if where clause is not specified', () => {
        return expect(rwRemove.remove(TestModel))
            .to.be.rejectedWith('remove() must be called with a where clause');
    });

    it('rejects with any operation errors added by the backend', () => {
        mockBackend.errorsToAdd = ['some_backend_error'];
        return rwRemove.remove(TestModel, whereClause)
            .then((res) => { throw new Error('expected reject'); })
            .catch((res) => {
                expect(res).to.be.instanceof(Error);
                expect(res.result).to.exist;
                expect(res.result.success).to.be.false;
                expect(res.result.errors.length).to.equal(1);
                expect(res.result.errors[0].message).to.equal('some_backend_error');
            });
    });

    it('rejects with expected error when backend.remove rejects', () => {
        let expectedError = new Error('epic fail!');
        mockBackend.errorToThrow = expectedError;
        return expect(rwRemove.remove(TestModel, whereClause))
            .to.be.rejectedWith(expectedError);
    });

});
