export const MAX_GUILD_LEVEL = 5;

export const GUILD_LEVEL_REWARDS: Record<number, { treasuryCoins: number; memberExp: number }> = {
  2: { treasuryCoins: 50, memberExp: 20 },
  3: { treasuryCoins: 100, memberExp: 40 },
  4: { treasuryCoins: 150, memberExp: 60 },
  5: { treasuryCoins: 200, memberExp: 100 },
};

export const GUILD_LEVELS = [
  { level: 1, expToNext: 500, memberLimit: 10, shopSlots: 5 },
  { level: 2, expToNext: 1200, memberLimit: 15, shopSlots: 7 },
  { level: 3, expToNext: 2500, memberLimit: 20, shopSlots: 10 },
  { level: 4, expToNext: 5000, memberLimit: 25, shopSlots: 13 },
  { level: 5, expToNext: 0, memberLimit: 30, shopSlots: 18 },
] as const;

export type GuildMissionMetric = 'login' | 'games' | 'wins' | 'thanks' | 'gold';
export type GuildMissionPeriod = 'daily' | 'weekly';
export type GuildMission = {
  id: string;
  title: string;
  description: string;
  period: GuildMissionPeriod;
  metric: GuildMissionMetric;
  target: number;
  reward: number;
};

export const GUILD_MISSIONS: GuildMission[] = [
  { id: 'guild-daily-login-v1', title: 'Điểm danh thợ mỏ', description: 'Đăng nhập trong ngày.', period: 'daily', metric: 'login', target: 1, reward: 10 },
  { id: 'guild-daily-play-3-v1', title: 'Xuống hầm', description: 'Hoàn thành 3 trận hợp lệ.', period: 'daily', metric: 'games', target: 3, reward: 10 },
  { id: 'guild-daily-win-1-v1', title: 'Mang vàng trở về', description: 'Thắng 1 trận hợp lệ.', period: 'daily', metric: 'wins', target: 1, reward: 10 },
  { id: 'guild-daily-gold-100-v1', title: 'Bồi đắp ngân khố', description: 'Đóng góp ít nhất 100 vàng.', period: 'daily', metric: 'gold', target: 100, reward: 10 },
  { id: 'guild-weekly-play-20-v1', title: 'Đội khai phá', description: 'Hoàn thành 20 trận trong tuần.', period: 'weekly', metric: 'games', target: 20, reward: 20 },
  { id: 'guild-weekly-win-5-v1', title: 'Mạch thắng Guild', description: 'Thắng 5 trận trong tuần.', period: 'weekly', metric: 'wins', target: 5, reward: 20 },
  { id: 'guild-weekly-gold-1000-v1', title: 'Kho vàng chung', description: 'Đóng góp 1.000 vàng trong tuần.', period: 'weekly', metric: 'gold', target: 1000, reward: 20 },
];

export type GuildMissionProgress = {
  dailyKey?: string;
  weeklyKey?: string;
  daily?: Partial<Record<GuildMissionMetric, number>>;
  weekly?: Partial<Record<GuildMissionMetric, number>>;
  claimedDaily?: string[];
  claimedWeekly?: string[];
};

export const guildLevelConfig = (level: number) =>
  GUILD_LEVELS[Math.max(0, Math.min(MAX_GUILD_LEVEL - 1, Math.floor(level || 1) - 1))];

export const advanceGuildLevel = (rawLevel: number, rawExp: number, gainedExp: number) => {
  let level = Math.max(1, Math.min(MAX_GUILD_LEVEL, Math.floor(rawLevel || 1)));
  let exp = Math.max(0, Math.floor(rawExp || 0)) + Math.max(0, Math.floor(gainedExp || 0));
  const levelsGained: number[] = [];
  while (level < MAX_GUILD_LEVEL) {
    const required = guildLevelConfig(level).expToNext;
    if (exp < required) break;
    exp -= required;
    level += 1;
    levelsGained.push(level);
  }
  if (level >= MAX_GUILD_LEVEL) exp = 0;
  return { level, exp, levelsGained };
};

export const guildLevelProgress = (level: number, exp: number) => {
  const safeLevel = Math.max(1, Math.min(MAX_GUILD_LEVEL, Math.floor(level || 1)));
  const required = guildLevelConfig(safeLevel).expToNext;
  const current = safeLevel >= MAX_GUILD_LEVEL ? 0 : Math.max(0, Math.floor(exp || 0));
  return {
    level: safeLevel,
    current,
    required,
    percent: safeLevel >= MAX_GUILD_LEVEL ? 100 : Math.min(100, Math.round(current / required * 100)),
    isMax: safeLevel >= MAX_GUILD_LEVEL,
    memberLimit: guildLevelConfig(safeLevel).memberLimit,
  };
};

export const missionValue = (progress: GuildMissionProgress | undefined, mission: GuildMission) => {
  const bucket = mission.period === 'daily' ? progress?.daily : progress?.weekly;
  return Math.max(0, Number(bucket?.[mission.metric] || 0));
};
