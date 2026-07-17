import * as FlogoLang from "./flogo-language.js"
import * as Windowing from "./ui-windowing.js"
import * as Popups from "./ui-popup.js"

FlogoLang.interpreter.uiBridge.turtle_containerId = "turtle_canvas"

export function show() {
    Windowing.show(document.getElementById("turtleArea"))
}

export function hide() {
    Windowing.hide(document.getElementById("turtleArea"))
}

FlogoLang.interpreter.uiBridge.turtle_show = show

function openMenu() {
    const bBounds = document.getElementById("turtle_openMenu").getBoundingClientRect()
    const menu = document.getElementById("turtleMenu")
    Popups.show(menu)
    const bounds = menu.getBoundingClientRect()
    menu.style.top = bBounds.y + "px"
    menu.style.left = (bBounds.left + bBounds.width - bounds.width) + "px"
    if (FlogoLang.isTurtleCursorVisible()) {
        document.getElementById("turtleMenu_hideCursor").style.display = ""
        document.getElementById("turtleMenu_showCursor").style.display = "none"
    } else {
        document.getElementById("turtleMenu_hideCursor").style.display = "none"
        document.getElementById("turtleMenu_showCursor").style.display = ""
    }
}

function savePNG() {
    FlogoLang.downloadTurtleImage()
    Popups.close()
}

function hideCursor() {
    FlogoLang.hideTurtleCursor()
    Popups.close()
}

function showCursor() {
    FlogoLang.showTurtleCursor()
    Popups.close()
}

Windowing.create(document.getElementById("turtleArea"), true)

document.getElementById("turtle_openMenu").onclick = openMenu
document.getElementById("turtle_hide").onclick = hide
document.getElementById("turtleMenu_savePNG").onclick = savePNG
document.getElementById("turtleMenu_hideCursor").onclick = hideCursor
document.getElementById("turtleMenu_showCursor").onclick = showCursor
