import { state, selectors } from './list_state.js';
import { userStamps, saveStamp, deleteStamp } from './user.js';

let cameraStream = null;
let currentStationId = null;
let currentLineId = null;
let viewingStationId = null;

async function compressImage(dataUrl, maxWidth = 600, maxHeight = 600, quality = 0.6) {
    return new Promise((resolve) => {
        const img = new Image();
        img.onload = () => {
            let width = img.width;
            let height = img.height;

            if (width > height) {
                if (width > maxWidth) {
                    height = Math.round((height * maxWidth) / width);
                    width = maxWidth;
                }
            } else {
                if (height > maxHeight) {
                    width = Math.round((width * maxHeight) / height);
                    height = maxHeight;
                }
            }

            const canvas = document.createElement('canvas');
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0, width, height);
            
            resolve(canvas.toDataURL('image/jpeg', quality));
        };
        img.src = dataUrl;
    });
}

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
        const dotColor = visited ? '#B2FF59' : '#FFFFFF';
        const stationName = s.station_name_en || s.station_name_jp;
        const lineColor = line.color || '#B2FF59';
        
        const stampHtml = userStamps[s.id] ? `
            <div class="mt-4 mb-2 cursor-pointer stamp-image-preview transition-transform active:scale-95 w-max" data-station-id="${s.id}">
                <img src="${userStamps[s.id]}" class="w-32 h-32 object-cover border-[4px] border-black rounded-[20px] shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] bg-white -rotate-2 hover:rotate-0 transition-transform">
            </div>
        ` : '';

        return `
            <div class="flex items-start gap-6 ml-1 station-item">
                <div class="station-dot w-8 h-8 rounded-full border-[4px] border-black z-20 shrink-0 mt-1 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]" 
                     style="background-color: ${dotColor}">
                </div>
                <div class="flex flex-col gap-2 w-full">
                    <span class="text-xl font-black uppercase tracking-tight leading-none pt-2">
                        ${stationName}
                    </span>
                    <button class="add-stamp-btn bg-white border-[3px] border-black px-4 py-2 rounded-xl text-[10px] font-black uppercase shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:shadow-none active:translate-x-[2px] active:translate-y-[2px] transition-all w-max mt-1" data-station-id="${s.id}" data-station-name="${stationName}" data-line-color="${lineColor}">
                        + Add Stamp
                    </button>
                    ${stampHtml}
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

export function initStampScanner() {
    const addStampContainer = document.getElementById("add-stamp-container");
    const closeStampBtn = document.getElementById("close-stamp-btn");
    const videoElement = document.getElementById("camera-feed");
    const canvasElement = document.getElementById("camera-canvas");
    const placeholderElement = document.getElementById("camera-placeholder");
    const captureBtn = document.getElementById("capture-stamp-btn");
    const uploadInput = document.getElementById("upload-stamp-input");
    const stampStationPill = document.getElementById("stamp-station-pill");
    
    const stampModal = document.getElementById("stamp-modal-container");
    const stampModalImage = document.getElementById("stamp-modal-image");
    const closeStampModalBtn = document.getElementById("close-stamp-modal");
    const deleteStampBtn = document.getElementById("delete-stamp-btn");

    const deleteConfirmModal = document.getElementById("delete-confirm-modal");
    const deleteConfirmBox = document.getElementById("delete-confirm-box");
    const cancelDeleteBtn = document.getElementById("cancel-delete-btn");
    const confirmDeleteBtn = document.getElementById("confirm-delete-btn");

    async function startCamera() {
        try {
            cameraStream = await navigator.mediaDevices.getUserMedia({ 
                video: { facingMode: 'environment' } 
            });
            videoElement.srcObject = cameraStream;
            videoElement.classList.remove('hidden');
            placeholderElement.classList.add('hidden');
        } catch (err) {
            placeholderElement.innerHTML = `<span class="text-red-500 font-black uppercase text-center px-4">Camera Access Denied</span>`;
        }
    }

    function stopCamera() {
        if (cameraStream) {
            cameraStream.getTracks().forEach(track => track.stop());
            cameraStream = null;
        }
        videoElement.classList.add('hidden');
        placeholderElement.classList.remove('hidden');
    }

    if (selectors.detailStationsList) {
        selectors.detailStationsList.addEventListener('click', (e) => {
            const addBtn = e.target.closest('.add-stamp-btn');
            if (addBtn) {
                currentStationId = addBtn.getAttribute('data-station-id');
                
                if (stampStationPill) {
                    stampStationPill.innerText = addBtn.getAttribute('data-station-name');
                    stampStationPill.style.backgroundColor = addBtn.getAttribute('data-line-color');
                }

                addStampContainer.classList.remove("translate-y-full", "pointer-events-none");
                startCamera();
                return;
            }

            const stampPreview = e.target.closest('.stamp-image-preview');
            if (stampPreview && stampModal) {
                viewingStationId = stampPreview.getAttribute('data-station-id');
                stampModalImage.src = userStamps[viewingStationId];
                stampModal.classList.remove('opacity-0', 'pointer-events-none');
            }
        });
    }

    if (closeStampBtn) {
        closeStampBtn.addEventListener('click', () => {
            addStampContainer.classList.add("translate-y-full", "pointer-events-none");
            stopCamera();
        });
    }

    if (captureBtn) {
        captureBtn.addEventListener('click', async () => {
            if (!cameraStream) return;
            
            let width = videoElement.videoWidth;
            let height = videoElement.videoHeight;
            const maxDim = 600;
            
            if (width > maxDim || height > maxDim) {
                const ratio = Math.min(maxDim / width, maxDim / height);
                width = Math.round(width * ratio);
                height = Math.round(height * ratio);
            }
            
            const context = canvasElement.getContext('2d');
            canvasElement.width = width;
            canvasElement.height = height;
            context.drawImage(videoElement, 0, 0, width, height);
            
            const imageDataUrl = canvasElement.toDataURL('image/jpeg', 0.6);
            await saveStamp(currentStationId, imageDataUrl);
            
            stopCamera();
            addStampContainer.classList.add("translate-y-full", "pointer-events-none");
            showLineDetail(currentLineId);
        });
    }

    if (uploadInput) {
        uploadInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (!file) return;

            const reader = new FileReader();
            reader.onload = async (event) => {
                const originalDataUrl = event.target.result;
                const compressedDataUrl = await compressImage(originalDataUrl, 600, 600, 0.6);
                
                await saveStamp(currentStationId, compressedDataUrl);
                
                stopCamera();
                addStampContainer.classList.add("translate-y-full", "pointer-events-none");
                uploadInput.value = '';
                showLineDetail(currentLineId);
            };
            reader.readAsDataURL(file);
        });
    }

    if (closeStampModalBtn) {
        closeStampModalBtn.addEventListener('click', () => {
            stampModal.classList.add('opacity-0', 'pointer-events-none');
            setTimeout(() => { stampModalImage.src = ''; }, 300);
        });
    }

    if (deleteStampBtn) {
        deleteStampBtn.addEventListener('click', () => {
            deleteConfirmModal.classList.remove('opacity-0', 'pointer-events-none');
            setTimeout(() => {
                deleteConfirmBox.classList.remove('scale-95');
                deleteConfirmBox.classList.add('scale-100');
            }, 10);
        });
    }

    if (cancelDeleteBtn) {
        cancelDeleteBtn.addEventListener('click', () => {
            deleteConfirmBox.classList.remove('scale-100');
            deleteConfirmBox.classList.add('scale-95');
            setTimeout(() => {
                deleteConfirmModal.classList.add('opacity-0', 'pointer-events-none');
            }, 300);
        });
    }

    if (confirmDeleteBtn) {
        confirmDeleteBtn.addEventListener('click', async () => {
            await deleteStamp(viewingStationId);
            
            deleteConfirmBox.classList.remove('scale-100');
            deleteConfirmBox.classList.add('scale-95');
            deleteConfirmModal.classList.add('opacity-0', 'pointer-events-none');
            
            stampModal.classList.add('opacity-0', 'pointer-events-none');
            setTimeout(() => { stampModalImage.src = ''; }, 300);
            
            showLineDetail(currentLineId);
        });
    }
}