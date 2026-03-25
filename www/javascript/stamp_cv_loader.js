// Handles dynamic loading of the 8MB OpenCV library only when needed
export async function loadOpenCV() {
    if (window.isCVModelLoaded) return true;
    
    const loadingOverlay = document.getElementById('camera-loading-overlay');
    if (loadingOverlay) loadingOverlay.classList.remove('opacity-0', 'pointer-events-none');
    
    return new Promise((resolve) => {
        const finishLoading = () => {
            console.log("OpenCV.js Loaded and Initialized Successfully");
            window.isCVModelLoaded = true;
            if (loadingOverlay) loadingOverlay.classList.add('opacity-0', 'pointer-events-none');
            resolve(true);
        };

        if (typeof cv !== 'undefined' && cv.Mat) return finishLoading();

        window.Module = { onRuntimeInitialized: finishLoading };

        const script = document.createElement('script');
        script.src = 'https://docs.opencv.org/4.x/opencv.js';
        script.async = true;

        script.onload = () => {
            const checkReady = setInterval(() => {
                if (typeof cv !== 'undefined' && cv.Mat) {
                    clearInterval(checkReady);
                    if (!window.isCVModelLoaded) finishLoading();
                }
            }, 100);
        };

        script.onerror = () => {
            alert("Failed to download OpenCV.js.");
            if (loadingOverlay) loadingOverlay.classList.add('opacity-0', 'pointer-events-none');
            resolve(false);
        };

        document.body.appendChild(script);
        
        setTimeout(() => {
            if (!window.isCVModelLoaded) {
                alert("OpenCV initialization timed out.");
                if (loadingOverlay) loadingOverlay.classList.add('opacity-0', 'pointer-events-none');
                resolve(false);
            }
        }, 15000);
    });
}