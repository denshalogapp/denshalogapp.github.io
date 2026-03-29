import { lightenColor } from './map_utils.js';

export const markers = {};
export const decoMarkers = {};
export let userMarker = null;

export function renderVisibleMarkers(map, allStations, lineColors, activeLineFilter, showTooltip) {
    if (!map) return;
    const bounds = map.getBounds();
    if (!bounds) return;
    const ne = bounds.getNorthEast();
    const sw = bounds.getSouthWest();
    const currentZoom = map.getZoom();
    const currentScale = Math.max(8, currentZoom - 4);
    const currentStroke = Math.max(5, currentZoom * 0.5);

    allStations.forEach(station => {
        const inView = station.displayLat >= sw.lat() && station.displayLat <= ne.lat() && station.displayLon >= sw.lng() && station.displayLon <= ne.lng();
        
        if (inView) {
            const lineKey = String(station.line_id); 
            const lineData = lineColors[lineKey];
            const markerColor = lineData?.color || "#000000";
            const visited = window.isVisited?.(station.id);
            const isVisible = !(activeLineFilter && String(station.line_id) !== activeLineFilter);

            if (!markers[station.id]) {
                const size = currentScale * 2;
                const el = document.createElement('div');
                el.style.width = `${size}px`;
                el.style.height = `${size}px`;
                el.style.backgroundColor = visited ? lightenColor(markerColor, 40) : "#FFFFFF";
                el.style.border = `${currentStroke}px solid ${markerColor}`;
                el.style.borderRadius = '50%';
                el.style.transform = 'translateY(50%)'; 
                el.style.cursor = 'pointer';
                el.style.boxSizing = 'border-box';
                el.style.transition = 'background-color 0.2s ease, width 0.1s ease, height 0.1s ease, border-width 0.1s ease';

                const marker = new google.maps.marker.AdvancedMarkerElement({
                    position: { lat: station.displayLat, lng: station.displayLon },
                    map: isVisible ? map : null,
                    content: el,
                    zIndex: 2,
                    title: station.station_name_en || "Station"
                });

                marker.addListener('gmp-click', () => {
                    const currentVisited = window.isVisited?.(station.id);
                    showTooltip({ lat: station.displayLat, lng: station.displayLon }, {
                        stationId: station.id,
                        stationName: station.station_name_en || "Unknown Station",
                        lineName: lineData?.name_en || `Line ${lineKey}`,
                        color: lineData?.color || "#000000",
                        isVisited: currentVisited 
                    }, 'station');
                });

                markers[station.id] = { instance: marker, element: el };
            } else {
                const markerObj = markers[station.id];
                const size = currentScale * 2;
                
                markerObj.element.style.width = `${size}px`;
                markerObj.element.style.height = `${size}px`;
                markerObj.element.style.border = `${currentStroke}px solid ${markerColor}`;
                markerObj.element.style.backgroundColor = visited ? lightenColor(markerColor, 40) : "#FFFFFF";
                
                if (isVisible && markerObj.instance.map !== map) {
                    markerObj.instance.map = map;
                } else if (!isVisible && markerObj.instance.map !== null) {
                    markerObj.instance.map = null;
                }
            }
        } else if (markers[station.id] && markers[station.id].instance.map !== null) {
            markers[station.id].instance.map = null;
        }
    });
}

export function updateUserMarker(map, pos) {
    if (!userMarker) {
        const el = document.createElement('div');
        el.style.width = '20px';
        el.style.height = '20px';
        el.style.backgroundColor = '#4285F4';
        el.style.border = '4px solid #FFFFFF';
        el.style.borderRadius = '50%';
        el.style.transform = 'translateY(50%)';
        el.style.boxSizing = 'border-box';
        el.style.boxShadow = '0px 0px 4px rgba(0,0,0,0.4)';

        userMarker = new google.maps.marker.AdvancedMarkerElement({
            position: pos,
            map: map,
            content: el,
            zIndex: 999,
            title: "You are here"
        });
    } else {
        userMarker.position = pos;
    }
}