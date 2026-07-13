import * as Platform from "./platformSpecific.js"
import * as Actions from "./ui-actions.js"
import * as FlogoLang from "./flogo-language.js"
import * as History from "./ui-history.js"
import * as Flowchart from "./ui-flowchart.js"
import * as Manual from "./ui-manual.js"
import * as Settings from "./ui-settings.js"
import * as Utils from "./ui-utils.js"

function updateControls() {
    requestAnimationFrame(updateControls)
    const state = FlogoLang.interpreter.getState()
    if (state === "running" || state === "paused") {
        document.getElementById("newProgram").disabled = true
        document.getElementById("loadProgram").disabled = true
        document.getElementById("saveProgram").disabled = true
        document.getElementById("shareProgram").disabled = true
        document.getElementById("openSettings").disabled = true
        document.getElementById("openManual").disabled = true
    }
    if (state === "running") {
        document.getElementById("runProgram").disabled = true
        document.getElementById("pauseProgram").disabled = false
    } else if (state === "paused" || state === "stopped" || state === "crashed") {
        document.getElementById("runProgram").disabled = false
        document.getElementById("pauseProgram").disabled = true
    }
    if (state === "stopped" || state === "crashed") {
        document.getElementById("newProgram").disabled = false
        document.getElementById("loadProgram").disabled = false
        document.getElementById("saveProgram").disabled = false
        document.getElementById("shareProgram").disabled = false
        document.getElementById("openSettings").disabled = false
        document.getElementById("openManual").disabled = false
        document.getElementById("undo").disabled = !History.canUndo()
        document.getElementById("redo").disabled = !History.canRedo()
    } else {
        document.getElementById("undo").disabled = true
        document.getElementById("redo").disabled = true
    }
}

updateControls()

function updateHeight() {
    const bar = document.getElementById("bar"),
        bar_contentsHeight = document.getElementById("bar_contents").getBoundingClientRect().height,
        bar_restHeight = document.querySelectorAll("#bar .group")[0].getBoundingClientRect().height //horrible workaround to get the height of the bar at rest
    if (bar_contentsHeight > bar_restHeight) {
        bar.classList.add("small")
    } else {
        bar.classList.remove("small")
        bar.classList.remove("expanded")
    }
    if (bar.classList.contains("expanded")) {
        bar.style.height = bar_contentsHeight + "px"
    } else {
        bar.style.height = ""
    }
}

function expand() {
    const bar = document.getElementById("bar")
    bar.classList.add("expanded")
    updateHeight()
    const e = event => {
        const x = Utils.extractCoordFromEvent(event, "clientX"),
            y = Utils.extractCoordFromEvent(event, "clientY")
        const bounds = bar.getBoundingClientRect()
        if (x >= bounds.x && x <= bounds.right && y >= bounds.y && y <= bounds.bottom) return
        collapse()
        document.removeEventListener('click', e)
        document.removeEventListener('tap', e)
    }
    document.addEventListener('click', e)
    document.addEventListener('tap', e)
}

function collapse() {
    document.getElementById("bar").classList.remove("expanded")
    updateHeight()
}

document.getElementById("expandBar").onclick = expand
document.getElementById("collapseBar").onclick = collapse

function updateOcclusion() {
    const barBounds = document.querySelectorAll("#bar .group")[0].getBoundingClientRect() //horrible workaround to get the height of the bar at rest
    const fcBounds = document.getElementById("flowchartArea").getBoundingClientRect()
    Flowchart.setTopOcclusion(barBounds.y + barBounds.height - fcBounds.y)
}

export function refresh() {
    updateHeight()
    updateOcclusion()
}

window.addEventListener("resize", refresh)

document.getElementById("newProgram").onclick = () => {
    collapse()
    Actions.newProgram()
}
document.getElementById("loadProgram").onclick = () => {
    collapse()
    Actions.loadProgram()
}
document.getElementById("saveProgram").onclick = () => {
    collapse()
    Actions.saveProgram()
}
document.getElementById("shareProgram").onclick = () => {
    collapse()
    Actions.shareProgram()
}
document.getElementById("runProgram").onclick = () => {
    collapse()
    Actions.runProgram()
}
document.getElementById("pauseProgram").onclick = () => {
    collapse()
    Actions.pauseProgram()
}
document.getElementById("stopProgram").onclick = () => {
    collapse()
    Actions.stopProgram()
}
document.getElementById("executionMode").onchange = Actions.setProgramExecutionMode
document.getElementById("undo").onclick = History.undo
document.getElementById("redo").onclick = History.redo
document.getElementById("openManual").onclick = () => {
    collapse()
    Manual.show()
}
document.getElementById("openSettings").onclick = () => {
    collapse()
    Settings.show()
}

let pixelRatio = 0

function pixelRatioChangeHandler() {
    requestAnimationFrame(pixelRatioChangeHandler)
    if (window.devicePixelRatio !== pixelRatio) {
        updateOcclusion()
        pixelRatio = window.devicePixelRatio
    }
}

pixelRatioChangeHandler()
