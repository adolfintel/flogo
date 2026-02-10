const counter = document.getElementById("fps")

let oldTimestamp = 0,
    smoothedFps = 0

function update(t) {
    requestAnimationFrame(update)
    if (!isVisible()) return
    const fps = 1000 / (t - oldTimestamp)
    if (fps === Infinity || isNaN(fps)) return
    smoothedFps = smoothedFps * 0.9 + fps * 0.1
    counter.innerText = smoothedFps.toFixed(2)
    oldTimestamp = t
}

export function setVisible(visible) {
    if (visible) {
        counter.style.display = "block"
    } else {
        counter.style.display = "none"
    }
}

export function isVisible() {
    return counter.style.display !== "none"
}

setVisible(false)
update()
