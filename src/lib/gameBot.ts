import { botMove, discardCard, GameState, useBlock, useRevive, useSwap } from './game';

// Handle the three deck-based interaction cards before falling back to the
// existing path/action AI. The legacy special flags are suppressed only in the
// temporary copy so bots cannot use abilities they did not draw.
export const botMoveWithDeckActions=(state:GameState):GameState=>{
 const idx=state.turn,player=state.players[idx];
 if(!player?.isBot||state.winner)return state;
 const others=state.players.map((value,index)=>({value,index})).filter(x=>x.index!==idx);
 const reviveIndex=player.hand.findIndex(card=>card.kind==='revive');
 if(reviveIndex>=0&&player.blockedTurns>0)return useRevive(state,idx,idx,reviveIndex);
 const blocked=others.find(x=>x.value.blockedTurns>0);
 if(reviveIndex>=0&&blocked)return useRevive(state,idx,blocked.index,reviveIndex);
 const blockIndex=player.hand.findIndex(card=>card.kind==='block');
 if(blockIndex>=0&&others.length&&Math.random()<.45){
  const target=others[Math.floor(Math.random()*others.length)];
  return useBlock(state,idx,target.index,blockIndex);
 }
 const swapIndex=player.hand.findIndex(card=>card.kind==='swap');
 const ownCards=player.hand.map((_,index)=>index).filter(index=>index!==swapIndex);
 const swapTargets=others.filter(x=>x.value.hand.length>0);
 if(swapIndex>=0&&ownCards.length&&swapTargets.length&&Math.random()<.35){
  const target=swapTargets[Math.floor(Math.random()*swapTargets.length)];
  return useSwap(state,idx,ownCards[Math.floor(Math.random()*ownCards.length)],target.index,Math.floor(Math.random()*target.value.hand.length),swapIndex);
 }
 if(player.blockedTurns>0)return discardCard(state,idx,Math.max(0,player.hand.findIndex(card=>card.type==='path')));
 const safe=structuredClone(state) as GameState;
 safe.players[idx].specialUsed={block:true,revive:true,swap:true};
 const next=botMove(safe);
 if(next!==safe&&next.players[idx])next.players[idx].specialUsed=state.players[idx].specialUsed;
 return next===safe?state:next;
};
