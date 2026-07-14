import * as Platform from "./platformSpecific.js"
import * as Utils from "./ui-utils.js"
import * as FlogoLang from "./flogo-language.js"
import * as Flowchart from "./ui-flowchart.js"
import * as Popups from "./ui-popup.js"
import * as History from "./ui-history.js"
import * as VariablesEditor from "./ui-variables.js"
import * as Console from "./ui-console.js"
import * as Turtle from "./ui-turtle.js"

export function runProgram() {
    Popups.close(true)
    VariablesEditor.disable()
    const state = FlogoLang.interpreter.getState()
    if (state === "stopped" || state === "crashed") {
        Console.reset()
        FlogoLang.clearTurtle()
    }
    VariablesEditor.cancelAllEdits()
    Flowchart.cancelSelection()
    FlogoLang.interpreter.run()
}

export function stopProgram() {
    Popups.close(true)
    VariablesEditor.enable()
    Console.disable()
    const state = FlogoLang.interpreter.getState()
    if (state === "running" || state === "paused") {
        FlogoLang.interpreter.stop()
    } else if (state === "stopped" || state === "crashed") {
        FlogoLang.resetVariables()
        Console.reset()
        FlogoLang.clearTurtle()
        Turtle.hide()
    }
}

export function pauseProgram() {
    if (FlogoLang.interpreter.getState() === "running") {
        FlogoLang.interpreter.pause()
    }
}

export function setProgramExecutionMode() {
    FlogoLang.interpreter.setExecutionMode(document.getElementById("executionMode").value)
}

setProgramExecutionMode()

function resetUI() {
    Flowchart.cancelSelection()
    VariablesEditor.init()
    Console.reset()
    FlogoLang.clearTurtle()
    Turtle.hide()
    History.clear()
    History.commit()
    Flowchart.update(true)
    if (!Platform.isElectron) {
        Platform.clipboard.clear()
    }
    Utils.updateWindowTitle()
}

export async function newProgram(triggeredFromKeyboardShortcut = false, force = false) {
    Popups.close(true)
    const realNewProgram = () => {
        const state = FlogoLang.interpreter.getState()
        if (state === "running" || state === "paused") {
            stopProgram()
        }
        FlogoLang.clearVariables()
        FlogoLang.clearProgram()
        FlogoLang.clearMetadata()
        resetUI()
    }
    if (force) {
        realNewProgram()
        return
    }
    if (Platform.isElectron) {
        flogoElectronAPI.newWindow()
    } else {
        if (History.isEmpty()) {
            realNewProgram()
        } else {
            if (await Popups.confirm("Erase program?", "All unsaved changes will be lost", triggeredFromKeyboardShortcut === true ? null : document.getElementById("newProgram"))) {
                realNewProgram()
            }
        }
    }
}

export function saveProgram(triggeredFromKeyboardShortcut = false) {
    Popups.close(true)
    const state = FlogoLang.interpreter.getState()
    if (state === "running" || state === "paused") {
        stopProgram()
    }
    VariablesEditor.cancelAllEdits()
    if (!Platform.isElectron) Popups.toast("Starting download")
    FlogoLang.download()
}

export async function loadProgram(triggeredFromKeyboardShortcut = false) {
    Popups.close(true)
    const realLoadProgram = async () => {
        const state = FlogoLang.interpreter.getState()
        if (state === "running" || state === "paused") {
            stopProgram()
        }
        try {
            const file = await Platform.loadBlob({
                name: "Flogo Program",
                extensions: ["flogo"]
            })
            if (file === null) return
            if (Platform.isElectron) {
                if (History.isEmpty()) {
                    Utils.startLoading()
                    const e = await FlogoLang.loadFromFile(file.blob)
                    if (e !== null) {
                        document.getElementById("loadError_details").innerText = e
                        Popups.show("loadError", true)
                    } else {
                        resetUI()
                        Popups.toast("Program loaded")
                    }
                    Utils.stopLoading()
                } else {
                    flogoElectronAPI.newWindow(file.path)
                }
            } else {
                Utils.startLoading()
                const e = await FlogoLang.loadFromFile(file)
                if (e !== null) {
                    document.getElementById("loadError_details").innerText = e
                    Popups.show("loadError", true)
                } else {
                    resetUI()
                    Popups.toast("Program loaded")
                }
                Utils.stopLoading()
            }
        } catch (e) {
            console.log(e)
            switch (e) {
                case "type":
                    e = "Not a Flogo program";
                    break
                case "open":
                    e = "Loading failed";
                    break
                default:
                    return
            }
            document.getElementById("loadError_details").innerText = e
            Popups.show("loadError", true)
        }

    }
    if (Platform.isElectron) {
        await realLoadProgram()
    } else {
        if (History.isEmpty()) {
            await realLoadProgram()
        } else {
            if (await Popups.confirm("Load another program?", "All unsaved changes will be lost", triggeredFromKeyboardShortcut === true ? null : document.getElementById("loadProgram"))) {
                await realLoadProgram()
            }
        }
    }
}

export async function shareProgram() {
    Popups.close(true)
    VariablesEditor.cancelAllEdits()
    const urlArea = document.getElementById("share_url")
    urlArea.onfocus = () => {
        Utils.selectContents(urlArea)
    }
    urlArea.innerText = ""
    Popups.show("share", true)
    const json = await FlogoLang.saveAsBase64()
    const url = Utils.getBaseURL() + "?program=" + encodeURIComponent(json)
    urlArea.innerText = url
    document.getElementById("share_copy").onclick = () => {
        navigator.clipboard.writeText(url)
        Popups.close(true)
        Popups.toast("Link copied")
    }
}

document.body.addEventListener("dragover", e => e.preventDefault())
document.body.addEventListener("drop", async e => {
    e.preventDefault()
    if (Utils.isLoading()) {
        return
    }
    Popups.close(true)
    const intState = FlogoLang.interpreter.getState()
    if (intState === "running" || intState === "paused") {
        stopProgram()
    }
    if (e.dataTransfer.items) {
        const loadDraggedProgram = async (f) => {
            Utils.startLoading()
            const e2 = await FlogoLang.loadFromFile(f)
            if (e2 !== null) {
                document.getElementById("loadError_details").innerText = e2
                Popups.show("loadError", true)
            } else {
                resetUI()
                Popups.toast("Program loaded")
            }
            Utils.stopLoading()
        }
        if (Platform.isElectron) {
            let first = true
            for (let i = 0; i < e.dataTransfer.items.length; i++) {
                const f = e.dataTransfer.items[i]
                if (f.kind !== "file") continue
                if (first && History.isEmpty()) {
                    loadDraggedProgram(f.getAsFile())
                } else {
                    flogoElectronAPI.newWindow(f.getAsFile())
                }
                first = false
            }
        } else {
            if (e.dataTransfer.items.length !== 1) return
            if (e.dataTransfer.items[0].kind !== "file") return
            const f = e.dataTransfer.items[0].getAsFile()
            if (History.isEmpty()) {
                loadDraggedProgram(f)
            } else {
                if (await Popups.confirm("Load another program?", "All unsaved changes will be lost", null)) {
                    loadDraggedProgram(f)
                }
            }
        }
    }
})

let pendingPWAFileOpenRequest = null,
    pendingSharedProgramRequest = null

async function pendingOpenRequestHandler() {
    if (Platform.isElectron) {
        const path = flogoElectronAPI.getPendingOpenFileRequest()
        if (path !== null) {
            Utils.startLoading()
            try {
                const blob = await flogoElectronAPI.readFile(path)
                try {
                    const e = await FlogoLang.loadFromFile(blob)
                    if (e !== null) {
                        document.getElementById("loadError_details").innerText = e
                        Popups.show("loadError", true)
                    } else {
                        resetUI()
                        Popups.toast("Program loaded")
                    }
                } catch (e) {}
            } catch (e) {
                switch (e) {
                    case "open":
                        document.getElementById("loadError_details").innerText = "Can't open file"
                        break
                    case "type":
                        document.getElementById("loadError_details").innerText = "Not a Flogo program"
                        break
                }
                Popups.show("loadError", true)
            }
            Utils.stopLoading()
        }
        requestAnimationFrame(pendingOpenRequestHandler)
    } else {
        if (pendingSharedProgramRequest !== null) {
            Utils.startLoading()
            try {
                const e = await FlogoLang.loadFromBase64(pendingSharedProgramRequest)
                if (e !== null) {
                    document.getElementById("loadError_details").innerText = "Broken link"
                    Popups.show("loadError", true)
                } else {
                    resetUI()
                    Popups.toast("Program loaded")
                }
            } catch (e) {}
            Utils.stopLoading()
            pendingSharedProgramRequest = null
        } else if (pendingPWAFileOpenRequest !== null) {
            Utils.startLoading()
            try {
                const e = await FlogoLang.loadFromFile(await pendingPWAFileOpenRequest.getFile())
                if (e !== null) {
                    document.getElementById("loadError_details").innerText = e
                    Popups.show("loadError", true)
                } else {
                    resetUI()
                    Popups.toast("Program loaded")
                }
            } catch (e) {}
            Utils.stopLoading()
            pendingPWAFileOpenRequest = null
        }
        requestAnimationFrame(pendingOpenRequestHandler)
    }
}

export async function init() {
    await newProgram(false, true)
    requestAnimationFrame(pendingOpenRequestHandler)
}

if (!Platform.isElectron) {
    //Redirect HTTP to HTTPS (except for localhost)
    if (location.hostname !== "localhost") {
        if (location.protocol === "http:") {
            location.href = "https" + location.href.substring(4)
        }
    }

    let inPWAMode = Platform.isPWAInstalled()
    const pwaSwitchHandler = () => { //Update window title to remove the "-Flogo" when the PWA is installed or when the user switches from web to PWA and viceversa
        requestAnimationFrame(pwaSwitchHandler)
        let inPWAModeNow = Platform.isPWAInstalled()
        if (inPWAMode !== inPWAModeNow) {
            Utils.updateWindowTitle()
            inPWAMode = inPWAModeNow
        }
    }
    pwaSwitchHandler()
    window.onbeforeunload = e => {
        if (History.isEmpty()) return
        e.preventDefault()
        e.returnValue = ""
    }
    document.addEventListener("contextmenu", e => {
        if (!(e.target.tagName === "TEXTAREA" || e.target.tagName === "INPUT" && e.target.type === "text" || e.target.contentEditable === "true")) {
            e.preventDefault()
        }
    })
    pendingSharedProgramRequest = new URL(window.location.href).searchParams.get("program")
    window.history.replaceState(null, "", Utils.getBaseURL())
    if ("launchQueue" in window) {
        window.launchQueue.setConsumer(launchParams => {
            if (launchParams.files && launchParams.files.length) {
                pendingPWAFileOpenRequest = launchParams.files[0]
            }
        })
    }
} else {
    document.addEventListener('click', e => {
        if (e.target.tagName === "A" && e.target.href.startsWith("http")) {
            e.preventDefault()
            flogoElectronAPI.openBrowser(e.target.href)
        }
    })
    window.electron_closeWindow = async () => {
        if (History.isEmpty()) {
            window.close()
        } else {
            if (await Popups.confirm("Close window?", "All unsaved changes will be lost", null)) {
                window.close()
            }
        }
    }
}
