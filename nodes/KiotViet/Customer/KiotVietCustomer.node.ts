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
		displayName: 'Khách hàng KiotViet',
		name: 'kiotVietCustomer',
		icon: 'file:../shared/kiotviet.svg',
		group: ['transform'],
		version: 1,
		subtitle: '={{$parameter["operation"] + ": " + $parameter["resource"]}}',
		description: 'Quản lý thông tin khách hàng từ KiotViet',
		defaults: {
			name: 'Khách hàng KiotViet',
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
				displayName: 'Thao tác',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				options: [
					{
						name: 'Tạo mới',
						value: 'create',
						description: 'Tạo khách hàng mới',
						action: 'Tạo khách hàng',
					},
					{
						name: 'Lấy theo ID',
						value: 'get',
						description: 'Lấy thông tin khách hàng theo ID',
						action: 'Lấy khách hàng',
					},
					{
						name: 'Lấy nhiều',
						value: 'getAll',
						description: 'Lấy danh sách nhiều khách hàng',
						action: 'Lấy danh sách khách hàng',
					},
					{
						name: 'Cập nhật',
						value: 'update',
						description: 'Cập nhật thông tin khách hàng',
						action: 'Cập nhật khách hàng',
					},
				],
				default: 'getAll',
			},
			{
				displayName: 'ID Khách hàng',
				name: 'customerId',
				type: 'string',
				required: true,
				default: '',
				displayOptions: {
					show: {
						operation: ['get', 'update'],
					},
				},
				description: 'Mã định danh của khách hàng',
			},
			{
				displayName: 'Lấy toàn bộ',
				name: 'returnAll',
				type: 'boolean',
				default: false,
				description: 'Chọn để lấy toàn bộ kết quả hoặc giới hạn số lượng',
				displayOptions: {
					show: {
						operation: ['getAll'],
					},
				},
			},
			{
				displayName: 'Giới hạn',
				name: 'limit',
				type: 'number',
				default: 50,
				description: 'Số lượng kết quả tối đa cần lấy',
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
			{
				displayName: 'Tên khách hàng',
				name: 'name',
				type: 'string',
				default: '',
				required: true,
				displayOptions: {
					show: {
						operation: ['create', 'update'],
					},
				},
				description: 'Họ tên của khách hàng',
			},
			{
				displayName: 'Trường bổ sung',
				name: 'additionalFields',
				type: 'collection',
				placeholder: 'Thêm trường',
				default: {},
				displayOptions: {
					show: {
						operation: ['create', 'update'],
					},
				},
				options: [
					{
						displayName: 'Số điện thoại',
						name: 'contactNumber',
						type: 'string',
						default: '',
						description: 'Số liên lạc của khách hàng',
					},
					{
						displayName: 'Email',
						name: 'email',
						type: 'string',
						default: '',
						placeholder: 'ten@email.com',
						description: 'Email của khách hàng',
					},
					{
						displayName: 'Địa chỉ',
						name: 'address',
						type: 'string',
						default: '',
						description: 'Địa chỉ khách hàng',
					},
					{
						displayName: 'Giới tính',
						name: 'gender',
						type: 'boolean',
						default: true,
						description: 'Nam (true) hoặc Nữ (false)',
					},
					{
						displayName: 'Ngày sinh',
						name: 'birthDate',
						type: 'string',
						default: '',
						description: 'Ngày sinh của khách hàng (YYYY-MM-DD)',
					},
					{
						displayName: 'Nhóm khách hàng',
						name: 'groupIds',
						type: 'string',
						default: '',
						description: 'Danh sách ID nhóm khách hàng (ngăn cách bởi dấu phẩy)',
					},
				],
			},
			{
				displayName: 'Bộ lọc',
				name: 'filters',
				type: 'collection',
				placeholder: 'Thêm bộ lọc',
				default: {},
				displayOptions: {
					show: {
						operation: ['getAll'],
					},
				},
				options: [
					{
						displayName: 'Từ khóa tìm kiếm',
						name: 'searchTerm',
						type: 'string',
						default: '',
						description: 'Tìm theo tên, số điện thoại hoặc mã khách hàng',
					},
					{
						displayName: 'ID nhóm',
						name: 'groupId',
						type: 'string',
						default: '',
						description: 'Lọc khách hàng theo ID nhóm',
					},
					{
						displayName: 'Sửa đổi từ ngày',
						name: 'lastModifiedFrom',
						type: 'string',
						default: '',
						description: 'Lọc khách hàng có thay đổi từ ngày (YYYY-MM-DD)',
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

				let responseData: IDataObject | Customer | Customer[] = {};

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

					responseData = await customerApi.create(customerData);
				} else if (operation === 'get') {
					const customerId = parseInt(this.getNodeParameter('customerId', i) as string);
					responseData = await customerApi.getById(customerId);
				} else if (operation === 'getAll') {
					const returnAll = this.getNodeParameter('returnAll', i) as boolean;
					const filters = this.getNodeParameter('filters', i) as IDataObject;

					let qs: IDataObject = {
						...filters,
						currentItem: 0,
						pageSize: returnAll ? 100 : (this.getNodeParameter('limit', i) as number),
					};

					// First request to get total count and first page
					let response: KiotVietListResponse<Customer>;
					try {
						response = (await customerApi.list(qs)) as KiotVietListResponse<Customer>;
					} catch (error) {
						throw new NodeOperationError(
							this.getNode(),
							`Failed to fetch customers: ${error.message}`,
						);
					}

					let results: Customer[] = [...response.data];

					// If we need all results and there are more pages
					if (returnAll && response.total > response.pageSize) {
						let currentItem = response.pageSize;

						// Keep fetching until we get all items
						while (currentItem < response.total) {
							try {
								// Add a small delay to avoid rate limits
								await new Promise((resolve) => setTimeout(resolve, 100));

								qs = {
									...qs,
									currentItem,
								};

								const pageResponse = (await customerApi.list(qs)) as KiotVietListResponse<Customer>;
								if (!pageResponse.data || pageResponse.data.length === 0) break;

								results = [...results, ...pageResponse.data];
								currentItem += pageResponse.pageSize;
							} catch (error) {
								// Log the error but continue with partial results
								console.error('Error fetching page:', error);
								break;
							}
						}

						responseData = { data: results };
					} else {
						responseData = { data: response.data };
					}
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

				let returnItem: IDataObject | IDataObject[];
				if (Array.isArray(responseData)) {
					returnItem = responseData;
				} else if (responseData && typeof responseData === 'object') {
					returnItem = responseData;
				} else {
					returnItem = { json: responseData };
				}

				const executionData = this.helpers.constructExecutionMetaData(
					this.helpers.returnJsonArray(returnItem),
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
