import * as Popups from "./ui-popup.js"

let initialized = false

export function show() {
    if (!initialized) return
    Popups.show("man", true)
    document.getElementById("man_contents").scrollTop = 0
}

function scrollTo(name) {
    const man = document.getElementById("man_contents")
    const e = man.querySelector("*[name='" + name + "']")
    if (e !== null) {
        man.scrollTop = e.getBoundingClientRect().y - man.getBoundingClientRect().y
    }
}

document.getElementById("man_close").onclick = () => {
    Popups.close(true)
}

export async function init() {
    const response = await fetch("man_contents.html")
    const element = new DOMParser().parseFromString(await response.text(), "text/html").querySelector("#man_contents")
    document.getElementById("man").prepend(element)
    document.querySelectorAll("#man a[man_scrollTo]").forEach(a => a.onclick = () => {
        scrollTo(a.getAttribute("man_scrollTo"))
    })
    initialized = true
}
