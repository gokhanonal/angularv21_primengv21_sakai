import { ValidationRule, ValidationType } from './validated-input.contract';

const PATTERNS: Record<Exclude<ValidationType, 'required'>, RegExp> = {
    email: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
    url: /^https?:\/\/[^\s/$.?#].[^\s]*$/i,
    numeric: /^-?\d+$/,
    float: /^-?\d+(\.\d+)?$/,
    alphanumeric: /^[a-zA-Z0-9]+$/,
    text: /^[a-zA-Z\s]+$/,
    percentage: /^-?\d+(\.\d+)?$/,
};

function isEmptyValue(value: unknown): boolean {
    return value === null || value === undefined || (typeof value === 'string' && value.trim().length === 0);
}

function validateType(value: string, type: ValidationType): boolean {
    if (type === 'required') {
        return !isEmptyValue(value);
    }

    if (isEmptyValue(value)) {
        return true;
    }

    const pattern = PATTERNS[type];
    if (!pattern) {
        return true;
    }

    if (type === 'percentage') {
        if (!pattern.test(value)) {
            return false;
        }
        const num = parseFloat(value);
        return num >= 0 && num <= 100;
    }

    return pattern.test(value);
}

/**
 * Evaluates a single validation rule against a value.
 * Returns `true` when the value is valid for the given rule.
 */
export function evaluateRule(value: unknown, rule: ValidationRule): boolean {
    const strValue = value != null ? String(value) : '';

    if (rule.type) {
        if (!validateType(strValue, rule.type)) {
            return false;
        }
    }

    if (rule.regex != null && !isEmptyValue(value)) {
        const re = rule.regex instanceof RegExp ? rule.regex : new RegExp(rule.regex);
        if (!re.test(strValue)) {
            return false;
        }
    }

    if (!isEmptyValue(value)) {
        if (rule.minLength != null && strValue.length < rule.minLength) {
            return false;
        }
        if (rule.maxLength != null && strValue.length > rule.maxLength) {
            return false;
        }
        if (rule.min != null) {
            const num = parseFloat(strValue);
            if (isNaN(num) || num < rule.min) {
                return false;
            }
        }
        if (rule.max != null) {
            const num = parseFloat(strValue);
            if (isNaN(num) || num > rule.max) {
                return false;
            }
        }
    }

    return true;
}

/**
 * Runs all rules in order and returns the error message of the first
 * failing rule, or `null` when all rules pass.
 */
export function validate(value: unknown, rules: ValidationRule[]): string | null {
    for (const rule of rules) {
        if (!evaluateRule(value, rule)) {
            return rule.message;
        }
    }
    return null;
}
