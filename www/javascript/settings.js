import { auth } from './firebase.js';
import { signOut } from 'firebase/auth';

const DARK_MODE_KEY = 'eki-dark-mode';
const SOUND_KEY = 'eki-sound';

function applyDarkMode(isDark) {
    document.documentElement.classList.toggle('dark', isDark);
}

function setToggle(btn, isOn) {
    const knob = btn.querySelector('.toggle-knob');
    if (isOn) {
        btn.classList.add('bg-[#B2FF59]');
        btn.classList.remove('bg-gray-300');
    } else {
        btn.classList.remove('bg-[#B2FF59]');
        btn.classList.add('bg-gray-300');
    }
    if (knob) knob.style.transform = isOn ? 'translateX(1.5rem)' : 'translateX(0)';
}

export function initSettings() {
    const savedDark = localStorage.getItem(DARK_MODE_KEY) === 'true';
    applyDarkMode(savedDark);
    
    window.getInitialColorScheme = () =>
        localStorage.getItem(DARK_MODE_KEY) === 'true' ? 'DARK' : 'LIGHT';

    const settingsContainer = document.getElementById('settings-container');
    const settingsBtn = document.getElementById('icon-shell-s');

    if (settingsBtn) {
        settingsBtn.onclick = function () {
            const isOpen = !settingsContainer.classList.contains('-translate-x-full');
            if (isOpen) {
                settingsContainer.classList.add('-translate-x-full', 'pointer-events-none');
            } else {
                window.resetUI?.();
                settingsContainer.classList.remove('-translate-x-full', 'pointer-events-none');
            }
        };
    }
}

export function initSettingsFrame() {
    const darkModeToggle = document.getElementById('dark-mode-toggle');
    const soundToggle = document.getElementById('sound-toggle');
    const signOutBtn = document.getElementById('sign-out-btn');

    const savedDark = localStorage.getItem(DARK_MODE_KEY) === 'true';
    const savedSound = localStorage.getItem(SOUND_KEY) !== 'false';

    if (darkModeToggle) {
        setToggle(darkModeToggle, savedDark);
        darkModeToggle.onclick = function () {
            const isDark = darkModeToggle.classList.contains('bg-gray-300');
            applyDarkMode(isDark);
            localStorage.setItem(DARK_MODE_KEY, isDark);
            setToggle(darkModeToggle, isDark);
        };
    }

    if (soundToggle) {
        setToggle(soundToggle, savedSound);
        soundToggle.onclick = function () {
            const willBeOn = soundToggle.classList.contains('bg-gray-300');
            setToggle(soundToggle, willBeOn);
            localStorage.setItem(SOUND_KEY, willBeOn);
        };
    }

    if (signOutBtn) {
        signOutBtn.onclick = async () => {
            await signOut(auth);
            window.location.reload(); 
        };
    }
}

document.addEventListener('turbo:frame-load', (e) => {
    if (e.target.id === 'settings-frame') {
        initSettingsFrame();
    }
});