import { useState } from 'react';
import { Award, BadgeCheck, Coins, Crown, Gauge, PackageOpen, Pickaxe, ShieldAlert, Swords, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { expForLevel, levelFromExp } from '../lib/progression';
import { MISSIONS } from '../lib/missions';
import { itemById, SHOP_ITEMS, ShopCategory } from '../lib/shop';

const categoryName:Record<ShopCategory,string>={frame:'Khung hồ sơ',nameColor:'Màu tên',nameplate:'Nền bảng tên',title:'Danh xưng',badge:'Huy hiệu',boardSkin:'Skin bàn cờ',pieceSkin:'Skin quân cờ'};

export default function Profile(){
 const{profile,login,equipItem,unequipItem}=useAuth();const[msg,setMsg]=useState('');
 if(!profile)return <section className="center-page"><button className="btn btn-primary" onClick={login}>ĐĂNG NHẬP GOOGLE</button></section>;
 const total=profile.wins+profile.losses,level=levelFromExp(profile.exp),start=expForLevel(level),end=expForLevel(level+1),progress=Math.round((profile.exp-start)/Math.max(1,end-start)*100),title=itemById(profile.equipped.title)?.name;
 const ownedItems=SHOP_ITEMS.filter(item=>profile.ownedItems.includes(item.id));
 const achievements=MISSIONS.filter(mission=>(mission.kind==='basic'||mission.kind==='progression')&&profile.claimedAchievements.includes(mission.id));
 const act=async(action:()=>Promise<void>,message:string)=>{try{await action();setMsg(message)}catch(error:any){setMsg(error?.message||'Không thể cập nhật tủ đồ.')}};
 return <section className="profile-page">
  <div className="profile-banner"><div className="large-avatar">{profile.photoURL?<img src={profile.photoURL} alt=""/>:<Pickaxe/>}</div><div><span>HỒ SƠ THỢ MỎ</span><h1>{profile.displayName}</h1><p>{title||profile.rank} · Level {level}</p><div className="profile-exp"><i style={{width:`${Math.max(0,Math.min(100,progress))}%`}}/><span>{profile.exp-start}/{end-start} EXP tới cấp {level+1}</span></div></div><div className="profile-currency"><Coins/><b>{profile.coins}</b><span>VÀNG</span></div></div>
  {msg&&<button className="profile-message" onClick={()=>setMsg('')}>{msg}<X/></button>}
  <div className="profile-grid"><div className="panel stats-panel"><header><Gauge/> THỐNG KÊ SỰ NGHIỆP</header><div className="stat-grid"><div><Swords/><b>{total}</b><span>Tổng trận</span></div><div><Crown/><b>{profile.wins}</b><span>Chiến thắng</span></div><div><ShieldAlert/><b>{total?Math.round(profile.wins/total*100):0}%</b><span>Tỷ lệ thắng</span></div><div><Pickaxe/><b>{profile.exp}</b><span>EXP</span></div></div></div>
   <div className="panel achievements"><header><Award/> DANH HIỆU ĐÃ MỞ KHÓA</header>{achievements.length?<div className="badge-list">{achievements.map(mission=><span key={mission.id}><BadgeCheck aria-hidden="true"/><b>{mission.title}</b><small>{mission.description}</small></span>)}</div>:<div className="profile-empty"><Award/><b>Chưa có danh hiệu</b><span>Hoàn thành và nhận thưởng nhiệm vụ Cơ bản hoặc Lên cấp để mở khóa.</span></div>}</div>
  </div>
  <section className="panel profile-inventory"><header><PackageOpen/> TỦ ĐỒ <small>{ownedItems.length} vật phẩm sở hữu</small></header>{ownedItems.length?<div className="inventory-grid">{ownedItems.map(item=>{const equipped=profile.equipped[item.category]===item.id;return <article className={equipped?'equipped':''} key={item.id}><div className="inventory-preview">{item.preview}</div><div><small>{categoryName[item.category]}</small><b>{item.name}</b><span>{item.description}</span></div><button className={`btn ${equipped?'btn-danger':'btn-ghost'}`} onClick={()=>void act(()=>equipped?unequipItem(item.category):equipItem(item.id),equipped?'Đã tháo vật phẩm.':'Đã trang bị vật phẩm.')}>{equipped?'THÁO':profile.equipped[item.category]?'ĐỔI':'TRANG BỊ'}</button></article>})}</div>:<div className="profile-empty"><PackageOpen/><b>Tủ đồ đang trống</b><span>Vật phẩm mua trong Cửa hàng sẽ xuất hiện tại đây.</span></div>}</section>
 </section>
}
