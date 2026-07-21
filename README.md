# Bí Ẩn Đào Vàng Online — V20

## Sửa logic hướng ở mép bản đồ

- Các nhánh đường hướng vào mép bàn được xem là kết thúc tại vách đá, không làm mảnh mất hợp lệ.
- Ví dụ từ **Góc dưới trái** ở cột A có thể nối xuống bằng **Ngã ba lên, Ngã ba trái, Ngã tư hoặc Góc trên trái**.
- Mảnh mới vẫn phải nối trực tiếp với mạng đường bắt nguồn từ cửa hầm.
- Các cạnh giữa hai mảnh đã đặt vẫn phải khớp tuyệt đối.
- Phòng test ghi rõ lý do khi một ô không thể đặt.

# Bí Ẩn Đào Vàng Online V9

## Chạy local
1. `npm install`
2. Sao chép `.env.example` thành `.env.local` và điền Firebase Web App config.
3. `npm run dev`

## Firebase
- Authentication > Sign-in method > bật Google.
- Firestore Database > tạo database.
- Firestore Rules > dùng nội dung `firestore.rules`.
- Authentication > Settings > Authorized domains: thêm domain Vercel.

## Chế độ
- Chơi với AI: chọn 6–8 người.
- Tạo phòng Online: công khai hoặc riêng tư, mã 6 ký tự, thêm AI.
- Tham gia phòng: nhập mã hoặc chọn phòng công khai.

Google Login là bắt buộc cho tất cả chế độ.

## V10 gameplay changes
- Deck expanded to 151 cards for 12x5 matches.
- Every player starts with 6 cards and draws back to 6 by drawing one after each turn.
- Exactly one of three treasures contains gold; the other two are fake.
- AI can use Block, Revive, Swap, Scout, action cards, and the secret sabotage power.
- Exactly one of the two wolves receives one secret Cave Sabotage use per match.
- Room codes are masked by default and hidden from the public room browser.
- Leaving a waiting room removes the player; if the host leaves, the room document is deleted.
- Match results award EXP, coins, wins/losses and update the profile.

## V15 – Logic đường đi, EXP, Shop và bảng xếp hạng
- Logic cạnh đường dùng cùng một nguồn `dirs()` cho cả hiển thị, đặt bài, xoay bài và kiểm tra kết nối.
- Mọi cạnh tiếp xúc với lá bên cạnh bắt buộc khớp hai chiều; cạnh mở ra ngoài bàn chỉ hợp lệ tại cửa hầm hoặc vị trí rương.
- Phần thưởng chỉ cấp khi trận có kết quả. Mỗi `matchId` chỉ được nhận thưởng một lần qua Firestore transaction.
- Phần thưởng được random có kiểm soát sau khi trận kết thúc. Phe thắng nhận khoảng 48–96 EXP và 65–135 vàng; phe thua nhận khoảng 20–52 EXP và 24–68 vàng (đã gồm tối đa 10 điểm thưởng đóng góp).
- Shop chỉ bán khung avatar, màu tên, danh hiệu và huy hiệu; không ảnh hưởng gameplay.
- Bảng xếp hạng lấy trực tiếp từ collection `users`, sắp xếp theo EXP.
- Cần deploy lại `firestore.rules` để bật completedMatches.

## V21 - Sửa ánh xạ góc
- Góc trên phải: mở xuống + trái.
- Góc trên trái: mở xuống + phải.
- Góc dưới phải: mở lên + trái.
- Góc dưới trái: mở lên + phải.
- Ngã ba trái giờ ghép đúng với Góc dưới phải, Ngã ba phải và Đường dọc khi đặt ở phía dưới.

## V22 – Lobby phòng công khai và riêng tư
- Trang `/room` được làm lại thành lobby dạng bảng rộng.
- Phòng công khai không có mật khẩu và có thể tham gia ngay.
- Phòng riêng tư bắt buộc mật khẩu tối thiểu 4 ký tự; mật khẩu được băm SHA-256 trước khi lưu.
- Danh sách hiển thị tên phòng, chủ phòng, loại phòng, số người, trạng thái và nút tham gia.
- Mã phòng luôn được ẩn trong danh sách lobby.
- `/room?create=1` mở hộp thiết lập thay vì tự tạo phòng ngay.
- Nhập mã phòng riêng tư sẽ mở hộp yêu cầu mật khẩu.

## V23 — Hiệu ứng danh tính người chơi
- Khung avatar, màu tên, nền bảng tên, danh hiệu, huy hiệu và rank hiển thị đồng bộ trong lobby, phòng chờ, danh sách người chơi trong trận và bảng xếp hạng.
- Thêm nhóm vật phẩm `nameplate` trong shop, chỉ mang tính trang trí.
- Người tạo/tham gia phòng gửi snapshot trang bị vào dữ liệu room để các người chơi khác nhìn thấy hiệu ứng.
