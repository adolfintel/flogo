import * as Popups from "./ui-popup.js"

export function show() {
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
document.querySelectorAll("#man a[man_scrollTo]").forEach(a => a.onclick = () => {
    scrollTo(a.getAttribute("man_scrollTo"))
})
