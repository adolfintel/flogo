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
