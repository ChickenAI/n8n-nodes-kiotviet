import type { INodeType } from 'n8n-workflow';
import { KiotVietProduct } from './nodes/KiotViet/Product/KiotVietProduct.node';
import { KiotVietCustomer } from './nodes/KiotViet/Customer/KiotVietCustomer.node';
import { KiotVietOrder } from './nodes/KiotViet/Order/KiotVietOrder.node';
import { KiotVietInvoice } from './nodes/KiotViet/Invoice/KiotVietInvoice.node';
import { KiotVietApi } from './credentials/KiotVietApi.credentials';

class KiotVietProductNode implements INodeType {
    description = new KiotVietProduct().description;
}

class KiotVietCustomerNode implements INodeType {
    description = new KiotVietCustomer().description;
}

class KiotVietOrderNode implements INodeType {
    description = new KiotVietOrder().description;
}

class KiotVietInvoiceNode implements INodeType {
    description = new KiotVietInvoice().description;
}

// Export nodes for n8n
export const nodeTypes = {
    KiotVietProduct: KiotVietProductNode,
    KiotVietCustomer: KiotVietCustomerNode,
    KiotVietOrder: KiotVietOrderNode,
    KiotVietInvoice: KiotVietInvoiceNode,
};

// Export credentials
export const credentialTypes = {
    kiotVietApi: KiotVietApi,
};
