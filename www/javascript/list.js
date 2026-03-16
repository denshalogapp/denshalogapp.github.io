import { db } from './firebase.js';
import { collection, getDocs } from 'firebase/firestore';

const listFrame = document.getElementById('list-frame');
const linesContainer = document.getElementById('list-lines-container');
const searchInput = document.getElementById('list-search-input');
const searchDropdown = document.getElementById('list-search-dropdown');

const prefSelector = document.getElementById('pref-selector');
const prefSelectedText = document.getElementById('pref-selected-text');
const prefMenu = document.getElementById('pref-dropdown-menu');

const compSelector = document.getElementById('comp-selector');
const compSelectedText = document.getElementById('comp-selected-text');
const compMenu = document.getElementById('comp-dropdown-menu');

let prefectures = [];
let companies = [];
let localLines = {};
let localStations = [];

let currentPrefId = "";
let currentCompId = "";

let currentFilteredLines = [];
let renderIndex = 0;
const RENDER_CHUNK_SIZE = 20;
let observer = null;
const sentinel = document.createElement('div');
sentinel.className = 'w-full h-10';

async function initList() {
    if (!listFrame) return;

    localStations = window.allStations || JSON.parse(localStorage.getItem('stationData') || '[]');
    localLines = window.lineData || window.lineColors || JSON.parse(localStorage.getItem('lineData') || '{}');

    const prefSnap = await getDocs(collection(db, 'prefectures'));
    prefectures = prefSnap.docs.map(d => ({ id: d.id, ...d.data() }));

    const compSnap = await getDocs(collection(db, 'companies'));
    companies = compSnap.docs.map(d => ({ id: d.id, ...d.data() }));

    populatePrefectures();
    populateCompanies();

    observer = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting) {
            renderNextChunk();
        }
    }, { root: null, rootMargin: '200px' });

    prefSelector.addEventListener('click', (e) => {
        e.stopPropagation();
        prefMenu.classList.toggle('hidden');
        compMenu.classList.add('hidden');
        searchDropdown.classList.add('hidden');
    });

    compSelector.addEventListener('click', (e) => {
        e.stopPropagation();
        compMenu.classList.toggle('hidden');
        prefMenu.classList.add('hidden');
        searchDropdown.classList.add('hidden');
    });

    searchInput.addEventListener('input', handleSearch);
    searchInput.addEventListener('click', () => {
        prefMenu.classList.add('hidden');
        compMenu.classList.add('hidden');
    });

    let attempts = 0;
    while (!window.isVisited && attempts < 40) {
        await new Promise(r => setTimeout(r, 50));
        attempts++;
    }

    localStations = window.allStations || localStations;
    localLines = window.lineData || window.lineColors || localLines;

    renderLines();
}

function populatePrefectures() {
    let html = `
        <div class="pref-option flex items-center px-5 py-3 cursor-pointer hover:bg-gray-50 border-b-[2px] border-black last:border-b-0" data-value="">
            <span class="text-xs font-black uppercase">All Prefectures</span>
        </div>
    `;
    prefectures.forEach(p => {
        const id = p.pref_id || p.id;
        const name = p.pref_name_en || p.name_en;
        html += `
            <div class="pref-option flex items-center px-5 py-3 cursor-pointer hover:bg-gray-50 border-b-[2px] border-black last:border-b-0" data-value="${id}" data-name="${name}">
                <span class="text-xs font-black uppercase">${name}</span>
            </div>
        `;
    });
    prefMenu.innerHTML = html;

    prefMenu.querySelectorAll('.pref-option').forEach(item => {
        item.addEventListener('click', (e) => {
            e.stopPropagation();
            currentPrefId = item.dataset.value;
            prefSelectedText.textContent = item.dataset.name || "All Prefectures";
            prefMenu.classList.add('hidden');
            
            currentCompId = "";
            compSelectedText.textContent = "All Companies";
            updateCompanyDropdown();
            renderLines();
        });
    });
}

function populateCompanies(filteredCompanies = companies) {
    let html = `
        <div class="comp-option flex items-center px-5 py-3 cursor-pointer hover:bg-gray-50 border-b-[2px] border-black last:border-b-0" data-value="">
            <span class="text-xs font-black uppercase">All Companies</span>
        </div>
    `;
    filteredCompanies.forEach(c => {
        const id = c.company_id || c.id;
        const name = c.company_name_en || c.name_en || c.company_name_jp;
        html += `
            <div class="comp-option flex items-center px-5 py-3 cursor-pointer hover:bg-gray-50 border-b-[2px] border-black last:border-b-0" data-value="${id}" data-name="${name}">
                <span class="text-xs font-black uppercase">${name}</span>
            </div>
        `;
    });
    compMenu.innerHTML = html;

    compMenu.querySelectorAll('.comp-option').forEach(item => {
        item.addEventListener('click', (e) => {
            e.stopPropagation();
            currentCompId = item.dataset.value;
            compSelectedText.textContent = item.dataset.name || "All Companies";
            compMenu.classList.add('hidden');
            renderLines();
        });
    });
}

function updateCompanyDropdown() {
    if (!currentPrefId) {
        populateCompanies(companies);
        return;
    }

    const validLineIds = new Set(
        localStations
            .filter(s => String(s.pref_cd || s.pref_id) === String(currentPrefId))
            .map(s => String(s.line_id))
    );

    const validCompanyIds = new Set();
    validLineIds.forEach(lId => {
        const line = localLines[lId];
        if (line && (line.company_id || line.company_cd)) {
            validCompanyIds.add(String(line.company_id || line.company_cd));
        }
    });

    const filtered = companies.filter(c => validCompanyIds.has(String(c.company_id || c.id)));
    populateCompanies(filtered);
}

function renderLines() {
    linesContainer.innerHTML = '';
    renderIndex = 0;
    
    let targetLineIds = Object.keys(localLines);

    if (!currentPrefId && !currentCompId) {
        targetLineIds = targetLineIds.filter(id => {
            const stationsOnLine = localStations.filter(s => String(s.line_id) === String(id));
            return stationsOnLine.some(s => window.isVisited && window.isVisited(s.id));
        });
    } else {
        if (currentPrefId) {
            const prefLineIds = new Set(
                localStations
                    .filter(s => String(s.pref_cd || s.pref_id) === String(currentPrefId))
                    .map(s => String(s.line_id))
            );
            targetLineIds = targetLineIds.filter(id => prefLineIds.has(id));
        }

        if (currentCompId) {
            targetLineIds = targetLineIds.filter(id => {
                const line = localLines[id];
                return line && String(line.company_id || line.company_cd) === String(currentCompId);
            });
        }
    }

    currentFilteredLines = targetLineIds;
    renderNextChunk();
}

function renderNextChunk() {
    const chunk = currentFilteredLines.slice(renderIndex, renderIndex + RENDER_CHUNK_SIZE);
    if (chunk.length === 0) return;

    if (sentinel.parentNode) {
        observer.unobserve(sentinel);
        sentinel.remove();
    }

    chunk.forEach(lineId => {
        const line = localLines[lineId];
        if (!line) return;

        const stationsOnLine = localStations.filter(s => String(s.line_id) === String(lineId));
        if (stationsOnLine.length === 0) return;

        const total = line.total_stations || stationsOnLine.length;
        let visited = 0;
        
        if (window.isVisited) {
            visited = stationsOnLine.filter(s => window.isVisited(s.id)).length;
        }

        const card = document.createElement('div');
        card.id = `line-card-${lineId}`;
        card.className = "bg-white border-[5px] border-black p-6 rounded-[32px] shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] flex flex-col gap-4 transition-all";

        const progressSegments = Array.from({ length: total }).map((_, i) => {
            const color = i < visited ? 'bg-[#B2FF59]' : 'bg-gray-200';
            return `<div class="flex-1 h-full rounded-sm ${color}"></div>`;
        }).join('');

        card.innerHTML = `
            <div class="flex items-center justify-between gap-4">
                <h3 class="text-black font-black text-2xl leading-tight uppercase tracking-tight break-words flex-1">${line.name_en || 'Unknown Line'}</h3>
                <div class="w-20 h-20 shrink-0 bg-white border-[4px] border-black rounded-full shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex items-center justify-center text-black font-black italic" style="box-shadow: 4px 4px 0px 0px ${line.color || '#000'}">
                    <div class="flex items-baseline mt-1">
                        <span class="text-3xl leading-none">${visited}</span>
                        <span class="mx-0.5 opacity-40 text-xl leading-none">/</span>
                        <span class="text-sm opacity-60 leading-none">${total}</span>
                    </div>
                </div>
            </div>
            <div class="w-full flex gap-1 h-3 mt-2">
                ${progressSegments}
            </div>
        `;
        linesContainer.appendChild(card);
    });

    renderIndex += RENDER_CHUNK_SIZE;

    if (renderIndex < currentFilteredLines.length) {
        linesContainer.appendChild(sentinel);
        observer.observe(sentinel);
    }
}

function handleSearch(e) {
    const query = e.target.value.trim().toLowerCase();
    if (!query) {
        searchDropdown.classList.add('hidden');
        searchDropdown.innerHTML = '';
        return;
    }

    const matchedLines = Object.entries(localLines)
        .filter(([, d]) => (d.name_en || '').toLowerCase().includes(query))
        .slice(0, 5);

    const matchedStations = localStations
        .filter(s => (s.station_name_en || '').toLowerCase().includes(query) || (s.station_name_jp || '').toLowerCase().includes(query))
        .slice(0, 10);

    if (matchedLines.length === 0 && matchedStations.length === 0) {
        searchDropdown.innerHTML = '<div class="px-5 py-4 text-xs font-black uppercase text-gray-400">No results</div>';
        searchDropdown.classList.remove('hidden');
        return;
    }

    let html = '';

    matchedLines.forEach(([lineId, lineData]) => {
        html += `
            <div class="search-result flex items-center gap-3 px-5 py-3 cursor-pointer hover:bg-gray-50 border-b-[2px] border-black last:border-b-0" data-type="line" data-id="${lineId}">
                <div class="w-10 h-3 rounded-full border-[2px] border-black shrink-0" style="background-color:${lineData.color || '#000'}"></div>
                <span class="text-xs font-black uppercase">${lineData.name_en}</span>
                <span class="ml-auto text-[10px] font-black uppercase text-gray-400">Line</span>
            </div>
        `;
    });

    matchedStations.forEach(s => {
        const line = localLines[String(s.line_id)];
        html += `
            <div class="search-result flex items-center gap-3 px-5 py-3 cursor-pointer hover:bg-gray-50 border-b-[2px] border-black last:border-b-0" data-type="station" data-id="${s.id}" data-line="${s.line_id}">
                <div class="w-4 h-4 rounded-full border-[3px] border-black shrink-0 bg-white" style="border-color:${line?.color || '#000'}"></div>
                <span class="text-xs font-black uppercase">${s.station_name_en || s.station_name_jp}</span>
                <span class="ml-auto text-[10px] font-black uppercase text-gray-400">${line?.name_en || ''}</span>
            </div>
        `;
    });

    searchDropdown.innerHTML = html;
    searchDropdown.classList.remove('hidden');

    searchDropdown.querySelectorAll('.search-result').forEach(item => {
        item.addEventListener('click', () => {
            const type = item.dataset.type;
            const lineId = type === 'line' ? item.dataset.id : item.dataset.line;
            const stationId = type === 'station' ? item.dataset.id : null;

            searchDropdown.classList.add('hidden');
            searchInput.value = '';

            selectLineAndScroll(lineId, stationId);
        });
    });
}

function selectLineAndScroll(lineId, stationId) {
    const line = localLines[lineId];
    if (!line) return;

    let targetPref = null;
    if (stationId) {
        const st = localStations.find(s => String(s.id) === String(stationId));
        if (st) targetPref = st.pref_cd || st.pref_id;
    } else {
        const st = localStations.find(s => String(s.line_id) === String(lineId));
        if (st) targetPref = st.pref_cd || st.pref_id;
    }

    if (targetPref) {
        currentPrefId = String(targetPref);
        const pData = prefectures.find(p => String(p.pref_id || p.id) === currentPrefId);
        prefSelectedText.textContent = pData ? (pData.pref_name_en || pData.name_en) : "All Prefectures";
        updateCompanyDropdown();
    }

    if (line.company_id || line.company_cd) {
        currentCompId = String(line.company_id || line.company_cd);
        const cData = companies.find(c => String(c.company_id || c.id) === currentCompId);
        compSelectedText.textContent = cData ? (cData.company_name_en || cData.name_en || cData.company_name_jp) : "All Companies";
    }

    renderLines();

    const targetIndex = currentFilteredLines.indexOf(String(lineId));
    if (targetIndex !== -1) {
        while (renderIndex <= targetIndex) {
            renderNextChunk();
        }
    }

    setTimeout(() => {
        const card = document.getElementById(`line-card-${lineId}`);
        if (card) {
            card.scrollIntoView({ behavior: 'smooth', block: 'center' });
            card.classList.add('scale-[1.02]', 'ring-4', 'ring-[#FF80AB]');
            setTimeout(() => card.classList.remove('scale-[1.02]', 'ring-4', 'ring-[#FF80AB]'), 1500);
        }
    }, 100);
}

document.addEventListener('click', (e) => {
    if (!searchInput.contains(e.target) && !searchDropdown.contains(e.target)) {
        searchDropdown.classList.add('hidden');
    }
    if (!prefSelector.contains(e.target) && !prefMenu.contains(e.target)) {
        prefMenu.classList.add('hidden');
    }
    if (!compSelector.contains(e.target) && !compMenu.contains(e.target)) {
        compMenu.classList.add('hidden');
    }
});

initList();