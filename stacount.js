import 'dotenv/config';
import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, doc, updateDoc } from "firebase/firestore";

const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: "eki-story",
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.VITE_FIREBASE_APP_ID
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app, 'eki-data');

async function updateLineStationCounts() {
    try {
        console.log("Fetching data from Firestore...");
        const [stationsSnap, linesSnap] = await Promise.all([
            getDocs(collection(db, 'stations')),
            getDocs(collection(db, 'lines'))
        ]);

        const lineStationGroups = {};

        stationsSnap.forEach((sDoc) => {
            const data = sDoc.data();
            const lineId = String(data.line_id);
            // Group stations by their physical location ID (station_g_cd)
            const gCd = String(data.station_g_cd || data.station_id || sDoc.id);

            if (lineId && gCd) {
                if (!lineStationGroups[lineId]) {
                    lineStationGroups[lineId] = new Set();
                }
                lineStationGroups[lineId].add(gCd);
            }
        });

        const updatePromises = linesSnap.docs.map((lDoc) => {
            const lineId = lDoc.id;
            const total = lineStationGroups[lineId] ? lineStationGroups[lineId].size : 0;
            
            return updateDoc(doc(db, 'lines', lineId), {
                station_count: total
            });
        });

        await Promise.all(updatePromises);
        console.log(`Successfully updated counts for ${updatePromises.length} lines.`);

    } catch (error) {
        console.error("Update failed:", error.message);
    }
}

updateLineStationCounts();