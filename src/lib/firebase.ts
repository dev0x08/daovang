import { initializeApp, getApps } from 'firebase/app';
import { getAnalytics } from 'firebase/analytics';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: 'AIzaSyDYFRPFIYG9jJkwagDSZgppvx03QlLdoZ4',
  authDomain: 'banthuyen-3b996.firebaseapp.com',
  projectId: 'banthuyen-3b996',
  storageBucket: 'banthuyen-3b996.firebasestorage.app',
  messagingSenderId: '296814744152',
  appId: '1:296814744152:web:88b11e3a90f890b7bd302d',
  measurementId: 'G-5QC31Q09VM',
};

export const firebaseReady = Boolean(firebaseConfig.apiKey && firebaseConfig.projectId);
export const app = firebaseReady ? (getApps()[0] ?? initializeApp(firebaseConfig)) : null;
export const analytics = app ? getAnalytics(app) : null;
export const auth = app ? getAuth(app) : null;
export const db = app ? getFirestore(app) : null;
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });
