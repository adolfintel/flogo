const {
    app,
    BrowserWindow,
    dialog,
    webContents
} = require('electron')

const createWindow = () => {
    const win = new BrowserWindow({
        width: 1280,
        height: 720,
        minWidth: 640,
        minHeight: 400,
        icon: 'images/favicon.png'
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
