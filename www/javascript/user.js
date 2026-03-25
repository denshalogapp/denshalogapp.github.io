import { db } from './firebase.js';
import { doc, collection, onSnapshot, setDoc, deleteDoc, arrayUnion, arrayRemove } from 'firebase/firestore';

export const CURRENT_USER_ID = "liam_test_user";
export let visitedStations = []; 
export let userStamps = {};

export function isVisited(stationId) {
    return visitedStations.includes(String(stationId));
}

export async function toggleStation(stationId) {
    if (!stationId) return;
    const userRef = doc(db, 'users', CURRENT_USER_ID);
    const isAlreadyVisited = isVisited(stationId);

    if (isAlreadyVisited) {
        await setDoc(userRef, {
            visited_stations: arrayRemove(String(stationId))
        }, { merge: true });
    } else {
        await setDoc(userRef, {
            visited_stations: arrayUnion(String(stationId))
        }, { merge: true });
    }
}

export async function saveStamp(stationId, base64Image) {
    if (!stationId) return;
    const stampRef = doc(db, 'users', CURRENT_USER_ID, 'stamps', String(stationId));
    await setDoc(stampRef, { image: base64Image, timestamp: Date.now() });
}

export async function deleteStamp(stationId) {
    if (!stationId) return;
    const stampRef = doc(db, 'users', CURRENT_USER_ID, 'stamps', String(stationId));
    await deleteDoc(stampRef);
}

export function initProfileSync() {
    const userRef = doc(db, 'users', CURRENT_USER_ID);
    onSnapshot(userRef, (docSnap) => {
        if (docSnap.exists()) {
            const data = docSnap.data();
            visitedStations = data.visited_stations || [];
            
            if (window.renderVisibleMarkers) window.renderVisibleMarkers();
            
            window.dispatchEvent(new CustomEvent('visitedDataUpdated'));
         
            const streakEl = document.querySelector('#profile-container span.text-2xl:nth-of-type(1)');
            const alertsEl = document.querySelector('#profile-container span.text-2xl:nth-of-type(2)');
            if (streakEl) streakEl.innerText = `${data.streak || 0}d`;
            if (alertsEl) alertsEl.innerText = data.alerts || 0;
        }
    });

    const stampsRef = collection(db, 'users', CURRENT_USER_ID, 'stamps');
    onSnapshot(stampsRef, (snapshot) => {
        userStamps = {};
        snapshot.forEach((doc) => {
            userStamps[doc.id] = doc.data().image;
        });
        window.dispatchEvent(new CustomEvent('visitedDataUpdated'));
    });
}