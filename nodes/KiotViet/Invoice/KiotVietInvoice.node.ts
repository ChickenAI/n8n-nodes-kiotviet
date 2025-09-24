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
						name: 'Lấy Theo Mã',
						value: 'getByCode',
						description: 'Lấy hóa đơn theo mã',
						action: 'Lấy hóa đơn theo mã',
					},
					{
						name: 'Get Many',
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
					{
						name: 'Xóa',
						value: 'delete',
						description: 'Xóa hóa đơn',
						action: 'Xóa hóa đơn',
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
						operation: ['get', 'update', 'delete'],
					},
				},
				description: 'ID của hóa đơn',
			},
			{
				displayName: 'Mã Hóa Đơn',
				name: 'invoiceCode',
				type: 'string',
				required: true,
				default: '',
				displayOptions: {
					show: {
						operation: ['getByCode'],
					},
				},
				description: 'Mã của hóa đơn',
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
				description: 'Mã chi nhánh nơi tạo hóa đơn',
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
				displayName: 'Sản Phẩm Trong Hóa Đơn',
				name: 'invoiceDetails',
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
								displayName: 'Mã Sản Phẩm',
								name: 'productCode',
								type: 'string',
								default: '',
								required: true,
								description: 'Mã sản phẩm',
							},
							{
								displayName: 'Tên Sản Phẩm',
								name: 'productName',
								type: 'string',
								default: '',
								required: true,
								description: 'Tên sản phẩm',
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
								displayName: 'Tỷ Lệ Giảm Giá (%)',
								name: 'discountRatio',
								type: 'number',
								default: 0,
								description: 'Tỷ lệ giảm giá (phần trăm)',
							},
							{
								displayName: 'Ghi Chú',
								name: 'note',
								type: 'string',
								default: '',
								description: 'Ghi chú cho sản phẩm',
							},
							{
								displayName: 'Số Serial',
								name: 'serialNumbers',
								type: 'string',
								default: '',
								description: 'Số serial của sản phẩm',
							},
						],
					},
				],
				default: {},
				description: 'Danh sách sản phẩm trong hóa đơn',
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
						displayName: 'ĐếN Ngày',
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
								name: 'Nháp',
								value: 1,
							},
							{
								name: 'Đang Xử Lý',
								value: 2,
							},
							{
								name: 'Hoàn Thành',
								value: 3,
							},
							{
								name: 'Đã Hủy',
								value: 4,
							},
						],
						default: 2,
						description: 'Lọc theo trạng thái hóa đơn',
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
						displayName: 'Tổng Thanh Toán',
						name: 'totalPayment',
						type: 'number',
						default: 0,
						required: true,
						description: 'Tổng số tiền thanh toán (bắt buộc)',
					},
					{
						displayName: 'ID Khách Hàng',
						name: 'customerId',
						type: 'string',
						default: '',
						description: 'Mã định danh khách hàng',
					},
					{
						displayName: 'Ngày Mua Hàng',
						name: 'purchaseDate',
						type: 'string',
						default: '',
						description: 'Ngày mua hàng (định dạng YYYY-MM-DD)',
					},
					{
						displayName: 'Giảm Giá',
						name: 'discount',
						type: 'number',
						default: 0,
						description: 'Tổng số tiền giảm giá cho toàn bộ hóa đơn',
					},
					{
						displayName: 'Phương Thức Thanh Toán',
						name: 'method',
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
								value: 'BankTransfer',
							},
							{
								name: 'Thanh Toán Di Động',
								value: 'MobilePayment',
							},
							{
								name: 'Kết Hợp',
								value: 'Mixed',
							},
						],
						default: 'Cash',
						description: 'Phương thức thanh toán',
					},
					{
						displayName: 'ID Tài Khoản',
						name: 'accountId',
						type: 'number',
						default: 0,
						description: 'ID tài khoản ngân hàng (bắt buộc với Card/BankTransfer)',
					},
					{
						displayName: 'Sử Dụng COD',
						name: 'usingCod',
						type: 'boolean',
						default: false,
						description: 'Sử dụng thanh toán COD',
					},
					{
						displayName: 'ID Nhân Viên Bán',
						name: 'soldById',
						type: 'number',
						default: 0,
						description: 'ID nhân viên thực hiện bán hàng',
					},
					{
						displayName: 'ID Đơn Hàng',
						name: 'orderId',
						type: 'number',
						default: 0,
						description: 'ID đơn hàng liên quan',
					},
					{
						displayName: 'ID Kênh Bán',
						name: 'saleChannelId',
						type: 'number',
						default: 0,
						description: 'ID kênh bán hàng',
					},
					{
						displayName: 'Áp Dụng Voucher',
						name: 'isApplyVoucher',
						type: 'boolean',
						default: false,
						description: 'Có áp dụng voucher không',
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
				const sdkInvoiceApi = await kiotViet.invoices();
				const invoiceApi = sdkInvoiceApi as unknown as InvoiceHandler;
				let responseData: IDataObject = {};

				if (operation === 'create') {
					const branchId = parseInt(this.getNodeParameter('branchId', i) as string);
					const invoiceDetailsData = this.getNodeParameter(
						'invoiceDetails.products',
						i,
						[],
					) as IDataObject[];
					const additionalFields = this.getNodeParameter('additionalFields', i) as IDataObject;

					const invoiceData: InvoiceCreateParams = {
						branchId,
						totalPayment: additionalFields.totalPayment as number,
						invoiceDetails: invoiceDetailsData.map((product) => ({
							productId: parseInt(product.productId as string),
							productCode: product.productCode as string,
							productName: product.productName as string,
							quantity: product.quantity as number,
							price: product.price as number,
							discount: product.discount as number || 0,
							discountRatio: product.discountRatio as number || 0,
							note: product.note as string || '',
							serialNumbers: product.serialNumbers as string || '',
						})),
					};

					// Add optional fields
					if (additionalFields.customerId) {
						invoiceData.customerId = parseInt(additionalFields.customerId as string);
					}
					if (additionalFields.purchaseDate) {
						invoiceData.purchaseDate = additionalFields.purchaseDate as string;
					}
					if (additionalFields.discount) {
						invoiceData.discount = additionalFields.discount as number;
					}
					if (additionalFields.method) {
						invoiceData.method = additionalFields.method as string;
					}
					if (additionalFields.accountId) {
						invoiceData.accountId = additionalFields.accountId as number;
					}
					if (additionalFields.usingCod) {
						invoiceData.usingCod = additionalFields.usingCod as boolean;
					}
					if (additionalFields.soldById) {
						invoiceData.soldById = additionalFields.soldById as number;
					}
					if (additionalFields.orderId) {
						invoiceData.orderId = additionalFields.orderId as number;
					}
					if (additionalFields.saleChannelId) {
						invoiceData.saleChannelId = additionalFields.saleChannelId as number;
					}
					if (additionalFields.isApplyVoucher) {
						invoiceData.isApplyVoucher = additionalFields.isApplyVoucher as boolean;
					}

					const response = await invoiceApi.create(invoiceData);
					responseData = response as unknown as IDataObject;
				} else if (operation === 'get') {
					const invoiceId = parseInt(this.getNodeParameter('invoiceId', i) as string);
					const response = await invoiceApi.getById(invoiceId);
					responseData = response as unknown as IDataObject;
				} else if (operation === 'getByCode') {
					const invoiceCode = this.getNodeParameter('invoiceCode', i) as string;
					const response = await invoiceApi.getByCode(invoiceCode);
					responseData = response as unknown as IDataObject;
				} else if (operation === 'getAll') {
					const returnAll = this.getNodeParameter('returnAll', i) as boolean;
					const filters = this.getNodeParameter('filters', i) as IDataObject;
					let allResults: Invoice[] = [];

					if (!returnAll && !filters.pageSize) {
						const limit = this.getNodeParameter('limit', i) as number;
						filters.pageSize = limit;
					}

					if (returnAll) {
						let hasMore = true;
						let currentPage = 1;

						while (hasMore) {
							filters.currentPage = currentPage;
							const response = await invoiceApi.list(filters);
							const listResponse = response as unknown as KiotVietListResponse<Invoice>;
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
							currentPage: filters.currentPage,
						};
					} else {
						const response = await invoiceApi.list(filters);
						const listResponse = response as unknown as KiotVietListResponse<Invoice>;
						responseData = {
							data: listResponse.data ?? [],
							total: listResponse.total,
							pageSize: filters.pageSize,
							currentPage: filters.currentPage,
						};
					}
				} else if (operation === 'update') {
					if (!invoiceApi.update) {
						throw new NodeOperationError(
							this.getNode(),
							'Update operation is not supported by the KiotViet API',
						);
					}

					const invoiceId = parseInt(this.getNodeParameter('invoiceId', i) as string);
					const invoiceDetailsData = this.getNodeParameter(
						'invoiceDetails.products',
						i,
						[],
					) as IDataObject[];
					const additionalFields = this.getNodeParameter('additionalFields', i) as IDataObject;

					const invoiceData: InvoiceUpdateParams = {
						id: invoiceId,
					};

					// Add invoice details if provided
					if (invoiceDetailsData.length > 0) {
						invoiceData.invoiceDetails = invoiceDetailsData.map((product) => ({
							productId: parseInt(product.productId as string),
							productCode: product.productCode as string,
							productName: product.productName as string,
							quantity: product.quantity as number,
							price: product.price as number,
							discount: product.discount as number || 0,
							discountRatio: product.discountRatio as number || 0,
							note: product.note as string || '',
							serialNumbers: product.serialNumbers as string || '',
						}));
					}

					// Add optional fields
					if (additionalFields.totalPayment) {
						invoiceData.totalPayment = additionalFields.totalPayment as number;
					}
					if (additionalFields.customerId) {
						invoiceData.customerId = parseInt(additionalFields.customerId as string);
					}
					if (additionalFields.purchaseDate) {
						invoiceData.purchaseDate = additionalFields.purchaseDate as string;
					}
					if (additionalFields.discount) {
						invoiceData.discount = additionalFields.discount as number;
					}
					if (additionalFields.method) {
						invoiceData.method = additionalFields.method as string;
					}
					if (additionalFields.accountId) {
						invoiceData.accountId = additionalFields.accountId as number;
					}
					if (additionalFields.usingCod) {
						invoiceData.usingCod = additionalFields.usingCod as boolean;
					}
					if (additionalFields.soldById) {
						invoiceData.soldById = additionalFields.soldById as number;
					}
					if (additionalFields.saleChannelId) {
						invoiceData.saleChannelId = additionalFields.saleChannelId as number;
					}
					if (additionalFields.isApplyVoucher) {
						invoiceData.isApplyVoucher = additionalFields.isApplyVoucher as boolean;
					}

					const response = await invoiceApi.update(invoiceId, invoiceData);
					responseData = response as unknown as IDataObject;
				} else if (operation === 'delete') {
					if (!invoiceApi.delete) {
						throw new NodeOperationError(
							this.getNode(),
							'Delete operation is not supported by the KiotViet API',
						);
					}

					const invoiceId = parseInt(this.getNodeParameter('invoiceId', i) as string);
					await invoiceApi.delete(invoiceId, true);
					responseData = { success: true, message: 'Invoice deleted successfully' };
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
