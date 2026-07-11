import {
    app,
    BrowserWindow,
    dialog,
    ipcMain,
    screen,
    Menu,
    shell
} from "electron"
import contextMenu from "electron-context-menu"
import Store from "electron-store"
import {
    fileURLToPath
} from "url"
import path from "path"
import fs from "fs"
import {
    Buffer
} from "buffer"

function getDefaultZoom() {
    const z = store.get("defaultZoom")
    if (typeof z === "undefined") {
        return 1
    } else {
        return z
    }
}

function saveDefaultZoom(z) {
    store.set("defaultZoom", z)
}

const isMac = process.platform === "darwin"

const store = new Store()
ipcMain.on("electron-store-get", (event, key) => {
    const value = store.get(key)
    event.returnValue = value
})
ipcMain.on("electron-store-set", (event, key, value) => {
    store.set(key, value)
    event.returnValue = "success"
})
ipcMain.on("electron-store-delete", (event, key) => {
    const value = store.delete(key)
    event.returnValue = "success"
})

let clipboard = null
ipcMain.on("clipboard-read", (event) => {
    event.returnValue = clipboard
})
ipcMain.on("clipboard-write", (event, value) => {
    clipboard = value
    event.returnValue = "success"
})
ipcMain.on("clipboard-empty", (event) => {
    event.returnValue = clipboard === null
})
ipcMain.on("clipboard-clear", (event) => {
    clipboard = null
    event.returnValue = "success"
})

ipcMain.on("new-window", (event, path) => {
    const zoom = event.sender.getZoomFactor()
    createWindow(path, zoom)
    event.returnValue = "success"
})

ipcMain.on("open-browser", (event, url) => {
    shell.openExternal(url)
    event.returnValue = "success"
})

ipcMain.handle("read-file-blob", (event, fileType) => {
    let filters = []
    if (typeof fileType !== "undefined") {
        filters.push(fileType)
    }
    filters.push({
        name: "All files",
        extensions: ["*"]
    })
    let path = dialog.showOpenDialogSync(BrowserWindow.getFocusedWindow(), {
        filters: filters,
        multiSelections: false
    })
    if (typeof path === "undefined") return "cancel"
    path = path[0]
    /*
     * Files are only opened if they have the magic string "flogo1" at the beginning
     *
     * Returns "open" if the file can't be opened or if something went wrong while reading it, "type" if it doesn't have the flogo1 string, "cancel" if the user cancelled the dialog, otherwise it returns an object {buffer:...base64...}
     */
    try {
        const info = fs.statSync(path)
        if (info.size < 6) return "type"
        const buffer = Buffer.alloc(6, 0)
        const fd = fs.openSync(path, "r")
        fs.readSync(fd, buffer, 0, 6)
        const head = buffer.toString("utf8")
        if (head !== "flogo1") {
            fs.close(fd)
            return "type"
        }
        const fileBuffer = Buffer.alloc(info.size)
        buffer.copy(fileBuffer)
        fs.readSync(fd, fileBuffer, 6, info.size - 6)
        fs.close(fd)
        return {
            buffer: fileBuffer.toString("base64")
        }
    } catch (e) {
        return "open"
    }
})

ipcMain.handle("save-file-blob", (event, name, base64, fileType) => {
    let filters = []
    if (typeof fileType !== "undefined") {
        filters.push(fileType)
    }
    filters.push({
        name: "All files",
        extensions: ["*"]
    })
    const result = dialog.showSaveDialogSync(BrowserWindow.getFocusedWindow(), {
        defaultPath: name,
        filters: filters
    })
    if (result === "") return "cancel"
    const buffer = Buffer.from(base64, "base64")
    try {
        fs.writeFileSync(result, buffer)
        return null
    } catch (e) {
        return "save"
    }
})

const createWindow = (openThis, initialZoom) => {
    let size = {
        width: 1280,
        height: 720
    }
    if (!isMac) {
        size = screen.getPrimaryDisplay().workAreaSize
        if (size.width < 2000) {
            size.width = ~~(0.85 * size.width)
        } else {
            size.width = ~~(0.6 * size.width)
        }
        if (size.height < 1200) {
            size.height = ~~(0.85 * size.height)
        } else {
            size.height = ~~(0.6 * size.height)
        }
    }
    const __dirname = path.dirname(fileURLToPath(import.meta.url))
    const win = new BrowserWindow({
        width: size.width,
        height: size.height,
        minWidth: 640,
        minHeight: 400,
        icon: "images/favicon.png",
        show: false,
        webPreferences: {
            preload: path.join(__dirname, "preload.js"),
            nodeIntegration: false,
            contextIsolation: true,
            partition: "" + Math.random()
        }
    })
    win.webContents.on("zoom-changed", (e, dir) => {
        e.preventDefault()
        if (dir === "in") {
            if (win.webContents.getZoomFactor() < 2) {
                win.webContents.setZoomFactor(win.webContents.getZoomFactor() + 0.1)
                saveDefaultZoom(win.webContents.getZoomFactor())
            }
        } else if (dir === "out") {
            if (win.webContents.getZoomFactor() > 0.6) {
                win.webContents.setZoomFactor(win.webContents.getZoomFactor() - 0.1)
                saveDefaultZoom(win.webContents.getZoomFactor())
            }
        }
    })
    win.webContents.on("before-input-event", (e, input) => {
        const ctrlKey = isMac ? input.meta : input.control
        if (ctrlKey && input.type === "keyDown") {
            if (input.key === "+") {
                e.preventDefault()
                if (win.webContents.getZoomFactor() < 2) {
                    win.webContents.setZoomFactor(win.webContents.getZoomFactor() + 0.1)
                    saveDefaultZoom(win.webContents.getZoomFactor())
                }
            } else if (input.key === "-") {
                e.preventDefault()
                if (win.webContents.getZoomFactor() > 0.6) {
                    win.webContents.setZoomFactor(win.webContents.getZoomFactor() - 0.1)
                    saveDefaultZoom(win.webContents.getZoomFactor())
                }
            } else if (input.key === "0") {
                e.preventDefault()
                win.webContents.setZoomFactor(1)
                saveDefaultZoom(win.webContents.getZoomFactor())
            } else if (input.key === "w") {
                e.preventDefault()
                win.webContents.executeJavaScript("electron_closeWindow()")
            }
        }
    })
    win.on("ready-to-show", () => {
        win.show()
        if (typeof initialZoom !== "undefined") {
            win.webContents.setZoomFactor(initialZoom)
            saveDefaultZoom(initialZoom)
        } else {
            win.webContents.setZoomFactor(getDefaultZoom())
        }
        if (typeof openThis !== "undefined") {
            win.webContents.send("open-file", openThis)
        }
    })
    win.on("close", async (e) => {
        e.preventDefault()
        win.webContents.executeJavaScript("electron_closeWindow()")
    })
    if (!isMac) {
        win.setMenu(null)
    }
    if (app.isPackaged) {
        win.loadFile("index.html")
    } else {
        win.loadURL("http://localhost:5173")
    }
    contextMenu({
        window: win,
        showInspectElement: false,
        showSelectAll: false,
        showSearchWithGoogle: false
    })
}

let macos_appLaunchedByOpeningAFile = false

app.whenReady().then(() => {
    let gotFile = false
    process.argv.forEach(arg => {
        if (arg.toLowerCase().endsWith('.flogo')) {
            gotFile = true
            createWindow(arg)
        }
    })
    if (!gotFile && !macos_appLaunchedByOpeningAFile) {
        createWindow()
    }
    app.on("activate", () => {
        createWindow()
    })
})

if (isMac) {
    app.on("ready", () => {
        const appMenu = Menu.buildFromTemplate([{
                label: app.name,
                submenu: [{
                        label: "New window",
                        accelerator: "Command+N",
                        click: () => {
                            createWindow()
                        },
                    },
                    {
                        label: "Quit",
                        accelerator: "Command+Q",
                        click: () => {
                            app.quit()
                        },
                    },
                ],
            },
            {
                label: "Text",
                submenu: [{
                        role: "undo"
                    },
                    {
                        role: "redo"
                    },
                    {
                        type: "separator"
                    },
                    {
                        role: "cut"
                    },
                    {
                        role: "copy"
                    },
                    {
                        role: "paste"
                    },
                    {
                        role: "selectAll"
                    }
                ]
            }
        ])
        Menu.setApplicationMenu(appMenu)
    })
}

app.on("window-all-closed", () => {
    app.quit()
})

app.on("second-instance", (e, args) => {
    let gotFile = false
    args.forEach(arg => {
        if (arg.toLowerCase().endsWith('.flogo')) {
            gotFile = true
            createWindow(arg)
        }
    })
    if (!gotFile) {
        createWindow()
    }
})

app.on("open-file", (e, path) => {
    macos_appLaunchedByOpeningAFile = true
    app.whenReady().then(() => {
        createWindow(path)
    })
})
