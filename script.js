/*==================================================
MR. MORALE & THE BIG STEPPERS
Editorial Reader V4 — single cohesive engine
==================================================*/

/*==================================================
CONFIGURATION
==================================================*/

const CONFIG = {
    transitionDuration: 300,
    hudHideDelay: 2000,
    swipeThreshold: 60,
    wheelThreshold: 60,
    preloadRadius: 2 // how many chapters ahead/behind stay decoded in cache
};

/*==================================================
CHAPTER DATA
==================================================*/

// Populate this array with your chapter objects: { title, pages: [srcs...] }
const chapters = [];

/*==================================================
DOM REFERENCES
==================================================*/

const dom = {
    loader: document.getElementById("loader"),
    viewer: document.getElementById("viewer"),
    hud: document.getElementById("hud"),
    controls: document.getElementById("controls"),
    sidebar: document.getElementById("sidebar"),
    overlay: document.getElementById("overlay"),
    trackList: document.getElementById("trackList"),
    menuButton: document.getElementById("menuButton"),
    closeSidebar: document.getElementById("closeSidebar"),
    previousPageButton: document.getElementById("previousPageButton"),
    nextPageButton: document.getElementById("nextPageButton"),
    previousChapterButton: document.getElementById("previousChapterButton"),
    nextChapterButton: document.getElementById("nextChapterButton"),
    toggleHUDButton: document.getElementById("toggleHUDButton"),
    fullscreenButton: document.getElementById("fullscreenButton"),
    albumTitle: document.getElementById("albumTitle"),
    chapterTitle: document.getElementById("chapterTitle"),
    chapterNumber: document.getElementById("chapterNumber"),
    progressFill: document.getElementById("progressFill"),
    progressText: document.getElementById("progressText")
};

/*==================================================
APPLICATION STATE
==================================================*/

const state = {
    chapterIndex: 0,
    ui: {
        hudVisible: true,
        hudPinned: true,
        sidebarOpen: false,
        fullscreen: false
    },
    input: {
        startX: 0,
        startY: 0
    },
    cache: {
        images: new Map()
    }
};

/*==================================================
HELPERS
==================================================*/

function wrap(index, length) {
    return ((index % length) + length) % length;
}

function getChapter(index) {
    return chapters[wrap(index, chapters.length)];
}

function createElement(tag, className = "") {
    const el = document.createElement(tag);
    if (className) el.className = className;
    return el;
}

/*==================================================
IMAGE CACHE
==================================================*/

async function loadImage(src) {
    if (state.cache.images.has(src)) {
        return state.cache.images.get(src);
    }
    const image = new Image();
    image.src = src;
    try {
        await image.decode();
    } catch {
        await new Promise((resolve, reject) => {
            image.onload = resolve;
            image.onerror = reject;
        });
    }
    state.cache.images.set(src, image);
    return image;
}

async function preloadChapter(index) {
    const chapter = getChapter(index);
    if (!chapter) return;
    await Promise.all(chapter.pages.map(loadImage));
}

async function preloadWindow(centerIndex, radius = CONFIG.preloadRadius) {
    const tasks = [];
    for (let offset = -radius; offset <= radius; offset++) {
        tasks.push(preloadChapter(centerIndex + offset));
    }
    await Promise.all(tasks);
}

function warmPreload(centerIndex) {
    // fire-and-forget background warming, doesn't block navigation
    preloadWindow(centerIndex).catch(() => {});
}

function createPageImage(src) {
    const cached = state.cache.images.get(src);
    const image = cached ? cached.cloneNode() : new Image();
    if (!cached) {
        image.src = src;
        loadImage(src).catch(() => {});
    }
    image.classList.add("loaded");
    return image;
}

/*==================================================
LOOP STACK
A reusable persistent 3-slot infinite carousel.
Used both for the vertical chapter stack and the
horizontal page carousel nested inside each chapter.
==================================================*/

class LoopStack {

    constructor({ container, axis, getIndex, renderSlot, onSettle }) {
        this.container = container;
        this.axis = axis; // 'x' (pages) or 'y' (chapters)
        this.getIndex = getIndex;
        this.renderSlot = renderSlot;
        this.onSettle = onSettle || (() => {});
        this.animating = false;
        this._build();
    }

    _build() {
        this.track = createElement("div", "loop-track");
        Object.assign(this.track.style, {
            position: "relative",
            width: "100%",
            height: "100%"
        });
        this.container.appendChild(this.track);

        this.order = [0, 1, 2].map(() => {
            const el = createElement("div", "loop-slot");
            Object.assign(el.style, {
                position: "absolute",
                top: "0",
                left: "0",
                width: "100%",
                height: "100%",
                willChange: "transform"
            });
            this.track.appendChild(el);
            return el;
        });

        this._snapPositions();
        this._fillAll();
    }

    _offsetFor(role) {
        // role: -1 previous, 0 current, 1 next (or further during animation)
        const percent = role * 100;
        return this.axis === "x"
            ? `translateX(${percent}%)`
            : `translateY(${percent}%)`;
    }

    _snapPositions() {
        this.order.forEach((el, i) => {
            const role = i - 1;
            el.style.transition = "none";
            el.style.transform = this._offsetFor(role);
        });
    }

    _fillAll() {
        const idx = this.getIndex();
        this.order.forEach((el, i) => {
            const role = i - 1;
            this.renderSlot(el, idx + role);
        });
    }

    // Rebuilds slot contents in place without animation
    // (used for direct jumps, e.g. sidebar navigation).
    jumpTo() {
        this._snapPositions();
        this._fillAll();
    }

    // Refreshes only the currently-visible (middle) slot,
    // e.g. after external state changes.
    refreshCurrent() {
        this.renderSlot(this.order[1], this.getIndex());
    }

    // direction: 1 = advance forward, -1 = go backward
    // afterIndexUpdate: callback that updates external state and
    // returns the new logical center index.
    advance(direction, afterIndexUpdate) {
        if (this.animating) return Promise.resolve(false);
        this.animating = true;

        return new Promise((resolve) => {
            const outgoingSlotPos = direction === 1 ? 0 : 2;
            const outgoingEl = this.order[outgoingSlotPos];

            // Instantly relocate the outgoing (about-to-be-recycled)
            // slot to the far side, then paint it with the content
            // it is about to assume.
            outgoingEl.style.transition = "none";
            const farRole = direction === 1 ? 2 : -2;
            outgoingEl.style.transform = this._offsetFor(farRole);
            // force reflow so the "none" transition + far position commits
            void outgoingEl.offsetHeight;

            const newIndex = afterIndexUpdate();
            const newContentIndex = direction === 1 ? newIndex + 1 : newIndex - 1;
            this.renderSlot(outgoingEl, newContentIndex);

            requestAnimationFrame(() => {
                this.order.forEach((el) => {
                    el.style.transition = `transform ${CONFIG.transitionDuration}ms ease`;
                });
                void this.track.offsetHeight; // reflow before changing targets

                this.order.forEach((el, i) => {
                    const role = i - 1;
                    const targetRole =
                        el === outgoingEl
                            ? (direction === 1 ? 1 : -1)
                            : role - direction;
                    el.style.transform = this._offsetFor(targetRole);
                });
            });

            const handleEnd = (event) => {
                if (event.target !== outgoingEl && event.propertyName !== "transform") return;
                this.track.removeEventListener("transitionend", handleEnd);

                if (direction === 1) {
                    this.order.push(this.order.shift());
                } else {
                    this.order.unshift(this.order.pop());
                }
                this._snapPositions();
                this.animating = false;
                this.onSettle();
                resolve(true);
            };

            this.track.addEventListener("transitionend", handleEnd);
        });
    }
}

/*==================================================
PAGE (HORIZONTAL) RENDERING — nested per chapter slot
==================================================*/

function renderPageSlot(chapterSlotEl, pageEl, pageIndex) {
    const chapter = chapterSlotEl._chapter;
    pageEl.innerHTML = "";
    if (!chapter || !chapter.pages.length) return;
    const total = chapter.pages.length;
    const wrapped = wrap(pageIndex, total);
    const page = createElement("div", "page");
    page.appendChild(createPageImage(chapter.pages[wrapped]));
    pageEl.appendChild(page);
}

function attachPageLoop(chapterSlotEl, carouselEl) {
    chapterSlotEl._pageLoop = new LoopStack({
        container: carouselEl,
        axis: "x",
        getIndex: () => chapterSlotEl._pageIndex || 0,
        renderSlot: (pageEl, pageIndex) => renderPageSlot(chapterSlotEl, pageEl, pageIndex)
    });
}

/*==================================================
CHAPTER (VERTICAL) RENDERING
==================================================*/

function renderChapterSlot(slotEl, chapterIndex) {
    const idx = wrap(chapterIndex, chapters.length);
    const chapter = chapters[idx];

    slotEl.dataset.chapterIndex = String(idx);
    slotEl._chapterIndex = idx;
    slotEl._chapter = chapter;
    slotEl._pageIndex = 0;

    if (!slotEl._pageLoop) {
        // Build the persistent inner structure exactly once per slot.
        slotEl.innerHTML = "";
        const section = createElement("section", "chapter");
        const carousel = createElement("div", "carousel");
        section.appendChild(carousel);
        slotEl.appendChild(section);
        attachPageLoop(slotEl, carousel);
    } else {
        // Reuse the existing nested loop, just point it at new content.
        slotEl._pageLoop.jumpTo();
    }
}

/*==================================================
VIEWER BOOTSTRAP
==================================================*/

let chapterLoop = null;

function buildViewer() {
    dom.viewer.innerHTML = "";
    Object.assign(dom.viewer.style, {
        position: "relative",
        overflow: "hidden",
        width: "100%",
        height: "100%"
    });

    chapterLoop = new LoopStack({
        container: dom.viewer,
        axis: "y",
        getIndex: () => state.chapterIndex,
        renderSlot: renderChapterSlot,
        onSettle: () => {
            updateUI();
            warmPreload(state.chapterIndex);
        }
    });
}

function currentChapterSlot() {
    return chapterLoop.order[1];
}

/*==================================================
PAGE NAVIGATION
==================================================*/

async function nextPage() {
    const slot = currentChapterSlot();
    const loop = slot._pageLoop;
    if (!loop || loop.animating || !slot._chapter) return;
    const total = slot._chapter.pages.length;
    await loop.advance(1, () => {
        slot._pageIndex = wrap((slot._pageIndex || 0) + 1, total);
        return slot._pageIndex;
    });
    updateUI();
}

async function previousPage() {
    const slot = currentChapterSlot();
    const loop = slot._pageLoop;
    if (!loop || loop.animating || !slot._chapter) return;
    const total = slot._chapter.pages.length;
    await loop.advance(-1, () => {
        slot._pageIndex = wrap((slot._pageIndex || 0) - 1, total);
        return slot._pageIndex;
    });
    updateUI();
}

function goToPage(index) {
    const slot = currentChapterSlot();
    if (!slot._chapter) return;
    slot._pageIndex = wrap(index, slot._chapter.pages.length);
    slot._pageLoop.jumpTo();
    updateUI();
}

function firstPage() {
    goToPage(0);
}

function lastPage() {
    const slot = currentChapterSlot();
    if (!slot._chapter) return;
    goToPage(slot._chapter.pages.length - 1);
}

function pageCount() {
    const slot = currentChapterSlot();
    return slot._chapter ? slot._chapter.pages.length : 0;
}

function currentPage() {
    return currentChapterSlot()._pageIndex || 0;
}

/*==================================================
CHAPTER NAVIGATION
==================================================*/

async function nextChapter() {
    if (chapterLoop.animating) return;
    await chapterLoop.advance(1, () => {
        state.chapterIndex = wrap(state.chapterIndex + 1, chapters.length);
        return state.chapterIndex;
    });
}

async function previousChapter() {
    if (chapterLoop.animating) return;
    await chapterLoop.advance(-1, () => {
        state.chapterIndex = wrap(state.chapterIndex - 1, chapters.length);
        return state.chapterIndex;
    });
}

function goToChapter(index) {
    const target = wrap(index, chapters.length);
    if (target === state.chapterIndex || chapterLoop.animating) return;
    state.chapterIndex = target;
    chapterLoop.jumpTo();
    warmPreload(state.chapterIndex);
    updateUI();
}

/*==================================================
SIDEBAR
==================================================*/

function openSidebar() {
    state.ui.sidebarOpen = true;
    dom.sidebar.classList.add("open");
    dom.overlay.classList.add("show");
}

function closeSidebar() {
    state.ui.sidebarOpen = false;
    dom.sidebar.classList.remove("open");
    dom.overlay.classList.remove("show");
}

function toggleSidebar() {
    state.ui.sidebarOpen ? closeSidebar() : openSidebar();
}

function buildTrackList() {
    dom.trackList.innerHTML = "";
    chapters.forEach((chapter, index) => {
        const button = createElement("button", "track");
        if (index === state.chapterIndex) button.classList.add("active");
        button.innerHTML = `
            <div class="track-info">
                <span class="track-number">${String(index + 1).padStart(2, "0")}</span>
                <span class="track-title">${chapter.title}</span>
            </div>
            <span class="track-pages">${chapter.pages.length}</span>
        `;
        button.addEventListener("click", () => {
            closeSidebar();
            goToChapter(index);
        });
        dom.trackList.appendChild(button);
    });
}

function updateTrackList() {
    const tracks = dom.trackList.querySelectorAll(".track");
    tracks.forEach((track, index) => {
        track.classList.toggle("active", index === state.chapterIndex);
    });
}

/*==================================================
HUD
==================================================*/

function updateHUD() {
    const chapter = getChapter(state.chapterIndex);
    dom.albumTitle.textContent = "MR. MORALE & THE BIG STEPPERS";
    dom.chapterTitle.textContent = chapter.title;
    dom.chapterNumber.textContent = `${state.chapterIndex + 1}/${chapters.length}`;
}

function updateProgress() {
    const percent = ((state.chapterIndex + 1) / chapters.length) * 100;
    dom.progressFill.style.width = `${percent}%`;
    dom.progressText.textContent = `${state.chapterIndex + 1} of ${chapters.length}`;
}

function updateUI() {
    updateHUD();
    updateProgress();
    updateTrackList();
}

/*==================================================
HUD VISIBILITY
==================================================*/

let hudTimer = null;

function showHUD(pin = false) {
    document.body.classList.remove("reader-ui-hidden");
    state.ui.hudVisible = true;
    if (pin) {
        state.ui.hudPinned = true;
        clearTimeout(hudTimer);
        return;
    }
    restartHUDTimer();
}

function hideHUD() {
    if (state.ui.hudPinned) return;
    document.body.classList.add("reader-ui-hidden");
    state.ui.hudVisible = false;
}

function restartHUDTimer() {
    clearTimeout(hudTimer);
    if (state.ui.hudPinned) return;
    hudTimer = setTimeout(hideHUD, CONFIG.hudHideDelay);
}

function toggleHUD() {
    if (state.ui.hudVisible) {
        state.ui.hudPinned = false;
        hideHUD();
    } else {
        showHUD(true);
    }
}

/*==================================================
BUTTONS
==================================================*/

function bindButtons() {
    dom.nextPageButton?.addEventListener("click", nextPage);
    dom.previousPageButton?.addEventListener("click", previousPage);
    dom.nextChapterButton?.addEventListener("click", nextChapter);
    dom.previousChapterButton?.addEventListener("click", previousChapter);
    dom.menuButton?.addEventListener("click", openSidebar);
    dom.closeSidebar?.addEventListener("click", closeSidebar);
    dom.overlay?.addEventListener("click", closeSidebar);
    dom.toggleHUDButton?.addEventListener("click", toggleHUD);
}

/*==================================================
KEYBOARD
==================================================*/

function handleKeyDown(event) {
    switch (event.key) {
        case "ArrowRight": nextPage(); break;
        case "ArrowLeft": previousPage(); break;
        case "ArrowDown": nextChapter(); break;
        case "ArrowUp": previousChapter(); break;
        case "Escape": closeSidebar(); break;
        case " ": event.preventDefault(); toggleHUD(); break;
    }
}

function bindKeyboard() {
    window.addEventListener("keydown", handleKeyDown);
}

/*==================================================
MOUSE WHEEL
==================================================*/

function handleWheel(event) {
    if (Math.abs(event.deltaY) < CONFIG.wheelThreshold) return;
    event.deltaY > 0 ? nextChapter() : previousChapter();
}

function bindWheel() {
    dom.viewer.addEventListener("wheel", handleWheel, { passive: true });
}

/*==================================================
TOUCH
==================================================*/

function handleTouchStart(event) {
    const touch = event.touches[0];
    state.input.startX = touch.clientX;
    state.input.startY = touch.clientY;
}

function handleTouchEnd(event) {
    const touch = event.changedTouches[0];
    const dx = touch.clientX - state.input.startX;
    const dy = touch.clientY - state.input.startY;

    if (Math.abs(dx) > Math.abs(dy)) {
        if (Math.abs(dx) < CONFIG.swipeThreshold) return;
        dx < 0 ? nextPage() : previousPage();
    } else {
        if (Math.abs(dy) < CONFIG.swipeThreshold) return;
        dy < 0 ? nextChapter() : previousChapter();
    }
}

function bindTouch() {
    dom.viewer.addEventListener("touchstart", handleTouchStart, { passive: true });
    dom.viewer.addEventListener("touchend", handleTouchEnd, { passive: true });
}

/*==================================================
ACTIVITY
==================================================*/

function bindActivity() {
    ["mousemove", "pointerdown", "touchstart"].forEach((type) => {
        document.addEventListener(type, () => {
            if (state.ui.hudPinned) return;
            showHUD();
        }, { passive: true });
    });
}

function bindInput() {
    bindButtons();
    bindKeyboard();
    bindWheel();
    bindTouch();
    bindActivity();
}

/*==================================================
FULLSCREEN
==================================================*/

async function enterFullscreen() {
    if (!document.fullscreenEnabled) return;
    await document.documentElement.requestFullscreen();
}

async function exitFullscreen() {
    if (!document.fullscreenElement) return;
    await document.exitFullscreen();
}

async function toggleFullscreen() {
    document.fullscreenElement ? await exitFullscreen() : await enterFullscreen();
}

function updateFullscreen() {
    state.ui.fullscreen = Boolean(document.fullscreenElement);
    dom.fullscreenButton.classList.toggle("hidden", !document.fullscreenEnabled);
}

function bindFullscreen() {
    if (!document.fullscreenEnabled) {
        dom.fullscreenButton.classList.add("hidden");
        return;
    }
    dom.fullscreenButton.addEventListener("click", toggleFullscreen);
    document.addEventListener("fullscreenchange", updateFullscreen);
}

/*==================================================
INITIALIZATION
==================================================*/

async function initialize() {
    if (!chapters.length) {
        console.warn("No chapters configured — populate the `chapters` array.");
        return;
    }

    await preloadWindow(state.chapterIndex);
    buildViewer();
    buildTrackList();
    updateUI();
    bindInput();
    bindFullscreen();
    updateFullscreen();

    dom.loader.style.opacity = 0;
    dom.loader.style.visibility = "hidden";
}

document.addEventListener("DOMContentLoaded", initialize);
