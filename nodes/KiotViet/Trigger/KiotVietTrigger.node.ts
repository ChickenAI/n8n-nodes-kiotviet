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
import { WebhookEventType, WebhookCreateParams } from '../shared/KiotVietTypes';
import * as crypto from 'crypto';
import createHmacSignature from '../shared/utils/createHMAC';

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
				type: 'options',
				required: true,
				default: '',
				options: [
					{
						name: 'Khách Hàng - Cập Nhật',
						value: WebhookEventType.CustomerUpdate,
						description: 'Kích hoạt khi thông tin khách hàng được cập nhật',
					},
					{
						name: 'Khách Hàng - Xóa',
						value: WebhookEventType.CustomerDelete,
						description: 'Kích hoạt khi khách hàng bị xóa',
					},
					{
						name: 'Hàng Hóa - Cập Nhật',
						value: WebhookEventType.ProductUpdate,
						description: 'Kích hoạt khi thông tin hàng hóa được cập nhật',
					},
					{
						name: 'Hàng Hóa - Xóa',
						value: WebhookEventType.ProductDelete,
						description: 'Kích hoạt khi hàng hóa bị xóa',
					},
					{
						name: 'Tồn Kho - Cập Nhật',
						value: WebhookEventType.StockUpdate,
						description: 'Kích hoạt khi tồn kho được cập nhật',
					},
					{
						name: 'Đặt Hàng - Cập Nhật',
						value: WebhookEventType.OrderUpdate,
						description: 'Kích hoạt khi đơn đặt hàng được cập nhật',
					},
					{
						name: 'Hóa Đơn - Cập Nhật',
						value: WebhookEventType.InvoiceUpdate,
						description: 'Kích hoạt khi hóa đơn được cập nhật',
					},
					{
						name: 'Bảng Giá - Cập Nhật',
						value: WebhookEventType.PriceBookUpdate,
						description: 'Kích hoạt khi bảng giá được cập nhật',
					},
					{
						name: 'Bảng Giá - Xóa',
						value: WebhookEventType.PriceBookDelete,
						description: 'Kích hoạt khi bảng giá bị xóa',
					},
					{
						name: 'Chi Tiết Bảng Giá - Cập Nhật',
						value: WebhookEventType.PriceBookDetailUpdate,
						description: 'Kích hoạt khi chi tiết bảng giá được cập nhật',
					},
					{
						name: 'Chi Tiết Bảng Giá - Xóa',
						value: WebhookEventType.PriceBookDetailDelete,
						description: 'Kích hoạt khi chi tiết bảng giá bị xóa',
					},
					{
						name: 'Danh Mục Hàng Hóa - Cập Nhật',
						value: WebhookEventType.CategoryUpdate,
						description: 'Kích hoạt khi danh mục hàng hóa được cập nhật',
					},
					{
						name: 'Danh Mục Hàng Hóa - Xóa',
						value: WebhookEventType.CategoryDelete,
						description: 'Kích hoạt khi danh mục hàng hóa bị xóa',
					},
					{
						name: 'Chi Nhánh - Cập Nhật',
						value: WebhookEventType.BranchUpdate,
						description: 'Kích hoạt khi chi nhánh được cập nhật',
					},
					{
						name: 'Chi Nhánh - Xóa',
						value: WebhookEventType.BranchDelete,
						description: 'Kích hoạt khi chi nhánh bị xóa',
					},
				],
			},
			{
				displayName: 'Webhook Secret',
				name: 'secret',
				type: 'string',
				typeOptions: {
					password: true,
				},
				default: '',
				description: 'Mã bí mật để xác thực webhook từ KiotViet (tự đặt). Nên có ít nhất 8 ký tự.',
				required: true,
			},
			{
				displayName: 'Mô Tả Webhook',
				name: 'description',
				type: 'string',
				default: 'Webhook n8n cho KiotViet',
				description: 'Mô tả cho webhook',
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
				const event = this.getNodeParameter('events') as string;

				const kiotViet = new KiotVietApiBase(this);
				await kiotViet.init();

				try {
					// Check if webhook exists
					const registeredHooks = await kiotViet.getWebhooks();
					for (const hook of registeredHooks) {
						if (hook.url === webhookUrl && hook.type === event) {
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
				const event = this.getNodeParameter('events') as string;
				const filters = this.getNodeParameter('filters', {}) as IDataObject;
				const secret = this.getNodeParameter('secret') as string;
				const description = this.getNodeParameter('description') as string;

				if (!webhookUrl) {
					throw new NodeOperationError(this.getNode(), 'No webhook URL available');
				}

				if (secret.length < 8) {
					throw new NodeOperationError(
						this.getNode(),
						'Webhook secret should be at least 8 characters long',
					);
				}

				// Lưu secret nguyên bản trong workflow data để sử dụng khi xác thực webhook
				const workflowStaticData = this.getWorkflowStaticData('node');
				workflowStaticData.webhookSecret = secret;

				const kiotViet = new KiotVietApiBase(this);
				await kiotViet.init();

				try {
					const existingWebhooks = await kiotViet.getWebhooks();

					if (Array.isArray(existingWebhooks)) {
						for (const existingWebhook of existingWebhooks) {
							if (event === existingWebhook.type) {
								console.log(
									`Removing existing webhook with ID ${existingWebhook.id} for URL ${webhookUrl}`,
								);
								try {
									await kiotViet.deleteWebhook(existingWebhook.id.toString());
								} catch (deleteError) {
									console.error(`Failed to delete existing webhook: ${deleteError.message}`);
								}
							}
						}
					} else {
						console.log('No existing webhooks found or response format is unexpected');
					}

					const webhookData: WebhookCreateParams = {
						Webhook: {
							Type: event,
							Url: webhookUrl,
							IsActive: true,
							Description: description,
							Secret: secret,
						},
					};


					const response = await kiotViet.createWebhook(webhookData);

					workflowStaticData.webhookId = response?.id ?? Math.floor(Math.random() * 1000000);
					workflowStaticData.webhookEvent = event;

					return true;
				} catch (error) {
					throw new NodeOperationError(
						this.getNode(),
						`KiotViet webhook creation failed: ${error.message}`,
					);
				}
			},

			async delete(this: IHookFunctions): Promise<boolean> {
				const webhookData = this.getWorkflowStaticData('node');

				if (webhookData.webhookId !== undefined) {
					const kiotViet = new KiotVietApiBase(this);
					await kiotViet.init();

					try {
						// Delete the main webhook
						await kiotViet.httpRequest({
							method: 'DELETE',
							url: `/webhooks/${webhookData.webhookId}`,
						});



						// Clear webhook data
						delete webhookData.webhookId;
						delete webhookData.webhookSecret;
						delete webhookData.webhookEvent;


						return true;
					} catch (error) {
						console.error('Error deleting KiotViet webhook:', error);
						return false;
					}
				}
				return true;
			},
		},
	};

	async webhook(this: IWebhookFunctions): Promise<IWebhookResponseData> {
		const req = this.getRequestObject();
		const webhookData = this.getWorkflowStaticData('node');
		const event = this.getNodeParameter('events') as string;

		// Parse and standardize the request body
		let body = req.body;

		// Ensure body is an object
		if (typeof body === 'string') {
			try {
				body = JSON.parse(body);
			} catch (error) {
				console.error('Invalid webhook payload format:', body);
				throw new NodeOperationError(this.getNode(), 'Invalid webhook payload format');
			}
		}

		// Create signature from sorted JSON string to ensure consistent ordering
		console.log('Webhook payload:', body);
		console.log('Headers:', req.headers);

		// Validate webhook signature if a secret was provided
		if (webhookData.webhookSecret) {
			const signature = req.headers['x-hub-signature'] as string;
			if (!signature) {
				console.log('Missing webhook signature');
				// Return 401 Unauthorized
				return {
					noWebhookResponse: true,
				};
			}

			let hmac = await createHmacSignature(body, webhookData.webhookSecret.toString())
			hmac = `sha1=${hmac}`;
			console.log('Signature validation:', {
				calculated: hmac,
				received: signature
			});

			if (hmac !== signature) {
				console.log('Invalid webhook signature', {
					expected: hmac,
					received: signature,
				});
				// Return 401 Unauthorized
				return {
					noWebhookResponse: true,
				};
			}
		}

		// Verify the event type is one we're listening for
		let notificationType = '';

		// For update events with Notifications structure
		if (body.Notifications && Array.isArray(body.Notifications) && body.Notifications.length > 0) {
			notificationType = body.Notifications[0].Action;
		}
		// For delete events with RemoveId structure
		else if (body.RemoveId && Array.isArray(body.RemoveId)) {
			// Try to determine the event type from the event parameter
			if (event.includes('delete')) {
				notificationType = event;
			}
		}

		console.log('Determined notification type:', notificationType);

		// Process different webhook formats based on event type
		let processedData: {
			webhookId?: any;
			attemptNumber?: any;
			eventType: string;
			data?: any;
			removedIds?: any;
			rawPayload: any;
			receivedAt?: string;
			signatureValid?: boolean;
			webhookUrl?: string;
		};

		console.log('Processing webhook data...');

		if (body.Id && body.Attempt && body.Notifications) {
			// Handle standard notification format for update events
			processedData = {
				webhookId: body.Id,
				attemptNumber: body.Attempt,
				eventType: notificationType,
				data: body.Notifications[0].Data,
				rawPayload: body,
				receivedAt: new Date().toISOString(),
				signatureValid: true,
				webhookUrl: this.getNodeWebhookUrl('default'),
			};
		} else if (body.RemoveId && Array.isArray(body.RemoveId)) {
			// Handle delete notifications
			processedData = {
				eventType: notificationType,
				removedIds: body.RemoveId,
				rawPayload: body,
				receivedAt: new Date().toISOString(),
				signatureValid: true,
				webhookUrl: this.getNodeWebhookUrl('default'),
			};
		} else {
			// Unknown format - return the raw body with event type
			processedData = {
				eventType: notificationType,
				rawPayload: body,
				receivedAt: new Date().toISOString(),
				signatureValid: true,
				webhookUrl: this.getNodeWebhookUrl('default'),
			};
		}

		console.log('Processed webhook data:', processedData);

		return {
			workflowData: [this.helpers.returnJsonArray(processedData)],
		};
	}
}
