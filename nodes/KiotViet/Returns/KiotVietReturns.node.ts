import type {
	IExecuteFunctions,
	IDataObject,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
} from 'n8n-workflow';
import { KiotVietApiBase } from '../shared/KiotVietApi';

export class KiotVietReturns implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Trả Hàng KiotViet',
		name: 'kiotVietReturns',
		icon: 'file:../shared/kiotviet.svg',
		group: ['transform'],
		version: 1,
		subtitle: '={{$parameter["operation"] + ": " + $parameter["resource"]}}',
		description: 'Quản lý trả hàng từ KiotViet',
		defaults: {
			name: 'Trả Hàng KiotViet',
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
						description: 'Lấy danh sách trả hàng',
						action: 'Lấy danh sách trả hàng',
					},
					{
						name: 'Lấy Theo ID',
						value: 'get',
						description: 'Lấy trả hàng theo ID',
						action: 'Lấy trả hàng',
					},
					{
						name: 'Lấy Theo Mã',
						value: 'getByCode',
						description: 'Lấy trả hàng theo mã',
						action: 'Lấy trả hàng theo mã',
					},
				],
				default: 'getAll',
			},
			{
				displayName: 'ID Trả Hàng',
				name: 'returnId',
				type: 'number',
				required: true,
				default: 0,
				displayOptions: {
					show: {
						operation: ['get'],
					},
				},
				description: 'ID của phiếu trả hàng',
			},
			{
				displayName: 'Mã Trả Hàng',
				name: 'returnCode',
				type: 'string',
				required: true,
				default: '',
				displayOptions: {
					show: {
						operation: ['getByCode'],
					},
				},
				description: 'Mã của phiếu trả hàng',
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
						displayName: 'Từ Ngày Trả',
						name: 'fromReturnDate',
						type: 'dateTime',
						default: '',
						description: 'Lọc từ ngày trả hàng',
					},
					{
						displayName: 'Đến Ngày Trả',
						name: 'toReturnDate',
						type: 'dateTime',
						default: '',
						description: 'Lọc đến ngày trả hàng',
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
				const returnsApi = await kiotViet.returns();

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

					responseData = await returnsApi.list(qs);
				} else if (operation === 'get') {
					const returnId = this.getNodeParameter('returnId', i) as number;
					responseData = await returnsApi.getById(returnId);
				} else if (operation === 'getByCode') {
					const returnCode = this.getNodeParameter('returnCode', i) as string;
					responseData = await returnsApi.getByCode(returnCode);
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
