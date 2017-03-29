import { Model } from '../models/model';
import { IWhereQuery } from '../queries/query';
import { ModelOperationResult } from './operationresult';
import { checkIsModelConstructor } from '../models/utils';
import { checkMetadataInitialised } from '../models/meta';
import * as backends from '../backends';
import { IModelOperation } from './operation';

export interface IReadOptions {
    limit?: number;
    offset?: number;
    fields?: string[];
}

export function modelRead<T extends Model>(model: new() => T, where?: IWhereQuery, options?: IReadOptions): Promise<ModelOperationResult<T>> {
    return new Promise((resolve, reject) => {

        checkIsModelConstructor(model);
        checkMetadataInitialised(model);
        let meta = model.meta;
        if (meta.singleton && where) {
            throw new Error('read() cannot be called with a where clause for singleton models');
        }

        let backend = backends.get(meta.backend);
        let operation: IModelOperation = {
            name: 'read',
            where: where
        };
        let operationResult = new ModelOperationResult<T>(operation);
        backend.read(model, where || {}, operationResult, options)
            .then(() => {
                resolve(operationResult);
            })
            .catch((err) => {
                reject(err);
            });
    });
}