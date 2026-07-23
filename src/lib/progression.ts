export type RankTier={name:string;shortName:string;min:number;color:string};

export const MAX_LEVEL=50;

// EXP tích lũy: đầu game lên cấp nhanh, các cấp sau tăng đều và có giới hạn rõ ràng.
export const expForLevel=(level:number)=>{
 const safe=Math.max(1,Math.min(MAX_LEVEL,Math.floor(level)));
 const n=safe-1;
 return n*100+n*(n-1)*25;
};

export const levelFromExp=(exp:number)=>{
 const safe=Math.max(0,Number(exp)||0);
 let low=1,high=MAX_LEVEL;
 while(low<high){const mid=Math.ceil((low+high)/2);if(expForLevel(mid)<=safe)low=mid;else high=mid-1}
 return low;
};

export const levelProgress=(exp:number)=>{
 const level=levelFromExp(exp),start=expForLevel(level);
 if(level>=MAX_LEVEL)return {level,current:0,required:0,percent:100,isMax:true};
 const required=expForLevel(level+1)-start,current=Math.max(0,exp-start);
 return {level,current,required,percent:Math.min(100,Math.round(current/required*100)),isMax:false};
};

export const RANK_TIERS:RankTier[]=[
 {name:'Đồng',shortName:'Đồng',min:0,color:'#b87945'},
 {name:'Bạc',shortName:'Bạc',min:800,color:'#aebdcc'},
 {name:'Vàng',shortName:'Vàng',min:1100,color:'#e6b84f'},
 {name:'Bạch Kim',shortName:'B.Kim',min:1400,color:'#60d0c2'},
 {name:'Kim Cương',shortName:'K.Cương',min:1750,color:'#6fb8ff'},
 {name:'Cao Thủ',shortName:'Cao Thủ',min:2150,color:'#bb82ff'},
 {name:'Huyền Thoại',shortName:'H.Thoại',min:2600,color:'#ff776d'},
];

export const rankFromPoints=(points:number)=>[...RANK_TIERS].reverse().find(t=>points>=t.min)??RANK_TIERS[0];
export const rankFromExp=(exp:number)=>rankFromPoints(exp).name; // Tương thích code/dữ liệu cũ.
export const legacyRankPoints=(wins:number,losses:number)=>Math.max(0,1000+wins*24-losses*14);
export const rankDelta=(won:boolean,points:number)=>won?points<1400?28:24:points<800?-10:-18;
export const nextRank=(points:number)=>RANK_TIERS.find(t=>t.min>points);

export type MatchReward={exp:number;coins:number};
export const MATCH_REWARD_RANGES={win:{exp:[48,86] as const,coins:[65,125] as const},loss:{exp:[20,42] as const,coins:[24,58] as const}} as const;
const randomInt=(min:number,max:number)=>Math.floor(Math.random()*(max-min+1))+min;
export const rollMatchReward=(won:boolean,score=0):MatchReward=>{const range=won?MATCH_REWARD_RANGES.win:MATCH_REWARD_RANGES.loss;const contribution=Math.min(10,Math.max(0,Math.floor(score/2)));return{exp:randomInt(range.exp[0],range.exp[1])+contribution,coins:randomInt(range.coins[0],range.coins[1])+contribution}};
