import {IAuthorizationProvider} from './IAuthorizationProvider';
import {AxiosInstance, InternalAxiosRequestConfig} from 'axios';
import {AuthBypassRule} from '../types';

export class DefaultAuthorizationProvider implements IAuthorizationProvider{

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
        return config;
    }

}
