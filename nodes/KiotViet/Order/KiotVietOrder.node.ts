import type {
	IExecuteFunctions,
	IDataObject,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
} from 'n8n-workflow';
import { NodeOperationError } from 'n8n-workflow';
import { KiotVietApiBase } from '../shared/KiotVietApi';
import type {
	Order,
	OrderCreateParams,
	OrderUpdateParams,
	KiotVietListResponse,
	OrderHandler,
	OrderProduct,
} from '../shared/KiotVietTypes';

export class KiotVietOrder implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'KiotViet Order',
		name: 'kiotVietOrder',
		icon: 'file:../shared/kiotviet.svg',
		group: ['transform'],
		version: 1,
		subtitle: '={{$parameter["operation"] + ": " + $parameter["resource"]}}',
		description: 'Manage KiotViet orders',
		defaults: {
			name: 'KiotViet Order',
		},
		inputs: ['main'],
		outputs: ['main'],
		credentials: [
			{
				name: 'kiotVietApi',
				required: true,
			},
		],
		properties: [
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				options: [
					{
						name: 'Cancel',
						value: 'cancel',
						description: 'Cancel an order',
						action: 'Cancel an order',
					},
					{
						name: 'Create',
						value: 'create',
						description: 'Create a new order',
						action: 'Create an order',
					},
					{
						name: 'Get',
						value: 'get',
						description: 'Get an order by ID',
						action: 'Get an order',
					},
					{
						name: 'Get Many',
						value: 'getAll',
						description: 'Get many orders',
						action: 'Get many orders',
					},
					{
						name: 'Update',
						value: 'update',
						description: 'Update an order',
						action: 'Update an order',
					},
				],
				default: 'getAll',
			},
			// Fields for Get/Update/Cancel operations
			{
				displayName: 'Order ID',
				name: 'orderId',
				type: 'string',
				required: true,
				default: '',
				displayOptions: {
					show: {
						operation: ['get', 'update', 'cancel'],
					},
				},
				description: 'The ID of the order',
			},
			// Fields for Cancel operation
			{
				displayName: 'Cancel Reason',
				name: 'cancelReason',
				type: 'string',
				default: '',
				displayOptions: {
					show: {
						operation: ['cancel'],
					},
				},
				description: 'Reason for canceling the order',
			},
			// Fields for Create/Update operations
			{
				displayName: 'Branch ID',
				name: 'branchId',
				type: 'string',
				required: true,
				default: '',
				displayOptions: {
					show: {
						operation: ['create'],
					},
				},
				description: 'ID of the branch where the order is created',
			},
			{
				displayName: 'Order Products',
				name: 'orderProducts',
				placeholder: 'Add Product',
				type: 'fixedCollection',
				typeOptions: {
					multipleValues: true,
				},
				displayOptions: {
					show: {
						operation: ['create', 'update'],
					},
				},
				options: [
					{
						name: 'products',
						displayName: 'Product',
						values: [
							{
								displayName: 'Product ID',
								name: 'productId',
								type: 'string',
								default: '',
								required: true,
								description: 'ID of the product',
							},
							{
								displayName: 'Quantity',
								name: 'quantity',
								type: 'number',
								default: 1,
								required: true,
								description: 'Quantity of the product',
							},
							{
								displayName: 'Price',
								name: 'price',
								type: 'number',
								default: 0,
								required: true,
								description: 'Price of the product',
							},
							{
								displayName: 'Discount',
								name: 'discount',
								type: 'number',
								default: 0,
								description: 'Discount amount for the product',
							},
							{
								displayName: 'Note',
								name: 'note',
								type: 'string',
								default: '',
								description: 'Note for the product',
							},
						],
					},
				],
				default: {},
				description: 'Products in the order',
			},
			// Additional fields for Create/Update
			{
				displayName: 'Additional Fields',
				name: 'additionalFields',
				type: 'collection',
				placeholder: 'Add Field',
				default: {},
				displayOptions: {
					show: {
						operation: ['create', 'update'],
					},
				},
				options: [
					{
						displayName: 'Customer ID',
						name: 'customerId',
						type: 'string',
						default: '',
						description: 'ID of the customer',
					},
					{
						displayName: 'Description',
						name: 'description',
						type: 'string',
						default: '',
						description: 'Order description',
					},
					{
						displayName: 'Discount',
						name: 'discount',
						type: 'number',
						default: 0,
						description: 'Discount amount for the entire order',
					},
					{
						displayName: 'Make Invoice',
						name: 'makeInvoice',
						type: 'boolean',
						default: false,
						description: 'Whether to create an invoice for this order',
					},
				],
			},
			// Fields for Get Many operation
			{
				displayName: 'Return All',
				name: 'returnAll',
				type: 'boolean',
				default: false,
				description: 'Whether to return all results or only up to a given limit',
				displayOptions: {
					show: {
						operation: ['getAll'],
					},
				},
			},
			{
				displayName: 'Limit',
				name: 'limit',
				type: 'number',
				default: 50,
				description: 'Max number of results to return',
				typeOptions: {
					minValue: 1,
				},
				displayOptions: {
					show: {
						operation: ['getAll'],
						returnAll: [false],
					},
				},
			},
			// Filters for Get Many operation
			{
				displayName: 'Filters',
				name: 'filters',
				type: 'collection',
				placeholder: 'Add Filter',
				default: {},
				displayOptions: {
					show: {
						operation: ['getAll'],
					},
				},
				options: [
					{
						displayName: 'Status',
						name: 'status',
						type: 'options',
						options: [
							{
								name: 'Completed',
								value: 'Completed',
							},
							{
								name: 'Processing',
								value: 'Processing',
							},
							{
								name: 'Canceled',
								value: 'Canceled',
							},
						],
						default: 'Processing',
						description: 'Status of the orders to return',
					},
					{
						displayName: 'Customer ID',
						name: 'customerId',
						type: 'string',
						default: '',
						description: 'Filter orders by customer ID',
					},
					{
						displayName: 'Created From',
						name: 'createdFrom',
						type: 'string',
						default: '',
						description: 'Filter orders created from date (YYYY-MM-DD)',
					},
					{
						displayName: 'Created To',
						name: 'createdTo',
						type: 'string',
						default: '',
						description: 'Filter orders created to date (YYYY-MM-DD)',
					},
				],
			},
		],
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const returnData: INodeExecutionData[] = [];
		const operation = this.getNodeParameter('operation', 0) as string;

		const kiotViet = new KiotVietApiBase(this);
		await kiotViet.init();

		for (let i = 0; i < items.length; i++) {
			try {
				const sdkOrderApi = await kiotViet.orders();
				const orderApi = sdkOrderApi as unknown as OrderHandler;

				let responseData: IDataObject = {};

				if (operation === 'create') {
					const branchId = parseInt(this.getNodeParameter('branchId', i) as string);
					const orderProductsData = this.getNodeParameter(
						'orderProducts.products',
						i,
						[],
					) as IDataObject[];
					const additionalFields = this.getNodeParameter('additionalFields', i) as IDataObject;

					const orderDetails: OrderProduct[] = orderProductsData.map((product) => ({
						productId: parseInt(product.productId as string),
						productCode: '', // Will be filled by API
						productName: '', // Will be filled by API
						quantity: product.quantity as number,
						price: product.price as number,
						discount: product.discount as number,
						note: product.note as string,
					}));

					const orderData: OrderCreateParams = {
						branchId,
						orderDetails,
						...additionalFields,
					};

					if (additionalFields.customerId) {
						orderData.customerId = parseInt(additionalFields.customerId as string);
					}

					const response = await orderApi.create(orderData);
					responseData = response as unknown as IDataObject;
				} else if (operation === 'get') {
					const orderId = parseInt(this.getNodeParameter('orderId', i) as string);
					const response = await orderApi.getById(orderId);
					responseData = response as unknown as IDataObject;
				} else if (operation === 'getAll') {
					const returnAll = this.getNodeParameter('returnAll', i) as boolean;
					const filters = this.getNodeParameter('filters', i) as IDataObject;

					const qs: IDataObject = {
						...filters,
					};

					if (!returnAll) {
						const limit = this.getNodeParameter('limit', i) as number;
						qs.pageSize = limit;
					}

					const response = await orderApi.list(qs);
					responseData = response as unknown as IDataObject;
				} else if (operation === 'update') {
					if (!orderApi.update) {
						throw new NodeOperationError(
							this.getNode(),
							'Update operation is not supported by the KiotViet API',
						);
					}

					const orderId = parseInt(this.getNodeParameter('orderId', i) as string);
					const orderProductsData = this.getNodeParameter(
						'orderProducts.products',
						i,
						[],
					) as IDataObject[];
					const additionalFields = this.getNodeParameter('additionalFields', i) as IDataObject;

					const orderDetails: OrderProduct[] = orderProductsData.map((product) => ({
						productId: parseInt(product.productId as string),
						productCode: '', // Will be filled by API
						productName: '', // Will be filled by API
						quantity: product.quantity as number,
						price: product.price as number,
						discount: product.discount as number,
						note: product.note as string,
					}));

					const orderData: OrderUpdateParams = {
						id: orderId,
						orderDetails,
						...additionalFields,
					};

					if (additionalFields.customerId) {
						orderData.customerId = parseInt(additionalFields.customerId as string);
					}

					const response = await orderApi.update(orderId, orderData);
					responseData = response as unknown as IDataObject;
				} else if (operation === 'cancel') {
					if (!orderApi.cancel) {
						throw new NodeOperationError(
							this.getNode(),
							'Cancel operation is not supported by the KiotViet API',
						);
					}

					const orderId = parseInt(this.getNodeParameter('orderId', i) as string);
					const cancelReason = this.getNodeParameter('cancelReason', i) as string;

					const response = await orderApi.cancel(orderId, cancelReason);
					responseData = response as unknown as IDataObject;
				}

				const executionData = this.helpers.constructExecutionMetaData(
					this.helpers.returnJsonArray(responseData),
					{ itemData: { item: i } },
				);
				returnData.push(...executionData);
			} catch (error) {
				if (this.continueOnFail()) {
					const executionErrorData = this.helpers.constructExecutionMetaData(
						this.helpers.returnJsonArray({ error: error.message }),
						{ itemData: { item: i } },
					);
					returnData.push(...executionErrorData);
					continue;
				}
				throw error;
			}
		}

		return [returnData];
	}
}
