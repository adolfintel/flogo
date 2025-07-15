let storage = null

{
    const {
        ipcRenderer
    } = require('electron');
    const handler = {
        set(target, prop, value) {
            ipcRenderer.sendSync('electron-store-set', prop, value.toString())
        },
        get(target, prop, receiver) {
            return ipcRenderer.sendSync('electron-store-get', prop)
        },
        deleteProperty(target, prop) {
            ipcRenderer.sendSync('electron-store-delete', prop)
        }
    }
    storage = new Proxy({}, handler)
}
