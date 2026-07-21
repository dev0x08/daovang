# Security & anti-cheat audit

## Đã sửa trong bản này

- Dùng `crypto.getRandomValues`/`crypto.randomUUID` cho mã phòng, bot và ID thay cho `Math.random` ở các định danh quan trọng.
- Giới hạn phòng đúng 6 người và kiểm tra lại bằng Firestore transaction trước khi tham gia, thêm bot, rời phòng hoặc bắt đầu.
- Chặn race condition làm vượt số người, mất người hoặc ghi đè danh sách người chơi.
- Chặn vào thẳng `/game` bằng URL khi tài khoản không thuộc phòng hoặc phòng chưa bắt đầu.
- Siết Firestore Rules cho schema phòng, chủ phòng, số người, chat, hồ sơ và completed match.
- Giới hạn dữ liệu hồ sơ và phần thưởng ở cả client lẫn Firestore Rules; từ chối số âm, NaN, số quá lớn và cấu trúc không hợp lệ.
- Chặn thăm dò cùng một rương nhiều lần bằng cùng người chơi.
- Chặn dùng Hồi sinh lên chính mình.
- Sửa AI hết bài bị kẹt lượt vô hạn.
- Chuẩn hóa và giới hạn tên phòng/tên hiển thị/URL ảnh/tin nhắn.
- Giữ chống nhận lại cùng một `matchId` bằng document bất biến trong `completedMatches`.

## Giới hạn kiến trúc còn lại

Gameplay hiện vẫn chạy ở client. Người sửa JavaScript trong trình duyệt vẫn có thể giả kết quả trận hoặc tạo match ID mới. Firestore Rules và transaction chỉ giảm gian lận phổ biến, không thể chứng minh từng nước đi là hợp lệ.

Để chống cheat ở mức production, cần chuyển các phần sau sang server-authoritative (Cloud Functions/Cloud Run):

1. Tạo deck, vai trò, kho báu và seed ở server.
2. Lưu state trận trên server; client chỉ gửi action.
3. Server xác minh đúng lượt, lá bài đang sở hữu, vị trí hợp lệ và cập nhật state bằng transaction.
4. Server tự kết luận thắng/thua và tự cộng thưởng; client không được gửi reward hoặc winner.
5. Bật Firebase App Check và rate limiting ở backend.

Không nên quảng bá bản hiện tại là “anti-cheat tuyệt đối” cho tới khi hoàn thành server-authoritative gameplay.
