function initButtons() {
    const feedBtn = document.getElementById("icon-shell-0");
    const heartBtn = document.getElementById("icon-shell-1");
    const listBtn = document.getElementById("icon-shell-2");
    
    const feedContainer = document.getElementById("feed-container");
    const listContainer = document.getElementById("list-container");

    if (!feedBtn || !listBtn) return;

    function resetUI() {
        feedContainer.classList.add("-translate-x-full");
        feedContainer.classList.add("pointer-events-none");
        listContainer.classList.add("translate-x-full");
        listContainer.classList.add("pointer-events-none");

        const feedIcon = feedBtn.querySelector("svg");
        feedBtn.classList.remove("bg-[#FF80AB]");
        feedIcon.classList.remove("text-white");
        feedIcon.classList.add("text-[#FF80AB]");

        const listIcon = listBtn.querySelector("svg");
        listBtn.classList.remove("bg-[#40C4FF]");
        listIcon.classList.remove("text-white");
        listIcon.classList.add("text-[#40C4FF]");
    }

    feedBtn.onclick = function() {
        const isOpen = !feedContainer.classList.contains("-translate-x-full");
        resetUI();
        if (!isOpen) {
            feedContainer.classList.remove("-translate-x-full");
            feedContainer.classList.remove("pointer-events-none");
            feedBtn.classList.add("bg-[#FF80AB]");
            feedBtn.querySelector("svg").classList.add("text-white");
        }
    };

    listBtn.onclick = function() {
        const isOpen = !listContainer.classList.contains("translate-x-full");
        resetUI();
        if (!isOpen) {
            listContainer.classList.remove("translate-x-full");
            listContainer.classList.remove("pointer-events-none");
            listBtn.classList.add("bg-[#40C4FF]");
            listBtn.querySelector("svg").classList.add("text-white");
        }
    };

    if (heartBtn) {
        heartBtn.onclick = resetUI;
    }
}

const refreshBtn = document.getElementById("refresh-db");
if (refreshBtn) {
    refreshBtn.onclick = () => {
        localStorage.clear();
        window.location.reload();
    };
}

document.addEventListener("DOMContentLoaded", initButtons);
document.addEventListener("turbo:load", initButtons);
document.addEventListener("turbo:frame-load", initButtons);