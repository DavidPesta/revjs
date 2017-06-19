
import { Model } from '../models/model';
import { IValidationOptions, validate } from './validate';
import { ModelOperationResult, IOperationMeta } from './operationresult';
import { ModelRegistry } from '../registry/registry';
import { IModelOperation } from './operation';

export interface IExecOptions {
    validation?: IValidationOptions;
    validate?: boolean;
}

export interface IExecMeta extends IOperationMeta {
    // For future use
}

export interface IExecArgs {
    [key: string]: any;
}

export const DEFAULT_EXEC_OPTIONS: IExecOptions = {
    validate: true
};

export function exec<T extends Model>(registry: ModelRegistry, model: T, method: string, argObj?: IExecArgs, options?: IExecOptions): Promise<ModelOperationResult<T, IExecMeta>> {
    return new Promise((resolve, reject) => {

        if (typeof model != 'object' || !(model instanceof Model)) {
            throw new Error('Specified model is not a Model instance');
        }
        if (!method || typeof method != 'string') {
            throw new Error('Specified method name is not valid');
        }

        let meta = registry.getModelMeta(model);
        let opts: IExecOptions = Object.assign({}, DEFAULT_EXEC_OPTIONS, options);

        let operation: IModelOperation = {
            operation: method
        };
        let operationResult = new ModelOperationResult<T, IExecMeta>(operation);

        let promise = Promise.resolve();
        if (opts.validate) {
            promise = validate(registry, model, operation, opts.validation ? opts.validation : null)
                .then((validationResult) => {
                    if (!validationResult.valid) {
                        throw operationResult.createValidationError(validationResult);
                    }
                    else {
                        operationResult.validation = validationResult;
                    }
                });
        }

        promise
            .then(() => {
                if (model[method]) {
                    if (typeof model[method] != 'function') {
                        throw new Error(`${model.constructor.name}.${method} is not a function`);
                    }
                    return model[method].call(model, argObj);
                }
                else {
                    let backend = registry.getBackend(meta.backend);
                    return backend.exec(registry, model, method, argObj, operationResult, opts);
                }
            })
            .then((res) => {
                resolve(res);
            })
            .catch((err) => {
                reject(err);
            });

    });

}
