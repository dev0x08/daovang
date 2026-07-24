export type Role = 'miner' | 'wolf';
export type Direction = 'U' | 'R' | 'D' | 'L';
export type PathKind = 'h'|'v'|'ne'|'nw'|'se'|'sw'|'tUp'|'tDown'|'tLeft'|'tRight'|'cross'|'crossDead'|'nwDead'|'seDead'|'swDead'|'collapse';
export type ActionKind = 'delete'|'rotate'|'scout'|'block'|'revive'|'swap';
export type SpecialKind = 'block'|'revive'|'swap';
export type Card = { id:string; type:'path'|'action'; kind:PathKind|ActionKind; label:string; rotation:number };
export type Cell = { card:Card; owner:string } | null;
export type SpecialUses = Record<SpecialKind, boolean>;
export type Player = { id:string; name:string; role:Role; isBot:boolean; avatar:string; hand:Card[]; score:number; blockedTurns:number; specialUsed:SpecialUses; canSabotage:boolean; sabotageUsed:boolean };
export type MapSide = 'left'|'right'|'top'|'bottom';
export type ExternalPoint = { side:MapSide; row?:number; col?:number };
export type ObjectivePoint = ExternalPoint & { id:string; label:string };
export type MapConfig = { id:string; name:string; theme:'mine'|'ocean'|'tomb'; rows:number; cols:number; entrance:ExternalPoint; objectives:ObjectivePoint[]; cardSet:string; obstacleCount:number; obstacleMinCol:number; obstacleMaxCol:number };
export type Treasure = { id:string; revealed:boolean; isGold:boolean; peekedBy:string[] };
export type GameState = { matchId:string; map:MapConfig; board:Cell[][]; obstacles:string[]; players:Player[]; treasures:Treasure[]; deck:Card[]; discardPile:Card[]; turn:number; logs:string[]; winner:null|'miners'|'wolves'; turns:number };

export const GOLD_MINE_MAP:MapConfig={
 id:'gold-mine',name:'Mỏ Vàng Bị Lãng Quên',theme:'mine',rows:5,cols:12,
 entrance:{side:'left',row:2},
 objectives:[
  {id:'top',side:'right',row:0,label:'Rương phía trên'},
  {id:'middle',side:'right',row:2,label:'Rương chính giữa'},
  {id:'bottom',side:'right',row:4,label:'Rương phía dưới'}
 ],cardSet:'mine-basic',obstacleCount:3,obstacleMinCol:2,obstacleMaxCol:9
};

const uid=()=>typeof crypto!=='undefined'&&'randomUUID' in crypto?crypto.randomUUID():`${Date.now()}-${Math.random().toString(36).slice(2,12)}`;
const defs:Record<PathKind|ActionKind,{label:string;type:'path'|'action'}>={
 h:{label:'Đường ngang',type:'path'},v:{label:'Đường dọc',type:'path'},
 ne:{label:'Góc trên phải',type:'path'},nw:{label:'Góc trên trái',type:'path'},se:{label:'Góc dưới phải',type:'path'},sw:{label:'Góc dưới trái',type:'path'},
 tUp:{label:'Ngã ba lên',type:'path'},tDown:{label:'Ngã ba xuống',type:'path'},tLeft:{label:'Ngã ba trái',type:'path'},tRight:{label:'Ngã ba phải',type:'path'},cross:{label:'Ngã tư',type:'path'},
 crossDead:{label:'Ngã tư cụt',type:'path'},nwDead:{label:'Góc trên trái cụt',type:'path'},seDead:{label:'Góc dưới phải cụt',type:'path'},swDead:{label:'Góc dưới trái cụt',type:'path'},collapse:{label:'Sập hầm',type:'path'},
 delete:{label:'Phá đường',type:'action'},rotate:{label:'Chuyển hướng',type:'action'},scout:{label:'Thăm dò rương',type:'action'},
 block:{label:'Chặn',type:'action'},revive:{label:'Hồi sinh',type:'action'},swap:{label:'Đổi bài',type:'action'}
};
const make=(kind:PathKind|ActionKind,rotation=0):Card=>({id:uid(),kind,label:defs[kind].label,type:defs[kind].type,rotation});
const add=(arr:Card[],kind:PathKind|ActionKind,count:number)=>{for(let i=0;i<count;i++)arr.push(make(kind,kind==='collapse'?Math.floor(Math.random()*4)*90:0))};
const shuffle=<T,>(items:T[])=>{const a=[...items];for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a};
export const DECK_COUNTS:Record<PathKind|ActionKind,number>={
 h:18,v:6,ne:6,nw:6,se:6,sw:6,tUp:4,tDown:4,tLeft:4,tRight:4,cross:5,crossDead:2,nwDead:2,seDead:2,swDead:2,collapse:6,
 delete:8,rotate:0,scout:4,block:4,revive:5,swap:0
};
export const PATH_CARD_TOTAL=(Object.keys(DECK_COUNTS) as Array<PathKind|ActionKind>).filter(k=>defs[k].type==='path').reduce((sum,k)=>sum+DECK_COUNTS[k],0);
export const ACTION_CARD_TOTAL=(Object.keys(DECK_COUNTS) as Array<PathKind|ActionKind>).filter(k=>defs[k].type==='action').reduce((sum,k)=>sum+DECK_COUNTS[k],0);
export const DECK_TOTAL=PATH_CARD_TOTAL+ACTION_CARD_TOTAL;
export const createDeck=()=>{const deck:Card[]=[];(Object.keys(DECK_COUNTS) as Array<PathKind|ActionKind>).forEach(kind=>add(deck,kind,DECK_COUNTS[kind]));return shuffle(deck)};
const draw=(deck:Card[],n:number)=>deck.splice(0,Math.min(n,deck.length));

export const dirs=(kind:PathKind,rotation=0):Direction[]=>{const base:Record<PathKind,Direction[]>={h:['L','R'],v:['U','D'],ne:['D','L'],nw:['D','R'],se:['U','L'],sw:['U','R'],tUp:['L','R','U'],tDown:['L','R','D'],tLeft:['U','D','L'],tRight:['U','D','R'],cross:['U','R','D','L'],crossDead:['U','R','D','L'],nwDead:['D'],seDead:['U'],swDead:['U'],collapse:['L']};const turns=((rotation%360)+360)%360/90;const order:Direction[]=['U','R','D','L'];return base[kind].map(d=>order[(order.indexOf(d)+turns)%4])};
export const isDeadPath=(kind:PathKind)=>kind==='crossDead'||kind==='nwDead'||kind==='seDead'||kind==='swDead'||kind==='collapse';
const opposite:Record<Direction,Direction>={L:'R',R:'L',U:'D',D:'U'};
const delta:Record<Direction,[number,number]>={L:[0,-1],R:[0,1],U:[-1,0],D:[1,0]};
const inBoard=(m:MapConfig,r:number,c:number)=>r>=0&&r<m.rows&&c>=0&&c<m.cols;
const key=(r:number,c:number)=>`${r},${c}`;
const entranceCell=(m:MapConfig):[number,number,Direction]=>m.entrance.side==='left'?[m.entrance.row!,0,'L']:m.entrance.side==='right'?[m.entrance.row!,m.cols-1,'R']:m.entrance.side==='top'?[0,m.entrance.col!,'U']:[m.rows-1,m.entrance.col!,'D'];
const objectiveCell=(m:MapConfig,o:ObjectivePoint):[number,number,Direction]=>o.side==='left'?[o.row!,0,'L']:o.side==='right'?[o.row!,m.cols-1,'R']:o.side==='top'?[0,o.col!,'U']:[m.rows-1,o.col!,'D'];

const hasGeometricRoute=(map:MapConfig,obstacles:Set<string>)=>{const[sr,sc]=entranceCell(map),q:Array<[number,number]>=[[sr,sc]],seen=new Set([key(sr,sc)]);while(q.length){const[r,c]=q.shift()!;if(map.objectives.some(o=>{const[or,oc]=objectiveCell(map,o);return or===r&&oc===c}))return true;for(const[dr,dc]of Object.values(delta)){const nr=r+dr,nc=c+dc,k=key(nr,nc);if(inBoard(map,nr,nc)&&!obstacles.has(k)&&!seen.has(k)){seen.add(k);q.push([nr,nc])}}}return false};
export const generateObstacles=(map:MapConfig)=>{const candidates:Array<[number,number]>=[];for(let r=0;r<map.rows;r++)for(let c=map.obstacleMinCol;c<=Math.min(map.obstacleMaxCol,map.cols-1);c++)candidates.push([r,c]);for(let attempt=0;attempt<300;attempt++){const picked:Array<[number,number]>=[];for(const spot of shuffle(candidates)){if(picked.length>=map.obstacleCount)break;if(picked.every(([r,c])=>Math.abs(r-spot[0])+Math.abs(c-spot[1])>1))picked.push(spot)}const set=new Set(picked.map(([r,c])=>key(r,c)));if(picked.length===map.obstacleCount&&hasGeometricRoute(map,set))return [...set]}return [key(0,3),key(2,6),key(4,9)]};

export const reachableFromEntrance=(board:Cell[][],map:MapConfig=GOLD_MINE_MAP):Set<string>=>{const reachable=new Set<string>();const[sr,sc,sd]=entranceCell(map);const start=board[sr]?.[sc];if(!start?.card||start.card.type!=='path'||!dirs(start.card.kind as PathKind,start.card.rotation).includes(sd))return reachable;const q:Array<[number,number,Direction]>=[[sr,sc,sd]],seen=new Set([`${key(sr,sc)}:${sd}`]);while(q.length){const[r,c,enteredFrom]=q.shift()!,cell=board[r][c];if(!cell?.card||cell.card.type!=='path')continue;const kind=cell.card.kind as PathKind;reachable.add(key(r,c));if(isDeadPath(kind))continue;for(const d of dirs(kind,cell.card.rotation)){if(d===enteredFrom)continue;const[dr,dc]=delta[d],nr=r+dr,nc=c+dc;if(!inBoard(map,nr,nc))continue;const n=board[nr][nc],entry=opposite[d],stateKey=`${key(nr,nc)}:${entry}`;if(n?.card.type==='path'&&dirs(n.card.kind as PathKind,n.card.rotation).includes(entry)&&!seen.has(stateKey)){seen.add(stateKey);q.push([nr,nc,entry])}}}return reachable};

const externalOpeningAllowed=(map:MapConfig,row:number,col:number,d:Direction)=>{const[eR,eC,eD]=entranceCell(map);if(row===eR&&col===eC&&d===eD)return true;return map.objectives.some(o=>{const[or,oc,od]=objectiveCell(map,o);return row===or&&col===oc&&d===od});};
export const isValidPlacement=(board:Cell[][],card:Card,row:number,col:number,map:MapConfig=GOLD_MINE_MAP,obstacles:string[]=[])=>{
 if(card.type!=='path'||!inBoard(map,row,col)||board[row]?.[col]||obstacles.includes(key(row,col)))return false;

 const own=new Set(dirs(card.kind as PathKind,card.rotation));
 const [entranceRow,entranceCol,entranceDirection]=entranceCell(map);
 const isEntranceCell=row===entranceRow&&col===entranceCol;
 let hasConnectedOpening=false;
 let connectedToEntrance=isEntranceCell&&own.has(entranceDirection);

 for(const d of ['U','R','D','L'] as Direction[]){
  const[dr,dc]=delta[d],nr=row+dr,nc=col+dc,opens=own.has(d);

  if(!inBoard(map,nr,nc)){
   // Mép bản đồ được xem là vách đá: một nhánh đường có thể kết thúc tại đây.
   // Chỉ cửa hầm mới tạo kết nối khởi đầu; các rương chỉ được mở khi mạng đường
   // từ cửa hầm thật sự chạm đúng vị trí rương trong resolveTreasures().
   if(opens&&isEntranceCell&&d===entranceDirection)connectedToEntrance=true;
   continue;
  }

  const neighbor=board[nr][nc];
  if(!neighbor?.card)continue;
  if(neighbor.card.type!=='path')return false;

  const neighborOpens=dirs(neighbor.card.kind as PathKind,neighbor.card.rotation).includes(opposite[d]);
  // Hai ô kề nhau phải khớp tuyệt đối: cùng mở hoặc cùng đóng ở cạnh tiếp xúc.
  if(opens!==neighborOpens)return false;
  if(opens&&neighborOpens)hasConnectedOpening=true;

 }

 // Khớp hình học là chưa đủ: sau khi một lá gốc bị phá, cụm đường cô lập
 // không được phép tiếp tục phát triển như thể nó vẫn nối với cửa hầm.
 if(!hasConnectedOpening&&!connectedToEntrance)return false;
 const trial=board.map(line=>line.slice());
 trial[row][col]={card,owner:'placement-check'};
 return reachableFromEntrance(trial,map).has(key(row,col));
};

export const placementReason=(board:Cell[][],card:Card,row:number,col:number,map:MapConfig=GOLD_MINE_MAP,obstacles:string[]=[])=>{
 if(card.type!=='path')return 'Đây không phải mảnh đường.';
 if(!inBoard(map,row,col))return 'Ô nằm ngoài bàn cờ.';
 if(board[row]?.[col])return 'Ô đã có mảnh đường.';
 if(obstacles.includes(key(row,col)))return 'Ô đang có chướng ngại vật.';
 const own=new Set(dirs(card.kind as PathKind,card.rotation));
 const [entranceRow,entranceCol,entranceDirection]=entranceCell(map);
 let hasConnectedOpening=false;
 let connectedToEntrance=false;
 for(const d of ['U','R','D','L'] as Direction[]){
  const[dr,dc]=delta[d],nr=row+dr,nc=col+dc,opens=own.has(d);
  if(!inBoard(map,nr,nc)){
   if(opens&&row===entranceRow&&col===entranceCol&&d===entranceDirection)connectedToEntrance=true;
   continue;
  }
  const neighbor=board[nr][nc];
  if(!neighbor?.card)continue;
  if(neighbor.card.type!=='path')return 'Ô kế bên không phải mảnh đường.';
  const neighborOpens=dirs(neighbor.card.kind as PathKind,neighbor.card.rotation).includes(opposite[d]);
  if(opens!==neighborOpens)return `Cạnh ${d} không khớp với mảnh kế bên.`;
  if(opens&&neighborOpens)hasConnectedOpening=true;
 }
 if(!hasConnectedOpening&&!connectedToEntrance)return 'Mảnh phải nối bằng ít nhất một cửa mở với đường đã có.';
 const trial=board.map(line=>line.slice());
 trial[row][col]={card,owner:'placement-check'};
 return reachableFromEntrance(trial,map).has(key(row,col))?'Hợp lệ.':'Mảnh phải thuộc tuyến đường đang nối trực tiếp với Cửa hầm.';
};

const refill=(s:GameState,p:Player)=>{if(s.deck.length)p.hand.push(...draw(s.deck,1))};
const advance=(s:GameState)=>{s.turns++;if(!s.deck.length&&s.players.every(p=>p.hand.length===0)){s.winner='wolves';s.logs.unshift('Bộ bài đã cạn. Phe Sói chiến thắng.');return}s.turn=(s.turn+1)%s.players.length};
const resolveTreasures=(s:GameState)=>{const reachable=reachableFromEntrance(s.board,s.map);for(const o of s.map.objectives){const[r,c,d]=objectiveCell(s.map,o),cell=s.board[r]?.[c],t=s.treasures.find(x=>x.id===o.id);if(t&&!t.revealed&&reachable.has(key(r,c))&&cell?.card.type==='path'&&dirs(cell.card.kind as PathKind,cell.card.rotation).includes(d)){t.revealed=true;if(t.isGold){s.winner='miners';s.logs.unshift(`${o.label} chứa vàng thật — Thợ đào chiến thắng!`)}else s.logs.unshift(`${o.label} chỉ có đá. Trận đấu tiếp tục!`)}}};
const playerBase=(id:string,name:string,role:Role,isBot:boolean,avatar:string,hand:Card[],canSabotage=false):Player=>({id,name,role,isBot,avatar,hand,score:0,blockedTurns:0,specialUsed:{block:false,revive:false,swap:false},canSabotage,sabotageUsed:false});

const randomIndex=(length:number)=>{if(length<=1)return 0;if(typeof crypto!=='undefined'&&'getRandomValues' in crypto){const values=new Uint32Array(1),limit=Math.floor(0x100000000/length)*length;do crypto.getRandomValues(values);while(values[0]>=limit);return values[0]%length}return Math.floor(Math.random()*length)};
export const createTreasures=(map:MapConfig):Treasure[]=>{const goldIndex=randomIndex(map.objectives.length);return map.objectives.map((o,i)=>({id:o.id,revealed:false,isGold:i===goldIndex,peekedBy:[]}))};
export const newGame=(humanName='Bạn',botCount=5,map=GOLD_MINE_MAP):GameState=>{const total=Math.max(6,Math.min(8,botCount+1)),actualBots=total-1,deck=createDeck(),names=['Digger Bot','Luna','Búa Sắt','Mắt Đỏ','Râu Vàng','Đá Xám','Mỏ Neo'],roles=shuffle([...Array(total-2).fill('miner'),...Array(2).fill('wolf')]) as Role[];const wolfIndexes=roles.map((r,i)=>r==='wolf'?i:-1).filter(i=>i>=0);const saboteurIndex=wolfIndexes[Math.floor(Math.random()*wolfIndexes.length)];const players=[playerBase('human',humanName,roles[0],false,'human',draw(deck,6),saboteurIndex===0),...Array.from({length:actualBots},(_,i)=>playerBase(`bot-${i}`,names[i]||`AI ${i+1}`,roles[i+1],true,`bot-${i}`,draw(deck,6),saboteurIndex===i+1))];const firstTurn=Math.floor(Math.random()*players.length);return{matchId:`match-${Date.now()}-${uid()}`,map,board:Array.from({length:map.rows},()=>Array<Cell>(map.cols).fill(null)),obstacles:generateObstacles(map),players,treasures:createTreasures(map),deck,discardPile:[],turn:firstTurn,logs:[`Người đi đầu tiên: ${players[firstTurn].name}.`,'Trận đấu đã bắt đầu.'],winner:null,turns:0}};
export const newRoomGame=(roomId:string,roomPlayers:Array<{uid:string;name:string;avatar?:string;bot?:boolean}>,map=GOLD_MINE_MAP):GameState=>{
 const base=newGame(roomPlayers[0]?.name||'Bạn',Math.max(5,roomPlayers.length-1),map);
 base.matchId=`room-${roomId}`;
 base.players=base.players.slice(0,roomPlayers.length).map((player,index)=>({...player,id:roomPlayers[index].uid,name:roomPlayers[index].name,isBot:Boolean(roomPlayers[index].bot),avatar:roomPlayers[index].avatar||roomPlayers[index].uid}));
 base.logs=[`Người đi đầu tiên: ${base.players[base.turn].name}.`,'Trận đấu đã bắt đầu.'];
 return base;
};



export const placeCard=(state:GameState,playerIndex:number,cardIndex:number,row:number,col:number):GameState=>{const player=state.players[playerIndex],card0=player?.hand[cardIndex];if(state.winner||state.turn!==playerIndex||!player||player.blockedTurns>0||!card0||!isValidPlacement(state.board,card0,row,col,state.map,state.obstacles))return state;const s=structuredClone(state) as GameState,p=s.players[playerIndex],card=p.hand.splice(cardIndex,1)[0];s.board[row][col]={card,owner:p.id};refill(s,p);p.score++;s.logs.unshift(`${p.name} đặt ${card.label} tại ${String.fromCharCode(65+col)}${row+1}.`);resolveTreasures(s);if(!s.winner)advance(s);return s};
const allEdgesValid=(board:Cell[][],map:MapConfig,row:number,col:number)=>{
 const cell=board[row]?.[col];if(!cell?.card||cell.card.type!=='path')return false;
 const own=new Set(dirs(cell.card.kind as PathKind,cell.card.rotation));
 for(const d of ['U','R','D','L'] as Direction[]){const[dr,dc]=delta[d],nr=row+dr,nc=col+dc,opens=own.has(d);
  if(!inBoard(map,nr,nc)){
   // Nhánh hướng ra mép bàn chỉ kết thúc tại vách đá, không làm mảnh mất hợp lệ.
   continue;
  }
  const n=board[nr][nc];if(!n?.card)continue;
  const nOpen=n.card.type==='path'&&dirs(n.card.kind as PathKind,n.card.rotation).includes(opposite[d]);
  if(opens!==nOpen)return false;
 }return true;
};
export const useAction=(state:GameState,playerIndex:number,cardIndex:number,row:number,col:number):GameState=>{if(state.winner||state.turn!==playerIndex||state.obstacles.includes(key(row,col)))return state;const original=state.players[playerIndex]?.hand[cardIndex];if(!original||original.type!=='action'||original.kind==='scout')return state;const s=structuredClone(state) as GameState,p=s.players[playerIndex],card=p.hand[cardIndex],target=s.board[row]?.[col];if(card.kind==='delete'){if(!target)return state;s.board[row][col]=null}else if(card.kind==='rotate'){if(!target||target.card.type!=='path')return state;target.card.rotation=(target.card.rotation+90)%360;if(!allEdgesValid(s.board,s.map,row,col))return state}else return state;p.hand.splice(cardIndex,1);s.discardPile.push(card);refill(s,p);s.logs.unshift(card.kind==='delete'&&p.role==='wolf'?'Một đoạn đường đã bị phá bí ẩn.':`${p.name} dùng ${card.label} tại ${String.fromCharCode(65+col)}${row+1}.`);resolveTreasures(s);if(!s.winner)advance(s);return s};
export const scoutTreasure=(state:GameState,playerIndex:number,cardIndex:number,treasureId:string):GameState=>{if(state.winner||state.turn!==playerIndex)return state;const original=state.players[playerIndex]?.hand[cardIndex],treasure=state.treasures.find(t=>t.id===treasureId),player=state.players[playerIndex];if(!original||original.kind!=='scout'||!treasure||treasure.revealed||!player||treasure.peekedBy.includes(player.id))return state;const s=structuredClone(state) as GameState,p=s.players[playerIndex],card=p.hand.splice(cardIndex,1)[0],t=s.treasures.find(x=>x.id===treasureId)!;t.peekedBy.push(p.id);s.discardPile.push(card);refill(s,p);s.logs.unshift(`${p.name} đã bí mật thăm dò một rương.`);advance(s);return s};
export const discardCard=(state:GameState,playerIndex:number,cardIndex:number):GameState=>{if(state.winner||state.turn!==playerIndex)return state;const s=structuredClone(state) as GameState,p=s.players[playerIndex],card=p?.hand.splice(cardIndex,1)[0];if(!card)return state;s.discardPile.push(card);refill(s,p);s.logs.unshift(`${p.name} bỏ một lá và kết thúc lượt.`);advance(s);return s};
export const skipTurn=(state:GameState,playerIndex:number,message?:string):GameState=>{if(state.winner||state.turn!==playerIndex)return state;const s=structuredClone(state) as GameState,p=s.players[playerIndex];if(!p)return state;s.logs.unshift(message||`${p.name} bị bỏ lượt.`);advance(s);return s};


export const useSabotage=(state:GameState,playerIndex:number,row:number,col:number):GameState=>{if(state.winner||state.turn!==playerIndex||state.obstacles.includes(key(row,col)))return state;const s=structuredClone(state) as GameState,p=s.players[playerIndex],target=s.board[row]?.[col];if(!p||p.role!=='wolf'||!p.canSabotage||p.sabotageUsed||!target)return state;let collapsed=0;([[row,col],[row-1,col],[row+1,col],[row,col-1],[row,col+1]] as Array<[number,number]>).forEach(([r,c])=>{if(s.board[r]?.[c]){s.board[r][c]=null;collapsed++}});p.sabotageUsed=true;s.logs.unshift(`Một vụ sập hầm bí ẩn đã phá hủy ${collapsed} mảnh đường.`);advance(s);return s};

export const useBlock=(state:GameState,playerIndex:number,targetIndex:number,cardIndex?:number):GameState=>{if(state.winner||state.turn!==playerIndex||playerIndex===targetIndex||state.players[targetIndex]?.blockedTurns>0)return state;const resolved=cardIndex??state.players[playerIndex]?.hand.findIndex(c=>c.kind==='block');const original=state.players[playerIndex]?.hand[resolved];if(original?.kind!=='block')return state;const s=structuredClone(state) as GameState,p=s.players[playerIndex],target=s.players[targetIndex];if(!target)return state;const card=p.hand.splice(resolved,1)[0];s.discardPile.push(card);refill(s,p);target.blockedTurns=1;s.logs.unshift(`${p.name} đã dùng lá Chặn lên ${target.name}. ${target.name} không thể đặt mảnh đường cho tới khi được Hồi sinh.`);advance(s);return s};
export const useRevive=(state:GameState,playerIndex:number,targetIndex:number,cardIndex?:number):GameState=>{if(state.winner||state.turn!==playerIndex)return state;const resolved=cardIndex??state.players[playerIndex]?.hand.findIndex(c=>c.kind==='revive');const original=state.players[playerIndex]?.hand[resolved];if(original?.kind!=='revive')return state;const s=structuredClone(state) as GameState,p=s.players[playerIndex],target=s.players[targetIndex];if(!target||target.blockedTurns<=0)return state;const card=p.hand.splice(resolved,1)[0];s.discardPile.push(card);refill(s,p);target.blockedTurns=0;s.logs.unshift(`${p.name} đã dùng Hồi sinh cho ${target.name}.`);advance(s);return s};
export const useSwap=(state:GameState,playerIndex:number,myCardIndex:number,targetIndex:number,targetCardIndex:number,actionCardIndex?:number):GameState=>{const resolved=actionCardIndex??state.players[playerIndex]?.hand.findIndex(c=>c.kind==='swap');if(state.winner||state.turn!==playerIndex||playerIndex===targetIndex||myCardIndex===resolved)return state;const player=state.players[playerIndex],target0=state.players[targetIndex];if(player?.hand[resolved]?.kind!=='swap'||!player.hand[myCardIndex]||!target0?.hand[targetCardIndex])return state;const s=structuredClone(state) as GameState,p=s.players[playerIndex],target=s.players[targetIndex],actionCard=p.hand[resolved];[p.hand[myCardIndex],target.hand[targetCardIndex]]=[target.hand[targetCardIndex],p.hand[myCardIndex]];p.hand.splice(resolved,1);s.discardPile.push(actionCard);refill(s,p);s.logs.unshift(`${p.name} đã bí mật đổi một lá bài với ${target.name}.`);advance(s);return s};

export const botMove=(state:GameState):GameState=>{const idx=state.turn,p=state.players[idx];if(!p?.isBot||state.winner)return state;if(p.hand.length===0){const s=structuredClone(state) as GameState;s.logs.unshift(`${p.name} không còn bài và bỏ lượt.`);advance(s);return s;}const others=state.players.map((x,i)=>({x,i})).filter(v=>v.i!==idx);if(!p.specialUsed.revive){const blocked=others.find(v=>v.x.blockedTurns>0&&v.x.role===p.role);if(blocked&&Math.random()<.7)return useRevive(state,idx,blocked.i)}if(!p.specialUsed.block&&others.length&&Math.random()<.18){const targets=others.filter(v=>p.role==='wolf'?v.x.role==='miner':v.x.score>=Math.max(...others.map(o=>o.x.score)));const t=(targets.length?targets:others)[Math.floor(Math.random()*(targets.length||others.length))];return useBlock(state,idx,t.i)}if(!p.specialUsed.swap&&p.hand.length&&others.some(v=>v.x.hand.length)&&Math.random()<.12){const t=others.filter(v=>v.x.hand.length)[Math.floor(Math.random()*others.filter(v=>v.x.hand.length).length)];return useSwap(state,idx,Math.floor(Math.random()*p.hand.length),t.i,Math.floor(Math.random()*t.x.hand.length))}const targets:Array<[number,number]>=[];for(let r=0;r<state.map.rows;r++)for(let c=0;c<state.map.cols;c++)if(state.board[r][c])targets.push([r,c]);if(p.role==='wolf'&&p.canSabotage&&!p.sabotageUsed&&targets.length&&Math.random()<.45){const[r,c]=[...targets].sort((a,b)=>b[1]-a[1])[0];return useSabotage(state,idx,r,c)}const candidates:Array<[number,number,number]>=[];p.hand.forEach((card,i)=>{if(card.type==='path')for(let r=0;r<state.map.rows;r++)for(let c=0;c<state.map.cols;c++)if(isValidPlacement(state.board,card,r,c,state.map,state.obstacles))candidates.push([i,r,c])});if(p.role==='wolf'){const deleteIndex=p.hand.findIndex(c=>c.kind==='delete');if(deleteIndex>=0&&targets.length&&Math.random()<.45){const[r,c]=targets[Math.floor(Math.random()*targets.length)];return useAction(state,idx,deleteIndex,r,c)}}const scoutIndex=p.hand.findIndex(c=>c.kind==='scout');if(scoutIndex>=0){const hidden=state.treasures.find(t=>!t.revealed&&!t.peekedBy.includes(p.id));if(hidden&&Math.random()<.3)return scoutTreasure(state,idx,scoutIndex,hidden.id)}if(candidates.length){const score=([,r,c]:[number,number,number])=>p.role==='miner'?c+Math.random()*2:-c+Math.random()*5;const pick=[...candidates].sort((a,b)=>score(b)-score(a))[0];return placeCard(state,idx,pick[0],pick[1],pick[2])}return discardCard(state,idx,Math.max(0,Math.floor(Math.random()*p.hand.length)))};
