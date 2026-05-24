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
import { KiotVietBankAccount } from './nodes/KiotViet/BankAccount/KiotVietBankAccount.node';
import { KiotVietCashFlow } from './nodes/KiotViet/CashFlow/KiotVietCashFlow.node';
import { KiotVietPriceBook } from './nodes/KiotViet/PriceBook/KiotVietPriceBook.node';
import { KiotVietReturns } from './nodes/KiotViet/Returns/KiotVietReturns.node';
import { KiotVietSalesChannels } from './nodes/KiotViet/SalesChannels/KiotVietSalesChannels.node';
import { KiotVietSettings } from './nodes/KiotViet/Settings/KiotVietSettings.node';
import { KiotVietSurcharge } from './nodes/KiotViet/Surcharge/KiotVietSurcharge.node';
import { KiotVietTrademarks } from './nodes/KiotViet/Trademarks/KiotVietTrademarks.node';
import { KiotVietUsers } from './nodes/KiotViet/Users/KiotVietUsers.node';
import { KiotVietVouchers } from './nodes/KiotViet/Vouchers/KiotVietVouchers.node';
import { KiotVietOrderSuppliers } from './nodes/KiotViet/OrderSuppliers/KiotVietOrderSuppliers.node';

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
	new KiotVietBankAccount(),
	new KiotVietCashFlow(),
	new KiotVietPriceBook(),
	new KiotVietReturns(),
	new KiotVietSalesChannels(),
	new KiotVietSettings(),
	new KiotVietSurcharge(),
	new KiotVietTrademarks(),
	new KiotVietUsers(),
	new KiotVietVouchers(),
	new KiotVietOrderSuppliers(),
];

export const credentialTypes: ICredentialType[] = [new KiotVietApi()];
