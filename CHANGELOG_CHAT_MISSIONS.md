# Bản Chat + Nhiệm vụ

## Đã thay đổi
- Xóa hoàn toàn thẻ giao diện "Chế độ kiểm thử / Test hướng đi".
- Thêm chat Firestore thời gian thực trong phòng chờ và trong tab CHAT của trận đấu.
- Tin nhắn tối đa 300 ký tự, chặn gửi nhanh hơn 1 giây/tin.
- Thêm trang `/missions` và liên kết Nhiệm vụ trên thanh điều hướng.
- Thêm nhiệm vụ online, chơi trận, thắng trận, gửi chat, cấp độ, tổng trận thắng, vật phẩm và vàng.
- Tiến độ online chỉ cộng khi tab đang hiển thị, heartbeat mỗi 30 giây.
- Nhận thưởng bằng Firestore transaction để hạn chế nhận trùng.
- Cập nhật `firestore.rules` cho subcollection `rooms/{roomId}/messages`.

## Sau khi triển khai
Chạy lệnh sau để cập nhật Firestore Rules:

```bash
firebase deploy --only firestore:rules
```

Hoặc sao chép nội dung `firestore.rules` vào Firebase Console > Firestore Database > Rules rồi Publish.
