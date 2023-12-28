import { addMethod, string, MixedSchema } from 'yup';

declare module 'yup' {
    interface StringSchema {
        ulid(): StringSchema;
    }
}

function isUlid(value: unknown): value is string {
    const reg = /^[0-9A-HJKMNP-TV-Z]{26}$/;

    return typeof value === 'string' && reg.test(value);
}

function ulidValidator(this: MixedSchema) {
    return this.test('ulid', 'Invalid ULID', value => {
        if (!value) return true;

        return isUlid(value);
    });
}

addMethod(string, 'ulid', ulidValidator);
