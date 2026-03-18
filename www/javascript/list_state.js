export const state = {
    prefectures: [],
    companies: [],
    localLines: {},
    localStations: [],
    currentPrefId: "",
    currentCompId: "",
    currentFilteredLines: [],
    renderIndex: 0,
    observer: null
};

export const RENDER_CHUNK_SIZE = 20;

export const selectors = {
    listFrame: document.getElementById('list-frame'),
    linesContainer: document.getElementById('list-lines-container'),
    searchInput: document.getElementById('list-search-input'),
    searchDropdown: document.getElementById('list-search-dropdown'),
    prefSelector: document.getElementById('pref-selector'),
    prefSelectedText: document.getElementById('pref-selected-text'),
    prefMenu: document.getElementById('pref-dropdown-menu'),
    compSelector: document.getElementById('comp-selector'),
    compSelectedText: document.getElementById('comp-selected-text'),
    compMenu: document.getElementById('comp-dropdown-menu'),
    parentListContainer: document.getElementById('list-container'),
    detailContainer: document.getElementById('line-detail-container'),
    detailStationsList: document.getElementById('detail-stations-list'),
    detailLineName: document.getElementById('detail-line-name'),
    detailFraction: document.getElementById('detail-fraction'),
    detailProgressBar: document.getElementById('detail-progress-bar'),
    detailTrackLine: document.getElementById('detail-track-line'),
    backBtn: document.getElementById('line-detail-back'),
    sentinel: (() => {
        const div = document.createElement('div');
        div.className = 'w-full h-10';
        return div;
    })()
};