
import { expect } from 'chai';
import * as fld from '../../fields';
import * as vld from '../validators';
import { VALIDATION_MESSAGES as msg } from '../validationmsg';

import { ModelValidationResult } from '../validationresult';
import { IModelOperation } from '../../operations/operation';
import { IValidationOptions } from '../../operations/validate';
import { Model } from '../../models/model';
import { ModelManager } from '../../models/manager';
import { InMemoryBackend } from '../../backends/inmemory/backend';

class TestModel extends Model {
    id: any;
    name: any;
    age: any;
    gender: any;
    hobbies: any;
    isAwesome: any;
    registered: any;
}

let idField = new fld.IntegerField('id');
let nameField = new fld.TextField('name', {
    minLength: 5, maxLength: 10,
    minValue: 'ddd', maxValue: 'jjj',
    regEx: /^abc\d.$/  // abc[number][anything]
});
let ageField = new fld.NumberField('age', {
    minValue: 18, maxValue: 30
});
let genderField = new fld.SelectionField('gender', {
        selection: [
            ['male', 'Male'],
            ['female', 'Female']
        ]
    });
let hobbiesField = new fld.SelectionField('hobbies', {
        selection: [
            ['ironing', 'Ironing'],
            ['extreme_ironing', 'Extreme Ironing'],
            ['naked_ironing', 'Naked Ironing']
        ],
        multiple: true
    });
let booleanField = new fld.BooleanField('isAwesome');
let dateField = new fld.DateTimeField('registered');

let manager = new ModelManager();
manager.registerBackend('default', new InMemoryBackend());
manager.register(TestModel, {
    fields: [
        idField, nameField, ageField, genderField,
        booleanField, dateField
    ]
});

let op: IModelOperation = {
    operation: 'create'
};
let opts: IValidationOptions = {
    timeout: 200
};

function expectFailure(validatorName: string, fieldName: string, message: string, vResult: ModelValidationResult) {
    expect(vResult.valid).to.equal(false);
    expect(vResult.fieldErrors[fieldName].length).to.equal(1);
    expect(vResult.fieldErrors[fieldName][0]).to.deep.equal({
        message: message,
        code: validatorName
    });
}

describe('rev.fields.validators', () => {
    let vResult: ModelValidationResult;

    beforeEach(() => {
        vResult = new ModelValidationResult();
    });

    describe('requiredValidator()', () => {

        it('returns valid = true when a value is specified', () => {
            let test = new TestModel();
            test.name = 'flibble';
            vld.requiredValidator(manager, test, nameField, op, vResult, opts);
            expect(vResult.valid).to.equal(true);
        });

        it('returns valid = false when a value is not defined', () => {
            let test = new TestModel();
            vld.requiredValidator(manager, test, nameField, op, vResult, opts);
            expectFailure('required', nameField.name, msg.required(nameField.name), vResult);
        });

        it('returns valid = false when a value is null', () => {
            let test = new TestModel();
            test.name = null;
            vld.requiredValidator(manager, test, nameField, op, vResult, opts);
            expectFailure('required', nameField.name, msg.required(nameField.name), vResult);
        });

    });

    describe('stringValidator()', () => {

        it('returns valid = true when a value is not defined', () => {
            let test = new TestModel();
            vld.stringValidator(manager, test, nameField, op, vResult, opts);
            expect(vResult.valid).to.equal(true);
        });

        it('returns valid = true when a value is null', () => {
            let test = new TestModel();
            test.name = null;
            vld.stringValidator(manager, test, nameField, op, vResult, opts);
            expect(vResult.valid).to.equal(true);
        });

        it('returns valid = true when a string is specified', () => {
            let test = new TestModel();
            test.name = 'flibble';
            vld.stringValidator(manager, test, nameField, op, vResult, opts);
            expect(vResult.valid).to.equal(true);
        });

        it('returns valid = false when a value is not a string', () => {
            let test = new TestModel();
            test.name = 22;
            vld.stringValidator(manager, test, nameField, op, vResult, opts);
            expectFailure('not_a_string', nameField.name, msg.not_a_string(nameField.name), vResult);
        });

    });

    describe('stringEmptyValidator()', () => {

        it('returns valid = true when a value is not specified', () => {
            let test = new TestModel();
            vld.stringEmptyValidator(manager, test, nameField, op, vResult, opts);
            expect(vResult.valid).to.equal(true);
        });

        it('returns valid = true when a value is null', () => {
            let test = new TestModel();
            test.name = null;
            vld.stringEmptyValidator(manager, test, nameField, op, vResult, opts);
            expect(vResult.valid).to.equal(true);
        });

        it('returns valid = true when a string is specified', () => {
            let test = new TestModel();
            test.name = 'flibble';
            vld.stringEmptyValidator(manager, test, nameField, op, vResult, opts);
            expect(vResult.valid).to.equal(true);
        });

        it('returns valid = true for a string of spaces', () => {
            let test = new TestModel();
            test.name = '    ';
            vld.stringEmptyValidator(manager, test, nameField, op, vResult, opts);
            expect(vResult.valid).to.equal(true);
        });

        it('returns valid = true for a string with other whitespace characters', () => {
            let test = new TestModel();
            test.name = '  \r\n \n  \t  ';
            vld.stringEmptyValidator(manager, test, nameField, op, vResult, opts);
            expect(vResult.valid).to.equal(true);
        });

        it('returns valid = false for a zero-length string', () => {
            let test = new TestModel();
            test.name = '';
            vld.stringEmptyValidator(manager, test, nameField, op, vResult, opts);
            expectFailure('string_empty', nameField.name, msg.string_empty(nameField.name), vResult);
        });

    });

    describe('regExValidator()', () => {

        it('returns valid = true when a value is not defined', () => {
            let test = new TestModel();
            vld.regExValidator(manager, test, nameField, op, vResult, opts);
            expect(vResult.valid).to.equal(true);
        });

        it('returns valid = true when a value is null', () => {
            let test = new TestModel();
            test.name = null;
            vld.regExValidator(manager, test, nameField, op, vResult, opts);
            expect(vResult.valid).to.equal(true);
        });

        it('returns valid = true when a string matches the regex', () => {
            let test = new TestModel();
            test.name = 'abc12';
            vld.regExValidator(manager, test, nameField, op, vResult, opts);
            expect(vResult.valid).to.equal(true);
        });

        it('returns valid = true when another string matches the regex', () => {
            let test = new TestModel();
            test.name = 'abc2d';
            vld.regExValidator(manager, test, nameField, op, vResult, opts);
            expect(vResult.valid).to.equal(true);
        });

        it('returns valid = false when a value does not match the regex', () => {
            let test = new TestModel();
            test.name = 'flibble';
            vld.regExValidator(manager, test, nameField, op, vResult, opts);
            expectFailure('no_regex_match', nameField.name, msg.no_regex_match(nameField.name), vResult);
        });

        it('returns valid = false when another value does not match the regex', () => {
            let test = new TestModel();
            test.name = 'abcd';
            vld.regExValidator(manager, test, nameField, op, vResult, opts);
            expectFailure('no_regex_match', nameField.name, msg.no_regex_match(nameField.name), vResult);
        });

    });

    describe('numberValidator()', () => {

        it('returns valid = true when a value is not defined', () => {
            let test = new TestModel();
            vld.numberValidator(manager, test, ageField, op, vResult, opts);
            expect(vResult.valid).to.equal(true);
        });

        it('returns valid = true when a value is null', () => {
            let test = new TestModel();
            test.age = null;
            vld.numberValidator(manager, test, ageField, op, vResult, opts);
            expect(vResult.valid).to.equal(true);
        });

        it('returns valid = true when a number is specified', () => {
            let test = new TestModel();
            test.age = 12.345;
            vld.numberValidator(manager, test, ageField, op, vResult, opts);
            expect(vResult.valid).to.equal(true);
        });

        it('returns valid = true when a string equivalent of a number is specified', () => {
            let test = new TestModel();
            test.age = '34.567';
            vld.numberValidator(manager, test, ageField, op, vResult, opts);
            expect(vResult.valid).to.equal(true);
        });

        it('returns valid = false when a value is a string', () => {
            let test = new TestModel();
            test.age = 'flibble';
            vld.numberValidator(manager, test, ageField, op, vResult, opts);
            expectFailure('not_a_number', ageField.name, msg.not_a_number(ageField.name), vResult);
        });

        it('returns valid = false when a value is an empty string', () => {
            let test = new TestModel();
            test.age = '';
            vld.numberValidator(manager, test, ageField, op, vResult, opts);
            expectFailure('not_a_number', ageField.name, msg.not_a_number(ageField.name), vResult);
        });

    });

    describe('integerValidator()', () => {

        it('returns valid = true when a value is not defined', () => {
            let test = new TestModel();
            vld.integerValidator(manager, test, ageField, op, vResult, opts);
            expect(vResult.valid).to.equal(true);
        });

        it('returns valid = true when a value is null', () => {
            let test = new TestModel();
            test.age = null;
            vld.integerValidator(manager, test, ageField, op, vResult, opts);
            expect(vResult.valid).to.equal(true);
        });

        it('returns valid = true when an integer is specified', () => {
            let test = new TestModel();
            test.age = 12;
            vld.integerValidator(manager, test, ageField, op, vResult, opts);
            expect(vResult.valid).to.equal(true);
        });

        it('returns valid = true when a negative integer is specified', () => {
            let test = new TestModel();
            test.age = -12;
            vld.integerValidator(manager, test, ageField, op, vResult, opts);
            expect(vResult.valid).to.equal(true);
        });

        it('returns valid = true when a string equivalent of an integer is specified', () => {
            let test = new TestModel();
            test.age = '34';
            vld.integerValidator(manager, test, ageField, op, vResult, opts);
            expect(vResult.valid).to.equal(true);
        });

        it('returns valid = false when a value is a string', () => {
            let test = new TestModel();
            test.age = 'flibble';
            vld.integerValidator(manager, test, ageField, op, vResult, opts);
            expectFailure('not_an_integer', ageField.name, msg.not_an_integer(ageField.name), vResult);
        });

        it('returns valid = false when a value is an empty string', () => {
            let test = new TestModel();
            test.age = '';
            vld.integerValidator(manager, test, ageField, op, vResult, opts);
            expectFailure('not_an_integer', ageField.name, msg.not_an_integer(ageField.name), vResult);
        });

        it('returns valid = false when a value is a float', () => {
            let test = new TestModel();
            test.age = 12.345;
            vld.integerValidator(manager, test, ageField, op, vResult, opts);
            expectFailure('not_an_integer', ageField.name, msg.not_an_integer(ageField.name), vResult);
        });

        it('returns valid = false when value is a string representation of a float', () => {
            let test = new TestModel();
            test.age = '12.345';
            vld.integerValidator(manager, test, ageField, op, vResult, opts);
            expectFailure('not_an_integer', ageField.name, msg.not_an_integer(ageField.name), vResult);
        });

    });

    describe('booleanValidator()', () => {

        it('returns valid = true when a value is not defined', () => {
            let test = new TestModel();
            vld.integerValidator(manager, test, booleanField, op, vResult, opts);
            expect(vResult.valid).to.equal(true);
        });

        it('returns valid = true when a value is null', () => {
            let test = new TestModel();
            test.isAwesome = null;
            vld.integerValidator(manager, test, booleanField, op, vResult, opts);
            expect(vResult.valid).to.equal(true);
        });

        it('returns valid = true when a boolean is specified and true', () => {
            let test = new TestModel();
            test.isAwesome = true;
            vld.booleanValidator(manager, test, booleanField, op, vResult, opts);
            expect(vResult.valid).to.equal(true);
        });

        it('returns valid = true when a boolean is specified and false', () => {
            let test = new TestModel();
            test.isAwesome = false;
            vld.booleanValidator(manager, test, booleanField, op, vResult, opts);
            expect(vResult.valid).to.equal(true);
        });

        it('returns valid = false when a value is not a boolean', () => {
            let test = new TestModel();
            test.isAwesome = 22;
            vld.booleanValidator(manager, test, booleanField, op, vResult, opts);
            expectFailure('not_a_boolean', booleanField.name, msg.not_a_boolean(booleanField.name), vResult);
        });

    });

    describe('minLengthValidator()', () => {

        // Assumes minLengh is 5

        it('returns valid = true when a string is longer than minLength', () => {
            let test = new TestModel();
            test.name = 'flibble';
            vld.minStringLengthValidator(manager, test, nameField, op, vResult, opts);
            expect(vResult.valid).to.equal(true);
        });

        it('returns valid = true when a string is equal to minLength', () => {
            let test = new TestModel();
            test.name = 'flibb';
            vld.minStringLengthValidator(manager, test, nameField, op, vResult, opts);
            expect(vResult.valid).to.equal(true);
        });

        it('returns valid = true when a string consists only of spaces', () => {
            let test = new TestModel();
            test.name = '        ';
            vld.minStringLengthValidator(manager, test, nameField, op, vResult, opts);
            expect(vResult.valid).to.equal(true);
        });

        it('returns valid = true when a string contains whitespace characters', () => {
            let test = new TestModel();
            test.name = ' \r\n \t ';
            vld.minStringLengthValidator(manager, test, nameField, op, vResult, opts);
            expect(vResult.valid).to.equal(true);
        });

        it('returns valid = true (validation bypassed) when a value is not defined', () => {
            let test = new TestModel();
            vld.minStringLengthValidator(manager, test, nameField, op, vResult, opts);
            expect(vResult.valid).to.equal(true);
        });

        it('returns valid = true (validation bypassed) when a value is not a string', () => {
            let test = new TestModel();
            test.name = 222222;
            vld.minStringLengthValidator(manager, test, nameField, op, vResult, opts);
            expect(vResult.valid).to.equal(true);
        });

        it('returns valid = false for a zero-length string', () => {
            let test = new TestModel();
            test.name = '';
            vld.minStringLengthValidator(manager, test, nameField, op, vResult, opts);
            expectFailure('min_string_length', nameField.name, msg.min_string_length(nameField.name, nameField.options.minLength), vResult);
        });

        it('returns valid = false for a short string with spaces', () => {
            let test = new TestModel();
            test.name = ' ab ';
            vld.minStringLengthValidator(manager, test, nameField, op, vResult, opts);
            expectFailure('min_string_length', nameField.name, msg.min_string_length(nameField.name, nameField.options.minLength), vResult);
        });

    });

    describe('maxLengthValidator()', () => {

        // Assumes maxLengh is 10

        it('returns valid = true when a string is shorter than maxLength', () => {
            let test = new TestModel();
            test.name = 'flibble';
            vld.maxStringLengthValidator(manager, test, nameField, op, vResult, opts);
            expect(vResult.valid).to.equal(true);
        });

        it('returns valid = true when a string is equal to maxLength', () => {
            let test = new TestModel();
            test.name = 'flibble Ji';
            vld.maxStringLengthValidator(manager, test, nameField, op, vResult, opts);
            expect(vResult.valid).to.equal(true);
        });

        it('returns valid = true when a string consists only of spaces', () => {
            let test = new TestModel();
            test.name = '        ';
            vld.maxStringLengthValidator(manager, test, nameField, op, vResult, opts);
            expect(vResult.valid).to.equal(true);
        });

        it('returns valid = true when a string contains whitespace characters', () => {
            let test = new TestModel();
            test.name = ' \r\n \t ';
            vld.maxStringLengthValidator(manager, test, nameField, op, vResult, opts);
            expect(vResult.valid).to.equal(true);
        });

        it('returns valid = true (validation bypassed) when a value is not defined', () => {
            let test = new TestModel();
            vld.maxStringLengthValidator(manager, test, nameField, op, vResult, opts);
            expect(vResult.valid).to.equal(true);
        });

        it('returns valid = true (validation bypassed) when a value is not a string', () => {
            let test = new TestModel();
            test.name = 222222;
            vld.maxStringLengthValidator(manager, test, nameField, op, vResult, opts);
            expect(vResult.valid).to.equal(true);
        });

        it('returns valid = false for a long string', () => {
            let test = new TestModel();
            test.name = 'dfs sfdsf erfwef dfsdf sdfsdf';
            vld.maxStringLengthValidator(manager, test, nameField, op, vResult, opts);
            expectFailure('max_string_length', nameField.name, msg.max_string_length(nameField.name, nameField.options.maxLength), vResult);
        });

        it('returns valid = false for a long string with spaces', () => {
            let test = new TestModel();
            test.name = '     ab      ';
            vld.maxStringLengthValidator(manager, test, nameField, op, vResult, opts);
            expectFailure('max_string_length', nameField.name, msg.max_string_length(nameField.name, nameField.options.maxLength), vResult);
        });

    });

    describe('minValueValidator()', () => {

        // Assume name minValue = 'ddd', age minValue = 18
        // JavaScript orders strings in alphabetical order

        it('returns valid = true when a number is greater than minValue', () => {
            let test = new TestModel();
            test.age = 25;
            vld.minValueValidator(manager, test, ageField, op, vResult, opts);
            expect(vResult.valid).to.equal(true);
        });

        it('returns valid = true when a number is equal to minValue', () => {
            let test = new TestModel();
            test.age = 18;
            vld.minValueValidator(manager, test, ageField, op, vResult, opts);
            expect(vResult.valid).to.equal(true);
        });

        it('returns valid = true when a string is greater than minValue', () => {
            let test = new TestModel();
            test.name = 'f';
            vld.minValueValidator(manager, test, nameField, op, vResult, opts);
            expect(vResult.valid).to.equal(true);
        });

        it('returns valid = true when a string is equal to minValue', () => {
            let test = new TestModel();
            test.name = 'ddd';
            vld.minValueValidator(manager, test, nameField, op, vResult, opts);
            expect(vResult.valid).to.equal(true);
        });

        it('returns valid = true (validation bypassed) when a value is not defined', () => {
            let test = new TestModel();
            vld.minValueValidator(manager, test, nameField, op, vResult, opts);
            expect(vResult.valid).to.equal(true);
        });

        it('returns valid = true (validation bypassed) when a value is null', () => {
            let test = new TestModel();
            test.name = null;
            vld.minValueValidator(manager, test, nameField, op, vResult, opts);
            expect(vResult.valid).to.equal(true);
        });

        it('returns valid = false when number is less than minValue', () => {
            let test = new TestModel();
            test.age = 10;
            vld.minValueValidator(manager, test, ageField, op, vResult, opts);
            expectFailure('min_value', ageField.name, msg.min_value(ageField.name, ageField.options.minValue), vResult);
        });

        it('returns valid = false when number is a lot less than minValue', () => {
            let test = new TestModel();
            test.age = -120;
            vld.minValueValidator(manager, test, ageField, op, vResult, opts);
            expectFailure('min_value', ageField.name, msg.min_value(ageField.name, ageField.options.minValue), vResult);
        });

        it('returns valid = false when string is less than minValue', () => {
            let test = new TestModel();
            test.name = 'bbb';
            vld.minValueValidator(manager, test, nameField, op, vResult, opts);
            expectFailure('min_value', nameField.name, msg.min_value(nameField.name, nameField.options.minValue), vResult);
        });

        it('returns valid = false when string is a lot less than minValue', () => {
            let test = new TestModel();
            test.name = '';
            vld.minValueValidator(manager, test, nameField, op, vResult, opts);
            expectFailure('min_value', nameField.name, msg.min_value(nameField.name, nameField.options.minValue), vResult);
        });

    });

    describe('maxValueValidator()', () => {

        // Assume name maxValue = 'jjj', age maxValue = 30
        // JavaScript orders strings in alphabetical order

        it('returns valid = true when a number is less than maxValue', () => {
            let test = new TestModel();
            test.age = 22;
            vld.maxValueValidator(manager, test, ageField, op, vResult, opts);
            expect(vResult.valid).to.equal(true);
        });

        it('returns valid = true when a number is equal to maxValue', () => {
            let test = new TestModel();
            test.age = 30;
            vld.maxValueValidator(manager, test, ageField, op, vResult, opts);
            expect(vResult.valid).to.equal(true);
        });

        it('returns valid = true when a string is less than maxValue', () => {
            let test = new TestModel();
            test.name = 'b';
            vld.maxValueValidator(manager, test, nameField, op, vResult, opts);
            expect(vResult.valid).to.equal(true);
        });

        it('returns valid = true when a string is equal to maxValue', () => {
            let test = new TestModel();
            test.name = 'jjj';
            vld.maxValueValidator(manager, test, nameField, op, vResult, opts);
            expect(vResult.valid).to.equal(true);
        });

        it('returns valid = true (validation bypassed) when a value is not defined', () => {
            let test = new TestModel();
            vld.maxValueValidator(manager, test, nameField, op, vResult, opts);
            expect(vResult.valid).to.equal(true);
        });

        it('returns valid = true (validation bypassed) when a value is null', () => {
            let test = new TestModel();
            test.name = null;
            vld.maxValueValidator(manager, test, nameField, op, vResult, opts);
            expect(vResult.valid).to.equal(true);
        });

        it('returns valid = false when number is greater than maxValue', () => {
            let test = new TestModel();
            test.age = 45;
            vld.maxValueValidator(manager, test, ageField, op, vResult, opts);
            expectFailure('max_value', ageField.name, msg.max_value(ageField.name, ageField.options.maxValue), vResult);
        });

        it('returns valid = false when string is greater than maxValue', () => {
            let test = new TestModel();
            test.name = 'zzz';
            vld.maxValueValidator(manager, test, nameField, op, vResult, opts);
            expectFailure('max_value', nameField.name, msg.max_value(nameField.name, nameField.options.maxValue), vResult);
        });

    });

    describe('singleSelectionValidator()', () => {

        it('returns valid = true when a value is not defined', () => {
            let test = new TestModel();
            vld.singleSelectionValidator(manager, test, genderField, op, vResult, opts);
            expect(vResult.valid).to.equal(true);
        });

        it('returns valid = true when a value is null', () => {
            let test = new TestModel();
            test.gender = null;
            vld.singleSelectionValidator(manager, test, genderField, op, vResult, opts);
            expect(vResult.valid).to.equal(true);
        });

        it('returns valid = true when the value is in the selection', () => {
            let test = new TestModel();
            test.gender = 'female';
            vld.singleSelectionValidator(manager, test, genderField, op, vResult, opts);
            expect(vResult.valid).to.equal(true);
        });

        it('returns valid = false when the value is not in the selection', () => {
            let test = new TestModel();
            test.gender = 'hamster';
            vld.singleSelectionValidator(manager, test, genderField, op, vResult, opts);
            expectFailure('no_selection_match', genderField.name, msg.no_selection_match(genderField.name), vResult);
        });

        it('returns valid = false when the value is a number that is not in the selection', () => {
            let test = new TestModel();
            test.gender = 222;
            vld.singleSelectionValidator(manager, test, genderField, op, vResult, opts);
            expectFailure('no_selection_match', genderField.name, msg.no_selection_match(genderField.name), vResult);
        });

        it('returns valid = false when value is an empty string', () => {
            let test = new TestModel();
            test.gender = '';
            vld.singleSelectionValidator(manager, test, genderField, op, vResult, opts);
            expectFailure('no_selection_match', genderField.name, msg.no_selection_match(genderField.name), vResult);
        });

    });

    describe('listEmptyValidator()', () => {

        it('returns valid = true when value is not defined', () => {
            let test = new TestModel();
            vld.listEmptyValidator(manager, test, hobbiesField, op, vResult, opts);
            expect(vResult.valid).to.equal(true);
        });

        it('returns valid = true when value is null', () => {
            let test = new TestModel();
            test.hobbies = null;
            vld.listEmptyValidator(manager, test, hobbiesField, op, vResult, opts);
            expect(vResult.valid).to.equal(true);
        });

        it('returns valid = true when a list has multiple entries', () => {
            let test = new TestModel();
            test.hobbies = ['flibble', 'jibble'];
            vld.listEmptyValidator(manager, test, hobbiesField, op, vResult, opts);
            expect(vResult.valid).to.equal(true);
        });

        it('returns valid = true when a list has one entry', () => {
            let test = new TestModel();
            test.hobbies = ['flibble'];
            vld.listEmptyValidator(manager, test, hobbiesField, op, vResult, opts);
            expect(vResult.valid).to.equal(true);
        });

        it('returns valid = false when a list has no entries', () => {
            let test = new TestModel();
            test.hobbies = [];
            vld.listEmptyValidator(manager, test, hobbiesField, op, vResult, opts);
            expectFailure('list_empty', hobbiesField.name, msg.list_empty(hobbiesField.name), vResult);
        });

    });

    describe('multipleSelectionValidator()', () => {

        it('returns valid = true when a value is not defined', () => {
            let test = new TestModel();
            vld.multipleSelectionValidator(manager, test, hobbiesField, op, vResult, opts);
            expect(vResult.valid).to.equal(true);
        });

        it('returns valid = true when a value is null', () => {
            let test = new TestModel();
            test.hobbies = null;
            vld.multipleSelectionValidator(manager, test, hobbiesField, op, vResult, opts);
            expect(vResult.valid).to.equal(true);
        });

        it('returns valid = true when one value is in the selection', () => {
            let test = new TestModel();
            test.hobbies = ['ironing'];
            vld.multipleSelectionValidator(manager, test, hobbiesField, op, vResult, opts);
            expect(vResult.valid).to.equal(true);
        });

        it('returns valid = true when more than one value is in the selection', () => {
            let test = new TestModel();
            test.hobbies = ['ironing', 'extreme_ironing'];
            vld.multipleSelectionValidator(manager, test, hobbiesField, op, vResult, opts);
            expect(vResult.valid).to.equal(true);
        });

        it('returns valid = false when value is just a string', () => {
            let test = new TestModel();
            test.hobbies = 'ironing';
            vld.multipleSelectionValidator(manager, test, hobbiesField, op, vResult, opts);
            expectFailure('selection_not_an_array', hobbiesField.name, msg.selection_not_an_array(hobbiesField.name), vResult);
        });

        it('returns valid = false when value is just a number', () => {
            let test = new TestModel();
            test.hobbies = 222;
            vld.multipleSelectionValidator(manager, test, hobbiesField, op, vResult, opts);
            expectFailure('selection_not_an_array', hobbiesField.name, msg.selection_not_an_array(hobbiesField.name), vResult);
        });

        it('returns valid = false when value is an object', () => {
            let test = new TestModel();
            test.hobbies = { flibble: true };
            vld.multipleSelectionValidator(manager, test, hobbiesField, op, vResult, opts);
            expectFailure('selection_not_an_array', hobbiesField.name, msg.selection_not_an_array(hobbiesField.name), vResult);
        });

        it('returns valid = false when one value is not in the selection', () => {
            let test = new TestModel();
            test.hobbies = ['golf'];
            vld.multipleSelectionValidator(manager, test, hobbiesField, op, vResult, opts);
            expectFailure('no_selection_match', hobbiesField.name, msg.no_selection_match(hobbiesField.name), vResult);
        });

        it('returns valid = false when one value is in the selection and one is not in the selection', () => {
            let test = new TestModel();
            test.hobbies = ['ironing', 'golf'];
            vld.multipleSelectionValidator(manager, test, hobbiesField, op, vResult, opts);
            expectFailure('no_selection_match', hobbiesField.name, msg.no_selection_match(hobbiesField.name), vResult);
        });

        it('returns valid = false when one value is a number that is not in the selection', () => {
            let test = new TestModel();
            test.hobbies = [222];
            vld.multipleSelectionValidator(manager, test, hobbiesField, op, vResult, opts);
            expectFailure('no_selection_match', hobbiesField.name, msg.no_selection_match(hobbiesField.name), vResult);
        });

        it('returns valid = false when value is an empty string', () => {
            let test = new TestModel();
            test.hobbies = [''];
            vld.multipleSelectionValidator(manager, test, hobbiesField, op, vResult, opts);
            expectFailure('no_selection_match', hobbiesField.name, msg.no_selection_match(hobbiesField.name), vResult);
        });

    });

    describe('dateOnlyValidator()', () => {

        it('returns valid = true when a value is not defined', () => {
            let test = new TestModel();
            vld.dateOnlyValidator(manager, test, dateField, op, vResult, opts);
            expect(vResult.valid).to.equal(true);
        });

        it('returns valid = true when a value is null', () => {
            let test = new TestModel();
            test.registered = null;
            vld.dateOnlyValidator(manager, test, dateField, op, vResult, opts);
            expect(vResult.valid).to.equal(true);
        });

        it('returns valid = true when a date object is passed', () => {
            let test = new TestModel();
            test.registered = new Date('2016-12-01');
            vld.dateOnlyValidator(manager, test, dateField, op, vResult, opts);
            expect(vResult.valid).to.equal(true);
        });

        it('returns valid = true when a date in the correct format is passed', () => {
            let test = new TestModel();
            test.registered = '2016-12-01';
            vld.dateOnlyValidator(manager, test, dateField, op, vResult, opts);
            expect(vResult.valid).to.equal(true);
        });

        it('returns valid = false when a non-date object is set', () => {
            let test = new TestModel();
            test.registered = new TestModel();
            vld.dateOnlyValidator(manager, test, dateField, op, vResult, opts);
            expectFailure('not_a_date', dateField.name, msg.not_a_date(dateField.name), vResult);
        });

        it('returns valid = false when date string also contains a time', () => {
            let test = new TestModel();
            test.registered = '2016-12-01T12:00:00';
            vld.dateOnlyValidator(manager, test, dateField, op, vResult, opts);
            expectFailure('not_a_date', dateField.name, msg.not_a_date(dateField.name), vResult);
        });

        it('returns valid = false when date string is an invalid date', () => {
            let test = new TestModel();
            test.registered = '2016-00-12';
            vld.dateOnlyValidator(manager, test, dateField, op, vResult, opts);
            expectFailure('not_a_date', dateField.name, msg.not_a_date(dateField.name), vResult);
        });

        it('returns valid = false when string is not in the correct format', () => {
            let test = new TestModel();
            test.registered = '17 May 1985';
            vld.dateOnlyValidator(manager, test, dateField, op, vResult, opts);
            expectFailure('not_a_date', dateField.name, msg.not_a_date(dateField.name), vResult);
        });

        it('returns valid = false when string is empty', () => {
            let test = new TestModel();
            test.registered = '';
            vld.dateOnlyValidator(manager, test, dateField, op, vResult, opts);
            expectFailure('not_a_date', dateField.name, msg.not_a_date(dateField.name), vResult);
        });

    });

    describe('timeOnlyValidator()', () => {

        it('returns valid = true when a value is not defined', () => {
            let test = new TestModel();
            vld.timeOnlyValidator(manager, test, dateField, op, vResult, opts);
            expect(vResult.valid).to.equal(true);
        });

        it('returns valid = true when a value is null', () => {
            let test = new TestModel();
            test.registered = null;
            vld.timeOnlyValidator(manager, test, dateField, op, vResult, opts);
            expect(vResult.valid).to.equal(true);
        });

        it('returns valid = true when a date object is passed', () => {
            let test = new TestModel();
            test.registered = new Date('2016-12-01T12:11:01');
            vld.timeOnlyValidator(manager, test, dateField, op, vResult, opts);
            expect(vResult.valid).to.equal(true);
        });

        it('returns valid = true when a time in the correct format is passed', () => {
            let test = new TestModel();
            test.registered = '15:11:01';
            vld.timeOnlyValidator(manager, test, dateField, op, vResult, opts);
            expect(vResult.valid).to.equal(true);
        });

        it('returns valid = false when a non-date object is set', () => {
            let test = new TestModel();
            test.registered = new TestModel();
            vld.timeOnlyValidator(manager, test, dateField, op, vResult, opts);
            expectFailure('not_a_time', dateField.name, msg.not_a_time(dateField.name), vResult);
        });

        it('returns valid = false when time string also contains a date', () => {
            let test = new TestModel();
            test.registered = '2016-12-01T15:11:01';
            vld.timeOnlyValidator(manager, test, dateField, op, vResult, opts);
            expectFailure('not_a_time', dateField.name, msg.not_a_time(dateField.name), vResult);
        });

        it('returns valid = false when time string is an invalid time', () => {
            let test = new TestModel();
            test.registered = '56:21:32';
            vld.timeOnlyValidator(manager, test, dateField, op, vResult, opts);
            expectFailure('not_a_time', dateField.name, msg.not_a_time(dateField.name), vResult);
        });

        it('returns valid = false when string is not in the correct format', () => {
            let test = new TestModel();
            test.registered = '5:21 pm';
            vld.timeOnlyValidator(manager, test, dateField, op, vResult, opts);
            expectFailure('not_a_time', dateField.name, msg.not_a_time(dateField.name), vResult);
        });

        it('returns valid = false when string is empty', () => {
            let test = new TestModel();
            test.registered = '';
            vld.timeOnlyValidator(manager, test, dateField, op, vResult, opts);
            expectFailure('not_a_time', dateField.name, msg.not_a_time(dateField.name), vResult);
        });

    });

    describe('dateTimeValidator()', () => {

        it('returns valid = true when a value is not defined', () => {
            let test = new TestModel();
            vld.dateTimeValidator(manager, test, dateField, op, vResult, opts);
            expect(vResult.valid).to.equal(true);
        });

        it('returns valid = true when a value is null', () => {
            let test = new TestModel();
            test.registered = null;
            vld.dateTimeValidator(manager, test, dateField, op, vResult, opts);
            expect(vResult.valid).to.equal(true);
        });

        it('returns valid = true when a date object is passed', () => {
            let test = new TestModel();
            test.registered = new Date('2016-12-01T12:22:33');
            vld.dateTimeValidator(manager, test, dateField, op, vResult, opts);
            expect(vResult.valid).to.equal(true);
        });

        it('returns valid = true when a datetime in the correct format is passed', () => {
            let test = new TestModel();
            test.registered = '2016-12-01T12:22:33';
            vld.dateTimeValidator(manager, test, dateField, op, vResult, opts);
            expect(vResult.valid).to.equal(true);
        });

        it('returns valid = false when a non-date object is set', () => {
            let test = new TestModel();
            test.registered = new TestModel();
            vld.dateTimeValidator(manager, test, dateField, op, vResult, opts);
            expectFailure('not_a_datetime', dateField.name, msg.not_a_datetime(dateField.name), vResult);
        });

        it('returns valid = false when datetime string does not contain a time', () => {
            let test = new TestModel();
            test.registered = '2016-12-01';
            vld.dateTimeValidator(manager, test, dateField, op, vResult, opts);
            expectFailure('not_a_datetime', dateField.name, msg.not_a_datetime(dateField.name), vResult);
        });

        it('returns valid = false when datetime string has an invalid date', () => {
            let test = new TestModel();
            test.registered = '2016-00-12T12:22:33';
            vld.dateTimeValidator(manager, test, dateField, op, vResult, opts);
            expectFailure('not_a_datetime', dateField.name, msg.not_a_datetime(dateField.name), vResult);
        });

        it('returns valid = false when datetime string has an invalid time', () => {
            let test = new TestModel();
            test.registered = '2016-01-12T25:22:33';
            vld.dateTimeValidator(manager, test, dateField, op, vResult, opts);
            expectFailure('not_a_datetime', dateField.name, msg.not_a_datetime(dateField.name), vResult);
        });

        it('returns valid = false when datetime string contains milliseconds and TZ', () => {
            let test = new TestModel();
            test.registered = '2016-01-12T11:22:33.000Z';
            vld.dateTimeValidator(manager, test, dateField, op, vResult, opts);
            expectFailure('not_a_datetime', dateField.name, msg.not_a_datetime(dateField.name), vResult);
        });

        it('returns valid = false when string is not in the correct format', () => {
            let test = new TestModel();
            test.registered = '17 May 1985 11:22:33';
            vld.dateTimeValidator(manager, test, dateField, op, vResult, opts);
            expectFailure('not_a_datetime', dateField.name, msg.not_a_datetime(dateField.name), vResult);
        });

        it('returns valid = false when string is empty', () => {
            let test = new TestModel();
            test.registered = '';
            vld.dateTimeValidator(manager, test, dateField, op, vResult, opts);
            expectFailure('not_a_datetime', dateField.name, msg.not_a_datetime(dateField.name), vResult);
        });

    });

});
