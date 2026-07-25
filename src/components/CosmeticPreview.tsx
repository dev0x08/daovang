import { Shield, UserRound } from 'lucide-react';
import { cosmeticClass, ShopItem } from '../lib/shop';

export default function CosmeticPreview({item,name='Anh Nguyễn',photoURL='',className=''}:{item:ShopItem;name?:string;photoURL?:string;className?:string}){
 const avatar=<span className={`cosmetic-preview-avatar ${item.category==='frame'?cosmeticClass(item.id):''}`}>{photoURL?<img src={photoURL} alt=""/>:<UserRound aria-hidden="true"/>}</span>;
 if(item.category==='frame')return <div className={`cosmetic-demo cosmetic-demo-frame ${className}`}>{avatar}</div>;
 if(item.category==='nameColor')return <div className={`cosmetic-demo cosmetic-demo-name ${className}`}><span className={cosmeticClass(item.id)}>{name}</span></div>;
 if(item.category==='nameplate')return <div className={`cosmetic-demo cosmetic-demo-plate ${cosmeticClass(item.id)} ${className}`}>{avatar}<span><b>{name}</b><small>THỢ MỎ · LEVEL 1</small></span></div>;
 if(item.category==='title')return <div className={`cosmetic-demo cosmetic-demo-title ${item.id} ${className}`}><strong>{item.name}</strong></div>;
 if(item.category==='badge')return <div className={`cosmetic-demo cosmetic-demo-badge ${className}`}>{avatar}<i className={`identity-badge ${cosmeticClass(item.id)}`}><Shield aria-hidden="true"/></i></div>;
 return <div className={`cosmetic-demo cosmetic-demo-generic ${className}`}><strong>{item.preview}</strong></div>;
}
