import * as Popups from "./ui-popup.js"
import * as History from "./ui-history.js"
import * as Actions from "./ui-actions.js"
import * as Flowchart from "./ui-flowchart.js"
import * as FlowchartInsert from "./ui-flowchart-insert.js"
import * as VariablesEditor from "./ui-variables.js"
import * as Platform from "./platformSpecific.js"
import * as FlogoLang from "./flogo-language.js"

export function init() {
    document.body.addEventListener('keydown', e => {
        const ctrlKey = Platform.isMac ? (e.ctrlKey || e.metaKey) : e.ctrlKey
        switch (e.key.toLowerCase()) {
            case 'z': {
                if (e.target !== document.body) return
                if (Popups.areVisible()) return
                if (ctrlKey) {
                    e.preventDefault()
                    const intState = FlogoLang.interpreter.getState()
                    if (intState === "running" || intState === "paused") return
                    if (e.shiftKey) {
                        if (!History.canRedo()) return
                        Popups.toast("Redo")
                        History.redo()
                    } else {
                        if (!History.canUndo()) return
                        Popups.toast("Undo")
                        History.undo()
                    }
                }
            }
            break
            case 'y': {
                if (e.target !== document.body) return
                if (Popups.areVisible()) return
                if (ctrlKey && !e.shiftKey) {
                    e.preventDefault()
                    const intState = FlogoLang.interpreter.getState()
                    if (intState === "running" || intState === "paused") return
                    if (!History.canRedo()) return
                    Popups.toast("Redo")
                    History.redo()
                }
            }
            break
            case 'a': {
                if (e.target !== document.body) return
                const intState = FlogoLang.interpreter.getState()
                if (intState === "running" || intState === "paused") return
                if (Popups.areVisible()) return
                if (ctrlKey && !e.shiftKey) {
                    e.preventDefault()
                    Flowchart.selectAllInstructions()
                }
            }
            break
            case 'x': {
                if (e.target !== document.body) return
                const intState = FlogoLang.interpreter.getState()
                if (intState === "running" || intState === "paused") return
                if (Popups.areVisible()) return
                if (ctrlKey && !e.shiftKey) {
                    e.preventDefault()
                    const n = Flowchart.cutSelectedInstructions()
                    if (n > 0) {
                        if (n === 1) {
                            Popups.toast("Cut")
                        } else {
                            Popups.toast("Cut " + n + " instructions")
                        }
                    }
                }
            }
            break
            case 'c': {
                if (e.target !== document.body) return
                const intState = FlogoLang.interpreter.getState()
                if (intState === "running" || intState === "paused") return
                if (Popups.areVisible()) return
                if (ctrlKey && !e.shiftKey) {
                    e.preventDefault()
                    const n = Flowchart.copySelectedInstructions()
                    if (n > 0) {
                        if (n === 1) {
                            Popups.toast("Copied")
                        } else {
                            Popups.toast("Copied " + n + " instructions")
                        }
                    }
                }
            }
            break
            case 'v': {
                if (e.target !== document.body) return
                const intState = FlogoLang.interpreter.getState()
                if (intState === "running" || intState === "paused") return
                if (ctrlKey && !e.shiftKey) {
                    e.preventDefault()
                    const n = FlowchartInsert.pasteHere()
                    if (n > 0) {
                        if (n === 1) {
                            Popups.toast("Pasted")
                        } else {
                            Popups.toast("Pasted " + n + " instructions")
                        }
                    }
                }
            }
            break
            case 'delete': {
                if (e.target !== document.body) return
                const intState = FlogoLang.interpreter.getState()
                if (intState === "running" || intState === "paused") return
                if (Popups.areVisible()) return
                if (!ctrlKey && !e.shiftKey) {
                    e.preventDefault()
                    const n = Flowchart.deleteSelectedInstructions()
                    if (n > 0) {
                        if (n === 1) {
                            Popups.toast("Deleted")
                        } else {
                            Popups.toast("Deleted " + n + " instructions")
                        }
                    }
                }
            }
            break
            case 'escape': {
                if (!ctrlKey && !e.shiftKey) {
                    const intState = FlogoLang.interpreter.getState()
                    if (intState === "running" || intState === "paused") return
                    if (Popups.areVisible()) {
                        e.preventDefault()
                        Popups.close(true)
                    }
                }
            }
            break
            case 's': {
                if (ctrlKey && !e.shiftKey) {
                    e.preventDefault()
                    const intState = FlogoLang.interpreter.getState()
                    if (intState === "running" || intState === "paused") return
                    if (Popups.areVisible()) return
                    Actions.saveProgram(true)
                }
            }
            break
            case 'l': {
                if (ctrlKey && !e.shiftKey) {
                    e.preventDefault()
                    const intState = FlogoLang.interpreter.getState()
                    if (intState === "running" || intState === "paused") return
                    if (Popups.areVisible()) return
                    Actions.loadProgram(true)
                }
            }
            break
            case 'n': {
                if (ctrlKey && !e.shiftKey) {
                    e.preventDefault()
                    const intState = FlogoLang.interpreter.getState()
                    if (intState === "running" || intState === "paused") return
                    if (Popups.areVisible()) return
                    Actions.newProgram(true)
                }
            }
            break
        }
    })
    //workaround to avoid bubbling of ctrl+v
    document.body.addEventListener('paste', e => {
        if (e.target !== document.activeElement) {
            e.preventDefault()
        }
    })
}
