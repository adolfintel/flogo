import * as FlogoLang from "./flogo-language.js"
import Konva from "konva"
import * as Theming from "./ui-theming.js"
import * as Flowchart from "./ui-flowchart.js"
import * as Popups from "./ui-popup.js"
import * as History from "./ui-history.js"
import * as Utils from "./ui-utils.js"

let instructionBeingEdited, parentOfInstructionBeingEdited, positionInParentInstruction

function confirm() {
    Popups.close(true)
    let e = document.getElementById("editor_" + instructionBeingEdited.type)
    if (e === null) return
    e = e.querySelectorAll("*")
    let changed = false
    for (let i = 0; i < e.length; i++) {
        if (e[i].getAttribute("flogo_attr") !== null) {
            let v
            if (e[i].tagName === "INPUT" && e[i].type === "radio") {
                if (e[i].checked) {
                    v = Number(e[i].value)
                    if (v !== e[i].flogo_originalValue) changed = true
                }
            } else if (e[i].tagName === "INPUT" && e[i].type === "checkbox") {
                v = e[i].checked
                if (v !== e[i].flogo_originalValue) changed = true
            } else {
                v = e[i].value.trim()
                if (v !== e[i].flogo_originalValue) changed = true
                if (v === "") v = null
            }
            if (typeof v !== "undefined") {
                instructionBeingEdited[e[i].getAttribute("flogo_attr")] = v
            }
        }
    }
    if (changed) {
        History.commit()
    }
    Flowchart.cancelSelection()
    Flowchart.update()
}

function shapeFollower() {
    requestAnimationFrame(shapeFollower)
    const e = document.getElementById("editor")
    if (instructionBeingEdited === null || !e.classList.contains("visible")) return
    const blockPos = instructionBeingEdited.drawable.flogo_highlightable.getAbsolutePosition()
    const fcBounds = document.getElementById("flowchartArea").getBoundingClientRect()
    const clientX = fcBounds.x + blockPos.x
    const clientY = fcBounds.y + blockPos.y
    e.style.fontSize = "1rem"
    e.style.zoom = 1
    const wBounds = {
        width: window.innerWidth,
        height: window.innerHeight
    } /*document.body.getBoundingClientRect()*/ //workaround: chromium-based browsers sometimes report incorrect size on mobile with getBoundingClientRect
    let eBounds = e.getBoundingClientRect()
    const zoom = Math.min(1, Math.min(wBounds.width / eBounds.width, wBounds.height / eBounds.height) * 0.9)
    e.style.zoom = zoom
    e.style.left = clientX / zoom + "px"
    e.style.top = clientY / zoom + "px"
    eBounds = e.getBoundingClientRect()
    if (eBounds.x + eBounds.width >= wBounds.width) {
        e.style.left = (wBounds.width - eBounds.width) / zoom + "px"
    }
    if (eBounds.y + eBounds.height >= wBounds.height) {
        e.style.top = (wBounds.height - eBounds.height) / zoom + "px"
    }
    eBounds = e.getBoundingClientRect()
    if (eBounds.x < 0) {
        e.style.left = 0
    }
    if (eBounds.y < 0) {
        e.style.top = 0
    }
}

Flowchart.callbacks.ui_edit = (instruction, evt, parent, posInParent) => {
    instructionBeingEdited = instruction
    parentOfInstructionBeingEdited = parent
    positionInParentInstruction = posInParent
    const e = document.getElementById("editor")
    for (let i = 0; i < e.children.length; i++) {
        e.children[i].style.display = "none"
    }
    let d = document.getElementById("editor_" + instruction.type)
    if (d === null) return
    d.style.display = "block"
    d = d.querySelectorAll("*")
    let firstElement = null
    for (let i = 0; i < d.length; i++) {
        if (d[i].getAttribute("flogo_attr") !== null) {
            let v = instructionBeingEdited[d[i].getAttribute("flogo_attr")]
            if (d[i].tagName === "INPUT" && d[i].type === "radio") {
                if (d[i].value === String(v)) {
                    d[i].checked = true
                } else {
                    d[i].checked = false
                }
            } else if (d[i].tagName === "INPUT" && d[i].type === "checkbox") {
                d[i].checked = v
            } else {
                if (v === null) v = ""
                d[i].value = v
            }
            d[i].flogo_originalValue = v
            if (firstElement === null) {
                firstElement = d[i]
                requestAnimationFrame(() => { //gotta wait until next frame because not visible yet
                    firstElement.focus()
                })
            }
        }
    }
    document.getElementById("editor_buttons").style.display = "block"
    Popups.show(e)
}

function addFocusEvents() {
    document.querySelectorAll("#editor input[type='text'], #editor textarea").forEach(e => {
        e.onfocus = () => {
            Utils.selectContents(e)
        }
    })
}

let initialized = false

export function init() {
    const instructionTypes = FlogoLang.getInstructionTypes()
    document.querySelectorAll(".editor_graphics").forEach(e => {
        if (typeof e.flogo_stage !== "undefined") {
            e.flogo_stage.destroy()
        }
        const shape = new instructionTypes[e.getAttribute("flogo_instruction")]().createDrawable().flogo_shapeOnly
        shape.removeEventListener("click dblclick tap touchstart touchend")
        const gstage = new Konva.Stage({
            container: e
        })
        const layer = new Konva.Layer()
        gstage.add(layer)
        layer.add(shape)
        layer.getCanvas().setPixelRatio(window.devicePixelRatio)
        shape.position({
            x: 0,
            y: 0
        })
        const shapeBounds = shape.getClientRect()
        gstage.size({
            width: Math.ceil(shapeBounds.width + 2 * Theming.BLOCK_OUTLINE_THICKNESS),
            height: Math.ceil(shapeBounds.height + 2 * Theming.BLOCK_OUTLINE_THICKNESS)
        })
        gstage.position({
            x: Math.ceil(-shapeBounds.x),
            y: Math.ceil(-shapeBounds.y)
        })
        e.style.width = gstage.width() + "px"
        e.style.height = gstage.height() + "px"
        e.flogo_stage = gstage
    })
    if (!initialized) {
        addFocusEvents()
        shapeFollower()
        document.getElementById("edit_confirm").onclick = confirm
        document.getElementById("edit_cancel").onclick = () => {
            Popups.close(true)
        }
        pixelRatioChangeHandler()
        initialized = true
    }
}

Flowchart.callbacks.ui_edit2 = (instruction, evt, parent, posInParent) => {
    const clientX = Utils.extractCoordFromEvent(evt.evt, "clientX")
    const clientY = Utils.extractCoordFromEvent(evt.evt, "clientY")
    const ed = document.getElementById("editor2_edit")
    const selectedInstructions = Flowchart.getSelectedInstructions()
    if (selectedInstructions.length === 0 || selectedInstructions.length === 1 && selectedInstructions[0] === instruction) {
        ed.style.display = ""
        ed.onclick = () => {
            Popups.close()
            Flowchart.callbacks.ui_edit(instruction, evt, parent, posInParent)
        }
    } else {
        ed.style.display = "none"
    }
    document.getElementById("editor2_delete").onclick = () => {
        Popups.close()
        if (selectedInstructions.length === 0) {
            Flowchart.selectInstruction(instruction, true)
        }
        Flowchart.deleteSelectedInstructions()
    }
    document.getElementById("editor2_cut").onclick = () => {
        Popups.close()
        if (selectedInstructions.length === 0) {
            Flowchart.selectInstruction(instruction, true)
        }
        Flowchart.cutSelectedInstructions()
    }
    document.getElementById("editor2_copy").onclick = () => {
        Popups.close()
        if (selectedInstructions.length === 0) {
            Flowchart.selectInstruction(instruction, true)
        }
        Flowchart.copySelectedInstructions()
    }
    const selAdd = document.getElementById("editor2_addToSelection"),
        selRem = document.getElementById("editor2_removeFromSelection")
    if (evt.type === "click") {
        selAdd.style.display = "none"
        selRem.style.display = "none"
    } else {
        if (!selectedInstructions.includes(instruction)) {
            selAdd.style.display = ""
            selRem.style.display = "none"
            selAdd.onclick = () => {
                Popups.close()
                if (!Flowchart.isTouchMultiSelectEnabled()) {
                    Flowchart.startTouchMultiSelect()
                    Popups.toast("Tap instructions to select them, long press an instruction when done", 3000)
                }
                Flowchart.selectInstruction(instruction, false)
            }
        } else {
            selAdd.style.display = "none"
            selRem.style.display = ""
            selRem.onclick = () => {
                Popups.close()
                Flowchart.deselectInstruction(instruction)
            }
        }
    }
    let e = document.getElementById("editor2")
    Popups.show(e)
    e.style.left = clientX + "px"
    e.style.top = clientY + "px"
    const wBounds = {
        width: window.innerWidth,
        height: window.innerHeight
    } /*document.body.getBoundingClientRect()*/ //workaround: chromium-based browsers sometimes report incorrect size on mobile with getBoundingClientRect
    let eBounds = e.getBoundingClientRect()
    if (eBounds.x + eBounds.width >= wBounds.width) {
        e.style.left = wBounds.width - eBounds.width + "px"
    }
    if (eBounds.y + eBounds.height >= wBounds.height) {
        e.style.top = wBounds.height - eBounds.height + "px"
    }
    eBounds = e.getBoundingClientRect()
    if (eBounds.x < 0) {
        e.style.left = 0
    }
    if (eBounds.y < 0) {
        e.style.top = 0
    }
}

let pixelRatio = window.devicePixelRatio

function pixelRatioChangeHandler() {
    requestAnimationFrame(pixelRatioChangeHandler)
    if (window.devicePixelRatio !== pixelRatio) {
        //update graphics in the editor
        document.querySelectorAll(".editor_graphics").forEach(e => {
            e.flogo_stage.getLayers()[0].getCanvas().setPixelRatio(window.devicePixelRatio)
            e.flogo_stage.draw()
        })
        pixelRatio = window.devicePixelRatio
    }
}
