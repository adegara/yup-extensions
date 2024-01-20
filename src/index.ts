import { addMethod, number, string } from 'yup';

declare module 'yup' {
    interface StringSchema {
        ulid: () => StringSchema;
    }

    interface NumberSchema {
        emptyStringToUndefined: () => NumberSchema;
    }
}

addMethod(string, 'ulid', function() {
    return this.test('ulid', 'Invalid ULID', value => {
        if (!value) return true;

        return /^[0-9A-HJKMNP-TV-Z]{26}$/.test(value);
    });
});

addMethod(number, 'emptyStringToUndefined', function() {
    return this.transform((value, originalValue, ctx) => {
        if (ctx.isType(value)) return value;

        if (typeof originalValue === 'string' && originalValue.trim() === '') {
            value = undefined;
        }

        return value;
    });
});
