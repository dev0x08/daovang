import { useState } from 'react';
import { CalendarDays, CalendarRange, Check, Coins, Crown, Flag, GraduationCap, Sparkles } from 'lucide-react';
import GameEmblem from '../components/GameEmblem';
import { useAuth } from '../context/AuthContext';
import { MISSION_GROUPS, missionProgress, todayKey, weekKey, type MissionKind } from '../lib/missions';
import { levelProgress, rankFromPoints, rankStars } from '../lib/progression';

const icons = { daily: CalendarDays, progression: GraduationCap, basic: Flag, weekly: CalendarRange };

export default function Missions() {
  const { profile, claimMission } = useAuth();
  const [activeKind, setActiveKind] = useState<MissionKind>('daily');
  if (!profile) return null;

  const data = {
    ...profile,
    ...(profile.missionDate === todayKey() ? {} : { onlineSecondsToday: 0, dailyGames: 0, dailyWins: 0, dailyChats: 0, claimedDailyMissions: [] }),
    ...(profile.weekDate === weekKey() ? {} : { weeklyGames: 0, weeklyWins: 0, weeklyChats: 0, claimedWeeklyMissions: [] }),
  };
  const level = levelProgress(profile.exp);
  const tier = rankFromPoints(profile.rankPoints);
  const claimedIds = (kind: MissionKind) => kind === 'daily' ? data.claimedDailyMissions : kind === 'weekly' ? data.claimedWeeklyMissions : data.claimedAchievements;
  const activeGroup = MISSION_GROUPS.find(group => group.kind === activeKind) || MISSION_GROUPS[0];
  const ActiveIcon = icons[activeGroup.kind];
  const activeClaimed = claimedIds(activeGroup.kind);
  const totalClaimed = MISSION_GROUPS.flatMap(group => group.missions).filter(mission => claimedIds(mission.kind).includes(mission.id)).length;

  return <section className="missions-page ui-v2-page app-page">
    <header className="missions-hero app-hero">
      <div>
        <span>TRUNG TÂM NHIỆM VỤ</span>
        <h1>HÀNH TRÌNH THỢ MỎ</h1>
        <p>Hoàn thành thử thách, nhận EXP và vàng để phát triển hồ sơ của bạn.</p>
        <div className="mission-overview">
          <div><small>LV.</small><b>{level.level}</b><span>{level.isMax ? 'Tối đa' : `${level.current}/${level.required} EXP`}</span></div>
          <div><small>XẾP HẠNG</small><b>{tier.label}</b><span>★ {rankStars(profile.rankPoints)} sao</span></div>
        </div>
      </div>
      <div className="mission-level"><GameEmblem icon={Crown} size="lg" tone="violet"/><small>TIẾN ĐỘ</small><b>{totalClaimed}</b><em>NHIỆM VỤ ĐÃ NHẬN</em></div>
    </header>

    <nav className="mission-category-nav" aria-label="Lọc nhóm nhiệm vụ">
      {MISSION_GROUPS.map(group => {
        const Icon = icons[group.kind];
        const done = group.missions.filter(mission => claimedIds(group.kind).includes(mission.id)).length;
        return <button type="button" className={activeKind === group.kind ? 'active' : ''} onClick={() => setActiveKind(group.kind)} key={group.kind}>
          <Icon/><span>{group.title}<small>{done}/{group.missions.length} hoàn thành</small></span><b>{group.missions.length - done}</b>
        </button>;
      })}
    </nav>

    <section className="mission-category active" id={`mission-${activeGroup.kind}`}>
      <div className="mission-section-title">
        <GameEmblem icon={ActiveIcon} tone={activeGroup.kind === 'weekly' || activeGroup.kind === 'progression' ? 'violet' : 'gold'}/>
        <div><h2>{activeGroup.title}</h2><p>{activeGroup.description}</p></div>
        <strong>{activeClaimed.length}/{activeGroup.missions.length}</strong>
      </div>
      <div className="mission-list">
        {activeGroup.missions.map(mission => {
          const progress = missionProgress(mission, data);
          const done = progress >= mission.target;
          const isClaimed = activeClaimed.includes(mission.id);
          const percent = Math.min(100, Math.round(progress / mission.target * 100));
          return <article className={`mission-row ${done ? 'done' : ''} ${isClaimed ? 'claimed' : ''}`} key={mission.id}>
            <div className="mission-check">{done ? <Check/> : <span/>}</div>
            <div className="mission-copy">
              <h3>{mission.title}</h3><p>{mission.description}</p>
              <div className="mission-progress"><i style={{ width: `${percent}%` }}/><em>{Math.min(progress, mission.target).toLocaleString('vi-VN')} / {mission.target.toLocaleString('vi-VN')}</em></div>
            </div>
            <div className="mission-row-reward">
              <span><Coins/>+{mission.rewardCoins}</span><span><Sparkles/>+{mission.rewardExp} EXP</span>
              <button className="btn btn-small btn-primary" disabled={!done || isClaimed} onClick={() => void claimMission(mission.id)}>{isClaimed ? 'ĐÃ NHẬN' : done ? 'NHẬN' : 'ĐANG LÀM'}</button>
            </div>
          </article>;
        })}
      </div>
    </section>
  </section>;
}
