import axios, {AxiosError, AxiosInstance, AxiosResponse, InternalAxiosRequestConfig, Method} from 'axios';
import {z} from 'zod/v4'
import * as QueryString from 'qs';
import {AuthBypassRule, BaseClientConfig, InferResponseType, RequestConfig} from './types';
import {IAuthorizationProvider, DefaultAuthorizationProvider} from './authorization';
import {BaseClientHTTPError, BaseClientValidationError} from './errors';

export class BaseClient{

    private readonly defaultConfig: BaseClientConfig;
    private readonly http: AxiosInstance;
    private readonly authorizationProvider: IAuthorizationProvider;

    /**
     * @param {BaseClientConfig} config
     */
    public constructor(config: BaseClientConfig) {
        this.defaultConfig = config;
        this.http = axios.create({
            baseURL: config.baseURL,
            headers: config.headers,
            auth: config.basicAuth,
            responseType: config.responseType,
            responseEncoding: config.responseEncoding,
            maxRedirects: config.maxRedirects,
            timeout: config.timeout,
            timeoutErrorMessage: config.timeoutErrorMessage
        });

        this.authorizationProvider = config.authorizationProvider ?? new DefaultAuthorizationProvider();
        this.http.interceptors.request.use(this.request_interceptor);

        this.addAuthBypassRules(this.authorizationProvider.getAuthBypassRules());
    }

    /**
     * @param {AuthBypassRule[]} rules
     * @protected
     */
    protected addAuthBypassRules(rules?: AuthBypassRule[]): void{
        if(!this.defaultConfig.authBypassRules){
            this.defaultConfig.authBypassRules = rules;
        }else if(this.defaultConfig.authBypassRules === true){
            if(rules.length > 0)
                this.defaultConfig.authBypassRules = rules;
        }else if(Array.isArray(this.defaultConfig.authBypassRules)){
            this.defaultConfig.authBypassRules.push(...rules);
        }
    }

    /**
     * @param {InternalAxiosRequestConfig} config
     * @returns {Promise<InternalAxiosRequestConfig>}
     */
    private request_interceptor = async (config: InternalAxiosRequestConfig): Promise<InternalAxiosRequestConfig> => {
        if(this.shouldBypassAuth(config))
            return config;

        let promiseOrConfig = this.authorizationProvider.authorizeRequest(this.http, config);
        if(promiseOrConfig instanceof Promise)
            promiseOrConfig = await promiseOrConfig;

        return promiseOrConfig;
    }

    /**
     * @param {InternalAxiosRequestConfig} config
     * @returns {boolean}
     * @private
     */
    private shouldBypassAuth(config: InternalAxiosRequestConfig): boolean{
        if(!this.defaultConfig.authBypassRules)
            return false;

        if(this.defaultConfig.authBypassRules === true)
            return true;

        for(const rule of this.defaultConfig.authBypassRules){
            if(rule instanceof RegExp){
                if(rule.test(config.url))
                    return true;
            }else if(typeof rule === 'function'){
                try{
                    if(rule(config.method as Method, config.url))
                        return true;
                }catch(e){}
            }
        }

        return false;
    }

    /**
     * @template {RequestConfig<any, any>} T
     * @param {T} config
     * @returns {Promise<InferResponseType<T>>}
     */
    public async request<T extends RequestConfig<any, any>>(config: T): Promise<InferResponseType<T>>{
        let response: AxiosResponse|undefined = undefined;
        const endpointURI = this.appendQueryString(config.path, config.query),
            requestURL = this.getFullRequestURL(endpointURI);

        // Validate request body
        if(!!config.$input){
            try{
                config.data = this.validateData(config.data, config.$input);
            }catch(e){
                throw new BaseClientValidationError({
                    type: 'request',
                    url: requestURL,
                    method: config.method,
                    validation_error_message: z.prettifyError(e as z.ZodError)
                });
            }
        }

        try{
            response = await this.http.request({
                url: endpointURI,
                method: config.method,
                data: config.data
            });
        }catch(e){
            if(e instanceof AxiosError){
                const _e = this.onRequestError(e, requestURL);
                if(_e)
                    throw _e;

                throw new BaseClientHTTPError({
                    url: requestURL,
                    method: config.method,
                    response: e?.response?.data
                }, e.message);
            }

            const _e = this.onUnknownRequestError(e, requestURL);
            if(_e)
                throw _e;

            // Re-throw an original error
            throw e;
        }

        if(!!config.$output){
            try{
                return this.validateData(response.data, config.$output);
            }catch(e){
                throw new BaseClientValidationError({
                    type: 'response',
                    url: requestURL,
                    method: config.method,
                    validation_error_message: z.prettifyError(e as z.ZodError)
                });
            }
        }

        return response.data;
    }

    /**
     * @param {string} endpointURI
     * @param {*} [query]
     * @returns {string}
     * @private
     */
    private appendQueryString(endpointURI: string, query?: any): string{
        if(!query)
            return endpointURI;

        const qIndex = endpointURI.indexOf('?');
        if(qIndex === -1){
            endpointURI += '?';
        }else if(qIndex < endpointURI.length - 1){
            endpointURI += '&';
        }

        endpointURI += QueryString.stringify(query, {
            arrayFormat: this.defaultConfig.paramsArrayFormat ?? 'brackets',
            serializeDate: this.defaultConfig.paramsDateSerializer
        });

        return endpointURI;
    }

    /**
     * @param {string} endpointURI
     * @returns {string}
     * @private
     */
    private getFullRequestURL(endpointURI: string): string{
        return (this.http.defaults.baseURL ?? '').replace(/\/+$/, '')
            + '/' + endpointURI.replace(/^\/+/, '');
    }

    /**
     * @template {z.ZodTypeAny} T
     * @param data
     * @param {T} schema
     * @returns {output<T>}
     * @private
     */
    private validateData<T extends z.ZodTypeAny>(data: any, schema: T): z.output<T>{
        return schema.parse(data);
    }

    //region Overridable methods

    /**
     * @param {AxiosError} e
     * @param {string} requestURL
     * @returns {Error | void}
     * @protected
     */
    protected onRequestError(e: AxiosError, requestURL: string): Error|void{
        return;
    }

    /**
     * @param {unknown} e
     * @param {string} requestURL
     * @returns {Error | void}
     * @protected
     */
    protected onUnknownRequestError(e: unknown, requestURL: string): Error|void{
        return;
    }

    //endregion

}
