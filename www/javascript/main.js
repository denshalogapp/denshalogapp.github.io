import { initButtons } from './ui.js';
import { initSearch } from './search.js';
import { initProfileSync, isVisited, toggleStation } from './user.js';
import { initStampScanner } from './list_detail.js';

window.isVisited = isVisited;

function initAll() {
    initButtons();
    initSearch();
    initProfileSync();
    initStampScanner(); // Critical call
}

document.addEventListener("DOMContentLoaded", initAll);
document.addEventListener("turbo:load", initAll);