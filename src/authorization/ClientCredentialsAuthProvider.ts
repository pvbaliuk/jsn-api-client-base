import {IAuthorizationProvider} from './IAuthorizationProvider';
import {AxiosInstance, InternalAxiosRequestConfig} from 'axios';
import {AuthBypassRule} from '../types';

export abstract class ClientCredentialsAuthProvider implements IAuthorizationProvider{

    protected readonly clientId: string;
    protected readonly clientSecret: string;
    protected readonly refreshLeadTimeMs: number;

    protected bearerToken: string|null = null;
    protected bearerTokenExpiresAt: number = 0;
    protected bearerTokenRefreshPromise: Promise<string>|null = null;

    /**
     * @param {string} client_id
     * @param {string} client_secret
     * @param {number} [refresh_lead_time_ms=500]
     */
    protected constructor(client_id: string, client_secret: string, refresh_lead_time_ms: number = 500) {
        this.clientId = client_id;
        this.clientSecret = client_secret;
        this.refreshLeadTimeMs = refresh_lead_time_ms;
    }

    /**
     * @returns {AuthBypassRule[]}
     */
    public abstract getAuthBypassRules(): AuthBypassRule[];

    /**
     * @param {AxiosInstance} http
     * @param {InternalAxiosRequestConfig} config
     * @returns {Promise<InternalAxiosRequestConfig>}
     */
    public async authorizeRequest(http: AxiosInstance, config: InternalAxiosRequestConfig): Promise<InternalAxiosRequestConfig> {
        const token = await this.getValidToken(http);
        config.headers['Authorization'] = `Bearer ${token}`;

        return config;
    }

    /**
     * @param {AxiosInstance} http
     * @returns {Promise<string>}
     * @private
     */
    private getValidToken(http: AxiosInstance): Promise<string>{
        if(this.bearerTokenRefreshPromise)
            return this.bearerTokenRefreshPromise;

        this.bearerTokenRefreshPromise = this.refreshToken(http);
        this.bearerTokenRefreshPromise.finally(() => {
            this.bearerTokenRefreshPromise = null;
        });

        return this.bearerTokenRefreshPromise;
    }

    /**
     * @returns {Promise<string>}
     * @protected
     */
    private async refreshToken(http: AxiosInstance): Promise<string>{
        if(!this.bearerToken || (Date.now() + this.refreshLeadTimeMs) > this.bearerTokenExpiresAt){
            const {token, ttlMs} = await this.obtainToken(http);

            this.bearerToken = token;
            this.bearerTokenExpiresAt = Date.now() + ttlMs;
            this.afterTokenRefreshed(this.bearerToken, ttlMs, this.bearerTokenExpiresAt);
        }

        return this.bearerToken;
    }

    /**
     * @param {AxiosInstance} http
     * @returns {Promise<{token: string, ttlMs: number}>}
     * @protected
     */
    protected abstract obtainToken(http: AxiosInstance): Promise<{token: string; ttlMs: number;}>;

    /**
     * @param {string} newToken
     * @param {number} newTTLMs
     * @param {number} newExpirationDT
     * @protected
     */
    protected afterTokenRefreshed(newToken: string, newTTLMs: number, newExpirationDT: number): void{}

}
