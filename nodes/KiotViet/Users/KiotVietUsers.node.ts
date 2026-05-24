import type {
	IExecuteFunctions,
	IDataObject,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
} from 'n8n-workflow';
import { KiotVietApiBase } from '../shared/KiotVietApi';

export class KiotVietUsers implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Người Dùng KiotViet',
		name: 'kiotVietUsers',
		icon: 'file:../shared/kiotviet.svg',
		group: ['transform'],
		version: 1,
		subtitle: '={{$parameter["operation"] + ": " + $parameter["resource"]}}',
		description: 'Quản lý người dùng từ KiotViet',
		defaults: {
			name: 'Người Dùng KiotViet',
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
						description: 'Lấy danh sách người dùng',
						action: 'Lấy danh sách người dùng',
					},
					{
						name: 'Lấy Theo ID',
						value: 'get',
						description: 'Lấy người dùng theo ID',
						action: 'Lấy người dùng',
					},
					{
						name: 'Lấy Đang Hoạt Động',
						value: 'getActive',
						description: 'Lấy danh sách người dùng đang hoạt động',
						action: 'Lấy người dùng đang hoạt động',
					},
					{
						name: 'Lấy Theo Chi Nhánh',
						value: 'getByBranch',
						description: 'Lấy người dùng theo chi nhánh',
						action: 'Lấy người dùng theo chi nhánh',
					},
					{
						name: 'Tìm Kiếm',
						value: 'search',
						description: 'Tìm kiếm người dùng',
						action: 'Tìm kiếm người dùng',
					},
				],
				default: 'getAll',
			},
			{
				displayName: 'ID Người Dùng',
				name: 'userId',
				type: 'number',
				required: true,
				default: 0,
				displayOptions: {
					show: {
						operation: ['get'],
					},
				},
				description: 'ID của người dùng',
			},
			{
				displayName: 'ID Chi Nhánh',
				name: 'branchId',
				type: 'number',
				required: true,
				default: 0,
				displayOptions: {
					show: {
						operation: ['getByBranch'],
					},
				},
				description: 'ID của chi nhánh',
			},
			{
				displayName: 'Từ Khóa Tìm Kiếm',
				name: 'searchTerm',
				type: 'string',
				required: true,
				default: '',
				displayOptions: {
					show: {
						operation: ['search'],
					},
				},
				description: 'Từ khóa để tìm kiếm người dùng',
			},
			{
				displayName: 'Lấy Toàn Bộ',
				name: 'returnAll',
				type: 'boolean',
				default: false,
				description: 'Lấy toàn bộ kết quả hoặc giới hạn số lượng',
				displayOptions: {
					show: {
						operation: ['getAll', 'getActive', 'getByBranch', 'search'],
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
						operation: ['getAll', 'getActive', 'getByBranch', 'search'],
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
						operation: ['getAll', 'getActive', 'getByBranch', 'search'],
					},
				},
				options: [
					{
						displayName: 'Từ Khóa Tìm Kiếm',
						name: 'searchTerm',
						type: 'string',
						default: '',
						description: 'Tìm kiếm theo tên hoặc mã người dùng',
					},
					{
						displayName: 'Trạng Thái',
						name: 'status',
						type: 'options',
						options: [
							{
								name: 'Đang Hoạt Động',
								value: 'Active',
							},
							{
								name: 'Ngừng Hoạt Động',
								value: 'Inactive',
							},
						],
						default: 'Active',
						description: 'Lọc theo trạng thái người dùng',
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
				const usersApi = await kiotViet.users();

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

					responseData = await usersApi.list(qs);
				} else if (operation === 'get') {
					const userId = this.getNodeParameter('userId', i) as number;
					responseData = await usersApi.getById(userId);
				} else if (operation === 'getActive') {
					const returnAll = this.getNodeParameter('returnAll', i) as boolean;
					const filters = this.getNodeParameter('filters', i) as IDataObject;

					const qs: IDataObject = {
						...filters,
					};

					if (!returnAll) {
						const limit = this.getNodeParameter('limit', i) as number;
						qs.pageSize = limit;
					}

					responseData = await usersApi.getActive(qs);
				} else if (operation === 'getByBranch') {
					const branchId = this.getNodeParameter('branchId', i) as number;
					const returnAll = this.getNodeParameter('returnAll', i) as boolean;
					const filters = this.getNodeParameter('filters', i) as IDataObject;

					const qs: IDataObject = {
						...filters,
					};

					if (!returnAll) {
						const limit = this.getNodeParameter('limit', i) as number;
						qs.pageSize = limit;
					}

					responseData = await usersApi.getByBranch(branchId, qs);
				} else if (operation === 'search') {
					const searchTerm = this.getNodeParameter('searchTerm', i) as string;
					const returnAll = this.getNodeParameter('returnAll', i) as boolean;
					const filters = this.getNodeParameter('filters', i) as IDataObject;

					const qs: IDataObject = {
						...filters,
					};

					if (!returnAll) {
						const limit = this.getNodeParameter('limit', i) as number;
						qs.pageSize = limit;
					}

					responseData = await usersApi.search(searchTerm, qs);
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
