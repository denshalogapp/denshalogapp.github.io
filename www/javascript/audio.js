import confirm1Audio from '../confirm1.ogg';
import confirm2Audio from '../confirm2.ogg';
import confirm3Audio from '../confirm3.ogg'; 
import returnAudio from '../return.ogg';
import slideAudio from '../slide.ogg';
import pageAudio from '../page.ogg';
import inAudio from '../in.ogg';
import outAudio from '../out.ogg';
import okAudio from '../ok.ogg';
import cameraAudio from '../camera.ogg'; 

const confirm1Sound = new Audio(confirm1Audio);
const confirm2Sound = new Audio(confirm2Audio);
const confirm3Sound = new Audio(confirm3Audio);
const returnSound = new Audio(returnAudio);
const slideSound = new Audio(slideAudio);
const pageSound = new Audio(pageAudio);
const inSound = new Audio(inAudio);
const outSound = new Audio(outAudio);
const okSound = new Audio(okAudio);
const cameraSound = new Audio(cameraAudio);
[confirm1Sound, confirm2Sound, returnSound, slideSound, pageSound, inSound, outSound].forEach(s => s.preload = 'auto');

export function playOkSound() {
    if (localStorage.getItem('eki-sound') !== 'false') {
        okSound.currentTime = 0;
        okSound.play().catch(() => {});
    }
}

export function playConfirm1Sound() {
    if (localStorage.getItem('eki-sound') !== 'false') {
        confirm1Sound.currentTime = 0;
        confirm1Sound.play().catch(() => {});
    }
}

export function playConfirm2Sound() {
    if (localStorage.getItem('eki-sound') !== 'false') {
        confirm2Sound.currentTime = 0;
        confirm2Sound.play().catch(() => {});
    }
}

export function playReturnSound() {
    if (localStorage.getItem('eki-sound') !== 'false') {
        returnSound.currentTime = 0;
        returnSound.play().catch(() => {});
    }
}

export function playSlideSound() {
    if (localStorage.getItem('eki-sound') !== 'false') {
        slideSound.currentTime = 0;
        slideSound.play().catch(() => {});
    }
}

export function playPageSound() {
    if (localStorage.getItem('eki-sound') !== 'false') {
        pageSound.currentTime = 0;
        pageSound.play().catch(() => {});
    }
}

export function playInSound() {
    if (localStorage.getItem('eki-sound') !== 'false') {
        inSound.currentTime = 0;
        inSound.play().catch(() => {});
    }
}

export function playOutSound() {
    if (localStorage.getItem('eki-sound') !== 'false') {
        outSound.currentTime = 0;
        outSound.play().catch(() => {});
    }
}

export function playConfirm3Sound() {
    if (localStorage.getItem('eki-sound') !== 'false') {
        confirm3Sound.currentTime = 0;
        confirm3Sound.play().catch(() => {});
    }
}

export function playCameraSound() {
    if (localStorage.getItem('eki-sound') !== 'false') {
        cameraSound.currentTime = 0;
        cameraSound.play().catch(() => {});
    }
}