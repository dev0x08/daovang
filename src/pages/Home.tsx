import { DoorOpen, Gem, Pickaxe, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Home(){
 const{profile}=useAuth();
 return <section className="gateway-home">
  <div className="gateway-noise"/>
  <div className="gateway-light"/>
  <div className="gateway-copy">
   <span className="gateway-eyebrow"><Sparkles/> BOARD GAME CHIẾN THUẬT ẨN VAI TRÒ</span>
   <h1>BÍ ẨN<br/><em>ĐÀO VÀNG</em></h1>
   <p>Đào sâu vào lòng núi, nối đường tới kho báu và tìm ra những con Sói đang trà trộn giữa đội thợ mỏ.</p>
   <Link className="gateway-enter" to={profile?'/room':'/login'}><Pickaxe/><span>LỐI VÀO HẦM</span><DoorOpen/></Link>
   <div className="gateway-facts"><span><b>12×5</b> BÀN HẦM</span><i/><span><b>6–8</b> NGƯỜI</span><i/><span><b>2</b> PHE</span></div>
  </div>
  <div className="gateway-mine" aria-hidden="true"><div className="gateway-moon"/><div className="gateway-ridge ridge-back"/><div className="gateway-ridge ridge-front"/><div className="gateway-door"><span><Gem/></span></div><div className="gateway-tracks"/></div>
 </section>
}
