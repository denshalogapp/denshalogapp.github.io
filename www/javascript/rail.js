import { db } from './firebase.js';
import { collection, getDocs, doc, getDoc } from 'firebase/firestore';

let map;
const markers = {};
let allStations = [];
let allJoins = [];
let lineColors = {};
let polylines = [];
let stationLookup = {};

window.initMap = async function() {
    const centerView = { lat: 35.6325, lng: 139.6525 };
    map = new google.maps.Map(document.getElementById("map"), {
        zoom: 14.8, 
        minZoom: 13,
        isFractionalZoomEnabled: true,
        center: centerView,
        disableDefaultUI: true,
        styles: [
            { featureType: "poi", elementType: "labels", stylers: [{ visibility: "off" }] },
            { featureType: "transit", stylers: [{ visibility: "off" }] }
        ]
    });

    const [stations, lines, joins] = await Promise.all([
        syncStationData(),
        syncLineData(),
        syncJoinData()
    ]);

    const coordMap = {};
    stations.forEach(s => {
        const key = `${s.lat}_${s.lon}`;
        if (!coordMap[key]) coordMap[key] = [];
        coordMap[key].push(s);
    });

    Object.values(coordMap).forEach(group => {
        if (group.length === 1) {
            group[0].displayLat = Number(group[0].lat);
            group[0].displayLon = Number(group[0].lon);
        } else {
            const radius = 0.00015;
            group.forEach((station, index) => {
                const angle = (index / group.length) * Math.PI * 2;
                station.displayLat = Number(station.lat) + (Math.cos(angle) * radius);
                const latRad = Number(station.lat) * (Math.PI / 180);
                station.displayLon = Number(station.lon) + ((Math.sin(angle) * radius) / Math.cos(latRad));
            });
        }
    });

    allStations = stations;
    lineColors = lines;
    allJoins = joins;

    allStations.forEach(s => {
        stationLookup[String(s.station_id || s.id)] = s;
    });

    renderPolylines();
    renderVisibleMarkers();

    map.addListener('idle', () => {
        renderVisibleMarkers();
    });

    map.addListener('zoom_changed', () => {
        const currentZoom = map.getZoom();
        const newScale = Math.max(6, currentZoom - 4.2);
        const newStroke = Math.max(4, currentZoom * 0.4);
        const lineStroke = Math.max(2, currentZoom * 0.25);

        Object.values(markers).forEach(marker => {
            const icon = marker.getIcon();
            if (icon) {
                icon.scale = newScale;
                icon.strokeWeight = newStroke;
                marker.setIcon(icon);
            }
        });

        polylines.forEach(poly => {
            poly.setOptions({ strokeWeight: lineStroke });
        });
    });
};

async function syncStationData() {
    const configRef = doc(db, 'metadata', 'config');
    const configSnap = await getDoc(configRef);
    const remoteVersion = configSnap.exists() ? configSnap.data().stationVersion : 0;

    const localVersion = localStorage.getItem('stationVersion');
    let localData = localStorage.getItem('stationData');

    if (!localVersion || Number(localVersion) < remoteVersion || !localData) {
        const stationsRef = collection(db, 'stations');
        const snapshot = await getDocs(stationsRef);
        const stations = [];
        
        snapshot.forEach(docSnap => {
            stations.push({ id: docSnap.id, ...docSnap.data() });
        });

        localStorage.setItem('stationData', JSON.stringify(stations));
        localStorage.setItem('stationVersion', remoteVersion.toString());
        return stations;
    }

    return JSON.parse(localData);
}

async function syncLineData() {
    const configRef = doc(db, 'metadata', 'config');
    const configSnap = await getDoc(configRef);
    const remoteVersion = configSnap.exists() ? configSnap.data().stationVersion : 0;

    const localVersion = localStorage.getItem('lineVersion');
    let localData = localStorage.getItem('lineData');

    if (!localVersion || Number(localVersion) < remoteVersion || !localData) {
        const linesRef = collection(db, 'lines');
        const snapshot = await getDocs(linesRef);
        const colors = {};

        snapshot.forEach(docSnap => {
            const data = docSnap.data();
            const lineId = docSnap.id; 
            
            const colorValue = data.color || data.line_color_c || data.line_color;
            if (colorValue) {
                const colorStr = String(colorValue);
                const formattedColor = colorStr.startsWith('#') ? colorStr : '#' + colorStr;
                colors[String(lineId)] = formattedColor;
            }
        });

        localStorage.setItem('lineData', JSON.stringify(colors));
        localStorage.setItem('lineVersion', remoteVersion.toString());
        return colors;
    }
    return JSON.parse(localData);
}

async function syncJoinData() {
    const configRef = doc(db, 'metadata', 'config');
    const configSnap = await getDoc(configRef);
    const remoteVersion = configSnap.exists() ? configSnap.data().stationVersion : 0;

    const localVersion = localStorage.getItem('joinVersion');
    let localData = localStorage.getItem('joinData');

    if (!localVersion || Number(localVersion) < remoteVersion || !localData) {
        const joinsRef = collection(db, 'joins');
        const snapshot = await getDocs(joinsRef);
        const joins = [];
        
        snapshot.forEach(docSnap => {
            joins.push({ id: docSnap.id, ...docSnap.data() });
        });

        localStorage.setItem('joinData', JSON.stringify(joins));
        localStorage.setItem('joinVersion', remoteVersion.toString());
        return joins;
    }

    return JSON.parse(localData);
}

function renderPolylines() {
    const currentZoom = map.getZoom();
    const lineStroke = Math.max(2, currentZoom * 0.25);

    allJoins.forEach(join => {
        const station1 = stationLookup[String(join.station_id1)];
        const station2 = stationLookup[String(join.station_id2)];

        if (station1 && station2) {
            const lineKey = String(join.line_id);
            const strokeColor = lineColors[lineKey] || "#444444";

            const polyline = new google.maps.Polyline({
                path: [
                    { lat: station1.displayLat, lng: station1.displayLon },
                    { lat: station2.displayLat, lng: station2.displayLon }
                ],
                geodesic: true,
                strokeColor: strokeColor,
                strokeOpacity: 1.0,
                strokeWeight: lineStroke,
                zIndex: 1,
                map: map
            });

            polylines.push(polyline);
        }
    });
}

function renderVisibleMarkers() {
    const bounds = map.getBounds();
    if (!bounds) return;

    const ne = bounds.getNorthEast();
    const sw = bounds.getSouthWest();
    const currentZoom = map.getZoom();
    const currentScale = Math.max(6, currentZoom - 4.2);
    const currentStroke = Math.max(4, currentZoom * 0.4);

    allStations.forEach(station => {
        const inView = station.displayLat >= sw.lat() && station.displayLat <= ne.lat() && station.displayLon >= sw.lng() && station.displayLon <= ne.lng();

        if (inView) {
            if (!markers[station.id]) {
                const lineKey = String(station.line_id); 
                const markerColor = lineColors[lineKey] || "#444444";
                const stationLabel = station.name_jp || station.station_name || "Unknown";

                markers[station.id] = new google.maps.Marker({
                    position: { lat: station.displayLat, lng: station.displayLon },
                    map: map,
                    title: stationLabel,
                    icon: {
                        path: google.maps.SymbolPath.CIRCLE,
                        scale: currentScale,
                        fillColor: "#FFFFFF",
                        fillOpacity: 1,
                        strokeWeight: currentStroke,
                        strokeColor: markerColor,
                    },
                    zIndex: 2 
                });
            } else if (markers[station.id].getMap() !== map) {
                markers[station.id].setMap(map);
            }
        } else if (markers[station.id] && markers[station.id].getMap() !== null) {
            markers[station.id].setMap(null);
        }
    });
}

const script = document.createElement('script');
script.src = `https://maps.googleapis.com/maps/api/js?key=${import.meta.env.VITE_GOOGLE_MAPS_KEY}&callback=initMap`;
script.async = true;
script.defer = true;
document.head.appendChild(script);