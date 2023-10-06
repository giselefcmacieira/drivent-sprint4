import { ApplicationError } from '@/protocols';

export function forbiddenError(message?: string): ApplicationError {
    return {
        name: 'ForbiddenError',
        message: message || 'This can not be done!',
    };
}