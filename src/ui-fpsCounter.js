import {
    storage
} from './platformSpecific.js'

const counter = document.getElementById("fps")

let oldTimestamp = 0,
    smoothedFps = 0

function update(t) {
    requestAnimationFrame(update)
    if (counter.style.display === "none") return
    const fps = 1000 / (t - oldTimestamp)
    if (fps === Infinity || isNaN(fps)) return
    smoothedFps = smoothedFps * 0.9 + fps * 0.1
    counter.innerText = smoothedFps.toFixed(2)
    oldTimestamp = t
}

export function show() {
    counter.style.display = "block"
}

export function hide() {
    counter.style.display = "none"
}

export function isVisible() {
    return counter.style.display !== "none"
}

if (storage.showFps === "true") {
    show()
} else {
    hide()
}

update()
