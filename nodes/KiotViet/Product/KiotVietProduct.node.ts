import type {
	IExecuteFunctions,
	IDataObject,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
} from 'n8n-workflow';
import { KiotVietApiBase } from '../shared/KiotVietApi';
import type {
	Product,
	ProductCreateParams,
	KiotVietListResponse,
	OperationResult,
} from '../shared/KiotVietTypes';

type ProductResponse = Product | KiotVietListResponse<Product> | OperationResult;

export class KiotVietProduct implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'KiotViet Product',
		name: 'kiotVietProduct',
		icon: 'file:kiotviet.svg',
		group: ['transform'],
		version: 1,
		subtitle: '={{$parameter["operation"] + ": " + $parameter["resource"]}}',
		description: 'Manage KiotViet products',
		defaults: {
			name: 'KiotViet Product',
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
						name: 'Create',
						value: 'create',
						description: 'Create a new product',
						action: 'Create a product',
					},
					{
						name: 'Delete',
						value: 'delete',
						description: 'Delete a product',
						action: 'Delete a product',
					},
					{
						name: 'Get',
						value: 'get',
						description: 'Get a product by ID',
						action: 'Get a product',
					},
					{
						name: 'Get Many',
						value: 'getAll',
						description: 'Get many products',
						action: 'Get many products',
					},
					{
						name: 'Update',
						value: 'update',
						description: 'Update a product',
						action: 'Update a product',
					},
				],
				default: 'getAll',
			},
			// Fields for Get operation
			{
				displayName: 'Product ID',
				name: 'productId',
				type: 'string',
				required: true,
				default: '',
				displayOptions: {
					show: {
						operation: ['get', 'update', 'delete'],
					},
				},
				description: 'The ID of the product',
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
			// Fields for Create/Update operations
			{
				displayName: 'Product Name',
				name: 'name',
				type: 'string',
				default: '',
				required: true,
				displayOptions: {
					show: {
						operation: ['create', 'update'],
					},
				},
				description: 'Name of the product',
			},
			{
				displayName: 'Category ID',
				name: 'categoryId',
				type: 'string',
				default: '',
				required: true,
				displayOptions: {
					show: {
						operation: ['create'],
					},
				},
				description: 'ID of the category this product belongs to',
			},
			{
				displayName: 'Base Price',
				name: 'basePrice',
				type: 'number',
				default: 0,
				required: true,
				displayOptions: {
					show: {
						operation: ['create'],
					},
				},
				description: 'Base price of the product',
			},
			{
				displayName: 'Retail Price',
				name: 'retailPrice',
				type: 'number',
				default: 0,
				required: true,
				displayOptions: {
					show: {
						operation: ['create'],
					},
				},
				description: 'Retail price of the product',
			},
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
						displayName: 'Code',
						name: 'code',
						type: 'string',
						default: '',
						description: 'Product code',
					},
					{
						displayName: 'Description',
						name: 'description',
						type: 'string',
						default: '',
						description: 'Product description',
					},
					{
						displayName: 'Unit',
						name: 'unit',
						type: 'string',
						default: '',
						description: 'Product unit',
					},
					{
						displayName: 'Allow Sale',
						name: 'allowsSale',
						type: 'boolean',
						default: true,
						description: 'Whether the product can be sold',
					},
				],
			},
			// Fields for filtering Get Many operation
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
						displayName: 'Category ID',
						name: 'categoryId',
						type: 'string',
						default: '',
						description: 'Filter products by category ID',
					},
					{
						displayName: 'Search Term',
						name: 'searchTerm',
						type: 'string',
						default: '',
						description: 'Search products by name or code',
					},
					{
						displayName: 'Status',
						name: 'status',
						type: 'options',
						options: [
							{
								name: 'Active',
								value: 'Active',
							},
							{
								name: 'Inactive',
								value: 'Inactive',
							},
						],
						default: 'Active',
						description: 'Filter products by status',
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
				let responseData: ProductResponse | undefined;
				const productApi = await kiotViet.products();

				if (operation === 'create') {
					const name = this.getNodeParameter('name', i) as string;
					const categoryId = parseInt(this.getNodeParameter('categoryId', i) as string);
					const basePrice = this.getNodeParameter('basePrice', i) as number;
					const retailPrice = this.getNodeParameter('retailPrice', i) as number;
					const additionalFields = this.getNodeParameter('additionalFields', i) as IDataObject;

					const productData: ProductCreateParams = {
						name,
						categoryId,
						basePrice,
						retailPrice,
						...additionalFields,
					};

					const response = await productApi.create(productData);
					responseData = response as unknown as Product;
				} else if (operation === 'get') {
					const productId = parseInt(this.getNodeParameter('productId', i) as string);
					const response = await productApi.getById(productId);
					responseData = response as unknown as Product;
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

					const response = await productApi.list(qs);
					responseData = response as unknown as KiotVietListResponse<Product>;
				} else if (operation === 'update') {
					const productId = parseInt(this.getNodeParameter('productId', i) as string);
					const name = this.getNodeParameter('name', i) as string;
					const additionalFields = this.getNodeParameter('additionalFields', i) as IDataObject;

					const productData = {
						id: productId,
						name,
						...additionalFields,
					};

					const response = await productApi.update(productId, productData);
					responseData = response as unknown as Product;
				} else if (operation === 'delete') {
					const productId = parseInt(this.getNodeParameter('productId', i) as string);
					await productApi.delete(productId);
					responseData = { success: true } as OperationResult;
				}

				if (responseData) {
					const executionData = this.helpers.constructExecutionMetaData(
						this.helpers.returnJsonArray(responseData as IDataObject),
						{ itemData: { item: i } },
					);
					returnData.push(...executionData);
				}
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
