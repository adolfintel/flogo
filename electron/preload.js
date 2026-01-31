const {
    contextBridge,
    ipcRenderer,
    webUtils
} = require("electron")

let pendingOpenFileRequest = null

contextBridge.exposeInMainWorld("flogoElectronAPI", {
    getElectronVersion: () => {
        return process.versions.electron
    },
    getPendingOpenFileRequest: () => {
        const ret = pendingOpenFileRequest
        pendingOpenFileRequest = null
        return ret
    },
    newWindow: (file) => {
        if (typeof file !== "undefined") {
            ipcRenderer.send("new-window", webUtils.getPathForFile(file))
        } else {
            ipcRenderer.send("new-window")
        }
    },
    openBrowser: (url) => {
        ipcRenderer.send("open-browser", url)
    },
    readFile: async (path) => {
        const data = await ipcRenderer.invoke("read-file-blob", path)
        if (typeof data === "string") {
            throw data
        }
        const binaryData = Buffer.from(data.buffer, "base64")
        const blob = new Blob([binaryData], {
            type: "application/octet-stream"
        })
        return blob
    },
    electronStore: {
        read: (key) => {
            return ipcRenderer.sendSync("electron-store-get", key)
        },
        write: (key, value) => {
            ipcRenderer.sendSync("electron-store-set", key, value.toString())
        },
        remove: (key) => {
            ipcRenderer.sendSync("electron-store-delete", key)
        }
    },
    internalClipboard: {
        read: () => {
            return ipcRenderer.sendSync("clipboard-read")
        },
        write: (value) => {
            ipcRenderer.sendSync("clipboard-write", value)
        },
        isEmpty: () => {
            return ipcRenderer.sendSync("clipboard-empty")
        },
        clear: () => {
            ipcRenderer.sendSync("clipboard-clear")
        }
    }
})

ipcRenderer.on("open-file", (event, path) => {
    pendingOpenFileRequest = path
})
