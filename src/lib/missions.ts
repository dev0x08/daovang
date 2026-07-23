import { levelFromExp } from './progression';

export type MissionKind='daily'|'weekly'|'basic'|'progression';
export type MissionMetric='online'|'dailyGames'|'dailyWins'|'dailyChats'|'weeklyGames'|'weeklyWins'|'weeklyChats'|'level'|'rankPoints'|'wins'|'gamesPlayed'|'ownedItems'|'coins';
export type Mission={id:string;title:string;description:string;kind:MissionKind;metric:MissionMetric;target:number;rewardCoins:number;rewardExp:number};

export const DAILY_MISSIONS:Mission[]=[
 {id:'daily-win-1-v3',title:'Người Chiến Thắng',description:'Thắng 1 trận hôm nay.',kind:'daily',metric:'dailyWins',target:1,rewardCoins:80,rewardExp:40},
 {id:'daily-win-2-v3',title:'Chiến Binh Bất Bại',description:'Thắng 2 trận hôm nay.',kind:'daily',metric:'dailyWins',target:2,rewardCoins:140,rewardExp:70},
 {id:'daily-play-1-v3',title:'Bước Vào Hầm Mỏ',description:'Hoàn thành 1 trận hôm nay.',kind:'daily',metric:'dailyGames',target:1,rewardCoins:40,rewardExp:25},
 {id:'daily-play-3-v3',title:'Người Chơi Nhiệt Tình',description:'Hoàn thành 3 trận hôm nay.',kind:'daily',metric:'dailyGames',target:3,rewardCoins:100,rewardExp:55},
 {id:'daily-online-15-v3',title:'Thợ Đào Siêng Năng',description:'Online đủ 15 phút hôm nay.',kind:'daily',metric:'online',target:900,rewardCoins:60,rewardExp:30},
 {id:'daily-chat-3-v3',title:'Tiếng Vọng Đồng Đội',description:'Gửi 3 tin nhắn hợp lệ hôm nay.',kind:'daily',metric:'dailyChats',target:3,rewardCoins:30,rewardExp:15},
];

export const BASIC_MISSIONS:Mission[]=[
 {id:'basic-login-v3',title:'Chào Mừng',description:'Đăng nhập lần đầu.',kind:'basic',metric:'online',target:1,rewardCoins:100,rewardExp:20},
 {id:'basic-game-v3',title:'Bước Đầu',description:'Hoàn thành trận đầu tiên.',kind:'basic',metric:'gamesPlayed',target:1,rewardCoins:120,rewardExp:40},
 {id:'basic-win-v3',title:'Chiến Thắng Đầu Tiên',description:'Giành chiến thắng đầu tiên.',kind:'basic',metric:'wins',target:1,rewardCoins:180,rewardExp:60},
 {id:'basic-games-10-v3',title:'Thợ Đào Tập Sự',description:'Hoàn thành tổng cộng 10 trận.',kind:'basic',metric:'gamesPlayed',target:10,rewardCoins:350,rewardExp:100},
 {id:'basic-items-3-v3',title:'Nhà Sưu Tầm Mới',description:'Sở hữu 3 vật phẩm.',kind:'basic',metric:'ownedItems',target:3,rewardCoins:250,rewardExp:60},
];

export const PROGRESSION_MISSIONS:Mission[]=[
 {id:'progress-level-5-v3',title:'Lên Cấp 5',description:'Đạt Level 5.',kind:'progression',metric:'level',target:5,rewardCoins:200,rewardExp:0},
 {id:'progress-level-10-v3',title:'Lên Cấp 10',description:'Đạt Level 10.',kind:'progression',metric:'level',target:10,rewardCoins:450,rewardExp:0},
 {id:'progress-level-20-v3',title:'Lên Cấp 20',description:'Đạt Level 20.',kind:'progression',metric:'level',target:20,rewardCoins:900,rewardExp:0},
 {id:'progress-rank-gold-v3',title:'Đạt Rank Vàng',description:'Đạt 1.100 Rank Point.',kind:'progression',metric:'rankPoints',target:1100,rewardCoins:300,rewardExp:75},
 {id:'progress-rank-diamond-v3',title:'Đạt Rank Kim Cương',description:'Đạt 1.750 Rank Point.',kind:'progression',metric:'rankPoints',target:1750,rewardCoins:1000,rewardExp:250},
];

export const WEEKLY_MISSIONS:Mission[]=[
 {id:'weekly-win-10-v3',title:'Bậc Thầy Chiến Thắng',description:'Thắng 10 trận trong tuần.',kind:'weekly',metric:'weeklyWins',target:10,rewardCoins:700,rewardExp:250},
 {id:'weekly-play-20-v3',title:'Siêu Nhân',description:'Hoàn thành 20 trận trong tuần.',kind:'weekly',metric:'weeklyGames',target:20,rewardCoins:800,rewardExp:300},
 {id:'weekly-win-5-v3',title:'Chuỗi Khải Hoàn',description:'Thắng 5 trận trong tuần.',kind:'weekly',metric:'weeklyWins',target:5,rewardCoins:350,rewardExp:140},
 {id:'weekly-chat-20-v3',title:'Thủ Lĩnh Đồng Đội',description:'Gửi 20 tin nhắn hợp lệ trong tuần.',kind:'weekly',metric:'weeklyChats',target:20,rewardCoins:180,rewardExp:80},
];

export const MISSION_GROUPS=[
 {kind:'daily' as const,title:'Nhiệm Vụ Hằng Ngày',description:'Làm mới mỗi ngày lúc 00:00.',missions:DAILY_MISSIONS},
 {kind:'progression' as const,title:'Nhiệm Vụ Lên Cấp',description:'Các cột mốc Level và Rank vĩnh viễn.',missions:PROGRESSION_MISSIONS},
 {kind:'basic' as const,title:'Nhiệm Vụ Cơ Bản',description:'Dành cho người mới, chỉ hoàn thành một lần.',missions:BASIC_MISSIONS},
 {kind:'weekly' as const,title:'Nhiệm Vụ Hằng Tuần',description:'Làm mới vào thứ Hai hằng tuần.',missions:WEEKLY_MISSIONS},
];
export const MISSIONS=MISSION_GROUPS.flatMap(group=>group.missions);
export const todayKey=()=>new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Ho_Chi_Minh'}).format(new Date());
export const weekKey=()=>{const date=new Date(`${todayKey()}T00:00:00+07:00`),day=(date.getUTCDay()+6)%7;date.setUTCDate(date.getUTCDate()-day);return date.toISOString().slice(0,10)};
export const secondsUntilDailyReset=()=>{const now=new Date(),parts=new Intl.DateTimeFormat('en-US',{timeZone:'Asia/Ho_Chi_Minh',hour12:false,hour:'2-digit',minute:'2-digit',second:'2-digit'}).formatToParts(now),get=(x:string)=>Number(parts.find(p=>p.type===x)?.value||0);return Math.max(0,86400-(get('hour')%24*3600+get('minute')*60+get('second')))};
export const missionProgress=(mission:Mission,data:any)=>{switch(mission.metric){case'online':return Number(data.onlineSecondsToday||0);case'dailyGames':return Number(data.dailyGames||0);case'dailyWins':return Number(data.dailyWins||0);case'dailyChats':return Number(data.dailyChats||0);case'weeklyGames':return Number(data.weeklyGames||0);case'weeklyWins':return Number(data.weeklyWins||0);case'weeklyChats':return Number(data.weeklyChats||0);case'level':return levelFromExp(Number(data.exp||0));case'rankPoints':return Number(data.rankPoints||0);case'wins':return Number(data.wins||0);case'gamesPlayed':return Number(data.gamesPlayed||0);case'ownedItems':return Array.isArray(data.ownedItems)?data.ownedItems.length:0;case'coins':return Number(data.coins||0)}};
