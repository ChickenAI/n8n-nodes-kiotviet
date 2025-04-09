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
} from '../shared/KiotVietTypes';

export class KiotVietOrder implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Đơn Hàng KiotViet',
		name: 'kiotVietOrder',
		icon: 'file:../shared/kiotviet.svg',
		group: ['transform'],
		version: 1,
		subtitle: '={{$parameter["operation"] + ": " + $parameter["resource"]}}',
		description: 'Quản lý đơn hàng từ KiotViet',
		defaults: {
			name: 'Đơn Hàng KiotViet',
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
						name: 'Hủy',
						value: 'cancel',
						description: 'Hủy đơn hàng',
						action: 'Hủy đơn hàng',
					},
					{
						name: 'Tạo Mới',
						value: 'create',
						description: 'Tạo đơn hàng mới',
						action: 'Tạo đơn hàng',
					},
					{
						name: 'Lấy Theo ID',
						value: 'get',
						description: 'Lấy đơn hàng theo ID',
						action: 'Lấy đơn hàng',
					},
					{
						name: 'Lấy Theo Mã',
						value: 'getByCode',
						description: 'Lấy đơn hàng theo mã',
						action: 'Lấy đơn hàng theo mã',
					},
					{
						name: 'Lấy Nhiều',
						value: 'getAll',
						description: 'Lấy danh sách đơn hàng',
						action: 'Lấy danh sách đơn hàng',
					},
					{
						name: 'Cập Nhật',
						value: 'update',
						description: 'Cập nhật đơn hàng',
						action: 'Cập nhật đơn hàng',
					},
				],
				default: 'getAll',
			},
			{
				displayName: 'Trả Về Tất Cả',
				name: 'returnAll',
				type: 'boolean',
				default: false,
				description: 'Trả về tất cả kết quả',
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
				description: 'Số lượng đơn hàng tối đa trả về',
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
				displayName: 'ID Đơn Hàng',
				name: 'orderId',
				type: 'string',
				required: true,
				default: '',
				displayOptions: {
					show: {
						operation: ['get', 'update', 'cancel'],
					},
				},
				description: 'ID của đơn hàng',
			},
			{
				displayName: 'Mã Đơn Hàng',
				name: 'orderCode',
				type: 'string',
				required: true,
				default: '',
				displayOptions: {
					show: {
						operation: ['getByCode'],
					},
				},
				description: 'Mã của đơn hàng',
			},
			{
				displayName: 'Lý Do Hủy',
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
				displayName: 'ID Chi Nhánh',
				name: 'branchId',
				type: 'string',
				required: true,
				default: '',
				displayOptions: {
					show: {
						operation: ['create'],
					},
				},
				description: 'Mã chi nhánh nơi tạo đơn hàng',
			},
			{},
			{
				displayName: 'Sản Phẩm Trong Đơn',
				name: 'orderProducts',
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
								required: true,
								description: 'Mã định danh sản phẩm',
							},
							{
								displayName: 'Số Lượng',
								name: 'quantity',
								type: 'number',
								default: 1,
								required: true,
								description: 'Số lượng sản phẩm',
							},
							{
								displayName: 'Giá Bán',
								name: 'price',
								type: 'number',
								default: 0,
								required: true,
								description: 'Giá bán của sản phẩm',
							},
							{
								displayName: 'Giảm Giá',
								name: 'discount',
								type: 'number',
								default: 0,
								description: 'Số tiền giảm giá cho sản phẩm',
							},
							{
								displayName: 'Ghi Chú',
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
						displayName: 'ID Chi Nhánh',
						name: 'branchId',
						type: 'string',
						default: '',
						description: 'Lọc theo ID chi nhánh',
					},
					{
						displayName: 'Từ Ngày',
						name: 'fromDate',
						type: 'string',
						default: '',
						description: 'Lọc từ ngày (định dạng YYYY-MM-DD)',
					},
					{
						displayName: 'Đến Ngày',
						name: 'toDate',
						type: 'string',
						default: '',
						description: 'Lọc đến ngày (định dạng YYYY-MM-DD)',
					},
					{
						displayName: 'Trạng Thái',
						name: 'status',
						type: 'options',
						options: [
							{
								name: 'Hoàn Thành',
								value: 'Completed',
							},
							{
								name: 'Đã Hủy',
								value: 'Cancelled',
							},
							{
								name: 'Đang Xử Lý',
								value: 'Processing',
							},
						],
						default: 'Processing',
						description: 'Lọc theo trạng thái đơn hàng',
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
						displayName: 'ID Khách Hàng',
						name: 'customerId',
						type: 'string',
						default: '',
						description: 'Mã định danh khách hàng',
					},
					{
						displayName: 'Mô Tả',
						name: 'description',
						type: 'string',
						default: '',
						description: 'Mô tả đơn hàng',
					},
					{
						displayName: 'Giảm Giá',
						name: 'discount',
						type: 'number',
						default: 0,
						description: 'Tổng số tiền giảm giá cho toàn bộ đơn hàng',
					},
				],
			},
		] as INodeTypeDescription['properties'],
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

					const orderData: OrderCreateParams = {
						branchId,
						orderDetails: orderProductsData.map((product) => ({
							productId: parseInt(product.productId as string),
							productCode: '',
							productName: '',
							quantity: product.quantity as number,
							price: product.price as number,
							discount: product.discount as number,
							note: product.note as string,
						})),
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
				} else if (operation === 'getByCode') {
					const orderCode = this.getNodeParameter('orderCode', i) as string;
					const response = await orderApi.getByCode(orderCode);
					responseData = response as unknown as IDataObject;
				} else if (operation === 'getAll') {
					const returnAll = this.getNodeParameter('returnAll', i) as boolean;
					const filters = this.getNodeParameter('filters', i) as IDataObject;
					let allResults: Order[] = [];

					if (!returnAll && !filters.pageSize) {
						const limit = this.getNodeParameter('limit', i) as number;
						filters.pageSize = limit;
					}

					if (returnAll) {
						let hasMore = true;
						let currentPage = 1;

						while (hasMore) {
							filters.currentPage = currentPage;
							const response = await orderApi.list(filters);
							const listResponse = response as unknown as KiotVietListResponse<Order>;
							if (listResponse.data && listResponse.data.length > 0) {
								allResults = allResults.concat(listResponse.data);
								currentPage++;
								if (currentPage * (filters.pageSize as number) >= listResponse.total) {
									hasMore = false;
								}
							} else {
								hasMore = false;
							}
						}

						responseData = {
							data: allResults,
							total: allResults.length,
							pageSize: filters.pageSize,
						};
					} else {
						const response = await orderApi.list(filters);
						const listResponse = response as unknown as KiotVietListResponse<Order>;
						responseData = {
							data: listResponse.data ?? [],
							total: listResponse.total,
							pageSize: filters.pageSize,
						};
					}
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

					const orderData: OrderUpdateParams = {
						id: orderId,
						orderDetails: orderProductsData.map((product) => ({
							productId: parseInt(product.productId as string),
							productCode: '',
							productName: '',
							quantity: product.quantity as number,
							price: product.price as number,
							discount: product.discount as number,
							note: product.note as string,
						})),
						...additionalFields,
					};

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
