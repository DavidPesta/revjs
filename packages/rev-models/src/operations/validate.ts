import { IModel } from '../models/model';
import { IModelOperation } from './operation';
import { ModelValidationResult } from '../validation/validationresult';
import { VALIDATION_MESSAGES as msg } from '../validation/validationmsg';
import { ModelManager } from '../models/manager';

export interface IValidationOptions {
    timeout?: number;
}

export interface IValidationContext {
    operation: IModelOperation;
    result: ModelValidationResult;
    options?: IValidationOptions;
}

export function validate<T extends IModel>(manager: ModelManager, model: T, operation?: IModelOperation, options?: IValidationOptions): Promise<ModelValidationResult> {
    return new Promise((resolve, reject) => {

        let meta = manager.getModelMeta(model);

        let timeout = options && options.timeout ? options.timeout : 5000;
        let result = new ModelValidationResult();

        // First, check if model contains fields that are not in meta
        for (let field of Object.keys(model)) {
            if (!(field in meta.fieldsByName)) {
                result.addModelError(msg.extra_field(field), 'extra_field');
            }
        }

        // Trigger field validation
        let promises: Array<Promise<any>> = [];
        for (let field of meta.fields) {
            promises.push(field.validate(manager, model, operation, result, options));
        }
        Promise.all(promises)
            .then(() => {
                // Trigger model validation
                model.validate({ operation, result, options });
                return model.validateAsync({ operation, result, options });
            })
            .then(() => {
                resolve(result);
            })
            .catch((err) => {
                reject(err);
            });

        setTimeout(() => {
            reject(new Error(`validate() - timed out after ${timeout} milliseconds`));
        }, timeout);
    });
}
