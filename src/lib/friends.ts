import { collection, deleteDoc, doc, getDoc, onSnapshot, serverTimestamp, setDoc, writeBatch } from 'firebase/firestore';
import { Equipped, Profile } from '../context/AuthContext';
import { db } from './firebase';

export type FriendSummary={uid:string;displayName:string;photoURL:string;rank:string;equipped?:Equipped};
export type FriendRequest=FriendSummary&{fromUid:string;toUid:string;createdAt?:unknown};
export type RoomInvite={id:string;roomId:string;roomCode:string;roomName:string;fromUid:string;fromName:string;fromPhotoURL:string;createdAt?:unknown};
export type FriendshipStatus='none'|'friends'|'sent'|'received';

export const summaryOf=(profile:Pick<Profile,'uid'|'displayName'|'photoURL'|'rank'|'equipped'>):FriendSummary=>({uid:profile.uid,displayName:profile.displayName,photoURL:profile.photoURL,rank:profile.rank,equipped:profile.equipped});

export async function friendshipStatus(viewerUid:string,targetUid:string):Promise<FriendshipStatus>{
 if(!db||viewerUid===targetUid)return'none';
 const[friend,sent,received]=await Promise.all([
  getDoc(doc(db,'users',viewerUid,'friends',targetUid)),
  getDoc(doc(db,'users',targetUid,'friendRequests',viewerUid)),
  getDoc(doc(db,'users',viewerUid,'friendRequests',targetUid)),
 ]);
 return friend.exists()?'friends':received.exists()?'received':sent.exists()?'sent':'none';
}

export async function sendFriendRequest(from:Profile,to:FriendSummary){
 if(!db||from.uid===to.uid)return;
 await setDoc(doc(db,'users',to.uid,'friendRequests',from.uid),{...summaryOf(from),fromUid:from.uid,toUid:to.uid,createdAt:serverTimestamp()});
}

export async function cancelFriendRequest(fromUid:string,toUid:string){
 if(!db)return;
 await deleteDoc(doc(db,'users',toUid,'friendRequests',fromUid));
}

export async function acceptFriendRequest(current:Profile,request:FriendRequest){
 if(!db)return;
 const batch=writeBatch(db),mine=summaryOf(current),theirs:FriendSummary={uid:request.fromUid,displayName:request.displayName,photoURL:request.photoURL,rank:request.rank,equipped:request.equipped||{}};
 batch.set(doc(db,'users',current.uid,'friends',request.fromUid),{...theirs,friendUid:request.fromUid,createdAt:serverTimestamp()});
 batch.set(doc(db,'users',request.fromUid,'friends',current.uid),{...mine,friendUid:current.uid,createdAt:serverTimestamp()});
 batch.delete(doc(db,'users',current.uid,'friendRequests',request.fromUid));
 await batch.commit();
}

export async function declineFriendRequest(currentUid:string,fromUid:string){
 if(!db)return;
 await deleteDoc(doc(db,'users',currentUid,'friendRequests',fromUid));
}

export async function removeFriend(currentUid:string,friendUid:string){
 if(!db)return;
 const batch=writeBatch(db);
 batch.delete(doc(db,'users',currentUid,'friends',friendUid));
 batch.delete(doc(db,'users',friendUid,'friends',currentUid));
 await batch.commit();
}

export async function inviteFriendToRoom(from:Profile,friendUid:string,room:{id:string;code:string;name:string}){
 if(!db)return;
 await setDoc(doc(db,'users',friendUid,'roomInvites',room.id),{roomId:room.id,roomCode:room.code,roomName:room.name,fromUid:from.uid,fromName:from.displayName,fromPhotoURL:from.photoURL,createdAt:serverTimestamp()});
}

export async function dismissRoomInvite(uid:string,roomId:string){
 if(!db)return;
 await deleteDoc(doc(db,'users',uid,'roomInvites',roomId));
}

export const watchFriends=(uid:string,callback:(friends:FriendSummary[])=>void)=>db?onSnapshot(collection(db,'users',uid,'friends'),snapshot=>{void Promise.all(snapshot.docs.map(async item=>{const live=await getDoc(doc(db!,'users',item.id)),data=live.exists()?live.data():item.data();return{uid:item.id,displayName:String(data.displayName||'Người chơi'),photoURL:String(data.photoURL||''),rank:String(data.rank||'Tân binh'),equipped:data.equipped&&typeof data.equipped==='object'?data.equipped as Equipped:{}}})).then(callback)}):()=>{};
export const watchFriendRequests=(uid:string,callback:(requests:FriendRequest[])=>void)=>db?onSnapshot(collection(db,'users',uid,'friendRequests'),snapshot=>callback(snapshot.docs.map(item=>({...item.data(),uid:item.id,fromUid:item.id,toUid:uid,displayName:String(item.data().displayName||'Người chơi'),photoURL:String(item.data().photoURL||''),rank:String(item.data().rank||'Tân binh')} as FriendRequest)))):()=>{};
export const watchRoomInvites=(uid:string,callback:(invites:RoomInvite[])=>void)=>db?onSnapshot(collection(db,'users',uid,'roomInvites'),snapshot=>callback(snapshot.docs.map(item=>({id:item.id,...item.data()} as RoomInvite)))):()=>{};
