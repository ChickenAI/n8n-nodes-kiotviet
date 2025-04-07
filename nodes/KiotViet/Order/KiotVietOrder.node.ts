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
		displayName: 'Đơn hàng KiotViet',
		name: 'kiotVietOrder',
		icon: 'file:kiotviet.svg',
		group: ['transform'],
		version: 1,
		subtitle: '={{$parameter["operation"] + ": " + $parameter["resource"]}}',
		description: 'Quản lý đơn hàng từ KiotViet',
		defaults: {
			name: 'Đơn hàng KiotViet',
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
						name: 'Hủy đơn',
						value: 'cancel',
						description: 'Hủy đơn hàng',
						action: 'Hủy đơn hàng',
					},
					{
						name: 'Tạo mới',
						value: 'create',
						description: 'Tạo đơn hàng mới',
						action: 'Tạo đơn hàng',
					},
					{
						name: 'Lấy theo ID',
						value: 'get',
						description: 'Lấy đơn hàng theo ID',
						action: 'Lấy đơn hàng',
					},
					{
						name: 'Lấy nhiều',
						value: 'getAll',
						description: 'Lấy danh sách đơn hàng',
						action: 'Lấy danh sách đơn hàng',
					},
					{
						name: 'Cập nhật',
						value: 'update',
						description: 'Cập nhật đơn hàng',
						action: 'Cập nhật đơn hàng',
					},
				],
				default: 'getAll',
			},
			{
				displayName: 'ID Đơn hàng',
				name: 'orderId',
				type: 'string',
				required: true,
				default: '',
				displayOptions: {
					show: {
						operation: ['get', 'update', 'cancel'],
					},
				},
				description: 'Mã định danh đơn hàng',
			},
			{
				displayName: 'Lý do hủy',
				name: 'cancelReason',
				type: 'string',
				default: '',
				displayOptions: {
					show: {
						operation: ['cancel'],
					},
				},
				description: 'Lý do hủy đơn hàng',
			},
			{
				displayName: 'ID Chi nhánh',
				name: 'branchId',
				type: 'string',
				required: true,
				default: '',
				displayOptions: {
					show: {
						operation: ['create'],
					},
				},
				description: 'Mã chi nhánh tạo đơn hàng',
			},
			{
				displayName: 'Sản phẩm trong đơn hàng',
				name: 'orderProducts',
				placeholder: 'Thêm sản phẩm',
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
						displayName: 'Sản phẩm',
						values: [
							{
								displayName: 'ID Sản phẩm',
								name: 'productId',
								type: 'string',
								default: '',
								required: true,
								description: 'Mã định danh sản phẩm',
							},
							{
								displayName: 'Số lượng',
								name: 'quantity',
								type: 'number',
								default: 1,
								required: true,
								description: 'Số lượng sản phẩm',
							},
							{
								displayName: 'Giá bán',
								name: 'price',
								type: 'number',
								default: 0,
								required: true,
								description: 'Giá bán của sản phẩm',
							},
							{
								displayName: 'Giảm giá',
								name: 'discount',
								type: 'number',
								default: 0,
								description: 'Giảm giá cho sản phẩm',
							},
							{
								displayName: 'Ghi chú',
								name: 'note',
								type: 'string',
								default: '',
								description: 'Ghi chú cho sản phẩm',
							},
						],
					},
				],
				default: {},
				description: 'Danh sách sản phẩm trong đơn hàng',
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
						displayName: 'ID Khách hàng',
						name: 'customerId',
						type: 'string',
						default: '',
						description: 'Mã định danh khách hàng',
					},
					{
						displayName: 'Mô tả đơn hàng',
						name: 'description',
						type: 'string',
						default: '',
						description: 'Nội dung mô tả đơn hàng',
					},
					{
						displayName: 'Giảm giá toàn đơn',
						name: 'discount',
						type: 'number',
						default: 0,
						description: 'Tổng số tiền giảm giá cho đơn hàng',
					},
					{
						displayName: 'Xuất hóa đơn',
						name: 'makeInvoice',
						type: 'boolean',
						default: false,
						description: 'Tạo hóa đơn cho đơn hàng này',
					},
				],
			},
			{
				displayName: 'Lấy toàn bộ',
				name: 'returnAll',
				type: 'boolean',
				default: false,
				description: 'Lấy toàn bộ kết quả hoặc giới hạn theo số lượng',
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
						displayName: 'Trạng thái',
						name: 'status',
						type: 'options',
						options: [
							{
								name: 'Hoàn tất',
								value: 'Completed',
							},
							{
								name: 'Đang xử lý',
								value: 'Processing',
							},
							{
								name: 'Đã hủy',
								value: 'Canceled',
							},
						],
						default: 'Processing',
						description: 'Trạng thái đơn hàng cần lấy',
					},
					{
						displayName: 'ID Khách hàng',
						name: 'customerId',
						type: 'string',
						default: '',
						description: 'Lọc theo mã khách hàng',
					},
					{
						displayName: 'Tạo từ ngày',
						name: 'createdFrom',
						type: 'string',
						default: '',
						description: 'Lọc đơn hàng tạo từ ngày (YYYY-MM-DD)',
					},
					{
						displayName: 'Tạo đến ngày',
						name: 'createdTo',
						type: 'string',
						default: '',
						description: 'Lọc đơn hàng tạo đến ngày (YYYY-MM-DD)',
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
