import { state, selectors } from './list_state.js';
import { userStamps, saveStamp, deleteStamp } from './user.js';
import { loadOpenCV } from './stamp_cv_loader.js';
import { startCamera, stopCamera } from './stamp_camera.js';
import { startCrop, handleCropInput, finalizeWarp } from './stamp_crop.js';
import { setupRefinement, handleRefineDraw, processFinalStamp } from './stamp_refine.js';

let currentStationId = null, currentLineId = null, viewingStationId = null, isFlipped = false, currentTool = 'brush';

export async function showLineDetail(lineId) {
    currentLineId = lineId;
    const line = state.localLines[lineId];
    const stations = state.localStations.filter(s => String(s.line_id) === String(lineId));
    selectors.detailContainer.classList.remove('hidden');

    const visitedCount = stations.filter(s => window.isVisited?.(s.id) || userStamps[s.id]).length;
    const totalCount = line.total_stations || stations.length;

    selectors.detailLineName.innerText = line.name_en;
    selectors.detailFraction.innerText = `${visitedCount}/${totalCount}`;
    selectors.detailProgressBar.style.width = `${(visitedCount / totalCount) * 100}%`;
    selectors.detailProgressBar.style.backgroundColor = line.color || 'black';
    selectors.detailTrackLine.style.backgroundColor = line.color || '#4b5563';

    selectors.detailStationsList.innerHTML = stations.map(s => {
        const visited = window.isVisited?.(s.id) || userStamps[s.id];
        const stampHtml = userStamps[s.id] ? `<div class="mt-4 mb-2 cursor-pointer stamp-image-preview transition-transform active:scale-95 w-max" data-station-id="${s.id}"><img src="${userStamps[s.id]}" class="w-32 h-32 object-cover border-[4px] border-black rounded-[20px] shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] bg-white -rotate-2"></div>` : '';
        return `<div class="flex items-start gap-6 ml-1 station-item">
            <div class="station-dot w-8 h-8 rounded-full border-[4px] border-black shrink-0 mt-1 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]" style="background-color: ${visited ? '#B2FF59' : '#FFF'}"></div>
            <div class="flex flex-col gap-2 w-full">
                <span class="text-xl font-black uppercase tracking-tight pt-2">${s.station_name_en || s.station_name_jp}</span>
                <button class="add-stamp-btn bg-white border-[3px] border-black px-4 py-2 rounded-xl text-[10px] font-black uppercase shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:shadow-none active:translate-x-[2px] active:translate-y-[2px] transition-all w-max mt-1" data-station-id="${s.id}" data-station-name="${s.station_name_en}" data-line-color="${line.color || '#B2FF59'}">+ Add Stamp</button>
                ${stampHtml}
            </div>
        </div>`;
    }).join('');
    
    requestAnimationFrame(() => {
        const dots = selectors.detailStationsList.querySelectorAll('.station-dot');
        if (dots.length > 1) {
            selectors.detailTrackLine.style.top = `${dots[0].offsetTop + 20}px`;
            selectors.detailTrackLine.style.height = `${dots[dots.length - 1].offsetTop - dots[0].offsetTop}px`;
        }
        selectors.detailContainer.classList.remove('translate-x-full');
    });
}

export function initStampScanner() {
    const els = {
        addCont: document.getElementById("add-stamp-container"),
        video: document.getElementById("camera-feed"),
        canvas: document.getElementById("camera-canvas"),
        place: document.getElementById("camera-placeholder"),
        pill: document.getElementById("stamp-station-pill"),
        cropCont: document.getElementById("crop-container"),
        cropCanvas: document.getElementById("crop-canvas"),
        cropWork: document.getElementById("crop-workspace"),
        refineCont: document.getElementById("refinement-container"),
        refineBase: document.getElementById("refine-base-canvas"),
        refineMask: document.getElementById("refine-mask-canvas"),
        refineWork: document.getElementById("refine-workspace"),
        ink: document.getElementById("ink-color-picker"),
        brush: document.getElementById("brush-size"),
        press: document.getElementById("ink-pressure"),
        flip: document.getElementById("tool-flip"),
        modalCont: document.getElementById("stamp-modal-container"),
        modalImg: document.getElementById("stamp-modal-image")
    };

    selectors.detailStationsList.addEventListener('click', e => {
        const btn = e.target.closest('.add-stamp-btn');
        if (btn) {
            currentStationId = btn.dataset.stationId;
            els.pill.innerText = btn.dataset.stationName;
            els.pill.style.backgroundColor = btn.dataset.lineColor;
            els.addCont.classList.remove("translate-y-full", "pointer-events-none");
            startCamera(els.video, els.place, loadOpenCV);
            return;
        }
        const prev = e.target.closest('.stamp-image-preview');
        if (prev) {
            viewingStationId = prev.dataset.stationId;
            els.modalImg.src = userStamps[viewingStationId];
            els.modalCont.classList.remove('opacity-0', 'pointer-events-none');
        }
    });

    document.getElementById("capture-stamp-btn").onclick = () => {
        els.canvas.width = els.video.videoWidth; els.canvas.height = els.video.videoHeight;
        els.canvas.getContext('2d').drawImage(els.video, 0, 0);
        const url = els.canvas.toDataURL('image/jpeg', 0.8);
        stopCamera(els.video, els.place);
        els.addCont.classList.add("translate-y-full", "pointer-events-none");
        startCrop(url, els.cropWork, els.cropCanvas);
    };

    document.getElementById("upload-stamp-input").onchange = (e) => {
        const file = e.target.files[0]; if (!file) return;
        const reader = new FileReader();
        reader.onload = (event) => {
            stopCamera(els.video, els.place);
            els.addCont.classList.add("translate-y-full", "pointer-events-none");
            startCrop(event.target.result, els.cropWork, els.cropCanvas);
            e.target.value = '';
        };
        reader.readAsDataURL(file);
    };

    els.cropCanvas.onmousedown = (e) => handleCropInput(e, els.cropCanvas, 'down');
    els.cropCanvas.ontouchstart = (e) => handleCropInput(e, els.cropCanvas, 'down');
    window.addEventListener('mousemove', (e) => handleCropInput(e, els.cropCanvas, 'move'));
    window.addEventListener('touchmove', (e) => handleCropInput(e, els.cropCanvas, 'move'), { passive: false });
    window.addEventListener('mouseup', () => handleCropInput(null, null, 'up'));
    window.addEventListener('touchend', () => handleCropInput(null, null, 'up'));

    document.getElementById("confirm-crop-btn").onclick = () => {
        if (!window.isCVModelLoaded) return;
        const warped = finalizeWarp(els.cropCanvas);
        els.cropCont.classList.add('translate-y-full', 'pointer-events-none');
        setupRefinement(warped, els.refineBase, els.refineMask, els.refineWork);
    };

    els.refineMask.onmousedown = (e) => handleRefineDraw(e, els.refineMask, currentTool, els.brush.value, 'start');
    els.refineMask.ontouchstart = (e) => handleRefineDraw(e, els.refineMask, currentTool, els.brush.value, 'start');
    els.refineMask.onmousemove = (e) => handleRefineDraw(e, els.refineMask, currentTool, els.brush.value, 'move');
    els.refineMask.ontouchmove = (e) => handleRefineDraw(e, els.refineMask, currentTool, els.brush.value, 'move'), { passive: false };
    window.addEventListener('mouseup', () => handleRefineDraw(null, null, null, null, 'stop'));
    window.addEventListener('touchend', () => handleRefineDraw(null, null, null, null, 'stop'));

    document.getElementById("tool-brush").onclick = () => { currentTool = 'brush'; document.getElementById("tool-brush").classList.add('border-white'); document.getElementById("tool-erase").classList.remove('border-white'); };
    document.getElementById("tool-erase").onclick = () => { currentTool = 'erase'; document.getElementById("tool-erase").classList.add('border-white'); document.getElementById("tool-brush").classList.remove('border-white'); };
    els.flip.onclick = () => { isFlipped = !isFlipped; els.refineBase.style.transform = els.refineMask.style.transform = `scaleX(${isFlipped ? -1 : 1})`; };
    
    document.getElementById("confirm-refine-btn").onclick = async () => {
        await saveStamp(currentStationId, processFinalStamp(els.refineBase, els.refineMask, els.ink.value, isFlipped, els.press.value));
        els.refineCont.classList.add('translate-y-full', 'pointer-events-none');
        isFlipped = false; els.refineBase.style.transform = els.refineMask.style.transform = 'scaleX(1)';
        showLineDetail(currentLineId);
    };

    document.getElementById("close-stamp-btn").onclick = () => { els.addCont.classList.add("translate-y-full", "pointer-events-none"); stopCamera(els.video, els.place); };
    document.getElementById("close-stamp-modal").onclick = () => els.modalCont.classList.add('opacity-0', 'pointer-events-none');
    document.getElementById("delete-stamp-btn").onclick = async () => {
        if(confirm("Delete this stamp?")) {
            await deleteStamp(viewingStationId);
            els.modalCont.classList.add('opacity-0', 'pointer-events-none');
            showLineDetail(currentLineId);
        }
    };
}