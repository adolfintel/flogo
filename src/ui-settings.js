import * as FlogoLang from "./flogo-language.js"
import * as Platform from "./platformSpecific.js"
import * as Theming from "./ui-theming.js"
import * as Flowchart from "./ui-flowchart.js"
import * as Popups from "./ui-popup.js"
import * as Utils from "./ui-utils.js"
import * as VariablesEditor from "./ui-variables.js"
import * as Console from "./ui-console.js"
import * as Actions from "./ui-actions.js"
import * as FpsCounter from "./ui-fpsCounter.js"
import * as History from "./ui-history.js"
import * as BuildPackage from '~build/package'
import * as BuildGit from '~build/git'
import * as BuildTime from '~build/time'

export function show() {
    Popups.close()
    Flowchart.cancelSelection()
    const state = FlogoLang.interpreter.getState()
    if (state === "running" || state === "paused") {
        Actions.stopProgram()
    }
    selectTab("program_metadata")
    document.getElementById("metadata_title").value = FlogoLang.metadata.title
    document.getElementById("metadata_author").value = FlogoLang.metadata.author
    if (Theming.hasPreferredTheme()) {
        document.getElementById("style_theme_select").value = Theming.getCurrentTheme()
    } else {
        document.getElementById("style_theme_select").value = "default_auto"
    }
    document.getElementById("settings_fps").checked = FpsCounter.isVisible()
    document.getElementById("settings_altTurboTSlice").checked = FlogoLang.interpreter.getAltTurboTSlice()
    document.getElementById("settings_unlimitedConsole").checked = Console.isUnlimited()
    document.getElementById("settings_unlimitedTurtle").checked = FlogoLang.interpreter.uiBridge.turtle_maxPoints === 0
    document.getElementById("settings_unlimitedArrayView").checked = VariablesEditor.getUnlimitedArrayView()
    document.getElementById("settings_disableCulling").checked = !Flowchart.isCullingEnabled()
    document.getElementById("versionNumber").innerText = BuildPackage.version
    const devBuildInfo = document.getElementById("devBuildInfo")
    try {
        if (BuildGit.branch !== "master") {
            devBuildInfo.innerText = "Development build (" + BuildGit.branch + " " + BuildGit.abbreviatedSha + " " + BuildTime.default.toISOString() + ")"
            devBuildInfo.style.display = "block"
        } else {
            devBuildInfo.style.display = ""
        }
    } catch (e) {
        devBuildInfo.innerText = "Development build (local)"
        devBuildInfo.style.display = "block"
    }
    const badge = document.getElementById("versionTypeBadge")
    if (Platform.isElectron) {
        badge.innerText = "Electron " + flogoElectronAPI.getElectronVersion()
        badge.style.background = "#9feaf9"
        badge.style.color = "#2b2e3a"
    } else {
        if (Platform.isPWAInstalled()) {
            badge.innerText = "PWA"
            badge.style.background = "#5a0ec9"
            badge.style.color = "#ffffff"
        } else {
            badge.innerText = "Web"
            badge.style.background = "#f1582f"
            badge.style.color = "#ffffff"
        }
    }
    if (!Platform.isElectron && location.protocol !== "https:") {
        document.getElementById("export_format_svg").disabled = true
    }
    Popups.show("settings", true)
}

function selectTab(id) {
    document.querySelectorAll("div.settings_tab").forEach(e => e.classList.remove("selected"))
    document.querySelectorAll("#settings_tabSelector > div").forEach(e => e.classList.remove("selected"))
    document.getElementById(id).classList.add("selected")
    document.querySelectorAll("#settings_tabSelector > div[for=" + id + "]").forEach(e => e.classList.add("selected"))
}

document.querySelectorAll("#settings div[settings_selectTab]").forEach(a => a.onclick = () => {
    selectTab(a.getAttribute("settings_selectTab"))
})

document.getElementById("settings_updateMetadata").onclick = () => {
    const title = document.getElementById("metadata_title").value.trim(),
        author = document.getElementById("metadata_author").value.trim()
    if (title !== FlogoLang.metadata.title || author !== FlogoLang.metadata.author) {
        FlogoLang.metadata.title = document.getElementById("metadata_title").value.trim()
        FlogoLang.metadata.author = document.getElementById("metadata_author").value.trim()
        History.commit()
        Utils.updateWindowTitle()
    }
    Popups.close(true)
}

document.getElementById("style_theme_select").onchange = () => {
    const newTheme = document.getElementById("style_theme_select").value
    if (newTheme === "default_auto") {
        Theming.deletePreferredTheme()
    } else {
        Theming.loadTheme(newTheme)
    }
}

document.getElementById("settings_fps").onchange = () => {
    const val = document.getElementById("settings_fps").checked
    Platform.storage.showFps = val
    FpsCounter.setVisible(val)
}

document.getElementById("settings_altTurboTSlice").onchange = () => {
    const val = document.getElementById("settings_altTurboTSlice").checked
    Platform.storage.altTurboTSlice = val
    FlogoLang.interpreter.setAltTurboTSlice(val)
}

document.getElementById("settings_unlimitedConsole").onchange = () => {
    const val = document.getElementById("settings_unlimitedConsole").checked
    Platform.storage.unlimitedConsole = val
    Console.setUnlimited(val)
}

document.getElementById("settings_unlimitedTurtle").onchange = () => {
    const val = document.getElementById("settings_unlimitedTurtle").checked
    Platform.storage.unlimitedTurtle = val
    if (val) {
        FlogoLang.interpreter.uiBridge.turtle_maxPoints = 0
    } else {
        FlogoLang.interpreter.uiBridge.turtle_maxPoints = 10000
    }
}

document.getElementById("settings_unlimitedArrayView").onchange = () => {
    const val = document.getElementById("settings_unlimitedArrayView").checked
    Platform.storage.unlimitedArrayView = val
    VariablesEditor.setUnlimitedArrayView(val)
}

document.getElementById("settings_disableCulling").onchange = () => {
    const val = document.getElementById("settings_disableCulling").checked
    Platform.storage.disableCulling = val
    Flowchart.setCulling(!val)
}

document.getElementById("settings_export_button").onclick = () => {
    switch (document.getElementById("export_format").value) {
        case "svg":
            Flowchart.downloadSVG(undefined, document.getElementById("export_background").checked)
            break
        case "png":
            Flowchart.downloadPNG(undefined, document.getElementById("export_background").checked)
            break
    }
}

document.getElementById("showLicense").onclick = () => {
    document.getElementById("licenseViewer").classList.add("visible")
}

document.getElementById("license_close").onclick = () => {
    document.getElementById("licenseViewer").classList.remove("visible")
}

let heartClickCounter = 0,
    heartLastClickT = 0
document.getElementById("about_heart").onclick = () => {
    const t = Date.now()
    if (t - heartLastClickT > 500) {
        heartClickCounter = 1
    } else {
        heartClickCounter++
    }
    heartLastClickT = t
    if (heartClickCounter === 7) {
        heartClickCounter = 0
        heartLastClickT = 0
        Popups.close(true)
        let json = FlogoLang.save(false)
        json = JSON.parse(json)
        json.metadata.created = new Date(json.metadata.created).toString()
        json.metadata.modified = json.metadata.modified.map(d => [new Date(d[0]).toString(), d[1]])
        json = JSON.stringify(json, null, 2)
        document.getElementById("jsonViewer_text").value = json
        Popups.show("jsonViewer", true)
    }
}

if (typeof Platform.storage.altTurboTSlice !== "undefined") {
    FlogoLang.interpreter.setAltTurboTSlice(Platform.storage.altTurboTSlice === "true")
}
if (typeof Platform.storage.unlimitedConsole !== "undefined") {
    Console.setUnlimited(Platform.storage.unlimitedConsole === "true")
}
if (typeof Platform.storage.unlimitedTurtle !== "undefined") {
    if (Platform.storage.unlimitedTurtle === "true") FlogoLang.interpreter.uiBridge.turtle_maxPoints = 0
}
if (typeof Platform.storage.unlimitedArrayView !== "undefined") {
    VariablesEditor.setUnlimitedArrayView(Platform.storage.unlimitedArrayView === "true")
}
if (typeof Platform.storage.disableCulling !== "undefined") {
    Flowchart.setCulling(Platform.storage.disableCulling === "false")
}
if (typeof Platform.storage.showFps !== "undefined") {
    FpsCounter.setVisible(Platform.storage.showFps === "true")
}
