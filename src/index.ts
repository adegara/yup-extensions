import { format, isValid, parseISO } from 'date-fns';
import { addMethod, number, string, mixed, Schema } from 'yup';
import parsePhoneNumberFromString from 'libphonenumber-js/min';
import type {
    AnyObject,
    DefaultThunk,
    Defined,
    Flags,
    Maybe,
    Message,
    SetFlag,
    ToggleDefault,
    UnsetFlag,
    Reference,
} from 'yup';

const isoDateTimeLocale = {
    // eslint-disable-next-line no-template-curly-in-string
    min: '${path} field must be later than ${min}',
    // eslint-disable-next-line no-template-curly-in-string
    max: '${path} field must be at earlier than ${max}',
};

export interface IsoDateTimeSchema<TType extends Maybe<string> = string | undefined, TContext = AnyObject, TDefault = undefined, TFlags extends Flags = ''> extends Schema<TType, TContext, TDefault, TFlags> {
    date: () => this;
    min: (
        ref: string | Date | Reference<string>,
        message?: string,
    ) => this;
    max: (
        ref: string | Date | Reference<string>,
        message?: string,
    ) => this;

    // Inherited
    default: <D extends Maybe<TType>>(
        def: DefaultThunk<D, TContext>,
    ) => IsoDateTimeSchema<TType, TContext, D, ToggleDefault<TFlags, D>>;
    defined: (msg?: Message) => IsoDateTimeSchema<Defined<TType>, TContext, TDefault, TFlags>;
    optional: () => IsoDateTimeSchema<TType | undefined, TContext, TDefault, TFlags>;
    required: (msg?: Message) => IsoDateTimeSchema<NonNullable<TType>, TContext, TDefault, TFlags>;
    notRequired: () => IsoDateTimeSchema<Maybe<TType>, TContext, TDefault, TFlags>;
    nullable: (msg?: Message) => IsoDateTimeSchema<TType | null, TContext, TDefault, TFlags>;
    nonNullable: (msg?: Message) => IsoDateTimeSchema<Exclude<TType, null>, TContext, TDefault, TFlags>;
    strip: ((enabled: false) => IsoDateTimeSchema<TType, TContext, TDefault, UnsetFlag<TFlags, 's'>>) &
        ((enabled?: true) => IsoDateTimeSchema<TType, TContext, TDefault, SetFlag<TFlags, 's'>>);
}

class IsoDateTimeSchemaImpl<
    TType extends Maybe<string> = string | undefined,
    TContext = AnyObject,
    TDefault = undefined,
    TFlags extends Flags = '',
> extends Schema<TType, TContext, TDefault, TFlags> implements IsoDateTimeSchema<TType, TContext, TDefault, TFlags> {
    constructor() {
        super({
            type: 'isoDateTime',
            check(value): value is NonNullable<TType> {
                return typeof value === 'string' && isValid(parseISO(value));
            },
        });

        this.withMutation(() => {
            this.typeError('Value must be a valid string date');

            this.transform((value: string, _originalValue: string, ctx) => {
                if (!value || !ctx.isType(value)) return value;

                return parseISO(value).toISOString();
            });
        });
    }

    public date() {
        // Используется только originalValue, т.к. value преобразован в datetime с местным часовым поясом
        return this.transform((_value: string, originalValue: string, ctx) => {
            if (!originalValue || !ctx.isType(originalValue)) return originalValue;

            return format(
                parseISO(originalValue),
                'yyyy-MM-dd',
            );
        });
    }

    private prepareParam(
        ref: string | Date | Reference<string>,
        name: string,
    ): Maybe<string> | Reference<string> {
        if (ref instanceof Date) {
            ref = ref.toISOString();
        }

        if (typeof ref !== 'string') {
            return ref;
        }

        const cast = this.cast(ref);

        // eslint-disable-next-line no-underscore-dangle
        if (!this._typeCheck(cast)) {
            throw new TypeError(`'${name}' must be a Date or a value that can be 'cast()' to a Date`);
        }

        return cast;
    }

    public min(min: string | Date | Reference<string>, message = isoDateTimeLocale.min) {
        const limit = this.prepareParam(min, 'min');

        return this.test({
            message,
            name: 'min',
            exclusive: true,
            params: { min },
            skipAbsent: true,
            test: function test(value) {
                return !value || !limit || value >= this.resolve(limit);
            },
        });
    }

    public max(max: string | Date | Reference<string>, message = isoDateTimeLocale.max) {
        const limit = this.prepareParam(max, 'max');

        return this.test({
            message,
            name: 'max',
            exclusive: true,
            params: { max },
            skipAbsent: true,
            test: function test(value) {
                return !value || !limit || value <= this.resolve(limit);
            },
        });
    }
}

declare module 'yup' {
    interface StringSchema {
        phone: () => StringSchema;
        ulid: () => StringSchema;
    }

    interface NumberSchema {
        emptyStringToUndefined: () => NumberSchema;
    }

    interface MixedSchema {
        isoDateTime: () => IsoDateTimeSchema;
    }
}

// Фабрика для создания схемы
export function isoDateTime(): IsoDateTimeSchema {
    return new IsoDateTimeSchemaImpl();
}

// Добавляем новый тип схемы в yup.mixed
addMethod<IsoDateTimeSchema>(mixed as unknown as () => IsoDateTimeSchema, 'isoDateTime', () => isoDateTime());

addMethod(string, 'phone', function() {
    return this.test('phone', 'Incorrect phone number format', value => {
        try {
            return !value || parsePhoneNumberFromString(value)?.isPossible();
        } catch {
            return false;
        }
    });
});

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
