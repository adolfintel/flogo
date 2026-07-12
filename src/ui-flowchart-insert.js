import * as FlogoLang from "./flogo-language.js"
import Konva from "konva"
import * as Platform from "./platformSpecific.js"
import * as Utils from "./ui-utils.js"
import * as Flowchart from "./ui-flowchart.js"
import * as Popups from "./ui-popup.js"
import * as History from "./ui-history.js"
import * as Theming from "./ui-theming.js"
import '@material-design-icons/font/sharp.css'

let insertWide_stage = null
let insertTall_stage = null

let targetInstruction, targetPos

function createBlockDrawable(classref) {
    const b = new classref().createDrawable().flogo_shapeOnly
    b.removeEventListener("click dblclick tap touchstart touchend touchmove")
    b.on("click tap", () => {
        const newInstr = new classref()
        targetInstruction.body.splice(targetPos, 0, newInstr)
        History.commit()
        Popups.close()
        Flowchart.cancelSelection()
        Flowchart.update()
        Flowchart.ensureInstructionVisibleInFlowchart(newInstr)
    })
    return b
}

function prepareWide() {
    if (insertWide_stage !== null) {
        insertWide_stage.destroy()
    }
    const s = new Konva.Stage({
        container: "insertWide",
    })
    const blockSelector = new Konva.Layer()
    s.add(blockSelector)
    let x = 0,
        endY = 0
    const addColumn = (label, elements) => {
        let w = 0,
            y = 0
        label.y(0)
        w = label.width()
        y += label.height() + Theming.WIDE_INSERT_SPACE_BELOW_LABEL
        elements.forEach(e => {
            e.flogo_bounds = e.getClientRect()
            w = Math.max(w, e.flogo_bounds.width)
        })
        elements.forEach(e => {
            e.position({
                x: x + w / 2 - e.flogo_bounds.width / 2,
                y: y
            })
            y += (e.flogo_height ?? e.flogo_bounds.height) + Theming.WIDE_INSERT_SPACE_BETWEEN_INSTRUCTIONS
            blockSelector.add(e)
        })
        label.x(x + w / 2 - label.width() / 2)
        blockSelector.add(label)
        x += w + Theming.WIDE_INSERT_SPACE_BETWEEN_COLUMNS
        y -= Theming.WIDE_INSERT_SPACE_BETWEEN_INSTRUCTIONS
        if (y > endY) endY = y
    }
    let label = new Konva.Text({
        text: "Clipboard",
        fontSize: Theming.INSERT_FONT_SIZE,
        fontFamily: Theming.INSERT_FONT,
        fill: Theming.INSERT_TEXT_COLOR,
    })
    const paste = new Konva.Text({
        text: "paste",
        fontFamily: "Material Icons Sharp",
        fontSize: Theming.INSERT_FONT_SIZE * 2,
        fill: Theming.INSERT_TEXT_COLOR,
    })
    paste.on("click tap", () => {
        if (Platform.clipboard.isEmpty()) return
        Popups.close()
        return Flowchart.pasteClipboard(targetInstruction, targetPos)
    })
    addColumn(label, [paste])
    s.flogo_xAfterClipboard = x
    const categories = FlogoLang.getInstructionCategories()
    for (const category in categories) {
        label = new Konva.Text({
            text: category,
            fontSize: Theming.INSERT_FONT_SIZE,
            fontFamily: Theming.INSERT_FONT,
            fill: Theming.INSERT_TEXT_COLOR,
        })
        const col = []
        categories[category].forEach(classref => {
            col.push(createBlockDrawable(classref))
        })
        addColumn(label, col)
    }
    s.flogo_width = x - Theming.WIDE_INSERT_SPACE_BETWEEN_COLUMNS
    s.flogo_height = endY
    s.flogo_pasteBtn = paste
    insertWide_stage = s
}

function prepareTall() {
    if (insertTall_stage !== null) {
        insertTall_stage.destroy()
    }
    const s = new Konva.Stage({
        container: "insertTall",
    })
    const blockSelector = new Konva.Layer()
    s.add(blockSelector)
    let y = 0,
        endX = 0
    const addRow = (label, elements) => {
        let h = 0,
            x = 0
        label.position({
            x: 0,
            y: y
        })
        blockSelector.add(label)
        y += label.height() + Theming.TALL_INSERT_SPACE_BELOW_LABEL
        elements.forEach(e => {
            e.flogo_bounds = e.getClientRect()
            h = Math.max(h, (e.flogo_height ?? e.flogo_bounds.height))
        })
        elements.forEach(e => {
            e.position({
                x: x,
                y: y + h / 2 - (e.flogo_height ?? e.flogo_bounds.height) / 2
            })
            x += e.flogo_bounds.width + Theming.TALL_INSERT_SPACE_BETWEEN_INSTRUCTIONS
            blockSelector.add(e)
        })
        y += h + Theming.TALL_INSERT_SPACE_BELOW_ROW
        x -= Theming.TALL_INSERT_SPACE_BETWEEN_INSTRUCTIONS
        if (x > endX) endX = x
    }
    let label = new Konva.Text({
        text: "Clipboard",
        fontSize: Theming.INSERT_FONT_SIZE,
        fontFamily: Theming.INSERT_FONT,
        fill: Theming.INSERT_TEXT_COLOR,
    })
    let paste = new Konva.Text({
        text: "paste",
        fontFamily: "Material Icons Sharp",
        fontSize: Theming.INSERT_FONT_SIZE * 2,
        fill: Theming.INSERT_TEXT_COLOR,
    })
    paste.on("click tap", () => {
        if (Platform.clipboard.isEmpty()) return 0
        Popups.close()
        return Flowchart.pasteClipboard(targetInstruction, targetPos)
    })
    addRow(label, [paste])
    s.flogo_yAfterClipboard = y
    const categories = FlogoLang.getInstructionCategories()
    for (const category in categories) {
        label = new Konva.Text({
            text: category,
            fontSize: Theming.INSERT_FONT_SIZE,
            fontFamily: Theming.INSERT_FONT,
            fill: Theming.INSERT_TEXT_COLOR,
        })
        const row = []
        categories[category].forEach(classref => {
            row.push(createBlockDrawable(classref))
        })
        addRow(label, row)
    }
    s.flogo_width = endX
    s.flogo_height = y - Theming.TALL_INSERT_SPACE_BELOW_ROW
    s.flogo_pasteBtn = paste
    insertTall_stage = s
}

let initialized = false

export function init() {
    Popups.close()
    prepareWide()
    prepareTall()
    if (!initialized) {
        pixelRatioChangeHandler()
        initialized = true
    }
}

function pixelRatioChangeHandler() {
    requestAnimationFrame(pixelRatioChangeHandler)
    if (window.devicePixelRatio !== insertWide_stage.getLayers()[0].getCanvas().getPixelRatio()) {
        insertWide_stage.getLayers()[0].getCanvas().setPixelRatio(window.devicePixelRatio)
        insertTall_stage.getLayers()[0].getCanvas().setPixelRatio(window.devicePixelRatio)
        //these 2 lines shouldn't be necessary, but konva doesn't redraw it automatically after changing pixel ratio
        insertWide_stage.draw()
        insertTall_stage.draw()
    }
}

Flowchart.callbacks.ui_insert = (instruction, pos, evt, callback) => {
    const clientX = Utils.extractCoordFromEvent(evt.evt, "clientX")
    const clientY = Utils.extractCoordFromEvent(evt.evt, "clientY")
    const pw = document.getElementById("insertWide")
    const pt = document.getElementById("insertTall")
    targetInstruction = instruction
    targetPos = pos
    pw.flogo_closeCallback = callback
    pt.flogo_closeCallback = callback
    const wBounds = {
        width: window.innerWidth,
        height: window.innerHeight
    } /*document.body.getBoundingClientRect()*/ //workaround: chromium-based browsers sometimes report incorrect size on mobile with getBoundingClientRect
    const realWideStageWidth = Platform.clipboard.isEmpty() ? insertWide_stage.flogo_width - insertWide_stage.flogo_xAfterClipboard : insertWide_stage.flogo_width
    const realTallStageHeight = Platform.clipboard.isEmpty() ? insertTall_stage.flogo_height - insertTall_stage.flogo_yAfterClipboard : insertTall_stage.flogo_height
    const zoomW = Math.min(1, Math.min(wBounds.width / realWideStageWidth, wBounds.height / insertWide_stage.flogo_height) * 0.9),
        zoomT = Math.min(1, Math.min(wBounds.width / insertTall_stage.flogo_width, wBounds.height / realTallStageHeight) * 0.9)
    insertWide_stage.scale({
        x: zoomW,
        y: zoomW,
    })
    insertWide_stage.x((Theming.PADDING_BASE - (Platform.clipboard.isEmpty() ? insertWide_stage.flogo_xAfterClipboard : 0)) * zoomW)
    insertWide_stage.y(Theming.PADDING_BASE * zoomW)
    insertWide_stage.width((realWideStageWidth + Theming.PADDING_BASE * 2) * zoomW)
    insertWide_stage.height((insertWide_stage.flogo_height + Theming.PADDING_BASE * 2) * zoomW)
    insertTall_stage.scale({
        x: zoomT,
        y: zoomT,
    })
    insertTall_stage.x(Theming.PADDING_BASE * zoomT)
    insertTall_stage.y((Theming.PADDING_BASE - (Platform.clipboard.isEmpty() ? insertTall_stage.flogo_yAfterClipboard : 0)) * zoomT)
    insertTall_stage.width((insertTall_stage.flogo_width + Theming.PADDING_BASE * 2) * zoomT)
    insertTall_stage.height((realTallStageHeight + Theming.PADDING_BASE * 2) * zoomT)
    pw.style.top = clientY + "px"
    pw.style.left = clientX + "px"
    pw.style.width = insertWide_stage.width() + "px"
    pw.style.height = insertWide_stage.height() + "px"
    pt.style.top = clientY + "px"
    pt.style.left = clientX + "px"
    pt.style.width = insertTall_stage.width() + "px"
    pt.style.height = insertTall_stage.height() + "px"
    let p
    if (zoomW >= zoomT) {
        p = pw
    } else {
        p = pt
    }
    Popups.show(p)
    if (Platform.isWebKit) {
        insertTall_stage.draw()
        insertWide_stage.draw()
    }
    const pBounds = p.getBoundingClientRect()
    if (pBounds.x + pBounds.width >= wBounds.width) {
        p.style.left = wBounds.width - pBounds.width + "px"
    }
    if (pBounds.y + pBounds.height >= wBounds.height) {
        p.style.top = wBounds.height - pBounds.height + "px"
    }
}

export function pasteHere() {
    if (insertTall_stage.container().classList.contains("visible")) {
        return insertTall_stage.flogo_pasteBtn.eventListeners["click"][0].handler()
    } else if (insertWide_stage.container().classList.contains("visible")) {
        return insertWide_stage.flogo_pasteBtn.eventListeners["click"][0].handler()
    }
    return 0
}
