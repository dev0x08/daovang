import { useEffect, useMemo, useState } from 'react';
import { collection, getDocs, limit, orderBy, query } from 'firebase/firestore';
import { ChevronRight, Crown, Flame, Medal, Shield, Sparkles, Star, Swords, Trophy, Users } from 'lucide-react';
import { Link } from 'react-router-dom';
import PlayerIdentity from '../components/PlayerIdentity';
import { Equipped } from '../context/AuthContext';
import { db } from '../lib/firebase';
import { levelFromExp, rankFromPoints, rankStars } from '../lib/progression';
import { Guild, listGuilds } from '../lib/guilds';
import { profileUrl } from '../lib/slugs';

type Row={
 uid:string;displayName:string;photoURL:string;rank:string;rankPoints:number;
 exp:number;wins:number;gamesPlayed:number;winStreak?:number;equipped?:Equipped;
};

const winRate=(row:Row)=>row.gamesPlayed?Math.round(row.wins/row.gamesPlayed*100):0;

export default function Leaderboard(){
 const[data,setData]=useState<Row[]>([]),[loading,setLoading]=useState(true);
 const[guilds,setGuilds]=useState<Guild[]>([]),[activeTab,setActiveTab]=useState<'players'|'guilds'>('players');
 useEffect(()=>{(async()=>{if(!db){setLoading(false);return}try{
  const snap=await getDocs(query(collection(db,'users'),orderBy('rankPoints','desc'),limit(100)));
  setData(snap.docs.map(d=>{const raw=d.data(),rankPoints=Number(raw.rankPoints||0);return{uid:d.id,displayName:'Người chơi',photoURL:'',exp:0,wins:0,gamesPlayed:0,equipped:{},...raw,rankPoints,rank:rankFromPoints(rankPoints).label} as Row}));
 }finally{setLoading(false)}})()},[]);
 useEffect(()=>{void listGuilds(100).then(setGuilds).catch(()=>setGuilds([]))},[]);
 const totalGames=useMemo(()=>data.reduce((sum,row)=>sum+row.gamesPlayed,0),[data]);
 const topThree=[data[1],data[0],data[2]].filter(Boolean);
 return <section className="ranking-page ranking-war-page app-page">
  <header className="rank-war-hero app-hero">
   <div className="rank-war-scan"/><div className="rank-war-title"><span><Swords/> CHIẾN TUYẾN XẾP HẠNG</span><h1>ĐẠI SẢNH<br/><i>VINH DANH</i></h1><p>Những thợ mỏ xuất sắc nhất được khắc tên tại đây. Chiến thắng PvP, tích lũy sao và tiến tới ngôi vị Thách Đấu.</p></div>
   <div className="rank-season-card"><small>MÙA GIẢI HIỆN TẠI</small><b>SEASON 01</b><span><i/> ĐANG DIỄN RA</span></div>
  </header>
  <div className="rank-war-stats">
   <article><Users/><span><small>CHIẾN BINH</small><b>{data.length}</b></span></article>
   <article><Swords/><span><small>TỔNG TRẬN</small><b>{totalGames.toLocaleString('vi-VN')}</b></span></article>
   <article><Crown/><span><small>ĐỈNH CAO</small><b>{data[0]?.rank||'—'}</b></span></article>
  </div>
  <nav className="rank-war-tabs"><button className={activeTab==='players'?'active':''} onClick={()=>setActiveTab('players')}><Users/> CÁ NHÂN MẠNH NHẤT</button><button className={activeTab==='guilds'?'active':''} onClick={()=>setActiveTab('guilds')}><Shield/> GUILD MẠNH NHẤT</button></nav>
  {activeTab==='guilds'?<section className="guild-ranking-board"><header><span>GUILD POWER</span><h2>BẢNG XẾP HẠNG GUILD</h2></header>{guilds.length?<div>{guilds.map((guild,index)=><article key={guild.id}><strong>{String(index+1).padStart(2,'0')}</strong><span className="guild-rank-emblem"><Shield/></span><div>{guild.tag&&<small>[{guild.tag}]</small>}<b>{guild.name}</b></div><span><Users/>{guild.memberCount} thành viên</span><span><Swords/>{guild.totalWarPoints} chiến tích</span><em><Sparkles/>{guild.power.toLocaleString('vi-VN')}</em></article>)}</div>:<div className="rank-war-loading"><Shield/><span>CHƯA CÓ GUILD NÀO GHI DANH</span></div>}</section>:loading?<div className="rank-war-loading"><Shield/><span>ĐANG KẾT NỐI CHIẾN TUYẾN...</span></div>:data.length===0?<div className="rank-war-loading"><Shield/><span>CHƯA CÓ CHIẾN BINH NÀO GHI DANH</span></div>:<>
   <section className="rank-war-podium">
    <header><span>TOP COMMANDERS</span><h2>BA NGƯỜI DẪN ĐẦU</h2></header>
    <div className="rank-war-top-grid">{topThree.map(row=>{const actualIndex=data.indexOf(row),place=actualIndex+1,Icon=place===1?Crown:place===2?Medal:Trophy;return <Link to={profileUrl(row.displayName)} className={`rank-war-champion place-${place}`} key={row.uid}>
     <div className="champion-place"><Icon/><b>0{place}</b></div>
     <PlayerIdentity player={{name:row.displayName,photoURL:row.photoURL,equipped:row.equipped}} subtitle={row.rank}/>
     <div className="champion-score"><strong><Star/><span>{rankStars(row.rankPoints)} SAO</span></strong></div>
     <div className="champion-record"><span><b>{row.wins}</b> THẮNG</span><span><b>{winRate(row)}%</b> TỈ LỆ</span><span><b>Lv.{levelFromExp(row.exp)}</b> CẤP</span></div>
    </Link>})}</div>
   </section>
   <section className="rank-war-board">
    <header><div><span>GLOBAL RANKING</span><h2>BẢNG CHIẾN TÍCH</h2></div><p><Star/> Xếp theo số sao hiện tại</p></header>
    <div className="rank-war-head"><span>HẠNG</span><span>CHIẾN BINH</span><span>BẬC</span><span>SAO</span><span>PHONG ĐỘ</span><span/></div>
    <div className="rank-war-list">{data.map((row,index)=><Link to={profileUrl(row.displayName)} className={`rank-war-row ${index<3?'elite':''}`} key={row.uid}>
     <strong className="rank-war-number">{index<3?<Crown/>:null}<b>{String(index+1).padStart(2,'0')}</b></strong>
     <PlayerIdentity compact player={{name:row.displayName,photoURL:row.photoURL,equipped:row.equipped}} subtitle={`${row.wins} chiến thắng · Lv.${levelFromExp(row.exp)}`}/>
     <span className="rank-war-tier" style={{'--tier-color':rankFromPoints(row.rankPoints).color} as React.CSSProperties}><Shield/>{row.rank}</span>
     <strong className="rank-war-stars"><Star/>{rankStars(row.rankPoints)}</strong>
     <span className="rank-war-form"><i style={{width:`${winRate(row)}%`}}/><b>{winRate(row)}%</b></span>
     <ChevronRight className="rank-war-arrow"/>
    </Link>)}</div>
   </section>
  </>}
 </section>;
}
