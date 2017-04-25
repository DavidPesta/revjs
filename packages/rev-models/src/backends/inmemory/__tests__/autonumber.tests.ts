
import { expect } from 'chai';

import { ModelRegistry } from '../../../registry/registry';
import { InMemoryBackend } from '../backend';
import { ModelOperationResult } from '../../../operations/operationresult';
import { DEFAULT_CREATE_OPTIONS, ICreateMeta } from '../../../operations/create';
import * as d from '../../../decorators';
import { Model } from '../../../models/model';
import { IUpdateMeta } from '../../../operations/update';

export class TestModel extends Model {
    @d.AutoNumberField({ primaryKey: true })
        id: number;
    @d.TextField()
        name: string;
}
describe('rev.backends.inmemory', () => {

    let registry: ModelRegistry;
    let backend: InMemoryBackend;
    let createResult: ModelOperationResult<TestModel, ICreateMeta>;
    let createResult2: ModelOperationResult<TestModel, ICreateMeta>;
    let loadResult: ModelOperationResult<TestModel, null>;
    let updateResult: ModelOperationResult<TestModel, IUpdateMeta>;

    beforeEach(() => {
        registry = new ModelRegistry();
        backend = new InMemoryBackend();
        registry.registerBackend('default', backend);
        registry.register(TestModel);
        createResult = new ModelOperationResult<TestModel, ICreateMeta>({operation: 'create'});
        createResult2 = new ModelOperationResult<TestModel, ICreateMeta>({operation: 'create'});
        loadResult = new ModelOperationResult<TestModel, null>({operation: 'load'});
        updateResult = new ModelOperationResult<TestModel, IUpdateMeta>({operation: 'update'});
    });

    describe('AutoNumberField', () => {

        it('new records get sequential numbers starting from 1', () => {
            let model1 = new TestModel({
                name: 'record 1',
            });
            let model2 = new TestModel({
                name: 'record 2',
            });
            return Promise.all([
                backend.create(registry, model1, createResult, DEFAULT_CREATE_OPTIONS),
                backend.create(registry, model2, createResult2, DEFAULT_CREATE_OPTIONS)
            ])
                .then((res) => {
                    expect(res[0].result).to.be.instanceof(TestModel);
                    expect(res[0].result.id).to.equal(1);
                    expect(res[1].result).to.be.instanceof(TestModel);
                    expect(res[1].result.id).to.equal(2);
                });
        });

        it('create() - values provided for AutoNumberField are ignored', () => {
            let model1 = new TestModel({
                id: 99,
                name: 'record 1',
            });
            let model2 = new TestModel({
                id: 227,
                name: 'record 2',
            });
            return Promise.all([
                backend.create(registry, model1, createResult, DEFAULT_CREATE_OPTIONS),
                backend.create(registry, model2, createResult2, DEFAULT_CREATE_OPTIONS)
            ])
                .then((res) => {
                    expect(res[0].result).to.be.instanceof(TestModel);
                    expect(res[0].result.id).to.equal(1);
                    expect(res[1].result).to.be.instanceof(TestModel);
                    expect(res[1].result.id).to.equal(2);
                });
        });


        it('update() - values provided for AutoNumberField are ignored', () => {
            let testData = [
                {
                    name: 'record 1',
                },
                {
                    name: 'record 2',
                }
            ];

            return backend.load(registry, TestModel, testData, loadResult)
                .then(() => {
                    expect(backend._storage['TestModel'])
                        .to.deep.equal([
                            {
                                id: 1,
                                name: 'record 1',
                            },
                            {
                                id: 2,
                                name: 'record 2',
                            }
                        ]);
                    return backend.update(registry,
                        new TestModel({
                            id: -10, name: 'Frank'
                        }),
                        {}, updateResult, {});
                })
                .then(() => {
                    expect(backend._storage['TestModel'])
                        .to.deep.equal([
                            {
                                id: 1,
                                name: 'Frank',
                            },
                            {
                                id: 2,
                                name: 'Frank',
                            }
                        ]);
                });
        });

    });

});
