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
	TransferCreateParams,
	TransferListParams,
} from '../shared/KiotVietTypes';

export class KiotVietTransfer implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Chuyển Kho KiotViet',
		name: 'kiotVietTransfer',
		icon: 'file:../shared/kiotviet.svg',
		group: ['transform'],
		version: 1,
		subtitle: '={{$parameter["operation"] + ": " + $parameter["resource"]}}',
		description: 'Quản lý chuyển kho và tồn kho từ KiotViet',
		defaults: {
			name: 'Chuyển Kho KiotViet',
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
						name: 'Cập Nhật',
						value: 'update',
						description: 'Cập nhật phiếu chuyển kho',
						action: 'C p nh t phi u chuy n kho',
					},
					{
						name: 'Get Many',
						value: 'getAll',
						description: 'Lấy danh sách phiếu chuyển kho',
						action: 'L y danh s ch phi u chuy n kho',
					},
					{
						name: 'Lấy Theo ID',
						value: 'get',
						description: 'Lấy phiếu chuyển kho theo ID',
						action: 'L y phi u chuy n kho',
					},
					{
						name: 'Tạo Mới',
						value: 'create',
						description: 'Tạo phiếu chuyển kho mới',
						action: 'T o phi u chuy n kho',
					},
					{
						name: 'Xoá',
						value: 'delete',
						description: 'Xoá phiếu chuyển kho',
						action: 'Xo phi u chuy n kho',
					},
				],
				default: 'getAll',
			},
			{
				displayName: 'ID Phiếu Chuyển',
				name: 'transferId',
				type: 'string',
				required: true,
				default: '',
				displayOptions: {
					show: {
						operation: ['get', 'update', 'delete'],
					},
				},
				description: 'ID của phiếu chuyển kho',
			},

			// Fields for create operation
			{
				displayName: 'Chi Nhánh Gửi',
				name: 'fromBranchId',
				type: 'number',
				required: true,
				default: 0,
				displayOptions: {
					show: {
						operation: ['create', 'update'],
					},
				},
				description: 'ID chi nhánh gửi hàng',
			},
			{
				displayName: 'Chi Nhánh Nhận',
				name: 'toBranchId',
				type: 'number',
				required: true,
				default: 0,
				displayOptions: {
					show: {
						operation: ['create', 'update'],
					},
				},
				description: 'ID chi nhánh nhận hàng',
			},
			{
				displayName: 'Mã Phiếu Chuyển',
				name: 'code',
				type: 'string',
				default: '',
				displayOptions: {
					show: {
						operation: ['create', 'update'],
					},
				},
				description: 'Mã phiếu chuyển (tự động nếu để trống)',
			},
			{
				displayName: 'Mô Tả',
				name: 'description',
				type: 'string',
				default: '',
				displayOptions: {
					show: {
						operation: ['create', 'update'],
					},
				},
				description: 'Mô tả phiếu chuyển kho',
			},
			{
				displayName: 'Là Bản Nháp',
				name: 'isDraft',
				type: 'boolean',
				default: false,
				displayOptions: {
					show: {
						operation: ['create', 'update'],
					},
				},
				description: 'Whether to create transfer as draft',
			},
			{
				displayName: 'Chi Tiết Sản Phẩm',
				name: 'transferDetails',
				type: 'fixedCollection',
				typeOptions: {
					multipleValues: true,
				},
				default: {},
				displayOptions: {
					show: {
						operation: ['create', 'update'],
					},
				},
				description: 'Danh sách sản phẩm chuyển kho',
				options: [
					{
						name: 'detail',
						displayName: 'Sản Phẩm',
						values: [
							{
								displayName: 'ID Sản Phẩm',
								name: 'productId',
								type: 'number',
								required: true,
								default: 0,
								description: 'ID của sản phẩm',
							},
							{
								displayName: 'Mã Sản Phẩm',
								name: 'productCode',
								type: 'string',
								required: true,
								default: '',
							},
							{
								displayName: 'Số Lượng Gửi',
								name: 'sendQuantity',
								type: 'number',
								required: true,
								default: 1,
								description: 'Số lượng sản phẩm gửi',
							},
							{
								displayName: 'Số Lượng Nhận',
								name: 'receivedQuantity',
								type: 'number',
								default: 0,
								description: 'Số lượng sản phẩm nhận được (tùy chọn)',
							},
							{
								displayName: 'Giá',
								name: 'price',
								type: 'number',
								required: true,
								default: 0,
								description: 'Giá của sản phẩm',
							},
						],
					},
				],
			},

			// Filter fields for getAll operation
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
						displayName: 'Chi Nhánh Gửi',
						name: 'fromBranchIds',
						type: 'string',
						default: '',
						description: 'ID chi nhánh gửi (nhiều ID cách nhau bởi dấu phẩy)',
					},
					{
						displayName: 'Từ Ngày Nhận',
						name: 'fromReceivedDate',
						type: 'dateTime',
						default: '',
						description: 'Lọc từ ngày nhận',
					},
					{
						displayName: 'Từ Ngày Chuyển',
						name: 'fromTransferDate',
						type: 'dateTime',
						default: '',
						description: 'Lọc từ ngày chuyển',
					},
					{
						displayName: 'Trạng Thái',
						name: 'status',
						type: 'string',
						default: '',
						description: 'Trạng thái phiếu chuyển (nhiều trạng thái cách nhau bởi dấu phẩy)',
					},
					{
						displayName: 'Chi Nhánh Nhận',
						name: 'toBranchIds',
						type: 'string',
						default: '',
						description: 'ID chi nhánh nhận (nhiều ID cách nhau bởi dấu phẩy)',
					},
					{
						displayName: 'ĐếN Ngày Nhận',
						name: 'toReceivedDate',
						type: 'dateTime',
						default: '',
						description: 'Lọc đến ngày nhận',
					},
					{
						displayName: 'ĐếN Ngày Chuyển',
						name: 'toTransferDate',
						type: 'dateTime',
						default: '',
						description: 'Lọc đến ngày chuyển',
					},
				],
			},

			// Pagination options
			{
				displayName: 'Tùy Chọn',
				name: 'options',
				type: 'collection',
				placeholder: 'Thêm Tùy Chọn',
				default: {},
				displayOptions: {
					show: {
						operation: ['getAll'],
					},
				},
				options: [
					{
						displayName: 'Giới Hạn',
						name: 'pageSize',
						type: 'number',
						typeOptions: {
							minValue: 1,
							maxValue: 100,
						},
						default: 20,
						description: 'Số lượng kết quả trả về',
					},
					{
						displayName: 'Vị Trí Bắt ĐầU',
						name: 'currentItem',
						type: 'number',
						typeOptions: {
							minValue: 0,
						},
						default: 0,
						description: 'Vị trí bắt đầu lấy dữ liệu',
					},
				],
			},
		],
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const operation = this.getNodeParameter('operation', 0) as string;
		const returnData: IDataObject[] = [];

		const kiotVietApi = new KiotVietApiBase(this);

		for (let i = 0; i < items.length; i++) {
			let responseData: any;

			try {
				switch (operation) {
					case 'create':
						const fromBranchId = this.getNodeParameter('fromBranchId', i) as number;
						const toBranchId = this.getNodeParameter('toBranchId', i) as number;
						const code = this.getNodeParameter('code', i) as string;
						const description = this.getNodeParameter('description', i) as string;
						const isDraft = this.getNodeParameter('isDraft', i) as boolean;
						const transferDetails = this.getNodeParameter('transferDetails.detail', i, []) as any[];

						const createData: TransferCreateParams = {
							fromBranchId,
							toBranchId,
							isDraft,
							transferDetails: transferDetails.map((detail) => ({
								productId: detail.productId,
								productCode: detail.productCode,
								sendQuantity: detail.sendQuantity,
								receivedQuantity: detail.receivedQuantity,
								price: detail.price,
							})),
						};

						if (code) createData.code = code;
						if (description) createData.description = description;

						const transfersApi = await kiotVietApi.transfers();
						responseData = await transfersApi.create(createData);
						break;

					case 'get':
						const transferId = this.getNodeParameter('transferId', i) as string;
						const getTransfersApi = await kiotVietApi.transfers();
						responseData = await getTransfersApi.getById(parseInt(transferId, 10));
						break;

					case 'getAll':
						const filters = this.getNodeParameter('filters', i) as IDataObject;
						const options = this.getNodeParameter('options', i) as IDataObject;

						const queryParams: TransferListParams = {
							...options,
						};

						// Process array filters
						if (filters.fromBranchIds) {
							queryParams.fromBranchIds = (filters.fromBranchIds as string)
								.split(',')
								.map((id) => parseInt(id.trim(), 10))
								.filter((id) => !isNaN(id));
						}

						if (filters.toBranchIds) {
							queryParams.toBranchIds = (filters.toBranchIds as string)
								.split(',')
								.map((id) => parseInt(id.trim(), 10))
								.filter((id) => !isNaN(id));
						}

						if (filters.status) {
							queryParams.status = (filters.status as string)
								.split(',')
								.map((status) => parseInt(status.trim(), 10))
								.filter((status) => !isNaN(status));
						}

						// Process date filters
						if (filters.fromTransferDate) {
							queryParams.fromTransferDate = filters.fromTransferDate as string;
						}
						if (filters.toTransferDate) {
							queryParams.toTransferDate = filters.toTransferDate as string;
						}
						if (filters.fromReceivedDate) {
							queryParams.fromReceivedDate = filters.fromReceivedDate as string;
						}
						if (filters.toReceivedDate) {
							queryParams.toReceivedDate = filters.toReceivedDate as string;
						}

						const listTransfersApi = await kiotVietApi.transfers();
						responseData = await listTransfersApi.list(queryParams);
						break;

					case 'update':
						const updateTransferId = this.getNodeParameter('transferId', i) as string;
						const updateFromBranchId = this.getNodeParameter('fromBranchId', i) as number;
						const updateToBranchId = this.getNodeParameter('toBranchId', i) as number;
						const updateCode = this.getNodeParameter('code', i) as string;
						const updateDescription = this.getNodeParameter('description', i) as string;
						const updateIsDraft = this.getNodeParameter('isDraft', i) as boolean;
						const updateTransferDetails = this.getNodeParameter('transferDetails.detail', i, []) as any[];

						const updateData: TransferCreateParams = {
							fromBranchId: updateFromBranchId,
							toBranchId: updateToBranchId,
							isDraft: updateIsDraft,
							transferDetails: updateTransferDetails.map((detail) => ({
								productId: detail.productId,
								productCode: detail.productCode,
								sendQuantity: detail.sendQuantity,
								receivedQuantity: detail.receivedQuantity,
								price: detail.price,
							})),
						};

						if (updateCode) updateData.code = updateCode;
						if (updateDescription) updateData.description = updateDescription;

						const updateTransfersApi = await kiotVietApi.transfers();
						responseData = await updateTransfersApi.update(parseInt(updateTransferId, 10), updateData);
						break;

					case 'delete':
						const deleteTransferId = this.getNodeParameter('transferId', i) as string;
						const deleteTransfersApi = await kiotVietApi.transfers();
						await deleteTransfersApi.delete(parseInt(deleteTransferId, 10));
						responseData = { success: true, message: 'Transfer deleted successfully' };
						break;

					default:
						throw new NodeOperationError(this.getNode(), `Thao tác "${operation}" không được hỗ trợ`);
				}

				if (responseData && typeof responseData === 'object' && 'data' in responseData && Array.isArray(responseData.data)) {
					returnData.push(...responseData.data);
				} else if (responseData) {
					returnData.push(responseData as IDataObject);
				}
			} catch (error) {
				if (this.continueOnFail()) {
					returnData.push({ error: (error as Error).message });
					continue;
				}
				throw error;
			}
		}

		return [this.helpers.returnJsonArray(returnData)];
	}
}
