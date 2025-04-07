import type { INodeType, INodeTypeDescription, ICredentialType } from 'n8n-workflow';
import { KiotVietProduct } from './nodes/KiotViet/Product/KiotVietProduct.node';
import { KiotVietCustomer } from './nodes/KiotViet/Customer/KiotVietCustomer.node';
import { KiotVietOrder } from './nodes/KiotViet/Order/KiotVietOrder.node';
import { KiotVietApi } from './nodes/KiotViet/shared/KiotVietApi.credentials';

export class ProductNode implements INodeType {
	description: INodeTypeDescription = new KiotVietProduct().description;
}

export class CustomerNode implements INodeType {
	description: INodeTypeDescription = new KiotVietCustomer().description;
}

export class OrderNode implements INodeType {
	description: INodeTypeDescription = new KiotVietOrder().description;
}

export class KiotVietApiCredentials implements ICredentialType {
	name = 'kiotVietApi';
	displayName = 'KiotViet API';
	documentationUrl = 'https://developer.kiotviet.vn/documentation';
	properties = new KiotVietApi().properties;
}

// Here we export the nodes in the correct format for n8n to find them
module.exports = {
	nodes: [
		{
			ProductNode: {
				sourcePath: './nodes/KiotViet/Product/KiotVietProduct.node.js',
			},
		},
		{
			CustomerNode: {
				sourcePath: './nodes/KiotViet/Customer/KiotVietCustomer.node.js',
			},
		},
		{
			OrderNode: {
				sourcePath: './nodes/KiotViet/Order/KiotVietOrder.node.js',
			},
		},
	],
	credentials: [
		{
			KiotVietApiCredentials: {
				sourcePath: './credentials/KiotVietApi.credentials.js',
			},
		},
	],
};
