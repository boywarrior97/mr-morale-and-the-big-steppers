/*==================================================
MR. MORALE & THE BIG STEPPERS
Editorial Reader
Version 2
==================================================*/


/*==================================================
CHAPTER DATA
==================================================*/

const chapters = [

    {
        title: "United in Grief",
        pages: ["01.png","02.png"]
    },

    {
        title: "N95",
        pages: ["03.png","04.png"]
    },

    {
        title: "Worldwide Steppers",
        pages: ["05.png","06.png"]
    },

    {
        title: "Die Hard",
        pages: ["07.png","08.png"]
    },

    {
        title: "Father Time",
        pages: ["09.png","10.png"]
    },

    {
        title: "Rich (Interlude)",
        pages: ["11.png","12.png"]
    },

    {
        title: "Rich Spirit",
        pages: ["13.png","14.png"]
    },

    {
        title: "We Cry Together",
        pages: ["15.png","16.png"]
    },

    {
        title: "Purple Hearts",
        pages: ["17.png","18.png"]
    },

    {
        title: "Count Me Out",
        pages: ["19.png","20.png"]
    },

    {
        title: "Crown",
        pages: ["21.png","22.png"]
    },

    {
        title: "Silent Hill",
        pages: ["23.png","24.png"]
    },

    {
        title: "Savior",
        pages: ["25.png","26.png"]
    },

    {
        title: "Auntie Diaries",
        pages: ["27.png","28.png"]
    },

    {
        title: "Mr. Morale",
        pages: ["29.png","30.png"]
    },

    {
        title: "Mother I Sober",
        pages: ["31.png","32.png","33.png"]
    },

    {
        title: "Mirror",
        pages: ["34.png","35.png"]
    },

    {
        title: "Bonus",
        pages: ["36.png","37.png"]
    },

    {
        title: "Credits",
        pages: ["38.png","39.png"]
    },

    {
        title: "End",
        pages: ["40.png"]
    }

];


/*==================================================
DOM
==================================================*/

const viewer =
document.getElementById("viewer");

const sidebar =
document.getElementById("sidebar");

const trackList =
document.getElementById("trackList");

const overlay =
document.getElementById("overlay");

const loader =
document.getElementById("loader");

const menuButton =
document.getElementById("menuButton");

const closeSidebar =
document.getElementById("closeSidebar");

const chapterTitle =
document.getElementById("chapterTitle");

const chapterNumber =
document.getElementById("chapterNumber");

const progressFill =
document.getElementById("progressFill");

const progressText =
document.getElementById("progressText");

const fullscreenButton =
document.getElementById("fullscreenButton");


/*==================================================
STATE
==================================================*/

const state = {

    chapter:0,

    page:1,

    animating:false,

    chapterNodes:[],

    trackNodes:[],

    viewportNodes:[],

    sidebarNodes:[]

};


/*==================================================
HELPERS
==================================================*/

function create(tag,className){

    const el =
    document.createElement(tag);

    if(className){

        el.className = className;

    }

    return el;

}

function pad(n){

    return String(n).padStart(2,"0");

}


/*==================================================
BUILD READER
==================================================*/

function buildReader(){

    chapters.forEach((chapter,index)=>{

        const section =
        create("section","chapter");

        if(index===0){

            section.classList.add("active");

        }

        section.dataset.chapter=index;


        const viewport =
        create("div","viewport");

        const track =
        create("div","track-carousel");


        /*
            Clone last page
        */

        const firstClone =
        createPage(

            chapter.pages[
                chapter.pages.length-1
            ],

            true

        );

        track.appendChild(firstClone);


        /*
            Real pages
        */

        chapter.pages.forEach(file=>{

            track.appendChild(

                createPage(file)

            );

        });


        /*
            Clone first page
        */

        const lastClone =
        createPage(

            chapter.pages[0],

            true

        );

        track.appendChild(lastClone);


        viewport.appendChild(track);

        section.appendChild(viewport);

        viewer.appendChild(section);

    });

}


/*==================================================
CREATE PAGE
==================================================*/

function createPage(file,clone=false){

    const page =
    create("div","page");

    if(clone){

        page.dataset.clone="true";

    }

    const img =
    document.createElement("img");

    img.src=file;

    img.loading="lazy";

    img.draggable=false;

    img.addEventListener("load",()=>{

        page.classList.add("loaded");

    });

    page.appendChild(img);

    return page;

}


/*==================================================
BUILD SIDEBAR
==================================================*/

function buildSidebar(){

    chapters.forEach((chapter,index)=>{

        const button =
        create("button","track");

        button.type="button";

        button.dataset.chapter=index;


        const number =
        create("div","trackNumber");

        number.textContent=
        pad(index+1);


        const title =
        create("div","trackTitle");

        title.textContent=
        chapter.title;


        const thumb =
        document.createElement("img");

        thumb.src=
        chapter.pages[0];

        thumb.loading="lazy";

        thumb.draggable=false;


        button.append(

            number,

            title,

            thumb

        );

        trackList.appendChild(button);

    });

}


/*==================================================
CACHE DOM
==================================================*/

function cacheNodes(){

    state.chapterNodes =

        [...document.querySelectorAll(".chapter")];

    state.trackNodes =

        [...document.querySelectorAll(".track-carousel")];

    state.viewportNodes =

        [...document.querySelectorAll(".viewport")];

    state.sidebarNodes =

        [...document.querySelectorAll(".track")];

}


/*==================================================
INITIAL TRACK POSITIONS
==================================================*/

function initialiseTracks(){

    state.trackNodes.forEach((track)=>{

        track.dataset.index=1;

        track.style.transform=
        "translateX(-100%)";

    });

}


/*==================================================
HUD
==================================================*/

function updateHUD(){

    chapterTitle.textContent=

        chapters[state.chapter].title;

    chapterNumber.textContent=

        "Chapter " +

        pad(state.chapter+1);

}


/*==================================================
PROGRESS
==================================================*/

function updateProgress(){

    const progress =

        ((state.chapter+1) /

        chapters.length)

        *100;

    progressFill.style.width=

        progress+"%";

    progressText.textContent=

        "Chapter " +

        (state.chapter+1) +

        " / " +

        chapters.length;

}


/*==================================================
SIDEBAR ACTIVE
==================================================*/

function updateSidebar(){

    state.sidebarNodes.forEach(node=>{

        node.classList.remove("active");

    });

    state.sidebarNodes[state.chapter]

        ?.classList.add("active");

}


/*==================================================
SHOW CHAPTER
==================================================*/

function showChapter(index){

    state.chapterNodes.forEach(node=>{

        node.classList.remove("active");

    });

    state.chapter=index;

    state.page=1;

    state.chapterNodes[index]

        .classList.add("active");

    updateHUD();

    updateProgress();

    updateSidebar();

}


/*==================================================
LOADER
==================================================*/

window.addEventListener("load",()=>{

    setTimeout(()=>{

        loader.style.opacity="0";

        setTimeout(()=>{

            loader.remove();

        },600);

    },300);

});


/*==================================================
INITIALISE
==================================================*/

function initialise(){

    buildReader();

    buildSidebar();

    cacheNodes();

    initialiseTracks();

    updateHUD();

    updateProgress();

    updateSidebar();

}

initialise();


/*==================================================
PAGE NAVIGATION
==================================================*/
function movePage(direction){

    if(state.animating){

        return;

    }

    state.animating=true;

    const chapter =
    chapters[state.chapter];

    const track =
    state.trackNodes[state.chapter];

    const total =
    chapter.pages.length;

    let index =
    Number(track.dataset.index);

    index += direction;

    track.dataset.index=index;

    track.style.transition=
        "transform .45s cubic-bezier(.22,1,.36,1)";

    track.style.transform=
        `translateX(${-100*index}%)`;

    track.addEventListener(
        "transitionend",
        handleLoop,
        {once:true}
    );

}


/*==================================================
INFINITE LOOP
==================================================*/

function handleLoop(){

    const chapter =
    chapters[state.chapter];

    const track =
    state.trackNodes[state.chapter];

    const total =
    chapter.pages.length;

    let index =
    Number(track.dataset.index);

    /*
        Left clone
    */

    if(index===0){

        index=total;

        track.style.transition="none";

        track.dataset.index=index;

        track.style.transform=
            `translateX(${-100*index}%)`;

    }

    /*
        Right clone
    */

    if(index===total+1){

        index=1;

        track.style.transition="none";

        track.dataset.index=index;

        track.style.transform=
            `translateX(${-100*index}%)`;

    }

    requestAnimationFrame(()=>{

        track.style.transition=
            "transform .45s cubic-bezier(.22,1,.36,1)";

    });

    state.page=index;

    updateActivePage();

    state.animating=false;

}


/*==================================================
ACTIVE PAGE
==================================================*/

function updateActivePage(){

    const chapter =
    state.chapterNodes[state.chapter];

    chapter
        .querySelectorAll(".page")
        .forEach(page=>{

            page.classList.remove("active");

        });

    const pages =
    chapter.querySelectorAll(".page");

    pages[state.page]

        ?.classList.add("active");

}


/*==================================================
NEXT / PREVIOUS
==================================================*/

function nextPage(){

    movePage(1);

}

function previousPage(){

    movePage(-1);

}


/*==================================================
CHANGE CHAPTER
==================================================*/

function changeChapter(direction){

    if(state.animating){

        return;

    }

    let next =
    state.chapter + direction;

    if(next<0){

        next=0;

    }

    if(next>=chapters.length){

        next=
        chapters.length-1;

    }

    if(next===state.chapter){

        return;

    }

    showChapter(next);

    initialiseTracks();

    updateActivePage();

}


/*==================================================
KEYBOARD
==================================================*/

window.addEventListener("keydown",(event)=>{

    switch(event.key){

        case "ArrowRight":

            nextPage();

            break;

        case "ArrowLeft":

            previousPage();

            break;

        case "ArrowDown":

            changeChapter(1);

            break;

        case "ArrowUp":

            changeChapter(-1);

            break;

        case "f":

        case "F":

            toggleFullscreen();

            break;

    }

});


/*==================================================
SIDEBAR
==================================================*/
state.sidebarNodes.forEach(node=>{

    node.addEventListener("click",()=>{

        const index =
        Number(node.dataset.chapter);

        if(index===state.chapter){

            closeMenu();

            return;

        }

        showChapter(index);

        /*
            Reset only the selected chapter
        */

        const track =
        state.trackNodes[index];

        track.dataset.index=1;

        track.style.transition="none";

        track.style.transform=
            "translateX(-100%)";

        requestAnimationFrame(()=>{

            track.style.transition=
            "transform .45s cubic-bezier(.22,1,.36,1)";

        });

        updateActivePage();

        closeMenu();

    });

});


/*==================================================
MENU
==================================================*/

function openMenu(){

    sidebar.classList.add("open");

    overlay.classList.add("show");

}

function closeMenu(){

    sidebar.classList.remove("open");

    overlay.classList.remove("show");

}

menuButton.addEventListener(

    "click",

    openMenu

);

closeSidebar.addEventListener(

    "click",

    closeMenu

);

overlay.addEventListener(

    "click",

    closeMenu

);


/*==================================================
FULLSCREEN
==================================================*/

function toggleFullscreen(){

    if(!document.fullscreenElement){

        document.documentElement
            .requestFullscreen();

    }

    else{

        document.exitFullscreen();

    }

}

fullscreenButton.addEventListener(

    "click",

    toggleFullscreen

);


/*==================================================
TOUCH
==================================================*/

let touchStartX=0;

let touchStartY=0;

window.addEventListener(

    "touchstart",

    event=>{

        touchStartX=
        event.touches[0].clientX;

        touchStartY=
        event.touches[0].clientY;

    },

    {passive:true}

);

window.addEventListener(

    "touchend",

    event=>{

        const dx=

            event.changedTouches[0].clientX

            - touchStartX;

        const dy=

            event.changedTouches[0].clientY

            - touchStartY;

        if(

            Math.abs(dx)>

            Math.abs(dy)

        ){

            if(dx<-40){

                nextPage();

            }

            if(dx>40){

                previousPage();

            }

        }

        else{

            if(dy<-50){

                changeChapter(1);

            }

            if(dy>50){

                changeChapter(-1);

            }

        }

    },

    {passive:true}

);


/*==================================================
MOUSE WHEEL
==================================================*/

let wheelTimeout;

window.addEventListener(

    "wheel",

    event=>{

        clearTimeout(

            wheelTimeout

        );

        wheelTimeout=

        setTimeout(()=>{

            if(

                Math.abs(event.deltaX)>

                Math.abs(event.deltaY)

            ){

                if(event.deltaX>20){

                    nextPage();

                }

                else if(event.deltaX<-20){

                    previousPage();

                }

            }

            else{

                if(event.deltaY>40){

                    changeChapter(1);

                }

                else if(event.deltaY<-40){

                    changeChapter(-1);

                }

            }

        },15);

    },

    {passive:true}

);


/*==================================================
RESIZE
==================================================*/

window.addEventListener(

    "resize",

    ()=>{

        const track=

        state.trackNodes[state.chapter];

        track.style.transition="none";

        track.style.transform=

            `translateX(${-100*state.page}%)`;

        requestAnimationFrame(()=>{

            track.style.transition=

            "transform .45s cubic-bezier(.22,1,.36,1)";

        });

    }

);


/*==================================================
START
==================================================*/

updateActivePage();

updateHUD();

updateProgress();

updateSidebar();
