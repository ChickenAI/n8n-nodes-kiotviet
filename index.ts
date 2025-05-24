import type { INodeType, ICredentialType } from 'n8n-workflow';

import { KiotVietProduct } from './nodes/KiotViet/Product/KiotVietProduct.node';
import { KiotVietCustomer } from './nodes/KiotViet/Customer/KiotVietCustomer.node';
import { KiotVietOrder } from './nodes/KiotViet/Order/KiotVietOrder.node';
import { KiotVietInvoice } from './nodes/KiotViet/Invoice/KiotVietInvoice.node';
import { KiotVietCategory } from './nodes/KiotViet/Category/KiotVietCategory.node';
import { KiotVietTrigger } from './nodes/KiotViet/Trigger/KiotVietTrigger.node';
import { KiotVietPurchaseOrder } from './nodes/KiotViet/PurchaseOrder/KiotVietPurchaseOrder.node';
import { KiotVietBranch } from './nodes/KiotViet/Branch/KiotVietBranch.node';
import { KiotVietSupplier } from './nodes/KiotViet/Supplier/KiotVietSupplier.node';

import { KiotVietApi } from './credentials/KiotVietApi.credentials';

export const nodeTypes: INodeType[] = [
	new KiotVietProduct(),
	new KiotVietCustomer(),
	new KiotVietOrder(),
	new KiotVietInvoice(),
	new KiotVietCategory(),
	new KiotVietTrigger(),
	new KiotVietPurchaseOrder(),
	new KiotVietBranch(),
	new KiotVietSupplier(),
];

export const credentialTypes: ICredentialType[] = [new KiotVietApi()];
