import type {
	IExecuteFunctions,
	IDataObject,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
} from 'n8n-workflow';
import { KiotVietApiBase } from '../shared/KiotVietApi';

export class KiotVietCashFlow implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Dòng Tiền KiotViet',
		name: 'kiotVietCashFlow',
		icon: 'file:../shared/kiotviet.svg',
		group: ['transform'],
		version: 1,
		subtitle: '={{$parameter["operation"] + ": " + $parameter["resource"]}}',
		description: 'Quản lý dòng tiền từ KiotViet',
		defaults: {
			name: 'Dòng Tiền KiotViet',
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
						name: 'Lấy Danh Sách',
						value: 'getAll',
						description: 'Lấy danh sách dòng tiền',
						action: 'Lấy danh sách dòng tiền',
					},
					{
						name: 'Xử Lý Thanh Toán',
						value: 'processPayment',
						description: 'Xử lý thanh toán',
						action: 'Xử lý thanh toán',
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
				displayOptions: {
					show: {
						operation: ['getAll'],
						returnAll: [false],
					},
				},
			},
			{
				displayName: 'Số Tiền',
				name: 'amount',
				type: 'number',
				required: true,
				default: 0,
				displayOptions: {
					show: {
						operation: ['processPayment'],
					},
				},
				description: 'Số tiền thanh toán',
			},
			{
				displayName: 'Phương Thức',
				name: 'method',
				type: 'string',
				required: true,
				default: '',
				displayOptions: {
					show: {
						operation: ['processPayment'],
					},
				},
				description: 'Phương thức thanh toán',
			},
			{
				displayName: 'ID Hóa Đơn',
				name: 'invoiceId',
				type: 'number',
				required: true,
				default: 0,
				displayOptions: {
					show: {
						operation: ['processPayment'],
					},
				},
				description: 'ID của hóa đơn',
			},
			{
				displayName: 'ID Tài Khoản',
				name: 'accountId',
				type: 'number',
				default: 0,
				displayOptions: {
					show: {
						operation: ['processPayment'],
					},
				},
				description: 'ID của tài khoản (tùy chọn)',
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
						displayName: 'ID Chi Nhánh',
						name: 'branchIds',
						type: 'string',
						default: '',
						description: 'Lọc theo ID chi nhánh (phân cách bằng dấu phẩy)',
					},
					{
						displayName: 'Ngày Bắt Đầu',
						name: 'startDate',
						type: 'dateTime',
						default: '',
						description: 'Lọc từ ngày',
					},
					{
						displayName: 'Ngày Kết Thúc',
						name: 'endDate',
						type: 'dateTime',
						default: '',
						description: 'Lọc đến ngày',
					},
					{
						displayName: 'Trạng Thái',
						name: 'status',
						type: 'string',
						default: '',
						description: 'Lọc theo trạng thái',
					},
					{
						displayName: 'Phương Thức',
						name: 'method',
						type: 'string',
						default: '',
						description: 'Lọc theo phương thức thanh toán',
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
				const cashFlowApi = await kiotViet.cashFlow();

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

					responseData = await cashFlowApi.list(qs);
				} else if (operation === 'processPayment') {
					const amount = this.getNodeParameter('amount', i) as number;
					const method = this.getNodeParameter('method', i) as string;
					const invoiceId = this.getNodeParameter('invoiceId', i) as number;
					const accountId = this.getNodeParameter('accountId', i) as number;

					const paymentData: IDataObject = {
						amount,
						method,
						invoiceId,
					};

					if (accountId) {
						paymentData.accountId = accountId;
					}

					responseData = await cashFlowApi.processPayment(paymentData as any);
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
