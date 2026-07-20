import { Link, NavLink, Outlet, useLocation } from 'react-router-dom';
import { Coins, Gift, LogIn, LogOut, Menu, Pickaxe, Trophy, UserRound, X } from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
export default function Layout(){
 const[open,setOpen]=useState(false);const{profile,logout}=useAuth();const location=useLocation();const isGame=location.pathname==='/game';
 return <div className={`site-shell ${isGame?'game-route':''}`}>
  {!isGame&&<header className="topbar"><Link to="/" className="brand"><span className="brand-mark"><Pickaxe aria-hidden="true"/></span><span><b>BÍ ẨN</b><small>ĐÀO VÀNG ONLINE</small></span></Link><nav className={open?'nav open':'nav'}><NavLink to="/">Trang chủ</NavLink><NavLink to="/guide">Hướng dẫn</NavLink><NavLink to="/leaderboard">Bảng xếp hạng</NavLink><NavLink to="/shop">Cửa hàng</NavLink><NavLink to="/missions"><Gift size={15}/> Nhiệm vụ</NavLink><NavLink to="/history">Lịch sử</NavLink><NavLink to="/profile">Hồ sơ</NavLink></nav><div className="account-area">{profile?<><span className="wallet"><Coins size={16}/>{profile.coins}</span><Link to="/profile" className="mini-profile"><span className="avatar">{profile.photoURL?<img src={profile.photoURL}/>:<UserRound size={18}/>}</span><span>{profile.displayName}<small>{profile.rank}</small></span></Link><button className="icon-btn" onClick={logout} title="Đăng xuất"><LogOut size={18}/></button></>:<Link className="btn btn-small" to="/login"><LogIn size={17}/> Đăng nhập Google</Link>}<button className="menu-btn" onClick={()=>setOpen(!open)}>{open?<X/>:<Menu/>}</button></div></header>}
  <main><Outlet/></main>
  {!isGame&&<footer><div className="brand footer-brand"><span className="brand-mark"><Pickaxe aria-hidden="true"/></span><span><b>BÍ ẨN ĐÀO VÀNG</b><small>Board game chiến thuật Việt Nam</small></span></div><p>Dự án game cộng đồng · Phiên bản Firebase/Vercel</p><div><Link to="/guide">Luật chơi</Link><Link to="/leaderboard"><Trophy size={14}/> Xếp hạng</Link></div></footer>}
 </div>
}
