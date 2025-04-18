![Banner image](https://user-images.githubusercontent.com/10284570/173569848-c624317f-42b1-45a6-ab09-f0ea3c247648.png)


![KiotViet](./kiotviet-logo.png)
# N8N nodes KiotViet cho ngành bán lẻ (Retailer)

Đây là một node cộng đồng n8n cho phép bạn sử dụng KiotViet trong quy trình làm việc n8n của mình.

KiotViet là hệ thống quản lý bán lẻ đa kênh, giúp doanh nghiệp quản lý sản phẩm, khách hàng, đơn hàng và hoá đơn một cách hiệu quả.

[n8n](https://n8n.io/) là nền tảng tự động hóa quy trình công việc được [cấp phép fair-code](https://docs.n8n.io/reference/license/).

## Ủng hộ 1 cốc cà phê 
Nếu bạn thấy gói tích hợp này hữu ích, hãy ủng hộ tác giả 1 cốc cà phê nhé!
Cám ơn các bạn đã ủng hộ!
```
BIEN NGO HUY PHONG
TECHCOMBANK
```
<img src="bank.jpg" height="350" />

## Mục lục

[Cài đặt](#cài-đặt)  
[Chức năng](#chức-năng)  
[Xác thực](#xác-thực)  
[Tương thích](#tương-thích)  
[Tài nguyên](#tài-nguyên)

## Cài đặt

Làm theo [hướng dẫn cài đặt](https://docs.n8n.io/integrations/community-nodes/installation/) trong tài liệu node cộng đồng n8n.

## Chức năng

Gói tích hợp này cung cấp các node sau:

### KiotViet Product

- Quản lý danh sách sản phẩm
- Tạo mới sản phẩm
- Cập nhật thông tin sản phẩm
- Xóa sản phẩm
- Tìm kiếm sản phẩm

### KiotViet Customer

- Quản lý danh sách khách hàng
- Tạo mới khách hàng
- Cập nhật thông tin khách hàng
- Xóa khách hàng
- Tìm kiếm khách hàng

### KiotViet Order

- Quản lý danh sách đơn hàng
- Tạo mới đơn hàng
- Cập nhật trạng thái đơn hàng
- Xóa đơn hàng
- Tìm kiếm đơn hàng

### KiotViet Invoice

- Quản lý danh sách hóa đơn
- Tạo mới hóa đơn
- Cập nhật thông tin hóa đơn
- Xóa hóa đơn
- Tìm kiếm hóa đơn

### KiotViet Category

- Quản lý danh sách danh mục
- Tạo mới danh mục 
- Cập nhật thông tin danh mục
- Xóa danh mục
- Tìm kiếm danh mục

### KiotViet Trigger

- Nhận thông báo khi có sự kiện từ KiotViet
- Hỗ trợ các sự kiện:
  - Tạo mới đơn hàng
  - Cập nhật trạng thái đơn hàng
  - Tạo mới sản phẩm
  - Cập nhật sản phẩm
  - Xóa sản phẩm

## Xác thực

Để sử dụng các node KiotViet, bạn cần:

1. Có tài khoản KiotViet và đăng ký sử dụng API
2. Lấy Client ID và Client Secret từ KiotViet
3. Thêm thông tin xác thực trong n8n:
   - Client ID
   - Client Secret
   - Retailer
   - API Environment (Sandbox/Production)

## Tương thích

- Yêu cầu n8n phiên bản tối thiểu: v1.0.0
- Node.js v18.10 trở lên
- Đã được thử nghiệm trên n8n v1.0.0

## Tài nguyên

- [Tài liệu KiotVietSDK](https://kiotviet-client-sdk.phonghy.dev/)
- [Tài liệu node cộng đồng n8n](https://docs.n8n.io/integrations/community-nodes/)
- [Tài liệu API KiotViet](https://api.kiotviet.vn/docs)
- [Website KiotViet](https://www.kiotviet.vn)
