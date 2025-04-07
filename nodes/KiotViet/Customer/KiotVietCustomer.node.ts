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
	Customer,
	CustomerCreateParams,
	CustomerUpdateParams,
	KiotVietListResponse,
	CustomerHandler,
} from '../shared/KiotVietTypes';

export class KiotVietCustomer implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'KiotViet Customer',
		name: 'kiotVietCustomer',
		icon: 'file:../shared/kiotviet.svg',
		group: ['transform'],
		version: 1,
		subtitle: '={{$parameter["operation"] + ": " + $parameter["resource"]}}',
		description: 'Manage KiotViet customers',
		defaults: {
			name: 'KiotViet Customer',
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
						description: 'Create a new customer',
						action: 'Create a customer',
					},
					{
						name: 'Get',
						value: 'get',
						description: 'Get a customer by ID',
						action: 'Get a customer',
					},
					{
						name: 'Get Many',
						value: 'getAll',
						description: 'Get many customers',
						action: 'Get many customers',
					},
					{
						name: 'Update',
						value: 'update',
						description: 'Update a customer',
						action: 'Update a customer',
					},
				],
				default: 'getAll',
			},
			// Fields for Get operation
			{
				displayName: 'Customer ID',
				name: 'customerId',
				type: 'string',
				required: true,
				default: '',
				displayOptions: {
					show: {
						operation: ['get', 'update'],
					},
				},
				description: 'The ID of the customer',
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
				displayName: 'Customer Name',
				name: 'name',
				type: 'string',
				default: '',
				required: true,
				displayOptions: {
					show: {
						operation: ['create', 'update'],
					},
				},
				description: 'Name of the customer',
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
						displayName: 'Contact Number',
						name: 'contactNumber',
						type: 'string',
						default: '',
						description: 'Customer contact number',
					},
					{
						displayName: 'Email',
						name: 'email',
						type: 'string',
						default: '',
						placeholder: 'name@email.com',
						description: 'Customer email',
					},
					{
						displayName: 'Address',
						name: 'address',
						type: 'string',
						default: '',
						description: 'Customer address',
					},
					{
						displayName: 'Gender',
						name: 'gender',
						type: 'boolean',
						default: true,
						description: 'Whether the customer is male (true) or female (false)',
					},
					{
						displayName: 'Birth Date',
						name: 'birthDate',
						type: 'string',
						default: '',
						description: 'Customer birth date (YYYY-MM-DD)',
					},
					{
						displayName: 'Group IDs',
						name: 'groupIds',
						type: 'string',
						default: '',
						description: 'Comma-separated list of customer group IDs',
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
						displayName: 'Search Term',
						name: 'searchTerm',
						type: 'string',
						default: '',
						description: 'Search customers by name, phone, or code',
					},
					{
						displayName: 'Group ID',
						name: 'groupId',
						type: 'string',
						default: '',
						description: 'Filter customers by group ID',
					},
					{
						displayName: 'Modified From',
						name: 'lastModifiedFrom',
						type: 'string',
						default: '',
						description: 'Filter customers modified from date (YYYY-MM-DD)',
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
				const sdkCustomerApi = await kiotViet.customers();
				const customerApi = sdkCustomerApi as unknown as CustomerHandler;

				let responseData: IDataObject = {};

				if (operation === 'create') {
					const name = this.getNodeParameter('name', i) as string;
					const additionalFields = this.getNodeParameter('additionalFields', i) as IDataObject;

					const customerData: CustomerCreateParams = {
						name,
						...additionalFields,
					};

					if (additionalFields.groupIds) {
						customerData.groupIds = (additionalFields.groupIds as string)
							.split(',')
							.map((id) => parseInt(id.trim()))
							.filter(Boolean);
					}

					const response = await customerApi.create(customerData);
					responseData = response as unknown as IDataObject;
				} else if (operation === 'get') {
					const customerId = parseInt(this.getNodeParameter('customerId', i) as string);
					const response = await customerApi.getById(customerId);
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

					const response = await customerApi.list(qs);
					responseData = response as unknown as IDataObject;
				} else if (operation === 'update') {
					if (!customerApi.update) {
						throw new NodeOperationError(
							this.getNode(),
							'Update operation is not supported by the KiotViet API',
						);
					}

					const customerId = parseInt(this.getNodeParameter('customerId', i) as string);
					const name = this.getNodeParameter('name', i) as string;
					const additionalFields = this.getNodeParameter('additionalFields', i) as IDataObject;

					const customerData: CustomerUpdateParams = {
						id: customerId,
						name,
						...additionalFields,
					};

					if (additionalFields.groupIds) {
						customerData.groupIds = (additionalFields.groupIds as string)
							.split(',')
							.map((id) => parseInt(id.trim()))
							.filter(Boolean);
					}

					const response = await customerApi.update(customerId, customerData);
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
