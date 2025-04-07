import type {
	IExecuteFunctions,
	ILoadOptionsFunctions,
	IDataObject,
	JsonObject,
	ICredentialDataDecryptedObject,
} from 'n8n-workflow';
import { NodeApiError } from 'n8n-workflow';
import { KiotVietClient } from 'kiotviet-client-sdk';

export class KiotVietApiBase {
	private client!: KiotVietClient;

	constructor(
		private readonly thisArg: IExecuteFunctions | ILoadOptionsFunctions,
		private readonly options: {
			includeCredentials?: boolean;
		} = {},
	) {}

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
}
