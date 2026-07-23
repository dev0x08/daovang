import { Link, NavLink, Outlet, useLocation } from 'react-router-dom';
import {
  ChevronDown,
  CircleHelp,
  Coins,
  Gift,
  History,
  LogIn,
  LogOut,
  Menu,
  Pickaxe,
  ShoppingBag,
  Trophy,
  UserRound,
  X,
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { cosmeticClass } from '../lib/shop';

export default function Layout() {
  const [open, setOpen] = useState(false);
  const [userOpen, setUserOpen] = useState(false);
  const { profile, logout } = useAuth();
  const location = useLocation();
  const dropdownRef = useRef<HTMLDivElement>(null);
  const isGame = location.pathname === '/game';

  useEffect(() => {
    setOpen(false);
    setUserOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    const onPointerDown = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setUserOpen(false);
      }
    };
    document.addEventListener('mousedown', onPointerDown);
    return () => document.removeEventListener('mousedown', onPointerDown);
  }, []);

  return (
    <div className={`site-shell ${isGame ? 'game-route' : ''}`}>
      {!isGame && (
        <header className="topbar">
          <Link to="/" className="brand" aria-label="Bí Ẩn Đào Vàng">
            <span className="brand-mark"><Pickaxe aria-hidden="true" /></span>
            <span><b>BÍ ẨN</b><small>ĐÀO VÀNG ONLINE</small></span>
          </Link>

          <nav className={open ? 'nav open' : 'nav'}>
            <NavLink to="/">Trang chủ</NavLink>
            <NavLink to="/guide"><CircleHelp size={15} /> Hướng dẫn</NavLink>
            <NavLink to="/leaderboard"><Trophy size={15} /> Xếp hạng</NavLink>
            <NavLink to="/shop"><ShoppingBag size={15} /> Cửa hàng</NavLink>
          </nav>

          <div className="account-area">
            {profile ? (
              <>
                <span className="wallet" data-tooltip="Số vàng hiện có">
                  <Coins size={16} />
                  <b>{profile.coins}</b>
                </span>

                <div className="user-menu" ref={dropdownRef}>
                  <button
                    type="button"
                    className={`user-menu-trigger ${userOpen ? 'is-open' : ''}`}
                    onClick={() => setUserOpen(value => !value)}
                    aria-haspopup="menu"
                    aria-expanded={userOpen}
                  >
                    <span className="avatar">
                      {profile.photoURL ? <img src={profile.photoURL} alt="" /> : <UserRound size={18} />}
                    </span>
                    <span className="user-menu-copy">
                      <b className={cosmeticClass(profile.equipped.nameColor)}>{profile.displayName}</b>
                      <small>{profile.rank}</small>
                    </span>
                    <ChevronDown size={16} className="user-chevron" />
                  </button>

                  {userOpen && (
                    <div className="user-dropdown" role="menu">
                      <div className="user-dropdown-head">
                        <span className="avatar large-menu-avatar">
                          {profile.photoURL ? <img src={profile.photoURL} alt="" /> : <UserRound size={21} />}
                        </span>
                        <span><b className={cosmeticClass(profile.equipped.nameColor)}>{profile.displayName}</b><small>{profile.rank}</small></span>
                      </div>
                      <div className="user-dropdown-links">
                        <Link to="/profile" role="menuitem"><UserRound size={17} /><span><b>Hồ sơ</b><small>Thông tin và thành tích</small></span></Link>
                        <Link to="/missions" role="menuitem"><Gift size={17} /><span><b>Nhiệm vụ</b><small>Nhận thưởng mỗi ngày</small></span></Link>
                        <Link to="/history" role="menuitem"><History size={17} /><span><b>Lịch sử</b><small>Xem lại các trận đấu</small></span></Link>
                      </div>
                      <button type="button" className="user-logout" onClick={logout} role="menuitem">
                        <LogOut size={17} /> Đăng xuất
                      </button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <Link className="btn btn-small" to="/login"><LogIn size={17} /> Đăng nhập Google</Link>
            )}

            <button className="menu-btn" onClick={() => setOpen(!open)} aria-label="Mở menu">
              {open ? <X /> : <Menu />}
            </button>
          </div>
        </header>
      )}

      <main><Outlet /></main>

      {!isGame && (
        <footer>
          <div className="brand footer-brand">
            <span className="brand-mark"><Pickaxe aria-hidden="true" /></span>
            <span><b>BÍ ẨN ĐÀO VÀNG</b><small>Board game chiến thuật Việt Nam</small></span>
          </div>
          <p>Dự án game cộng đồng · Phiên bản Firebase/Vercel</p>
          <div><Link to="/guide">Luật chơi</Link><Link to="/leaderboard"><Trophy size={14} /> Xếp hạng</Link></div>
        </footer>
      )}
    </div>
  );
}
