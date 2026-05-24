import type {
	IExecuteFunctions,
	IDataObject,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
} from 'n8n-workflow';
import { KiotVietApiBase } from '../shared/KiotVietApi';

export class KiotVietPriceBook implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Bảng Giá KiotViet',
		name: 'kiotVietPriceBook',
		icon: 'file:../shared/kiotviet.svg',
		group: ['transform'],
		version: 1,
		subtitle: '={{$parameter["operation"] + ": " + $parameter["resource"]}}',
		description: 'Quản lý bảng giá từ KiotViet',
		defaults: {
			name: 'Bảng Giá KiotViet',
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
						description: 'Lấy danh sách bảng giá',
						action: 'Lấy danh sách bảng giá',
					},
					{
						name: 'Lấy Theo ID',
						value: 'get',
						description: 'Lấy bảng giá theo ID',
						action: 'Lấy bảng giá',
					},
					{
						name: 'Cập Nhật Giá',
						value: 'updatePriceDetail',
						description: 'Cập nhật chi tiết giá',
						action: 'Cập nhật chi tiết giá',
					},
				],
				default: 'getAll',
			},
			{
				displayName: 'ID Bảng Giá',
				name: 'priceBookId',
				type: 'number',
				required: true,
				default: 0,
				displayOptions: {
					show: {
						operation: ['get', 'updatePriceDetail'],
					},
				},
				description: 'ID của bảng giá',
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
				displayName: 'Chi Tiết Giá',
				name: 'details',
				type: 'fixedCollection',
				typeOptions: {
					multipleValues: true,
				},
				placeholder: 'Thêm Chi Tiết',
				default: {},
				displayOptions: {
					show: {
						operation: ['updatePriceDetail'],
					},
				},
				options: [
					{
						displayName: 'Chi Tiết',
						name: 'details',
						values: [
							{
								displayName: 'ID Sản Phẩm',
								name: 'productId',
								type: 'number',
								default: 0,
								description: 'ID của sản phẩm',
							},
							{
								displayName: 'Giá',
								name: 'price',
								type: 'number',
								default: 0,
								description: 'Giá mới của sản phẩm',
							},
						],
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
						displayName: 'Đang Hoạt Động',
						name: 'isActive',
						type: 'boolean',
						default: true,
						description: 'Lọc theo trạng thái hoạt động',
					},
					{
						displayName: 'ID Chi Nhánh',
						name: 'branchId',
						type: 'number',
						default: 0,
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
				const priceBookApi = await kiotViet.priceBooks();

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

					responseData = await priceBookApi.list(qs);
				} else if (operation === 'get') {
					const priceBookId = this.getNodeParameter('priceBookId', i) as number;
					responseData = await priceBookApi.getById(priceBookId);
				} else if (operation === 'updatePriceDetail') {
					const priceBookId = this.getNodeParameter('priceBookId', i) as number;
					const details = this.getNodeParameter('details', i) as IDataObject;

					const updateData: IDataObject = {
						priceBookId,
						...details,
					};

					responseData = await priceBookApi.updatePriceDetail(updateData as any);
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
