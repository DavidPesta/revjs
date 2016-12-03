
export class ValidationError extends Error {

    constructor(
        public field: string,
        public failedValidators: string[] = []) {

        super(`ValidationError: Field '${field}' failed validation. [${failedValidators}]`);

    }
}