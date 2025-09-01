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
						name: 'Lấy Tồn Kho',
						value: 'getInventoryLevels',
						description: 'Lấy thông tin tồn kho của sản phẩm',
						action: 'Lấy thông tin tồn kho',
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
						displayName: 'ĐơN Vị',
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
					{
						displayName: 'Mã Vạch',
						name: 'barCode',
						type: 'string',
						default: '',
						description: 'Mã vạch của sản phẩm (tối đa 16 ký tự)',
					},
					{
						displayName: 'Tên Đầy Đủ',
						name: 'fullName',
						type: 'string',
						default: '',
						description: 'Tên sản phẩm bao gồm thuộc tính và đơn vị tính',
					},
					{
						displayName: 'Có Thuộc Tính (hasVariants)',
						name: 'hasVariants',
						type: 'boolean',
						default: false,
						description: 'Sản phẩm có thuộc tính hay không',
					},
					{
						displayName: 'Sản Phẩm Serial',
						name: 'isProductSerial',
						type: 'boolean',
						default: false,
						description: 'Có phải sản phẩm serial hay không',
					},
					{
						displayName: 'Thuộc Tính (attributes)',
						name: 'attributes',
						type: 'fixedCollection',
						placeholder: 'Thêm thuộc tính',
						default: {},
						typeOptions: {
							multipleValues: true,
						},
						options: [
							{
								displayName: 'Thuộc Tính',
								name: 'attributes',
								values: [
									{
										displayName: 'Tên Thuộc Tính',
										name: 'attributeName',
										type: 'string',
										default: '',
									},
									{
										displayName: 'Giá Trị Thuộc Tính',
										name: 'attributeValue',
										type: 'string',
										default: '',
									},
								],
							},
						],
					},
					{
						displayName: 'ID Hàng Hóa Cha',
						name: 'masterProductId',
						type: 'number',
						default: undefined,
						description: 'ID hàng hóa cùng loại (nếu có)',
					},
					{
						displayName: 'ID Đơn Vị Cơ Bản',
						name: 'masterUnitId',
						type: 'number',
						default: undefined,
						description: 'ID của hàng hóa đơn vị cơ bản, = NULL nếu là đơn vị cơ bản',
					},
					{
						displayName: 'Giá Trị Quy Đổi',
						name: 'conversionValue',
						type: 'number',
						default: undefined,
						description: 'Giá trị quy đổi giữa các đơn vị',
					},
					{
						displayName: 'Tồn Kho (inventories)',
						name: 'inventories',
						type: 'fixedCollection',
						placeholder: 'Thêm kho/chi nhánh',
						default: {},
						typeOptions: {
							multipleValues: true,
						},
						options: [
							{
								displayName: 'Kho',
								name: 'inventories',
								values: [
									{
										displayName: 'ID Chi Nhánh',
										name: 'branchId',
										type: 'number',
										default: undefined,
									},
									{
										displayName: 'Tên Chi Nhánh',
										name: 'branchName',
										type: 'string',
										default: '',
									},
									{
										displayName: 'Tồn Kho',
										name: 'onHand',
										type: 'number',
										default: undefined,
									},
									{
										displayName: 'Giá Vốn',
										name: 'cost',
										type: 'number',
										default: undefined,
									},
								],
							},
						],
					},
					{
						displayName: 'Trọng Lượng',
						name: 'weight',
						type: 'number',
						default: undefined,
						description: 'Trọng lượng sản phẩm',
					},
					{
						displayName: 'Hình Ảnh (images)',
						name: 'images',
						type: 'fixedCollection',
						placeholder: 'Thêm ảnh',
						default: {},
						typeOptions: {
							multipleValues: true,
						},
						options: [
							{
								displayName: 'Ảnh',
								name: 'images',
								values: [
									{
										displayName: 'URL Ảnh',
										name: 'imageUrl',
										type: 'string',
										default: '',
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
			{
				displayName: 'Bộ Lọc Tồn Kho',
				name: 'inventoryFilters',
				type: 'collection',
				placeholder: 'Thêm Bộ Lọc',
				default: {},
				displayOptions: {
					show: {
						operation: ['getInventoryLevels'],
					},
				},
				options: [
					{
						displayName: 'Bắt ĐầU Từ Item',
						name: 'currentItem',
						type: 'number',
						typeOptions: {
							minValue: 0,
						},
						default: 0,
						description: 'Lấy dữ liệu từ bản ghi currentItem',
					},
					{
						displayName: 'Chi Nhánh',
						name: 'branchIds',
						type: 'string',
						default: '',
						description: 'ID các chi nhánh (cách nhau bởi dấu phẩy)',
					},
					{
						displayName: 'ĐếN Ngày Cập Nhật',
						name: 'lastModifiedTo',
						type: 'dateTime',
						default: '',
						description: 'Lọc đến ngày cập nhật tồn kho',
					},
					{
						displayName: 'Mã Sản Phẩm',
						name: 'productCodes',
						type: 'string',
						default: '',
						description: 'Mã sản phẩm cần xem tồn kho (cách nhau bởi dấu phẩy)',
					},
					{
						displayName: 'Sắp Xếp Theo',
						name: 'orderBy',
						type: 'string',
						default: '',
						description: 'Trường sắp xếp dữ liệu (ví dụ: Code, Name)',
					},
					{
						displayName: 'Số Lượng Mỗi Trang',
						name: 'pageSize',
						type: 'number',
						typeOptions: {
							minValue: 1,
							maxValue: 100,
						},
						default: 20,
						description: 'Số items trong 1 trang, mặc định 20 items, tối đa 100 items',
					},
					{
						displayName: 'Từ Ngày Cập Nhật',
						name: 'lastModifiedFrom',
						type: 'dateTime',
						default: '',
						description: 'Lọc theo ngày cập nhật tồn kho',
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

					const productData: any = {
						name,
						categoryId,
						basePrice,
						retailPrice,
					};

					// Simple scalar fields
					if (additionalFields.code) productData.code = additionalFields.code as string;
					if (additionalFields.barCode) productData.barCode = additionalFields.barCode as string;
					if (additionalFields.fullName) productData.fullName = additionalFields.fullName as string;
					if (additionalFields.allowsSale !== undefined) productData.allowsSale = !!additionalFields.allowsSale;
					if (additionalFields.description) productData.description = additionalFields.description as string;
					if (additionalFields.hasVariants !== undefined) productData.hasVariants = !!additionalFields.hasVariants;
					if (additionalFields.isProductSerial !== undefined) productData.isProductSerial = !!additionalFields.isProductSerial;
					if (additionalFields.unit) productData.unit = additionalFields.unit as string;
					if (additionalFields.masterProductId) productData.masterProductId = parseInt(additionalFields.masterProductId as any, 10);
					if (additionalFields.masterUnitId) productData.masterUnitId = parseInt(additionalFields.masterUnitId as any, 10);
					if (additionalFields.conversionValue !== undefined) productData.conversionValue = Number(additionalFields.conversionValue);
					if (additionalFields.weight !== undefined) productData.weight = Number(additionalFields.weight);
					if (additionalFields.basePrice !== undefined) productData.basePrice = Number(additionalFields.basePrice);
					if (additionalFields.isActive !== undefined) productData.isActive = !!additionalFields.isActive;
					if (additionalFields.isRewardPoint !== undefined) productData.isRewardPoint = !!additionalFields.isRewardPoint;

					// Attributes (fixedCollection)
					if (additionalFields.attributes) {
						const attributesCollection = (additionalFields.attributes as IDataObject).attributes as IDataObject[] | undefined;
						if (Array.isArray(attributesCollection)) {
							productData.attributes = attributesCollection.map((attr) => ({
								attributeName: attr.attributeName as string,
								attributeValue: attr.attributeValue as string,
							}));
						}
					}

					// Inventories (fixedCollection)
					if (additionalFields.inventories) {
						const inventoriesCollection = (additionalFields.inventories as IDataObject).inventories as IDataObject[] | undefined;
						if (Array.isArray(inventoriesCollection)) {
							productData.inventories = inventoriesCollection.map((inv) => ({
								branchId: inv.branchId !== undefined ? parseInt(inv.branchId as any, 10) : undefined,
								branchName: inv.branchName as string,
								onHand: inv.onHand !== undefined ? Number(inv.onHand) : undefined,
								cost: inv.cost !== undefined ? Number(inv.cost) : undefined,
							}));
						}
					}

					// Images (fixedCollection -> array of urls)
					if (additionalFields.images) {
						const imagesCollection = (additionalFields.images as IDataObject).images as IDataObject[] | undefined;
						if (Array.isArray(imagesCollection)) {
							productData.images = imagesCollection.map((img) => img.imageUrl as string).filter((u) => !!u);
						}
					}

					// Allow category override in additionalFields
					if (additionalFields.categoryId) productData.categoryId = parseInt(additionalFields.categoryId as any, 10);

					const response = await productApi.create(productData as ProductCreateParams);
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
				} else if (operation === 'getInventoryLevels') {
					const inventoryFilters = this.getNodeParameter('inventoryFilters', i) as IDataObject;

					const qs: IDataObject = {};

					// Process filters
					if (inventoryFilters.branchIds) {
						const branchIds = (inventoryFilters.branchIds as string)
							.split(',')
							.map((id) => parseInt(id.trim(), 10))
							.filter((id) => !isNaN(id));
						if (branchIds.length > 0) {
							qs.branchIds = branchIds;
						}
					}

					if (inventoryFilters.productCodes) {
						const productCodes = (inventoryFilters.productCodes as string)
							.split(',')
							.map((code) => code.trim())
							.filter((code) => code.length > 0);
						if (productCodes.length > 0) {
							qs.productCodes = productCodes;
						}
					}

					if (inventoryFilters.lastModifiedFrom) {
						qs.lastModifiedFrom = inventoryFilters.lastModifiedFrom;
					}

					if (inventoryFilters.lastModifiedTo) {
						qs.lastModifiedTo = inventoryFilters.lastModifiedTo;
					}

					// Add new parameters
					if (inventoryFilters.orderBy) {
						qs.orderBy = inventoryFilters.orderBy;
					}

					if (inventoryFilters.pageSize) {
						qs.pageSize = inventoryFilters.pageSize;
					}

					if (inventoryFilters.currentItem !== undefined) {
						qs.currentItem = inventoryFilters.currentItem;
					}

					const response = await productApi.getInventoryLevels(qs);
					responseData = response as unknown as any;
				} else if (operation === 'update') {
					const productId = parseInt(this.getNodeParameter('productId', i) as string);
					const name = this.getNodeParameter('name', i) as string;
					const additionalFields = this.getNodeParameter('additionalFields', i) as IDataObject;

					const productData: any = {
						id: productId,
						name,
					};

					// Scalars
					if (additionalFields.code) productData.code = additionalFields.code as string;
					if (additionalFields.barCode) productData.barCode = additionalFields.barCode as string;
					if (additionalFields.categoryId) productData.categoryId = parseInt(additionalFields.categoryId as any, 10);
					if (additionalFields.allowsSale !== undefined) productData.allowsSale = !!additionalFields.allowsSale;
					if (additionalFields.description) productData.description = additionalFields.description as string;
					if (additionalFields.hasVariants !== undefined) productData.hasVariants = !!additionalFields.hasVariants;
					if (additionalFields.unit) productData.unit = additionalFields.unit as string;
					if (additionalFields.masterUnitId) productData.masterUnitId = parseInt(additionalFields.masterUnitId as any, 10);
					if (additionalFields.conversionValue !== undefined) productData.conversionValue = Number(additionalFields.conversionValue);
					if (additionalFields.basePrice !== undefined) productData.basePrice = Number(additionalFields.basePrice);
					if (additionalFields.weight !== undefined) productData.weight = Number(additionalFields.weight);
					if (additionalFields.isActive !== undefined) productData.isActive = !!additionalFields.isActive;
					if (additionalFields.isRewardPoint !== undefined) productData.isRewardPoint = !!additionalFields.isRewardPoint;

					// Attributes
					if (additionalFields.attributes) {
						const attributesCollection = (additionalFields.attributes as IDataObject).attributes as IDataObject[] | undefined;
						if (Array.isArray(attributesCollection)) {
							productData.attributes = attributesCollection.map((attr) => ({
								attributeName: attr.attributeName as string,
								attributeValue: attr.attributeValue as string,
							}));
						}
					}

					// Inventories
					if (additionalFields.inventories) {
						const inventoriesCollection = (additionalFields.inventories as IDataObject).inventories as IDataObject[] | undefined;
						if (Array.isArray(inventoriesCollection)) {
							productData.inventories = inventoriesCollection.map((inv) => ({
								branchId: inv.branchId !== undefined ? parseInt(inv.branchId as any, 10) : undefined,
								branchName: inv.branchName as string,
								onHand: inv.onHand !== undefined ? Number(inv.onHand) : undefined,
								cost: inv.cost !== undefined ? Number(inv.cost) : undefined,
							}));
						}
					}

					// Images
					if (additionalFields.images) {
						const imagesCollection = (additionalFields.images as IDataObject).images as IDataObject[] | undefined;
						if (Array.isArray(imagesCollection)) {
							productData.images = imagesCollection.map((img) => img.imageUrl as string).filter((u) => !!u);
						}
					}

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
