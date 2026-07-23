import { levelFromExp } from './progression';

export type MissionKind='daily'|'achievement';
export type MissionMetric='online'|'dailyGames'|'dailyWins'|'dailyChats'|'level'|'wins'|'gamesPlayed'|'ownedItems'|'coins'|'rankPoints';
export type Mission={id:string;title:string;description:string;kind:MissionKind;metric:MissionMetric;target:number;rewardCoins:number;rewardExp:number};

export const DAILY_MISSIONS:Mission[]=[
 {id:'daily-login-v2',title:'Điểm danh thợ mỏ',description:'Có mặt trong game hôm nay.',kind:'daily',metric:'online',target:1,rewardCoins:30,rewardExp:15},
 {id:'daily-online-15-v2',title:'Ca làm trong hầm',description:'Online đủ 15 phút hôm nay.',kind:'daily',metric:'online',target:900,rewardCoins:60,rewardExp:30},
 {id:'daily-play-2-v2',title:'Hai chuyến khai phá',description:'Hoàn thành 2 trận hôm nay.',kind:'daily',metric:'dailyGames',target:2,rewardCoins:80,rewardExp:45},
 {id:'daily-win-1-v2',title:'Kho báu đầu ngày',description:'Thắng 1 trận hôm nay.',kind:'daily',metric:'dailyWins',target:1,rewardCoins:100,rewardExp:55},
 {id:'daily-chat-3-v2',title:'Tín hiệu trong hầm',description:'Gửi 3 tin nhắn hợp lệ hôm nay.',kind:'daily',metric:'dailyChats',target:3,rewardCoins:25,rewardExp:15},
];

export const ACHIEVEMENTS:Mission[]=[
 {id:'level-5-v2',title:'Thợ đào tập sự',description:'Đạt cấp 5.',kind:'achievement',metric:'level',target:5,rewardCoins:200,rewardExp:0},
 {id:'level-10-v2',title:'Thợ đào lão luyện',description:'Đạt cấp 10.',kind:'achievement',metric:'level',target:10,rewardCoins:450,rewardExp:0},
 {id:'level-25-v2',title:'Bậc thầy lòng đất',description:'Đạt cấp 25.',kind:'achievement',metric:'level',target:25,rewardCoins:1200,rewardExp:0},
 {id:'wins-10-v2',title:'Mười lần khải hoàn',description:'Thắng tổng cộng 10 trận.',kind:'achievement',metric:'wins',target:10,rewardCoins:350,rewardExp:100},
 {id:'wins-50-v2',title:'Kẻ chinh phục',description:'Thắng tổng cộng 50 trận.',kind:'achievement',metric:'wins',target:50,rewardCoins:1400,rewardExp:300},
 {id:'games-100-v2',title:'Không biết mệt',description:'Hoàn thành 100 trận.',kind:'achievement',metric:'gamesPlayed',target:100,rewardCoins:1600,rewardExp:350},
 {id:'rank-gold-v2',title:'Ánh vàng dưới mỏ',description:'Chạm mốc rank Vàng (1.100 RP).',kind:'achievement',metric:'rankPoints',target:1100,rewardCoins:300,rewardExp:75},
 {id:'rank-diamond-v2',title:'Mạch kim cương',description:'Chạm mốc rank Kim Cương (1.750 RP).',kind:'achievement',metric:'rankPoints',target:1750,rewardCoins:1000,rewardExp:250},
 {id:'items-5-v2',title:'Nhà sưu tầm',description:'Sở hữu 5 vật phẩm cửa hàng.',kind:'achievement',metric:'ownedItems',target:5,rewardCoins:450,rewardExp:80},
 {id:'coins-5000-v2',title:'Kho vàng cá nhân',description:'Giữ 5.000 vàng cùng lúc.',kind:'achievement',metric:'coins',target:5000,rewardCoins:600,rewardExp:100},
];

export const MISSIONS=[...DAILY_MISSIONS,...ACHIEVEMENTS];
export const todayKey=()=>new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Ho_Chi_Minh'}).format(new Date());
export const secondsUntilDailyReset=()=>{const now=new Date(),parts=new Intl.DateTimeFormat('en-US',{timeZone:'Asia/Ho_Chi_Minh',hour12:false,year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',second:'2-digit'}).formatToParts(now);const get=(x:string)=>Number(parts.find(p=>p.type===x)?.value||0);const local=Date.UTC(get('year'),get('month')-1,get('day'),get('hour')%24,get('minute'),get('second'));return Math.max(0,86400-Math.floor((local%86400000)/1000))};
export const missionProgress=(mission:Mission,data:any)=>{switch(mission.metric){case'online':return Number(data.onlineSecondsToday||0);case'dailyGames':return Number(data.dailyGames||0);case'dailyWins':return Number(data.dailyWins||0);case'dailyChats':return Number(data.dailyChats||0);case'level':return levelFromExp(Number(data.exp||0));case'wins':return Number(data.wins||0);case'gamesPlayed':return Number(data.gamesPlayed||0);case'ownedItems':return Array.isArray(data.ownedItems)?data.ownedItems.length:0;case'coins':return Number(data.coins||0);case'rankPoints':return Number(data.rankPoints||0)}};
