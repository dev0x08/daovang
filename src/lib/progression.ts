export type RankTier={id:string;name:string;shortName:string;min:number;max:number;color:string;divisions:boolean};
export type RankInfo=RankTier&{division:null|'IV'|'III'|'II'|'I';label:string;divisionMin:number;divisionMax:number;progress:number;nextLabel:string|null};
export type RankReward={tierId:string;coins:number;exp:number;items:string[]};

export const MAX_LEVEL=50;
export const ELO_K=32;

export const expForLevel=(level:number)=>{
 const safe=Math.max(1,Math.min(MAX_LEVEL,Math.floor(level))),n=safe-1;
 return n*100+n*(n-1)*25;
};

export const levelFromExp=(exp:number)=>{
 const safe=Math.max(0,Number(exp)||0);let low=1,high=MAX_LEVEL;
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
 {id:'iron',name:'Sắt',shortName:'Sắt',min:0,max:399,color:'#89939c',divisions:true},
 {id:'bronze',name:'Đồng',shortName:'Đồng',min:400,max:799,color:'#b87945',divisions:true},
 {id:'silver',name:'Bạc',shortName:'Bạc',min:800,max:1199,color:'#aebdcc',divisions:true},
 {id:'gold',name:'Vàng',shortName:'Vàng',min:1200,max:1599,color:'#e6b84f',divisions:true},
 {id:'platinum',name:'Bạch Kim',shortName:'B.Kim',min:1600,max:1999,color:'#60d0c2',divisions:true},
 {id:'diamond',name:'Kim Cương',shortName:'K.Cương',min:2000,max:2399,color:'#6fb8ff',divisions:true},
 {id:'master',name:'Cao Thủ',shortName:'Cao Thủ',min:2400,max:2699,color:'#bb82ff',divisions:false},
 {id:'challenger',name:'Thách Đấu',shortName:'Thách Đấu',min:2700,max:Number.MAX_SAFE_INTEGER,color:'#ff776d',divisions:false},
];

const DIVISIONS=['IV','III','II','I'] as const;
export const rankFromPoints=(rawPoints:number):RankInfo=>{
 const points=Math.max(0,Math.floor(Number(rawPoints)||0));
 const tier=[...RANK_TIERS].reverse().find(value=>points>=value.min)??RANK_TIERS[0];
 let division:RankInfo['division']=null,divisionMin=tier.min,divisionMax=tier.max;
 if(tier.divisions){
  const width=(tier.max-tier.min+1)/4,index=Math.min(3,Math.floor((points-tier.min)/width));
  division=DIVISIONS[index];divisionMin=Math.floor(tier.min+index*width);divisionMax=Math.floor(tier.min+(index+1)*width-1);
 }
 const nextTier=RANK_TIERS[RANK_TIERS.indexOf(tier)+1],label=division?`${tier.name} ${division}`:tier.name;
 return{...tier,division,label,divisionMin,divisionMax,progress:Math.min(100,Math.max(0,Math.round((points-divisionMin)/Math.max(1,divisionMax-divisionMin+1)*100))),nextLabel:division?(division==='I'?(nextTier?.name??null):`${tier.name} ${DIVISIONS[DIVISIONS.indexOf(division)+1]}`):(nextTier?.name??null)};
};
export const rankFromExp=(exp:number)=>rankFromPoints(exp).label;
export const rankStars=(points:number)=>{
 const rank=rankFromPoints(points);
 if(rank.divisions)return Math.min(4,Math.max(0,Math.floor((Math.max(0,points)-rank.divisionMin)/Math.max(1,(rank.divisionMax-rank.divisionMin+1)/5))));
 return Math.max(0,Math.floor((Math.max(0,points)-rank.min)/20));
};
export const legacyRankPoints=(wins:number,losses:number)=>Math.max(0,1000+wins*24-losses*14);
export const nextRank=(points:number)=>RANK_TIERS.find(tier=>tier.min>points);

export const calculateElo=(points:number,opponentPoints:number,won:boolean,currentStreak=0)=>{
 const safePoints=Math.max(0,Math.floor(points)),safeOpponent=Math.max(0,Math.floor(opponentPoints));
 const expected=1/(1+10**((safeOpponent-safePoints)/400)),baseDelta=Math.round(ELO_K*((won?1:0)-expected));
 const winStreak=won?Math.max(0,currentStreak)+1:0,streakBonus=won?Math.min(12,Math.max(0,winStreak-1)*2):0;
 const delta=baseDelta+streakBonus,pointsAfter=Math.max(0,safePoints+delta);
 return{pointsBefore:safePoints,pointsAfter,delta:pointsAfter-safePoints,expected,baseDelta,streakBonus,winStreak};
};
export const rankDelta=(won:boolean,points:number,opponentPoints=points,streak=0)=>calculateElo(points,opponentPoints,won,streak).delta;

export const RANK_REWARDS:RankReward[]=[
 {tierId:'bronze',coins:200,exp:50,items:[]},
 {tierId:'silver',coins:350,exp:100,items:['title-prospector']},
 {tierId:'gold',coins:500,exp:150,items:['piece-gold']},
 {tierId:'platinum',coins:700,exp:220,items:['title-frost-vein']},
 {tierId:'diamond',coins:1000,exp:300,items:['piece-crystal']},
 {tierId:'master',coins:1500,exp:450,items:['title-prism-seeker']},
 {tierId:'challenger',coins:2500,exp:700,items:['title-abyss']},
];
export const unlockedRankRewards=(before:number,after:number,claimed:string[])=>RANK_REWARDS.filter(reward=>!claimed.includes(reward.tierId)&&before<RANK_TIERS.find(tier=>tier.id===reward.tierId)!.min&&after>=RANK_TIERS.find(tier=>tier.id===reward.tierId)!.min);

export type MatchReward={exp:number;coins:number};
export const MATCH_CHEST_REWARD:MatchReward={exp:200,coins:500};
