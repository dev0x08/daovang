import { Check, Clock3, Coins, Gift, Sparkles, Target, Trophy } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { levelFromExp } from '../lib/progression';
import { MISSIONS, missionProgress, todayKey } from '../lib/missions';

export default function Missions(){
 const{profile,claimMission}=useAuth();
 if(!profile)return null;
 const data=profile.missionDate===todayKey()?profile:{...profile,onlineSecondsToday:0,dailyGames:0,dailyWins:0,dailyChats:0,claimedDailyMissions:[]};
 const render=(kind:'daily'|'achievement')=><div className="mission-grid">{MISSIONS.filter(m=>m.kind===kind).map(m=>{const progress=missionProgress(m,data);const done=progress>=m.target;const claimed=m.kind==='daily'?(data.claimedDailyMissions||[]).includes(m.id):(profile.claimedAchievements||[]).includes(m.id);const percent=Math.min(100,Math.round(progress/m.target*100));return <article className={`mission-card ${done?'done':''} ${claimed?'claimed':''}`} key={m.id}><div className="mission-icon">{claimed?<Check/>:kind==='daily'?<Clock3/>:<Trophy/>}</div><div className="mission-main"><span>{kind==='daily'?'NHIỆM VỤ NGÀY':'THÀNH TỰU'}</span><h3>{m.title}</h3><p>{m.description}</p><div className="mission-progress"><i style={{width:`${percent}%`}}/></div><small>{Math.min(progress,m.target).toLocaleString('vi-VN')} / {m.target.toLocaleString('vi-VN')}</small></div><div className="mission-reward"><b><Coins/> +{m.rewardCoins}</b><b><Sparkles/> +{m.rewardExp}</b><button className="btn btn-small btn-primary" disabled={!done||claimed} onClick={()=>void claimMission(m.id)}>{claimed?'ĐÃ NHẬN':'NHẬN THƯỞNG'}</button></div></article>})}</div>;
 return <section className="missions-page"><header className="missions-hero"><div><span>TRUNG TÂM NHIỆM VỤ</span><h1>ĐÀO VÀNG, LÊN CẤP, NHẬN THƯỞNG</h1><p>Tiến độ online chỉ tăng khi tab game đang hiển thị. Nhiệm vụ ngày tự làm mới mỗi ngày.</p></div><div className="mission-level"><Target/><small>CẤP HIỆN TẠI</small><b>{levelFromExp(profile.exp)}</b></div></header><div className="mission-section-title"><Gift/><div><h2>NHIỆM VỤ HẰNG NGÀY</h2><p>Hoàn thành và nhận thưởng trước khi sang ngày mới.</p></div></div>{render('daily')}<div className="mission-section-title"><Trophy/><div><h2>THÀNH TỰU DÀI HẠN</h2><p>Mỗi cột mốc chỉ nhận được một lần.</p></div></div>{render('achievement')}</section>
}
