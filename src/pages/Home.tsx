import { ArrowRight, Grid3X3, Pickaxe, Shield, Users } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Home() {
  const { profile } = useAuth();
  return (
    <main className="landing-page app-page app-page-full">
      <section className="landing-shell">
        <div className="landing-copy">
          <span className="landing-kicker"><Pickaxe /> BOARD GAME CHIẾN THUẬT ẨN VAI TRÒ</span>
          <h1>BÍ ẨN<br/><em>ĐÀO VÀNG</em></h1>
          <p>Đào đường tới kho báu, phối hợp cùng đồng đội và tìm ra Sói đang ẩn mình giữa đoàn thợ mỏ.</p>
          <div className="landing-actions">
            <Link className="landing-primary" to={profile ? '/room' : '/login'}>
              <Pickaxe /><span>{profile ? 'VÀO PHÒNG CHỜ' : 'BẮT ĐẦU CHƠI'}</span><ArrowRight />
            </Link>
            <Link className="landing-secondary" to="/guide">XEM HƯỚNG DẪN</Link>
          </div>
        </div>

        <aside className="landing-brief" aria-label="Thông tin trận đấu">
          <header><span>MISSION BRIEF</span><b>01</b></header>
          <div><Grid3X3 /><span><small>BẢN ĐỒ</small><b>12 × 5 Ô</b></span></div>
          <div><Users /><span><small>ĐỘI HÌNH</small><b>6–8 NGƯỜI</b></span></div>
          <div><Shield /><span><small>PHE CHIẾN</small><b>THỢ MỎ / SÓI</b></span></div>
          <footer><i/><span>SẴN SÀNG KẾT NỐI</span></footer>
        </aside>
      </section>
    </main>
  );
}
