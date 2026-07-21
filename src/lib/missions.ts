import { levelFromExp } from './progression';

export type MissionKind='daily'|'achievement';
export type MissionMetric='online'|'dailyGames'|'dailyWins'|'dailyChats'|'level'|'wins'|'gamesPlayed'|'ownedItems'|'coins';
export type Mission={id:string;title:string;description:string;kind:MissionKind;metric:MissionMetric;target:number;rewardCoins:number;rewardExp:number};

export const MISSIONS:Mission[]=[
 {id:'daily-login',title:'Điểm danh hôm nay',description:'Đăng nhập vào game trong ngày.',kind:'daily',metric:'online',target:1,rewardCoins:50,rewardExp:10},
 {id:'daily-online-10',title:'Thợ mỏ chăm chỉ',description:'Online đủ 10 phút trong hôm nay.',kind:'daily',metric:'online',target:600,rewardCoins:40,rewardExp:20},
 {id:'daily-online-30',title:'Bám trụ trong hầm',description:'Online đủ 30 phút trong hôm nay.',kind:'daily',metric:'online',target:1800,rewardCoins:90,rewardExp:35},
 {id:'daily-play-1',title:'Khởi động cuốc đào',description:'Hoàn thành 1 trận trong hôm nay.',kind:'daily',metric:'dailyGames',target:1,rewardCoins:45,rewardExp:25},
 {id:'daily-play-3',title:'Ba chuyến xuống hầm',description:'Hoàn thành 3 trận trong hôm nay.',kind:'daily',metric:'dailyGames',target:3,rewardCoins:110,rewardExp:50},
 {id:'daily-win-1',title:'Chiến thắng đầu ngày',description:'Thắng 1 trận trong hôm nay.',kind:'daily',metric:'dailyWins',target:1,rewardCoins:100,rewardExp:60},
 {id:'daily-chat-3',title:'Giao lưu đồng đội',description:'Gửi 3 tin nhắn hợp lệ trong hôm nay.',kind:'daily',metric:'dailyChats',target:3,rewardCoins:25,rewardExp:10},
 {id:'level-5',title:'Thợ đào tập sự',description:'Đạt cấp 5.',kind:'achievement',metric:'level',target:5,rewardCoins:250,rewardExp:80},
 {id:'level-10',title:'Thợ đào lão luyện',description:'Đạt cấp 10.',kind:'achievement',metric:'level',target:10,rewardCoins:600,rewardExp:160},
 {id:'level-20',title:'Huyền thoại lòng đất',description:'Đạt cấp 20.',kind:'achievement',metric:'level',target:20,rewardCoins:1500,rewardExp:400},
 {id:'wins-10',title:'Chuỗi chiến công',description:'Thắng tổng cộng 10 trận.',kind:'achievement',metric:'wins',target:10,rewardCoins:400,rewardExp:120},
 {id:'wins-50',title:'Kẻ chinh phục',description:'Thắng tổng cộng 50 trận.',kind:'achievement',metric:'wins',target:50,rewardCoins:1600,rewardExp:450},
 {id:'games-100',title:'Người không biết mệt',description:'Hoàn thành tổng cộng 100 trận.',kind:'achievement',metric:'gamesPlayed',target:100,rewardCoins:1800,rewardExp:500},
 {id:'items-5',title:'Nhà sưu tầm',description:'Sở hữu 5 vật phẩm trong cửa hàng.',kind:'achievement',metric:'ownedItems',target:5,rewardCoins:500,rewardExp:100},
 {id:'coins-5000',title:'Kho vàng cá nhân',description:'Tích lũy 5.000 vàng tại một thời điểm.',kind:'achievement',metric:'coins',target:5000,rewardCoins:700,rewardExp:150},
];

export const todayKey=()=>new Date().toLocaleDateString('en-CA');
export const missionProgress=(mission:Mission,data:any)=>{
 switch(mission.metric){
  case 'online': return Number(data.onlineSecondsToday||0);
  case 'dailyGames': return Number(data.dailyGames||0);
  case 'dailyWins': return Number(data.dailyWins||0);
  case 'dailyChats': return Number(data.dailyChats||0);
  case 'level': return levelFromExp(Number(data.exp||0));
  case 'wins': return Number(data.wins||0);
  case 'gamesPlayed': return Number(data.gamesPlayed||0);
  case 'ownedItems': return Array.isArray(data.ownedItems)?data.ownedItems.length:0;
  case 'coins': return Number(data.coins||0);
 }
};
