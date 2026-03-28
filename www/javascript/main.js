import { initButtons } from './ui.js';
import { initSearch } from './search.js';
import { initProfileSync, isVisited, toggleStation } from './user.js';
import { initStampScanner, showLineDetail, getCurrentLineId } from './list_detail.js';
import { initModelUI } from './model_ui.js';
import { initSettings } from './settings.js';
import { Capacitor } from '@capacitor/core';

// This will add class="ios", class="android", or class="web" to your HTML tag
const platform = Capacitor.getPlatform();
document.documentElement.classList.add(platform);

window.isVisited = isVisited;

function initAll() {
    initSettings();
    initButtons();
    initSearch();
    initProfileSync();
    initStampScanner();
    initModelUI(() => {
        const lineId = getCurrentLineId();
        if (lineId) showLineDetail(lineId);
    });
}

document.addEventListener("DOMContentLoaded", initAll);
document.addEventListener("turbo:load", initAll);