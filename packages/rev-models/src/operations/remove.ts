
import { IModel, IModelManager, IRemoveOptions, IRemoveMeta } from '../models/types';
import { ModelOperationResult } from './operationresult';
import { IModelOperation } from './operation';
import { getModelPrimaryKeyQuery } from './utils';

export const DEFAULT_REMOVE_OPTIONS: IRemoveOptions = {};

export function remove<T extends IModel>(manager: IModelManager, model: T, options?: IRemoveOptions): Promise<ModelOperationResult<T, IRemoveMeta>> {
    return new Promise((resolve, reject) => {

        let meta = manager.getModelMeta(model);
        if (!meta.stored) {
            throw new Error('Cannot call remove() on models with stored: false');
        }

        let backend = manager.getBackend(meta.backend);
        let opts = Object.assign({}, DEFAULT_REMOVE_OPTIONS, options);

        if (!opts.where || typeof opts.where != 'object') {
            if (!meta.primaryKey || meta.primaryKey.length == 0) {
                throw new Error('remove() must be called with a where clause for models with no primaryKey');
            }
            else {
                opts.where = getModelPrimaryKeyQuery(model, meta);
            }
        }

        let operation: IModelOperation = {
            operation: 'remove',
            where: opts.where
        };
        let operationResult = new ModelOperationResult<T, IRemoveMeta>(operation);
        backend.remove<T>(manager, model, opts.where, operationResult, opts)
            .then((res) => {
                resolve(res);
            })
            .catch((err) => {
                reject(err);
            });
    });
}
