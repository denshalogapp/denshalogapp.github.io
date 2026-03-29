const confirmSound = new Audio('confirm2.ogg');
confirmSound.preload = 'auto';

const returnSound = new Audio('return.ogg');
returnSound.preload = 'auto';

export function playConfirmSound() {
    if (localStorage.getItem('eki-sound') !== 'false') {
        confirmSound.currentTime = 0;
        confirmSound.play().catch(() => {});
    }
}

export function playReturnSound() {
    if (localStorage.getItem('eki-sound') !== 'false') {
        returnSound.currentTime = 0;
        returnSound.play().catch(() => {});
    }
}