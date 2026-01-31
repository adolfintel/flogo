import * as FlogoLang from "./flogo-language.js"
import * as Utils from "./ui-utils.js"

FlogoLang.interpreter.uiBridge.input = (variable, type, callback) => {
    const input = document.getElementById("input")
    const btn = document.getElementById("input_send")
    if (!document.getElementById("consoleArea").classList.contains("expanded")) {
        toggleConsoleArea()
    }
    enable()
    input.focus()
    btn.onclick = () => {
        let val = input.value
        switch (type) {
            case "integer":
            case "real": {
                val = val.trim()
                if (val === "" || isNaN(val)) {
                    Utils.errorFlash(input)
                    return
                }
            }
            break
            case "boolean": {
                val = val.trim()
                if (val !== "true" && val !== "false") {
                    Utils.errorFlash(input)
                    return
                }
            }
            break
        }
        const text = val
        disable()
        input.value = ""
        const d = document.createElement("div")
        d.className = "message input"
        d.innerText = text
        document.getElementById("log").prepend(d)
        if (LOG_MAX_MESSAGES > 0) limitMessages()
        callback(text)
    }
}

document.getElementById("input").onkeydown = e => {
    if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault()
        document.getElementById("input_send").click()
    }
}

FlogoLang.interpreter.uiBridge.output = (text, newLine) => {
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
    if (LOG_MAX_MESSAGES > 0) limitMessages()
    if (!document.getElementById("consoleArea").classList.contains("expanded")) {
        toggleConsoleArea()
    }
}

let LOG_MAX_MESSAGES = 1000

export function setUnlimited(v) {
    if (v === true) {
        LOG_MAX_MESSAGES = 0
    } else {
        LOG_MAX_MESSAGES = 1000
    }
}

export function isUnlimited() {
    return LOG_MAX_MESSAGES === 0
}

function limitMessages() {
    const log = document.getElementById("log")
    while (log.children.length > LOG_MAX_MESSAGES) {
        log.removeChild(log.lastChild)
    }
}

export function addNotice(text) {
    const d = document.createElement("div")
    d.className = "notice"
    d.innerText = text
    document.getElementById("log").prepend(d)
}

export function disable() {
    document.getElementById("input").disabled = true
    document.getElementById("input_send").disabled = true
}

export function enable() {
    document.getElementById("input").disabled = false
    document.getElementById("input_send").disabled = false
}

export function reset() {
    document.getElementById("log").innerHTML = ""
    const input = document.getElementById("input")
    input.value = ""
    disable()
}

function save() {
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
    const blob = new Blob([out], {
        type: "text/plain",
    })
    const a = document.createElement("a")
    a.href = URL.createObjectURL(blob)
    a.download = "Flogo Output.txt"
    a.click()
}

function toggleConsoleArea() {
    const ca = document.getElementById("consoleArea")
    ca.classList.toggle("expanded")
    document.getElementById("flowchartArea").classList.toggle("consoleExpanded")
    ca.flogo_toggledAt = Date.now() //used by autoLayout in ui-theming
}

document.getElementById("console_save").onclick = save
document.getElementById("consoleExpander").onclick = toggleConsoleArea
document.getElementById("consoleExpander").ontouchstart = toggleConsoleArea
