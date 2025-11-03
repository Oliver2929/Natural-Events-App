import { _ as _coercedString, Z as ZodString, a as _coercedNumber, b as ZodNumber, c as _coercedBoolean, d as ZodBoolean, e as _coercedBigint, f as ZodBigInt, g as _coercedDate, h as ZodDate } from './schemas.mjs';

function string(params) {
    return _coercedString(ZodString, params);
}
function number(params) {
    return _coercedNumber(ZodNumber, params);
}
function boolean(params) {
    return _coercedBoolean(ZodBoolean, params);
}
function bigint(params) {
    return _coercedBigint(ZodBigInt, params);
}
function date(params) {
    return _coercedDate(ZodDate, params);
}

var coerce = /*#__PURE__*/Object.freeze({
    __proto__: null,
    bigint: bigint,
    boolean: boolean,
    date: date,
    number: number,
    string: string
});

export { coerce as c, number as n };
