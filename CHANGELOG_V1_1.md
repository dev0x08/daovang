# Bản cập nhật v1.1

- Thêm trang Lịch sử với 20 trận gần nhất.
- Ghi kết quả, vai trò, số lượt, thời lượng, đối thủ và phần thưởng bằng transaction khi trận kết thúc.
- Giữ hệ thống Thành tựu trong trang Nhiệm vụ và cơ chế nhận thưởng một lần.
- Thêm skin bàn cờ Hang Băng, Hầm Núi Lửa.
- Thêm skin quân cờ Hoàng Kim, Pha Lê.
- Thêm chỉ báo ping ở góc điều khiển trận, cập nhật mỗi 10 giây.
- Thêm báo cáo người chơi và giới hạn một báo cáo cho cùng người/trận bằng document ID cố định.
- Cập nhật Firestore Rules cho lịch sử và báo cáo.
- Build production đã kiểm tra thành công.

## Lưu ý triển khai

Chạy `firebase deploy --only firestore:rules` sau khi cập nhật source.
Lịch sử chỉ xuất hiện với các trận hoàn thành sau khi dùng bản v1.1.
