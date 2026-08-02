import {
  Ban, Box, Gem, Hammer, HeartPulse, Pickaxe, RefreshCcw, RotateCcw,
  Route, Search, ShieldAlert, Users, Layers3, Compass, Swords
} from 'lucide-react';
import GameEmblem from '../components/GameEmblem';
import PathTileIcon from '../components/PathTileIcon';
import { ACTION_CARD_TOTAL, DECK_COUNTS, DECK_TOTAL, PATH_CARD_TOTAL } from '../lib/game';

const pathCards = [
  {kind:'horizontal' as const,name:'Đường ngang',edges:'Mở: trái + phải',text:'Nối đường hầm theo chiều ngang. Cạnh trên và dưới đóng, nên chỉ đặt cạnh các lá kề có hai cạnh tương ứng cũng đóng.'},
  {kind:'vertical' as const,name:'Đường dọc',edges:'Mở: trên + dưới',text:'Nối đường hầm theo chiều dọc. Cạnh trái và phải đóng.'},
  {kind:'cornerNE' as const,name:'Góc trên phải',edges:'Mở: dưới + trái',text:'Tên lá mô tả phần góc nằm ở phía trên phải; lối hầm thực tế mở xuống dưới và sang trái.'},
  {kind:'cornerNW' as const,name:'Góc trên trái',edges:'Mở: dưới + phải',text:'Đổi hướng giữa cạnh dưới và cạnh phải.'},
  {kind:'cornerSE' as const,name:'Góc dưới phải',edges:'Mở: trên + trái',text:'Đổi hướng giữa cạnh trên và cạnh trái.'},
  {kind:'cornerSW' as const,name:'Góc dưới trái',edges:'Mở: trên + phải',text:'Đổi hướng giữa cạnh trên và cạnh phải.'},
  {kind:'teeUp' as const,name:'Ngã ba lên',edges:'Mở: trái + phải + trên',text:'Tạo nhánh đi lên từ một tuyến ngang. Chỉ cạnh dưới bị đóng.'},
  {kind:'teeDown' as const,name:'Ngã ba xuống',edges:'Mở: trái + phải + dưới',text:'Tạo nhánh đi xuống từ một tuyến ngang. Chỉ cạnh trên bị đóng.'},
  {kind:'teeLeft' as const,name:'Ngã ba trái',edges:'Mở: trên + dưới + trái',text:'Tạo nhánh sang trái từ một tuyến dọc. Chỉ cạnh phải bị đóng.'},
  {kind:'teeRight' as const,name:'Ngã ba phải',edges:'Mở: trên + dưới + phải',text:'Tạo nhánh sang phải từ một tuyến dọc. Chỉ cạnh trái bị đóng.'},
  {kind:'cross' as const,name:'Ngã tư',edges:'Mở: cả bốn cạnh',text:'Cho phép đi theo mọi hướng. Đây là mảnh linh hoạt nhất để nối hoặc mở rộng nhiều nhánh.'},
  {kind:'crossDead' as const,name:'Ngã tư cụt',edges:'Mở bốn cạnh · cụt ở tâm',text:'Bốn lối vào đều dừng trước tâm và không nối với nhau. Có 2 lá trong bộ bài.'},
  {kind:'cornerNWDead' as const,name:'Góc trên trái cụt',edges:'Nối được: cạnh dưới · cụt trước cạnh phải',text:'Đường đi vào từ cạnh dưới, rẽ sang phải rồi dừng trong lá nên không thể nối tiếp. Có 2 lá trong bộ bài.'},
  {kind:'cornerSEDead' as const,name:'Góc dưới phải cụt',edges:'Nối được: cạnh trên · cụt trước cạnh trái',text:'Đường đi vào từ cạnh trên, rẽ sang trái rồi dừng trong lá nên không thể nối tiếp. Có 2 lá trong bộ bài.'},
  {kind:'cornerSWDead' as const,name:'Góc dưới trái cụt',edges:'Nối được: cạnh trên · cụt trước cạnh phải',text:'Đường đi vào từ cạnh trên, rẽ sang phải rồi dừng trong lá nên không thể nối tiếp. Có 2 lá trong bộ bài.'},
  {kind:'collapse' as const,name:'Sập hầm',edges:'Mở: một cạnh theo hướng lá',text:'Là đường cụt chỉ có một lối vào. Có thể xoay bằng lá Xoay đường; thường được Sói dùng để chặn hoặc đánh lạc hướng.'},
];
const actionCards=[
 {icon:Hammer,name:'Phá đường',count:DECK_COUNTS.delete,text:'Loại bỏ một mảnh đường đã được đặt trên bản đồ.'},
 {icon:HeartPulse,name:'Hồi sinh',count:DECK_COUNTS.revive,text:'Gỡ trạng thái Chặn vĩnh viễn cho một người chơi khác.'},
 {icon:Search,name:'Thăm dò rương',count:DECK_COUNTS.scout,text:'Chọn và xem bí mật một trong ba rương. Mỗi trận có đúng 1 kho báu thật ở vị trí ngẫu nhiên và 2 rương giả.'},
 {icon:Ban,name:'Chặn',count:DECK_COUNTS.block,text:'Khiến một người chơi mất lượt kế tiếp.'},
];
const pathCounts=[DECK_COUNTS.h,DECK_COUNTS.v,DECK_COUNTS.ne,DECK_COUNTS.nw,DECK_COUNTS.se,DECK_COUNTS.sw,DECK_COUNTS.tUp,DECK_COUNTS.tDown,DECK_COUNTS.tLeft,DECK_COUNTS.tRight,DECK_COUNTS.cross,DECK_COUNTS.crossDead,DECK_COUNTS.nwDead,DECK_COUNTS.seDead,DECK_COUNTS.swDead,DECK_COUNTS.collapse];
const specials=[
 {icon:Hammer,name:'Phá sập hầm',text:'Chọn một mảnh làm tâm và phá cả các mảnh kề trên, dưới, trái, phải — tối đa 5 mảnh. Kỹ năng dùng một lần và không lộ danh tính Sói.'},
];
export default function Guide(){return <section className="guide-page guide-full ui-v2-page app-page">
 <div className="section-heading"><span>HƯỚNG DẪN ĐẦY ĐỦ</span><h1>CÁCH CHƠI BÍ ẨN ĐÀO VÀNG</h1><p>Toàn bộ luật trận đấu, vai trò, các loại lá bài, kỹ năng đặc biệt và điều kiện chiến thắng.</p></div>
 <div className="guide-overview">
  <article><GameEmblem icon={Users}/><b>6–8 NGƯỜI</b><p>Mỗi trận có người thật, AI hoặc kết hợp cả hai.</p></article>
  <article><GameEmblem icon={ShieldAlert} tone="red"/><b>VAI TRÒ BÍ MẬT</b><p>Thợ đào và Sói không biết chắc đồng đội của mình.</p></article>
  <article><GameEmblem icon={Box} tone="emerald"/><b>3 RƯƠNG</b><p>Chỉ một rương chứa vàng; hai rương còn lại là giả.</p></article>
  <article><GameEmblem icon={Layers3} tone="violet"/><b>6 LÁ TRÊN TAY</b><p>Sau khi dùng hoặc bỏ một lá, người chơi rút bù nếu bộ bài còn.</p></article>
 </div>
 <section className="guide-section guide-role-section"><header><GameEmblem icon={Pickaxe} size="sm"/><div><span>01</span><h2>MỤC TIÊU VÀ VAI TRÒ</h2></div></header><div className="guide-two-col"><article className="role-guide miner"><GameEmblem icon={Compass} tone="emerald"/><h3>THỢ ĐÀO</h3><p>Nối cửa hầm tới đúng rương vàng bằng một tuyến đường hợp lệ.</p></article><article className="role-guide wolf"><GameEmblem icon={Swords} tone="red"/><h3>SÓI</h3><p>Đánh lạc hướng và ngăn Thợ đào tìm vàng. Một Sói được bí mật dùng <b>Phá sập hầm</b> một lần để phá mảnh đã chọn cùng tối đa 4 mảnh kề cạnh.</p></article></div><div className="guide-note"><Gem/><p>Vai trò và người giữ kỹ năng Phá sập hầm được giữ bí mật.</p></div></section>
 <section className="guide-section"><header><GameEmblem icon={Route} size="sm"/><div><span>02</span><h2>LÁ MẢNH ĐƯỜNG · {PATH_CARD_TOTAL} LÁ</h2></div></header><div className="guide-card-grid path-guide-grid">{pathCards.map((x,index)=><article key={x.name}><span className="guide-card-count">×{pathCounts[index]}</span><PathTileIcon kind={x.kind}/><h3>{x.name}</h3><strong className="guide-card-edges">{x.edges}</strong><p>{x.text}</p></article>)}</div></section>
 <section className="guide-section"><header><GameEmblem icon={Hammer} size="sm"/><div><span>03</span><h2>LÁ CHỨC NĂNG · {ACTION_CARD_TOTAL} LÁ</h2></div></header><div className="guide-card-grid">{actionCards.map(({icon,name,count,text})=><article key={name}><span className="guide-card-count">×{count}</span><GameEmblem icon={icon}/><h3>{name}</h3><p>{text}</p></article>)}</div></section>
 </section>}
