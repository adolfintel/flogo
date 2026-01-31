import * as Platform from "./platformSpecific.js"
import * as Flowchart from "./ui-flowchart.js"
import * as Popups from "./ui-popup.js"
import * as FlogoLang from "./flogo-language.js"
import * as VariablesEditor from "./ui-variables.js"
import * as Utils from "./ui-utils.js"

let undoHistory = []
let undoHistoryPtr = 0

export function clear() {
    undoHistory = []
    undoHistoryPtr = 0
}

export function commit() {
    undoHistory.length = undoHistoryPtr
    undoHistory.push(FlogoLang.save(false, VariablesEditor.getTempVariables()))
    undoHistoryPtr++
}

export function undo() {
    Popups.close(true)
    Flowchart.cancelSelection()
    const intState = FlogoLang.interpreter.getState()
    if (intState === "running" || intState === "paused") return
    if (undoHistoryPtr <= 1) return
    FlogoLang.load(undoHistory[undoHistoryPtr - 2])
    undoHistoryPtr--
    Flowchart.update()
    VariablesEditor.init()
    Utils.updateWindowTitle()
}

export function redo() {
    Popups.close(true)
    Flowchart.cancelSelection()
    const intState = FlogoLang.interpreter.getState()
    if (intState === "running" || intState === "paused") return
    if (undoHistoryPtr <= 0 || undoHistoryPtr >= undoHistory.length) return
    FlogoLang.load(undoHistory[undoHistoryPtr])
    undoHistoryPtr++
    Flowchart.update()
    VariablesEditor.init()
    Utils.updateWindowTitle()
}

export function canUndo() {
    return undoHistoryPtr > 1
}

export function canRedo() {
    return undoHistoryPtr > 0 && undoHistoryPtr < undoHistory.length
}

export function isEmpty() {
    return undoHistoryPtr <= 1
}
