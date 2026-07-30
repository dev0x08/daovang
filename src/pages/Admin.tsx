import { FormEvent, useCallback, useEffect, useState } from 'react';
import { collection, deleteDoc, doc, getDoc, getDocs, serverTimestamp, setDoc, updateDoc, writeBatch } from 'firebase/firestore';
import { Coins, Edit3, Gauge, Plus, Search, ShieldAlert, Trash2, Users, Warehouse, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { db } from '../lib/firebase';
import { disbandGuild, Guild } from '../lib/guilds';
import { expForLevel, levelFromExp, MAX_LEVEL } from '../lib/progression';
import { ADMIN_UID, nameSlug } from '../lib/slugs';

type AdminRoom={id:string;name:string;hostName?:string};
type AdminUser={uid:string;displayName:string;email?:string;photoURL?:string;rank?:string;coins:number;exp:number};
type ConfirmState={title:string;message:string;confirmLabel:string;action:()=>Promise<void>};
type GuildDraft={id?:string;name:string;tag:string;description:string;ownerId:string};

const emptyGuild:GuildDraft={name:'',tag:'',description:'',ownerId:''};
const deleteChildren=async(parent:[string,string],subcollections:string[])=>{
 if(!db)return;
 for(const child of subcollections){
  const snap=await getDocs(collection(db,parent[0],parent[1],child));
  if(snap.empty)continue;
  const batch=writeBatch(db);snap.docs.forEach(item=>batch.delete(item.ref));await batch.commit();
 }
};

export default function Admin(){
 const{profile}=useAuth();
 const[rooms,setRooms]=useState<AdminRoom[]>([]),[guilds,setGuilds]=useState<Guild[]>([]),[users,setUsers]=useState<AdminUser[]>([]);
 const[message,setMessage]=useState(''),[confirmState,setConfirmState]=useState<ConfirmState|null>(null),[guildDraft,setGuildDraft]=useState<GuildDraft|null>(null);
 const[activeTab,setActiveTab]=useState<'rooms'|'guilds'|'users'>('rooms'),[adminSearch,setAdminSearch]=useState('');
 const load=useCallback(async()=>{if(!db||profile?.uid!==ADMIN_UID)return;const[roomSnap,guildSnap,userSnap]=await Promise.all([getDocs(collection(db,'rooms')),getDocs(collection(db,'guilds')),getDocs(collection(db,'users'))]);setRooms(roomSnap.docs.map(item=>({id:item.id,...item.data()} as AdminRoom)));setGuilds(guildSnap.docs.map(item=>({id:item.id,...item.data()} as Guild)));setUsers(userSnap.docs.map(item=>({coins:0,exp:0,uid:item.id,...item.data()} as AdminUser)))},[profile?.uid]);
 useEffect(()=>{void load()},[load]);
 if(profile?.uid!==ADMIN_UID)return <section className="center-page"><div className="auth-card"><ShieldAlert/><h1>KHÔNG CÓ QUYỀN</h1></div></section>;

 const act=async(action:()=>Promise<void>,success:string)=>{try{await action();setMessage(success);await load()}catch(error){setMessage(error instanceof Error?error.message:'Không thể thực hiện thao tác.')}};
 const removeRoom=async(id:string)=>{if(!db)return;await deleteChildren(['rooms',id],['messages']);await deleteDoc(doc(db,'rooms',id))};
 const removeUser=async(uid:string)=>{if(!db||uid===ADMIN_UID)throw new Error('Không thể xóa tài khoản admin.');await deleteChildren(['users',uid],['friends','friendRequests','roomInvites','matchHistory','completedMatches']);await setDoc(doc(db,'bannedUsers',uid),{deletedBy:ADMIN_UID,deletedAt:serverTimestamp()});await deleteDoc(doc(db,'users',uid))};
 const changeCoins=async(user:AdminUser,delta:number)=>{if(!db)return;const next=Math.max(0,Math.min(1_000_000,user.coins+delta));await updateDoc(doc(db,'users',user.uid),{coins:next})};
 const changeLevel=async(user:AdminUser,delta:number)=>{if(!db)return;const current=levelFromExp(user.exp),target=Math.max(1,Math.min(MAX_LEVEL,current+delta)),progress=Math.max(0,user.exp-expForLevel(current)),nextStart=expForLevel(target),nextEnd=target>=MAX_LEVEL?10_000_000:expForLevel(target+1)-1;await updateDoc(doc(db,'users',user.uid),{exp:Math.min(nextEnd,nextStart+progress)})};
 const saveGuild=async(event:FormEvent)=>{event.preventDefault();if(!db||!guildDraft)return;const safeName=guildDraft.name.trim().replace(/\s+/g,' '),safeTag=guildDraft.tag.trim().toUpperCase(),slug=nameSlug(safeName),owner=users.find(item=>item.uid===guildDraft.ownerId);if(safeName.length<3||safeName.length>12)throw new Error('Tên guild phải từ 3 đến 12 ký tự.');if(safeTag.length<2||safeTag.length>5)throw new Error('Tag guild phải từ 2 đến 5 ký tự.');if(!owner)throw new Error('Hãy chọn chủ guild.');
  const duplicate=guilds.some(item=>item.id!==guildDraft.id&&nameSlug(item.name)===slug);if(duplicate)throw new Error('Tên guild đã tồn tại.');
  if(guildDraft.id){
   const current=guilds.find(item=>item.id===guildDraft.id);if(!current)throw new Error('Guild không còn tồn tại.');
   const newOwnerRef=doc(db,'guilds',current.id,'members',owner.uid),newOwnerSnap=await getDoc(newOwnerRef),ownerChanged=current.ownerId!==owner.uid;
   const batch=writeBatch(db);batch.update(doc(db,'guilds',current.id),{name:safeName,slug,tag:safeTag,description:guildDraft.description.trim().slice(0,160),ownerId:owner.uid,ownerName:owner.displayName,memberCount:current.memberCount+(ownerChanged&&!newOwnerSnap.exists()?1:0),updatedAt:serverTimestamp()});
   if(ownerChanged){batch.set(doc(db,'guilds',current.id,'members',current.ownerId),{role:'member',title:'Thành viên'},{merge:true});batch.set(newOwnerRef,{uid:owner.uid,displayName:owner.displayName,photoURL:owner.photoURL||'',rank:owner.rank||'Sắt IV',equipped:newOwnerSnap.data()?.equipped||{},role:'owner',title:'Hội trưởng',contribution:Number(newOwnerSnap.data()?.contribution||0),warPoints:Number(newOwnerSnap.data()?.warPoints||0),joinedAt:newOwnerSnap.data()?.joinedAt||serverTimestamp()},{merge:true})}
   if(nameSlug(current.name)!==slug){batch.delete(doc(db,'guildNames',nameSlug(current.name)));batch.set(doc(db,'guildNames',slug),{guildId:current.id,name:safeName,ownerId:owner.uid,createdAt:serverTimestamp()})}else batch.set(doc(db,'guildNames',slug),{guildId:current.id,name:safeName,ownerId:owner.uid},{merge:true});
   await batch.commit();
  }else{
   const guildRef=doc(db,'guilds',slug),batch=writeBatch(db);batch.set(guildRef,{name:safeName,slug,tag:safeTag,description:guildDraft.description.trim().slice(0,160),ownerId:owner.uid,ownerName:owner.displayName,memberCount:1,totalContribution:0,totalWarPoints:0,power:0,treasury:0,createdAt:serverTimestamp(),updatedAt:serverTimestamp()});batch.set(doc(db,'guildNames',slug),{guildId:slug,name:safeName,ownerId:owner.uid,createdAt:serverTimestamp()});batch.set(doc(guildRef,'members',owner.uid),{uid:owner.uid,displayName:owner.displayName,photoURL:owner.photoURL||'',rank:owner.rank||'Sắt IV',equipped:{},role:'owner',title:'Hội trưởng',contribution:0,warPoints:0,joinedAt:serverTimestamp()});await batch.commit();
  }
 };
 const submitGuild=(event:FormEvent)=>void act(async()=>{await saveGuild(event);setGuildDraft(null)},guildDraft?.id?'Đã cập nhật guild.':'Đã thêm guild.');
 const ask=(state:ConfirmState)=>setConfirmState(state);
 const term=adminSearch.trim().toLocaleLowerCase('vi'),visibleRooms=term?rooms.filter(room=>(room.name+' '+(room.hostName||room.id)).toLocaleLowerCase('vi').includes(term)):rooms,visibleGuilds=term?guilds.filter(guild=>(guild.name+' '+guild.tag+' '+(guild.ownerName||'')).toLocaleLowerCase('vi').includes(term)):guilds,visibleUsers=term?users.filter(user=>(user.displayName+' '+(user.email||user.uid)).toLocaleLowerCase('vi').includes(term)):users;

 return <section className="admin-page">
  <header><ShieldAlert/><div><span>QUYỀN QUẢN TRỊ</span><h1>ADMIN CONTROL</h1></div></header>
  {message&&<button className="guild-message" onClick={()=>setMessage('')}>{message}<X/></button>}
  <nav className="admin-tabs"><button className={activeTab==='rooms'?'active':''} onClick={()=>{setActiveTab('rooms');setAdminSearch('')}}><Warehouse/><span><b>QUẢN LÝ PHÒNG</b><small>Phòng đang hoạt động</small></span><em>{rooms.length}</em></button><button className={activeTab==='guilds'?'active':''} onClick={()=>{setActiveTab('guilds');setAdminSearch('')}}><ShieldAlert/><span><b>QUẢN LÝ GUILD</b><small>Thông tin và thành viên</small></span><em>{guilds.length}</em></button><button className={activeTab==='users'?'active':''} onClick={()=>{setActiveTab('users');setAdminSearch('')}}><Users/><span><b>QUẢN LÝ USER</b><small>Vàng, cấp và tài khoản</small></span><em>{users.length}</em></button></nav>
  <section className="panel admin-workspace">
   <header><div>{activeTab==='rooms'?<Warehouse/>:activeTab==='guilds'?<ShieldAlert/>:<Users/>}<span><small>ADMIN CONTROL</small><h2>{activeTab==='rooms'?'DANH SÁCH PHÒNG':activeTab==='guilds'?'DANH SÁCH GUILD':'DANH SÁCH NGƯỜI CHƠI'}</h2></span></div><label><Search/><input value={adminSearch} onChange={event=>setAdminSearch(event.target.value)} placeholder={activeTab==='rooms'?'Tìm tên phòng...':activeTab==='guilds'?'Tìm Guild hoặc chủ Guild...':'Tìm tên hoặc email...'}/></label>{activeTab==='guilds'&&<button className="btn btn-primary" onClick={()=>setGuildDraft({...emptyGuild,ownerId:users[0]?.uid||''})}><Plus/> THÊM GUILD</button>}</header>
   <div className="admin-table-head">{activeTab==='rooms'?<><span>PHÒNG</span><span>CHỦ PHÒNG</span><span>THAO TÁC</span></>:activeTab==='guilds'?<><span>GUILD</span><span>CHỦ GUILD</span><span>THÀNH VIÊN</span><span>THAO TÁC</span></>:<><span>NGƯỜI CHƠI</span><span>TÀI SẢN</span><span>CẤP</span><span>ĐIỀU CHỈNH</span><span>THAO TÁC</span></>}</div>
   <div className={`admin-table-body ${activeTab}`}>
    {activeTab==='rooms'&&visibleRooms.map(room=><article key={room.id}><span><b>{room.name}</b><small>{room.id}</small></span><span>{room.hostName||'Không xác định'}</span><div><button className="btn btn-danger btn-small" onClick={()=>ask({title:'XÓA PHÒNG',message:`Xóa phòng “${room.name}” và toàn bộ tin nhắn?`,confirmLabel:'XÓA PHÒNG',action:()=>removeRoom(room.id)})}><Trash2/> XÓA</button></div></article>)}
    {activeTab==='guilds'&&visibleGuilds.map(guild=><article key={guild.id}><span><b>[{guild.tag}] {guild.name}</b><small>{guild.description||'Chưa có giới thiệu'}</small></span><span>{guild.ownerName||guild.ownerId}</span><strong>{guild.memberCount}</strong><div><button className="admin-icon-button" title="Chỉnh sửa Guild" onClick={()=>setGuildDraft({id:guild.id,name:guild.name,tag:guild.tag,description:guild.description,ownerId:guild.ownerId})}><Edit3/></button><button className="btn btn-danger btn-small" onClick={()=>ask({title:'XÓA GUILD',message:`Giải tán “${guild.name}” và xóa toàn bộ dữ liệu?`,confirmLabel:'XÓA GUILD',action:()=>disbandGuild(guild.id)})}><Trash2/> XÓA</button></div></article>)}
    {activeTab==='users'&&visibleUsers.map(user=><article key={user.uid}><span><b>{user.displayName}</b><small>{user.email||user.uid}</small></span><strong><Coins/>{user.coins.toLocaleString('vi-VN')}</strong><strong><Gauge/>Lv.{levelFromExp(user.exp)}</strong><div className="admin-adjust"><div><button onClick={()=>void act(()=>changeCoins(user,-500),`Đã trừ 500 vàng của ${user.displayName}.`)}>−500 VÀNG</button><button onClick={()=>void act(()=>changeCoins(user,500),`Đã cộng 500 vàng cho ${user.displayName}.`)}>+500 VÀNG</button></div><div><button onClick={()=>void act(()=>changeLevel(user,-1),`Đã giảm 1 cấp của ${user.displayName}.`)}>−1 CẤP</button><button onClick={()=>void act(()=>changeLevel(user,1),`Đã tăng 1 cấp cho ${user.displayName}.`)}>+1 CẤP</button></div></div><div><button disabled={user.uid===ADMIN_UID} className="btn btn-danger btn-small" onClick={()=>ask({title:'XÓA USER',message:`Xóa dữ liệu và khóa tài khoản “${user.displayName}”?`,confirmLabel:'XÓA USER',action:()=>removeUser(user.uid)})}><Trash2/> XÓA</button></div></article>)}
    {!((activeTab==='rooms'?visibleRooms:activeTab==='guilds'?visibleGuilds:visibleUsers).length)&&<div className="admin-empty"><Search/><b>KHÔNG TÌM THẤY DỮ LIỆU</b><span>Thử lại với từ khóa khác.</span></div>}
   </div>
  </section>
  {guildDraft&&<div className="guild-modal-backdrop" onMouseDown={()=>setGuildDraft(null)}><form className="guild-modal admin-guild-modal" onMouseDown={event=>event.stopPropagation()} onSubmit={submitGuild}><button type="button" className="guild-close" onClick={()=>setGuildDraft(null)}><X/></button><ShieldAlert/><span>ADMIN CONTROL</span><h2>{guildDraft.id?'CHỈNH SỬA GUILD':'THÊM GUILD'}</h2><label>Tên Guild<input required minLength={3} maxLength={12} value={guildDraft.name} onChange={event=>setGuildDraft({...guildDraft,name:event.target.value})}/></label><label>Tag Guild<input required minLength={2} maxLength={5} value={guildDraft.tag} onChange={event=>setGuildDraft({...guildDraft,tag:event.target.value.toUpperCase()})}/></label><label>Chủ Guild<select value={guildDraft.ownerId} onChange={event=>setGuildDraft({...guildDraft,ownerId:event.target.value})}>{users.map(user=><option key={user.uid} value={user.uid}>{user.displayName}</option>)}</select></label><label>Giới thiệu<textarea maxLength={160} value={guildDraft.description} onChange={event=>setGuildDraft({...guildDraft,description:event.target.value})}/></label><button className="btn btn-primary btn-wide">{guildDraft.id?'LƯU THAY ĐỔI':'THÊM GUILD'}</button></form></div>}
  {confirmState&&<div className="guild-modal-backdrop guild-confirm-backdrop" onMouseDown={()=>setConfirmState(null)}><div className="guild-modal guild-confirm-modal" onMouseDown={event=>event.stopPropagation()}><span>ADMIN CONTROL</span><h2>{confirmState.title}</h2><p>{confirmState.message}</p><div><button className="btn btn-ghost" onClick={()=>setConfirmState(null)}>HỦY</button><button className="btn btn-danger" onClick={()=>{const current=confirmState;setConfirmState(null);void act(current.action,'Đã thực hiện thao tác.')}}>{confirmState.confirmLabel}</button></div></div></div>}
 </section>;
}
