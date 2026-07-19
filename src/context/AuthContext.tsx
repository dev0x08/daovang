import { createContext, useContext, useEffect, useMemo, useState, ReactNode } from 'react';
import { browserLocalPersistence, getRedirectResult, onAuthStateChanged, setPersistence, signInWithPopup, signInWithRedirect, signOut, User } from 'firebase/auth';
import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore';
import { auth, db, firebaseReady, googleProvider } from '../lib/firebase';

type Profile={uid:string;displayName:string;email:string;photoURL:string;rank:string;exp:number;coins:number;wins:number;losses:number;gamesPlayed:number};
type AuthValue={user:User|null;profile:Profile|null;loading:boolean;firebaseReady:boolean;login:()=>Promise<void>;logout:()=>Promise<void>;updateStats:(won:boolean)=>Promise<void>};
const C=createContext<AuthValue|null>(null);

export function AuthProvider({children}:{children:ReactNode}){
 const[user,setUser]=useState<User|null>(null);const[profile,setProfile]=useState<Profile|null>(null);const[loading,setLoading]=useState(true);
 useEffect(()=>{if(!auth||!db){setLoading(false);return;}const authClient=auth;const database=db;void setPersistence(authClient,browserLocalPersistence);void getRedirectResult(authClient).catch(()=>undefined);return onAuthStateChanged(authClient,async u=>{setUser(u);if(u){const ref=doc(database,'users',u.uid);const snap=await getDoc(ref);const base:Profile={uid:u.uid,displayName:u.displayName||'Người chơi',email:u.email||'',photoURL:u.photoURL||'',rank:'Đồng III',exp:0,coins:500,wins:0,losses:0,gamesPlayed:0};if(!snap.exists())await setDoc(ref,{...base,createdAt:serverTimestamp(),lastLoginAt:serverTimestamp()});else await setDoc(ref,{displayName:base.displayName,email:base.email,photoURL:base.photoURL,lastLoginAt:serverTimestamp()},{merge:true});setProfile(snap.exists()?({...base,...snap.data()} as Profile):base);}else setProfile(null);setLoading(false);});},[]);
 const login=async()=>{if(!auth)throw new Error('Firebase chưa được cấu hình.');const mobile=/Android|iPhone|iPad|iPod/i.test(navigator.userAgent);if(mobile)await signInWithRedirect(auth,googleProvider);else{try{await signInWithPopup(auth,googleProvider)}catch(e:any){if(['auth/popup-blocked','auth/cancelled-popup-request','auth/operation-not-supported-in-this-environment'].includes(e?.code))await signInWithRedirect(auth,googleProvider);else throw e;}}};
 const logout=async()=>{if(auth)await signOut(auth)};
 const updateStats=async(won:boolean)=>{if(!profile||!db||!user)return;const next={...profile,exp:profile.exp+(won?30:10),coins:profile.coins+(won?50:15),wins:profile.wins+(won?1:0),losses:profile.losses+(won?0:1),gamesPlayed:profile.gamesPlayed+1};setProfile(next);await setDoc(doc(db,'users',user.uid),next,{merge:true});};
 const value=useMemo(()=>({user,profile,loading,firebaseReady,login,logout,updateStats}),[user,profile,loading]);return <C.Provider value={value}>{children}</C.Provider>
}
export const useAuth=()=>{const v=useContext(C);if(!v)throw new Error('AuthProvider missing');return v};
