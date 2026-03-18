import { state, selectors } from './list_state.js';
import { renderLines } from './list_render.js';

export function populatePrefectures() {
    let html = `<div class="pref-option flex items-center px-5 py-3 cursor-pointer hover:bg-gray-50 border-b-[2px] border-black last:border-b-0" data-value="">
                    <span class="text-xs font-black uppercase">All Prefectures</span>
                </div>`;
    state.prefectures.forEach(p => {
        const id = p.pref_id || p.id;
        const name = p.pref_name_en || p.name_en;
        html += `<div class="pref-option flex items-center px-5 py-3 cursor-pointer hover:bg-gray-50 border-b-[2px] border-black last:border-b-0" data-value="${id}" data-name="${name}">
                    <span class="text-xs font-black uppercase">${name}</span>
                </div>`;
    });
    selectors.prefMenu.innerHTML = html;
    selectors.prefMenu.querySelectorAll('.pref-option').forEach(item => {
        item.onclick = (e) => {
            e.stopPropagation();
            state.currentPrefId = item.dataset.value;
            selectors.prefSelectedText.textContent = item.dataset.name || "All Prefectures";
            selectors.prefMenu.classList.add('hidden');
            state.currentCompId = "";
            selectors.compSelectedText.textContent = "All Companies";
            updateCompanyDropdown();
            renderLines();
        };
    });
}

export function populateCompanies(filteredCompanies = state.companies) {
    let html = `<div class="comp-option flex items-center px-5 py-3 cursor-pointer hover:bg-gray-50 border-b-[2px] border-black last:border-b-0" data-value="">
                    <span class="text-xs font-black uppercase">All Companies</span>
                </div>`;
    filteredCompanies.forEach(c => {
        const id = c.company_id || c.id;
        const name = c.company_name_en || c.name_en || c.company_name_jp;
        html += `<div class="comp-option flex items-center px-5 py-3 cursor-pointer hover:bg-gray-50 border-b-[2px] border-black last:border-b-0" data-value="${id}" data-name="${name}">
                    <span class="text-xs font-black uppercase">${name}</span>
                </div>`;
    });
    selectors.compMenu.innerHTML = html;
    selectors.compMenu.querySelectorAll('.comp-option').forEach(item => {
        item.onclick = (e) => {
            e.stopPropagation();
            state.currentCompId = item.dataset.value;
            selectors.compSelectedText.textContent = item.dataset.name || "All Companies";
            selectors.compMenu.classList.add('hidden');
            renderLines();
        };
    });
}

export function updateCompanyDropdown() {
    if (!state.currentPrefId) {
        populateCompanies(state.companies);
        return;
    }
    const validLineIds = new Set(state.localStations
        .filter(s => String(s.pref_cd || s.pref_id) === String(state.currentPrefId))
        .map(s => String(s.line_id)));
    const validCompanyIds = new Set();
    validLineIds.forEach(lId => {
        const line = state.localLines[lId];
        if (line && (line.company_id || line.company_cd)) {
            validCompanyIds.add(String(line.company_id || line.company_cd));
        }
    });
    populateCompanies(state.companies.filter(c => validCompanyIds.has(String(c.company_id || c.id))));
}

export function handleSearch(e) {
    const query = e.target.value.trim().toLowerCase();
    if (!query) {
        selectors.searchDropdown.classList.add('hidden');
        return;
    }
    // Search logic for lines and stations
    const matchedLines = Object.entries(state.localLines).filter(([, d]) => (d.name_en || '').toLowerCase().includes(query)).slice(0, 5);
    const matchedStations = state.localStations.filter(s => (s.station_name_en || '').toLowerCase().includes(query) || (s.station_name_jp || '').toLowerCase().includes(query)).slice(0, 10);

    let html = '';
    matchedLines.forEach(([id, data]) => {
        html += `<div class="search-result flex items-center gap-3 px-5 py-3 cursor-pointer hover:bg-gray-50 border-b-[2px] border-black last:border-b-0" onclick="window.selectLineAndScroll('${id}')">
                    <div class="w-10 h-3 rounded-full border-[2px] border-black" style="background-color:${data.color}"></div>
                    <span class="text-xs font-black uppercase">${data.name_en}</span>
                </div>`;
    });
    selectors.searchDropdown.innerHTML = html || '<div class="px-5 py-4 text-xs font-black uppercase text-gray-400">No results</div>';
    selectors.searchDropdown.classList.remove('hidden');
}

window.selectLineAndScroll = (lineId) => {
    selectors.searchDropdown.classList.add('hidden');
    selectors.searchInput.value = '';
    // Add logic to scroll to and highlight card if needed
};