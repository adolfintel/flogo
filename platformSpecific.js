//This file contains some code that's specific for the PWA or the Electron version

function isElectron() {
    try {
        return window.process.type === 'renderer'
    } catch (e) {
        return false
    }
}

function isPWAInstalled() {
    return navigator.standalone || window.matchMedia('(display-mode: standalone)').matches
}

const isMac = navigator.userAgent.toLowerCase().indexOf("macintosh") !== -1 || navigator.userAgent.toLowerCase().indexOf("like mac os x") !== -1

const isWebKit = /(apple)?webkit/i.test(navigator.userAgent) && !/(apple)?webkit\/537\.36/i.test(navigator.userAgent)

let storage //storage for settings (localStorage for PWA, electron-store for Electron)

if (isElectron()) {
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
} else {
    storage = window.localStorage
    //Redirect HTTP to HTTPS
    if (location.protocol == "http:") {
        location.href = "https" + location.href.substring(4)
    }
    //Register PWA service worker
    if ("serviceWorker" in navigator) {
        navigator.serviceWorker.register("sw.js").then(registration => {
            registration.onupdatefound = () => {
                const installingWorker = registration.installing;
                installingWorker.onstatechange = () => {
                    if (installingWorker.state === 'installed') {
                        if (navigator.serviceWorker.controller) {
                            console.log('Update available')
                        } else {
                            console.log('PWA cached')
                        }
                    }
                }
            }
        })
    }
    //Update window title to remove the "-Flogo" when the app is installed
    window.onappinstalled = () => {
        updateWindowTitle()
    }
}
