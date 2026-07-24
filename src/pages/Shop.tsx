import { useMemo, useState } from 'react';
import { Anchor, BadgeCheck, Coins, Frame, Gem, Palette, PanelTop, ShoppingBag, Tag, Snowflake, Pickaxe, Sparkles, Shield, Compass, Crown, Paintbrush } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { SHOP_ITEMS } from '../lib/shop';
import GameEmblem from '../components/GameEmblem';
const icons={frame:Frame,nameColor:Palette,nameplate:PanelTop,title:Tag,badge:BadgeCheck,boardSkin:PanelTop,pieceSkin:Gem};
const categoryName={frame:'KHUNG HỒ SƠ',nameColor:'MÀU TÊN',nameplate:'NỀN BẢNG TÊN',title:'DANH HIỆU',badge:'HUY HIỆU',boardSkin:'SKIN BÀN CỜ',pieceSkin:'SKIN QUÂN CỜ'};
const previewIcon=(id:string)=>id==='board-ice'?Snowflake:id==='board-volcano'?Pickaxe:id==='board-shipwreck'?Anchor:id==='piece-gold'?Crown:id==='piece-crystal'?Gem:id.includes('wolf')?Shield:id.includes('compass')?Compass:id.includes('emerald')?Sparkles:id.includes('amber')?Paintbrush:icons.frame;
const tone=(id:string):'gold'|'ice'|'fire'|'emerald'|'red'|'violet'=>id.includes('ice')||id.includes('ocean')||id.includes('crystal')?'ice':id.includes('volcano')||id.includes('wolf')||id.includes('crimson')?'fire':id.includes('emerald')?'emerald':id.includes('shadow')?'violet':'gold';
export default function Shop(){
 const{profile,buyItem,equipItem}=useAuth();const[msg,setMsg]=useState('');const[filter,setFilter]=useState<'all'|'boardSkin'|'pieceSkin'|'profile'>('all');
 const items=useMemo(()=>SHOP_ITEMS.filter(i=>filter==='all'||(filter==='profile'?!['boardSkin','pieceSkin'].includes(i.category):i.category===filter)),[filter]);
 if(!profile)return null;
 const act=async(fn:()=>Promise<void>,ok:string)=>{try{await fn();setMsg(ok)}catch(e:any){setMsg(e?.message||'Không thể thực hiện.')}};
 return <section className="shop-page ui-v2-page"><div className="section-heading"><span>VẬT PHẨM TRANG TRÍ</span><h1>CỬA HÀNG HẦM MỎ</h1><p>Mọi vật phẩm chỉ thay đổi diện mạo. Không tăng sức mạnh hay tạo lợi thế trong trận.</p></div>
 <div className="shop-toolbar"><div className="shop-tabs"><button className={filter==='all'?'active':''} onClick={()=>setFilter('all')}>TẤT CẢ</button><button className={filter==='boardSkin'?'active':''} onClick={()=>setFilter('boardSkin')}>BÀN CỜ</button><button className={filter==='pieceSkin'?'active':''} onClick={()=>setFilter('pieceSkin')}>QUÂN CỜ</button><button className={filter==='profile'?'active':''} onClick={()=>setFilter('profile')}>HỒ SƠ</button></div><div className="shop-wallet"><GameEmblem icon={ShoppingBag} size="sm"/><div><b>{profile.coins.toLocaleString('vi-VN')}</b><span>VÀNG HIỆN CÓ</span></div></div></div>
 {msg&&<div className="shop-message">{msg}</div>}
 <div className="shop-grid">{items.map(item=>{const owned=profile.ownedItems.includes(item.id),equipped=profile.equipped[item.category]===item.id;const PIcon=previewIcon(item.id);return <article className={`shop-card ${equipped?'equipped':''}`} key={item.id}>
  <div className={`shop-preview ${item.id}`}><span className="shop-preview-glow"/><GameEmblem icon={PIcon} tone={tone(item.id)} size="lg"/><small>{categoryName[item.category]}</small></div>
  <div className="shop-card-copy"><span>{equipped?'ĐANG TRANG BỊ':owned?'ĐÃ SỞ HỮU':categoryName[item.category]}</span><h3>{item.name}</h3><p>{item.description}</p></div>
  <button className={`btn ${owned?'btn-ghost':'btn-primary'}`} disabled={equipped} onClick={()=>void act(()=>owned?equipItem(item.id):buyItem(item.id),owned?'Đã trang bị.':'Mua thành công.')}>{equipped?<><BadgeCheck size={17}/> ĐANG DÙNG</>:owned?'TRANG BỊ':<><Coins size={16}/> {item.price.toLocaleString('vi-VN')}</>}</button>
 </article>})}</div></section>}
