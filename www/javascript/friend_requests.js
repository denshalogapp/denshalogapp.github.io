import { db } from './firebase.js';
import { collection, query, where, getDocs, addDoc, doc, getDoc } from 'firebase/firestore';
import { CURRENT_USER_ID, CURRENT_USERNAME, IS_ANONYMOUS } from './user.js';
import { t } from './i18n.js';

export async function findUserByUsername(username) {
    const targetUsername = username.trim();
    if (!targetUsername) return null;

    const usersRef = collection(db, 'users');
    const userQuery = query(usersRef, where('username', '==', targetUsername));
    const snapshot = await getDocs(userQuery);

    return snapshot.empty ? null : snapshot.docs[0];
}

export async function sendFriendRequestToUser(targetUserId, targetUsername = '') {
    if (IS_ANONYMOUS || !CURRENT_USER_ID) {
        throw new Error(t('auth.login'));
    }

    if (!targetUserId) {
        throw new Error(t('profile.errorUserNotFound'));
    }

    if (CURRENT_USER_ID === targetUserId || (targetUsername && CURRENT_USERNAME === targetUsername)) {
        throw new Error(t('profile.errorCannotAddSelf'));
    }

    const [currentUserDoc, targetUserDoc] = await Promise.all([
        getDoc(doc(db, 'users', CURRENT_USER_ID)),
        getDoc(doc(db, 'users', targetUserId))
    ]);

    if (!targetUserDoc.exists()) {
        throw new Error(t('profile.errorUserNotFound'));
    }

    const currentFriends = currentUserDoc.exists() ? (currentUserDoc.data().friends || []) : [];
    if (currentFriends.includes(targetUserId)) {
        throw new Error(t('profile.errorAlreadyFriends'));
    }

    const reqQuery = query(
        collection(db, 'friend_requests'),
        where('from', '==', CURRENT_USER_ID),
        where('to', '==', targetUserId)
    );
    const reqSnapshot = await getDocs(reqQuery);
    if (!reqSnapshot.empty) {
        throw new Error(t('profile.errorRequestSent'));
    }

    await addDoc(collection(db, 'friend_requests'), {
        from: CURRENT_USER_ID,
        fromUsername: CURRENT_USERNAME,
        to: targetUserId,
        status: 'pending',
        timestamp: new Date()
    });
}