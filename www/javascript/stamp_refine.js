let isDrawing = false;
let originalMaskCanvas = null;
let erasedMaskCanvas = null;
let workingMaskCanvas = null; 
let lastPos = { x: 0, y: 0 };
let undoStack = [];

export function setupRefinement(dataUrl, baseCanvas, maskCanvas, workspace) {
    const img = new Image();
    img.onload = () => {
        const iRatio = img.width / img.height;
        const cRatio = workspace.clientWidth / workspace.clientHeight;
        const display = iRatio > cRatio 
            ? { w: workspace.clientWidth - 20, h: (workspace.clientWidth - 20) / iRatio }
            : { h: workspace.clientHeight - 20, w: (workspace.clientHeight - 20) * iRatio };

        [baseCanvas, maskCanvas].forEach(c => {
            c.width = img.width; c.height = img.height;
            c.style.width = display.w + 'px'; c.style.height = display.h + 'px';
        });

        if (!originalMaskCanvas) originalMaskCanvas = document.createElement('canvas');
        if (!erasedMaskCanvas) erasedMaskCanvas = document.createElement('canvas');
        if (!workingMaskCanvas) workingMaskCanvas = document.createElement('canvas');
        
        [originalMaskCanvas, erasedMaskCanvas, workingMaskCanvas].forEach(c => {
            c.width = img.width; c.height = img.height;
        });

        erasedMaskCanvas.getContext('2d').clearRect(0, 0, img.width, img.height);
        undoStack = [];

        baseCanvas.getContext('2d', {willReadFrequently: true}).drawImage(img, 0, 0);
        const data = baseCanvas.getContext('2d', {willReadFrequently: true}).getImageData(0,0,img.width,img.height);
        
        for(let i=0; i<data.data.length; i+=4) {
            const lum = data.data[i]*0.3 + data.data[i+1]*0.59 + data.data[i+2]*0.11;
            data.data[i]=64; data.data[i+1]=196; data.data[i+2]=255;
            data.data[i+3] = 255 - lum;
        }
        
        originalMaskCanvas.getContext('2d', {willReadFrequently: true}).putImageData(data, 0, 0);
        
        updateWorkingMask();
        applyLiveContrast(maskCanvas, 100);
        document.getElementById('stamp-contrast').value = 100;
        
        document.getElementById('refinement-container').classList.remove('translate-y-full', 'pointer-events-none');
    };
    img.src = dataUrl;
}

export function handleRefineDraw(e, canvas, tool, size, type, isFlipped) {
    if (type === 'stop') { isDrawing = false; return; }
    if (!canvas || !e) return;

    // Only block native scrolling if the user is actively drawing on the canvas
    if (type === 'move' && isDrawing && e && e.cancelable) {
        e.preventDefault();
    }

    const rect = canvas.getBoundingClientRect();
    const scale = canvas.width / rect.width;
    let pos = { 
        x: ((e.clientX || e.touches?.[0].clientX) - rect.left) * scale, 
        y: ((e.clientY || e.touches?.[0].clientY) - rect.top) * scale 
    };

    if (isFlipped) pos.x = canvas.width - pos.x;

    if (type === 'start') { 
        if (undoStack.length > 20) undoStack.shift();
        undoStack.push(erasedMaskCanvas.getContext('2d', {willReadFrequently: true}).getImageData(0, 0, erasedMaskCanvas.width, erasedMaskCanvas.height));
        
        isDrawing = true; 
        lastPos = { x: pos.x, y: pos.y };
        drawSegment(erasedMaskCanvas, lastPos, pos, tool, size * scale);
        updateWorkingMask();
        applyLiveContrast(canvas, document.getElementById('stamp-contrast').value);
    }
    else if (type === 'move' && isDrawing) {
        drawSegment(erasedMaskCanvas, lastPos, pos, tool, size * scale);
        lastPos = { x: pos.x, y: pos.y };
        updateWorkingMask();
        applyLiveContrast(canvas, document.getElementById('stamp-contrast').value);
    }
}

function drawSegment(targetCanvas, p1, p2, tool, scaledSize) {
    const ctx = targetCanvas.getContext('2d');
    ctx.beginPath();
    ctx.moveTo(p1.x, p1.y);
    ctx.lineTo(p2.x, p2.y);
    ctx.lineCap = 'round'; 
    ctx.lineWidth = scaledSize;
    
    if (tool === 'erase') {
        ctx.globalCompositeOperation = 'source-over';
        ctx.strokeStyle = 'black';
    } else if (tool === 'brush') {
        ctx.globalCompositeOperation = 'destination-out';
        ctx.strokeStyle = 'rgba(0,0,0,1)';
    }
    ctx.stroke();
}

function updateWorkingMask() {
    const wCtx = workingMaskCanvas.getContext('2d', {willReadFrequently: true});
    wCtx.globalCompositeOperation = 'source-over';
    wCtx.clearRect(0, 0, workingMaskCanvas.width, workingMaskCanvas.height);
    wCtx.drawImage(originalMaskCanvas, 0, 0);
    wCtx.globalCompositeOperation = 'destination-out';
    wCtx.drawImage(erasedMaskCanvas, 0, 0);
}

export function triggerUndo(displayCanvas, contrastVal) {
    if (undoStack.length > 0) {
        const previousState = undoStack.pop();
        erasedMaskCanvas.getContext('2d').putImageData(previousState, 0, 0);
        updateWorkingMask();
        applyLiveContrast(displayCanvas, contrastVal);
    }
}

export function applyLiveContrast(displayCanvas, contrastVal) {
    if (!workingMaskCanvas) return;
    const wCtx = workingMaskCanvas.getContext('2d', {willReadFrequently: true});
    const dCtx = displayCanvas.getContext('2d');
    
    const wData = wCtx.getImageData(0, 0, workingMaskCanvas.width, workingMaskCanvas.height);
    const cFactor = parseFloat(contrastVal) / 100;
    
    for (let i = 0; i < wData.data.length; i += 4) {
        let a = wData.data[i+3];
        a = ((a / 255 - 0.5) * cFactor + 0.5) * 255;
        wData.data[i+3] = Math.max(0, Math.min(255, a));
    }
    dCtx.putImageData(wData, 0, 0);
}

export function processFinalStamp(base, mask, color, flipped) {
    const canvas = document.createElement('canvas');
    canvas.width = base.width; canvas.height = base.height;
    const ctx = canvas.getContext('2d');
    
    if (flipped) { ctx.translate(base.width, 0); ctx.scale(-1, 1); }
    ctx.fillStyle = '#FFF'; ctx.fillRect(0, 0, base.width, base.height);

    const temp = document.createElement('canvas');
    temp.width = base.width; temp.height = base.height;
    const tCtx = temp.getContext('2d');
    
    tCtx.drawImage(base, 0, 0);
    tCtx.globalCompositeOperation = 'source-in';
    tCtx.fillStyle = color; tCtx.fillRect(0,0,base.width,base.height);

    ctx.globalCompositeOperation = 'multiply';
    ctx.drawImage(temp, 0, 0);
    
    ctx.globalCompositeOperation = 'destination-in';
    ctx.drawImage(mask, 0, 0);

    const res = document.createElement('canvas');
    res.width = base.width; res.height = base.height;
    const rCtx = res.getContext('2d');
    rCtx.fillStyle = '#FFF'; rCtx.fillRect(0,0,base.width,base.height);
    rCtx.drawImage(canvas, 0, 0);
    
    return res.toDataURL('image/jpeg', 0.7);
}

export function toggleInvert(displayCanvas, contrastVal) {
    if (!originalMaskCanvas) return;
    const ctx = originalMaskCanvas.getContext('2d', {willReadFrequently: true});
    const imgData = ctx.getImageData(0, 0, originalMaskCanvas.width, originalMaskCanvas.height);
    
    for (let i = 0; i < imgData.data.length; i += 4) {
        imgData.data[i+3] = 255 - imgData.data[i+3];
    }
    
    ctx.putImageData(imgData, 0, 0);
    updateWorkingMask();
    applyLiveContrast(displayCanvas, contrastVal);
}