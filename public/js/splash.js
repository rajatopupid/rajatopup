const logo = document.getElementById("logoText");
const percent = document.getElementById("percent");
const bar = document.getElementById("loadingBar");

const text = "RajaTopUp";

const fly = [
"flyLeft",
"flyRight",
"flyTop",
"flyBottom"
];

// Jika splash sudah pernah tampil
if(localStorage.getItem("rt_splash")=="done"){
    window.location="/home";
}

// Membuat huruf satu-satu
let delay = 800;

for(let i=0;i<text.length;i++){

    const span=document.createElement("span");

    span.innerText=text[i];

    span.style.animation=
        fly[i%4]+" .7s forwards";

    span.style.animationDelay=
        delay+"ms";

    logo.appendChild(span);

    delay+=180;
}

// Setelah semua huruf muncul
setTimeout(()=>{

    logo.querySelectorAll("span")
    .forEach(e=>{

        e.style.animation=
        "shine 1.2s infinite";

    });

},2600);


// Loading
let value=0;

const timer=setInterval(()=>{

    value++;

    percent.innerHTML=value+"%";

    bar.style.width=value+"%";

    if(value>=100){

        clearInterval(timer);

        localStorage.setItem(
            "rt_splash",
            "done"
        );

        document
        .querySelector(".splash")
        .classList.add("fade-out");

        setTimeout(()=>{

            window.location="/home";

        },600);

    }

},30);
