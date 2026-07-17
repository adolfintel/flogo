import * as Platform from './platformSpecific.js'
import * as Utils from "./ui-utils.js"
import * as Flowchart from "./ui-flowchart.js"
import * as FlogoLang from "./flogo-language.js"
import * as Popups from "./ui-popup.js"
import * as FlowchartInsert from "./ui-flowchart-insert.js"
import * as FlowchartEdit from "./ui-flowchart-edit.js"
import * as TopBar from "./ui-topBar.js"

export let ASSIGN_COLOR1,
    ASSIGN_COLOR2,
    ASSIGN_COLOR3,
    OUTPUT_COLOR1,
    OUTPUT_COLOR2,
    OUTPUT_COLOR3,
    INPUT_COLOR1,
    INPUT_COLOR2,
    INPUT_COLOR3,
    IF_COLOR1,
    IF_COLOR2,
    IF_COLOR3,
    DOWHILE_COLOR1,
    DOWHILE_COLOR2,
    DOWHILE_COLOR3,
    WHILE_COLOR1,
    WHILE_COLOR2,
    WHILE_COLOR3,
    FOR_COLOR1,
    FOR_COLOR2,
    FOR_COLOR3,
    BREAKPOINT_COLOR1,
    BREAKPOINT_COLOR2,
    BREAKPOINT_COLOR3,
    COMMENT_COLOR1,
    COMMENT_COLOR2,
    COMMENT_COLOR3,
    COMMENT_DASH_LENGTH,
    TURTLE_MOVE_COLOR1,
    TURTLE_MOVE_COLOR2,
    TURTLE_MOVE_COLOR3,
    TURTLE_TURN_COLOR1,
    TURTLE_TURN_COLOR2,
    TURTLE_TURN_COLOR3,
    TURTLE_HOME_COLOR1,
    TURTLE_HOME_COLOR2,
    TURTLE_HOME_COLOR3,
    TURTLE_PALETTE,
    ERROR_COLOR1,
    ERROR_COLOR2,
    ERROR_COLOR3,
    ROUND_COLOR1,
    ROUND_COLOR2,
    ROUND_COLOR3,
    BLOCK_OUTLINE_THICKNESS,
    HIGHLIGHT_COLOR1,
    HIGHLIGHT_COLOR2,
    HIGHLIGHT_COLOR3,
    FLOWCHART_FONT,
    BLOCK_FONT_SIZE,
    LINE_THICKNESS,
    LINE_ARROW_SIZE,
    LINE_COLOR,
    LINE_FONT_SIZE,
    LINE_SELECTED_COLOR,
    SELECTED_COLOR1,
    SELECTED_COLOR2,
    SELECTED_COLOR3,
    PADDING_BASE,
    SPACE_BETWEEN_INSTRUCTIONS,
    BLOCK_TEXT_MAX_WIDTH,
    BLOCK_TEXT_WRAP_MODE,
    COMMENT_TEXT_MAX_WIDTH,
    ROUND_MIN_WIDTH,
    LINE_HITBOX_EXTRA,
    COMMENT_TEXT_MAX_LENGTH,
    SCROLLBAR_THICKNESS,
    SCROLLBAR_COLOR,
    SCROLLBAR_PADDING,
    INSERT_FONT,
    INSERT_FONT_SIZE,
    INSERT_TEXT_COLOR,
    WIDE_INSERT_SPACE_BELOW_LABEL,
    WIDE_INSERT_SPACE_BETWEEN_COLUMNS,
    WIDE_INSERT_SPACE_BETWEEN_INSTRUCTIONS,
    TALL_INSERT_SPACE_BELOW_LABEL,
    TALL_INSERT_SPACE_BELOW_ROW,
    TALL_INSERT_SPACE_BETWEEN_INSTRUCTIONS,
    CRASH_SPACE_FROM_INSTRUCTION

let initialized = false
let currentTheme

export async function loadTheme(name, saveToStorage = true) {
    let t = document.getElementById("theme")
    currentTheme = name
    const newTheme = "themes/" + name + ".css"
    if (t !== null && t.href.endsWith(newTheme)) {
        Utils.stopLoading()
        return
    }
    Flowchart.cancelSelection()
    Popups.close()
    Utils.startLoading()
    //the link element needs to be recreated for the onload event to trigger again (chromium)
    if (t !== null) document.head.removeChild(t)
    t = document.createElement("link")
    t.id = "theme"
    t.rel = "stylesheet"
    t.type = "text/css"
    t.href = newTheme
    try {
        await new Promise((resolve, reject) => {
            t.onload = resolve
            t.onerror = reject
            document.head.appendChild(t)
        })
    } catch (e) {
        await loadTheme(getDefaultTheme(), false)
        return
    }
    INSERT_FONT = Utils.getCSSVal("font-family", "")
    INSERT_FONT_SIZE = Number(Utils.getCSSVal("--insert-Font-size", 14))
    INSERT_TEXT_COLOR = Utils.getCSSVal("--insert-Text-color", "#ffffff")
    WIDE_INSERT_SPACE_BETWEEN_COLUMNS = Number(Utils.getCSSVal("--insert-Wide-Padding-betweenColumns", 18))
    WIDE_INSERT_SPACE_BELOW_LABEL = Number(Utils.getCSSVal("--insert-Wide-Padding-belowLabel", 20))
    WIDE_INSERT_SPACE_BETWEEN_INSTRUCTIONS = Number(Utils.getCSSVal("--insert-Wide-Padding-spaceBetweenInstructions", 20))
    TALL_INSERT_SPACE_BELOW_LABEL = Number(Utils.getCSSVal("--insert-Tall-Padding-belowLabel", 10))
    TALL_INSERT_SPACE_BELOW_ROW = Number(Utils.getCSSVal("--insert-Tall-Padding-belowRow", 20))
    TALL_INSERT_SPACE_BETWEEN_INSTRUCTIONS = Number(Utils.getCSSVal("--insert-Tall-Padding-spaceBetweenInstructions", 20))
    CRASH_SPACE_FROM_INSTRUCTION = Number(Utils.getCSSVal("--crash-Padding-spaceFromInstruction", 10))
    document.querySelector('meta[name="theme-color"]').setAttribute("content", Utils.getCSSVal("--browser-theme-color", "#000000"))
    TURTLE_PALETTE = []
    let i = 0
    while (true) {
        const nextColor = Utils.getCSSVal("--turtle-color-foreground-" + i, null)
        if (nextColor === null) {
            break
        }
        TURTLE_PALETTE.push(nextColor)
        i++
    }
    if (TURTLE_PALETTE.length === 0) {
        TURTLE_PALETTE = ["#000000"];
    }
    FlogoLang.setTurtleColors(
        Utils.getCSSVal("--turtle-color-cursor", "#00a000"),
        Utils.getCSSVal("--turtle-color-background", "#ffffff"),
        TURTLE_PALETTE
    )
    if (saveToStorage) {
        Platform.storage.theme = name
    }
    TopBar.refresh()
    ASSIGN_COLOR1 = Utils.getCSSVal("--flowchart-Assign-color1", "#696a30")
    ASSIGN_COLOR2 = Utils.getCSSVal("--flowchart-Assign-color2", "#84853d")
    ASSIGN_COLOR3 = Utils.getCSSVal("--flowchart-Assign-color3", "#ffffff")
    OUTPUT_COLOR1 = Utils.getCSSVal("--flowchart-Output-color1", "#3f7335")
    OUTPUT_COLOR2 = Utils.getCSSVal("--flowchart-Output-color2", "#509243")
    OUTPUT_COLOR3 = Utils.getCSSVal("--flowchart-Output-color3", "#ffffff")
    INPUT_COLOR1 = Utils.getCSSVal("--flowchart-Input-color1", "#305c6a")
    INPUT_COLOR2 = Utils.getCSSVal("--flowchart-Input-color2", "#3d7585")
    INPUT_COLOR3 = Utils.getCSSVal("--flowchart-Input-color3", "#ffffff")
    IF_COLOR1 = Utils.getCSSVal("--flowchart-If-color1", "#783753")
    IF_COLOR2 = Utils.getCSSVal("--flowchart-If-color2", "#924365")
    IF_COLOR3 = Utils.getCSSVal("--flowchart-If-color3", "#ffffff")
    DOWHILE_COLOR1 = Utils.getCSSVal("--flowchart-DoWhile-color1", "#326d4f")
    DOWHILE_COLOR2 = Utils.getCSSVal("--flowchart-DoWhile-color2", "#3e8762")
    DOWHILE_COLOR3 = Utils.getCSSVal("--flowchart-DoWhile-color3", "#ffffff")
    WHILE_COLOR1 = Utils.getCSSVal("--flowchart-While-color1", "#326d4f")
    WHILE_COLOR2 = Utils.getCSSVal("--flowchart-While-color2", "#3e8762")
    WHILE_COLOR3 = Utils.getCSSVal("--flowchart-While-color3", "#ffffff")
    FOR_COLOR1 = Utils.getCSSVal("--flowchart-For-color1", "#326d4f")
    FOR_COLOR2 = Utils.getCSSVal("--flowchart-For-color2", "#3e8762")
    FOR_COLOR3 = Utils.getCSSVal("--flowchart-For-color3", "#ffffff")
    BREAKPOINT_COLOR1 = Utils.getCSSVal("--flowchart-Breakpoint-color1", "#9a5758")
    BREAKPOINT_COLOR2 = Utils.getCSSVal("--flowchart-Breakpoint-color2", "#bd6b6c")
    BREAKPOINT_COLOR3 = Utils.getCSSVal("--flowchart-Breakpoint-color3", "#ffffff")
    COMMENT_COLOR1 = Utils.getCSSVal("--flowchart-Comment-color1", null)
    COMMENT_COLOR2 = Utils.getCSSVal("--flowchart-Comment-color2", "#cccccc")
    COMMENT_COLOR3 = Utils.getCSSVal("--flowchart-Comment-color3", "#ffffff")
    COMMENT_DASH_LENGTH = Number(Utils.getCSSVal("--flowchart-Comment-dashLength", 10))
    TURTLE_MOVE_COLOR1 = Utils.getCSSVal("--flowchart-Turtle-Move-color1", "#3b4f78")
    TURTLE_MOVE_COLOR2 = Utils.getCSSVal("--flowchart-Turtle-Move-color2", "#5d7ebd")
    TURTLE_MOVE_COLOR3 = Utils.getCSSVal("--flowchart-Turtle-Move-color3", "#ffffff")
    TURTLE_TURN_COLOR1 = Utils.getCSSVal("--flowchart-Turtle-Turn-color1", "#593b78")
    TURTLE_TURN_COLOR2 = Utils.getCSSVal("--flowchart-Turtle-Turn-color2", "#8d5dbd")
    TURTLE_TURN_COLOR3 = Utils.getCSSVal("--flowchart-Turtle-Turn-color3", "#ffffff")
    TURTLE_HOME_COLOR1 = Utils.getCSSVal("--flowchart-Turtle-Home-color1", "#593b78")
    TURTLE_HOME_COLOR2 = Utils.getCSSVal("--flowchart-Turtle-Home-color2", "#8d5dbd")
    TURTLE_HOME_COLOR3 = Utils.getCSSVal("--flowchart-Turtle-Home-color3", "#ffffff")
    ERROR_COLOR1 = Utils.getCSSVal("--flowchart-Error-color1", "#000000")
    ERROR_COLOR2 = Utils.getCSSVal("--flowchart-Error-color2", "#c00000")
    ERROR_COLOR3 = Utils.getCSSVal("--flowchart-Error-color3", "#ffffff")
    ROUND_COLOR1 = Utils.getCSSVal("--flowchart-Round-color1", "#4c45a5")
    ROUND_COLOR2 = Utils.getCSSVal("--flowchart-Round-color2", "#3d3886")
    ROUND_COLOR3 = Utils.getCSSVal("--flowchart-Round-color3", "#ffffff")
    BLOCK_OUTLINE_THICKNESS = Number(Utils.getCSSVal("--flowchart-Block-outline-thickness", 2))
    HIGHLIGHT_COLOR1 = Utils.getCSSVal("--flowchart-Block-highlight-color1", "keep")
    HIGHLIGHT_COLOR2 = Utils.getCSSVal("--flowchart-Block-highlight-color2", "#ffffff")
    HIGHLIGHT_COLOR3 = Utils.getCSSVal("--flowchart-Block-highlight-color3", "keep")
    FLOWCHART_FONT = Utils.getCSSVal("--flowchart-Font-family", "monospace")
    BLOCK_FONT_SIZE = Number(Utils.getCSSVal("--flowchart-Block-font-size", 12))
    LINE_THICKNESS = Number(Utils.getCSSVal("--flowchart-Line-thickness", 2))
    LINE_ARROW_SIZE = Number(Utils.getCSSVal("--flowchart-Line-arrow-size", 4))
    LINE_HITBOX_EXTRA = LINE_ARROW_SIZE + 6
    LINE_FONT_SIZE = Number(Utils.getCSSVal("--flowchart-Line-font-size", 10))
    LINE_COLOR = Utils.getCSSVal("--flowchart-Line-color", "#ffffff")
    LINE_SELECTED_COLOR = Utils.getCSSVal("--flowchart-Line-selected-color", "#ff0000")
    SELECTED_COLOR1 = Utils.getCSSVal("--flowchart-selected-color1", "#ffffff")
    SELECTED_COLOR2 = Utils.getCSSVal("--flowchart-selected-color2", "#1330b0")
    SELECTED_COLOR3 = Utils.getCSSVal("--flowchart-selected-color3", "#ffffff")
    PADDING_BASE = Number(Utils.getCSSVal("--flowchart-Padding-base", 10))
    SPACE_BETWEEN_INSTRUCTIONS = Number(Utils.getCSSVal("--flowchart-Padding-spaceBetweenInstructions", 24))
    BLOCK_TEXT_MAX_WIDTH = Number(Utils.getCSSVal("--flowchart-Block-text-maxWidth", 40))
    BLOCK_TEXT_WRAP_MODE = Utils.getCSSVal("--flowchart-Block-wrapMode", "new")
    COMMENT_TEXT_MAX_WIDTH = Number(Utils.getCSSVal("--flowchart-Comment-text-maxWidth", 60))
    ROUND_MIN_WIDTH = Number(Utils.getCSSVal("--flowchart-Round-text-minWidth", 7)) * BLOCK_FONT_SIZE
    COMMENT_TEXT_MAX_LENGTH = Number(Utils.getCSSVal("--flowchart-Comment-text-maxLength", 250))
    SCROLLBAR_THICKNESS = Number(Utils.getCSSVal("--flowchart-scrollbar-thickness", 6))
    SCROLLBAR_PADDING = Number(Utils.getCSSVal("--flowchart-scrollbar-padding", 4))
    SCROLLBAR_COLOR = Utils.getCSSVal("--flowchart-scrollbar-color", "#ffffff60")
    await Utils.waitForFonts([FLOWCHART_FONT, INSERT_FONT])
    Flowchart.update(true)
    FlowchartInsert.init()
    FlowchartEdit.init()
    if (!initialized) {
        window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", () => {
            loadTheme(getPreferredTheme(), false)
        })
        initialized = true
    }
    Utils.stopLoading()
}

export function getDefaultTheme() {
    if (window.matchMedia("(prefers-color-scheme: dark)").matches) {
        return "default_dark"
    } else {
        return "default_light"
    }
}

export function getCurrentTheme() {
    if (typeof currentTheme !== "undefined") {
        return currentTheme
    } else {
        return getDefaultTheme()
    }
}

export function getPreferredTheme() {
    if (typeof Platform.storage.theme !== "undefined") {
        return Platform.storage.theme
    } else {
        return getDefaultTheme()
    }
}

export function hasPreferredTheme() {
    return typeof Platform.storage.theme !== "undefined"
}

export function deletePreferredTheme() {
    delete Platform.storage.theme
    loadTheme(getPreferredTheme(), false)
}
