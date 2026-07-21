import { useEffect, useState } from 'react';
import { collection, getDocs, limit, orderBy, query } from 'firebase/firestore';
import { Crown, Medal, Trophy } from 'lucide-react';
import { db } from '../lib/firebase';
import { levelFromExp } from '../lib/progression';
import { Equipped } from '../context/AuthContext';
import PlayerIdentity from '../components/PlayerIdentity';

type Row={uid:string;displayName:string;photoURL:string;rank:string;exp:number;wins:number;gamesPlayed:number;equipped?:Equipped};
export default function Leaderboard(){
 const[data,setData]=useState<Row[]>([]);const[loading,setLoading]=useState(true);
 useEffect(()=>{(async()=>{if(!db){setLoading(false);return;}try{const snap=await getDocs(query(collection(db,'users'),orderBy('exp','desc'),limit(100)));setData(snap.docs.map(d=>({uid:d.id,displayName:'Người chơi',photoURL:'',rank:'Đồng',exp:0,wins:0,gamesPlayed:0,equipped:{},...d.data()} as Row)))}finally{setLoading(false)}})()},[]);
 return <section className="ranking-page"><div className="section-heading"><span>XẾP HẠNG TOÀN MÁY CHỦ</span><h1>BẢNG XẾP HẠNG NGƯỜI CHƠI</h1><p>Dữ liệu được lấy trực tiếp từ hồ sơ người dùng và hiển thị toàn bộ vật phẩm trang trí đang trang bị.</p></div>{loading?<div className="panel empty-state">Đang tải bảng xếp hạng...</div>:<><div className="podium">{data.slice(0,3).map((x,i)=>{const Icon=i===0?Crown:i===1?Medal:Trophy;return <div className={`pod p${i+1}`} key={x.uid}><Icon/><PlayerIdentity player={{name:x.displayName,photoURL:x.photoURL,rank:x.rank,equipped:x.equipped}}/><span>{x.exp} EXP</span></div>})}</div><div className="ranking-table"><div className="rank-head"><span>HẠNG</span><span>NGƯỜI CHƠI</span><span>LEVEL</span><span>EXP</span><span>THẮNG</span></div>{data.map((x,i)=><div className="rank-row" key={x.uid}><b>#{i+1}</b><PlayerIdentity compact player={{name:x.displayName,photoURL:x.photoURL,rank:x.rank,equipped:x.equipped}}/><span>Level {levelFromExp(x.exp)}</span><span>{x.exp}</span><span>{x.wins}/{x.gamesPlayed}</span></div>)}</div></>}</section>
}
