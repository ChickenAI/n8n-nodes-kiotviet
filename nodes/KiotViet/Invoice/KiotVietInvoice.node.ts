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
	Invoice,
	InvoiceCreateParams,
	InvoiceUpdateParams,
	KiotVietListResponse,
	InvoiceHandler,
	InvoiceDetail,
} from '../shared/KiotVietTypes';

export class KiotVietInvoice implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Hóa Đơn KiotViet',
		name: 'kiotVietInvoice',
		icon: 'file:../shared/kiotviet.svg',
		group: ['transform'],
		version: 1,
		subtitle: '={{$parameter["operation"] + ": " + $parameter["resource"]}}',
		description: 'Quản lý hóa đơn từ KiotViet',
		defaults: {
			name: 'Hóa Đơn KiotViet',
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
						description: 'Hủy hóa đơn',
						action: 'Hủy hóa đơn',
					},
					{
						name: 'Tạo Mới',
						value: 'create',
						description: 'Tạo hóa đơn mới',
						action: 'Tạo hóa đơn',
					},
					{
						name: 'Lấy Theo ID',
						value: 'get',
						description: 'Lấy hóa đơn theo ID',
						action: 'Lấy hóa đơn',
					},
					{
						name: 'Lấy Nhiều',
						value: 'getAll',
						description: 'Lấy danh sách hóa đơn',
						action: 'Lấy danh sách hóa đơn',
					},
					{
						name: 'Cập Nhật',
						value: 'update',
						description: 'Cập nhật hóa đơn',
						action: 'Cập nhật hóa đơn',
					},
				],
				default: 'getAll',
			},
			{
				displayName: 'ID Hóa Đơn',
				name: 'invoiceId',
				type: 'string',
				required: true,
				default: '',
				displayOptions: {
					show: {
						operation: ['get', 'update', 'cancel'],
					},
				},
				description: 'Mã định danh của hóa đơn',
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
				description: 'Lý do hủy hóa đơn',
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
				description: 'Mã chi nhánh tạo hóa đơn',
			},
			{
				displayName: 'Sản Phẩm Trong Hóa Đơn',
				name: 'invoiceProducts',
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
				description: 'Danh sách sản phẩm trong hóa đơn',
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
						description: 'Mô tả hóa đơn',
					},
					{
						displayName: 'Giảm Giá',
						name: 'discount',
						type: 'number',
						default: 0,
						description: 'Tổng số tiền giảm giá cho hóa đơn',
					},
					{
						displayName: 'Phương Thức Thanh Toán',
						name: 'paymentMethod',
						type: 'options',
						options: [
							{
								name: 'Tiền Mặt',
								value: 'Cash',
							},
							{
								name: 'Thẻ',
								value: 'Card',
							},
							{
								name: 'Chuyển Khoản',
								value: 'Transfer',
							},
							{
								name: 'Khác',
								value: 'Other',
							},
						],
						default: 'Cash',
						description: 'Phương thức thanh toán',
					},
					{
						displayName: 'Tổng Thanh Toán',
						name: 'totalPayment',
						type: 'number',
						default: 0,
						description: 'Tổng số tiền đã thanh toán',
					},
				],
			},
			{
				displayName: 'Lấy Toàn Bộ',
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
								name: 'Nháp',
								value: 'Draft',
							},
							{
								name: 'Đang Xử Lý',
								value: 'InProgress',
							},
							{
								name: 'Hoàn Tất',
								value: 'Completed',
							},
							{
								name: 'Đã Hủy',
								value: 'Canceled',
							},
						],
						default: 'InProgress',
						description: 'Trạng thái hóa đơn cần lấy',
					},
					{
						displayName: 'ID Khách Hàng',
						name: 'customerId',
						type: 'string',
						default: '',
						description: 'Lọc hóa đơn theo ID khách hàng',
					},
					{
						displayName: 'Tạo Từ Ngày',
						name: 'createdFrom',
						type: 'string',
						default: '',
						description: 'Lọc hóa đơn tạo từ ngày (YYYY-MM-DD)',
					},
					{
						displayName: 'Tạo Đến Ngày',
						name: 'createdTo',
						type: 'string',
						default: '',
						description: 'Lọc hóa đơn tạo đến ngày (YYYY-MM-DD)',
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
				const invoiceApi = (await kiotViet.invoices()) as unknown as InvoiceHandler;
				let responseData: IDataObject = {};

				if (operation === 'create') {
					const branchId = parseInt(this.getNodeParameter('branchId', i) as string);
					const invoiceProductsData = this.getNodeParameter(
						'invoiceProducts.products',
						i,
						[],
					) as IDataObject[];
					const additionalFields = this.getNodeParameter('additionalFields', i) as IDataObject;

					const invoiceDetails: InvoiceDetail[] = invoiceProductsData.map((product) => ({
						productId: parseInt(product.productId as string),
						productCode: '', // Will be filled by API
						productName: '', // Will be filled by API
						quantity: product.quantity as number,
						price: product.price as number,
						discount: product.discount as number,
						note: product.note as string,
					}));

					const invoiceData: InvoiceCreateParams = {
						branchId,
						invoiceDetails,
						...additionalFields,
					};

					if (additionalFields.customerId) {
						invoiceData.customerId = parseInt(additionalFields.customerId as string);
					}

					responseData = await invoiceApi.create(invoiceData);
				} else if (operation === 'get') {
					const invoiceId = parseInt(this.getNodeParameter('invoiceId', i) as string);
					responseData = await invoiceApi.getById(invoiceId);
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

					responseData = await invoiceApi.list(qs);
				} else if (operation === 'update') {
					if (!invoiceApi.update) {
						throw new NodeOperationError(
							this.getNode(),
							'Update operation is not supported by the KiotViet API',
						);
					}

					const invoiceId = parseInt(this.getNodeParameter('invoiceId', i) as string);
					const invoiceProductsData = this.getNodeParameter(
						'invoiceProducts.products',
						i,
						[],
					) as IDataObject[];
					const additionalFields = this.getNodeParameter('additionalFields', i) as IDataObject;

					const invoiceDetails: InvoiceDetail[] = invoiceProductsData.map((product) => ({
						productId: parseInt(product.productId as string),
						productCode: '', // Will be filled by API
						productName: '', // Will be filled by API
						quantity: product.quantity as number,
						price: product.price as number,
						discount: product.discount as number,
						note: product.note as string,
					}));

					const invoiceData: InvoiceUpdateParams = {
						id: invoiceId,
						invoiceDetails,
						...additionalFields,
					};

					if (additionalFields.customerId) {
						invoiceData.customerId = parseInt(additionalFields.customerId as string);
					}

					responseData = await invoiceApi.update(invoiceId, invoiceData);
				} else if (operation === 'cancel') {
					if (!invoiceApi.cancel) {
						throw new NodeOperationError(
							this.getNode(),
							'Cancel operation is not supported by the KiotViet API',
						);
					}

					const invoiceId = parseInt(this.getNodeParameter('invoiceId', i) as string);
					const cancelReason = this.getNodeParameter('cancelReason', i) as string;

					responseData = await invoiceApi.cancel(invoiceId, cancelReason);
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
