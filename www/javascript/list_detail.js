import { state, selectors } from './list_state.js';

export async function showLineDetail(lineId) {
    const line = state.localLines[lineId];
    const stations = state.localStations.filter(s => String(s.line_id) === String(lineId));

    selectors.detailContainer.classList.remove('hidden');

    const visitedCount = stations.filter(s => window.isVisited?.(s.id)).length;
    const totalCount = line.total_stations || stations.length;

    selectors.detailLineName.innerText = line.name_en;
    selectors.detailFraction.innerText = `${visitedCount}/${totalCount}`;
    selectors.detailProgressBar.style.width = `${(visitedCount / totalCount) * 100}%`;
    selectors.detailProgressBar.style.backgroundColor = line.color || 'black';
    selectors.detailTrackLine.style.backgroundColor = line.color || '#4b5563';

    selectors.detailStationsList.innerHTML = stations.map(s => {
        const visited = window.isVisited?.(s.id);
        const dotColor = visited ? '#B2FF59' : '#FFFFFF';
        return `
            <div class="flex items-start gap-6 ml-1 station-item">
                <div class="station-dot w-8 h-8 rounded-full border-[4px] border-black z-20 shrink-0 mt-1 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]" 
                     style="background-color: ${dotColor}">
                </div>
                <div class="flex flex-col gap-2">
                    <span class="text-xl font-black uppercase tracking-tight leading-none pt-2">
                        ${s.station_name_en || s.station_name_jp}
                    </span>
                    <button class="bg-white border-[3px] border-black px-4 py-2 rounded-xl text-[10px] font-black uppercase shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:shadow-none active:translate-x-[2px] active:translate-y-[2px] transition-all w-max mt-1">
                        + Add Stamp
                    </button>
                </div>
            </div>
        `;
    }).join('');

    requestAnimationFrame(() => {
        const dots = selectors.detailStationsList.querySelectorAll('.station-dot');
        if (dots.length > 0) {
            const firstDot = dots[0];
            const lastDot = dots[dots.length - 1];
            const centerOffset = 20; 

            selectors.detailTrackLine.style.top = `${firstDot.offsetTop + centerOffset}px`;
            selectors.detailTrackLine.style.height = `${lastDot.offsetTop - firstDot.offsetTop}px`;
        }
        selectors.detailContainer.classList.remove('translate-x-full');
    });
}