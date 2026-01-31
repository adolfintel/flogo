import * as FlogoLang from "./flogo-language.js"
import * as Flowchart from "./ui-flowchart.js"
import * as Popups from "./ui-popup.js"
import * as VariablesEditor from "./ui-variables.js"
import * as Console from "./ui-console.js"
import * as Utils from "./ui-utils.js"
import * as Theming from "./ui-theming.js"

FlogoLang.interpreter.uiBridge.onProgramCrash = e => {
    const c = document.getElementById("crash")
    document.getElementById("crash_details").innerText = e
    c.style.top = 0
    c.style.left = 0
    Popups.show(c, true)
    const cBounds = c.getBoundingClientRect()
    const wBounds = {
        width: window.innerWidth,
        height: window.innerHeight
    } /*document.body.getBoundingClientRect()*/ //workaround: chromium-based browsers sometimes report incorrect size on mobile with getBoundingClientRect
    const fcBounds = document.getElementById("flowchartArea").getBoundingClientRect()
    Flowchart.ensureInstructionVisibleInFlowchart(FlogoLang.interpreter.currentInstruction)
    const instr = FlogoLang.interpreter.currentInstruction.drawable.flogo_highlightable
    const instrPos = instr.absolutePosition()
    let x = instrPos.x + (instr.width() * Flowchart.getZoom()) / 2 + fcBounds.x - cBounds.width / 2
    let y = instrPos.y + instr.height() * Flowchart.getZoom() + fcBounds.y + Theming.CRASH_SPACE_FROM_INSTRUCTION
    if (x < 0) x = 0
    if (x + cBounds.width > wBounds.width) {
        x = wBounds.width - cBounds.width + fcBounds.x
    }
    if (y + cBounds.height > wBounds.height) {
        y = instrPos.y - cBounds.height + fcBounds.y - Theming.CRASH_SPACE_FROM_INSTRUCTION
    }
    c.style.left = x + "px"
    c.style.top = y + "px"
    Console.disable()
    Console.addNotice("Program crashed")
    VariablesEditor.enable()
}

FlogoLang.interpreter.uiBridge.onProgramEnd = () => {
    Console.disable()
    Console.addNotice("Program finished")
    VariablesEditor.enable()
    Flowchart.centerCameraOnProgramEnd()
}
