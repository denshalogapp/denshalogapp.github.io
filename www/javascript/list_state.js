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
    get listFrame() { return document.getElementById('list-frame'); },
    get linesContainer() { return document.getElementById('list-lines-container'); },
    get searchInput() { return document.getElementById('list-search-input'); },
    get searchDropdown() { return document.getElementById('list-search-dropdown'); },
    get prefSelector() { return document.getElementById('pref-selector'); },
    get prefSelectedText() { return document.getElementById('pref-selected-text'); },
    get prefMenu() { return document.getElementById('pref-dropdown-menu'); },
    get compSelector() { return document.getElementById('comp-selector'); },
    get compSelectedText() { return document.getElementById('comp-selected-text'); },
    get compMenu() { return document.getElementById('comp-dropdown-menu'); },
    get parentListContainer() { return document.getElementById('list-container'); },
    get detailContainer() { return document.getElementById('line-detail-container'); },
    get detailStationsList() { return document.getElementById('detail-stations-list'); },
    get detailModelsList() { return document.getElementById('detail-models-list'); },
    get detailLineName() { return document.getElementById('detail-line-name'); },
    get detailFraction() { return document.getElementById('detail-fraction'); },
    get detailProgressBar() { return document.getElementById('detail-progress-bar'); },
    get detailTrackLine() { return document.getElementById('detail-track-line'); },
    get backBtn() { return document.getElementById('line-detail-back'); },
    sentinel: (() => {
        const div = document.createElement('div');
        div.className = 'w-full h-10';
        return div;
    })()
};