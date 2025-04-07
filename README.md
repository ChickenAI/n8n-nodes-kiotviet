# n8n-nodes-kiotviet

This is an n8n community node package that helps you integrate KiotViet retail management system with n8n.

## Features

- **Product Management**: Create, read, update, and manage products
- **Customer Management**: Handle customer data and relationships
- **Order Management**: Process orders and manage order statuses

## Installation

Follow these steps to install this package in your n8n instance:

1. Open your n8n instance
2. Go to **Settings > Community Nodes**
3. Click on **Install Another Node**
4. Enter `n8n-nodes-kiotviet`
5. Click on **Install**

OR

Run the following command in your n8n instance:

```bash
npm install n8n-nodes-kiotviet
```

## Credentials

To use the KiotViet nodes, you need to authenticate with KiotViet API credentials:

1. Get your API credentials from [KiotViet Developer Portal](https://developer.kiotviet.vn)
2. You will need:
   - Client ID
   - Client Secret
   - Retailer Name (your KiotViet store name)

## Nodes

### KiotViet Product Node

Manages products in your KiotViet store.

**Operations:**
- Create Product
- Get Product
- Get Many Products
- Update Product
- Delete Product

### KiotViet Customer Node

Handles customer data in your KiotViet system.

**Operations:**
- Create Customer
- Get Customer
- Get Many Customers
- Update Customer

### KiotViet Order Node

Manages orders in your KiotViet store.

**Operations:**
- Create Order
- Get Order
- Get Many Orders
- Update Order
- Cancel Order

## License

[MIT](LICENSE.md)
