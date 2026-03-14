const admin = require("firebase-admin");
const serviceAccount = require("./javascript/serviceAccountKey.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

// The database ID goes inside firestore()
const db = admin.firestore('eki-data');

async function getSamples() {
  try {
    console.log("--- STATION SAMPLE ---");
    const stationSnap = await db.collection('stations').limit(1).get();
    if (stationSnap.empty) {
      console.log("No stations found in 'stations' collection.");
    } else {
      stationSnap.forEach(doc => console.log(doc.id, "=>", JSON.stringify(doc.data(), null, 2)));
    }

    console.log("\n--- LINE SAMPLE ---");
    const lineSnap = await db.collection('lines').limit(1).get();
    if (lineSnap.empty) {
      console.log("No lines found in 'lines' collection.");
    } else {
      lineSnap.forEach(doc => console.log(doc.id, "=>", JSON.stringify(doc.data(), null, 2)));
    }
  } catch (err) {
    console.error("Error fetching data:", err);
  }
}

getSamples().then(() => process.exit());