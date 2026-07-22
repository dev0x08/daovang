import { FormEvent, useEffect, useRef, useState } from 'react';
import { addDoc, collection, limit, onSnapshot, orderBy, query, serverTimestamp } from 'firebase/firestore';
import { MessageCircle, Send, Settings } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { db } from '../lib/firebase';

type ChatMessage={id:string;uid:string;displayName:string;photoURL?:string;text:string;createdAt?:{toDate?:()=>Date}};
const SystemMessage=({message}:{message:string})=>{
 const placed=message.match(/^(.+?) đặt (.+?) tại ([A-Z]+\d+)\.$/u);
 if(placed)return <p className="system-event placement-event">Người chơi <strong className="event-player">{placed[1]}</strong> đặt <strong className="event-card">{placed[2]}</strong> tại <strong className="event-position">{placed[3]}</strong>.</p>;
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
 const send=async(e?:FormEvent)=>{e?.preventDefault();const value=text.trim().replace(/\s+/g,' ');if(!db||!profile||!value||sending)return;if(value.length>300){setError('Tin nhắn tối đa 300 ký tự.');return}if(Date.now()-lastSent.current<1000){setError('Bạn đang gửi quá nhanh.');return}setSending(true);setError('');try{await addDoc(collection(db,'rooms',roomId,'messages'),{uid:profile.uid,displayName:profile.displayName,photoURL:profile.photoURL||'',text:value,createdAt:serverTimestamp()});lastSent.current=Date.now();setText('');void recordChatMessage()}catch{setError('Không gửi được tin nhắn.')}finally{setSending(false)}};
 const now=Date.now();systemMessages.forEach((message,i)=>{if(!systemTimes.current.has(message))systemTimes.current.set(message,now-i)});messages.forEach(m=>{if(!chatTimes.current.has(m.id))chatTimes.current.set(m.id,m.createdAt?.toDate?.().getTime()||now)});
 const timeline=[...systemMessages.map((message,i)=>({type:'system' as const,id:`system-${i}-${message}`,time:systemTimes.current.get(message)||0,message})),...messages.map(message=>({type:'player' as const,id:`player-${message.id}`,time:message.createdAt?.toDate?.().getTime()||chatTimes.current.get(message.id)||0,message}))].sort((a,b)=>b.time-a.time);
 const visibleTimeline=filter==='all'?timeline:timeline.filter(item=>item.type===filter);
 return <div className={`chat-panel ${compact?'compact':''}`}><div className="chat-head"><MessageCircle/><b>TRÒ CHUYỆN</b><label className="chat-filter"><span className="sr-only">Lọc nội dung trò chuyện</span><select value={filter} onChange={e=>setFilter(e.target.value as typeof filter)} aria-label="Lọc nội dung trò chuyện"><option value="all">Tất cả</option><option value="player">Người chơi</option><option value="system">Hệ thống</option></select></label></div><div className="chat-messages newest-first" aria-live="polite">{visibleTimeline.length===0&&<div className="chat-empty">Không có nội dung trong bộ lọc này.</div>}{visibleTimeline.map(item=>item.type==='system'?<div className="chat-system" data-message-type="system" key={item.id}><Settings aria-hidden="true"/><div><b>HỆ THỐNG</b><SystemMessage message={item.message}/></div></div>:(()=>{const m=item.message;return <div className={`chat-message ${m.uid===profile?.uid?'mine':''}`} data-message-type="player" key={item.id}>{m.photoURL?<img src={m.photoURL} alt=""/>:<span className="chat-avatar">{m.displayName.slice(0,1).toUpperCase()}</span>}<div><b>{m.displayName}</b><p>{m.text}</p></div></div>})())}</div><form className="chat-compose" onSubmit={send}><input value={text} onChange={e=>setText(e.target.value)} maxLength={300} placeholder="Nhập tin nhắn..."/><button disabled={!text.trim()||sending} title="Gửi"><Send/></button></form>{error&&<small className="chat-error">{error}</small>}</div>
}
