import type {
	IAuthenticateGeneric,
	ICredentialTestRequest,
	ICredentialType,
	INodeProperties,
} from 'n8n-workflow';

export class KiotVietApi implements ICredentialType {
	name = 'kiotVietApi';
	displayName = 'KiotViet API';
	documentationUrl = 'https://developer.kiotviet.vn/documentation';
	properties: INodeProperties[] = [
		{
			displayName: 'Retailer Name',
			name: 'retailerName',
			type: 'string',
			default: '',
			required: true,
			description: 'The name of your KiotViet store',
		},
		{
			displayName: 'Client ID',
			name: 'clientId',
			type: 'string',
			default: '',
			required: true,
			description: 'The Client ID obtained from KiotViet Developer Portal',
		},
		{
			displayName: 'Client Secret',
			name: 'clientSecret',
			type: 'string',
			typeOptions: {
				password: true,
			},
			default: '',
			required: true,
			description: 'The Client Secret obtained from KiotViet Developer Portal',
		},
	];

	// Remove authenticate section since SDK handles OAuth flow internally
	// The SDK will manage tokens and authentication automatically

	test: ICredentialTestRequest = {
		request: {
			baseURL: 'https://id.kiotviet.vn',
			url: '/connect/token',
			method: 'POST',
			headers: {
				'Content-Type': 'application/x-www-form-urlencoded',
			},
			body: {
				grant_type: 'client_credentials',
				client_id: '={{$credentials.clientId}}',
				client_secret: '={{$credentials.clientSecret}}',
			},
		},
	};
}
