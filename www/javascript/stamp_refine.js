let isDrawing = false;

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

        baseCanvas.getContext('2d', {willReadFrequently: true}).drawImage(img, 0, 0);
        const mCtx = maskCanvas.getContext('2d');
        const data = baseCanvas.getContext('2d').getImageData(0,0,img.width,img.height);
        for(let i=0; i<data.data.length; i+=4) {
            const lum = data.data[i]*0.3 + data.data[i+1]*0.59 + data.data[i+2]*0.11;
            data.data[i]=64; data.data[i+1]=196; data.data[i+2]=255;
            data.data[i+3] = lum < 130 ? 128 : 0;
        }
        mCtx.putImageData(data, 0, 0);
        document.getElementById('refinement-container').classList.remove('translate-y-full', 'pointer-events-none');
    };
    img.src = dataUrl;
}

export function handleRefineDraw(e, canvas, tool, size, type) {
    if (type === 'stop') { isDrawing = false; return; }
    if (!canvas || !e) return;

    const rect = canvas.getBoundingClientRect();
    const scale = canvas.width / rect.width;
    const pos = { 
        x: ((e.clientX || e.touches?.[0].clientX) - rect.left) * scale, 
        y: ((e.clientY || e.touches?.[0].clientY) - rect.top) * scale 
    };

    const ctx = canvas.getContext('2d');
    if (type === 'start') { isDrawing = true; ctx.beginPath(); ctx.moveTo(pos.x, pos.y); }
    else if (type === 'move' && isDrawing) {
        ctx.lineCap = 'round'; ctx.lineWidth = size * scale;
        ctx.globalCompositeOperation = tool === 'brush' ? 'source-over' : 'destination-out';
        ctx.strokeStyle = 'rgba(64, 196, 255, 0.5)';
        ctx.lineTo(pos.x, pos.y); ctx.stroke();
    }
}

export function processFinalStamp(base, mask, color, flipped, pressure) {
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
    ctx.globalAlpha = pressure / 100;
    ctx.drawImage(temp, 0, 0);
    ctx.globalCompositeOperation = 'destination-in';
    ctx.drawImage(mask, 0, 0);

    const res = document.createElement('canvas');
    res.width = base.width; res.height = base.height;
    const rCtx = res.getContext('2d');
    rCtx.fillStyle = '#FFF'; rCtx.fillRect(0,0,base.width,base.height);
    rCtx.drawImage(canvas, 0, 0);
    return res.toDataURL('image/jpeg', 0.8);
}