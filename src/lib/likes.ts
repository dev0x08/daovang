import {
    Timestamp,
    collection,
    doc,
    getDoc,
    getDocs,
    query,
    runTransaction,
    serverTimestamp,
    where,
} from 'firebase/firestore';
import { db } from './firebase';

export interface Like {
    giverId: string;
    receiverId: string;
    matchId: string;
    createdAt: Date;
}

const likeDocumentId = (matchId: string, giverId: string) => `${matchId}_${giverId}`;

/** Records exactly one commendation per giver and match, safely across double clicks/tabs. */
export async function giveLike(giverId: string, receiverId: string, matchId: string): Promise<boolean> {
    if (!db || !giverId || !receiverId || !matchId || giverId === receiverId) return false;
    const likeRef = doc(db, 'likes', likeDocumentId(matchId, giverId));
    return runTransaction(db, async transaction => {
        const existing = await transaction.get(likeRef);
        if (existing.exists()) return existing.data().receiverId === receiverId;
        transaction.set(likeRef, { giverId, receiverId, matchId, createdAt: serverTimestamp() });
        return true;
    });
}

export async function getLikesForMatch(matchId: string): Promise<Like[]> {
    if (!db) return [];
    const snapshot = await getDocs(query(collection(db, 'likes'), where('matchId', '==', matchId)));
    return snapshot.docs.map(item => toLike(item.data()));
}

export async function getPlayerLikes(playerId: string): Promise<Like[]> {
    if (!db) return [];
    const snapshot = await getDocs(query(collection(db, 'likes'), where('receiverId', '==', playerId)));
    return snapshot.docs.map(item => toLike(item.data()));
}

export async function getLikeCount(playerId: string): Promise<number> {
    if (!db) return 0;
    const snapshot = await getDocs(query(collection(db, 'likes'), where('receiverId', '==', playerId)));
    return snapshot.size;
}

export async function getGivenLikeInMatch(giverId: string, matchId: string): Promise<string | null> {
    if (!db) return null;
    const snapshot = await getDoc(doc(db, 'likes', likeDocumentId(matchId, giverId)));
    return snapshot.exists() ? String(snapshot.data().receiverId || '') || null : null;
}

const toLike = (data: Record<string, unknown>): Like => ({
    giverId: String(data.giverId || ''),
    receiverId: String(data.receiverId || ''),
    matchId: String(data.matchId || ''),
    createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate() : new Date(),
});
