
import { IModel, IModelMeta, IModelManager, IReadOptions, IReadMeta } from '../models/types';
import { ModelOperationResult } from './operationresult';
import { IModelOperation } from './operation';

export const DEFAULT_READ_OPTIONS: IReadOptions = {
    limit: 20,
    offset: 0
};

export function read<T extends IModel>(manager: IModelManager, model: new() => T, where?: object, options?: IReadOptions): Promise<ModelOperationResult<T, IReadMeta>> {
    return new Promise((resolve, reject) => {

        let meta = manager.getModelMeta(model) as IModelMeta<T>;
        let backend = manager.getBackend(meta.backend);
        let operation: IModelOperation = {
            operation: 'read',
            where: where
        };
        let operationResult = new ModelOperationResult<T, IReadMeta>(operation);
        if (options && options.order_by) {
            validateOrderBy(model, meta, options.order_by);
        }
        let opts = Object.assign({}, DEFAULT_READ_OPTIONS, options);
        backend.read(manager, model, where || {}, operationResult, opts)
            .then((res) => {
                resolve(res);
            })
            .catch((err) => {
                reject(err);
            });
    });
}

export function validateOrderBy<T extends IModel>(model: new() => T, meta: IModelMeta<T>, order_by: any) {

    if (typeof order_by != 'object'
            || !(order_by instanceof Array)
            || order_by.length == 0) {
        throw new Error('read(): order_by: must be an array with at least one item');
    }

    for (let ob_entry of order_by) {
        if (typeof ob_entry != 'string') {
            throw new Error('read(): order_by: array contains a non-string value');
        }
        let ob_tokens = ob_entry.split(' ');
        if (ob_tokens.length > 2
            || (ob_tokens.length == 2 && ['asc', 'desc'].indexOf(ob_tokens[1]) == -1)) {
            throw new Error(`read(): order_by: invalid entry '${ob_entry}'`);
        }
        if (!(ob_tokens[0] in meta.fieldsByName)) {
            throw new Error(`read(): order_by: field '${ob_tokens[0]}' does not exist in model`);
        }
    }
}
