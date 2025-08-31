import type {
	IExecuteFunctions,
	IDataObject,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
} from 'n8n-workflow';
import { KiotVietApiBase } from '../shared/KiotVietApi';

export class KiotVietBranch implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Chi Nhánh KiotViet',
		name: 'kiotVietBranch',
		icon: 'file:../shared/kiotviet.svg',
		group: ['transform'],
		version: 1,
		subtitle: '={{$parameter["operation"] + ": " + $parameter["resource"]}}',
		description: 'Quản lý chi nhánh từ KiotViet',
		defaults: {
			name: 'Chi Nhánh KiotViet',
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
						description: 'Tạo chi nhánh mới',
						action: 'T o chi nh nh',
					},
					{
						name: 'Xóa',
						value: 'delete',
						description: 'Xóa chi nhánh',
						action: 'X a chi nh nh',
					},
					{
						name: 'Lấy Theo ID',
						value: 'get',
						description: 'Lấy chi nhánh theo ID',
						action: 'L y chi nh nh',
					},
					{
						name: 'Get Many',
						value: 'getAll',
						description: 'Lấy danh sách chi nhánh',
						action: 'L y danh s ch chi nh nh',
					},
					{
						name: 'Cập Nhật',
						value: 'update',
						description: 'Cập nhật chi nhánh',
						action: 'C p nh t chi nh nh',
					},
				],
				default: 'getAll',
			},
			{
				displayName: 'ID Chi Nhánh',
				name: 'branchId',
				type: 'string',
				required: true,
				default: '',
				displayOptions: {
					show: {
						operation: ['get', 'update', 'delete'],
					},
				},
				description: 'ID của chi nhánh',
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
				displayName: 'Tên Chi Nhánh',
				name: 'name',
				type: 'string',
				default: '',
				required: true,
				displayOptions: {
					show: {
						operation: ['create', 'update'],
					},
				},
				description: 'Tên của chi nhánh',
			},
			{
				displayName: 'ĐịA Chỉ',
				name: 'address',
				type: 'string',
				default: '',
				required: true,
				displayOptions: {
					show: {
						operation: ['create', 'update'],
					},
				},
				description: 'Địa chỉ của chi nhánh',
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
						displayName: 'Số ĐIện Thoại',
						name: 'phoneNumber',
						type: 'string',
						default: '',
						description: 'Số điện thoại chi nhánh',
					},
					{
						displayName: 'Số ĐIện Thoại',
						name: 'phoneNumber',
						type: 'string',
						default: '',
						description: 'Số điện thoại chi nhánh',
					},
					{
						displayName: 'Mã Chi Nhánh',
						name: 'code',
						type: 'string',
						default: '',
						description: 'Mã định danh của chi nhánh',
					},
					{
						displayName: 'Ghi Chú',
						name: 'description',
						type: 'string',
						default: '',
						description: 'Ghi chú về chi nhánh',
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
						description: 'Tìm kiếm theo tên hoặc mã chi nhánh',
					},
					{
						displayName: 'Trạng Thái',
						name: 'status',
						type: 'options',
						options: [
							{
								name: 'ĐAng Hoạt ĐộNg',
								value: 'Active',
							},
							{
								name: 'Ngừng Hoạt ĐộNg',
								value: 'Inactive',
							},
						],
						default: 'Active',
						description: 'Lọc theo trạng thái chi nhánh',
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
				const branchApi = await kiotViet.branches();

				if (operation === 'create') {
					const name = this.getNodeParameter('name', i) as string;
					const additionalFields = this.getNodeParameter('additionalFields', i) as IDataObject;

					const branchData = {
						name,
						address: this.getNodeParameter('address', i) as string,
						...additionalFields,
					};

					responseData = await branchApi.create(branchData);
				} else if (operation === 'get') {
					const branchId = parseInt(this.getNodeParameter('branchId', i) as string);
					responseData = await branchApi.getById(branchId);
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

					responseData = await branchApi.list(qs);
				} else if (operation === 'update') {
					const branchId = parseInt(this.getNodeParameter('branchId', i) as string);
					const name = this.getNodeParameter('name', i) as string;
					const additionalFields = this.getNodeParameter('additionalFields', i) as IDataObject;

					const branchData = {
						name,
						...additionalFields,
					};

					responseData = await branchApi.update(branchId, branchData);
				} else if (operation === 'delete') {
					const branchId = parseInt(this.getNodeParameter('branchId', i) as string);
					responseData = await branchApi.delete(branchId);
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
