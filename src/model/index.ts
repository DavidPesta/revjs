
// import ValidationError from '../errors/validation';
import { FieldType } from '../fields';
import { ModelRegistry } from './registry';

export interface IModelOptions {
    singleton: boolean;
    storage: string;
}

export interface IModelMeta {
    name: string;
    label: string;
    fields: {
        [fieldName: string]: FieldType
    };
    fieldsOrder: Array<string>;
    registry: ModelRegistry;
    singleton: boolean;
    storage: string;
}

export interface IModel {
    __meta__: IModelMeta;
    // create, update, etc
}

export default class Model {

    constructor(options: any) {
        // TODO
        // this.registry = null;
    }

    /*validateValues(vals, checkAllValidators = true) {
        if (typeof vals != "object")
            throw new TypeError("vals must be an object");
        for (let fieldName in vals) {
            if (!(fieldName in this.fields)) {
                throw new ValidationError(fieldName, ["extraField"]);
            }
            else {
                this.fields[fieldName].validateValue(vals[fieldName]);
            }
        }
    }

    create(vals, options) {
        options = options || {};
        if (!vals)
            throw new Error("create() requires the 'vals' parameter");
        if (typeof vals != "object")
            throw new TypeError("vals must be an object");
        if (this.meta.singleton)
            throw new Error("create() cannot be called on singleton models");

        this.validateValues(vals);
        return this.registry.storage.create(this, vals, options);
    }

    update(vals, where, options) {
        where = where || null;
        options = options || {};
        if (!vals)
            throw new Error("update() requires the 'vals' parameter");
        if (typeof vals != "object")
            throw new TypeError("vals must be an object");
        if (!this.meta.singleton && !where)
            throw new Error("update() requires the 'where' parameter for non-singleton models");

        // TODO: Get existing vals when appropriate
        // vals = Object.assign(origVals, vals)

        this.validateValues(vals);
        return this.registry.storage.update(this, vals, where, options);
    }

    get(where, options) {
        options = options || {};
        if (!this.meta.singleton && !where) {
            throw new Error("get() requires the 'where' parameter for non-singleton models");
        }
        return this.registry.storage.get(this, where, options);
    }*/
}
