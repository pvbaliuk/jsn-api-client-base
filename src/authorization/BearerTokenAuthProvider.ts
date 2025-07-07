import {IAuthorizationProvider} from './IAuthorizationProvider';
import {AuthBypassRule} from '../types';
import {AxiosInstance, InternalAxiosRequestConfig} from 'axios';

export class BearerTokenAuthProvider implements IAuthorizationProvider{

    protected readonly token: string;

    /**
     * @param {string} token
     */
    public constructor(token: string) {
        this.token = token;
    }

    /**
     * @returns {AuthBypassRule[]}
     */
    public getAuthBypassRules(): AuthBypassRule[] {
        return [];
    }

    /**
     * @param {AxiosInstance} http
     * @param {InternalAxiosRequestConfig} config
     * @returns {InternalAxiosRequestConfig}
     */
    public authorizeRequest(http: AxiosInstance, config: InternalAxiosRequestConfig): InternalAxiosRequestConfig {
        config.headers['Authorization'] = `Bearer ${this.token}`;
        return config;
    }

}
