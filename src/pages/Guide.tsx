import {
  Ban, Box, Gem, Hammer, HeartPulse, Pickaxe, RefreshCcw, RotateCcw,
  Route, Search, ShieldPlus, ShieldAlert, Trophy, Users, Layers3, Compass, Swords
} from 'lucide-react';
import GameEmblem from '../components/GameEmblem';
import PathTileIcon from '../components/PathTileIcon';

const pathCards = [
  {kind:'straight' as const,name:'Đường thẳng',text:'Nối hai cạnh đối diện. Có thể xoay ngang hoặc dọc.'},
  {kind:'corner' as const,name:'Khúc cua',text:'Nối hai cạnh vuông góc, dùng để đổi hướng đường hầm.'},
  {kind:'tee' as const,name:'Ngã ba',text:'Mở ba hướng, giúp tạo nhiều nhánh và giảm nguy cơ bị chặn.'},
  {kind:'cross' as const,name:'Ngã tư',text:'Mở cả bốn hướng, là mảnh linh hoạt nhất để mở rộng tuyến.'},
  {kind:'deadend' as const,name:'Đường cụt',text:'Chỉ mở một hướng. Dùng để đánh lạc hướng hoặc cản tuyến.'},
  {kind:'collapse' as const,name:'Hầm sập',text:'Trông giống đường thường nhưng không tạo kết nối xuyên qua.'},
];
const actionCards=[
 {icon:Hammer,name:'Phá đường',text:'Loại bỏ một mảnh đường hợp lệ trên bàn. Không phá được chướng ngại hoặc đường đã gia cố.'},
 {icon:ShieldPlus,name:'Gia cố',text:'Bảo vệ một mảnh đường. Mảnh đã gia cố không thể bị phá bằng lá hành động hoặc kỹ năng Sói.'},
 {icon:RotateCcw,name:'Xoay đường',text:'Xoay một mảnh đường đang có trên bàn để thay đổi hướng kết nối.'},
 {icon:Search,name:'Thăm dò',text:'Xem bí mật một trong ba rương. Chỉ người sử dụng biết rương đó thật hay giả.'},
];
const specials=[
 {icon:Ban,name:'Chặn',text:'Chọn một người chơi. Người đó mất lượt kế tiếp. Mỗi người dùng tối đa một lần trong trận.'},
 {icon:HeartPulse,name:'Hồi sinh',text:'Gỡ trạng thái bị chặn cho bản thân hoặc người chơi khác. Mỗi người dùng một lần.'},
 {icon:RefreshCcw,name:'Đổi bài',text:'Chọn một lá của bạn, chọn người chơi khác rồi chọn một lá úp của họ để đổi.'},
 {icon:Hammer,name:'Phá sập hầm',text:'Kỹ năng bí mật chỉ một trong hai Sói sở hữu. Dùng một lần mà không lộ danh tính.'},
];
export default function Guide(){return <section className="guide-page guide-full ui-v2-page">
 <div className="section-heading"><span>HƯỚNG DẪN ĐẦY ĐỦ</span><h1>CÁCH CHƠI BÍ ẨN ĐÀO VÀNG</h1><p>Toàn bộ luật trận đấu, vai trò, các loại lá bài, kỹ năng đặc biệt và điều kiện chiến thắng.</p></div>
 <div className="guide-overview">
  <article><GameEmblem icon={Users}/><b>6–8 NGƯỜI</b><p>Mỗi trận có người thật, AI hoặc kết hợp cả hai.</p></article>
  <article><GameEmblem icon={ShieldAlert} tone="red"/><b>VAI TRÒ BÍ MẬT</b><p>Thợ đào và Sói không biết chắc đồng đội của mình.</p></article>
  <article><GameEmblem icon={Box} tone="emerald"/><b>3 RƯƠNG</b><p>Chỉ một rương chứa vàng; hai rương còn lại là giả.</p></article>
  <article><GameEmblem icon={Layers3} tone="violet"/><b>6 LÁ TRÊN TAY</b><p>Sau khi dùng hoặc bỏ một lá, người chơi rút bù nếu bộ bài còn.</p></article>
 </div>
 <section className="guide-section"><header><GameEmblem icon={Pickaxe} size="sm"/><div><span>01</span><h2>MỤC TIÊU VÀ VAI TRÒ</h2></div></header><div className="guide-two-col"><article className="role-guide miner"><GameEmblem icon={Compass} tone="emerald"/><h3>THỢ ĐÀO</h3><p>Xây một đường hầm liên tục từ cửa hầm bên trái tới đúng rương vàng. Có thể phối hợp, sửa đường, gia cố và thăm dò rương.</p></article><article className="role-guide wolf"><GameEmblem icon={Swords} tone="red"/><h3>SÓI</h3><p>Trà trộn vào đội thợ đào, tạo đường sai, dùng đường cụt, phá tuyến và kéo dài trận.</p></article></div><div className="guide-note"><Gem/><p>Danh tính, số Sói và người giữ kỹ năng phá sập hầm đều không được công bố trong nhật ký trận đấu.</p></div></section>
 <section className="guide-section"><header><GameEmblem icon={Route} size="sm"/><div><span>02</span><h2>LÁ MẢNH ĐƯỜNG</h2></div></header><p className="guide-intro">Mỗi biểu tượng dưới đây mô phỏng chính xác các cạnh mở của mảnh đường khi đặt lên bàn.</p><div className="guide-card-grid path-guide-grid">{pathCards.map(x=><article key={x.name}><PathTileIcon kind={x.kind}/><h3>{x.name}</h3><p>{x.text}</p></article>)}</div></section>
 <section className="guide-section"><header><GameEmblem icon={Hammer} size="sm"/><div><span>03</span><h2>LÁ CHỨC NĂNG</h2></div></header><div className="guide-card-grid">{actionCards.map(({icon,name,text})=><article key={name}><GameEmblem icon={icon}/><h3>{name}</h3><p>{text}</p></article>)}</div></section>
 <section className="guide-section"><header><GameEmblem icon={ShieldAlert} tone="red" size="sm"/><div><span>04</span><h2>KỸ NĂNG ĐẶC BIỆT</h2></div></header><p className="guide-intro">Kỹ năng đặc biệt không nằm trong bộ bài trên tay và có giới hạn sử dụng riêng trong mỗi trận.</p><div className="guide-card-grid special-guide-grid">{specials.map(({icon,name,text})=><article key={name}><GameEmblem icon={icon} tone="red"/><h3>{name}</h3><p>{text}</p></article>)}</div></section>
 <section className="guide-section"><header><GameEmblem icon={RefreshCcw} size="sm"/><div><span>05</span><h2>TRÌNH TỰ MỘT LƯỢT</h2></div></header><ol className="turn-steps"><li><b>Chọn hành động</b><span>Đặt mảnh đường, dùng lá chức năng, dùng kỹ năng hoặc bỏ một lá.</span></li><li><b>Chọn mục tiêu</b><span>Chọn ô, rương hoặc người chơi phù hợp.</span></li><li><b>Kết thúc lượt</b><span>Hệ thống chuyển lượt và rút bù tối đa 6 lá.</span></li><li><b>AI hành động</b><span>AI đánh giá vai trò, tuyến đường và kỹ năng còn lại trước khi đi.</span></li></ol></section>
 <section className="guide-section"><header><GameEmblem icon={Trophy} size="sm"/><div><span>06</span><h2>KẾT THÚC TRẬN VÀ EXP</h2></div></header><div className="guide-two-col"><article><h3>THỢ ĐÀO THẮNG</h3><p>Một tuyến đường hợp lệ nối từ cửa hầm tới rương vàng thật.</p></article><article><h3>SÓI THẮNG</h3><p>Thợ đào không thể tìm được vàng trước khi tài nguyên cần thiết đã cạn.</p></article></div><div className="reward-row"><span><b>THẮNG</b> 48–96 EXP · 65–135 vàng</span><span><b>THUA</b> 20–52 EXP · 24–68 vàng</span></div></section>
 </section>}
