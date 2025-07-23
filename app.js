/*
 * This file contains the implementation for most of the Flogo UI: editing programs, variables, loading and saving, interaction, ...
 * Other important files are flogo.js (the main interpreter for programs), flogo-flowchart.js (flowchart drawing)
 */

const enableWorkaroundsForWebKitBecauseItFuckingSucks = /(apple)?webkit/i.test(navigator.userAgent) && !/(apple)?webkit\/537\.36/i.test(navigator.userAgent)

//-------- INSERT POPUP --------

let insertWide_stage = null
let insertTall_stage = null

let INSERT_FONT,
    INSERT_FONT_SIZE,
    INSERT_WIDE_COLUMN_WIDTH,
    WIDE_INSERT_SPACE_BELOW_LABEL,
    WIDE_INSERT_SPACE_BETWEEN_INSTRUCTIONS,
    TALL_INSERT_SPACE_BELOW_LABEL,
    TALL_INSERT_SPACE_BELOW_ROW,
    TALL_INSERT_SPACE_BETWEEN_INSTRUCTIONS

let insert_targetIstruction, insert_targetPos

function insert_createBlockDrawable(type) {
    const b = new instructionTypes[type]().createDrawable().flogo_shapeOnly
    b.removeEventListener("click dblclick tap touchstart touchend touchmove")
    b.on("click tap", () => {
        const newInstr = new instructionTypes[type]()
        insert_targetIstruction.body.splice(insert_targetPos, 0, newInstr)
        saveToHistory()
        closePopup()
        cancelSelection()
        updateFlowchart()
        ensureInstructionVisibleInFlowchart(newInstr)
    })
    return b
}

function prepare_insertWide() {
    if (insertWide_stage !== null) {
        insertWide_stage.destroy()
    }
    const s = new Konva.Stage({
        container: "insertWide",
    })
    const blockSelector = new Konva.Layer()
    s.add(blockSelector)
    let label = new Konva.Text({
        x: 0,
        y: 0,
        width: INSERT_WIDE_COLUMN_WIDTH,
        text: "Clipboard",
        fontSize: INSERT_FONT_SIZE,
        fontFamily: INSERT_FONT,
        fill: LINE_COLOR,
        align: "center",
    })
    blockSelector.add(label)
    const paste = new Konva.Text({
        x: 0,
        y: label.y() + label.height() + WIDE_INSERT_SPACE_BELOW_LABEL,
        width: INSERT_WIDE_COLUMN_WIDTH,
        text: "paste",
        fontFamily: "Material Icons Sharp",
        fontSize: INSERT_FONT_SIZE * 2,
        fill: LINE_COLOR,
        align: "center",
    })
    paste.on("click tap", () => {
        if (clipboard === null) return
        closePopup()
        pasteClipboard(insert_targetIstruction, insert_targetPos)
    })
    blockSelector.add(paste)
    s.flogo_xAfterClipboard = INSERT_WIDE_COLUMN_WIDTH
    let x = INSERT_WIDE_COLUMN_WIDTH
    let endY = paste.y() + paste.height()
    for (const category in instructionCategories) {
        label = new Konva.Text({
            x: x,
            y: 0,
            width: INSERT_WIDE_COLUMN_WIDTH,
            text: category,
            fontSize: INSERT_FONT_SIZE,
            fontFamily: INSERT_FONT,
            fill: LINE_COLOR,
            align: "center",
        })
        blockSelector.add(label)
        let y = label.y() + label.height() + WIDE_INSERT_SPACE_BELOW_LABEL
        instructionCategories[category].forEach(instruction => {
            const block = insert_createBlockDrawable(instruction.name)
            block.x(x + INSERT_WIDE_COLUMN_WIDTH / 2 - block.flogo_width / 2)
            block.y(y)
            blockSelector.add(block)
            y += block.flogo_height + WIDE_INSERT_SPACE_BETWEEN_INSTRUCTIONS
        })
        y -= WIDE_INSERT_SPACE_BETWEEN_INSTRUCTIONS
        if (y > endY) endY = y
        x += INSERT_WIDE_COLUMN_WIDTH
    }
    s.flogo_width = x
    s.flogo_height = endY
    s.flogo_pasteBtn = paste
    insertWide_stage = s
}

function prepare_insertTall() {
    if (insertTall_stage !== null) {
        insertTall_stage.destroy()
    }
    const s = new Konva.Stage({
        container: "insertTall",
    })
    const blockSelector = new Konva.Layer()
    s.add(blockSelector)
    let label = new Konva.Text({
        x: 0,
        y: 0,
        text: "Clipboard",
        fontSize: INSERT_FONT_SIZE,
        fontFamily: INSERT_FONT,
        fill: LINE_COLOR,
    })
    blockSelector.add(label)
    let paste = new Konva.Text({
        x: 0,
        y: label.height() + TALL_INSERT_SPACE_BELOW_LABEL,
        text: "paste",
        fontFamily: "Material Icons Sharp",
        fontSize: INSERT_FONT_SIZE * 2,
        fill: LINE_COLOR,
        align: "center",
    })
    paste.on("click tap", () => {
        if (clipboard === null) return
        closePopup()
        pasteClipboard(insert_targetIstruction, insert_targetPos)
    })
    blockSelector.add(paste)
    s.flogo_yAfterClipboard = paste.y() + paste.height() + TALL_INSERT_SPACE_BELOW_ROW
    let y = s.flogo_yAfterClipboard
    let endX = 0
    for (const category in instructionCategories) {
        label = new Konva.Text({
            x: 0,
            y: y,
            text: "Interaction",
            fontSize: INSERT_FONT_SIZE,
            fontFamily: INSERT_FONT,
            fill: LINE_COLOR,
        })
        blockSelector.add(label)
        y += label.height() + TALL_INSERT_SPACE_BELOW_LABEL
        let x = 0
        let h = 0
        instructionCategories[category].forEach(instruction => {
            const block = insert_createBlockDrawable(instruction.name)
            block.x(x)
            block.y(y)
            blockSelector.add(block)
            if (block.flogo_height > h) h = block.flogo_height
            x += block.flogo_width + TALL_INSERT_SPACE_BETWEEN_INSTRUCTIONS
        })
        x -= TALL_INSERT_SPACE_BETWEEN_INSTRUCTIONS
        if (x > endX) endX = x
        y += h + TALL_INSERT_SPACE_BELOW_ROW
    }
    y -= TALL_INSERT_SPACE_BELOW_ROW
    s.flogo_width = endX
    s.flogo_height = y
    s.flogo_pasteBtn = paste
    insertTall_stage = s
}

function insert_preparePopups() {
    INSERT_FONT = _getCSSVal("font-family", "", document.body)
    INSERT_FONT_SIZE = Number(_getCSSVal("--insert-Font-size", 14, document.body))
    INSERT_WIDE_COLUMN_WIDTH = Number(_getCSSVal("--insert-Wide-columnWidth", 7, document.body)) * BLOCK_FONT_SIZE
    WIDE_INSERT_SPACE_BELOW_LABEL = Number(_getCSSVal("--insert-Wide-Padding-belowLabel", 20, document.body))
    WIDE_INSERT_SPACE_BETWEEN_INSTRUCTIONS = Number(_getCSSVal("--insert-Wide-Padding-spaceBetweenInstructions", 20, document.body))
    TALL_INSERT_SPACE_BELOW_LABEL = Number(_getCSSVal("--insert-Tall-Padding-belowLabel", 10, document.body))
    TALL_INSERT_SPACE_BELOW_ROW = Number(_getCSSVal("--insert-Tall-Padding-belowRow", 20, document.body))
    TALL_INSERT_SPACE_BETWEEN_INSTRUCTIONS = Number(_getCSSVal("--insert-Tall-Padding-spaceBetweenInstructions", 20, document.body))
    document.fonts.load("1em " + FLOWCHART_FONT, "a").then(() => {
        document.fonts.load("1em " + INSERT_FONT, "a").then(() => {
            closePopup()
            prepare_insertWide()
            prepare_insertTall()
        })
    })
}

function ui_insert(instruction, pos, evt, callback) {
    const clientX = _extractCoordFromEvent(evt.evt, "clientX")
    const clientY = _extractCoordFromEvent(evt.evt, "clientY")
    const pw = document.getElementById("insertWide")
    const pt = document.getElementById("insertTall")
    insert_targetIstruction = instruction
    insert_targetPos = pos
    pw.flogo_closeCallback = callback
    pt.flogo_closeCallback = callback
    const wBounds = {
        width: window.innerWidth,
        height: window.innerHeight
    } /*document.body.getBoundingClientRect()*/ //workaround: chromium-based browsers sometimes report incorrect size on mobile with getBoundingClientRect
    const realWideStageWidth = clipboard === null ? insertWide_stage.flogo_width - insertWide_stage.flogo_xAfterClipboard : insertWide_stage.flogo_width
    const realTallStageHeight = clipboard === null ? insertTall_stage.flogo_height - insertTall_stage.flogo_yAfterClipboard : insertTall_stage.flogo_height
    const zoomW = Math.min(1, Math.min(wBounds.width / realWideStageWidth, wBounds.height / insertWide_stage.flogo_height) * 0.9),
        zoomT = Math.min(1, Math.min(wBounds.width / insertTall_stage.flogo_width, wBounds.height / realTallStageHeight) * 0.9)
    insertWide_stage.scale({
        x: zoomW,
        y: zoomW,
    })
    insertWide_stage.x((PADDING_BASE - (clipboard === null ? insertWide_stage.flogo_xAfterClipboard : 0)) * zoomW)
    insertWide_stage.y(PADDING_BASE * zoomW)
    insertWide_stage.width((realWideStageWidth + PADDING_BASE * 2) * zoomW)
    insertWide_stage.height((insertWide_stage.flogo_height + PADDING_BASE * 2) * zoomW)
    insertTall_stage.scale({
        x: zoomT,
        y: zoomT,
    })
    insertTall_stage.x(PADDING_BASE * zoomT)
    insertTall_stage.y((PADDING_BASE - (clipboard === null ? insertTall_stage.flogo_yAfterClipboard : 0)) * zoomT)
    insertTall_stage.width((insertTall_stage.flogo_width + PADDING_BASE * 2) * zoomT)
    insertTall_stage.height((realTallStageHeight + PADDING_BASE * 2) * zoomT)
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
    showPopup(p)
    if (enableWorkaroundsForWebKitBecauseItFuckingSucks) {
        insertTall_stage.draw()
        insertWide_stage.draw()
    }
    pBounds = p.getBoundingClientRect()
    if (pBounds.x + pBounds.width >= wBounds.width) {
        p.style.left = wBounds.width - pBounds.width + "px"
    }
    if (pBounds.y + pBounds.height >= wBounds.height) {
        p.style.top = wBounds.height - pBounds.height + "px"
    }
}

function insert_pixelRatioChangeHandler() {
    requestAnimationFrame(insert_pixelRatioChangeHandler)
    if (window.devicePixelRatio !== insertWide_stage.getLayers()[0].getCanvas().getPixelRatio()) {
        insertWide_stage.getLayers()[0].getCanvas().setPixelRatio(window.devicePixelRatio)
        insertTall_stage.getLayers()[0].getCanvas().setPixelRatio(window.devicePixelRatio)
        //these 2 lines shouldn't be necessary, but konva doesn't redraw it automatically after changing pixel ratio
        insertWide_stage.draw()
        insertTall_stage.draw()
    }
    //flowchart handles this itself, no need to update it
}

//-------- BLOCK EDITOR --------

let edit_instruction, edit_parent, edit_positionInParent

function edit_confirm() {
    closePopup(true)
    let e = document.getElementById("editor_" + edit_instruction.constructor.name)
    if (e === null) return
    e = e.querySelectorAll("*")
    let changed = false
    for (let i = 0; i < e.length; i++) {
        if (e[i].getAttribute("flogo_attr") !== null) {
            let v
            if (e[i].tagName === "INPUT" && e[i].type === "checkbox") {
                v = e[i].checked
                if (v !== e[i].flogo_originalValue) changed = true
            } else {
                v = e[i].value.trim()
                if (v !== e[i].flogo_originalValue) changed = true
                if (v === "") v = null
            }
            edit_instruction[e[i].getAttribute("flogo_attr")] = v
        }
    }
    if (changed) {
        saveToHistory()
    }
    cancelSelection()
    updateFlowchart()
}

function edit_delete() {
    edit_parent.body.splice(edit_positionInParent, 1)
    saveToHistory()
    updateFlowchart()
    closePopup()
}

function edit_shapeFollower() {
    requestAnimationFrame(edit_shapeFollower)
    const e = document.getElementById("editor")
    if (edit_instruction === null || !e.classList.contains("visible")) return
    const blockPos = edit_instruction.drawable.flogo_highlightable.getAbsolutePosition()
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

function ui_edit(instruction, evt, parent, posInParent) {
    edit_instruction = instruction
    edit_parent = parent
    edit_positionInParent = posInParent
    const e = document.getElementById("editor")
    for (let i = 0; i < e.children.length; i++) {
        e.children[i].style.display = "none"
    }
    let d = document.getElementById("editor_" + instruction.constructor.name)
    if (d === null) return
    d.style.display = "block"
    d = d.querySelectorAll("*")
    let firstElement = null
    for (let i = 0; i < d.length; i++) {
        if (d[i].getAttribute("flogo_attr") !== null) {
            let v = edit_instruction[d[i].getAttribute("flogo_attr")]
            if (d[i].tagName === "INPUT" && d[i].type === "checkbox") {
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
    showPopup(e)
}

function edit_addFocusEvents() {
    document.querySelectorAll("#editor input[type='text'], #editor textarea").forEach(e => {
        e.onfocus = () => {
            selectContents(e)
        }
    })
}

function edit_prepareGraphics() {
    document.querySelectorAll(".editor_graphics").forEach(e => {
        if (typeof e.flogo_stage !== "undefined") {
            e.flogo_stage.destroy()
        }
        const shape = new instructionTypes[e.getAttribute("flogo_instruction")]().createDrawable().flogo_shapeOnly
        shape.removeEventListener("click dblclick tap touchstart touchend")
        const gstage = new Konva.Stage({
            container: e,
            width: shape.flogo_width + 2 * BLOCK_OUTLINE_THICKNESS,
            height: shape.flogo_height + 2 * BLOCK_OUTLINE_THICKNESS
        })
        const layer = new Konva.Layer()
        gstage.add(layer)
        layer.add(shape)
        layer.getCanvas().setPixelRatio(window.devicePixelRatio)
        gstage.position({
            x: 0,
            y: 0
        })
        shape.position({
            x: BLOCK_OUTLINE_THICKNESS,
            y: BLOCK_OUTLINE_THICKNESS
        })
        e.style.width = gstage.width() + "px"
        e.style.height = gstage.height() + "px"
        e.flogo_stage = gstage
    })
}

function ui_edit2(instruction, evt, parent, posInParent) {
    const clientX = _extractCoordFromEvent(evt.evt, "clientX")
    const clientY = _extractCoordFromEvent(evt.evt, "clientY")
    const ed = document.getElementById("editor2_edit")
    if (selectedInstructions.length === 0 || selectedInstructions.length === 1 && selectedInstructions[0] === instruction) {
        ed.style.display = ""
        ed.onclick = () => {
            closePopup()
            ui_edit(instruction, evt, parent, posInParent)
        }
    } else {
        ed.style.display = "none"
    }
    document.getElementById("editor2_delete").onclick = () => {
        closePopup()
        if (selectedInstructions.length === 0) {
            selectedInstructions.push(instruction)
        }
        deleteSelectedInstructions()
    }
    document.getElementById("editor2_cut").onclick = () => {
        closePopup()
        if (selectedInstructions.length === 0) {
            selectedInstructions.push(instruction)
        }
        cutSelectedInstructions()
    }
    document.getElementById("editor2_copy").onclick = () => {
        closePopup()
        if (selectedInstructions.length === 0) {
            selectedInstructions.push(instruction)
        }
        copySelectedInstructions()
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
                closePopup()
                if (!_touchMultiselectMode) {
                    startTouchMultiSelect()
                    toast("Tap instructions to select them, long press an instruction when done", 3000)
                }
                selectInstruction(instruction)
            }
        } else {
            selAdd.style.display = "none"
            selRem.style.display = ""
            selRem.onclick = () => {
                closePopup()
                deselectInstruction(instruction)
            }
        }
    }
    let e = document.getElementById("editor2")
    showPopup(e)
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

//-------- CLIPBOARD SYSTEM --------

let clipboard = null

function copySelectedInstructions() {
    if (selectedInstructions.length === 0) return
    clipboard = []
    selectedInstructions.forEach(i => clipboard.push(i.toSimpleObject()))
    cancelSelection()
}

function deleteSelectedInstructions() {
    if (selectedInstructions.length === 0) return
    selectedInstructions.forEach(i => i.drawable.flogo_parentInstruction.body.splice(i.drawable.flogo_parentInstruction.body.indexOf(i), 1))
    saveToHistory()
    cancelSelection()
    updateFlowchart()
}

function cutSelectedInstructions() {
    if (selectedInstructions.length === 0) return
    clipboard = []
    selectedInstructions.forEach(i => {
        clipboard.push(i.toSimpleObject())
        i.drawable.flogo_parentInstruction.body.splice(i.drawable.flogo_parentInstruction.body.indexOf(i), 1)
    })
    saveToHistory()
    cancelSelection()
    updateFlowchart()
}

function pasteClipboard(parent, posInParent) {
    if (clipboard === null) return
    for (let i = 0; i < clipboard.length; i++) {
        parent.body.splice(posInParent + i, 0, instructionTypes[clipboard[i].type].fromSimpleObject(clipboard[i]))
    }
    saveToHistory()
    cancelSelection()
    updateFlowchart()
}

//-------- CRASH HANDLER (for user program, not flogo) --------

function ui_onProgramCrash(e) {
    const CRASH_SPACE_FROM_INSTRUCTION = Number(_getCSSVal("--crash-Padding-spaceFromInstruction", 10, document.body))
    const c = document.getElementById("crash")
    document.getElementById("crash_details").innerText = e
    c.style.top = 0
    c.style.left = 0
    showPopup(c)
    const cBounds = c.getBoundingClientRect()
    const wBounds = {
        width: window.innerWidth,
        height: window.innerHeight
    } /*document.body.getBoundingClientRect()*/ //workaround: chromium-based browsers sometimes report incorrect size on mobile with getBoundingClientRect
    const fcBounds = document.getElementById("flowchartArea").getBoundingClientRect()
    ensureInstructionVisibleInFlowchart(interpreter.currentInstruction)
    const instr = interpreter.currentInstruction.drawable.flogo_highlightable
    const instrPos = instr.absolutePosition()
    let x = instrPos.x + (instr.width() * stage.scaleX()) / 2 + fcBounds.x - cBounds.width / 2
    let y = instrPos.y + instr.height() * stage.scaleY() + fcBounds.y + CRASH_SPACE_FROM_INSTRUCTION
    if (x < 0) x = 0
    if (x + cBounds.width > wBounds.width) {
        x = wBounds.width - cBounds.width + fcBounds.x
    }
    if (y + cBounds.height > wBounds.height) {
        y = instrPos.y - cBounds.height + fcBounds.y - CRASH_SPACE_FROM_INSTRUCTION
    }
    c.style.left = x + "px"
    c.style.top = y + "px"
    document.getElementById("input").disabled = true
    document.getElementById("input_send").disabled = true
    const d = document.createElement("div")
    d.className = "notice"
    d.innerText = "Program crashed"
    document.getElementById("log").prepend(d)
    variablesEditor_enable()
}

//-------- CONSOLE PANEL --------

function ui_input(variable, type, callback) {
    const input = document.getElementById("input")
    const btn = document.getElementById("input_send")
    if (!document.getElementById("consoleArea").classList.contains("expanded")) {
        toggleConsoleArea()
    }
    input.disabled = false
    input.focus()
    btn.disabled = false
    btn.onclick = () => {
        let val = input.value
        switch (type) {
            case "integer":
            case "real": {
                val = val.trim()
                if (val === "" || isNaN(val)) {
                    errorFlash(input)
                    return
                }
            }
            break
            case "boolean": {
                val = val.trim()
                if (val !== "true" && val !== "false") {
                    errorFlash(input)
                    return
                }
            }
            break
        }
        const text = val
        input.disabled = true
        input.value = ""
        btn.disabled = true
        const d = document.createElement("div")
        d.className = "message input"
        d.innerText = text
        document.getElementById("log").prepend(d)
        console_removeExcessMessages()
        callback(text)
    }
}

function input_keypressed(e) {
    if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault()
        document.getElementById("input_send").click()
    }
}

function ui_output(text, newLine) {
    const log = document.getElementById("log")
    const prev = log.firstChild
    if (prev !== null && prev.classList.contains("output") && prev.flogo_appendable) {
        prev.flogo_text += text
        prev.innerText = prev.flogo_text
        prev.flogo_appendable = !newLine
    } else {
        const d = document.createElement("div")
        d.className = "message output"
        d.innerText = text
        d.flogo_text = text
        d.flogo_appendable = !newLine
        log.prepend(d)
    }
    console_removeExcessMessages()
    if (!document.getElementById("consoleArea").classList.contains("expanded")) {
        toggleConsoleArea()
    }
}

function ui_onProgramEnd() {
    const d = document.createElement("div")
    d.className = "notice"
    d.innerText = "Program finished"
    document.getElementById("log").prepend(d)
    variablesEditor_enable()
    centerFlowchartOnProgramEnd()
    //resetVariables()
}

function resetConsole() {
    document.getElementById("log").innerHTML = ""
    const input = document.getElementById("input")
    input.value = ""
    input.disabled = true
    document.getElementById("input_send").disabled = true
}

const LOG_MAX_MESSAGES = 1000

function console_removeExcessMessages() {
    const log = document.getElementById("log")
    while (log.children.length > LOG_MAX_MESSAGES) {
        log.removeChild(log.lastChild)
    }
}

function console_save() {
    const messages = document.querySelectorAll("#log > *")
    let out = ""
    for (let i = messages.length - 1; i >= 0; i--) {
        const m = messages[i]
        if (m.classList.contains("output")) {
            out += "Output: " + m.innerText + "\n"
        } else if (m.classList.contains("input")) {
            out += "Input: " + m.innerText + "\n"
        }
    }
    if (navigator.platform.indexOf("Win") !== -1) {
        //yes, this is still a thing on windows... sigh
        out = out.replace("\n", "\r\n")
    }
    const blob = new Blob([out], {
        type: "text/plain",
    })
    const a = document.createElement("a")
    a.href = URL.createObjectURL(blob)
    a.download = "Flogo Output.txt"
    a.click()
}

//-------- VARIABLES EDITOR --------

let dragging = null

function variablesEditor_createVariable(name) {
    const v = document.createElement("div")
    v.className = "variable"
    v.flogo_variable = name
    v.draggable = true
    v.ondragstart = e => {
        if (e.target !== v) e.preventDefault()
        dragging = v
    }
    v.ondragend = e => {
        if (enableWorkaroundsForWebKitBecauseItFuckingSucks || e.dataTransfer.dropEffect !== "none") {
            variablesEditor_moveVariableAtDropIndicator(v)
        }
        variablesEditor_hideVariableDropIndicator()
        dragging = null
    }
    const nt = document.createElement("div")
    nt.className = "nameType"
    const nameVis = document.createElement("div")
    nameVis.className = "name vis"
    const nameEdit = document.createElement("span")
    nameEdit.contentEditable = true
    nameEdit.className = "name edit"
    nameEdit.onkeydown = e => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault()
            v.flogo_buttons.confirm.click()
        }
    }
    nameEdit.onfocus = () => {
        selectContents(nameEdit)
    }
    disableSpellcheck(nameEdit)
    nt.appendChild(nameVis)
    nt.appendChild(nameEdit)
    const typeVis = document.createElement("div")
    typeVis.className = "type vis"
    const typeEdit = document.createElement("select")
    typeEdit.className = "type edit";
    ["integer", "real", "string", "boolean"].forEach((t) => {
        let o = document.createElement("option")
        o.value = t
        o.innerText = t.slice(0, 1).toUpperCase() + t.slice(1)
        typeEdit.appendChild(o)
    })
    typeEdit.onkeydown = e => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault()
            v.flogo_buttons.confirm.click()
        }
    }
    nt.appendChild(typeVis)
    nt.appendChild(typeEdit)
    const btns = document.createElement("div")
    btns.className = "buttonGroup"
    const delBtn = document.createElement("button")
    delBtn.className = "danger vis"
    delBtn.appendChild(makeIcon("delete"))
    delBtn.title = "Delete"
    delBtn.onclick = () => {
        variablesEditor_deleteVariable(v)
    }
    btns.appendChild(delBtn)
    const editBtn = document.createElement("button")
    editBtn.className = "vis"
    editBtn.appendChild(makeIcon("edit"))
    editBtn.title = "Modify"
    editBtn.onclick = () => {
        variablesEditor_editVariable(v)
    }
    btns.appendChild(editBtn)
    const cancelEditBtn = document.createElement("button")
    cancelEditBtn.className = "edit"
    cancelEditBtn.appendChild(makeIcon("close"))
    cancelEditBtn.title = "Cancel"
    cancelEditBtn.onclick = () => {
        variablesEditor_cancelEditVariable(v)
    }
    btns.appendChild(cancelEditBtn)
    const confirmEditBtn = document.createElement("button")
    confirmEditBtn.className = "important edit"
    confirmEditBtn.appendChild(makeIcon("save"))
    confirmEditBtn.title = "Confirm"
    confirmEditBtn.onclick = () => {
        variablesEditor_confirmEditVariable(v)
    }
    btns.appendChild(confirmEditBtn)
    nt.appendChild(btns)
    nt.ondragenter = () => {
        if (dragging !== v && v.previousSibling !== dragging) {
            variablesEditor_placeVariableDropIndicatorBefore(v)
        } else {
            variablesEditor_hideVariableDropIndicator()
        }
    }
    v.appendChild(nt)
    const valVis = document.createElement("div")
    valVis.className = "value vis"
    const valEdit = document.createElement("div")
    valEdit.className = "value edit"
    const init = document.createElement("input")
    init.type = "checkbox"
    init.onchange = () => {
        if (init.checked) {
            initVal.style.display = "block"
            initVal.focus()
        } else {
            initVal.style.display = "none"
        }
    }
    const initLabel = document.createElement("label")
    initLabel.innerText = "Initialize"
    initLabel.onclick = () => {
        init.click()
    }
    const initVal = document.createElement("div")
    initVal.contentEditable = true
    initVal.style.display = "none"
    initVal.onfocus = () => {
        selectContents(initVal)
    }
    initVal.onkeydown = e => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault()
            v.flogo_buttons.confirm.click()
        }
    }
    disableSpellcheck(initVal)
    valEdit.appendChild(init)
    valEdit.appendChild(initLabel)
    valEdit.appendChild(initVal)
    v.appendChild(valVis)
    v.appendChild(valEdit)
    v.flogo_name = {
        vis: nameVis,
        edit: nameEdit,
    }
    v.flogo_type = {
        vis: typeVis,
        edit: typeEdit,
    }
    v.flogo_val = {
        vis: valVis,
        edit: valEdit,
    }
    v.flogo_buttons = {
        confirm: confirmEditBtn,
        cancel: cancelEditBtn,
        edit: editBtn,
        del: delBtn,
        init: init
    }
    valEdit.ondragenter = valVis.ondragenter = () => {
        if (dragging !== v && v.nextSibling !== dragging) {
            variablesEditor_placeVariableDropIndicatorAfter(v)
        } else {
            variablesEditor_hideVariableDropIndicator()
        }
    }
    valEdit.flogo_init = init
    valEdit.flogo_initVal = initVal
    variablesEditor_updateVariableValue(v)
    if (name === null) {
        variablesEditor_editVariable(v)
    } else {
        nameVis.innerText = name
        nameEdit.innerText = name
        typeVis.innerText = variables[name].type.slice(0, 1).toUpperCase() + variables[name].type.slice(1)
        typeEdit.value = variables[name].type
        if (variables[name].initialValue !== null) {
            init.checked = true
            initVal.style.display = "block"
            initVal.innerText = variables[name].initialValue
        } else {
            init.checked = false
            initVal.style.display = "none"
        }
    }
    return v
}

function variablesEditor_reorderProgramVariablesUsingOrderFromVisibleList() {
    const newVariables = {}
    const vars = document.querySelectorAll("#variableList > div.variable")
    vars.forEach((v) => {
        newVariables[v.flogo_variable] = variables[v.flogo_variable]
    })
    variables = newVariables
}

function variablesEditor_deleteVariable(v) {
    document.getElementById("variableList").removeChild(v)
    removeVariable(v.flogo_variable)
    saveToHistory()
}

function variablesEditor_editVariable(v) {
    v.classList.add("editing")
    v.draggable = false
    v.flogo_buttons.init.onchange()
    requestAnimationFrame(() => {
        //needs to happen on the next frame because we can't focus an element that's not currently visible
        v.flogo_name.edit.focus()
    })
}

function variablesEditor_cancelEditVariable(v) {
    v.classList.remove("editing")
    v.draggable = true
    if (v.flogo_variable === null) {
        document.getElementById("variableList").removeChild(v)
        document.getElementById("variableList").appendChild(variablesEditor_makeAddBtn())
    } else {
        v.flogo_name.edit.innerText = v.flogo_variable
        v.flogo_type.edit.value = variables[v.flogo_variable].type
        if (variables[v.flogo_variable].initialValue !== null) {
            v.flogo_val.edit.flogo_init.checked = true
            v.flogo_val.edit.flogo_initVal.innerText = variables[v.flogo_variable].initialValue
        } else {
            v.flogo_val.edit.flogo_init.checked = false
            v.flogo_val.edit.flogo_initVal.innerText = ""
        }
    }
}

function variablesEditor_confirmEditVariable(v) {
    const name = v.flogo_name.edit.innerText.trim()
    if (!_isValidVariableName(name) || (typeof variables[name] !== "undefined" && (name !== v.flogo_variable || v.flogo_variable === null))) {
        errorFlash(v.flogo_name.edit)
        return
    }
    v.flogo_name.edit.innerText = name
    const type = v.flogo_type.edit.value
    let val = null
    try {
        if (v.flogo_val.edit.flogo_init.checked) {
            val = v.flogo_val.edit.flogo_initVal.innerText
            switch (type) {
                case "integer":
                case "real": {
                    val = val.trim()
                    v.flogo_val.edit.flogo_initVal.innerText = val
                    if (val === "") throw ""
                    val = Number(val)
                }
                break
                case "boolean": {
                    val = val.trim()
                    v.flogo_val.edit.flogo_initVal.innerText = val
                    if (val !== "false" && val !== "true") throw ""
                    val = val === "true"
                }
                break
            }
        }
        let changed = false
        if (v.flogo_variable === null) {
            declareVariable(name, type, val)
            changed = true
            v.flogo_variable = name
            v.flogo_name.vis.innerText = name
            v.flogo_type.vis.innerText = type.slice(0, 1).toUpperCase() + type.slice(1)
            variablesEditor_updateVariableValue(v)
            document.getElementById("variableList").appendChild(variablesEditor_makeAddBtn())
        } else {
            const tempName = "temp_" + Date.now()
            declareVariable(tempName, type, val)
            if (name === v.flogo_variable) {
                if (JSON.stringify(variables[name].toSimpleObject()) !== JSON.stringify(variables[tempName].toSimpleObject())) changed = true
                variables[name] = variables[tempName]
            } else {
                //this is inefficient af, but necessary to keep them in the right order when a variable is renamed
                changed = true
                const newVars = {}
                for (k in variables) {
                    if (k !== v.flogo_variable) {
                        newVars[k] = variables[k]
                    } else {
                        newVars[name] = variables[tempName]
                    }
                }
                variables = newVars
            }
            delete variables[tempName]
            v.flogo_variable = name
            v.flogo_name.vis.innerText = name
            v.flogo_type.vis.innerText = type.slice(0, 1).toUpperCase() + type.slice(1)
            variablesEditor_updateVariableValue(v)
        }
        v.classList.remove("editing")
        v.draggable = true
        if (changed) {
            saveToHistory()
        }
    } catch (e) {
        errorFlash(v.flogo_val.edit.flogo_initVal)
    }
}

function variablesEditor_makeAddBtn() {
    const b = document.createElement("button")
    b.id = "newVariable"
    b.className = "important"
    b.innerText = "New"
    b.prepend(makeIcon("add"))
    b.onclick = () => {
        const list = document.getElementById("variableList")
        list.removeChild(b)
        list.appendChild(variablesEditor_createVariable(null))
    }
    return b
}

function variablesEditor_updateVariableValue(v) {
    if (v.flogo_variable === null) return
    let text
    if (variables[v.flogo_variable].value !== null) {
        text = "" + variables[v.flogo_variable].value
        if (v.flogo_val.vis.classList.contains("uninitialized")) v.flogo_val.vis.classList.remove("uninitialized")
    } else {
        text = "Not initialized"
        if (!v.flogo_val.vis.classList.contains("uninitialized")) v.flogo_val.vis.classList.add("uninitialized")
    }
    if (text !== v.flogo_val.vis.innerText) {
        v.flogo_val.vis.innerText = text
    }
    if (variables[v.flogo_variable].modified) {
        if (!v.flogo_val.vis.classList.contains("modified")) v.flogo_val.vis.classList.add("modified")
    } else {
        if (v.flogo_val.vis.classList.contains("modified")) v.flogo_val.vis.classList.remove("modified")
    }
}

function variablesEditor_enable() {
    document.getElementById("variablesArea").classList.remove("noedit")
    const vars = document.querySelectorAll("#variableList > div.variable")
    vars.forEach((v) => {
        v.draggable = true
    })
}

function variablesEditor_disable() {
    document.getElementById("variablesArea").classList.add("noedit")
    const vars = document.querySelectorAll("#variableList > div.variable")
    vars.forEach((v) => {
        v.draggable = false
    })
}

function variablesEditor_makeVariableDropIndicator() {
    const d = document.createElement("div")
    d.id = "variableDropIndicator"
    return d
}

function variablesEditor_placeVariableDropIndicatorBefore(v) {
    const d = document.getElementById("variableDropIndicator")
    const vb = v.getBoundingClientRect()
    d.classList.add("visible")
    d.style.top = (vb.y - d.getBoundingClientRect().height) + "px"
    d.flogo_placeBefore = v
    d.flogo_placeAfter = null
}

function variablesEditor_placeVariableDropIndicatorAfter(v) {
    const d = document.getElementById("variableDropIndicator")
    const vb = v.getBoundingClientRect()
    d.classList.add("visible")
    d.style.top = (vb.y + vb.height) + "px"
    d.flogo_placeBefore = null
    d.flogo_placeAfter = v
}

function variablesEditor_hideVariableDropIndicator() {
    const d = document.getElementById("variableDropIndicator")
    d.classList.remove("visible")
    d.flogo_placeBefore = null
    d.flogo_placeAfter = null
}

function variablesEditor_moveVariableAtDropIndicator(v) {
    const d = document.getElementById("variableDropIndicator")
    const list = document.getElementById("variableList")
    if (d.flogo_placeBefore !== null) {
        const before = v,
            after = d.flogo_placeBefore
        if (before == after || before === null || after === null || after.flogo_variable === null || before.flogo_variable === null) return
        list.removeChild(before)
        list.insertBefore(before, after)
    } else if (d.flogo_placeAfter !== null) {
        const before = d.flogo_placeAfter,
            after = v
        if (before == after || before === null || after === null || after.flogo_variable === null || before.flogo_variable === null) return
        list.removeChild(after)
        before.after(after)
    } else {
        return
    }
    variablesEditor_reorderProgramVariablesUsingOrderFromVisibleList()
    saveToHistory()
}

function updateVariableValues() {
    requestAnimationFrame(updateVariableValues)
    const vars = document.querySelectorAll("#variableList > div.variable")
    vars.forEach((v) => {
        if (v.flogo_variable !== null) variablesEditor_updateVariableValue(v)
    })
}

function recreateVariableList() {
    const list = document.getElementById("variableList")
    list.innerHTML = ""
    for (v in variables) {
        const div = variablesEditor_createVariable(v)
        list.appendChild(div)
    }
    list.appendChild(variablesEditor_makeAddBtn())
    list.appendChild(variablesEditor_makeVariableDropIndicator())
}

function variablesEditor_cancelAllEdits() {
    const vars = document.querySelectorAll("#variableList > div.variable.editing")
    vars.forEach((v) => {
        variablesEditor_cancelEditVariable(v)
    })
}

//-------- TOP BAR STUFF: NEW, LOAD, SAVE, RUN, ETC. --------

function updateBar() {
    requestAnimationFrame(updateBar)
    const state = interpreter.getState()
    if (state === STATE_RUNNING || state === STATE_PAUSED) {
        document.getElementById("newProgram").disabled = true
        document.getElementById("loadProgram").disabled = true
        document.getElementById("saveProgram").disabled = true
        document.getElementById("openSettings").disabled = true
        document.getElementById("openManual").disabled = true
    }
    if (state === STATE_RUNNING) {
        document.getElementById("runProgram").disabled = true
        document.getElementById("pauseProgram").disabled = false
    } else if (state === STATE_PAUSED || state === STATE_STOPPED || state === STATE_CRASHED) {
        document.getElementById("runProgram").disabled = false
        document.getElementById("pauseProgram").disabled = true
    }
    if (state === STATE_STOPPED || state === STATE_CRASHED) {
        document.getElementById("newProgram").disabled = false
        document.getElementById("loadProgram").disabled = false
        document.getElementById("saveProgram").disabled = false
        document.getElementById("openSettings").disabled = false
        document.getElementById("openManual").disabled = false
        document.getElementById("undo").disabled = undoHistoryPtr <= 1
        document.getElementById("redo").disabled = undoHistoryPtr <= 0 || undoHistoryPtr >= undoHistory.length
    } else {
        document.getElementById("undo").disabled = true
        document.getElementById("redo").disabled = true
    }
}

function runProgram() {
    closePopup(true)
    variablesEditor_disable()
    const state = interpreter.getState()
    if (state === STATE_STOPPED || state === STATE_CRASHED) {
        resetConsole()
    }
    variablesEditor_cancelAllEdits()
    cancelSelection()
    interpreter.run()
}

function stopProgram() {
    closePopup(true)
    variablesEditor_enable()
    document.getElementById("input").disabled = true
    document.getElementById("input_send").disabled = true
    const state = interpreter.getState()
    if (state === STATE_RUNNING || state === STATE_PAUSED) {
        interpreter.stop()
    } else if (state === STATE_STOPPED || state === STATE_CRASHED) {
        resetVariables()
        resetConsole()
    }
}

function pauseProgram() {
    if (interpreter.getState() === STATE_RUNNING) {
        interpreter.pause()
    }
}

function setProgramExecutionMode() {
    switch (document.getElementById("executionMode").value) {
        case "turbo": {
            interpreter.executionMode = MODE_TURBO
        }
        break
        case "normal": {
            interpreter.executionMode = MODE_NORMAL
        }
        break
        case "slow": {
            interpreter.executionMode = MODE_SLOW
        }
        break
        case "step": {
            interpreter.executionMode = MODE_STEP
        }
        break
    }
}

function newProgram() {
    closePopup(true)
    const realNewProgram = () => {
        const state = interpreter.getState()
        if (state === STATE_RUNNING || state === STATE_PAUSED) {
            stopProgram()
        }
        cancelSelection()
        clearVariables()
        clearProgram()
        clearMetadata()
        recreateVariableList()
        resetConsole()
        clearHistory()
        saveToHistory()
        updateFlowchart(true)
        clipboard = null
        updateWindowTitle()
    }
    if (undoHistoryPtr <= 1) {
        realNewProgram()
    } else {
        yesnoPrompt("Erase program?", "All unsaved changes will be lost", document.getElementById("newProgram"), realNewProgram)
    }
}

function loadProgram() {
    closePopup(true)
    const realLoadProgram = () => {
        const state = interpreter.getState()
        if (state === STATE_RUNNING || state === STATE_PAUSED) {
            stopProgram()
        }
        const l = document.getElementById("filePicker")
        l.onchange = () => {
            document.getElementById("loadOverlay").style.display = "block"
            updateWindowTitle()
            loadFromFile(l.files[0], (e) => {
                cancelSelection()
                recreateVariableList()
                resetConsole()
                clearHistory()
                saveToHistory()
                updateFlowchart(true)
                clipboard = null
                if (e !== null) {
                    document.getElementById("loadError_details").innerText = e
                    showPopup("loadError")
                } else {
                    toast("Program loaded")
                }
                document.getElementById("loadOverlay").style.display = "none"
                updateWindowTitle()
            })
            l.value = "" //workaround: some chromium-based browsers don't trigger the onchange event on the input if selecting the same file
        }
        l.click()
    }
    if (undoHistoryPtr <= 1) {
        realLoadProgram()
    } else {
        yesnoPrompt("Load another program?", "All unsaved changes will be lost", document.getElementById("loadProgram"), realLoadProgram)
    }
}

function saveProgram() {
    closePopup(true)
    const state = interpreter.getState()
    if (state === STATE_RUNNING || state === STATE_PAUSED) {
        stopProgram()
    }
    toast("Starting download")
    download()
}

//-------- UNDO/REDO STUFF --------
let undoHistory = []
let undoHistoryPtr = 0

function clearHistory() {
    undoHistory = []
    undoHistoryPtr = 0
}

function saveToHistory() {
    undoHistory.length = undoHistoryPtr
    undoHistory.push(save(false))
    undoHistoryPtr++
}

function undo() {
    closePopup(true)
    cancelSelection()
    const intState = interpreter.getState()
    if (intState === STATE_RUNNING || intState === STATE_PAUSED) return
    if (undoHistoryPtr <= 1) return
    load(undoHistory[undoHistoryPtr - 2])
    undoHistoryPtr--
    updateFlowchart()
    recreateVariableList()
    updateWindowTitle()
}

function redo() {
    closePopup(true)
    cancelSelection()
    const intState = interpreter.getState()
    if (intState === STATE_RUNNING || intState === STATE_PAUSED) return
    if (undoHistoryPtr <= 0 || undoHistoryPtr >= undoHistory.length) return
    load(undoHistory[undoHistoryPtr])
    undoHistoryPtr++
    updateFlowchart()
    recreateVariableList()
    updateWindowTitle()
}

//-------- SETTINGS STUFF --------
function openSettings() {
    closePopup()
    cancelSelection()
    const state = interpreter.getState()
    if (state === STATE_RUNNING || state === STATE_PAUSED) {
        stopProgram()
    }
    settings_selectTab("program_metadata")
    document.getElementById("metadata_title").value = metadata.title
    document.getElementById("metadata_author").value = metadata.author
    document.getElementById("style_theme").value = getCurrentTheme()
    document.getElementById("settings_fps").checked = storage.showFps === "true"
    document.getElementById("settings_allowZoomOnFlowchart").checked = _allowZoomOnFlowchart
    document.getElementById("settings_altTurboTSlice").checked = _altTurboTSlice
    const badge = document.getElementById("versionTypeBadge")
    if (navigator.standalone || window.matchMedia('(display-mode: standalone)').matches) {
        badge.innerText = "PWA"
        badge.style.background = "#5a0ec9"
        badge.style.color = "#ffffff"
    } else {
        badge.innerText = "Web"
        badge.style.background = "#f1582f"
        badge.style.color = "#ffffff"
    }
    showPopup("settings")
}

function settings_selectTab(id) {
    document.querySelectorAll("div.settings_tab").forEach((e) => e.classList.remove("selected"))
    document.querySelectorAll("#settings_tabSelector > div").forEach((e) => e.classList.remove("selected"))
    document.getElementById(id).classList.add("selected")
    document.querySelectorAll("#settings_tabSelector > div[for=" + id + "]").forEach((e) => e.classList.add("selected"))
}

function settings_updateMetadata() {
    const title = document.getElementById("metadata_title").value.trim(),
        author = document.getElementById("metadata_author").value.trim()
    if (title !== metadata.title || author !== metadata.author) {
        metadata.title = document.getElementById("metadata_title").value.trim()
        metadata.author = document.getElementById("metadata_author").value.trim()
        saveToHistory()
        updateWindowTitle()
    }
    closePopup(true)
}

function settings_setTheme() {
    loadTheme(document.getElementById("style_theme").value)
}

function settings_bkColor_changed() {
    const val = document.getElementById("settings_bkColor").checked
    storage.bkColor = val
}

function settings_fps_changed() {
    const val = document.getElementById("settings_fps").checked
    storage.showFps = val
    document.getElementById("fps").style.display = val ? "block" : "none"
}

function settings_allowZoomOnFlowchart_changed() {
    const val = document.getElementById("settings_allowZoomOnFlowchart").checked
    storage.allowZoomOnFlowchart = val
    _allowZoomOnFlowchart = val
}

function settings_altTurboTSlice_changed() {
    const val = document.getElementById("settings_altTurboTSlice").checked
    storage.altTurboTSlice = val
    _altTurboTSlice = val
}

function settings_downloadSVG() {
    downloadSVG(undefined, document.getElementById("settings_bkColor").checked)
}

function settings_downloadPNG() {
    downloadPNG(undefined, document.getElementById("settings_bkColor").checked)
}

function showLicense() {
    document.getElementById("licenseViewer").classList.add("visible")
}

function hideLicense() {
    document.getElementById("licenseViewer").classList.remove("visible")
}

//-------- MANUAL STUFF --------
function openManual() {
    showPopup("man")
    document.getElementById("man_contents").scrollTop = 0
}

function man_scrollTo(name) {
    const man = document.getElementById("man_contents")
    const e = man.querySelector("*[name='" + name + "']")
    if (e !== null) {
        man.scrollTop = e.getBoundingClientRect().y - 10
    }
}

//-------- LAYOUT-RELATED STUFF --------

let LARGE_LAYOUT_THRESHOLD = 80 //>=80rem, the app will start with both side bars expanded
let SMALL_LAYOUT_THRESHOLD = 55 //<=55rem, the app will not allow you to keep both bars expanded at the same time
let lastToggled = null

function autoLayout(first = false) {
    requestAnimationFrame(autoLayout)
    const va = document.getElementById("variablesArea"),
        fc = document.getElementById("flowchartArea"),
        ca = document.getElementById("consoleArea")
    if (first === true) {
        if (window.matchMedia("(min-width:" + LARGE_LAYOUT_THRESHOLD + "rem)").matches) {
            va.classList.add("expanded")
            ca.classList.add("expanded")
            fc.classList.add("variablesExpanded")
            fc.classList.add("consoleExpanded")
        }
    } else {
        if (window.matchMedia("(max-width:" + SMALL_LAYOUT_THRESHOLD + "rem)").matches) {
            if (va.classList.contains("expanded") && ca.classList.contains("expanded")) {
                if (va === lastToggled) {
                    ca.classList.remove("expanded")
                    fc.classList.remove("consoleExpanded")
                } else if (ca === lastToggled) {
                    va.classList.remove("expanded")
                    fc.classList.remove("variablesExpanded")
                } else {
                    ca.classList.remove("expanded")
                    va.classList.remove("expanded")
                    fc.classList.remove("variablesExpanded")
                    fc.classList.remove("consoleExpanded")
                }
            }
        }
    }
}

function toggleVariablesArea() {
    const va = document.getElementById("variablesArea")
    va.classList.toggle("expanded")
    //workaround: there is a 1 frame "jitter" in the layout when flowchartArea is resized because konva won't redraw until the frame after our layout shift. To workaround this, we add a transform that moves the old content in the new place, and remove it the very next frame after konva has drawn the new content in the correct spot. This issue is not visible in the right side, so toggleConsoleArea doesn't have this code
    const fc = document.getElementById("flowchartArea")
    fc.classList.toggle("variablesExpanded")
    if (fc.classList.contains("variablesExpanded")) {
        fc.style.transform = "translateX(calc(var(--layout-variablesArea-width) * -1))"
    } else {
        fc.style.transform = "translateX(var(--layout-variablesArea-width))"
    }
    requestAnimationFrame(() => {
        requestAnimationFrame(() => {
            fc.style.transform = ""
        })
    })
    lastToggled = va
}

function toggleConsoleArea() {
    const ca = document.getElementById("consoleArea")
    ca.classList.toggle("expanded")
    document.getElementById("flowchartArea").classList.toggle("consoleExpanded")
    lastToggled = ca
}

function closePopup(all = false) {
    document.querySelectorAll("div.popup.visible").forEach((e) => {
        if (all === true || !e.classList.contains("noAutoClose")) {
            e.classList.remove("visible")
            if (typeof e.flogo_closeCallback !== "undefined") e.flogo_closeCallback()
        }
    })
    if (document.querySelectorAll("div.popup.visible").length === 0) {
        document.getElementById("popupBackdrop").classList.remove("active")
    }
}

function showPopup(d) {
    closePopup()
    if (typeof d === "string") d = document.getElementById(d)
    d.classList.add("visible")
    document.getElementById("popupBackdrop").classList.add("active")
}

function updateFlowchartOcclusion() {
    const barBounds = document.getElementById("bar").getBoundingClientRect(),
        fcBounds = document.getElementById("flowchartArea").getBoundingClientRect()
    FLOWCHART_OCCLUDED_ON_TOP = barBounds.y + barBounds.height - fcBounds.y
}

//-------- KEYBOARD SHORTCUTS --------
function initKeyboardShortcuts() {
    document.body.addEventListener('keydown', e => {
        if (document.getElementById("errorScreen").style.display === "block") return
        const ctrlKey = isMac ? (e.ctrlKey || e.metaKey) : e.ctrlKey
        switch (e.key.toLowerCase()) {
            case 'z': {
                if (e.target !== document.body) return
                if (document.querySelectorAll("div.popup.visible").length !== 0) return
                if (ctrlKey) {
                    e.preventDefault()
                    const intState = interpreter.getState()
                    if (intState === STATE_RUNNING || intState === STATE_PAUSED) return
                    if (e.shiftKey) {
                        if (undoHistoryPtr >= undoHistory.length) return
                        toast("Redo")
                        redo()
                    } else {
                        if (undoHistoryPtr <= 1) return
                        toast("Undo")
                        undo()
                    }
                }
            };
            break
            case 'y': {
                if (e.target !== document.body) return
                if (document.querySelectorAll("div.popup.visible").length !== 0) return
                if (ctrlKey && !e.shiftKey) {
                    e.preventDefault()
                    const intState = interpreter.getState()
                    if (intState === STATE_RUNNING || intState === STATE_PAUSED) return
                    if (undoHistoryPtr >= undoHistory.length) return
                    toast("Redo")
                    redo()
                }
            };
            break
            case 'a': {
                if (e.target !== document.body) return
                const intState = interpreter.getState()
                if (intState === STATE_RUNNING || intState === STATE_PAUSED) return
                if (document.querySelectorAll("div.popup.visible").length !== 0) return
                if (ctrlKey && !e.shiftKey) {
                    e.preventDefault()
                    selectAllInstructions()
                }
            };
            break
            case 'x': {
                if (e.target !== document.body) return
                const intState = interpreter.getState()
                if (intState === STATE_RUNNING || intState === STATE_PAUSED) return
                if (document.querySelectorAll("div.popup.visible").length !== 0) return
                if (ctrlKey && !e.shiftKey) {
                    e.preventDefault()
                    if (selectedInstructions.length > 0) {
                        if (selectedInstructions.length === 1) {
                            toast("Cut")
                        } else {
                            toast("Cut " + selectedInstructions.length + " instructions")
                        }
                    }
                    cutSelectedInstructions()
                }
            };
            break
            case 'c': {
                if (e.target !== document.body) return
                const intState = interpreter.getState()
                if (intState === STATE_RUNNING || intState === STATE_PAUSED) return
                if (document.querySelectorAll("div.popup.visible").length !== 0) return
                if (ctrlKey && !e.shiftKey) {
                    e.preventDefault()
                    if (selectedInstructions.length > 0) {
                        if (selectedInstructions.length === 1) {
                            toast("Copied")
                        } else {
                            toast("Copied " + selectedInstructions.length + " instructions")
                        }
                    }
                    copySelectedInstructions()
                }
            };
            break
            case 'v': {
                if (e.target !== document.body) return
                const intState = interpreter.getState()
                if (intState === STATE_RUNNING || intState === STATE_PAUSED) return
                if (ctrlKey && !e.shiftKey) {
                    e.preventDefault()
                    if (clipboard === null) return
                    let showToast = false
                    if (insertTall_stage.container().classList.contains("visible")) {
                        insertTall_stage.flogo_pasteBtn.eventListeners["click"][0].handler()
                        showToast = true
                    } else if (insertWide_stage.container().classList.contains("visible")) {
                        insertWide_stage.flogo_pasteBtn.eventListeners["click"][0].handler()
                        showToast = true
                    }
                    if (showToast) {
                        if (clipboard.length === 1) {
                            toast("Pasted")
                        } else {
                            toast("Pasted " + clipboard.length + " instructions")
                        }
                    }
                }
            };
            break
            case 'delete': {
                if (e.target !== document.body) return
                const intState = interpreter.getState()
                if (intState === STATE_RUNNING || intState === STATE_PAUSED) return
                if (document.querySelectorAll("div.popup.visible").length !== 0) return
                if (!ctrlKey && !e.shiftKey) {
                    e.preventDefault()
                    if (selectedInstructions.length > 0) {
                        if (selectedInstructions.length === 1) {
                            toast("Deleted")
                        } else {
                            toast("Deleted " + selectedInstructions.length + " instructions")
                        }
                    }
                    deleteSelectedInstructions()
                }
            };
            break
            case 'escape': {
                if (!ctrlKey && !e.shiftKey) {
                    const intState = interpreter.getState()
                    if (intState === STATE_RUNNING || intState === STATE_PAUSED) return
                    if (document.querySelectorAll("div.popup.visible").length !== 0) {
                        e.preventDefault()
                        closePopup(true)
                    } else {
                        e.preventDefault()
                        const v = e.target.closest('.variable.editing')
                        if (v !== null) {
                            v.flogo_buttons.cancel.click()
                        }
                    }
                }
            };
            break
        }
    })
}

//-------- MISC UTILITIES -------

function disableSpellcheck(element) {
    element.setAttribute("autocomplete", "off")
    element.setAttribute("autocorrect", "off")
    element.setAttribute("autocapitalize", "off")
    element.setAttribute("spellcheck", "false")
}

function makeIcon(name) {
    const s = document.createElement("span")
    s.className = "icon material-icons-sharp"
    s.innerText = name
    return s
}

function errorFlash(element) {
    element.style.animation = "errorFlash 0.3s"
    element.onanimationend = () => {
        element.style.animation = ""
        element.focus()
    }
}

function yesnoPrompt(title, details, e, callback_yes, callback_no) {
    const yesno = document.getElementById("yesno")
    document.getElementById("yesno_title_text").innerText = title
    document.getElementById("yesno_details").innerText = details
    document.getElementById("yesno_yes").onclick = () => {
        closePopup()
        if (typeof callback_yes !== "undefined") callback_yes()
    }
    document.getElementById("yesno_no").onclick = () => {
        closePopup()
        if (typeof callback_no !== "undefined") callback_no()
    }
    if (typeof e !== "undefined" && e !== null) {
        const b = e.getBoundingClientRect()
        yesno.style.top = b.y + b.height + "px"
        yesno.style.left = b.x + "px"
        yesno.style.transform = ""
    } else {
        yesno.style.top = "50vh"
        yesno.style.left = "50vw"
        yesno.style.transform = "translate(-50%,-50%)"
    }
    showPopup(yesno)
    let b = yesno.getBoundingClientRect()
    const wBounds = document.body.getBoundingClientRect()
    if (b.x + b.width >= wBounds.width) {
        yesno.style.left = wBounds.width - b.width + "px"
    }
    if (b.y + b.height >= wBounds.height) {
        yesno.style.top = wBounds.height - b.height + "px"
    }
    b = yesno.getBoundingClientRect()
    if (b.x < 0) {
        yesno.style.left = 0
    }
    if (b.y < 0) {
        yesno.style.top = 0
    }
}

function applyBrowserThemeColorFromCSS() {
    document.querySelector('meta[name="theme-color"]').setAttribute("content", _getCSSVal("--browser-theme-color", "#000000", document.body))
}

function selectContents(element) {
    if (element.nodeName === "INPUT" || element.nodeName === "TEXTAREA") {
        element.select()
    } else {
        const range = document.createRange()
        range.selectNodeContents(element)
        const sel = window.getSelection()
        sel.removeAllRanges()
        sel.addRange(range)
    }
}

function updateWindowTitle() {
    if (navigator.standalone || window.matchMedia('(display-mode: standalone)').matches) {
        if (document.getElementById("loadOverlay").style.visible === "block") {
            document.title = "Loading"
        } else {
            if (metadata.title.trim() !== "") {
                document.title = metadata.title
            } else {
                document.title = "Untitled"
            }
        }
    } else {
        if (document.getElementById("loadOverlay").style.visible === "block") {
            document.title = "Flogo"
        } else {
            if (metadata.title.trim() !== "") {
                document.title = metadata.title + " – Flogo"
            } else {
                document.title = "Untitled – Flogo"
            }
        }
    }

}

//-------- TOAST NOTIFICATIONS --------
function toast(text, duration = 2000) {
    document.querySelectorAll("#toasts>div.toast").forEach(t => {
        if (typeof t.flogo_autoOutTimer !== "undefined") {
            clearTimeout(t.flogo_autoOutTimer)
            t.flogo_leave()
        }
    })
    const t = document.createElement("div")
    t.className = "toast"
    t.innerText = text
    t.onanimationend = () => {
        t.flogo_leave = () => {
            t.style.animation = "toast-out var(--toast-animation-duration)"
            delete(t.flogo_autoOutTimer)
            delete(t.flogo_leave)
            t.onanimationend = () => {
                document.getElementById("toasts").removeChild(t)
            }
        }
        t.flogo_autoOutTimer = setTimeout(t.flogo_leave, duration)
    }
    t.style.animation = "toast-in var(--toast-animation-duration)"
    document.getElementById("toasts").appendChild(t)
}

//-------- FPS COUNTER --------

let oldTimestamp = 0

function updateFps(t) {
    requestAnimationFrame(updateFps)
    const counter = document.getElementById("fps")
    if (counter.style.display === "none") return
    const fps = 1000 / (t - oldTimestamp)
    if (fps === Infinity) return
    counter.innerText = fps.toFixed(2)
    oldTimestamp = t
}

//-------- APPLICATION INITIALIZATION --------

function initApp() {
    document.getElementById("editor2").addEventListener("contextmenu", (e) => e.preventDefault()) //workaround: on some chromium-based browsers, this context menu gets accidentally triggered when right-clicking a block, despite it having display:none when the event is triggered
    document.getElementById("fps").style.display = storage.showFps === "true" ? "block" : "none"
    updateFps()
    if (typeof storage.bkColor !== "undefined") {
        document.getElementById("settings_bkColor").checked = storage.bkColor === "true"
    }
    if (typeof storage.allowZoomOnFlowchart !== "undefined") {
        _allowZoomOnFlowchart = storage.allowZoomOnFlowchart === "true"
    }
    if (typeof storage.altTurboTSlice !== "undefined") {
        _altTurboTSlice = storage.altTurboTSlice === "true"
    }
    edit_addFocusEvents()
    initFlowchart("flowchartArea")
    window.addEventListener("load", () => {
        document.fonts.ready.then(() => {
            const pixelRatioChangeHandler = () => {
                requestAnimationFrame(pixelRatioChangeHandler)
                if (insertWide_stage === null) return //can happen during loading
                //flowchart handles this itself, no need to update it
                if (window.devicePixelRatio !== insertWide_stage.getLayers()[0].getCanvas().getPixelRatio()) {
                    insertWide_stage.getLayers()[0].getCanvas().setPixelRatio(window.devicePixelRatio)
                    insertTall_stage.getLayers()[0].getCanvas().setPixelRatio(window.devicePixelRatio)
                    //these 2 lines shouldn't be necessary, but konva doesn't redraw it automatically after changing pixel ratio
                    insertWide_stage.draw()
                    insertTall_stage.draw()
                    //update graphics in the editor
                    document.querySelectorAll(".editor_graphics").forEach(e => {
                        e.flogo_stage.getLayers()[0].getCanvas().setPixelRatio(window.devicePixelRatio)
                        e.flogo_stage.draw()
                    })
                    updateFlowchartOcclusion()
                }
            }
            const systemColorSchemeChangeHandler = () => {
                window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
                    if (typeof storage.theme === "undefined") {
                        loadTheme(getDefaultTheme(), undefined, false)
                    }
                })
            }
            const endOfLoad = () => {
                applyBrowserThemeColorFromCSS()
                edit_shapeFollower()
                updateFlowchartOcclusion()
                updateFlowchart(true)
                pixelRatioChangeHandler()
                updateWindowTitle()
                systemColorSchemeChangeHandler()
                if (typeof storage.recovery !== "undefined") {
                    showPopup("errorRec")
                } else {
                    crashHandlerMode = 1
                }
            }
            loadTheme(getCurrentTheme(), endOfLoad, false)
            recreateVariableList()
            updateVariableValues()
            setProgramExecutionMode()
            resetConsole()
            saveToHistory()
            updateBar()
            autoLayout(true)
            initKeyboardShortcuts()
        })
    })
    window.addEventListener("resize", closePopup)
    window.addEventListener("resize", updateFlowchartOcclusion)
    window.onbeforeunload = (e) => {
        if (document.getElementById("errorScreen").style.display === "block") return
        if (undoHistoryPtr <= 1) return
        e.preventDefault()
        e.returnValue = ""
    }
    document.body.addEventListener("dragover", (e) => e.preventDefault())
    document.body.addEventListener("drop", (e) => {
        e.preventDefault()
        if (e.dataTransfer.items) {
            if (document.getElementById("errorScreen").style.display === "block") return
            if (e.dataTransfer.items.length !== 1) return
            if (e.dataTransfer.items[0].kind !== "file") return
            closePopup(true)
            const intState = interpreter.getState()
            if (intState === STATE_RUNNING || intState === STATE_PAUSED) {
                stopProgram()
            }
            const f = e.dataTransfer.items[0].getAsFile() //workaround: for some reason this becomes undefined in chromium inside loadDraggedProgram, so I save it to this variable
            const loadDraggedProgram = () => {
                document.getElementById("loadOverlay").style.display = "block"
                updateWindowTitle()
                loadFromFile(f, (e2) => {
                    cancelSelection()
                    recreateVariableList()
                    resetConsole()
                    clearHistory()
                    saveToHistory()
                    updateFlowchart(true)
                    clipboard = null
                    if (e2 !== null) {
                        document.getElementById("loadError_details").innerText = e2
                        showPopup("loadError")
                    } else {
                        toast("Program loaded")
                    }
                    document.getElementById("loadOverlay").style.display = "none"
                    updateWindowTitle()
                })
            }
            if (undoHistoryPtr <= 1) {
                loadDraggedProgram()
            } else {
                yesnoPrompt("Load another program?", "All unsaved changes will be lost", null, loadDraggedProgram)
            }
        }
    })
    if (enableWorkaroundsForWebKitBecauseItFuckingSucks) { //webkit-based browsers don't support file filters with multiple types
        document.getElementById("filePicker").removeAttribute("accept")
    }
}

function recoverProgram() {
    load(storage.recovery)
    recreateVariableList()
    updateFlowchart(true)
    saveToHistory()
    delete storage.recovery
    updateWindowTitle()
    crashHandlerMode = 1
    closePopup(true)
}

function deleteRecovery() {
    delete storage.recovery
    crashHandlerMode = 1
    closePopup(true)
}

function saveProgramForRecovery() {
    if (program.body.length !== 0 || Object.keys(variables).length !== 0) {
        storage.recovery = save(false)
        return 1
    } else {
        return 0
    }
}

function loadTheme(name, callback, saveToStorage = true) {
    let t = document.getElementById("theme")
    const newTheme = "themes/" + name + ".css"
    if (t !== null && t.href.endsWith(newTheme)) {
        document.getElementById("loadOverlay").style.display = "none"
        return
    }
    cancelSelection()
    //the link element needs to be recreated for the onload event to trigger again (chromium)
    if (t !== null) document.head.removeChild(t)
    t = document.createElement("link")
    t.id = "theme"
    t.rel = "stylesheet"
    t.type = "text/css"
    closePopup()
    document.getElementById("loadOverlay").style.display = "block"
    t.onload = () => {
        LARGE_LAYOUT_THRESHOLD = Number(_getCSSVal("--layout-large-threshold", 80, document.body))
        SMALL_LAYOUT_THRESHOLD = Number(_getCSSVal("--layout-small-threshold", 55, document.body))
        applyBrowserThemeColorFromCSS()
        if (saveToStorage) {
            storage.theme = name
        }
        updateFlowchartOcclusion()
        loadFlowchartThemeFromCSS(() => {
            insert_preparePopups()
            edit_prepareGraphics()
            document.getElementById("loadOverlay").style.display = "none"
            if (typeof callback !== "undefined") callback()
        })
    }
    t.href = newTheme
    t.onerror = () => {
        loadTheme(getDefaultTheme(), callback, false)
    }
    document.head.appendChild(t)
}

function getDefaultTheme() {
    if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
        return "default_dark"
    } else {
        return "default_light"
    }
}

function getCurrentTheme() {
    if (typeof storage.theme !== "undefined") {
        return storage.theme
    } else {
        return getDefaultTheme()
    }
}
