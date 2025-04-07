import type {
	IHookFunctions,
	IWebhookFunctions,
	IDataObject,
	ILoadOptionsFunctions,
	INodePropertyOptions,
	INodeType,
	INodeTypeDescription,
	IWebhookResponseData,
} from 'n8n-workflow';
import { NodeOperationError } from 'n8n-workflow';
import { KiotVietApiBase } from '../shared/KiotVietApi';

export class KiotVietTrigger implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'KiotViet Trigger',
		name: 'kiotVietTrigger',
		icon: 'file:../shared/kiotviet.svg',
		group: ['trigger'],
		version: 1,
		description: 'Xử lý các sự kiện từ KiotViet thông qua webhook',
		defaults: {
			name: 'KiotViet Trigger',
		},
		inputs: [],
		outputs: ['main'],
		credentials: [
			{
				name: 'kiotVietApi',
				required: true,
			},
		],
		webhooks: [
			{
				name: 'default',
				httpMethod: 'POST',
				responseMode: 'onReceived',
				path: 'webhook',
			},
		],
		properties: [
			{
				displayName: 'Sự Kiện',
				name: 'events',
				type: 'multiOptions',
				required: true,
				default: [],
				options: [
					{
						name: 'Đơn Hàng Được Tạo',
						value: 'order.created',
						description: 'Kích hoạt khi một đơn hàng mới được tạo',
					},
					{
						name: 'Đơn Hàng Được Cập Nhật',
						value: 'order.updated',
						description: 'Kích hoạt khi một đơn hàng được cập nhật',
					},
					{
						name: 'Đơn Hàng Bị Hủy',
						value: 'order.canceled',
						description: 'Kích hoạt khi một đơn hàng bị hủy',
					},
					{
						name: 'Hàng Tồn Kho Thay Đổi',
						value: 'inventory.changed',
						description: 'Kích hoạt khi số lượng hàng tồn kho thay đổi',
					},
					{
						name: 'Khách Hàng Được Tạo',
						value: 'customer.created',
						description: 'Kích hoạt khi một khách hàng mới được tạo',
					},
					{
						name: 'Khách Hàng Được Cập Nhật',
						value: 'customer.updated',
						description: 'Kích hoạt khi thông tin khách hàng được cập nhật',
					},
					{
						name: 'Hóa Đơn Được Tạo',
						value: 'invoice.created',
						description: 'Kích hoạt khi một hóa đơn mới được tạo',
					},
					{
						name: 'Hóa Đơn Được Cập Nhật',
						value: 'invoice.updated',
						description: 'Kích hoạt khi một hóa đơn được cập nhật',
					},
					{
						name: 'Hóa Đơn Bị Hủy',
						value: 'invoice.canceled',
						description: 'Kích hoạt khi một hóa đơn bị hủy',
					},
				],
			},
			{
				displayName: 'Bộ Lọc',
				name: 'filters',
				type: 'collection',
				placeholder: 'Thêm Bộ Lọc',
				default: {},
				options: [
					{
						displayName: 'ID Chi Nhánh',
						name: 'branchId',
						type: 'string',
						default: '',
						description: 'Chỉ nhận sự kiện từ chi nhánh cụ thể',
					},
					{
						displayName: 'Trạng Thái',
						name: 'status',
						type: 'multiOptions',
						options: [
							{
								name: 'Hoàn Thành',
								value: 'Completed',
							},
							{
								name: 'Đang Xử Lý',
								value: 'Processing',
							},
							{
								name: 'Đã Hủy',
								value: 'Canceled',
							},
						],
						default: [],
						description: 'Lọc theo trạng thái cụ thể',
					},
				],
			},
		],
	};

	webhookMethods = {
		default: {
			async checkExists(this: IHookFunctions): Promise<boolean> {
				const webhookData = this.getWorkflowStaticData('node');
				const webhookUrl = this.getNodeWebhookUrl('default');
				const events = this.getNodeParameter('events') as string[];

				const kiotViet = new KiotVietApiBase(this);
				await kiotViet.init();

				try {
					// Check if webhook exists
					const registeredHooks = await kiotViet.getWebhooks();
					for (const hook of registeredHooks) {
						if (hook.url === webhookUrl && hook.events.some((e) => events.includes(e))) {
							webhookData.webhookId = hook.id;
							return true;
						}
					}
				} catch (error) {
					console.error('Error checking webhook:', error);
				}
				return false;
			},

			async create(this: IHookFunctions): Promise<boolean> {
				const webhookUrl = this.getNodeWebhookUrl('default');
				const events = this.getNodeParameter('events') as string[];
				const filters = this.getNodeParameter('filters', {}) as IDataObject;

				if (!webhookUrl) {
					throw new NodeOperationError(this.getNode(), 'No webhook URL available');
				}

				const kiotViet = new KiotVietApiBase(this);
				await kiotViet.init();

				try {
					const webhook = await kiotViet.createWebhook({
						url: webhookUrl as string,
						events,
						...filters,
					});

					const webhookData = this.getWorkflowStaticData('node');
					webhookData.webhookId = webhook.id;
					return true;
				} catch (error) {
					throw new NodeOperationError(this.getNode(), 'KiotViet webhook creation failed');
				}
			},

			async delete(this: IHookFunctions): Promise<boolean> {
				const webhookData = this.getWorkflowStaticData('node');

				if (webhookData.webhookId !== undefined) {
					const kiotViet = new KiotVietApiBase(this);
					await kiotViet.init();

					try {
						await kiotViet.deleteWebhook(webhookData.webhookId as string);
						delete webhookData.webhookId;
						return true;
					} catch (error) {
						return false;
					}
				}
				return true;
			},
		},
	};

	async webhook(this: IWebhookFunctions): Promise<IWebhookResponseData> {
		const req = this.getRequestObject();
		const events = this.getNodeParameter('events') as string[];
		const filters = this.getNodeParameter('filters', {}) as IDataObject;

		// Validate webhook signature
		const signature = req.headers['x-kiotviet-signature'];
		if (!signature) {
			throw new NodeOperationError(this.getNode(), 'Missing webhook signature');
		}

		// Verify the event type is one we're listening for
		const eventType = req.body.event;
		if (!events.includes(eventType)) {
			return {};
		}

		// Apply filters if configured
		if (filters.branchId && req.body.branchId !== filters.branchId) {
			return {};
		}

		// Convert status filter to array if it exists
		const statusFilter = filters.status as string[];
		if (statusFilter?.length > 0 && !statusFilter.includes(req.body.status as string)) {
			return {};
		}

		return {
			workflowData: [this.helpers.returnJsonArray(req.body)],
		};
	}
}
