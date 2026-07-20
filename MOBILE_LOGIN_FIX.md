# Sửa đăng nhập trên điện thoại

## Thay đổi trong code
- Dùng Google popup trước trên cả desktop và mobile.
- Chỉ fallback sang redirect khi trình duyệt thật sự chặn popup.
- Chờ thiết lập Firebase persistence trước khi bắt đầu đăng nhập.
- Fallback từ local persistence sang session persistence trên Safari/iOS.
- Hiển thị thông báo rõ cho unauthorized-domain, storage và network errors.

## Cấu hình Firebase bắt buộc
Trong Firebase Console > Authentication > Settings > Authorized domains, thêm toàn bộ domain đang chạy game, ví dụ:
- localhost
- ten-du-an.vercel.app
- domain-rieng.com

Trong Authentication > Sign-in method, bật Google.

`VITE_FIREBASE_AUTH_DOMAIN` nên giữ giá trị Firebase cấp, thường là:
`<project-id>.firebaseapp.com`

Nếu dùng signInWithRedirect trên domain không phải Firebase Hosting, Safari/Chrome có thể chặn cross-origin storage. Bản này ưu tiên popup để tránh vấn đề đó.
