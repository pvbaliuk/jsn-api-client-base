import {Method} from 'axios';

export type HTTPResponse = {
    statusCode: number;
    statusText: string;
    data?: any;
}

export type BaseClientErrorParams = {
    url: string;
    method: Method;
}

export type BaseClientValidationErrorParams = BaseClientErrorParams & {
    type: 'request' | 'response' | 'query';
    validation_error_message: string;
}

export type BaseClientHTTPErrorParams = BaseClientErrorParams & {
    response: HTTPResponse;
};

export class BaseClientError extends Error{

    public readonly url: string;
    public readonly method: Uppercase<Method>;

    /**
     * @param {BaseClientErrorParams} params
     * @param {string} message
     */
    public constructor(params: BaseClientErrorParams, message?: string) {
        super(message);

        this.url = params.url;
        this.method = params.method.toUpperCase() as Uppercase<Method>;
    }

}

export class BaseClientValidationError extends BaseClientError{

    public readonly type: 'request' | 'response' | 'query';

    /**
     * @param {BaseClientValidationErrorParams} params
     */
    public constructor(params: BaseClientValidationErrorParams) {
        super(params, params.validation_error_message);

        this.type = params.type;
    }

}

export class BaseClientHTTPError extends BaseClientError{

    public readonly statusCode: number;
    public readonly statusText: string;
    public readonly data?: any;

    /**
     * @param {BaseClientHTTPErrorParams} params
     * @param {string} message
     */
    public constructor(params: BaseClientHTTPErrorParams, message?: string) {
        super(params, message);

        this.statusCode = params.response.statusCode;
        this.statusText = params.response.statusText;
        this.data = params.response.data;
    }

}
