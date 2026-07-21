export const levelFromExp=(exp:number)=>Math.floor(Math.sqrt(Math.max(0,exp)/80))+1;
export const expForLevel=(level:number)=>Math.max(0,(level-1)*(level-1)*80);
export const rankFromExp=(exp:number)=>{
 if(exp>=12000)return 'Huyền Thoại'; if(exp>=8000)return 'Kim Cương'; if(exp>=5000)return 'Bạch Kim';
 if(exp>=2800)return 'Vàng'; if(exp>=1200)return 'Bạc'; return 'Đồng';
};

export type MatchReward={exp:number;coins:number};
export const MATCH_REWARD_RANGES={
 win:{exp:[48,86] as const,coins:[65,125] as const},
 loss:{exp:[20,42] as const,coins:[24,58] as const}
} as const;

const randomInt=(min:number,max:number)=>Math.floor(Math.random()*(max-min+1))+min;
export const rollMatchReward=(won:boolean,score=0):MatchReward=>{
 const range=won?MATCH_REWARD_RANGES.win:MATCH_REWARD_RANGES.loss;
 // Điểm đóng góp chỉ tạo một khoản cộng nhỏ; kết quả trận vẫn là yếu tố chính.
 const contribution=Math.min(10,Math.max(0,Math.floor(score/2)));
 return {
  exp:randomInt(range.exp[0],range.exp[1])+contribution,
  coins:randomInt(range.coins[0],range.coins[1])+contribution
 };
};
