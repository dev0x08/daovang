import { FormEvent, useEffect, useRef, useState } from 'react';
import { addDoc, collection, limit, onSnapshot, orderBy, query, serverTimestamp } from 'firebase/firestore';
import { MessageCircle, Send } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { db } from '../lib/firebase';

type ChatMessage={id:string;uid:string;displayName:string;photoURL?:string;text:string;createdAt?:{toDate?:()=>Date}};
export default function ChatPanel({roomId,compact=false}:{roomId:string;compact?:boolean}){
 const{profile,recordChatMessage}=useAuth();const[messages,setMessages]=useState<ChatMessage[]>([]);const[text,setText]=useState('');const[error,setError]=useState('');const[sending,setSending]=useState(false);const lastSent=useRef(0);const bottom=useRef<HTMLDivElement>(null);
 useEffect(()=>{
  if(!db||!roomId)return undefined;
  const q=query(collection(db,'rooms',roomId,'messages'),orderBy('createdAt','asc'),limit(100));
  const unsubscribe=onSnapshot(q,s=>setMessages(s.docs.map(d=>({id:d.id,...d.data()} as ChatMessage))),()=>setError('Không tải được tin nhắn. Kiểm tra Firestore Rules.'));
  return ()=>{unsubscribe()};
 },[roomId]);
 useEffect(()=>{bottom.current?.scrollIntoView({behavior:'smooth'});return undefined},[messages.length]);
 const send=async(e?:FormEvent)=>{e?.preventDefault();const value=text.trim().replace(/\s+/g,' ');if(!db||!profile||!value||sending)return;if(value.length>300){setError('Tin nhắn tối đa 300 ký tự.');return}if(Date.now()-lastSent.current<1000){setError('Bạn đang gửi quá nhanh.');return}setSending(true);setError('');try{await addDoc(collection(db,'rooms',roomId,'messages'),{uid:profile.uid,displayName:profile.displayName,photoURL:profile.photoURL||'',text:value,createdAt:serverTimestamp()});lastSent.current=Date.now();setText('');void recordChatMessage()}catch{setError('Không gửi được tin nhắn.')}finally{setSending(false)}};
 return <div className={`chat-panel ${compact?'compact':''}`}><div className="chat-head"><MessageCircle/><b>TRÒ CHUYỆN</b><span>{messages.length} tin</span></div><div className="chat-messages">{messages.length===0&&<div className="chat-empty">Chưa có tin nhắn. Hãy chào mọi người!</div>}{messages.map(m=><div className={`chat-message ${m.uid===profile?.uid?'mine':''}`} key={m.id}>{m.photoURL?<img src={m.photoURL}/>:<span className="chat-avatar">{m.displayName.slice(0,1).toUpperCase()}</span>}<div><b>{m.displayName}</b><p>{m.text}</p></div></div>)}<div ref={bottom}/></div><form className="chat-compose" onSubmit={send}><input value={text} onChange={e=>setText(e.target.value)} maxLength={300} placeholder="Nhập tin nhắn..."/><button disabled={!text.trim()||sending} title="Gửi"><Send/></button></form>{error&&<small className="chat-error">{error}</small>}</div>
}
