import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  increment,
  limit,
  orderBy,
  query,
  runTransaction,
  serverTimestamp,
  setDoc,
  updateDoc,
  writeBatch,
} from 'firebase/firestore';
import type { Equipped, Profile } from '../context/AuthContext';
import { db } from './firebase';
import { nameSlug } from './slugs';
import { levelFromExp, rankFromPoints } from './progression';
import { todayKey, weekKey } from './missions';
import {
  GUILD_MISSIONS,
  GUILD_LEVEL_REWARDS,
  GuildMissionMetric,
  GuildMissionProgress,
  advanceGuildLevel,
  guildLevelConfig,
  missionValue,
} from './guildProgression';

export type GuildRole='owner'|'officer'|'member';
export type Guild={
  id:string;name:string;slug:string;tag:string;description:string;announcement?:string;badge?:string;ownerId:string;ownerName?:string;
  memberCount:number;totalContribution:number;totalWarPoints:number;power:number;treasury:number;
  guildLevel:number;guildExp:number;lifetimeGuildExp:number;
  createdAt?:unknown;updatedAt?:unknown;
};
export type GuildMember={
  uid:string;displayName:string;photoURL:string;rank:string;equipped?:Equipped;
  role:GuildRole;title:string;contribution:number;goldContribution?:number;warPoints:number;level?:number;onlineSecondsToday?:number;joinedAt?:unknown;
  missionProgress?:GuildMissionProgress;
};
export type GuildApplication=Omit<GuildMember,'role'|'title'|'contribution'|'warPoints'|'joinedAt'>&{message:string;createdAt?:unknown};
export type GuildActivity={id:string;type:'guild'|'system';text:string;authorId:string;authorName:string;createdAt?:unknown};

const memberData=(profile:Pick<Profile,'uid'|'displayName'|'photoURL'|'rank'|'equipped'>,role:GuildRole='member'):Omit<GuildMember,'joinedAt'>=>({
  uid:profile.uid,displayName:profile.displayName,photoURL:profile.photoURL,rank:profile.rank,
  equipped:profile.equipped,role,title:role==='owner'?'Hội trưởng':'Thành viên',contribution:0,goldContribution:0,warPoints:0,
});

const normalizeGuild=(id:string,data:Record<string,unknown>):Guild=>({
  ...data,
  id,
  guildLevel:Math.max(1,Math.min(5,Math.floor(Number(data.guildLevel)||1))),
  guildExp:Math.max(0,Math.floor(Number(data.guildExp)||0)),
  lifetimeGuildExp:Math.max(0,Math.floor(Number(data.lifetimeGuildExp)||0)),
} as Guild);

export async function listGuilds(max=50):Promise<Guild[]>{
  if(!db)return[];
  const snap=await getDocs(query(collection(db,'guilds'),orderBy('power','desc'),limit(max)));
  return snap.docs.map(item=>normalizeGuild(item.id,item.data()));
}

export async function getGuild(guildId:string):Promise<Guild|null>{
  if(!db)return null;const snap=await getDoc(doc(db,'guilds',guildId));
  return snap.exists()?normalizeGuild(snap.id,snap.data()):null;
}

export async function findMyGuild(uid:string):Promise<{guild:Guild;member:GuildMember}|null>{
  if(!db)return null;
  const guilds=await listGuilds();
  for(const guild of guilds){
    const member=await getDoc(doc(db,'guilds',guild.id,'members',uid));
    if(member.exists())return{guild,member:member.data() as GuildMember};
  }
  return null;
}

export async function createGuild(profile:Profile,name:string,description:string):Promise<string>{
  if(!db)throw new Error('Firebase chưa sẵn sàng.');
  if(await findMyGuild(profile.uid))throw new Error('Bạn đã thuộc một guild.');
  const safeName=name.trim().replace(/\s+/g,' '),safeDescription=description.trim();
  const slug=nameSlug(safeName);
  if(safeName.length<3||safeName.length>12)throw new Error('Tên guild phải từ 3 đến 12 ký tự.');
  if(safeDescription.length<10||safeDescription.length>160)throw new Error('Giới thiệu guild phải từ 10 đến 160 ký tự.');
  if(!slug)throw new Error('Tên guild không hợp lệ.');
  if((await listGuilds()).some(guild=>nameSlug(guild.name)===slug))throw new Error('Tên guild này đã tồn tại.');
  const guildRef=doc(db,'guilds',slug),nameRef=doc(db,'guildNames',slug),userRef=doc(db,'users',profile.uid);
  await runTransaction(db,async transaction=>{
    const[guildSnap,nameSnap,userSnap]=await Promise.all([transaction.get(guildRef),transaction.get(nameRef),transaction.get(userRef)]),userData=userSnap.data();
    if(guildSnap.exists()||nameSnap.exists())throw new Error('Tên guild này đã tồn tại.');
    const exp=Math.max(0,Number(userData?.exp||0)),coins=Math.max(0,Number(userData?.coins||0));
    if(exp<700)throw new Error('Cần đạt cấp 5 để thành lập guild.');
    if(coins<5000)throw new Error('Cần 5.000 vàng để thành lập guild.');
    transaction.set(guildRef,{name:safeName,slug,tag:'',description:safeDescription,ownerId:profile.uid,ownerName:profile.displayName,memberCount:1,totalContribution:5000,totalWarPoints:0,power:0,treasury:5000,guildLevel:1,guildExp:0,lifetimeGuildExp:0,createdAt:serverTimestamp(),updatedAt:serverTimestamp()});
    transaction.set(nameRef,{guildId:guildRef.id,name:safeName,ownerId:profile.uid,createdAt:serverTimestamp()});
    transaction.set(doc(guildRef,'members',profile.uid),{...memberData(profile,'owner'),joinedAt:serverTimestamp()});
    transaction.update(userRef,{coins:coins-5000});
  });
  return guildRef.id;
}

export async function applyToGuild(profile:Profile,guildId:string,message=''){
  if(!db)return;
  if(await findMyGuild(profile.uid))throw new Error('Bạn đã thuộc một guild.');
  await setDoc(doc(db,'guilds',guildId,'applications',profile.uid),{
    uid:profile.uid,displayName:profile.displayName,photoURL:profile.photoURL,rank:profile.rank,
    equipped:profile.equipped,message:message.trim().slice(0,120),createdAt:serverTimestamp(),
  });
}

export async function getGuildMembers(guildId:string):Promise<GuildMember[]>{
  if(!db)return[];
  const snap=await getDocs(collection(db,'guilds',guildId,'members'));
  const rows=await Promise.all(snap.docs.map(async item=>{
    const member=item.data() as GuildMember,user=await getDoc(doc(db!,'users',item.id)),data=user.data();
    const onlineSecondsToday=String(data?.missionDate||'')===todayKey()?Math.max(0,Number(data?.onlineSecondsToday||0)):0;
    return{...member,goldContribution:Math.max(0,Number(member.goldContribution||0)),onlineSecondsToday,level:levelFromExp(Number(data?.exp||0)),rank:rankFromPoints(Number(data?.rankPoints||0)).label};
  }));
  return rows.sort((a,b)=>roleWeight(a.role)-roleWeight(b.role)||b.contribution-a.contribution);
}

export async function getGuildApplications(guildId:string):Promise<GuildApplication[]>{
  if(!db)return[];
  const snap=await getDocs(collection(db,'guilds',guildId,'applications'));
  return snap.docs.map(item=>item.data() as GuildApplication);
}

export async function getGuildActivities(guildId:string):Promise<GuildActivity[]>{
  if(!db)return[];
  const snap=await getDocs(query(collection(db,'guilds',guildId,'activities'),orderBy('createdAt','desc'),limit(100)));
  return snap.docs.map(item=>({id:item.id,...item.data()} as GuildActivity));
}

export async function addGuildActivity(guildId:string,actor:Pick<Profile,'uid'|'displayName'>,type:GuildActivity['type'],text:string){
  if(!db)return;
  const ref=doc(collection(db,'guilds',guildId,'activities'));
  await setDoc(ref,{type,text:text.trim().slice(0,240),authorId:actor.uid,authorName:actor.displayName,createdAt:serverTimestamp()});
}

export async function deleteGuildActivity(guildId:string,activity:GuildActivity,actor:Pick<Profile,'uid'|'displayName'>){
  if(!db)return;
  const batch=writeBatch(db),logRef=doc(collection(db,'guilds',guildId,'activities'));
  batch.delete(doc(db,'guilds',guildId,'activities',activity.id));
  batch.set(logRef,{type:'system',text:`${actor.displayName} đã xóa một thông báo hoạt động.`,authorId:actor.uid,authorName:actor.displayName,createdAt:serverTimestamp()});
  await batch.commit();
}

export async function addGuildMember(guildId:string,player:GuildApplication|Pick<GuildMember,'uid'|'displayName'|'photoURL'|'rank'|'equipped'>){
  if(!db)return;
  if(await findMyGuild(player.uid))throw new Error('Người chơi này đã thuộc một guild khác.');
  const memberRef=doc(db,'guilds',guildId,'members',player.uid);
  if((await getDoc(memberRef)).exists())return;
  const guildSnap=await getDoc(doc(db,'guilds',guildId));
  if(!guildSnap.exists())throw new Error('Guild không còn tồn tại.');
  const guildLevel=Math.max(1,Number(guildSnap.data().guildLevel||1));
  const memberLimit=guildLevelConfig(guildLevel).memberLimit;
  if(Number(guildSnap.data().memberCount||0)>=memberLimit)throw new Error(`Guild Lv.${guildLevel} chỉ có tối đa ${memberLimit} thành viên.`);
  const batch=writeBatch(db);
  batch.set(memberRef,{uid:player.uid,displayName:player.displayName,photoURL:player.photoURL,rank:player.rank,equipped:player.equipped||{},role:'member',title:'Thành viên',contribution:0,goldContribution:0,warPoints:0,joinedAt:serverTimestamp()});
  batch.delete(doc(db,'guilds',guildId,'applications',player.uid));
  batch.update(doc(db,'guilds',guildId),{memberCount:increment(1),updatedAt:serverTimestamp()});
  await batch.commit();
}

export async function rejectGuildApplication(guildId:string,uid:string){
  if(!db)return;await deleteDoc(doc(db,'guilds',guildId,'applications',uid));
}

export async function removeGuildMember(guildId:string,uid:string){
  if(!db)return;
  const batch=writeBatch(db);
  batch.delete(doc(db,'guilds',guildId,'members',uid));
  batch.update(doc(db,'guilds',guildId),{memberCount:increment(-1),updatedAt:serverTimestamp()});
  await batch.commit();
}

export async function updateGuildMember(guildId:string,uid:string,patch:{role?:GuildRole;title?:string}){
  if(!db)return;
  await updateDoc(doc(db,'guilds',guildId,'members',uid),{...patch,...(patch.title!==undefined?{title:patch.title.trim().slice(0,30)}:{})});
}

export async function transferGuildOwnership(guildId:string,currentOwnerId:string,nextOwner:GuildMember){
  if(!db)return;
  if(nextOwner.uid===currentOwnerId||nextOwner.uid.startsWith('guild-test-'))throw new Error('Người kế nhiệm không hợp lệ.');
  const batch=writeBatch(db);
  batch.update(doc(db,'guilds',guildId),{ownerId:nextOwner.uid,ownerName:nextOwner.displayName,updatedAt:serverTimestamp()});
  batch.update(doc(db,'guilds',guildId,'members',currentOwnerId),{role:'officer',title:'Cựu hội trưởng'});
  batch.update(doc(db,'guilds',guildId,'members',nextOwner.uid),{role:'owner',title:'Hội trưởng'});
  await batch.commit();
}

export async function updateGuildAnnouncement(guildId:string,announcement:string){
  if(!db)return;
  await updateDoc(doc(db,'guilds',guildId),{announcement:announcement.trim().slice(0,240),updatedAt:serverTimestamp()});
}

export async function updateGuildDescription(guildId:string,description:string){
  if(!db)return;
  const safeDescription=description.trim();
  if(safeDescription.length<10||safeDescription.length>160)throw new Error('Giới thiệu guild phải từ 10 đến 160 ký tự.');
  await updateDoc(doc(db,'guilds',guildId),{description:safeDescription,updatedAt:serverTimestamp()});
}

export async function updateGuildBadge(guildId:string,badge:string){
  if(!db)return;
  await updateDoc(doc(db,'guilds',guildId),{badge:badge.trim().slice(0,40),updatedAt:serverTimestamp()});
}

export async function contributeToGuild(guildId:string,uid:string,type:'contribution'|'war'|'service'){
  if(!db)return;
  const contribution=type==='war'?0:type==='service'?15:10,warPoints=type==='war'?20:0;
  const batch=writeBatch(db);
  batch.update(doc(db,'guilds',guildId,'members',uid),{contribution:increment(contribution),warPoints:increment(warPoints)});
  batch.update(doc(db,'guilds',guildId),{totalContribution:increment(contribution),totalWarPoints:increment(warPoints),power:increment(contribution+warPoints*2),updatedAt:serverTimestamp()});
  await batch.commit();
}

const freshMissionProgress=(value:GuildMissionProgress|undefined):GuildMissionProgress=>{
  const day=todayKey(),week=weekKey();
  return{
    dailyKey:day,
    weeklyKey:week,
    daily:value?.dailyKey===day?{...(value.daily||{})}:{},
    weekly:value?.weeklyKey===week?{...(value.weekly||{})}:{},
    claimedDaily:value?.dailyKey===day?[...(value.claimedDaily||[])]:[],
    claimedWeekly:value?.weeklyKey===week?[...(value.claimedWeekly||[])]:[],
  };
};

const guildExpPatch=(data:Record<string,unknown>,points:number,treasuryDeposit=0)=>{
  const currentLevel=Math.max(1,Number(data.guildLevel||1));
  const currentExp=Math.max(0,Number(data.guildExp||0));
  const next=advanceGuildLevel(currentLevel,currentExp,points);
  const levelRewardCoins=next.levelsGained.reduce((sum,level)=>sum+(GUILD_LEVEL_REWARDS[level]?.treasuryCoins||0),0);
  return{
    guildLevel:next.level,
    guildExp:next.exp,
    lifetimeGuildExp:Math.max(0,Number(data.lifetimeGuildExp||0))+points,
    power:Math.max(0,Number(data.power||0))+points,
    treasury:Math.max(0,Number(data.treasury||0))+Math.max(0,treasuryDeposit)+levelRewardCoins,
    updatedAt:serverTimestamp(),
  };
};

export async function recordGuildMemberEvent(uid:string,eventId:string,metric:GuildMissionMetric,points:number,amount=1){
  if(!db||points<1)return null;
  const mine=await findMyGuild(uid);
  if(!mine)return null;
  const guildRef=doc(db,'guilds',mine.guild.id),memberRef=doc(guildRef,'members',uid);
  const safeEventId=(eventId+'_'+uid).replace(/[^a-zA-Z0-9_-]/g,'_').slice(0,180);
  const eventRef=doc(guildRef,'contributionEvents',safeEventId);
  return runTransaction(db,async transaction=>{
    const[eventSnap,guildSnap,memberSnap]=await Promise.all([transaction.get(eventRef),transaction.get(guildRef),transaction.get(memberRef)]);
    if(eventSnap.exists()||!guildSnap.exists()||!memberSnap.exists())return null;
    const progress=freshMissionProgress(memberSnap.data().missionProgress as GuildMissionProgress|undefined);
    const dailyBefore=Math.max(0,Number(progress.daily?.[metric]||0));
    const awardedPoints=metric==='games'&&dailyBefore>=5?0:metric==='wins'&&dailyBefore>=5?0:metric==='login'&&amount>0&&dailyBefore>=1?0:points;
    progress.daily={...progress.daily,[metric]:Math.max(0,Number(progress.daily?.[metric]||0))+amount};
    progress.weekly={...progress.weekly,[metric]:Math.max(0,Number(progress.weekly?.[metric]||0))+amount};
    transaction.set(eventRef,{uid,metric,points:awardedPoints,amount,createdAt:serverTimestamp()});
    transaction.update(memberRef,{contribution:increment(awardedPoints),missionProgress:progress});
    if(awardedPoints>0)transaction.update(guildRef,guildExpPatch(guildSnap.data(),awardedPoints));
    return{guildId:mine.guild.id,points:awardedPoints};
  });
}

export async function claimGuildMission(guildId:string,uid:string,missionId:string){
  if(!db)throw new Error('Firebase chưa sẵn sàng.');
  const mission=GUILD_MISSIONS.find(item=>item.id===missionId);
  if(!mission)throw new Error('Nhiệm vụ Guild không tồn tại.');
  const guildRef=doc(db,'guilds',guildId),memberRef=doc(guildRef,'members',uid);
  return runTransaction(db,async transaction=>{
    const[guildSnap,memberSnap]=await Promise.all([transaction.get(guildRef),transaction.get(memberRef)]);
    if(!guildSnap.exists()||!memberSnap.exists())throw new Error('Bạn không còn thuộc Guild này.');
    const progress=freshMissionProgress(memberSnap.data().missionProgress as GuildMissionProgress|undefined);
    const claimed=mission.period==='daily'?progress.claimedDaily!:progress.claimedWeekly!;
    if(claimed.includes(mission.id))return false;
    if(missionValue(progress,mission)<mission.target)throw new Error('Nhiệm vụ Guild chưa hoàn thành.');
    claimed.push(mission.id);
    transaction.update(memberRef,{missionProgress:progress});
    transaction.update(guildRef,guildExpPatch(guildSnap.data(),mission.reward));
    return true;
  });
}

export async function depositGuildFunds(guildId:string,uid:string,amount:number):Promise<number>{
  if(!db)throw new Error('Firebase chưa sẵn sàng.');
  const safeAmount=Math.floor(amount);
  if(safeAmount%100!==0)throw new Error('Số vàng đóng góp phải là bội số của 100.');
  if(safeAmount<1||safeAmount>100000)throw new Error('Số vàng nạp không hợp lệ.');
  const userRef=doc(db,'users',uid),guildRef=doc(db,'guilds',guildId),memberRef=doc(guildRef,'members',uid);
  return runTransaction(db,async transaction=>{
    const[userSnap,guildSnap,memberSnap]=await Promise.all([transaction.get(userRef),transaction.get(guildRef),transaction.get(memberRef)]);
    if(!memberSnap.exists())throw new Error('Bạn không còn thuộc Guild này.');
    if(!guildSnap.exists())throw new Error('Guild không còn tồn tại.');
    const coins=Math.max(0,Number(userSnap.data()?.coins||0));
    const progress=freshMissionProgress(memberSnap.data().missionProgress as GuildMissionProgress|undefined);
    const contributedToday=Math.max(0,Number(progress.daily?.gold||0));
    const pointableGold=Math.max(0,Math.min(safeAmount,1000-contributedToday));
    const earnedPoints=Math.floor(pointableGold/100)*10;
    progress.daily={...progress.daily,gold:contributedToday+safeAmount};
    progress.weekly={...progress.weekly,gold:Math.max(0,Number(progress.weekly?.gold||0))+safeAmount};
    if(coins<safeAmount)throw new Error('Bạn không đủ vàng.');
    transaction.update(userRef,{coins:coins-safeAmount});
    transaction.update(guildRef,{totalContribution:increment(safeAmount),...guildExpPatch(guildSnap.data(),earnedPoints,safeAmount)});
    transaction.update(memberRef,{goldContribution:increment(safeAmount),missionProgress:progress});
    return coins-safeAmount;
  });
}

export async function distributeGuildTreasury(guildId:string,requestedAmount:number,contributorsOnly=false){
  if(!db)throw new Error('Firebase chưa sẵn sàng.');
  const guildRef=doc(db,'guilds',guildId),[memberSnap,payoutSnap]=await Promise.all([getDocs(collection(guildRef,'members')),getDocs(collection(guildRef,'payouts'))]);
  if(memberSnap.empty)throw new Error('Guild chưa có thành viên.');
  const pending=new Set(payoutSnap.docs.map(item=>item.id)),eligible=memberSnap.docs.filter(member=>!pending.has(member.id)&&(!contributorsOnly||Number(member.data().goldContribution||0)>0));
  if(!eligible.length)throw new Error('Tất cả thành viên đang có phần quỹ chưa nhận.');
  const guildSnap=await getDoc(guildRef),treasury=Math.max(0,Math.floor(Number(guildSnap.data()?.treasury||0))),amount=Math.floor(requestedAmount);
  if(amount<1||amount>treasury)throw new Error('Số vàng phát không hợp lệ.');
  const each=Math.floor(amount/eligible.length);
  if(each<1)throw new Error('Quỹ guild không đủ để phát cho tất cả thành viên.');
  const distributed=each*eligible.length,batch=writeBatch(db);
  eligible.forEach(member=>batch.set(doc(guildRef,'payouts',member.id),{uid:member.id,amount:each,createdAt:serverTimestamp()}));
  batch.update(guildRef,{treasury:increment(-distributed),updatedAt:serverTimestamp()});
  await batch.commit();
  return{each,count:eligible.length,distributed};
}

export async function claimGuildPayout(guildId:string,uid:string):Promise<number>{
  if(!db)return 0;
  const payoutRef=doc(db,'guilds',guildId,'payouts',uid),userRef=doc(db,'users',uid);
  return runTransaction(db,async transaction=>{
    const[payout,user]=await Promise.all([transaction.get(payoutRef),transaction.get(userRef)]);
    if(!payout.exists()||!user.exists())return 0;
    const amount=Math.max(0,Math.floor(Number(payout.data().amount||0))),coins=Number(user.data().coins||0),credited=Math.min(amount,1000000-coins);
    if(credited<1)return 0;
    transaction.update(userRef,{coins:coins+credited});
    transaction.delete(payoutRef);
    return credited;
  });
}

export async function leaveGuild(guildId:string,uid:string){
  if(!db)return;
  const batch=writeBatch(db);
  batch.delete(doc(db,'guilds',guildId,'members',uid));
  batch.update(doc(db,'guilds',guildId),{memberCount:increment(-1),updatedAt:serverTimestamp()});
  await batch.commit();
}

export async function disbandGuild(guildId:string){
  if(!db)return;
  const[members,applications,activities,payouts]=await Promise.all([
    getDocs(collection(db,'guilds',guildId,'members')),
    getDocs(collection(db,'guilds',guildId,'applications')),
    getDocs(collection(db,'guilds',guildId,'activities')),
    getDocs(collection(db,'guilds',guildId,'payouts')),
  ]);
  const batch=writeBatch(db);
  members.docs.forEach(item=>batch.delete(item.ref));
  applications.docs.forEach(item=>batch.delete(item.ref));
  activities.docs.forEach(item=>batch.delete(item.ref));
  payouts.docs.forEach(item=>batch.delete(item.ref));
  const guildSnap=await getDoc(doc(db,'guilds',guildId)),slug=nameSlug(String(guildSnap.data()?.name||guildId));
  batch.delete(doc(db,'guilds',guildId));
  batch.delete(doc(db,'guildNames',slug));
  await batch.commit();
}

const roleWeight=(role:GuildRole)=>role==='owner'?0:role==='officer'?1:2;
