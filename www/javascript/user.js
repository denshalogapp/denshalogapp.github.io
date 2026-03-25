import { db } from './firebase.js';
import { doc, collection, onSnapshot, setDoc, deleteDoc, arrayUnion, arrayRemove } from 'firebase/firestore';

export const CURRENT_USER_ID = "liam_test_user";
export let visitedStations = []; 
export const userStamps = {}; // Using const so the reference remains the same for other modules

/**
 * Checks if a station has been marked as visited
 */
export function isVisited(stationId) {
    return visitedStations.includes(String(stationId));
}

/**
 * Adds/Removes a station ID from the user's visited_stations array in Firestore
 */
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

/**
 * Saves a processed stamp image to a Firestore subcollection
 */
export async function saveStamp(id, b64) {
    if (!id) return;
    const stampRef = doc(db, 'users', CURRENT_USER_ID, 'stamps', String(id));
    await setDoc(stampRef, { 
        image: b64, 
        timestamp: Date.now() 
    });
}

/**
 * Deletes a stamp from Firestore
 */
export async function deleteStamp(id) {
    if (!id) return;
    const stampRef = doc(db, 'users', CURRENT_USER_ID, 'stamps', String(id));
    await deleteDoc(stampRef);
}

/**
 * Live Sync: Keeps the local app state in sync with Firestore
 */
export function initProfileSync() {
    // 1. Sync Visited Stations and Profile Stats
    onSnapshot(doc(db, 'users', CURRENT_USER_ID), (docSnap) => {
        if (docSnap.exists()) {
            const data = docSnap.data();
            visitedStations = data.visited_stations || [];
            
            // Re-render map markers if the function exists
            if (window.renderVisibleMarkers) window.renderVisibleMarkers();
            
            // Notify list components to re-render
            window.dispatchEvent(new CustomEvent('visitedDataUpdated'));
         
            // RESTORED: Update Profile UI text
            const streakEl = document.querySelector('#profile-container span.text-2xl:nth-of-type(1)');
            const alertsEl = document.querySelector('#profile-container span.text-2xl:nth-of-type(2)');
            if (streakEl) streakEl.innerText = `${data.streak || 0}d`;
            if (alertsEl) alertsEl.innerText = data.alerts || 0;
        }
    });

    // 2. Sync Stamps Subcollection
    const stampsRef = collection(db, 'users', CURRENT_USER_ID, 'stamps');
    onSnapshot(stampsRef, (snapshot) => {
        // Clear local object keys without changing the object reference
        Object.keys(userStamps).forEach(key => delete userStamps[key]);
        
        snapshot.forEach((doc) => {
            userStamps[doc.id] = doc.data().image;
        });
        
        // Notify list components that stamp data has changed
        window.dispatchEvent(new CustomEvent('visitedDataUpdated'));
    });
}