//Electron version: main process

const {
    app,
    BrowserWindow,
    dialog,
    webContents,
    ipcMain,
    screen,
    Menu
} = require('electron')
const contextMenu = require('electron-context-menu');

const Store = require('electron-store').default
const store = new Store()
ipcMain.on('electron-store-get', (event, key) => {
    const value = store.get(key)
    event.returnValue = value
})
ipcMain.on('electron-store-set', (event, key, value) => {
    store.set(key, value)
    event.returnValue = 'success'
})
ipcMain.on('electron-store-delete', (event, key) => {
    const value = store.delete(key)
    event.returnValue = 'success'
})

const createWindow = openThis => {
    let size = {
        width: 1280,
        height: 720
    }
    if (process.platform !== 'darwin') {
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
    const win = new BrowserWindow({
        width: size.width,
        height: size.height,
        minWidth: 640,
        minHeight: 400,
        icon: 'images/favicon.png',
        show: false,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false
        }
    })
    win.on('ready-to-show', () => {
        win.show()
        if (typeof openThis !== "undefined") {
            win.webContents.send('open-file', openThis)
        }
    })
    win.on('close', async (e) => {
        e.preventDefault()
        const undoHistoryPtr = await win.webContents.executeJavaScript("undoHistoryPtr")
        if (Number(undoHistoryPtr) <= 1) {
            win.destroy()
        } else {
            const response = await dialog.showMessageBox({
                type: 'question',
                title: 'Quit',
                message: 'Are you sure you want to quit?\nUnsaved changes will be lost',
                buttons: ['No', 'Yes']
            })
            if (response.response === 1) {
                win.destroy()
            }
        }
    })
    if (process.platform !== 'darwin') {
        win.setMenu(null)
    }
    win.loadFile('index.html')
    contextMenu.default({
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
    app.on('activate', () => {
        createWindow()
    })
})

if (process.platform === 'darwin') {
    app.on('ready', () => {
        const appMenu = Menu.buildFromTemplate([{
                label: app.name,
                submenu: [{
                        label: 'New window',
                        accelerator: 'Command+N',
                        click: () => {
                            createWindow()
                        },
                    },
                    {
                        label: 'Quit',
                        accelerator: 'Command+Q',
                        click: () => {
                            app.quit()
                        },
                    },
                ],
            },
            {
                label: 'Text',
                submenu: [{
                        role: 'undo'
                    },
                    {
                        role: 'redo'
                    },
                    {
                        type: 'separator'
                    },
                    {
                        role: 'cut'
                    },
                    {
                        role: 'copy'
                    },
                    {
                        role: 'paste'
                    },
                    {
                        role: 'selectAll'
                    }
                ]
            }
        ])
        Menu.setApplicationMenu(appMenu)
    })
}

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit()
    }
})

app.on('second-instance', (e, args) => {
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

app.on('open-file', (e, path) => {
    macos_appLaunchedByOpeningAFile = true
    app.whenReady().then(() => {
        createWindow(path)
    })
})
