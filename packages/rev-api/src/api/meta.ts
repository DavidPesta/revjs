
import { IModel, IModelMeta } from 'rev-models/lib/models';
import { checkMetadataInitialised } from 'rev-models/lib/models/utils';
import * as fields from 'rev-models/lib/fields';

export interface IApiMethodContext {
    TODO_add_useful_context: string;
}

export interface IApiMethod {
    args: Array<fields.Field | string>;
    handler: (context: IApiMethodContext, ...args: any[]) => Promise<any>;
}

export interface IApiMetaDefinition {
    methods: {
        [name: string]: IApiMethod | boolean;
    } | string[] | 'all';
}

export interface IApiMeta {
    methods: {
        [name: string]: IApiMethod | boolean;
    };
}

let modelOps = ['create', 'read', 'update', 'remove'];

export function initialiseApiMeta<T extends IModel>(
        modelMeta: IModelMeta<T>,
        apiMeta: IApiMetaDefinition): IApiMeta {

    checkMetadataInitialised(modelMeta);

    // Set up API Metadata
    if (!apiMeta || !apiMeta.methods
        || (typeof apiMeta.methods != 'object'
            && apiMeta.methods != 'all')) {
        throw new Error(`ApiMetadataError: API metadata must include a valid 'methods' key.`);
    }

    if (apiMeta.methods == 'all') {
        apiMeta.methods = {};
        for (let methodName of modelOps) {
            apiMeta.methods[methodName] = true;
        }
    }
    else if (apiMeta.methods instanceof Array) {
        let methods = apiMeta.methods;
        apiMeta.methods = {};
        for (let methodName of methods) {
            apiMeta.methods[methodName] = true;
        }
    }

    for (const methodName in apiMeta.methods) {
        const method = apiMeta.methods[methodName];

        if (!method || (typeof method != 'boolean' && typeof method != 'object')) {
            throw new Error(`ApiMetadataError: Invalid method definition for '${methodName}'.`);
        }

        if (typeof method == 'boolean') {  // System method
            if (modelOps.indexOf(methodName) < 0) {
                throw new Error(`ApiMetadataError: Method '${methodName}' is not recognised.`);
            }
        }
        else {  // Custom method
            if (!method.args || !method.handler
                    || typeof method.args != 'object' || !(method.args instanceof Array)
                    || typeof method.handler != 'function') {
                throw new Error('ApiMetadataError: Custom API methods must define an args array and a handler function');
            }
            // Check and convert method args to an array of Fields
            for (let i = 0; i < method.args.length; i++) {
                let arg = method.args[i];
                if (typeof arg == 'string') {
                    if (!(arg in modelMeta.fieldsByName)) {
                        throw new Error(`ApiMetadataError: Field '${arg}' does not exist in model '${modelMeta.name}'.`);
                    }
                    else {
                        method.args[i] = modelMeta.fieldsByName[arg];
                    }
                }
                else if (!(arg instanceof fields.Field)) {
                    throw new Error('ApiMetadataError: API method args must either be an instance of a Field or a string matching a field on the corresponding model.');
                }
            }
        }
    }

    return apiMeta as IApiMeta;
}
