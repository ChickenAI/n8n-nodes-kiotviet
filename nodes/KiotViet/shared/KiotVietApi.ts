import type {
	IExecuteFunctions,
	ILoadOptionsFunctions,
	IHookFunctions,
	IWebhookFunctions,
	IDataObject,
	JsonObject,
	ICredentialDataDecryptedObject,
	IHttpRequestOptions,
} from 'n8n-workflow';
import { NodeApiError } from 'n8n-workflow';
import { KiotVietClient } from 'kiotviet-client-sdk';

import type { Webhook, WebhookCreateParams } from './KiotVietTypes';

// Thêm interface cho Auth Response
interface KiotVietAuthResponse {
	access_token: string;
	token_type: string;
	expires_in: number;
	refresh_token?: string;
}

// Interface định nghĩa tùy chọn cho yêu cầu fetch
interface FetchOptions extends RequestInit {
	maxRetries?: number;
	retryDelay?: number;
}

export class KiotVietApiBase {
	private client!: KiotVietClient;
	private accessToken: string | null = null;
	private tokenExpiry: number = 0;
	private readonly MAX_RETRIES = 3;
	private readonly RETRY_DELAY = 1000; // ms

	constructor(
		private readonly thisArg:
			| IExecuteFunctions
			| ILoadOptionsFunctions
			| IHookFunctions
			| IWebhookFunctions,
		private readonly options: {
			includeCredentials?: boolean;
		} = {},
	) {}

	// Helper function to perform fetch with retries
	private async fetchWithRetry(url: string, options: FetchOptions = {}): Promise<Response> {
		const { maxRetries = this.MAX_RETRIES, retryDelay = this.RETRY_DELAY, ...fetchOptions } = options;
		
		let lastError: Error | undefined;
		
		for (let attempt = 0; attempt <= maxRetries; attempt++) {
			try {
				const response = await fetch(url, fetchOptions);
				
				// Only retry on server errors (5xx) or specific network errors
				if (response.status >= 500 && response.status < 600 && attempt < maxRetries) {
					await new Promise(resolve => setTimeout(resolve, retryDelay * Math.pow(2, attempt)));
					continue;
				}
				
				return response;
			} catch (error) {
				lastError = error as Error;
				
				// Only retry on network errors
				if (attempt < maxRetries) {
					console.log(`Attempt ${attempt + 1}/${maxRetries + 1} failed, retrying in ${retryDelay * Math.pow(2, attempt)}ms...`);
					await new Promise(resolve => setTimeout(resolve, retryDelay * Math.pow(2, attempt)));
				}
			}
		}
		
		throw lastError || new Error('Failed after maximum retry attempts');
	}

	// Lấy token mới từ KiotViet API
	private async getToken(credentials: ICredentialDataDecryptedObject): Promise<string> {
		try {
			// Kiểm tra nếu token hiện tại còn hiệu lực
			const now = Date.now();
			if (this.accessToken && this.tokenExpiry > now) {
				return this.accessToken;
			}

			// Lấy token mới
			const formData = new URLSearchParams({
				grant_type: 'client_credentials',
				client_id: credentials.clientId as string,
				client_secret: credentials.clientSecret as string,
				scopes: 'PublicApi.Access',
			}).toString();

			const tokenResponse = await this.fetchWithRetry('https://id.kiotviet.vn/connect/token', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/x-www-form-urlencoded',
				},
				body: formData,
				maxRetries: 2, // Retry up to 2 times for authentication
			});

			if (!tokenResponse.ok) {
				const errorText = await tokenResponse.text();
				throw new Error(`KiotViet API responded with status ${tokenResponse.status}: ${errorText}`);
			}

			const authData = await tokenResponse.json() as KiotVietAuthResponse;
			this.accessToken = authData.access_token;
			// Lưu thời gian hết hạn (trừ 60 giây để an toàn)
			this.tokenExpiry = now + (authData.expires_in - 60) * 1000;
			return this.accessToken;
		} catch (error) {
			console.error('Error getting KiotViet token:', error);
			throw new Error(`Failed to authenticate with KiotViet: ${(error as Error).message}`);
		}
	}

	// HTTP request helper
	async httpRequest(options: IHttpRequestOptions): Promise<any> {
		const credentials = await this.initializeCredentials();
		const baseURL = `https://public.kiotapi.com`;

		try {
			// Lấy token mới hoặc sử dụng token hiện tại
			const token = await this.getToken(credentials);

			const response = await this.thisArg.helpers.request({
				...options,
				url: `${baseURL}${options.url}`,
				headers: {
					'Content-Type': 'application/json',
					Authorization: `Bearer ${token}`,
					Retailer: credentials.retailerName as string,
					...options.headers,
				},
			});

			return response;
		} catch (error: any) {
			// Kiểm tra nếu lỗi 401 Unauthorized
			if (error.statusCode === 401) {
				// Reset token và thử lại
				this.accessToken = null;
				try {
					const token = await this.getToken(credentials);
					
					const response = await this.thisArg.helpers.request({
						...options,
						url: `${baseURL}${options.url}`,
						headers: {
							'Content-Type': 'application/json',
							Authorization: `Bearer ${token}`,
							Retailer: credentials.retailerName as string,
							...options.headers,
						},
					});
					
					return response;
				} catch (retryError) {
					console.error('Error during token refresh and retry:', retryError);
					throw new NodeApiError(this.thisArg.getNode(), {
						message: 'Failed to refresh authentication token',
						description: (retryError as Error).message,
					} as JsonObject);
				}
			}
			
			// Các lỗi khác
			if (error.statusCode >= 400) {
				console.error(`KiotViet API error (${error.statusCode}):`, error.message || error);
				throw new NodeApiError(this.thisArg.getNode(), {
					message: `KiotViet API error: ${error.statusCode}`,
					description: error.message || 'Unknown error',
					httpCode: error.statusCode,
				} as JsonObject);
			}
			
			throw error;
		}
	}

	async init(): Promise<void> {
		await this.initializeClient();
	}

	private async initializeCredentials() {
		return (await this.thisArg.getCredentials('kiotVietApi')) as ICredentialDataDecryptedObject;
	}

	private async initializeClient() {
		try {
			const credentials = await this.initializeCredentials();
			this.client = new KiotVietClient({
				clientId: credentials.clientId as string,
				clientSecret: credentials.clientSecret as string,
				retailerName: credentials.retailerName as string,
			});
		} catch (error) {
			throw new NodeApiError(this.thisArg.getNode(), {
				message: 'Failed to initialize KiotViet client',
				description: (error as Error).message,
			} as JsonObject);
		}
	}

	async products() {
		if (!this.client) await this.init();
		return this.client.products;
	}

	async orders() {
		if (!this.client) await this.init();
		return this.client.orders;
	}

	async customers() {
		if (!this.client) await this.init();
		return this.client.customers;
	}

	async categories() {
		if (!this.client) await this.init();
		return this.client.categories;
	}

	async invoices() {
		if (!this.client) await this.init();
		return this.client.invoices;
	}

	async suppliers() {
		if (!this.client) await this.init();
		return this.client.suppliers;
	}

	async branches() {
		if (!this.client) await this.init();
		return this.client.branches;
	}

	async purchaseOrders() {
		if (!this.client) await this.init();
		return this.client.purchaseOrders;
	}

	// Helper method to handle pagination parameters
	getPaginationParameters(qs: IDataObject) {
		return {
			pageSize: qs.limit || 20,
			currentItem: qs.offset || 0,
		};
	}

	// Helper method to handle date parameters
	getDateParameters(qs: IDataObject) {
		const dateParams: IDataObject = {};

		if (qs.modifiedFrom) {
			dateParams.lastModifiedFrom = qs.modifiedFrom;
		}

		if (qs.modifiedTo) {
			dateParams.lastModifiedTo = qs.modifiedTo;
		}

		if (qs.createdFrom) {
			dateParams.createdFrom = qs.createdFrom;
		}

		if (qs.createdTo) {
			dateParams.createdTo = qs.createdTo;
		}

		return dateParams;
	}

	// Helper method to handle sorting parameters
	getSortingParameters(qs: IDataObject) {
		if (qs.sortField && qs.sortOrder) {
			return {
				orderBy: qs.sortField,
				orderDirection: (qs.sortOrder as string).toUpperCase(),
			};
		}
		return {};
	}

	// Helper method to handle search parameters
	getSearchParameters(qs: IDataObject) {
		const searchParams: IDataObject = {};

		if (qs.searchTerm) {
			searchParams.keyword = qs.searchTerm;
		}

		if (qs.code) {
			searchParams.code = qs.code;
		}

		if (qs.name) {
			searchParams.name = qs.name;
		}

		return searchParams;
	}

	// Helper method to handle status filters
	getStatusParameters(qs: IDataObject) {
		if (qs.status) {
			return { status: qs.status };
		}
		return {};
	}

	// Webhook methods
	async getWebhooks(): Promise<Webhook[]> {
		try {
			const response = await this.httpRequest({
				method: 'GET',
				url: '/webhooks',
			});
			return response.data as Webhook[];
		} catch (error) {
			console.error('Error fetching webhooks:', error);
			throw new NodeApiError(this.thisArg.getNode(), {
				message: 'Failed to retrieve webhooks',
				description: (error as Error).message,
			} as JsonObject);
		}
	}

	async createWebhook(params: WebhookCreateParams): Promise<Webhook> {
		try {
			const response = await this.httpRequest({
				method: 'POST',
				url: '/webhooks',
				body: params,
			});
			return response.data as Webhook;
		} catch (error) {
			console.error('Error creating webhook:', error);
			throw new NodeApiError(this.thisArg.getNode(), {
				message: 'Failed to create webhook',
				description: (error as Error).message,
			} as JsonObject);
		}
	}

	async deleteWebhook(webhookId: string): Promise<void> {
		try {
			await this.httpRequest({
				method: 'DELETE',
				url: `/webhooks/${webhookId}`,
			});
		} catch (error) {
			console.error(`Error deleting webhook ${webhookId}:`, error);
			throw new NodeApiError(this.thisArg.getNode(), {
				message: 'Failed to delete webhook',
				description: (error as Error).message,
			} as JsonObject);
		}
	}
}
