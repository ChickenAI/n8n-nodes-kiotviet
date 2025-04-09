import type { IDataObject } from 'n8n-workflow';

// Base response interface
export interface KiotVietListResponse<T> extends IDataObject {
	data: T[];
	total: number;
	pageSize: number;
	currentItem: number;
}

// Product interfaces
export interface ProductCreateParams {
	code?: string;
	name: string;
	categoryId?: number;
	basePrice: number;
	retailPrice: number;
	weight?: number;
	unit?: string;
	allowsSale?: boolean;
	description?: string;
	attributes?: ProductAttribute[];
}

export interface ProductUpdateParams extends Partial<ProductCreateParams> {
	id: number;
}

export interface ProductHandler {
	list(params?: IDataObject): Promise<KiotVietListResponse<Product>>;
	create(data: ProductCreateParams): Promise<Product>;
	getById(id: number): Promise<Product>;
	getByCode(code: string): Promise<Product>;
	update?: (id: number, data: ProductUpdateParams) => Promise<Product>;
	delete?: (id: number) => Promise<OperationResult>;
}

export interface ProductAttribute {
	attributeName: string;
	attributeValue: string;
}

export interface Product extends IDataObject {
	id: number;
	code: string;
	name: string;
	categoryId?: number;
	basePrice: number;
	retailPrice: number;
	weight?: number;
	unit?: string;
	allowsSale: boolean;
	status: 'Active' | 'Inactive';
	description?: string;
	attributes?: ProductAttribute[];
	inventories?: ProductInventory[];
	modifiedDate: string;
	createdDate: string;
}

export interface ProductInventory {
	branchId: number;
	branchName: string;
	onHand: number;
	reserved: number;
	available: number;
}

// Order interfaces
export interface OrderCreateParams extends IDataObject {
	branchId: number;
	customerId?: number;
	description?: string;
	orderDetails: OrderProduct[];
	discount?: number;
	status?: 'Processing' | 'Completed' | 'Canceled';
}

export interface OrderUpdateParams extends Partial<OrderCreateParams> {
	id: number;
}

export interface OrderProduct {
	productId: number;
	productCode: string;
	productName: string;
	quantity: number;
	price: number;
	discount?: number;
	note?: string;
}

export interface Order extends IDataObject {
	id: number;
	code: string;
	branchId: number;
	customerId?: number;
	customerName?: string;
	discount?: number;
	description?: string;
	status: 'Processing' | 'Completed' | 'Canceled';
	total: number;
	orderDetails: OrderProduct[];
	createdDate: string;
	modifiedDate: string;
}

export interface OrderHandler {
	list(params?: IDataObject): Promise<KiotVietListResponse<Order>>;
	create(data: OrderCreateParams): Promise<Order>;
	getById(id: number): Promise<Order>;
	getByCode(code: string): Promise<Order>;
	update?: (id: number, data: OrderUpdateParams) => Promise<Order>;
	cancel?: (id: number, reason?: string) => Promise<Order>;
}

// Invoice interfaces
export interface InvoiceCreateParams extends IDataObject {
	branchId: number;
	customerId?: number;
	description?: string;
	invoiceDetails: InvoiceDetail[];
	discount?: number;
	status?: 'Draft' | 'InProgress' | 'Completed' | 'Canceled';
	paymentMethod?: PaymentMethod;
	totalPayment?: number;
}

export interface InvoiceUpdateParams extends Partial<InvoiceCreateParams> {
	id: number;
}

export interface InvoiceDetail {
	productId: number;
	productCode: string;
	productName: string;
	quantity: number;
	price: number;
	discount?: number;
	note?: string;
}

export type PaymentMethod = 'Cash' | 'Card' | 'Transfer' | 'Other';

export interface Invoice extends IDataObject {
	id: number;
	code: string;
	branchId: number;
	customerId?: number;
	customerName?: string;
	discount?: number;
	description?: string;
	status: 'Draft' | 'InProgress' | 'Completed' | 'Canceled';
	total: number;
	totalPayment: number;
	remainAmount: number;
	paymentMethod: PaymentMethod;
	invoiceDetails: InvoiceDetail[];
	createdDate: string;
	modifiedDate: string;
}

export interface InvoiceHandler {
	list(params?: IDataObject): Promise<KiotVietListResponse<Invoice>>;
	create(data: InvoiceCreateParams): Promise<Invoice>;
	getById(id: number): Promise<Invoice>;
	getByCode(code: string): Promise<Invoice>;
	update?: (id: number, data: InvoiceUpdateParams) => Promise<Invoice>;
	cancel?: (id: number, reason?: string) => Promise<Invoice>;
}

// Customer interfaces
export interface CustomerCreateParams extends IDataObject {
	name: string;
	code?: string;
	contactNumber?: string;
	email?: string;
	address?: string;
	gender?: boolean;
	birthDate?: string;
	groupIds?: number[];
}

export interface CustomerUpdateParams extends CustomerCreateParams {
	id: number;
}

export interface Customer extends IDataObject {
	id: number;
	code: string;
	name: string;
	contactNumber?: string;
	email?: string;
	address?: string;
	gender?: boolean;
	birthDate?: string;
	groupIds?: number[];
	type?: number;
	debt: number;
	totalInvoiced?: number;
	totalPoint?: number;
	totalRevenue?: number;
	modifiedDate?: string;
	createdDate: string;
}

export interface CustomerHandler {
	list(params?: IDataObject): Promise<KiotVietListResponse<Customer>>;
	create(data: CustomerCreateParams): Promise<Customer>;
	getById(id: number): Promise<Customer>;
	update?: (id: number, data: CustomerUpdateParams) => Promise<Customer>;
}

// Operation result interface
export interface OperationResult extends IDataObject {
	success: boolean;
	message?: string;
}

// Webhook interfaces
export interface WebhookCreateParams {
	url: string;
	events: string[];
	branchId?: string;
	status?: string[];
}

export interface Webhook {
	id: string;
	url: string;
	events: string[];
	branchId?: string;
	status?: string[];
	createdAt: string;
	updatedAt: string;
}

// Category interfaces
export interface CategoryCreateParams extends IDataObject {
	categoryName: string;
	categoryCode?: string;
	parentId?: number;
	description?: string;
	orderIndex?: number;
	attributes?: CategoryAttribute[];
}

export interface CategoryUpdateParams extends Partial<CategoryCreateParams> {
	id: number;
}

export interface CategoryAttribute {
	name: string;
	value: string;
}

// Purchase Order interfaces
export interface PurchaseOrderCreateParams extends IDataObject {
	branchId: number;
	supplierId: number;
	orderDetails: PurchaseOrderProduct[];
	description?: string;
	discount?: number;
	status?: 'Processing' | 'Completed' | 'Canceled';
}

export interface PurchaseOrderUpdateParams extends Partial<PurchaseOrderCreateParams> {
	id: number;
}

export interface PurchaseOrderProduct {
	productId: number;
	productCode: string;
	productName: string;
	quantity: number;
	price: number;
	discount?: number;
	note?: string;
}

// Supplier interfaces
export interface SupplierCreateParams {
	name: string;
	code?: string;
	contactNumber?: string;
	email?: string;
	address?: string;
	description?: string;
	status?: 'Active' | 'Inactive';
}

export interface SupplierUpdateParams extends Partial<SupplierCreateParams> {
	id: number;
}

export interface Supplier extends IDataObject {
	id: number;
	code: string;
	name: string;
	contactNumber?: string;
	email?: string;
	address?: string;
	description?: string;
	status: 'Active' | 'Inactive';
	debt: number;
	totalInvoiced: number;
	createdDate: string;
	modifiedDate: string;
}

export interface SupplierHandler {
	list(params?: IDataObject): Promise<KiotVietListResponse<Supplier>>;
	create(data: SupplierCreateParams): Promise<Supplier>;
	getById(id: number): Promise<Supplier>;
	update(id: number, data: SupplierUpdateParams): Promise<Supplier>;
	delete(id: number): Promise<void>;
}

// Branch interfaces
export interface BranchCreateParams {
	name: string;
	code?: string;
	address?: string;
	phoneNumber?: string;
	description?: string;
	retailerId?: number;
	status?: 'Active' | 'Inactive';
}

export interface BranchUpdateParams extends Partial<BranchCreateParams> {
	id: number;
}

export interface Branch extends IDataObject {
	id: number;
	code: string;
	name: string;
	address?: string;
	phoneNumber?: string;
	description?: string;
	status: 'Active' | 'Inactive';
	createdDate: string;
	modifiedDate: string;
}

export interface BranchHandler {
	list(params?: IDataObject): Promise<KiotVietListResponse<Branch>>;
	create(data: BranchCreateParams): Promise<Branch>;
	getById(id: number): Promise<Branch>;
	update?: (id: number, data: BranchUpdateParams) => Promise<Branch>;
	delete?: (id: number) => Promise<void>;
}

export interface PurchaseOrder extends IDataObject {
	id: number;
	code: string;
	branchId: number;
	supplierId: number;
	supplierName?: string;
	discount?: number;
	description?: string;
	status: 'Processing' | 'Completed' | 'Canceled';
	total: number;
	orderDetails: PurchaseOrderProduct[];
	createdDate: string;
	modifiedDate: string;
}

export interface PurchaseOrderHandler {
	list(params?: IDataObject): Promise<KiotVietListResponse<PurchaseOrder>>;
	create(data: PurchaseOrderCreateParams): Promise<PurchaseOrder>;
	getById(id: number): Promise<PurchaseOrder>;
	getByCode(code: string): Promise<PurchaseOrder>;
	update?: (id: number, data: PurchaseOrderUpdateParams) => Promise<PurchaseOrder>;
	cancel?: (id: number) => Promise<PurchaseOrder>;
}

export interface Category extends IDataObject {
	id: number;
	categoryName: string;
	categoryCode: string;
	parentId?: number;
	description?: string;
	orderIndex: number;
	attributes?: CategoryAttribute[];
	hasChild: boolean;
	modifiedDate: string;
	createdDate: string;
}

export interface CategoryHandler {
	list(params?: IDataObject): Promise<KiotVietListResponse<Category>>;
	create(data: CategoryCreateParams): Promise<Category>;
	getById(id: number): Promise<Category>;
	update?: (id: number, data: CategoryUpdateParams) => Promise<Category>;
}
