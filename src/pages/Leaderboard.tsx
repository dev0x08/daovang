import { useEffect, useState } from 'react';
import { collection, getDocs, limit, orderBy, query } from 'firebase/firestore';
import { Crown, Medal, Trophy } from 'lucide-react';
import { db } from '../lib/firebase';
import { levelFromExp, rankFromPoints } from '../lib/progression';
import { Equipped } from '../context/AuthContext';
import PlayerIdentity from '../components/PlayerIdentity';
type Row={uid:string;displayName:string;photoURL:string;rank:string;rankPoints:number;exp:number;wins:number;gamesPlayed:number;equipped?:Equipped};
export default function Leaderboard(){
 const[data,setData]=useState<Row[]>([]);const[loading,setLoading]=useState(true);
 useEffect(()=>{(async()=>{if(!db){setLoading(false);return}try{const snap=await getDocs(query(collection(db,'users'),orderBy('rankPoints','desc'),limit(100)));setData(snap.docs.map(d=>{const raw=d.data(),rankPoints=Number(raw.rankPoints||0);return{uid:d.id,displayName:'Người chơi',photoURL:'',exp:0,wins:0,gamesPlayed:0,equipped:{},...raw,rankPoints,rank:rankFromPoints(rankPoints).name} as Row}))}finally{setLoading(false)}})()},[]);
 return <section className="ranking-page"><div className="section-heading"><span>XẾP HẠNG TOÀN MÁY CHỦ</span><h1>BẢNG XẾP HẠNG RANK</h1><p>Xếp hạng theo Rank Point; level và EXP là tiến trình tích lũy riêng.</p></div>{loading?<div className="panel empty-state">Đang tải bảng xếp hạng...</div>:<><div className="podium">{data.slice(0,3).map((x,i)=>{const Icon=i===0?Crown:i===1?Medal:Trophy;return <div className={`pod p${i+1}`} key={x.uid}><Icon/><PlayerIdentity player={{name:x.displayName,photoURL:x.photoURL,rank:x.rank,equipped:x.equipped}}/><span>{x.rankPoints} RP</span></div>})}</div><div className="ranking-table"><div className="rank-head"><span>HẠNG</span><span>NGƯỜI CHƠI</span><span>RANK</span><span>LEVEL</span><span>THẮNG</span></div>{data.map((x,i)=><div className="rank-row" key={x.uid}><b>#{i+1}</b><PlayerIdentity compact player={{name:x.displayName,photoURL:x.photoURL,rank:x.rank,equipped:x.equipped}}/><span>{x.rankPoints} RP</span><span>Level {levelFromExp(x.exp)}</span><span>{x.wins}/{x.gamesPlayed}</span></div>)}</div></>}</section>;
}
