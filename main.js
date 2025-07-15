const {
    app,
    BrowserWindow,
    dialog,
    webContents,
    ipcMain
} = require('electron')

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

let openThis = null

const createWindow = () => {
    const win = new BrowserWindow({
        width: 1280,
        height: 720,
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
        if (openThis !== null) {
            win.webContents.send('open-file', openThis)
            openThis = null
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
    win.setMenu(null)
    win.loadFile('index.html')
}

app.whenReady().then(() => {
    openThis = process.argv.find(arg => arg.toLowerCase().endsWith('.flogo')) ?? null
    createWindow()
    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createWindow()
        }
    })
})

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit()
    }
})

app.on('second-instance', (e, args) => {
    openThis = argv.find(arg => arg.toLowerCase().endsWith('.flogo')) ?? null
    createWindow()
})

app.on('open-file', (e, path) => { //for mac, currently untested
    openThis = path ?? null
    createWindow()
})
