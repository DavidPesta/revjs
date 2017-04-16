
import { expect } from 'chai';
import { InMemoryBackend } from '../backend';
import { initialiseMeta } from '../../../models/meta';
import { ModelOperationResult } from '../../../operations/operationresult';
import { Model } from '../../../models/model';
import * as d from '../../../decorators';
import { DEFAULT_CREATE_OPTIONS } from '../../../operations/create';
import { DEFAULT_READ_OPTIONS } from '../../../operations/read';

let GENDERS = [
    ['male', 'Male'],
    ['female', 'Female']
];

class TestModel extends Model {
    @d.IntegerField()
        id: number;
    @d.TextField()
        name: string;
    @d.IntegerField({ required: false })
        age: number;
    @d.SelectionField({ required: false, selection: GENDERS })
        gender: string;
    @d.BooleanField({ required: false })
        newsletter: boolean;
    @d.DateField({ required: false })
        date_registered: Date;

    getDescription?() {
        return `${this.name}, age ${this.age}`;
    }
}

initialiseMeta(TestModel);

let testData: Array<Partial<TestModel>> = [
    {
        id: 1,
        name: 'John Doe',
        age: 20,
        gender: 'male',
        newsletter: true,
        date_registered: new Date('2016-05-26')
    },
    {
        id: 2,
        name: 'Jane Doe',
        age: 23,
        gender: 'female',
        newsletter: true,
        date_registered: new Date('2017-01-01')
    },
    {
        id: 3,
        name: 'Felix The Cat',
        age: 3,
        gender: 'male',
        newsletter: false,
        date_registered: new Date('2016-12-03')
    },
    {
        id: 4,
        name: 'Rambo',
        age: 45,
        gender: 'male',
        newsletter: true,
        date_registered: new Date('2015-06-11')
    },
    {
        id: 5,
        name: 'Frostella the Snowlady',
        age: 28,
        gender: 'female',
        newsletter: false,
        date_registered: new Date('2016-12-25')
    }
];

function getReadOpts(options?: object) {
    return Object.assign({}, DEFAULT_READ_OPTIONS, options);
}

describe('rev.backends.inmemory', () => {

    let backend: InMemoryBackend;
    let loadResult: ModelOperationResult<TestModel>;
    let createResult: ModelOperationResult<TestModel>;
    let createResult2: ModelOperationResult<TestModel>;
    let readResult: ModelOperationResult<TestModel>;

    beforeEach(() => {
        backend = new InMemoryBackend();
        loadResult = new ModelOperationResult<TestModel>({operation: 'load'});
        createResult = new ModelOperationResult<TestModel>({operation: 'create'});
        createResult2 = new ModelOperationResult<TestModel>({operation: 'create'});
        readResult = new ModelOperationResult<TestModel>({operation: 'read'});
    });

    describe('initial state', () => {

        it('read() returns an empty list', () => {
            return backend.read(TestModel, {}, readResult, getReadOpts())
                .then(() => {
                    expect(readResult.result).to.be.undefined;
                    expect(readResult.results).to.be.instanceOf(Array);
                    expect(readResult.results.length).to.equal(0);
                });
        });

    });

    describe('load()', () => {

        it('populates InMemoryBackend._storage with data', () => {
            return backend.load(TestModel, testData, loadResult)
                .then(() => {
                    expect(backend._storage['TestModel']).to.equal(testData);
                });
        });

        it('rejects if passed data is not an array of objects', () => {
            let badData = ['a', 'b', 'b', 1, 2, 3];
            return expect(backend.load(TestModel, badData as any, loadResult))
                .to.be.rejectedWith('data must be an array of objects');
        });

    });

    describe('create()', () => {

        it('stores model data as a plain object and returns a new model instance', () => {
            let model = new TestModel({
                name: 'test model',
                age: 20
            });
            return backend.create(model, createResult, DEFAULT_CREATE_OPTIONS)
                .then((res) => {
                    expect(backend._storage['TestModel']).to.deep.equal([
                        {
                            name: 'test model',
                            age: 20
                        }
                    ]);
                    expect(res.results).to.be.undefined;
                    expect(res.result).to.be.instanceof(TestModel);
                    expect(res.result).to.not.equal(model);
                    expect(res.result.name).to.equal(model.name);
                    expect(res.result.age).to.equal(model.age);
                    expect(res.result.gender).to.be.undefined;
                });
        });

        it('stores multiple records', () => {
            let model1 = new TestModel({
                name: 'test model 1',
                age: 21
            });
            let model2 = new TestModel({
                name: 'test model 2',
                age: 22
            });
            return Promise.all([
                backend.create(model1, createResult, DEFAULT_CREATE_OPTIONS),
                backend.create(model2, createResult2, DEFAULT_CREATE_OPTIONS)
            ])
                .then((res) => {
                    expect(backend._storage['TestModel']).to.deep.equal([
                        {
                            name: 'test model 1',
                            age: 21
                        },
                        {
                            name: 'test model 2',
                            age: 22
                        }
                    ]);
                    expect(res[0].result).to.be.instanceof(TestModel);
                    expect(res[1].result).to.be.instanceof(TestModel);
                    expect(res[0].result).to.not.equal(model1);
                    expect(res[1].result).to.not.equal(model2);
                    expect(res[0].result.name).to.equal(model1.name);
                    expect(res[1].result.name).to.equal(model2.name);
                });
        });

    });

    describe('read() - with no data', () => {

        it('returns a successful, empty result when where clause = {}', () => {
            return backend.read(TestModel, {}, readResult, getReadOpts())
                .then((res) => {
                    expect(res.success).to.be.true;
                    expect(res.result).to.be.undefined;
                    expect(res.results).to.deep.equal([]);
                });
        });

        it('returns a successful, empty result when where clause sets a filter', () => {
            return backend.read(TestModel, { name: { $like: '% Doe' } }, readResult, getReadOpts())
                .then((res) => {
                    expect(res.success).to.be.true;
                    expect(res.result).to.be.undefined;
                    expect(res.results).to.deep.equal([]);
                });
        });

    });

    describe('read() - with data', () => {

        beforeEach(() => {
            return backend.load(TestModel, testData, loadResult);
        });

        it('returns all records when where clause = {}', () => {
            return backend.read(TestModel, {}, readResult, getReadOpts())
                .then((res) => {
                    expect(res.success).to.be.true;
                    expect(res.result).to.be.undefined;
                    expect(res.results).to.have.length(5);
                    expect(res.results[0]).to.be.instanceof(TestModel);
                    expect(res.results[1]).to.be.instanceof(TestModel);
                    expect(res.results[2]).to.be.instanceof(TestModel);
                    expect(res.results[0].id).to.equal(1);
                    expect(res.results[1].id).to.equal(2);
                    expect(res.results[2].id).to.equal(3);
                });
        });

        it('returns filtered records when where clause is set', () => {
            return backend.read(TestModel, {
                name: { $like: '% Doe' }
            }, readResult, getReadOpts())
                .then((res) => {
                    expect(res.success).to.be.true;
                    expect(res.result).to.be.undefined;
                    expect(res.results).to.have.length(2);
                    expect(res.results[0].name).to.equal('John Doe');
                    expect(res.results[1].name).to.equal('Jane Doe');
                });
        });

        it('returns limited number of records when limit is set', () => {
            return backend.read(TestModel, {}, readResult, getReadOpts({
                limit: 3
            }))
                .then((res) => {
                    expect(res.success).to.be.true;
                    expect(res.result).to.be.undefined;
                    expect(res.results).to.have.length(3);
                    expect(res.results[0].id).to.equal(1);
                    expect(res.results[1].id).to.equal(2);
                    expect(res.results[2].id).to.equal(3);
                });
        });

        it('offset option works as expected', () => {
            return backend.read(TestModel, {}, readResult, getReadOpts({
                offset: 2
            }))
                .then((res) => {
                    expect(res.success).to.be.true;
                    expect(res.result).to.be.undefined;
                    expect(res.results).to.have.length(3);
                    expect(res.results[0].id).to.equal(3);
                    expect(res.results[1].id).to.equal(4);
                    expect(res.results[2].id).to.equal(5);
                });
        });

        it('limit and offset work together', () => {
            return backend.read(TestModel, {}, readResult, getReadOpts({
                offset: 3,
                limit: 1
            }))
                .then((res) => {
                    expect(res.success).to.be.true;
                    expect(res.result).to.be.undefined;
                    expect(res.results).to.have.length(1);
                    expect(res.results[0].id).to.equal(4);
                });
        });

        it('out of range limit and offset do not cause errors', () => {
            Promise.all([
                backend.read(TestModel, {}, readResult, getReadOpts({
                    offset: 100,
                    limit: 40
                })),
                backend.read(TestModel, {}, readResult, getReadOpts({
                    offset: 0,
                    limit: 40
                }))
            ]).then((res) => {
                expect(res[0].success).to.be.true;
                expect(res[1].success).to.be.true;
            });
        });

    });

});
