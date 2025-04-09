import type {
	IExecuteFunctions,
	IDataObject,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
} from 'n8n-workflow';
import { KiotVietApiBase } from '../shared/KiotVietApi';

export class KiotVietPurchaseOrder implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Đơn Đặt Hàng KiotViet',
		name: 'kiotVietPurchaseOrder',
		icon: 'file:../shared/kiotviet.svg',
		group: ['transform'],
		version: 1,
		subtitle: '={{$parameter["operation"] + ": " + $parameter["resource"]}}',
		description: 'Quản lý đơn đặt hàng từ KiotViet',
		defaults: {
			name: 'Đơn Đặt Hàng KiotViet',
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
						description: 'Tạo đơn đặt hàng mới',
						action: 'Tạo đơn đặt hàng',
					},
					{
						name: 'Hủy',
						value: 'cancel',
						description: 'Hủy đơn đặt hàng',
						action: 'Hủy đơn đặt hàng',
					},
					{
						name: 'Lấy Theo ID',
						value: 'get',
						description: 'Lấy đơn đặt hàng theo ID',
						action: 'Lấy đơn đặt hàng',
					},
					{
						name: 'Lấy Theo Mã',
						value: 'getByCode',
						description: 'Lấy đơn đặt hàng theo mã',
						action: 'Lấy đơn đặt hàng theo mã',
					},
					{
						name: 'Lấy Nhiều',
						value: 'getAll',
						description: 'Lấy danh sách đơn đặt hàng',
						action: 'Lấy danh sách đơn đặt hàng',
					},
					{
						name: 'Cập Nhật',
						value: 'update',
						description: 'Cập nhật đơn đặt hàng',
						action: 'Cập nhật đơn đặt hàng',
					},
				],
				default: 'getAll',
			},
			{
				displayName: 'ID Đơn Đặt Hàng',
				name: 'purchaseOrderId',
				type: 'string',
				required: true,
				default: '',
				displayOptions: {
					show: {
						operation: ['get', 'update', 'cancel'],
					},
				},
				description: 'ID của đơn đặt hàng',
			},
			{
				displayName: 'Mã Đơn Đặt Hàng',
				name: 'purchaseOrderCode',
				type: 'string',
				required: true,
				default: '',
				displayOptions: {
					show: {
						operation: ['getByCode'],
					},
				},
				description: 'Mã của đơn đặt hàng',
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
				displayName: 'ID Chi Nhánh',
				name: 'branchId',
				type: 'string',
				default: '',
				required: true,
				displayOptions: {
					show: {
						operation: ['create'],
					},
				},
				description: 'ID chi nhánh đặt hàng',
			},
			{
				displayName: 'ID Nhà Cung Cấp',
				name: 'supplierId',
				type: 'string',
				default: '',
				required: true,
				displayOptions: {
					show: {
						operation: ['create'],
					},
				},
				description: 'ID nhà cung cấp',
			},
			{
				displayName: 'Chi Tiết Đơn Hàng',
				name: 'orderDetails',
				placeholder: 'Thêm Sản Phẩm',
				type: 'fixedCollection',
				typeOptions: {
					multipleValues: true,
				},
				displayOptions: {
					show: {
						operation: ['create', 'update'],
					},
				},
				default: {},
				options: [
					{
						name: 'products',
						displayName: 'Sản Phẩm',
						values: [
							{
								displayName: 'ID Sản Phẩm',
								name: 'productId',
								type: 'string',
								default: '',
								description: 'ID của sản phẩm',
							},
							{
								displayName: 'Số Lượng',
								name: 'quantity',
								type: 'number',
								default: 1,
								description: 'Số lượng đặt hàng',
							},
							{
								displayName: 'Giá',
								name: 'price',
								type: 'number',
								default: 0,
								description: 'Giá đơn vị',
							},
						],
					},
				],
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
						displayName: 'Ghi Chú',
						name: 'description',
						type: 'string',
						default: '',
						description: 'Ghi chú đơn đặt hàng',
					},
					{
						displayName: 'Chiết Khấu',
						name: 'discount',
						type: 'number',
						default: 0,
						description: 'Số tiền chiết khấu',
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
						displayName: 'Trạng Thái',
						name: 'status',
						type: 'options',
						options: [
							{
								name: 'Đang Xử Lý',
								value: 'Processing',
							},
							{
								name: 'Hoàn Thành',
								value: 'Completed',
							},
							{
								name: 'Đã Hủy',
								value: 'Canceled',
							},
						],
						default: 'Processing',
						description: 'Lọc theo trạng thái đơn hàng',
					},
					{
						displayName: 'Từ Ngày',
						name: 'createdFrom',
						type: 'string',
						default: '',
						description: 'Lọc từ ngày tạo (YYYY-MM-DD)',
					},
					{
						displayName: 'Đến Ngày',
						name: 'createdTo',
						type: 'string',
						default: '',
						description: 'Lọc đến ngày tạo (YYYY-MM-DD)',
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
				let responseData: any;

				if (operation === 'create') {
					const branchId = parseInt(this.getNodeParameter('branchId', i) as string);
					const supplierId = parseInt(this.getNodeParameter('supplierId', i) as string);
					const orderDetailsUi = this.getNodeParameter('orderDetails', i) as IDataObject;
					const additionalFields = this.getNodeParameter('additionalFields', i) as IDataObject;

					const orderDetails = (orderDetailsUi.products as IDataObject[]).map((product) => ({
						productId: parseInt(product.productId as string),
						quantity: product.quantity,
						price: product.price,
					}));

					const purchaseOrderData = {
						branchId,
						supplierId,
						orderDetails,
						...additionalFields,
					};

					responseData = await kiotViet.purchaseOrders().create(purchaseOrderData);
				} else if (operation === 'get') {
					const purchaseOrderId = parseInt(this.getNodeParameter('purchaseOrderId', i) as string);
					responseData = await kiotViet.purchaseOrders().getById(purchaseOrderId);
				} else if (operation === 'getByCode') {
					const purchaseOrderCode = this.getNodeParameter('purchaseOrderCode', i) as string;
					responseData = await kiotViet.purchaseOrders().getByCode(purchaseOrderCode);
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

					responseData = await kiotViet.purchaseOrders().list(qs);
				} else if (operation === 'update') {
					const purchaseOrderId = parseInt(this.getNodeParameter('purchaseOrderId', i) as string);
					const orderDetailsUi = this.getNodeParameter('orderDetails', i) as IDataObject;
					const additionalFields = this.getNodeParameter('additionalFields', i) as IDataObject;

					const orderDetails = orderDetailsUi.products
						? (orderDetailsUi.products as IDataObject[]).map((product) => ({
							productId: parseInt(product.productId as string),
							quantity: product.quantity,
							price: product.price,
						}))
						: undefined;

					const purchaseOrderData = {
						...(orderDetails && { orderDetails }),
						...additionalFields,
					};

					responseData = await kiotViet.purchaseOrders().update(purchaseOrderId, purchaseOrderData);
				} else if (operation === 'cancel') {
					const purchaseOrderId = parseInt(this.getNodeParameter('purchaseOrderId', i) as string);
					responseData = await kiotViet.purchaseOrders().cancel(purchaseOrderId);
				}

				const executionData = this.helpers.constructExecutionMetaData(
					this.helpers.returnJsonArray(responseData as IDataObject),
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
