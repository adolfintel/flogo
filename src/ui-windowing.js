import * as Utils from "./ui-utils.js"

export function registerWindowEvents(w, canResize = false) {
    if (w.flogo_windowEventsInitialized) return
    let resizing = false
    if (canResize) {
        w.onmousedown = e => {
            const wBounds = w.getBoundingClientRect()
            const offX = Utils.extractCoordFromEvent(e, "clientX") - wBounds.x,
                offY = Utils.extractCoordFromEvent(e, "clientY") - wBounds.y
            let resize = ""
            if (offY < 8) {
                resize += "n"
            } else if (offY > wBounds.height - 16) {
                resize += "s"
            }
            if (offX < 16) {
                resize += "w"
            } else if (offX > wBounds.width - 16) {
                resize += "e"
            }
            if (resize !== "") {
                e.preventDefault()
                resizing = true
                document.onmousemove = e => {
                    e.preventDefault()
                    const currentBounds = w.getBoundingClientRect()
                    const x = Utils.extractCoordFromEvent(e, "clientX") - currentBounds.x,
                        y = Utils.extractCoordFromEvent(e, "clientY") - currentBounds.y
                    if (resize.indexOf("n") !== -1) {
                        const dy = currentBounds.y + y - offY
                        if (dy < 0) {
                            w.style.top = "0px"
                            w.style.height = (currentBounds.bottom) + "px"
                        } else {
                            const oldH = w.style.height,
                                oldT = w.style.top
                            w.style.height = (currentBounds.height - y + offY) + "px"
                            w.style.top = dy + "px"
                            if (Math.round(w.getBoundingClientRect().bottom) > Math.round(currentBounds.bottom)) {
                                w.style.height = "0px"
                                w.style.top = (currentBounds.bottom - w.getBoundingClientRect().height) + "px"
                            }
                        }
                    } else if (resize.indexOf("s") !== -1) {
                        w.style.height = (y + wBounds.height - offY) + "px"
                    }
                    if (resize.indexOf("w") !== -1) {
                        const oldW = w.style.width,
                            oldL = w.style.left
                        w.style.width = (currentBounds.width - x + offX) + "px"
                        w.style.left = (currentBounds.x + x - offX) + "px"
                        if (Math.round(w.getBoundingClientRect().right) > Math.round(currentBounds.right)) {
                            w.style.width = "0px"
                            w.style.left = (currentBounds.right - w.getBoundingClientRect().width) + "px"
                        }
                    } else if (resize.indexOf("e") !== -1) {
                        w.style.width = (x + wBounds.width - offX) + "px"
                    }
                    limitWindowWithinBounds(w)
                }
                document.onmouseup = () => {
                    document.onmousemove = null
                    resizing = false
                    document.body.style.cursor = ""
                    limitWindowWithinBounds(w)
                }
            }
        }
        w.onmousemove = e => {
            if (resizing) return
            const wBounds = w.getBoundingClientRect()
            if (canResize) {
                const offX = Utils.extractCoordFromEvent(e, "clientX") - wBounds.x,
                    offY = Utils.extractCoordFromEvent(e, "clientY") - wBounds.y
                let resize = ""
                if (offY < 8) {
                    resize += "n"
                } else if (offY > wBounds.height - 16) {
                    resize += "s"
                }
                if (offX < 16) {
                    resize += "w"
                } else if (offX > wBounds.width - 16) {
                    resize += "e"
                }
                if (resize !== "") {
                    document.body.style.cursor = resize + "-resize"
                    return
                } else {
                    document.body.style.cursor = ""
                }
            }
        }
    }
    w.onmouseout = () => {
        if (resizing) return
        document.body.style.cursor = ""
    }
    const bar = w.querySelectorAll("div.window_bar")[0]
    bar.ontouchstart = bar.onmousedown = e => {
        const wBounds = w.getBoundingClientRect()
        e.preventDefault()
        const offX = Utils.extractCoordFromEvent(e, "clientX") - wBounds.x,
            offY = Utils.extractCoordFromEvent(e, "clientY") - wBounds.y
        if (canResize) {
            if (offY < 8 || offX < 16 || offX > wBounds.width - 16) return
        }
        e.stopImmediatePropagation()
        document.ontouchmove = document.onmousemove = e => {
            e.preventDefault()
            const x = Utils.extractCoordFromEvent(e, "clientX") - offX,
                y = Utils.extractCoordFromEvent(e, "clientY") - offY
            w.style.left = x + "px"
            w.style.top = y + "px"
            limitWindowWithinBounds(w)
        }
        document.ontouchend = document.onmouseup = () => {
            document.ontouchmove = document.onmousemove = null
            document.ontouchend = document.onmouseup = null
        }
    }
    bar.querySelectorAll("button").forEach(e => {
        e.ontouchstart = e.onmousedown = e => {
            e.stopImmediatePropagation()
        }
    })
    w.flogo_windowEventsInitialized = true
}

function limitWindowWithinBounds(w, minVis = 64) {
    let bounds = w.getBoundingClientRect()
    if (bounds.width === 0 || bounds.height === 0) return
    if (bounds.left > window.innerWidth - minVis) {
        w.style.left = (window.innerWidth - minVis) + "px"
    }
    if (bounds.top > window.innerHeight - minVis) {
        w.style.top = (window.innerHeight - minVis) + "px"
    }
    bounds = w.getBoundingClientRect()
    if (bounds.top < 0) {
        w.style.top = "0px"
    }
    if (bounds.right < minVis) {
        w.style.width = (bounds.width + (minVis - bounds.right)) + "px"
    }
}

function limitAllWindowsWithinBounds(minVis) {
    document.querySelectorAll("div.window").forEach(w => limitWindowWithinBounds(w, minVis))
}

window.addEventListener('resize', () => limitAllWindowsWithinBounds())
