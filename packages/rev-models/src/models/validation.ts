
import { VALIDATION_MESSAGES as msg } from '../fields/validationmsg';
import { IModel, IModelOperation } from './index';
import { checkIsModelInstance, checkMetadataInitialised } from './utils';
import { IModelMeta } from './meta';

export interface IValidationOptions {
    timeout?: number;
}

export interface IFieldError {
    message: string;
    code?: string;
    [key: string]: any;
}

export interface IModelError {
    message: string;
    code?: string;
    [key: string]: any;
}

export class ModelValidationResult {
    public valid: boolean;
    public fieldErrors: {
        [fieldName: string]: IFieldError[]
    };
    public modelErrors: IModelError[];
    public validationFinished: boolean;

    constructor(valid?: boolean) {
        if (typeof valid == 'undefined') {
            this.valid = true;
        }
        else {
            if (typeof valid != 'boolean') {
                throw new Error('ValidationError: First argument to the ValidationResult constructor must be a boolean.');
            }
            this.valid = valid;
        }
        this.fieldErrors = {};
        this.modelErrors = [];
        this.validationFinished = true;
    }

    public addFieldError(fieldName: string, message: string, code?: string, data?: Object) {
        if (!fieldName) {
            throw new Error(`ValidationError: You must specify fieldName when adding a field error.`);
        }
        this.valid = false;
        if (!(fieldName in this.fieldErrors)) {
            this.fieldErrors[fieldName] = [];
        }
        let fieldError: IFieldError = {
            message: message
        };
        if (code) {
            fieldError.code = code;
        }
        if (data) {
            if (typeof data != 'object') {
                throw new Error(`ValidationError: You cannot add non-object data to a validation error (field: "${fieldName}").`);
            }
            Object.assign(fieldError, data);
        }
        this.fieldErrors[fieldName].push(fieldError);
    }

    public addModelError(message: string, code?: string, data?: Object) {
        if (!message) {
            throw new Error(`ValidationError: You must specify a message for a model error.`);
        }
        this.valid = false;
        let modelError: IModelError = {
            message: message
        };
        if (code) {
            modelError.code = code;
        }
        if (data) {
            if (typeof data != 'object') {
                throw new Error(`ValidationError: You cannot add non-object data to a model validation error.`);
            }
            Object.assign(modelError, data);
        }
        this.modelErrors.push(modelError);
    }
}

// TODO: validate() function that does not require meta (gets it from the registry)

export function validateModel<T extends IModel>(model: T, meta: IModelMeta<T>, operation: IModelOperation, options?: IValidationOptions): Promise<ModelValidationResult> {
    return new Promise((resolve, reject) => {
        checkIsModelInstance(model);
        checkMetadataInitialised(meta);
        if (!operation || typeof operation != 'object' || ['create', 'update'].indexOf(operation.type) == -1) {
            throw new Error('validateModel() - invalid operation specified - should either be a create or update operation.');
        }
        let timeout = options && options.timeout ? options.timeout : 5000;
        let result = new ModelValidationResult();
        // First, check if model contains fields that are not in meta
        for (let field in model) {
            if (!(field in meta.fieldsByName)) {
                result.addModelError(msg.extra_field(field), 'extra_field');
            }
        }
        // Trigger field validation
        let promises: Array<Promise<ModelValidationResult>> = [];
        for (let field of meta.fields) {
            promises.push(field.validate(model, meta, operation, result, options));
        }
        Promise.all(promises)
            .then(() => {
                // Trigger model validation
                if (meta.validate) {
                    meta.validate(model, operation, result, options);
                }
                if (meta.validateAsync) {
                    return meta.validateAsync(model, operation, result, options);
                }
            })
            .then(() => {
                resolve(result);
            })
            .catch((err) => {
                reject(err);
            });
        setTimeout(() => {
            reject(new Error(`validateModel() - timed out after ${timeout} milliseconds`));
        }, timeout);
    });
}

export function validateModelRemoval<T extends IModel>(meta: IModelMeta<T>, operation: IModelOperation, options?: IValidationOptions): Promise<ModelValidationResult> {
    return new Promise((resolve, reject) => {
        checkMetadataInitialised(meta);
        if (!operation || typeof operation != 'object' || operation.type != 'remove') {
            throw new Error('validateModelRemoval() - invalid operation specified - operation.type must be "remove".');
        }
        if (!operation.where || typeof operation.where != 'object') {
            throw new Error('validateModelRemoval() - invalid operation where clause specified.');
        }
        let timeout = options && options.timeout ? options.timeout : 5000;
        let result = new ModelValidationResult();

        if (meta.validateRemoval) {
            meta.validateRemoval(operation, result, options);
        }
        if (meta.validateRemovalAsync) {
            meta.validateRemovalAsync(operation, result, options)
                .then(() => {
                    resolve(result);
                })
                .catch((err) => {
                    reject(err);
                });
        }
        else {
            resolve(result);
        }
        setTimeout(() => {
            reject(new Error(`validateRemoval() - timed out after ${timeout} milliseconds`));
        }, timeout);
    });
}
