import { GameState, discardCard } from './game';

export type PresenceStatus='online'|'disconnected'|'left';
export type MatchPresence=Record<string,{status:PresenceStatus;lastSeen:number;disconnectDeadline:number|null}>;
export type OnlineMatch={
 roomId:string;
 participantIds:string[];
 state:GameState;
 presence:MatchPresence;
 autoDiscardCounts:Record<string,number>;
 turnStartedAt:number;
 turnDeadline:number;
 revision:number;
};
export type OnlineMatchDocument=Omit<OnlineMatch,'state'>&{stateJson:string};

export const TURN_MS=10_000;
export const RECONNECT_MS=60_000;

export const createPresence=(ids:string[],now=Date.now()):MatchPresence=>Object.fromEntries(ids.map(id=>[id,{status:'online',lastSeen:now,disconnectDeadline:null}]));
export const encodeOnlineMatch=(match:OnlineMatch):OnlineMatchDocument=>{
 const{state,...rest}=match;
 return{...rest,stateJson:JSON.stringify(state)};
};
export const decodeOnlineMatch=(data:OnlineMatchDocument):OnlineMatch=>{
 const{stateJson,...rest}=data;
 return{...rest,autoDiscardCounts:rest.autoDiscardCounts||{},state:JSON.parse(stateJson) as GameState};
};

const nextActiveTurn=(match:OnlineMatch,from:number)=>{
 const total=match.state.players.length;
 for(let step=1;step<=total;step++){
  const index=(from+step)%total;
  const player=match.state.players[index];
  if(player.isBot||match.presence[player.id]?.status!=='left')return index;
 }
 return from;
};

export const applyPresenceRules=(match:OnlineMatch,now=Date.now()):OnlineMatch=>{
 const next=structuredClone(match) as OnlineMatch;
 for(const player of next.state.players){
  if(player.isBot)continue;
  const presence=next.presence[player.id];
  if(!presence)continue;
  if(presence.status==='online'&&now-presence.lastSeen>12_000){
   presence.status='disconnected';
   presence.disconnectDeadline=presence.lastSeen+RECONNECT_MS;
  }
  if(presence.status==='disconnected'&&presence.disconnectDeadline!==null&&now>=presence.disconnectDeadline)presence.status='left';
 }
 if(next.state.winner)return next;
 const wolves=next.state.players.filter(player=>player.role==='wolf');
 const miners=next.state.players.filter(player=>player.role==='miner');
 const hasLeft=(player:GameState['players'][number])=>!player.isBot&&next.presence[player.id]?.status==='left';
 if(wolves.length&&wolves.every(hasLeft)){
  next.state.winner='miners';
  next.state.logs.unshift('Toàn bộ phe Sói đã rời trận. Thợ đào chiến thắng.');
 }else if(miners.length&&miners.every(hasLeft)){
  next.state.winner='wolves';
  next.state.logs.unshift('Không còn Thợ đào trong trận. Phe Sói chiến thắng.');
 }
 if(!next.state.winner&&next.presence[next.state.players[next.state.turn].id]?.status==='left'){
  next.state.turn=nextActiveTurn(next,next.state.turn);
  next.turnStartedAt=now;
  next.turnDeadline=now+TURN_MS;
 }
 return next;
};

export const timeoutTurn=(match:OnlineMatch,now=Date.now()):OnlineMatch=>{
 let next=applyPresenceRules(match,now);
 if(next.state.winner||now<next.turnDeadline)return next;
 const player=next.state.players[next.state.turn];
 if(!player||player.hand.length===0){
  next=structuredClone(next) as OnlineMatch;
  next.state.turn=nextActiveTurn(next,next.state.turn);
  next.state.turns++;
  next.state.logs.unshift(`${player?.name||'Người chơi'} hết thời gian và bị bỏ lượt.`);
 }else{
  const index=Math.floor(Math.random()*player.hand.length);
  const advanced=discardCard(next.state,next.state.turn,index);
  next={...next,state:advanced};
  const count=(next.autoDiscardCounts[player.id]||0)+1;
  next.autoDiscardCounts[player.id]=count;
  next.state.logs[0]=`${player.name} hết 10 giây — hệ thống tự bỏ một lá ngẫu nhiên (${count}/3).`;
  if(!player.isBot&&count>=3&&next.presence[player.id]){
   next.presence[player.id]={...next.presence[player.id],status:'left',disconnectDeadline:null,lastSeen:now};
   next.state.logs.unshift(`${player.name} đã bị mời khỏi phòng vì tự động bỏ lượt 3 lần.`);
  }
  if(next.presence[next.state.players[next.state.turn].id]?.status==='left')next.state.turn=nextActiveTurn(next,next.state.turn);
 }
 next.turnStartedAt=now;
 next.turnDeadline=now+TURN_MS;
 next.revision++;
 return applyPresenceRules(next,now);
};
