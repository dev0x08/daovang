import { useEffect, useState } from 'react';
import { Award, BadgeCheck, Check, Coins, Crown, Gauge, PackageOpen, Pickaxe, ShieldAlert, Swords, UserMinus, UserPlus, X } from 'lucide-react';
import { doc, getDoc } from 'firebase/firestore';
import { useParams } from 'react-router-dom';
import { Profile as ProfileData, useAuth } from '../context/AuthContext';
import { db } from '../lib/firebase';
import { expForLevel, levelFromExp, rankFromPoints } from '../lib/progression';
import { MISSIONS } from '../lib/missions';
import { cosmeticClass, itemById, SHOP_ITEMS, ShopCategory } from '../lib/shop';
import { acceptFriendRequest, cancelFriendRequest, friendshipStatus, FriendshipStatus, removeFriend, sendFriendRequest, summaryOf } from '../lib/friends';

const categoryName:Record<ShopCategory,string>={frame:'Khung hồ sơ',nameColor:'Màu tên',nameplate:'Nền bảng tên',title:'Danh xưng',badge:'Huy hiệu',boardSkin:'Skin bàn cờ',pieceSkin:'Skin quân cờ'};
const publicProfile=(uid:string,data:Record<string,unknown>):ProfileData=>{
 const number=(key:string)=>Math.max(0,Number(data[key]||0));
 const rankPoints=number('rankPoints');
 return{uid,displayName:String(data.displayName||'Người chơi'),email:'',photoURL:String(data.photoURL||''),rank:rankFromPoints(rankPoints).name,rankPoints,exp:number('exp'),coins:0,wins:number('wins'),losses:number('losses'),gamesPlayed:number('gamesPlayed'),ownedItems:[],equipped:data.equipped&&typeof data.equipped==='object'?data.equipped as ProfileData['equipped']:{},missionDate:'',onlineSecondsToday:0,dailyGames:0,dailyWins:0,dailyChats:0,weekDate:'',weeklyGames:0,weeklyWins:0,weeklyChats:0,claimedDailyMissions:[],claimedWeeklyMissions:[],claimedAchievements:Array.isArray(data.claimedAchievements)?data.claimedAchievements.filter((id):id is string=>typeof id==='string'):[]};
};

export default function Profile(){
 const{uid}=useParams();const{profile,login,equipItem,unequipItem}=useAuth();const[msg,setMsg]=useState('');const[remote,setRemote]=useState<ProfileData|null>(null);const[loading,setLoading]=useState(false);const[notFound,setNotFound]=useState(false);const[relation,setRelation]=useState<FriendshipStatus>('none');
 const ownProfile=!uid||uid===profile?.uid;
 useEffect(()=>{if(ownProfile){setRemote(null);setNotFound(false);return}if(!uid||!db)return;let active=true;setLoading(true);setNotFound(false);void getDoc(doc(db,'users',uid)).then(snapshot=>{if(!active)return;if(!snapshot.exists()){setNotFound(true);setRemote(null)}else setRemote(publicProfile(snapshot.id,snapshot.data()))}).catch(()=>{if(active)setNotFound(true)}).finally(()=>{if(active)setLoading(false)});return()=>{active=false}},[uid,ownProfile]);
 useEffect(()=>{if(!profile||!uid||ownProfile){setRelation('none');return}let active=true;void friendshipStatus(profile.uid,uid).then(status=>{if(active)setRelation(status)});return()=>{active=false}},[profile?.uid,uid,ownProfile]);
 if(!profile)return <section className="center-page"><button className="btn btn-primary" onClick={login}>ĐĂNG NHẬP GOOGLE</button></section>;
 if(loading)return <section className="center-page"><div className="auth-card"><Pickaxe className="spin-slow"/><h1>ĐANG TẢI HỒ SƠ</h1></div></section>;
 if(notFound||(!ownProfile&&!remote))return <section className="center-page"><div className="auth-card"><ShieldAlert/><h1>KHÔNG TÌM THẤY HỒ SƠ</h1><p>Người chơi này không tồn tại hoặc hồ sơ không còn khả dụng.</p></div></section>;
 const viewed=ownProfile?profile:remote!;
 const total=viewed.wins+viewed.losses,level=levelFromExp(viewed.exp),start=expForLevel(level),end=expForLevel(level+1),progress=Math.round((viewed.exp-start)/Math.max(1,end-start)*100),title=itemById(viewed.equipped.title)?.name;
 const ownedItems=ownProfile?SHOP_ITEMS.filter(item=>viewed.ownedItems.includes(item.id)):[];
 const equippedItems=Object.values(viewed.equipped).map(id=>itemById(id)).filter((item):item is NonNullable<ReturnType<typeof itemById>>=>Boolean(item));
 const achievements=MISSIONS.filter(mission=>(mission.kind==='basic'||mission.kind==='progression')&&viewed.claimedAchievements.includes(mission.id));
 const act=async(action:()=>Promise<void>,message:string)=>{try{await action();setMsg(message)}catch(error:any){setMsg(error?.message||'Không thể cập nhật tủ đồ.')}};
 const social=async(action:()=>Promise<void>,next:FriendshipStatus,message:string)=>{try{await action();setRelation(next);setMsg(message)}catch(error:any){setMsg(error?.message||'Không thể cập nhật quan hệ bạn bè.')}};
 return <section className={`profile-page ${ownProfile?'is-own-profile':'is-public-profile'}`}>
  <div className={`profile-banner ${cosmeticClass(viewed.equipped.nameplate)}`}><div className={`large-avatar ${cosmeticClass(viewed.equipped.frame)}`}>{viewed.photoURL?<img src={viewed.photoURL} alt=""/>:<Pickaxe/>}{viewed.equipped.badge&&<i className={`identity-badge ${cosmeticClass(viewed.equipped.badge)}`}><BadgeCheck/></i>}</div><div><span>{ownProfile?'HỒ SƠ THỢ MỎ':'HỒ SƠ NGƯỜI CHƠI'}</span><h1 className={cosmeticClass(viewed.equipped.nameColor)}>{viewed.displayName}</h1><p>{title||viewed.rank} · Level {level}</p><div className="profile-exp"><i style={{width:`${Math.max(0,Math.min(100,progress))}%`}}/><span>{viewed.exp-start}/{end-start} EXP tới cấp {level+1}</span></div></div><div className="profile-currency">{ownProfile?<><Coins/><b>{viewed.coins}</b><span>VÀNG</span></>:<><Crown/><b>{viewed.rankPoints}</b><span>RANK POINT</span></>}</div></div>
  {!ownProfile&&<div className="profile-social-actions">{relation==='none'&&<button className="btn btn-primary" onClick={()=>void social(()=>sendFriendRequest(profile,summaryOf(viewed)),'sent','Đã gửi lời mời kết bạn.')}><UserPlus/> KẾT BẠN</button>}{relation==='sent'&&<button className="btn btn-ghost" onClick={()=>void social(()=>cancelFriendRequest(profile.uid,viewed.uid),'none','Đã thu hồi lời mời.')}><X/> THU HỒI LỜI MỜI</button>}{relation==='received'&&<button className="btn btn-primary" onClick={()=>void social(()=>acceptFriendRequest(profile,{...summaryOf(viewed),fromUid:viewed.uid,toUid:profile.uid}),'friends','Đã trở thành bạn bè.')}><Check/> CHẤP NHẬN KẾT BẠN</button>}{relation==='friends'&&<button className="btn btn-danger" onClick={()=>void social(()=>removeFriend(profile.uid,viewed.uid),'none','Đã huỷ kết bạn.')}><UserMinus/> HUỶ KẾT BẠN</button>}</div>}
  {msg&&<button className="profile-message" onClick={()=>setMsg('')}>{msg}<X/></button>}
  <div className="profile-grid"><div className="panel stats-panel"><header><Gauge/> THỐNG KÊ SỰ NGHIỆP</header><div className="stat-grid"><div><Swords/><b>{total}</b><span>Tổng trận</span></div><div><Crown/><b>{viewed.wins}</b><span>Chiến thắng</span></div><div><ShieldAlert/><b>{total?Math.round(viewed.wins/total*100):0}%</b><span>Tỷ lệ thắng</span></div><div><Pickaxe/><b>{viewed.exp}</b><span>EXP</span></div></div></div>
   <div className="panel achievements"><header><Award/> DANH HIỆU ĐÃ MỞ KHÓA</header>{achievements.length?<div className="badge-list">{achievements.map(mission=><span key={mission.id}><BadgeCheck aria-hidden="true"/><b>{mission.title}</b><small>{mission.description}</small></span>)}</div>:<div className="profile-empty"><Award/><b>Chưa có danh hiệu</b><span>Danh hiệu thành tích sẽ xuất hiện tại đây.</span></div>}</div>
  </div>
  {ownProfile?<section className="panel profile-inventory"><header><PackageOpen/> TỦ ĐỒ <small>{ownedItems.length} vật phẩm sở hữu</small></header>{ownedItems.length?<div className="inventory-grid">{ownedItems.map(item=>{const equipped=viewed.equipped[item.category]===item.id;return <article className={equipped?'equipped':''} key={item.id}><div className="inventory-preview">{item.preview}</div><div><small>{categoryName[item.category]}</small><b>{item.name}</b><span>{item.description}</span></div><button className={`btn ${equipped?'btn-danger':'btn-ghost'}`} onClick={()=>void act(()=>equipped?unequipItem(item.category):equipItem(item.id),equipped?'Đã tháo vật phẩm.':'Đã trang bị vật phẩm.')}>{equipped?'THÁO':viewed.equipped[item.category]?'ĐỔI':'TRANG BỊ'}</button></article>})}</div>:<div className="profile-empty"><PackageOpen/><b>Tủ đồ đang trống</b><span>Vật phẩm mua trong Cửa hàng sẽ xuất hiện tại đây.</span></div>}</section>
  :<section className="panel profile-inventory public-equipped"><header><PackageOpen/> ĐANG TRANG BỊ <small>{equippedItems.length} vật phẩm</small></header>{equippedItems.length?<div className="inventory-grid">{equippedItems.map(item=><article className="equipped" key={item.id}><div className="inventory-preview">{item.preview}</div><div><small>{categoryName[item.category]}</small><b>{item.name}</b><span>{item.description}</span></div></article>)}</div>:<div className="profile-empty"><PackageOpen/><b>Chưa trang bị vật phẩm</b></div>}</section>}
 </section>;
}
