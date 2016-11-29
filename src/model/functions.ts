import { IModel } from './';
import { IValidationOptions } from '../fields';
import { ICreateOptions, IReadOptions, IUpdateOptions, IRemoveOptions } from './';
import * as storage from '../storage';

export function validate<T extends IModel>(model: T, options?: IValidationOptions) {
    if (typeof model != 'object') {
        throw new TypeError('validate() vals must be an object');
    }
    for (let field of model.__meta__.fields) {
        field.validateValue(model[field.name], options);
        // TODO: Possibly check for extra fields not in __meta__?
        // TODO: Async Validation
    }
}

export function create<T extends IModel>(model: T, options?: ICreateOptions): Promise<T> {
    if (!model) {
        throw new Error('create() requires the \'model\' parameter');
    }
    if (typeof model != 'object') {
        throw new TypeError('model must be an object'); //  TODO: Check that __meta__ exists
    }
    if (model.__meta__.singleton) {
        throw new Error('create() cannot be called on singleton models');
    }

    validate<T>(model, options ? options.validation : null);
    let store = storage.get(model.__meta__.storage);
    if (!storage) {
        throw new Error('create() error - model storage \'${vals.__meta__.storage}\' is not configured');
    }
    return store.create<T>(model, options);
}

export function update<T extends IModel>(model: T, where?: any, options?: IUpdateOptions): Promise<boolean> {
    if (!model) {
        throw new Error('update() requires the \'model\' parameter');
    }
    if (typeof model != 'object') {
        throw new TypeError('model must be an object'); //  TODO: Check that __meta__ exists
    }

    // TODO: Get existing vals when appropriate

    validate<T>(model, options ? options.validation : null);
    let store = storage.get(model.__meta__.storage);
    if (!storage) {
        throw new Error('update() error - model storage \'${vals.__meta__.storage}\' is not configured');
    }
    return store.update<T>(model, where, options);
}

export function read<T extends IModel>(model: T, where?: any, options?: IReadOptions): Promise<T[]> {
    let store = storage.get(model.__meta__.storage);
    if (!storage) {
        throw new Error('read() error - model storage \'${vals.__meta__.storage}\' is not configured');
    }
    return store.read<T>(model, where, options);
}

export function remove<T extends IModel>(model: T, where?: any, options?: IRemoveOptions): Promise<T[]> {
    let store = storage.get(model.__meta__.storage);
    if (!storage) {
        throw new Error('remove() error - model storage \'${vals.__meta__.storage}\' is not configured');
    }
    return store.read<T>(model, where, options);
}
