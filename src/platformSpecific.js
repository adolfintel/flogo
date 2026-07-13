export const isElectron = typeof flogoElectronAPI !== "undefined"

export function isPWAInstalled() {
    return navigator.standalone || window.matchMedia('(display-mode: standalone)').matches
}

export const isMac = navigator.userAgent.toLowerCase().indexOf("macintosh") !== -1 || navigator.userAgent.toLowerCase().indexOf("like mac os x") !== -1

export const isWebKit = /(apple)?webkit/i.test(navigator.userAgent) && !/(apple)?webkit\/537\.36/i.test(navigator.userAgent)

let s
if (isElectron) {
    const handler = {
        set(target, prop, value) {
            flogoElectronAPI.electronStore.write(prop, value.toString())
            return true
        },
        get(target, prop, receiver) {
            return flogoElectronAPI.electronStore.read(prop)
        },
        deleteProperty(target, prop) {
            flogoElectronAPI.electronStore.remove(prop)
            return true
        }
    }
    s = new Proxy({}, handler)
} else {
    s = window.localStorage
}

export const storage = s

let c
if (isElectron) {
    c = {
        read: () => {
            return flogoElectronAPI.internalClipboard.read()
        },
        write: (value) => {
            flogoElectronAPI.internalClipboard.write(value)
        },
        isEmpty: () => {
            return flogoElectronAPI.internalClipboard.isEmpty()
        },
        clear: () => {
            flogoElectronAPI.internalClipboard.clear()
        }
    }
} else {
    let data = null
    c = {
        read: () => {
            return data
        },
        write: (value) => {
            data = value
        },
        isEmpty: () => {
            return data === null
        },
        clear: () => {
            data = null
        }
    }
}

export const clipboard = c

export function saveBlob(name, blob, fileType) {
    if (isElectron) {
        return flogoElectronAPI.saveFile(name, blob, fileType)
    } else {
        const a = document.createElement("a")
        if (typeof blob === "string") {
            a.href = blob
        } else {
            a.href = URL.createObjectURL(blob)
        }
        a.download = name
        a.click()
        return null
    }
}

export async function loadBlob(fileType) {
    /*
     * Shows an open file dialog.
     * On web/pwa it simply returns a File
     * On electron returns an object that contains path and blob
     * In case of errors, it throws a string with the error message
    */
    if (isElectron) {
        return await flogoElectronAPI.openFile(fileType)
    } else {
        return await new Promise((resolve, _) => {
            const filePicker = document.createElement("input")
            filePicker.type = "file"
            if (!isWebKit && typeof fileType !== "undefined") {
                let ext = ""
                fileType.extensions.forEach(e => ext += "." + e + ",")
                if (ext.endsWith(",")) ext = ext.substring(0, ext.length - 1)
                filePicker.accept = ext
            }
            filePicker.onchange = () => {
                resolve(filePicker.files[0])
            }
            filePicker.click()
        })
    }
}
