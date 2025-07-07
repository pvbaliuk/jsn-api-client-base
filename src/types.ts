import {GenericAbortSignal, Method, responseEncoding, ResponseType} from 'axios';
import {IAuthorizationProvider} from './authorization';
import {z} from 'zod/v4';

export type BaseClientBasicAuthCredentials = {
    username: string;
    password: string;
}

export type AuthBypassRule = ((method: Method, endpoint: string) => boolean) | RegExp;

export type BaseClientConfig = {
    baseURL: string;
    authorizationProvider?: IAuthorizationProvider;
    headers?: Record<string, string>;
    maxRedirects?: number;
    basicAuth?: BaseClientBasicAuthCredentials;
    responseType?: ResponseType;
    responseEncoding?: responseEncoding;
    timeout?: number;
    timeoutErrorMessage?: string;
    authBypassRules?: AuthBypassRule[] | true;
    paramsArrayFormat?: 'indices' | 'brackets' | 'repeat' | 'comma',
    paramsDateSerializer?: (date: Date) => string;
}

export type RequestConfig<
    I extends z.ZodTypeAny|undefined,
    Q extends z.ZodTypeAny|undefined,
    O extends z.ZodTypeAny|undefined
> = {
    method: Method;
    path: string;
    query?: any;
    headers?: Record<string, string>;
    data?: any;
    signal?: GenericAbortSignal;
    $input?: I;
    $query?: Q;
    $output?: O;
};

export type InferRequestType<T extends RequestConfig<any, any, any>> = T['$input'] extends undefined ? any : z.output<T['$input']>;
export type InferQueryType<T extends RequestConfig<any, any, any>> = T['$query'] extends undefined ? any : z.input<T['$query']>;
export type InferResponseType<T extends RequestConfig<any, any, any>> = T['$output'] extends undefined ? any : z.output<T['$output']>;
