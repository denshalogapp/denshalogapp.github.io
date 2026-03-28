let cropImg = new Image();
let cropPoints = [];
let activePoint = -1;
let originalDim = { w: 0, h: 0 };

export function startCrop(dataUrl, container, canvas) {
    cropImg.onload = () => {
        originalDim = { w: cropImg.width, h: cropImg.height };
        
        const cRatio = container.clientWidth / container.clientHeight;
        const iRatio = originalDim.w / originalDim.h;
        const fit = iRatio > cRatio 
            ? { w: container.clientWidth - 40, h: (container.clientWidth - 40) / iRatio }
            : { h: container.clientHeight - 40, w: (container.clientHeight - 40) * iRatio };

        canvas.width = originalDim.w; canvas.height = originalDim.h;
        canvas.style.width = fit.w + 'px'; canvas.style.height = fit.h + 'px';

        const pad = { x: originalDim.w * 0.15, y: originalDim.h * 0.15 };
        cropPoints = [
            { x: pad.x, y: pad.y }, { x: originalDim.w - pad.x, y: pad.y },
            { x: originalDim.w - pad.x, y: originalDim.h - pad.y }, { x: pad.x, y: originalDim.h - pad.y }
        ];

        drawUI(canvas);
        document.getElementById('crop-container').classList.remove('translate-y-full', 'pointer-events-none');
    };
    cropImg.src = dataUrl;
}

function drawUI(canvas) {
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(cropImg, 0, 0, canvas.width, canvas.height);

    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    ctx.beginPath();
    ctx.rect(0, 0, canvas.width, canvas.height);
    ctx.moveTo(cropPoints[0].x, cropPoints[0].y);
    ctx.lineTo(cropPoints[3].x, cropPoints[3].y);
    ctx.lineTo(cropPoints[2].x, cropPoints[2].y);
    ctx.lineTo(cropPoints[1].x, cropPoints[1].y);
    ctx.fill('evenodd');

    ctx.strokeStyle = '#40C4FF'; ctx.lineWidth = originalDim.w * 0.005;
    ctx.beginPath(); ctx.moveTo(cropPoints[0].x, cropPoints[0].y);
    [1, 2, 3].forEach(i => ctx.lineTo(cropPoints[i].x, cropPoints[i].y));
    ctx.closePath(); ctx.stroke();

    ctx.fillStyle = '#B2FF59';
    cropPoints.forEach(p => {
        ctx.beginPath(); ctx.arc(p.x, p.y, originalDim.w * 0.015, 0, Math.PI * 2); ctx.fill();
    });
}

export function handleCropInput(e, canvas, type) {
    if (type === 'up') { activePoint = -1; return; }
    
    // If we aren't dragging a corner, let the event pass through so the user can scroll!
    if (!canvas || !e || (type === 'move' && activePoint === -1)) return;

    // Only block scrolling if we are actively dragging a crop point
    if (type === 'move' && e && e.cancelable) {
        e.preventDefault();
    }

    const rect = canvas.getBoundingClientRect();
    const scale = canvas.width / rect.width;
    const pos = { 
        x: ((e.clientX || e.touches?.[0].clientX) - rect.left) * scale, 
        y: ((e.clientY || e.touches?.[0].clientY) - rect.top) * scale 
    };

    if (type === 'down') {
        activePoint = cropPoints.findIndex(p => Math.hypot(p.x - pos.x, p.y - pos.y) < (originalDim.w * 0.05));
    } else if (type === 'move') {
        cropPoints[activePoint] = { x: Math.max(0, Math.min(canvas.width, pos.x)), y: Math.max(0, Math.min(canvas.height, pos.y)) };
        drawUI(canvas);
    }
}

export function finalizeWarp(canvas) {
    const srcCoords = [cropPoints[0].x, cropPoints[0].y, cropPoints[1].x, cropPoints[1].y, cropPoints[2].x, cropPoints[2].y, cropPoints[3].x, cropPoints[3].y];
    const w = Math.max(Math.hypot(srcCoords[2]-srcCoords[0], srcCoords[3]-srcCoords[1]), Math.hypot(srcCoords[6]-srcCoords[4], srcCoords[7]-srcCoords[5]));
    const h = Math.max(Math.hypot(srcCoords[6]-srcCoords[0], srcCoords[7]-srcCoords[1]), Math.hypot(srcCoords[4]-srcCoords[2], srcCoords[5]-srcCoords[3]));

    const srcMat = cv.matFromArray(4, 1, cv.CV_32FC2, srcCoords);
    const dstMat = cv.matFromArray(4, 1, cv.CV_32FC2, [0,0, w,0, w,h, 0,h]);
    const M = cv.getPerspectiveTransform(srcMat, dstMat);
    const imgMat = cv.imread(cropImg);
    const warped = new cv.Mat();
    cv.warpPerspective(imgMat, warped, M, new cv.Size(w, h));

    const out = document.createElement('canvas');
    cv.imshow(out, warped);
    [srcMat, dstMat, M, imgMat, warped].forEach(m => m.delete());
    
    const MAX_SIZE = 600;
    let finalCanvas = out;
    if (out.width > MAX_SIZE || out.height > MAX_SIZE) {
        const scale = Math.min(MAX_SIZE / out.width, MAX_SIZE / out.height);
        finalCanvas = document.createElement('canvas');
        finalCanvas.width = out.width * scale;
        finalCanvas.height = out.height * scale;
        const ctx = finalCanvas.getContext('2d');
        ctx.drawImage(out, 0, 0, finalCanvas.width, finalCanvas.height);
    }

    return finalCanvas.toDataURL('image/jpeg', 0.7);
}