import type {
	IExecuteFunctions,
	IDataObject,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
} from 'n8n-workflow';
import { KiotVietApiBase } from '../shared/KiotVietApi';

export class KiotVietSurcharge implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Phụ Thu KiotViet',
		name: 'kiotVietSurcharge',
		icon: 'file:../shared/kiotviet.svg',
		group: ['transform'],
		version: 1,
		subtitle: '={{$parameter["operation"] + ": " + $parameter["resource"]}}',
		description: 'Quản lý phụ thu từ KiotViet',
		defaults: {
			name: 'Phụ Thu KiotViet',
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
						description: 'Lấy danh sách phụ thu',
						action: 'Lấy danh sách phụ thu',
					},
					{
						name: 'Lấy Theo ID',
						value: 'get',
						description: 'Lấy phụ thu theo ID',
						action: 'Lấy phụ thu',
					},
					{
						name: 'Tạo Mới',
						value: 'create',
						description: 'Tạo phụ thu mới',
						action: 'Tạo phụ thu',
					},
					{
						name: 'Cập Nhật',
						value: 'update',
						description: 'Cập nhật phụ thu',
						action: 'Cập nhật phụ thu',
					},
					{
						name: 'Xóa',
						value: 'delete',
						description: 'Xóa phụ thu',
						action: 'Xóa phụ thu',
					},
				],
				default: 'getAll',
			},
			{
				displayName: 'ID Phụ Thu',
				name: 'surchargeId',
				type: 'number',
				required: true,
				default: 0,
				displayOptions: {
					show: {
						operation: ['get', 'update', 'delete'],
					},
				},
				description: 'ID của phụ thu',
			},
			{
				displayName: 'Tên Phụ Thu',
				name: 'name',
				type: 'string',
				required: true,
				default: '',
				displayOptions: {
					show: {
						operation: ['create', 'update'],
					},
				},
				description: 'Tên của phụ thu',
			},
			{
				displayName: 'Giá Trị',
				name: 'value',
				type: 'number',
				required: true,
				default: 0,
				displayOptions: {
					show: {
						operation: ['create'],
					},
				},
				description: 'Giá trị của phụ thu',
			},
			{
				displayName: 'Là Phần Trăm',
				name: 'isPercent',
				type: 'boolean',
				required: true,
				default: false,
				displayOptions: {
					show: {
						operation: ['create'],
					},
				},
				description: 'Giá trị là phần trăm hay số tiền cố định',
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
						displayName: 'Mã Phụ Thu',
						name: 'code',
						type: 'string',
						default: '',
						description: 'Mã định danh của phụ thu',
					},
					{
						displayName: 'Mô Tả',
						name: 'description',
						type: 'string',
						default: '',
						description: 'Mô tả về phụ thu',
					},
					{
						displayName: 'Tự Động Thêm',
						name: 'isAutoAdd',
						type: 'boolean',
						default: false,
						description: 'Tự động thêm vào hóa đơn',
					},
					{
						displayName: 'Bắt Buộc',
						name: 'isRequired',
						type: 'boolean',
						default: false,
						description: 'Phụ thu bắt buộc',
					},
					{
						displayName: 'ID Chi Nhánh',
						name: 'branchIds',
						type: 'string',
						default: '',
						description: 'ID chi nhánh áp dụng (phân cách bằng dấu phẩy)',
					},
					{
						displayName: 'Đang Hoạt Động',
						name: 'isActive',
						type: 'boolean',
						default: true,
						description: 'Trạng thái hoạt động của phụ thu',
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
						displayName: 'Từ Khóa Tìm Kiếm',
						name: 'searchTerm',
						type: 'string',
						default: '',
						description: 'Tìm kiếm theo tên hoặc mã phụ thu',
					},
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
				const surchargeApi = await kiotViet.surcharges();

				if (operation === 'create') {
					const name = this.getNodeParameter('name', i) as string;
					const value = this.getNodeParameter('value', i) as number;
					const isPercent = this.getNodeParameter('isPercent', i) as boolean;
					const additionalFields = this.getNodeParameter('additionalFields', i) as IDataObject;

					const surchargeData = {
						name,
						value,
						isPercent,
						...additionalFields,
					};

					responseData = await surchargeApi.create(surchargeData);
				} else if (operation === 'get') {
					const surchargeId = this.getNodeParameter('surchargeId', i) as number;
					responseData = await surchargeApi.getById(surchargeId);
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

					responseData = await surchargeApi.list(qs);
				} else if (operation === 'update') {
					const surchargeId = this.getNodeParameter('surchargeId', i) as number;
					const name = this.getNodeParameter('name', i) as string;
					const additionalFields = this.getNodeParameter('additionalFields', i) as IDataObject;

					const surchargeData = {
						name,
						...additionalFields,
					};

					responseData = await surchargeApi.update(surchargeId, surchargeData);
				} else if (operation === 'delete') {
					const surchargeId = this.getNodeParameter('surchargeId', i) as number;
					responseData = await surchargeApi.delete(surchargeId);
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
