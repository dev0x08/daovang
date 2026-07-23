import { FormEvent, useEffect, useRef, useState } from 'react';
import { addDoc, collection, limit, onSnapshot, orderBy, query, serverTimestamp } from 'firebase/firestore';
import { MessageCircle, Send, Settings } from 'lucide-react';
import { Equipped, useAuth } from '../context/AuthContext';
import { db } from '../lib/firebase';
import { cosmeticClass, itemById } from '../lib/shop';

type ChatMessage={id:string;uid:string;displayName:string;photoURL?:string;text:string;equipped?:Equipped;createdAt?:{toDate?:()=>Date}};
const SystemMessage=({message}:{message:string})=>{
 const placed=message.match(/^(.+?) đặt (.+?) tại ([A-Z]+\d+)\.$/u);
 if(placed)return <p className="system-event placement-event">Người chơi <strong className="event-player">{placed[1]}</strong> đặt <strong className="event-card">{placed[2]}</strong> tại <strong className="event-position">{placed[3]}</strong>.</p>;
 const blocked=message.match(/^(.+?) (?:đã )?dùng (lá Chặn) lên (.+?)\. (.+?) (không thể đặt mảnh đường cho tới khi được) (Hồi sinh)\.$/u);
 if(blocked)return <p className="system-event action-event"><strong className="event-player">{blocked[1]}</strong> đã dùng <strong className="event-card">{blocked[2]}</strong> lên <strong className="event-target">{blocked[3]}</strong>. <strong className="event-target">{blocked[4]}</strong> {blocked[5]} <strong className="event-card">{blocked[6]}</strong>.</p>;
 const action=message.match(/^(.+?) (?:đã )?dùng (.+?) (?:tại|lên) (.+?)\.$/u);
 if(action)return <p className="system-event action-event"><strong className="event-player">{action[1]}</strong> đã dùng <strong className="event-card">{action[2]}</strong> lên <strong className="event-target">{action[3]}</strong>.</p>;
 const scout=message.match(/^(.+?) đã bí mật thăm dò (.+?)\.$/u);
 if(scout)return <p className="system-event scout-event"><strong className="event-player">{scout[1]}</strong> đã bí mật thăm dò <strong className="event-target">{scout[2]}</strong>.</p>;
 const firstTurn=message.match(/^Người đi đầu tiên: (.+?)\.$/u);
 if(firstTurn)return <p className="system-event">Người đi đầu tiên: <strong className="event-player">{firstTurn[1]}</strong>.</p>;
 const playerEvent=message.match(/^(.+?)(\s+(?:đã\s+)?(?:bỏ|bị|được|không còn|dùng|thắng|thua|nhận|mất)(?:\s|$).*)$/u);
 if(playerEvent)return <p className="system-event"><strong className="event-player">{playerEvent[1]}</strong>{playerEvent[2]}</p>;
 return <p>{message}</p>;
};
export default function ChatPanel({roomId,compact=false,systemMessages=[]}:{roomId:string;compact?:boolean;systemMessages?:string[]}){
 const{profile,recordChatMessage}=useAuth();const[messages,setMessages]=useState<ChatMessage[]>([]);const[text,setText]=useState('');const[error,setError]=useState('');const[sending,setSending]=useState(false);const[filter,setFilter]=useState<'all'|'player'|'system'>('all');const lastSent=useRef(0);const systemTimes=useRef(new Map<string,number>());const chatTimes=useRef(new Map<string,number>());
 useEffect(()=>{
  if(!db||!roomId)return undefined;
  const q=query(collection(db,'rooms',roomId,'messages'),orderBy('createdAt','asc'),limit(100));
  const unsubscribe=onSnapshot(q,s=>setMessages(s.docs.map(d=>({id:d.id,...d.data()} as ChatMessage))),()=>setError('Không tải được tin nhắn. Kiểm tra Firestore Rules.'));
  return ()=>{unsubscribe()};
 },[roomId]);
 const send=async(e?:FormEvent)=>{e?.preventDefault();const value=text.trim().replace(/\s+/g,' ');if(!db||!profile||!value||sending)return;if(value.length>300){setError('Tin nhắn tối đa 300 ký tự.');return}if(Date.now()-lastSent.current<1000){setError('Bạn đang gửi quá nhanh.');return}setSending(true);setError('');try{await addDoc(collection(db,'rooms',roomId,'messages'),{uid:profile.uid,displayName:profile.displayName,photoURL:profile.photoURL||'',equipped:profile.equipped||{},text:value,createdAt:serverTimestamp()});lastSent.current=Date.now();setText('');void recordChatMessage()}catch{setError('Không gửi được tin nhắn.')}finally{setSending(false)}};
 const now=Date.now();systemMessages.forEach((message,i)=>{if(!systemTimes.current.has(message))systemTimes.current.set(message,now-i)});messages.forEach(m=>{if(!chatTimes.current.has(m.id))chatTimes.current.set(m.id,m.createdAt?.toDate?.().getTime()||now)});
 const timeline=[...systemMessages.map((message,i)=>({type:'system' as const,id:`system-${i}-${message}`,time:systemTimes.current.get(message)||0,message})),...messages.map(message=>({type:'player' as const,id:`player-${message.id}`,time:message.createdAt?.toDate?.().getTime()||chatTimes.current.get(message.id)||0,message}))].sort((a,b)=>b.time-a.time);
 const visibleTimeline=filter==='all'?timeline:timeline.filter(item=>item.type===filter);
 return <div className={`chat-panel ${compact?'compact':''}`}><div className="chat-head"><MessageCircle/><b>TRÒ CHUYỆN</b><label className="chat-filter"><span className="sr-only">Lọc nội dung trò chuyện</span><select value={filter} onChange={e=>setFilter(e.target.value as typeof filter)} aria-label="Lọc nội dung trò chuyện"><option value="all">Tất cả</option><option value="player">Người chơi</option><option value="system">Hệ thống</option></select></label></div><div className="chat-messages newest-first" aria-live="polite">{visibleTimeline.length===0&&<div className="chat-empty">Không có nội dung trong bộ lọc này.</div>}{visibleTimeline.map(item=>item.type==='system'?<div className="chat-system" data-message-type="system" key={item.id}><Settings aria-hidden="true"/><div><b>HỆ THỐNG</b><SystemMessage message={item.message}/></div></div>:(()=>{const m=item.message,equipped=m.equipped||{},title=itemById(equipped.title)?.name;return <div className={`chat-message ${m.uid===profile?.uid?'mine':''} ${cosmeticClass(equipped.nameplate)}`} data-message-type="player" key={item.id}><span className={`chat-avatar ${cosmeticClass(equipped.frame)}`}>{m.photoURL?<img src={m.photoURL} alt=""/>:m.displayName.slice(0,1).toUpperCase()}</span><div><b className={cosmeticClass(equipped.nameColor)}>{m.displayName}</b>{title&&<small className="chat-cosmetic-title">{title}</small>}<p>{m.text}</p></div></div>})())}</div><form className="chat-compose" onSubmit={send}><input value={text} onChange={e=>setText(e.target.value)} maxLength={300} placeholder="Nhập tin nhắn..."/><button disabled={!text.trim()||sending} title="Gửi"><Send/></button></form>{error&&<small className="chat-error">{error}</small>}</div>
}
