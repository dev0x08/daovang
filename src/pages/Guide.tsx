import {
  Ban, Box, Gem, Hammer, HeartPulse, Pickaxe, RefreshCcw, RotateCcw,
  Route, Search, ShieldPlus, ShieldAlert, Trophy, Users, Layers3
} from 'lucide-react';

const pathCards = [
  ['Đường thẳng', 'Nối hai cạnh đối diện. Có thể xoay ngang hoặc dọc.'],
  ['Khúc cua', 'Nối hai cạnh vuông góc, dùng để đổi hướng đường hầm.'],
  ['Ngã ba', 'Mở ba hướng, giúp tạo nhiều nhánh và giảm nguy cơ bị chặn.'],
  ['Ngã tư', 'Mở cả bốn hướng, là mảnh linh hoạt nhất để mở rộng tuyến.'],
  ['Đường cụt', 'Chỉ mở một hướng. Có thể dùng để đánh lạc hướng hoặc cản tuyến.'],
  ['Hầm sập', 'Trông giống đường thường nhưng không tạo kết nối xuyên qua.'],
];

const actionCards = [
  {icon: Hammer, name:'Phá đường', text:'Loại bỏ một mảnh đường hợp lệ trên bàn. Không phá được chướng ngại hoặc đường đã gia cố.'},
  {icon: ShieldPlus, name:'Gia cố', text:'Bảo vệ một mảnh đường. Mảnh đã gia cố không thể bị phá bằng lá hành động hoặc kỹ năng Sói.'},
  {icon: RotateCcw, name:'Xoay đường', text:'Xoay một mảnh đường đang có trên bàn để thay đổi hướng kết nối.'},
  {icon: Search, name:'Thăm dò', text:'Xem bí mật một trong ba rương. Chỉ người sử dụng biết rương đó thật hay giả.'},
];

const specials = [
  {icon: Ban, name:'Chặn', text:'Chọn một người chơi. Người đó mất lượt kế tiếp. Mỗi người dùng tối đa một lần trong trận.'},
  {icon: HeartPulse, name:'Hồi sinh', text:'Gỡ trạng thái bị chặn cho bản thân hoặc người chơi khác. Mỗi người dùng một lần.'},
  {icon: RefreshCcw, name:'Đổi bài', text:'Chọn một lá của bạn, chọn người chơi khác rồi chọn một lá úp của họ để đổi. Chỉ lá nhận về mới được lật cho bạn xem.'},
  {icon: Hammer, name:'Phá sập hầm', text:'Kỹ năng bí mật chỉ một trong hai Sói sở hữu. Dùng một lần để phá một đoạn đường chưa gia cố mà không lộ danh tính.'},
];

export default function Guide(){
 return <section className="guide-page guide-full">
  <div className="section-heading">
   <span>HƯỚNG DẪN ĐẦY ĐỦ</span>
   <h1>CÁCH CHƠI BÍ ẨN ĐÀO VÀNG</h1>
   <p>Toàn bộ luật trận đấu, vai trò, các loại lá bài, kỹ năng đặc biệt và điều kiện chiến thắng.</p>
  </div>

  <div className="guide-overview">
   <article><Users/><b>6–8 NGƯỜI</b><p>Mỗi trận có người thật, AI hoặc kết hợp cả hai.</p></article>
   <article><ShieldAlert/><b>VAI TRÒ BÍ MẬT</b><p>Thợ đào và Sói không biết chắc đồng đội của mình.</p></article>
   <article><Box/><b>3 RƯƠNG</b><p>Chỉ một rương chứa vàng; hai rương còn lại là giả.</p></article>
   <article><Layers3/><b>6 LÁ TRÊN TAY</b><p>Sau khi dùng hoặc bỏ một lá, người chơi rút bù nếu bộ bài còn.</p></article>
  </div>

  <section className="guide-section">
   <header><Pickaxe/><div><span>01</span><h2>MỤC TIÊU VÀ VAI TRÒ</h2></div></header>
   <div className="guide-two-col">
    <article className="role-guide miner"><h3>THỢ ĐÀO</h3><p>Xây một đường hầm liên tục từ cửa hầm bên trái tới đúng rương vàng. Có thể phối hợp, sửa đường, gia cố và thăm dò rương.</p></article>
    <article className="role-guide wolf"><h3>SÓI</h3><p>Trà trộn vào đội thợ đào, tạo đường sai, dùng đường cụt, phá tuyến và kéo dài trận cho đến khi phe Thợ đào không thể tới vàng.</p></article>
   </div>
   <div className="guide-note"><Gem/><p>Danh tính, số Sói và người giữ kỹ năng phá sập hầm đều không được công bố trong nhật ký trận đấu.</p></div>
  </section>

  <section className="guide-section">
   <header><Route/><div><span>02</span><h2>LÁ MẢNH ĐƯỜNG</h2></div></header>
   <p className="guide-intro">Mảnh đường chỉ được đặt vào ô hợp lệ, phải nối đúng cạnh với đường đã có và không được đặt lên chướng ngại.</p>
   <div className="guide-card-grid path-guide-grid">{pathCards.map(([name,text])=><article key={name}><div className="path-mini"><Route/></div><h3>{name}</h3><p>{text}</p></article>)}</div>
  </section>

  <section className="guide-section">
   <header><Hammer/><div><span>03</span><h2>LÁ CHỨC NĂNG</h2></div></header>
   <div className="guide-card-grid">{actionCards.map(({icon:Icon,name,text})=><article key={name}><Icon/><h3>{name}</h3><p>{text}</p></article>)}</div>
  </section>

  <section className="guide-section">
   <header><ShieldAlert/><div><span>04</span><h2>KỸ NĂNG ĐẶC BIỆT</h2></div></header>
   <p className="guide-intro">Kỹ năng đặc biệt không nằm trong bộ bài trên tay và có giới hạn sử dụng riêng trong mỗi trận.</p>
   <div className="guide-card-grid special-guide-grid">{specials.map(({icon:Icon,name,text})=><article key={name}><Icon/><h3>{name}</h3><p>{text}</p></article>)}</div>
  </section>

  <section className="guide-section">
   <header><RefreshCcw/><div><span>05</span><h2>TRÌNH TỰ MỘT LƯỢT</h2></div></header>
   <ol className="turn-steps">
    <li><b>Chọn hành động</b><span>Đặt một mảnh đường, dùng lá chức năng, dùng kỹ năng đặc biệt hoặc bỏ một lá.</span></li>
    <li><b>Chọn mục tiêu</b><span>Chọn ô trên bàn, rương hoặc người chơi phù hợp với lá đang dùng.</span></li>
    <li><b>Kết thúc lượt</b><span>Sau hành động hợp lệ, hệ thống chuyển lượt và rút bù để giữ tối đa 6 lá nếu bộ bài còn.</span></li>
    <li><b>AI hành động</b><span>AI suy nghĩ, đánh giá vai trò, tuyến đường, trạng thái người chơi và các kỹ năng còn lại trước khi đi.</span></li>
   </ol>
  </section>

  <section className="guide-section">
   <header><Trophy/><div><span>06</span><h2>KẾT THÚC TRẬN VÀ EXP</h2></div></header>
   <div className="guide-two-col">
    <article><h3>THỢ ĐÀO THẮNG</h3><p>Một tuyến đường hợp lệ nối từ cửa hầm tới rương vàng thật.</p></article>
    <article><h3>SÓI THẮNG</h3><p>Thợ đào không thể tìm được vàng trước khi trận kết thúc hoặc tài nguyên cần thiết đã cạn.</p></article>
   </div>
   <div className="reward-row"><span><b>THẮNG</b> Nhận ngẫu nhiên 48–96 EXP · 65–135 vàng</span><span><b>THUA</b> Nhận ngẫu nhiên 20–52 EXP · 24–68 vàng</span></div><p>Khoản thưởng cụ thể được quay một lần khi trận kết thúc; điểm đóng góp có thể cộng thêm tối đa 10 EXP và 10 vàng. Thoát giữa trận không nhận thưởng.</p>
  </section>
 </section>
}
