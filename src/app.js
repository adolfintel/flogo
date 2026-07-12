import "./style.css"
import '@material-design-icons/font/sharp.css'
import * as Theming from "./ui-theming.js"
import * as Flowchart from "./ui-flowchart.js"
import * as Popups from "./ui-popup.js"
import * as History from "./ui-history.js"
import * as FlowchartInsert from "./ui-flowchart-insert.js"
import * as FlowchartEdit from "./ui-flowchart-edit.js"
import * as VariablesEditor from "./ui-variables.js"
import * as Console from "./ui-console.js"
import * as ProgramEvents from "./ui-programEvents.js"
import * as Turtle from "./ui-turtle.js"
import * as Actions from "./ui-actions.js"
import * as FpsCounter from "./ui-fpsCounter.js"
import * as TopBar from "./ui-topBar.js"
import * as Settings from "./ui-settings.js"
import * as KeyboardShortcuts from "./ui-keyboardShortcuts.js"
import * as Manual from "./ui-manual.js"

window.addEventListener("load", async () => {
    await document.fonts.ready
    Flowchart.init()
    await Theming.loadTheme(Theming.getPreferredTheme(), false)
    Actions.init()
    KeyboardShortcuts.init()
    Manual.init()
})

//TODO: reimplement crash screen and program recovery
