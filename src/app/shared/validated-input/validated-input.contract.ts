export type ValidationType =
    | 'required'
    | 'email'
    | 'url'
    | 'numeric'
    | 'float'
    | 'alphanumeric'
    | 'text'
    | 'percentage';

export interface ValidationRule {
    type?: ValidationType;
    regex?: string | RegExp;
    min?: number;
    max?: number;
    minLength?: number;
    maxLength?: number;
    message: string;
}
