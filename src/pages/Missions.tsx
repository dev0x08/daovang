import { Check, Clock3, Coins, Gift, Sparkles, Target, Trophy, Gamepad2, MessageCircle, Timer, Crown, ShoppingBag, Vault, Medal } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { levelFromExp } from '../lib/progression';
import { MISSIONS, missionProgress, todayKey, type Mission } from '../lib/missions';
import GameEmblem from '../components/GameEmblem';
const missionIcon=(m:Mission)=>m.metric==='online'?Timer:m.metric==='dailyGames'||m.metric==='gamesPlayed'?Gamepad2:m.metric==='dailyWins'||m.metric==='wins'?Crown:m.metric==='dailyChats'?MessageCircle:m.metric==='ownedItems'?ShoppingBag:m.metric==='coins'?Vault:m.metric==='level'?Medal:Target;
export default function Missions(){
 const{profile,claimMission}=useAuth();if(!profile)return null;
 const data=profile.missionDate===todayKey()?profile:{...profile,onlineSecondsToday:0,dailyGames:0,dailyWins:0,dailyChats:0,claimedDailyMissions:[]};
 const render=(kind:'daily'|'achievement')=><div className="mission-grid">{MISSIONS.filter(m=>m.kind===kind).map(m=>{const progress=missionProgress(m,data);const done=progress>=m.target;const claimed=m.kind==='daily'?(data.claimedDailyMissions||[]).includes(m.id):(profile.claimedAchievements||[]).includes(m.id);const percent=Math.min(100,Math.round(progress/m.target*100));const Icon=missionIcon(m);return <article className={`mission-card ${done?'done':''} ${claimed?'claimed':''}`} key={m.id}>
  <div className="mission-icon"><GameEmblem icon={claimed?Check:Icon} tone={claimed?'emerald':kind==='daily'?'gold':'violet'}/></div>
  <div className="mission-main"><span>{kind==='daily'?'NHIỆM VỤ NGÀY':'THÀNH TỰU'}</span><h3>{m.title}</h3><p>{m.description}</p><div className="mission-progress"><i style={{width:`${percent}%`}}/><em>{percent}%</em></div><small>{Math.min(progress,m.target).toLocaleString('vi-VN')} / {m.target.toLocaleString('vi-VN')}</small></div>
  <div className="mission-reward"><div className="reward-chip coin"><Coins/> <b>+{m.rewardCoins}</b></div><div className="reward-chip exp"><Sparkles/> <b>+{m.rewardExp}</b></div><button className="btn btn-small btn-primary" disabled={!done||claimed} onClick={()=>void claimMission(m.id)}>{claimed?'ĐÃ NHẬN':done?'NHẬN THƯỞNG':'CHƯA HOÀN THÀNH'}</button></div>
 </article>})}</div>;
 return <section className="missions-page ui-v2-page"><header className="missions-hero"><div><span>TRUNG TÂM NHIỆM VỤ</span><h1>ĐÀO VÀNG, LÊN CẤP, NHẬN THƯỞNG</h1><p>Tiến độ online chỉ tăng khi tab game đang hiển thị. Nhiệm vụ ngày tự làm mới mỗi ngày.</p></div><div className="mission-level"><GameEmblem icon={Target} size="lg"/><small>CẤP HIỆN TẠI</small><b>{levelFromExp(profile.exp)}</b></div></header><div className="mission-section-title"><GameEmblem icon={Gift}/><div><h2>NHIỆM VỤ HẰNG NGÀY</h2><p>Hoàn thành và nhận thưởng trước khi sang ngày mới.</p></div></div>{render('daily')}<div className="mission-section-title"><GameEmblem icon={Trophy} tone="violet"/><div><h2>THÀNH TỰU DÀI HẠN</h2><p>Mỗi cột mốc chỉ nhận được một lần.</p></div></div>{render('achievement')}</section>
}
