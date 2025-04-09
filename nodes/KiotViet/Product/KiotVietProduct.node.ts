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
		displayName: 'Sản Phẩm KiotViet',
		name: 'kiotVietProduct',
		icon: 'file:../shared/kiotviet.svg',
		group: ['transform'],
		version: 1,
		subtitle: '={{$parameter["operation"] + ": " + $parameter["resource"]}}',
		description: 'Quản lý sản phẩm từ KiotViet',
		defaults: {
			name: 'Sản Phẩm KiotViet',
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
						description: 'Tạo sản phẩm mới',
						action: 'Tạo sản phẩm',
					},
					{
						name: 'Xoá',
						value: 'delete',
						description: 'Xoá sản phẩm',
						action: 'Xoá sản phẩm',
					},
					{
						name: 'Lấy Theo ID',
						value: 'get',
						description: 'Lấy sản phẩm theo ID',
						action: 'Lấy sản phẩm',
					},
					{
						name: 'Lấy Theo Mã',
						value: 'getByCode',
						description: 'Lấy sản phẩm theo mã',
						action: 'Lấy sản phẩm theo mã',
					},
					{
						name: 'Lấy Nhiều',
						value: 'getAll',
						description: 'Lấy danh sách sản phẩm',
						action: 'Lấy danh sách sản phẩm',
					},
					{
						name: 'Cập Nhật',
						value: 'update',
						description: 'Cập nhật sản phẩm',
						action: 'Cập nhật sản phẩm',
					},
				],
				default: 'getAll',
			},
			{
				displayName: 'ID Sản Phẩm',
				name: 'productId',
				type: 'string',
				required: true,
				default: '',
				displayOptions: {
					show: {
						operation: ['get', 'update', 'delete'],
					},
				},
				description: 'ID của sản phẩm',
			},
			{
				displayName: 'Mã Sản Phẩm',
				name: 'productCode',
				type: 'string',
				required: true,
				default: '',
				displayOptions: {
					show: {
						operation: ['getByCode'],
					},
				},
				description: 'Mã của sản phẩm',
			},
			{
				displayName: 'Lấy Toàn Bộ',
				name: 'returnAll',
				type: 'boolean',
				default: false,
				description: 'Lấy toàn bộ kết quả hoặc giới hạn số lượng',
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
				displayName: 'Tên Sản Phẩm',
				name: 'name',
				type: 'string',
				default: '',
				required: true,
				displayOptions: {
					show: {
						operation: ['create', 'update'],
					},
				},
				description: 'Tên của sản phẩm',
			},
			{
				displayName: 'ID Danh Mục',
				name: 'categoryId',
				type: 'string',
				default: '',
				required: true,
				displayOptions: {
					show: {
						operation: ['create'],
					},
				},
				description: 'Mã danh mục mà sản phẩm thuộc về',
			},
			{
				displayName: 'Giá Gốc',
				name: 'basePrice',
				type: 'number',
				default: 0,
				required: true,
				displayOptions: {
					show: {
						operation: ['create'],
					},
				},
				description: 'Giá gốc của sản phẩm',
			},
			{
				displayName: 'Giá Bán Lẻ',
				name: 'retailPrice',
				type: 'number',
				default: 0,
				required: true,
				displayOptions: {
					show: {
						operation: ['create'],
					},
				},
				description: 'Giá bán lẻ của sản phẩm',
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
						displayName: 'Mã Sản Phẩm',
						name: 'code',
						type: 'string',
						default: '',
						description: 'Mã định danh của sản phẩm',
					},
					{
						displayName: 'Mô Tả',
						name: 'description',
						type: 'string',
						default: '',
						description: 'Mô tả sản phẩm',
					},
					{
						displayName: 'Đơn Vị',
						name: 'unit',
						type: 'string',
						default: '',
						description: 'Đơn vị tính của sản phẩm',
					},
					{
						displayName: 'Cho Phép Bán',
						name: 'allowsSale',
						type: 'boolean',
						default: true,
						description: 'Sản phẩm có được phép bán hay không',
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
						displayName: 'ID Danh Mục',
						name: 'categoryId',
						type: 'string',
						default: '',
						description: 'Lọc sản phẩm theo danh mục',
					},
					{
						displayName: 'Từ Khóa Tìm Kiếm',
						name: 'searchTerm',
						type: 'string',
						default: '',
						description: 'Tìm kiếm sản phẩm theo tên hoặc mã',
					},
					{
						displayName: 'Trạng Thái',
						name: 'status',
						type: 'options',
						options: [
							{
								name: 'Đang Hoạt Động',
								value: 'Active',
							},
							{
								name: 'Ngừng Hoạt Động',
								value: 'Inactive',
							},
						],
						default: 'Active',
						description: 'Lọc theo trạng thái sản phẩm',
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
				} else if (operation === 'getByCode') {
					const productCode = this.getNodeParameter('productCode', i) as string;
					const response = await productApi.getByCode(productCode);
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
