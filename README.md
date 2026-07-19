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
