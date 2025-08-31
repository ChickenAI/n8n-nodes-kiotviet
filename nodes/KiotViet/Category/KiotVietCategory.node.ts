import type {
	IExecuteFunctions,
	IDataObject,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
} from 'n8n-workflow';
import { NodeOperationError } from 'n8n-workflow';
import type {
	Category,
	CategoryCreateParams,
	CategoryUpdateParams,
	KiotVietListResponse,
	CategoryHandler,
} from '../shared/KiotVietTypes';
import { KiotVietApiBase } from '../shared/KiotVietApi';

export class KiotVietCategory implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Danh Mục KiotViet',
		name: 'kiotVietCategory',
		icon: 'file:../shared/kiotviet.svg',
		group: ['transform'],
		version: 1,
		subtitle: '={{$parameter["operation"] + ": " + $parameter["resource"]}}',
		description: 'Quản lý danh mục sản phẩm từ KiotViet',
		defaults: {
			name: 'Danh Mục KiotViet',
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
				displayName: 'Thao Tác',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				options: [
					{
						name: 'Tạo Mới',
						value: 'create',
						description: 'Tạo danh mục mới',
						action: 'T o danh m c',
					},
					{
						name: 'Lấy Theo ID',
						value: 'get',
						description: 'Lấy danh mục theo ID',
						action: 'L y danh m c',
					},
					{
						name: 'Get Many',
						value: 'getAll',
						description: 'Lấy danh sách danh mục',
						action: 'L y danh s ch danh m c',
					},
					{
						name: 'Cập Nhật',
						value: 'update',
						description: 'Cập nhật danh mục',
						action: 'C p nh t danh m c',
					},
				],
				default: 'getAll',
			},
			{
				displayName: 'ID Danh Mục',
				name: 'categoryId',
				type: 'string',
				required: true,
				default: '',
				displayOptions: {
					show: {
						operation: ['get', 'update'],
					},
				},
				description: 'Mã định danh của danh mục',
			},
			{
				displayName: 'Tên Danh Mục',
				name: 'name',
				type: 'string',
				default: '',
				required: true,
				displayOptions: {
					show: {
						operation: ['create', 'update'],
					},
				},
				description: 'Tên của danh mục',
			},
			{
				displayName: 'Trả Về Tất Cả',
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
				displayName: 'Giới Hạn',
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
			{
				displayName: 'Trường Bổ Sung',
				name: 'additionalFields',
				type: 'collection',
				placeholder: 'Thêm Trường',
				default: {},
				displayOptions: {
					show: {
						operation: ['create', 'update'],
					},
				},
				options: [
					{
						displayName: 'Mã Danh Mục',
						name: 'categoryCode',
						type: 'string',
						default: '',
						description: 'Mã danh mục (nếu không nhập sẽ tự động tạo)',
					},
					{
						displayName: 'ID Danh Mục Cha',
						name: 'parentId',
						type: 'string',
						default: '',
						description: 'ID của danh mục cha (nếu là danh mục con)',
					},
					{
						displayName: 'Mô Tả',
						name: 'description',
						type: 'string',
						default: '',
						description: 'Mô tả cho danh mục',
					},
					{
						displayName: 'Thứ Tự Hiển Thị',
						name: 'orderIndex',
						type: 'number',
						default: 0,
						description: 'Thứ tự sắp xếp của danh mục',
					},
					{
						displayName: 'Thuộc Tính',
						name: 'attributes',
						placeholder: 'Thêm Thuộc Tính',
						type: 'fixedCollection',
						typeOptions: {
							multipleValues: true,
						},
						default: {},
						options: [
							{
								name: 'attribute',
								displayName: 'Thuộc Tính',
								values: [
									{
										displayName: 'Tên Thuộc Tính',
										name: 'name',
										type: 'string',
										default: '',
										description: 'Tên của thuộc tính',
									},
									{
										displayName: 'Giá Trị',
										name: 'value',
										type: 'string',
										default: '',
										description: 'Giá trị của thuộc tính',
									},
								],
							},
						],
					},
				],
			},
			{
				displayName: 'Bộ Lọc',
				name: 'filters',
				type: 'collection',
				placeholder: 'Thêm Bộ Lọc',
				default: {},
				displayOptions: {
					show: {
						operation: ['getAll'],
					},
				},
				options: [
					{
						displayName: 'Trang',
						name: 'pageSize',
						type: 'number',
						default: 20,
						description: 'Số lượng kết quả mỗi trang',
					},
					{
						displayName: 'Số Trang',
						name: 'currentPage',
						type: 'number',
						default: 1,
						description: 'Số trang hiện tại',
					},
					{
						displayName: 'Từ Khóa',
						name: 'searchTerm',
						type: 'string',
						default: '',
						description: 'Tìm kiếm theo tên hoặc mã danh mục',
					},
					{
						displayName: 'ID Danh Mục Cha',
						name: 'parentId',
						type: 'string',
						default: '',
						description: 'Lọc theo ID danh mục cha',
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
				const sdkCategoryApi = await kiotViet.categories();
				const categoryApi = sdkCategoryApi as unknown as CategoryHandler;
				let responseData: IDataObject = {};

				if (operation === 'create') {
					const name = this.getNodeParameter('name', i) as string;
					const additionalFields = this.getNodeParameter('additionalFields', i) as IDataObject;

					const categoryData: CategoryCreateParams = {
						categoryName: name,
					};

					if (additionalFields.categoryCode) {
						categoryData.categoryCode = additionalFields.categoryCode as string;
					}

					if (additionalFields.parentId) {
						categoryData.parentId = parseInt(additionalFields.parentId as string);
					}

					if (additionalFields.description) {
						categoryData.description = additionalFields.description as string;
					}

					if (additionalFields.orderIndex) {
						categoryData.orderIndex = parseInt(additionalFields.orderIndex as string);
					}

					if (additionalFields.attributes) {
						const attributesCollection = (additionalFields.attributes as IDataObject)
							.attribute as IDataObject[];
						categoryData.attributes = attributesCollection.map((attr) => ({
							name: attr.name as string,
							value: attr.value as string,
						}));
					}

					const response = await categoryApi.create(categoryData);
					responseData = response as unknown as IDataObject;
				} else if (operation === 'get') {
					const categoryId = parseInt(this.getNodeParameter('categoryId', i) as string);
					const response = await categoryApi.getById(categoryId);
					responseData = response as unknown as IDataObject;
				} else if (operation === 'getAll') {
					const returnAll = this.getNodeParameter('returnAll', i) as boolean;
					const filters = this.getNodeParameter('filters', i) as IDataObject;

					if (!returnAll && !filters.pageSize) {
						const limit = this.getNodeParameter('limit', i) as number;
						filters.pageSize = limit;
					}

					const response = await categoryApi.list(filters);
					const listResponse = response as unknown as KiotVietListResponse<Category>;
					responseData = {
						data: listResponse.data ?? [],
						total: listResponse.total,
						pageSize: filters.pageSize,
						currentPage: filters.currentPage,
					};
				} else if (operation === 'update') {
					const categoryId = parseInt(this.getNodeParameter('categoryId', i) as string);
					const name = this.getNodeParameter('name', i) as string;
					const additionalFields = this.getNodeParameter('additionalFields', i) as IDataObject;

					const categoryData: CategoryUpdateParams = {
						id: categoryId,
						categoryName: name,
					};

					if (additionalFields.categoryCode) {
						categoryData.categoryCode = additionalFields.categoryCode as string;
					}

					if (additionalFields.parentId) {
						categoryData.parentId = parseInt(additionalFields.parentId as string);
					}

					if (additionalFields.description) {
						categoryData.description = additionalFields.description as string;
					}

					if (additionalFields.orderIndex) {
						categoryData.orderIndex = parseInt(additionalFields.orderIndex as string);
					}

					if (additionalFields.attributes) {
						const attributesCollection = (additionalFields.attributes as IDataObject)
							.attribute as IDataObject[];
						categoryData.attributes = attributesCollection.map((attr) => ({
							name: attr.name as string,
							value: attr.value as string,
						}));
					}

					if (!categoryApi.update) {
						throw new NodeOperationError(
							this.getNode(),
							'Update operation is not supported by the KiotViet API',
						);
					}

					const response = await categoryApi.update(categoryId, categoryData);
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
