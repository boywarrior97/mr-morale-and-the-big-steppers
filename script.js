/*
==================================================
MR. MORALE & THE BIG STEPPERS
Editorial Reader V3
==================================================
*/


/*==================================================
CHAPTER DATA
==================================================*/

const chapters = [

    {
        title:"Mr. Morale & the Big Steppers",
        card:"01.png",
        analysis:["02.png"]
    },

    {
        title:"United in Grief",
        card:"03.png",
        analysis:["04.png"]
    },

    {
        title:"N95",
        card:"05.png",
        analysis:["06.png"]
    },

    {
        title:"Worldwide Steppers",
        card:"07.png",
        analysis:["08.png"]
    },

    {
        title:"Die Hard",
        card:"09.png",
        analysis:["10.png"]
    },

    {
        title:"Father Time",
        card:"11.png",
        analysis:["12.png"]
    },

    {
        title:"Rich (Interlude)",
        card:"13.png",
        analysis:["14.png"]
    },

    {
        title:"Rich Spirit",
        card:"15.png",
        analysis:["16.png"]
    },

    {
        title:"We Cry Together",
        card:"17.png",
        analysis:["18.png"]
    },

    {
        title:"Purple Hearts",
        card:"19.png",
        analysis:["20.png"]
    },

    {
        title:"Count Me Out",
        card:"21.png",
        analysis:["22.png"]
    },

    {
        title:"Crown",
        card:"23.png",
        analysis:["24.png"]
    },

    {
        title:"Silent Hill",
        card:"25.png",
        analysis:["26.png"]
    },

    {
        title:"Savior (Interlude)",
        card:"27.png",
        analysis:["28.png"]
    },

    {
        title:"Savior",
        card:"29.png",
        analysis:["30.png"]
    },

    {
        title:"Auntie Diaries",
        card:"31.png",
        analysis:[
            "32.png",
            "33.png"
        ]
    },

    {
        title:"Mr. Morale",
        card:"34.png",
        analysis:["35.png"]
    },

    {
        title:"Mother I Sober",
        card:"36.png",
        analysis:["37.png"]
    },

    {
        title:"Mirror",
        card:"38.png",
        analysis:["39.png"]
    },

    {
        title:"The End",
        card:"40.png",
        analysis:[]
    }

];


/*==================================================
DOM
==================================================*/

const viewer =
    document.getElementById("viewer");

const chapterTitle =
    document.getElementById("chapterTitle");

const chapterNumber =
    document.getElementById("chapterNumber");

const trackList =
    document.getElementById("trackList");

const progressFill =
    document.getElementById("progressFill");

const progressText =
    document.getElementById("progressText");

const loader =
    document.getElementById("loader");

const sidebar =
    document.getElementById("sidebar");

const overlay =
    document.getElementById("overlay");


/*==================================================
STATE
==================================================*/

const state = {

    chapter:0,

    page:0,

    animating:false,

    touchStartX:0,

    touchStartY:0,

    wheelLocked:false

};
   

/*==================================================
HELPERS
==================================================*/

function clamp(value,min,max){

    return Math.min(

        Math.max(value,min),

        max

    );

}

function pad(number){

    return String(number)

        .padStart(2,"0");

}

let mobileUITimer;

function showMobileUI(){

    if(window.innerWidth>768) return;

    document.body.classList.remove("mobile-ui-hidden");

    clearTimeout(mobileUITimer);

    mobileUITimer=setTimeout(hideMobileUI,1500);

}

function hideMobileUI(){

    if(window.innerWidth>768) return;

    document.body.classList.add("mobile-ui-hidden");

}


/*==================================================
SIDEBAR
==================================================*/

function buildSidebar(){

    trackList.innerHTML="";

    chapters.forEach((chapter,index)=>{

        const button=document.createElement("button");

        button.className="track";

        button.innerHTML=`

            <span>${pad(index+1)}</span>

            <span>${chapter.title}</span>

        `;

        button.addEventListener("click",()=>{

            if(index===state.chapter) return;

            state.chapter=index;

            state.page=0;

            renderChapter();

            closeSidebar();

        });

        trackList.appendChild(button);

    });

}


/*==================================================
HUD
==================================================*/

function updateHUD(){

    chapterTitle.textContent=

        chapters[state.chapter].title;

    chapterNumber.textContent=

        pad(state.chapter+1);

    progressFill.style.width=

        `${((state.chapter+1)/chapters.length)*100}%`;

    progressText.textContent=

        `${state.chapter+1} / ${chapters.length}`;

    document

        .querySelectorAll(".track")

        .forEach((track,index)=>{

            track.classList.toggle(

                "active",

                index===state.chapter

            );

        });

}


/*==================================================
RENDER
==================================================*/

function renderChapter(){

    viewer.innerHTML="";

    const chapter=

        chapters[state.chapter];

    const pages=[

        chapter.card,

        ...chapter.analysis

    ];

    const slides=[

        pages[pages.length-1],

        ...pages,

        pages[0]

    ];

    const wrapper=

        document.createElement("section");

    wrapper.className="chapter";

    const carousel=

        document.createElement("div");

    carousel.className="carousel";

    const track=

        document.createElement("div");

    track.className="carousel-track";

    slides.forEach((image,index)=>{

        const page=

            document.createElement("div");

        page.className="page";

        if(index===1){

            page.classList.add("active");

        }

        const img=

            document.createElement("img");

        img.src=image;

        img.draggable=false;

        page.appendChild(img);

        track.appendChild(page);

    });

    carousel.appendChild(track);

    wrapper.appendChild(carousel);

    viewer.appendChild(wrapper);

    track.style.transform=

        "translateX(-100%)";

        updateHUD();

    initialiseCarousel(track,pages.length);

}


/*==================================================
CAROUSEL
==================================================*/

let carouselTrack=null;

let carouselPages=0;

let currentIndex=1;


function initialiseCarousel(track,totalPages){

    carouselTrack=track;

    carouselPages=totalPages;

    currentIndex=1;

    moveCarousel(false);

}


function moveCarousel(animated=true){

    if(animated){

        carouselTrack.style.transition=

            "transform 220ms cubic-bezier(.22,1,.36,1)";

    }

    else{

        carouselTrack.style.transition="none";

    }

    carouselTrack.style.transform=

        `translateX(-${currentIndex*100}%)`;

}


function nextPage(){

    if(state.animating) return;

    if(carouselPages===1) return;

    state.animating=true;

    currentIndex++;

    moveCarousel();

}


function previousPage(){

    if(state.animating) return;

    if(carouselPages===1) return;

    state.animating=true;

    currentIndex--;

    moveCarousel();

}


document.addEventListener(

    "transitionend",

    event=>{

        if(

            !carouselTrack ||

            event.target!==carouselTrack

        ) return;

        if(currentIndex===0){

            currentIndex=

                carouselPages;

            moveCarousel(false);

        }

        if(

            currentIndex===

            carouselPages+1

        ){

            currentIndex=1;

            moveCarousel(false);

        }

        requestAnimationFrame(()=>{

            const pages=

                carouselTrack.querySelectorAll(".page");

            pages.forEach(page=>

                page.classList.remove("active")

            );

            if(pages[currentIndex]){

                pages[currentIndex]

                    .classList.add("active");

            }

            state.page=currentIndex-1;

            state.animating=false;

               });

    }

);


/*==================================================
CHAPTER NAVIGATION
==================================================*/

function animateChapter(direction){

    if(state.animating) return;

    state.animating=true;

    const current=

        viewer.querySelector(".chapter");

    if(!current){

        state.animating=false;

        return;

    }

    current.style.transition=

        "transform 300ms cubic-bezier(.22,1,.36,1), opacity 300ms ease";

    current.style.transform=

        direction==="next"

        ?

        "translateY(-80px)"

        :

        "translateY(80px)";

    current.style.opacity="0";

    setTimeout(()=>{

        renderChapter();

        const incoming=

            viewer.querySelector(".chapter");

        incoming.style.transition="none";

        incoming.style.transform=

            direction==="next"

            ?

            "translateY(80px)"

            :

            "translateY(-80px)";

        incoming.style.opacity="0";

        requestAnimationFrame(()=>{

            incoming.style.transition=

                "transform 300ms cubic-bezier(.22,1,.36,1), opacity 300ms ease";

            incoming.style.transform="translateY(0)";

            incoming.style.opacity="1";

        });

        setTimeout(()=>{

            state.animating=false;

        },300);

    },300);

}



function nextChapter(){

    if(state.chapter>=chapters.length-1) return;

    state.chapter++;

    state.page=0;

    animateChapter("next");

}



function previousChapter(){

    if(state.chapter<=0) return;

    state.chapter--;

    state.page=0;

    animateChapter("previous");

}

/*==================================================
KEYBOARD
==================================================*/

document.addEventListener(

    "keydown",

    event=>{

        switch(event.key){

            case "ArrowLeft":

                previousPage();
                showMobileUI();

                break;

            case "ArrowRight":

                nextPage();
                showMobileUI();

                break;

            case "ArrowUp":

                event.preventDefault();

                previousChapter();
                showMobileUI();
                break;

            case "ArrowDown":

                event.preventDefault();

                nextChapter();
                showMobileUI();

                break;

        }

    }

);


/*==================================================
MOUSE WHEEL
==================================================*/

let wheelAccumulator=0;

const WHEEL_THRESHOLD=60;


window.addEventListener(

    "wheel",

    event=>{

        event.preventDefault();

        if(state.animating) return;

        wheelAccumulator+=event.deltaY;

        if(

            Math.abs(wheelAccumulator)

            <

            WHEEL_THRESHOLD

        ){

            return;

        }

        if(wheelAccumulator>0){

            nextChapter();
            showMobileUI();

        }

        else{

            previousChapter();
            showMobileUI();

        }

        wheelAccumulator=0;

    },

       {

        passive:false

    }

);


/*==================================================
SIDEBAR
==================================================*/

function openSidebar(){

    sidebar.classList.add("open");

    overlay.classList.add("show");

}


function closeSidebar(){

    sidebar.classList.remove("open");

    overlay.classList.remove("show");

}


document

    .getElementById("menuButton")

    .addEventListener(

        "click",

        openSidebar

    );


document

    .getElementById("closeSidebar")

    .addEventListener(

        "click",

        closeSidebar

    );


overlay.addEventListener(

    "click",

    closeSidebar

);


/*==================================================
FULLSCREEN
==================================================*/

document

    .getElementById("fullscreenButton")

    .addEventListener(

        "click",

        ()=>{

            if(

                !document.fullscreenElement

            ){

                document.documentElement

                    .requestFullscreen();

            }

            else{

                document.exitFullscreen();

            }

        }

    );


/*==================================================
TOUCH
==================================================*/

viewer.addEventListener(

    "touchstart",

    event=>{

        const touch=

            event.touches[0];

        state.touchStartX=touch.clientX;

        state.touchStartY=touch.clientY;

    },

    {

        passive:true

    }

);


viewer.addEventListener(

    "touchend",

    event=>{

        const touch=

            event.changedTouches[0];

        const dx=

            touch.clientX-

            state.touchStartX;

        const dy=

            touch.clientY-

            state.touchStartY;

        if(

            Math.abs(dx)>

            Math.abs(dy)

        ){

            if(dx<-50){

                nextPage();
                showMobileUI();

            }

            else if(dx>50){

                previousPage();
                showMobileUI();

            }

        }

        else{

            if(dy<-60){

                nextChapter();
                showMobileUI();

            }

            else if(dy>60){

                previousChapter();
                showMobileUI();

            }

        }

    },

    {

        passive:true

    }

);


/*==================================================
STARTUP
==================================================*/

buildSidebar();

renderChapter();

showMobileUI();


window.addEventListener(

    "load",

    ()=>{

        setTimeout(()=>{

            loader.style.opacity="0";

            loader.style.pointerEvents="none";

        },350);

    }

);
