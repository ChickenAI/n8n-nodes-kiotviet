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

	authenticate: IAuthenticateGeneric = {
		type: 'generic',
		properties: {
			headers: {
				'Content-Type': 'application/json',
				Retailer: '={{$credentials.retailerName}}',
				Authorization: '=Bearer {{$credentials.accessToken}}',
			},
		},
	};

	test: ICredentialTestRequest = {
		request: {
			baseURL: 'https://public.kiotapi.com',
			url: '/categories',
			method: 'GET',
		},
	};
}
