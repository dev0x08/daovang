import { useEffect, useState } from 'react';
import { collection, getDocs, limit, orderBy, query } from 'firebase/firestore';
import { ChevronRight, Coins, Crown, Flame, Medal, Shield, Star, Swords, Trophy, Users } from 'lucide-react';
import { Link } from 'react-router-dom';
import PlayerIdentity from '../components/PlayerIdentity';
import GuildBadgeMark from '../components/GuildBadgeMark';
import { Equipped } from '../context/AuthContext';
import { db } from '../lib/firebase';
import { levelFromExp, rankFromPoints, rankStars } from '../lib/progression';
import { Guild, listGuilds } from '../lib/guilds';
import { profileUrl } from '../lib/slugs';
import { itemById } from '../lib/shop';

type Row={
 uid:string;displayName:string;photoURL:string;rank:string;rankPoints:number;
 exp:number;wins:number;gamesPlayed:number;winStreak?:number;equipped?:Equipped;
};

const winRate=(row:Row)=>row.gamesPlayed?Math.round(row.wins/row.gamesPlayed*100):0;

const testPlayers:Row[]=[
 {uid:'leader-test-01',displayName:'Anh Nguyễn',photoURL:'',rank:'Thách Đấu',rankPoints:780,exp:5250,wins:96,gamesPlayed:128,winStreak:8},
 {uid:'leader-test-02',displayName:'Hải Đăng',photoURL:'',rank:'Cao Thủ',rankPoints:692,exp:4680,wins:84,gamesPlayed:119,winStreak:5},
 {uid:'leader-test-03',displayName:'Minh Khang',photoURL:'',rank:'Kim Cương',rankPoints:578,exp:4210,wins:76,gamesPlayed:112,winStreak:4},
 {uid:'leader-test-04',displayName:'Ngọc Linh',photoURL:'',rank:'Bạch Kim',rankPoints:486,exp:3650,wins:68,gamesPlayed:106,winStreak:3},
 {uid:'leader-test-05',displayName:'Tuấn Kiệt',photoURL:'',rank:'Vàng',rankPoints:394,exp:3180,wins:61,gamesPlayed:101,winStreak:2},
 {uid:'leader-test-06',displayName:'Bảo Trâm',photoURL:'',rank:'Vàng',rankPoints:352,exp:2790,wins:54,gamesPlayed:94,winStreak:2},
 {uid:'leader-test-07',displayName:'Đức Huy',photoURL:'',rank:'Bạc',rankPoints:276,exp:2360,wins:47,gamesPlayed:88,winStreak:1},
 {uid:'leader-test-08',displayName:'Khánh Vy',photoURL:'',rank:'Bạc',rankPoints:238,exp:1980,wins:39,gamesPlayed:78,winStreak:1},
 {uid:'leader-test-09',displayName:'Quốc Bảo',photoURL:'',rank:'Đồng',rankPoints:164,exp:1540,wins:31,gamesPlayed:69,winStreak:0},
 {uid:'leader-test-10',displayName:'Mai Chi',photoURL:'',rank:'Sắt',rankPoints:88,exp:980,wins:22,gamesPlayed:58,winStreak:0},
];

const testGuilds:Guild[]=[
 ['guild-test-01','Biệt Đội Delta','DELTA',30,12840,28600],['guild-test-02','Sói Bóng Đêm','WOLF',28,11620,25400],
 ['guild-test-03','Mỏ Vàng Bất Tận','GOLD',26,10540,23150],['guild-test-04','Thợ Đào Tinh Nhuệ','MINE',25,9780,21400],
 ['guild-test-05','Vệ Binh Hầm Sâu','GUARD',24,8920,19650],['guild-test-06','Đoàn Quân Cyan','CYAN',22,8040,17800],
 ['guild-test-07','Kho Báu Phương Nam','SOUTH',21,7310,15950],['guild-test-08','Chiến Tuyến Alpha','ALPHA',20,6540,14100],
 ['guild-test-09','Hội Cuốc Vàng','PICK',18,5760,12350],['guild-test-10','Tân Binh Địa Đạo','ROOKIE',16,4980,10600],
].map(([id,name,tag,memberCount,totalWarPoints,power],index)=>({id:String(id),name:String(name),slug:String(id),tag:String(tag),description:'Guild thử nghiệm bảng xếp hạng.',ownerId:String(id)+'-owner',ownerName:'Chủ Guild',memberCount:Number(memberCount),totalContribution:Number(power),totalWarPoints:Number(totalWarPoints),power:Number(power),treasury:5000-index*250,guildLevel:Math.max(1,5-Math.floor(index/2)),guildExp:0,lifetimeGuildExp:Number(power)}));

const fillPlayers=(rows:Row[])=>[...rows,...testPlayers.filter(test=>!rows.some(row=>row.uid===test.uid)).slice(0,Math.max(0,10-rows.length))].sort((a,b)=>b.rankPoints-a.rankPoints);
const fillGuilds=(rows:Guild[])=>[...rows,...testGuilds.filter(test=>!rows.some(row=>row.id===test.id)).slice(0,Math.max(0,10-rows.length))].sort((a,b)=>b.totalContribution-a.totalContribution);

export default function Leaderboard(){
 const[data,setData]=useState<Row[]>([]),[loading,setLoading]=useState(true);
 const[guilds,setGuilds]=useState<Guild[]>([]),[activeTab,setActiveTab]=useState<'players'|'guilds'>('players');
 useEffect(()=>{(async()=>{if(!db){setData(testPlayers);setLoading(false);return}try{
  const snap=await getDocs(query(collection(db,'users'),orderBy('rankPoints','desc'),limit(100)));
  setData(fillPlayers(snap.docs.map(d=>{const raw=d.data(),rankPoints=Number(raw.rankPoints||0);return{uid:d.id,displayName:'Người chơi',photoURL:'',exp:0,wins:0,gamesPlayed:0,equipped:{},...raw,rankPoints,rank:rankFromPoints(rankPoints).label} as Row})));
 }catch{setData(testPlayers)}finally{setLoading(false)}})()},[]);
 useEffect(()=>{void listGuilds(100).then(rows=>setGuilds(fillGuilds(rows))).catch(()=>setGuilds(testGuilds))},[]);
 const topThree=[data[1],data[0],data[2]].filter(Boolean);
 return <section className="ranking-page ranking-war-page app-page">
  <header className="rank-war-hero app-hero">
   <div className="rank-war-scan"/><div className="rank-war-title"><span><Swords/> CHIẾN TUYẾN XẾP HẠNG</span><h1>ĐẠI SẢNH<br/><i>VINH DANH</i></h1></div>
   <div className="rank-season-card"><small>MÙA GIẢI HIỆN TẠI</small><b>SEASON 01</b><span><i/> ĐANG DIỄN RA</span></div>
  </header>
  <nav className="rank-war-tabs"><button className={activeTab==='players'?'active':''} onClick={()=>setActiveTab('players')}><Users/> CÁ NHÂN MẠNH NHẤT</button><button className={activeTab==='guilds'?'active':''} onClick={()=>setActiveTab('guilds')}><Shield/> GUILD MẠNH NHẤT</button></nav>
  {activeTab==='guilds'?<section className="guild-ranking-board"><header><h2>BẢNG XẾP HẠNG GUILD</h2></header>{guilds.length?<><div className="guild-ranking-head"><span>HẠNG</span><span>GUILD</span><span>THÀNH VIÊN</span><span>LV GUILD</span><span>TỔNG CỐNG HIẾN</span></div><div className="guild-ranking-list">{guilds.map((guild,index)=><article className={index<3?`guild-top guild-top-${index+1}`:''} key={guild.id}><strong><small>HẠNG</small>{String(index+1).padStart(2,'0')}</strong><div className="guild-ranking-identity"><GuildBadgeMark id={guild.badge}/><div>{guild.tag&&<small>[{guild.tag}]</small>}<b>{guild.name}</b></div></div><span className="guild-member-total"><Users/><b>{guild.memberCount}</b></span><span className="guild-level-total"><Shield/><b>LV.{guild.guildLevel}</b></span><em><Coins/><b>{guild.totalContribution.toLocaleString('vi-VN')}</b></em></article>)}</div></>:<div className="rank-war-loading"><Shield/><span>CHƯA CÓ GUILD NÀO GHI DANH</span></div>}</section>:loading?<div className="rank-war-loading"><Shield/><span>ĐANG KẾT NỐI CHIẾN TUYẾN...</span></div>:data.length===0?<div className="rank-war-loading"><Shield/><span>CHƯA CÓ CHIẾN BINH NÀO GHI DANH</span></div>:<>
   <section className="rank-war-podium">
    <header><h2>BA NGƯỜI DẪN ĐẦU</h2></header>
    <div className="rank-war-top-grid">{topThree.map(row=>{const actualIndex=data.indexOf(row),place=actualIndex+1,Icon=place===1?Crown:place===2?Medal:Trophy,hasTitle=Boolean(itemById(row.equipped?.title));return <Link to={profileUrl(row.displayName)} className={`rank-war-champion place-${place}`} key={row.uid}>
     <div className="champion-place"><Icon/><span>HẠNG</span><b>0{place}</b></div>
     <PlayerIdentity player={{name:`${row.displayName} · Lv.${levelFromExp(row.exp)}`,photoURL:row.photoURL,equipped:row.equipped}} hideSubtitle={!hasTitle}/>
     <div className="champion-score"><strong><Star/><span>{row.rank} - {rankStars(row.rankPoints)} SAO</span></strong></div>
     <div className="champion-record"><span><b>{row.wins}</b> THẮNG</span><span><b>{winRate(row)}%</b> TỈ LỆ</span><span><b>Lv.{levelFromExp(row.exp)}</b> CẤP</span></div>
    </Link>})}</div>
   </section>
   <section className="rank-war-board">
    <header><div><span>GLOBAL RANKING</span><h2>BẢNG CHIẾN TÍCH</h2></div><p><Star/> Xếp theo số sao hiện tại</p></header>
    <div className="rank-war-head"><span>HẠNG</span><span>CHIẾN BINH</span><span>BẬC</span><span>THẮNG</span><span>TỈ LỆ THẮNG</span><span/></div>
    <div className="rank-war-list">{data.slice(3).map((row,index)=>{const place=index+4,hasTitle=Boolean(itemById(row.equipped?.title));return <Link to={profileUrl(row.displayName)} className="rank-war-row" key={row.uid}>
     <strong className="rank-war-number"><b>{String(place).padStart(2,'0')}</b></strong>
     <PlayerIdentity compact player={{name:`${row.displayName} · Lv.${levelFromExp(row.exp)}`,photoURL:row.photoURL,equipped:row.equipped}} hideSubtitle={!hasTitle}/>
     <span className="rank-war-tier" style={{'--tier-color':rankFromPoints(row.rankPoints).color} as React.CSSProperties}><Shield/>{row.rank} - {rankStars(row.rankPoints)} SAO</span>
     <strong className="rank-war-wins">{row.wins.toLocaleString('vi-VN')}</strong>
     <span className="rank-war-form"><i style={{width:`${winRate(row)}%`}}/><b>{winRate(row)}%</b></span>
     <ChevronRight className="rank-war-arrow"/>
    </Link>})}</div>
   </section>
  </>}
 </section>;
}
