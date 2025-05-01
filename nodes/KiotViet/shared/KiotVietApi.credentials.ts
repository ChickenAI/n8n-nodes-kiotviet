import type {
	IAuthenticateGeneric,
	ICredentialTestRequest,
	ICredentialType,
	INodeProperties,
} from 'n8n-workflow';

export class KiotVietApi implements ICredentialType {
	name = 'kiotVietApi';
	displayName = 'KiotViet API';
	documentationUrl = 'https://www.kiotviet.vn/huong-dan-su-dung-kiotviet/thiet-lap-nang-cao/thiet-lap-ket-noi-api';
	properties: INodeProperties[] = [
		{
			displayName: 'Retailer Name',
			name: 'retailerName',
			type: 'string',
			default: '',
			required: true,
			description: 'Tên shop của bạn trên KiotViet',
		},
		{
			displayName: 'Client ID',
			name: 'clientId',
			type: 'string',
			default: '',
			required: true,
			description: 'Mã số ứng dụng (Client ID) được cấp từ KiotViet',
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
			description: 'Mã bí mật ứng dụng (Client Secret) được cấp từ KiotViet',
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
