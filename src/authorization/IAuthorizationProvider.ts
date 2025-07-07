import {AxiosInstance, InternalAxiosRequestConfig} from 'axios';
import {AuthBypassRule} from '../types';

export interface IAuthorizationProvider {

    getAuthBypassRules(): AuthBypassRule[];
    authorizeRequest(http: AxiosInstance, config: InternalAxiosRequestConfig): InternalAxiosRequestConfig|Promise<InternalAxiosRequestConfig>;

}
