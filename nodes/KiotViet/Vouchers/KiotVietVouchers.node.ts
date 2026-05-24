import type {
	IExecuteFunctions,
	IDataObject,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
} from 'n8n-workflow';
import { KiotVietApiBase } from '../shared/KiotVietApi';
import type { VoucherHandler } from '../shared/KiotVietTypes';

export class KiotVietVouchers implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Voucher KiotViet',
		name: 'kiotVietVouchers',
		icon: 'file:../shared/kiotviet.svg',
		group: ['transform'],
		version: 1,
		subtitle: '={{$parameter["operation"] + ": " + $parameter["resource"]}}',
		description: 'Quản lý voucher và chiến dịch khuyến mãi từ KiotViet',
		defaults: {
			name: 'Voucher KiotViet',
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
						name: 'Lấy Danh Sách Voucher',
						value: 'getAll',
						description: 'Lấy danh sách voucher',
						action: 'Lấy danh sách voucher',
					},
					{
						name: 'Lấy Voucher Theo ID',
						value: 'get',
						description: 'Lấy voucher theo ID',
						action: 'Lấy voucher',
					},
					{
						name: 'Lấy Voucher Theo Mã',
						value: 'getByCode',
						description: 'Lấy voucher theo mã',
						action: 'Lấy voucher theo mã',
					},
					{
						name: 'Lấy Danh Sách Chiến Dịch',
						value: 'listCampaigns',
						description: 'Lấy danh sách chiến dịch voucher',
						action: 'Lấy danh sách chiến dịch',
					},
					{
						name: 'Lấy Chiến Dịch Theo ID',
						value: 'getCampaign',
						description: 'Lấy chiến dịch theo ID',
						action: 'Lấy chiến dịch',
					},
					{
						name: 'Tạo Chiến Dịch',
						value: 'createCampaign',
						description: 'Tạo chiến dịch voucher mới',
						action: 'Tạo chiến dịch',
					},
					{
						name: 'Cập Nhật Chiến Dịch',
						value: 'updateCampaign',
						description: 'Cập nhật chiến dịch voucher',
						action: 'Cập nhật chiến dịch',
					},
					{
						name: 'Xóa Chiến Dịch',
						value: 'deleteCampaign',
						description: 'Xóa chiến dịch voucher',
						action: 'Xóa chiến dịch',
					},
				],
				default: 'getAll',
			},
			{
				displayName: 'Lấy Toàn Bộ',
				name: 'returnAll',
				type: 'boolean',
				default: false,
				description: 'Lấy toàn bộ kết quả hoặc giới hạn số lượng',
				displayOptions: {
					show: {
						operation: ['getAll', 'listCampaigns'],
					},
				},
			},
			{
				displayName: 'Giới Hạn',
				name: 'limit',
				type: 'number',
				default: 50,
				description: 'Số lượng kết quả tối đa',
				typeOptions: {
					minValue: 1,
				},
				displayOptions: {
					show: {
						operation: ['getAll', 'listCampaigns'],
						returnAll: [false],
					},
				},
			},
			{
				displayName: 'ID Voucher',
				name: 'voucherId',
				type: 'number',
				required: true,
				default: 0,
				displayOptions: {
					show: {
						operation: ['get'],
					},
				},
				description: 'ID của voucher',
			},
			{
				displayName: 'Mã Voucher',
				name: 'voucherCode',
				type: 'string',
				required: true,
				default: '',
				displayOptions: {
					show: {
						operation: ['getByCode'],
					},
				},
				description: 'Mã của voucher',
			},
			{
				displayName: 'ID Chiến Dịch',
				name: 'campaignId',
				type: 'number',
				required: true,
				default: 0,
				displayOptions: {
					show: {
						operation: ['getCampaign', 'deleteCampaign', 'updateCampaign'],
					},
				},
				description: 'ID của chiến dịch',
			},
			{
				displayName: 'Mã Chiến Dịch',
				name: 'code',
				type: 'string',
				required: true,
				default: '',
				displayOptions: {
					show: {
						operation: ['createCampaign'],
					},
				},
				description: 'Mã chiến dịch voucher',
			},
			{
				displayName: 'Tên Chiến Dịch',
				name: 'name',
				type: 'string',
				required: true,
				default: '',
				displayOptions: {
					show: {
						operation: ['createCampaign'],
					},
				},
				description: 'Tên chiến dịch voucher',
			},
			{
				displayName: 'Ngày Bắt Đầu',
				name: 'startDate',
				type: 'dateTime',
				required: true,
				default: '',
				displayOptions: {
					show: {
						operation: ['createCampaign'],
					},
				},
				description: 'Ngày bắt đầu chiến dịch',
			},
			{
				displayName: 'Ngày Kết Thúc',
				name: 'endDate',
				type: 'dateTime',
				required: true,
				default: '',
				displayOptions: {
					show: {
						operation: ['createCampaign'],
					},
				},
				description: 'Ngày kết thúc chiến dịch',
			},
			{
				displayName: 'ID Chi Nhánh',
				name: 'branchId',
				type: 'number',
				required: true,
				default: 0,
				displayOptions: {
					show: {
						operation: ['createCampaign'],
					},
				},
				description: 'ID chi nhánh áp dụng',
			},
			{
				displayName: 'Loại Giảm Giá',
				name: 'discountType',
				type: 'options',
				required: true,
				default: 1,
				displayOptions: {
					show: {
						operation: ['createCampaign'],
					},
				},
				options: [
					{
						name: 'Số Tiền Cố Định',
						value: 1,
					},
					{
						name: 'Phần Trăm',
						value: 2,
					},
				],
				description: 'Loại giảm giá của chiến dịch',
			},
			{
				displayName: 'Giá Trị Giảm Giá',
				name: 'discountValue',
				type: 'number',
				required: true,
				default: 0,
				displayOptions: {
					show: {
						operation: ['createCampaign'],
					},
				},
				description: 'Giá trị giảm giá',
			},
			{
				displayName: 'Số Lượng Voucher',
				name: 'quantity',
				type: 'number',
				required: true,
				default: 0,
				displayOptions: {
					show: {
						operation: ['createCampaign'],
					},
				},
				description: 'Số lượng voucher phát hành',
			},
			{
				displayName: 'Tự Động Sinh Mã',
				name: 'isAutoGenerate',
				type: 'boolean',
				required: true,
				default: true,
				displayOptions: {
					show: {
						operation: ['createCampaign'],
					},
				},
				description: 'Tự động sinh mã voucher',
			},
			{
				displayName: 'Không Giới Hạn',
				name: 'isUnlimited',
				type: 'boolean',
				required: true,
				default: false,
				displayOptions: {
					show: {
						operation: ['createCampaign'],
					},
				},
				description: 'Chiến dịch không giới hạn số lượng',
			},
			{
				displayName: 'Trường Bổ Sung',
				name: 'additionalFields',
				type: 'collection',
				placeholder: 'Thêm Trường',
				default: {},
				displayOptions: {
					show: {
						operation: ['createCampaign', 'updateCampaign'],
					},
				},
				options: [
					{
						displayName: 'Mã Chiến Dịch',
						name: 'code',
						type: 'string',
						default: '',
						description: 'Mã chiến dịch voucher',
					},
					{
						displayName: 'Tên Chiến Dịch',
						name: 'name',
						type: 'string',
						default: '',
						description: 'Tên chiến dịch voucher',
					},
					{
						displayName: 'Ngày Bắt Đầu',
						name: 'startDate',
						type: 'dateTime',
						default: '',
						description: 'Ngày bắt đầu chiến dịch',
					},
					{
						displayName: 'Ngày Kết Thúc',
						name: 'endDate',
						type: 'dateTime',
						default: '',
						description: 'Ngày kết thúc chiến dịch',
					},
					{
						displayName: 'ID Chi Nhánh',
						name: 'branchId',
						type: 'number',
						default: 0,
						description: 'ID chi nhánh áp dụng',
					},
					{
						displayName: 'Loại Giảm Giá',
						name: 'discountType',
						type: 'options',
						default: 1,
						options: [
							{
								name: 'Số Tiền Cố Định',
								value: 1,
							},
							{
								name: 'Phần Trăm',
								value: 2,
							},
						],
						description: 'Loại giảm giá của chiến dịch',
					},
					{
						displayName: 'Giá Trị Giảm Giá',
						name: 'discountValue',
						type: 'number',
						default: 0,
						description: 'Giá trị giảm giá',
					},
					{
						displayName: 'Số Lượng Voucher',
						name: 'quantity',
						type: 'number',
						default: 0,
						description: 'Số lượng voucher phát hành',
					},
					{
						displayName: 'Tự Động Sinh Mã',
						name: 'isAutoGenerate',
						type: 'boolean',
						default: true,
						description: 'Tự động sinh mã voucher',
					},
					{
						displayName: 'Không Giới Hạn',
						name: 'isUnlimited',
						type: 'boolean',
						default: false,
						description: 'Chiến dịch không giới hạn số lượng',
					},
					{
						displayName: 'Mô Tả',
						name: 'description',
						type: 'string',
						default: '',
						description: 'Mô tả chiến dịch',
					},
					{
						displayName: 'Danh Sách ID Chi Nhánh',
						name: 'branchIds',
						type: 'string',
						typeOptions: {
							multipleValues: true,
						},
						default: [],
						description: 'Danh sách ID chi nhánh áp dụng',
					},
					{
						displayName: 'Danh Sách ID Nhóm Khách Hàng',
						name: 'customerGroupIds',
						type: 'string',
						typeOptions: {
							multipleValues: true,
						},
						default: [],
						description: 'Danh sách ID nhóm khách hàng áp dụng',
					},
					{
						displayName: 'Giá Trị Đơn Hàng Tối Thiểu',
						name: 'minOrderValue',
						type: 'number',
						default: 0,
						description: 'Giá trị đơn hàng tối thiểu để áp dụng voucher',
					},
					{
						displayName: 'Giá Trị Giảm Giá Tối Đa',
						name: 'maxDiscountValue',
						type: 'number',
						default: 0,
						description: 'Giá trị giảm giá tối đa',
					},
					{
						displayName: 'Sản Phẩm Voucher',
						name: 'voucherProducts',
						type: 'fixedCollection',
						typeOptions: {
							multipleValues: true,
						},
						default: {},
						options: [
							{
								name: 'values',
								displayName: 'Sản Phẩm',
								values: [
									{
										displayName: 'ID Sản Phẩm',
										name: 'productId',
										type: 'number',
										default: 0,
										description: 'ID sản phẩm',
									},
									{
										displayName: 'Mã Sản Phẩm',
										name: 'productCode',
										type: 'string',
										default: '',
										description: 'Mã sản phẩm',
									},
									{
										displayName: 'Tên Sản Phẩm',
										name: 'productName',
										type: 'string',
										default: '',
										description: 'Tên sản phẩm',
									},
									{
										displayName: 'Số Lượng',
										name: 'quantity',
										type: 'number',
										default: 0,
										description: 'Số lượng sản phẩm',
									},
									{
										displayName: 'Là Thưởng',
										name: 'isReward',
										type: 'boolean',
										default: false,
										description: 'Sản phẩm là thưởng',
									},
								],
							},
						],
						description: 'Danh sách sản phẩm áp dụng voucher',
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
						displayName: 'ID Chiến Dịch',
						name: 'campaignId',
						type: 'number',
						default: 0,
						description: 'Lọc theo ID chiến dịch',
					},
					{
						displayName: 'Từ Khóa',
						name: 'keyword',
						type: 'string',
						default: '',
						description: 'Tìm kiếm theo từ khóa',
					},
					{
						displayName: 'Trạng Thái',
						name: 'status',
						type: 'multiOptions',
						options: [
							{
								name: 'Đang Hoạt Động',
								value: 1,
							},
							{
								name: 'Không Hoạt Động',
								value: 0,
							},
							{
								name: 'Đã Sử Dụng',
								value: 2,
							},
							{
								name: 'Hết Hạn',
								value: 3,
							},
						],
						default: [],
						description: 'Lọc theo trạng thái voucher',
					},
					{
						displayName: 'Từ Ngày',
						name: 'fromDate',
						type: 'dateTime',
						default: '',
						description: 'Lọc từ ngày',
					},
					{
						displayName: 'Đến Ngày',
						name: 'toDate',
						type: 'dateTime',
						default: '',
						description: 'Lọc đến ngày',
					},
				],
			},
			{
				displayName: 'Bộ Lọc Chiến Dịch',
				name: 'campaignFilters',
				type: 'collection',
				placeholder: 'Thêm Bộ Lọc',
				default: {},
				displayOptions: {
					show: {
						operation: ['listCampaigns'],
					},
				},
				options: [
					{
						displayName: 'Từ Khóa',
						name: 'keyword',
						type: 'string',
						default: '',
						description: 'Tìm kiếm theo từ khóa',
					},
					{
						displayName: 'Trạng Thái',
						name: 'status',
						type: 'multiOptions',
						options: [
							{
								name: 'Đang Hoạt Động',
								value: 1,
							},
							{
								name: 'Không Hoạt Động',
								value: 0,
							},
							{
								name: 'Đã Sử Dụng',
								value: 2,
							},
							{
								name: 'Hết Hạn',
								value: 3,
							},
						],
						default: [],
						description: 'Lọc theo trạng thái chiến dịch',
					},
					{
						displayName: 'Từ Ngày',
						name: 'fromDate',
						type: 'dateTime',
						default: '',
						description: 'Lọc từ ngày',
					},
					{
						displayName: 'Đến Ngày',
						name: 'toDate',
						type: 'dateTime',
						default: '',
						description: 'Lọc đến ngày',
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
				const sdkVoucherApi = await kiotViet.vouchers();
				const voucherApi = sdkVoucherApi as unknown as VoucherHandler;

				if (operation === 'getAll') {
					const returnAll = this.getNodeParameter('returnAll', i) as boolean;
					const filters = this.getNodeParameter('filters', i) as IDataObject;

					const qs: IDataObject = {
						...filters,
					};

					if (!returnAll) {
						const limit = this.getNodeParameter('limit', i) as number;
						qs.pageSize = limit;
					}

					responseData = await voucherApi.list(qs);
				} else if (operation === 'get') {
					const voucherId = this.getNodeParameter('voucherId', i) as number;
					responseData = await voucherApi.get(voucherId);
				} else if (operation === 'getByCode') {
					const voucherCode = this.getNodeParameter('voucherCode', i) as string;
					responseData = await voucherApi.getByCode(voucherCode);
				} else if (operation === 'listCampaigns') {
					const returnAll = this.getNodeParameter('returnAll', i) as boolean;
					const filters = this.getNodeParameter('campaignFilters', i) as IDataObject;

					const qs: IDataObject = {
						...filters,
					};

					if (!returnAll) {
						const limit = this.getNodeParameter('limit', i) as number;
						qs.pageSize = limit;
					}

					responseData = await voucherApi.listCampaigns(qs);
				} else if (operation === 'getCampaign') {
					const campaignId = this.getNodeParameter('campaignId', i) as number;
					responseData = await voucherApi.getCampaign(campaignId);
				} else if (operation === 'createCampaign') {
					const code = this.getNodeParameter('code', i) as string;
					const name = this.getNodeParameter('name', i) as string;
					const startDate = this.getNodeParameter('startDate', i) as string;
					const endDate = this.getNodeParameter('endDate', i) as string;
					const branchId = this.getNodeParameter('branchId', i) as number;
					const discountType = this.getNodeParameter('discountType', i) as number;
					const discountValue = this.getNodeParameter('discountValue', i) as number;
					const quantity = this.getNodeParameter('quantity', i) as number;
					const isAutoGenerate = this.getNodeParameter('isAutoGenerate', i) as boolean;
					const isUnlimited = this.getNodeParameter('isUnlimited', i) as boolean;
					const additionalFields = this.getNodeParameter('additionalFields', i) as IDataObject;

					const campaignData: IDataObject = {
						code,
						name,
						startDate,
						endDate,
						branchId,
						discountType,
						discountValue,
						quantity,
						isAutoGenerate,
						isUnlimited,
					};

					if (additionalFields.description) {
						campaignData.description = additionalFields.description;
					}
					if (additionalFields.branchIds) {
						campaignData.branchIds = (additionalFields.branchIds as string[]).map((id) =>
							parseInt(id, 10),
						);
					}
					if (additionalFields.customerGroupIds) {
						campaignData.customerGroupIds = (additionalFields.customerGroupIds as string[]).map(
							(id) => parseInt(id, 10),
						);
					}
					if (additionalFields.minOrderValue !== undefined) {
						campaignData.minOrderValue = additionalFields.minOrderValue;
					}
					if (additionalFields.maxDiscountValue !== undefined) {
						campaignData.maxDiscountValue = additionalFields.maxDiscountValue;
					}
					if (additionalFields.voucherProducts) {
						const voucherProducts = (additionalFields.voucherProducts as IDataObject)
							.values as IDataObject[];
						campaignData.voucherProducts = voucherProducts.map((product) => ({
							productId: product.productId,
							productCode: product.productCode,
							productName: product.productName,
							quantity: product.quantity,
							isReward: product.isReward,
						}));
					}

					responseData = await voucherApi.createCampaign(campaignData);
				} else if (operation === 'updateCampaign') {
					const campaignId = this.getNodeParameter('campaignId', i) as number;
					const additionalFields = this.getNodeParameter('additionalFields', i) as IDataObject;

					const campaignData: IDataObject = {
						id: campaignId,
					};

					if (additionalFields.code) {
						campaignData.code = additionalFields.code;
					}
					if (additionalFields.name) {
						campaignData.name = additionalFields.name;
					}
					if (additionalFields.startDate) {
						campaignData.startDate = additionalFields.startDate;
					}
					if (additionalFields.endDate) {
						campaignData.endDate = additionalFields.endDate;
					}
					if (additionalFields.branchId !== undefined) {
						campaignData.branchId = additionalFields.branchId;
					}
					if (additionalFields.discountType !== undefined) {
						campaignData.discountType = additionalFields.discountType;
					}
					if (additionalFields.discountValue !== undefined) {
						campaignData.discountValue = additionalFields.discountValue;
					}
					if (additionalFields.quantity !== undefined) {
						campaignData.quantity = additionalFields.quantity;
					}
					if (additionalFields.isAutoGenerate !== undefined) {
						campaignData.isAutoGenerate = additionalFields.isAutoGenerate;
					}
					if (additionalFields.isUnlimited !== undefined) {
						campaignData.isUnlimited = additionalFields.isUnlimited;
					}
					if (additionalFields.description) {
						campaignData.description = additionalFields.description;
					}
					if (additionalFields.branchIds) {
						campaignData.branchIds = (additionalFields.branchIds as string[]).map((id) =>
							parseInt(id, 10),
						);
					}
					if (additionalFields.customerGroupIds) {
						campaignData.customerGroupIds = (additionalFields.customerGroupIds as string[]).map(
							(id) => parseInt(id, 10),
						);
					}
					if (additionalFields.minOrderValue !== undefined) {
						campaignData.minOrderValue = additionalFields.minOrderValue;
					}
					if (additionalFields.maxDiscountValue !== undefined) {
						campaignData.maxDiscountValue = additionalFields.maxDiscountValue;
					}
					if (additionalFields.voucherProducts) {
						const voucherProducts = (additionalFields.voucherProducts as IDataObject)
							.values as IDataObject[];
						campaignData.voucherProducts = voucherProducts.map((product) => ({
							productId: product.productId,
							productCode: product.productCode,
							productName: product.productName,
							quantity: product.quantity,
							isReward: product.isReward,
						}));
					}

					responseData = await voucherApi.updateCampaign(campaignData);
				} else if (operation === 'deleteCampaign') {
					const campaignId = this.getNodeParameter('campaignId', i) as number;
					responseData = await voucherApi.deleteCampaign(campaignId);
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
