import type {
	IExecuteFunctions,
	IDataObject,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
} from 'n8n-workflow';
import { KiotVietApiBase } from '../shared/KiotVietApi';

export class KiotVietOrderSuppliers implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Đơn Đặt Hàng NCC KiotViet',
		name: 'kiotVietOrderSuppliers',
		icon: 'file:../shared/kiotviet.svg',
		group: ['transform'],
		version: 1,
		subtitle: '={{$parameter["operation"] + ": " + $parameter["resource"]}}',
		description: 'Quản lý đơn đặt hàng nhà cung cấp từ KiotViet',
		defaults: {
			name: 'Đơn Đặt Hàng NCC KiotViet',
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
						name: 'Lấy Theo ID',
						value: 'get',
						description: 'Lấy đơn đặt hàng nhà cung cấp theo ID',
						action: 'Lấy đơn đặt hàng nhà cung cấp',
					},
					{
						name: 'Lấy Danh Sách',
						value: 'getAll',
						description: 'Lấy danh sách đơn đặt hàng nhà cung cấp',
						action: 'Lấy danh sách đơn đặt hàng nhà cung cấp',
					},
				],
				default: 'getAll',
			},
			{
				displayName: 'ID Đơn Đặt Hàng NCC',
				name: 'orderSupplierId',
				type: 'string',
				required: true,
				default: '',
				displayOptions: {
					show: {
						operation: ['get'],
					},
				},
				description: 'ID của đơn đặt hàng nhà cung cấp',
			},
			{
				displayName: 'Lấy Toàn Bộ',
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
						displayName: 'Từ Khóa Tìm Kiếm',
						name: 'searchTerm',
						type: 'string',
						default: '',
						description: 'Tìm kiếm theo mã hoặc ghi chú đơn đặt hàng',
					},
					{
						displayName: 'Trạng Thái',
						name: 'status',
						type: 'options',
						options: [
							{
								name: 'Đã Duyệt',
								value: 'Approved',
							},
							{
								name: 'Đã Nhập',
								value: 'Imported',
							},
							{
								name: 'Đã Hủy',
								value: 'Canceled',
							},
							{
								name: 'Nháp',
								value: 'Draft',
							},
						],
						default: 'Approved',
						description: 'Lọc theo trạng thái đơn đặt hàng',
					},
					{
						displayName: 'ID Chi Nhánh',
						name: 'branchId',
						type: 'string',
						default: '',
						description: 'Lọc theo ID chi nhánh',
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
				const orderSuppliersApi = await kiotViet.orderSuppliers();

				if (operation === 'get') {
					const orderSupplierId = parseInt(this.getNodeParameter('orderSupplierId', i) as string);
					responseData = await orderSuppliersApi.getById(orderSupplierId);
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

					responseData = await orderSuppliersApi.list(qs);
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
