import * as FlogoLang from "./flogo-language.js"
import * as Platform from "./platformSpecific.js"

export function getCSSVal(name, defaultValue, element = document.body) {
    const v = getComputedStyle(element).getPropertyValue(name)
    if (v !== "") {
        return v
    } else {
        return defaultValue
    }
}

export async function waitForFonts(list) {
    for (let i = 0; i < list.length; i++) {
        let name = list[i]
        if (!(name.startsWith("'") && name.endsWith("'") || name.startsWith('"') && name.endsWith('"'))) {
            name = '"' + name + '"'
        }
        name = "1rem " + name
        await document.fonts.load(name, "a")
    }
}

export function extractCoordFromEvent(evt, name, defaultVal = 0) {
    if (typeof evt[name] !== "undefined") return evt[name]
    if (typeof evt.changedTouches !== "undefined") {
        if (evt.changedTouches.length > 0) {
            return evt.changedTouches[0][name]
        }
    }
    if (typeof evt.touches !== "undefined") {
        if (evt.touches.length > 0) {
            return evt.touches[0][name]
        }
    }
    return defaultVal
}

export function disableSpellcheck(element) {
    element.setAttribute("autocomplete", "off")
    element.setAttribute("autocorrect", "off")
    element.setAttribute("autocapitalize", "off")
    element.setAttribute("spellcheck", "false")
}

export function makeIcon(name) {
    const s = document.createElement("span")
    s.className = "icon material-icons-sharp"
    s.innerText = name
    return s
}

export function errorFlash(element, focusOnAnimationEnd) {
    element.style.animation = "errorFlash 0.3s"
    element.onanimationend = () => {
        element.style.animation = ""
        if (typeof focusOnAnimationEnd !== "undefined") {
            focusOnAnimationEnd.focus()
        } else {
            element.focus()
        }
    }
}

export function selectContents(element) {
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

export function updateWindowTitle() {
    if (Platform.isPWAInstalled()) {
        if (FlogoLang.metadata.title.trim() !== "") {
            document.title = FlogoLang.metadata.title
        } else {
            document.title = "Untitled"
        }
    } else {
        if (FlogoLang.metadata.title.trim() !== "") {
            document.title = FlogoLang.metadata.title + " – Flogo"
        } else {
            document.title = "Untitled – Flogo"
        }
    }
}

export function startLoading() {
    if (Platform.isPWAInstalled()) {
        document.title = "Loading"
    } else {
        document.title = "Flogo"
    }
    document.getElementById("loadOverlay").style.display = "block"
}

export function stopLoading() {
    updateWindowTitle()
    document.getElementById("loadOverlay").style.display = "none"
}

export function isLoading() {
    return document.getElementById("loadOverlay").style.display !== "none"
}

export function getBaseURL() {
    let r
    if (Platform.isElectron) {
        r = "https://flogo.fdossena.com/"
    } else {
        r = location.origin + location.pathname
    }
    if (!r.endsWith("/")) {
        r += "/"
    }
    return r
}
