export function close(all = false) {
    document.querySelectorAll("div.popup.visible").forEach(e => {
        if (all === true || !e.classList.contains("noAutoClose")) {
            e.classList.remove("visible")
            if (typeof e.flogo_closeCallback !== "undefined") e.flogo_closeCallback()
        }
    })
    if (document.querySelectorAll("div.popup.visible").length === 0) {
        const backdrop = document.getElementById("popupBackdrop")
        backdrop.classList.remove("active")
        backdrop.classList.remove("important")
    }
}

export function show(d, important = false) {
    close()
    if (typeof d === "string") d = document.getElementById(d)
    d.classList.add("visible")
    const backdrop = document.getElementById("popupBackdrop")
    backdrop.classList.add("active")
    if (important) {
        backdrop.classList.add("important")
    }
}

export function confirm(title, details, e) {
    const yesno = document.getElementById("yesno")
    document.getElementById("yesno_title_text").innerText = title
    document.getElementById("yesno_details").innerText = details
    const promise = new Promise((resolve, reject) => {
        document.getElementById("yesno_yes").onclick = () => {
            close()
            resolve(true)
        }
        document.getElementById("yesno_no").onclick = () => {
            close()
            resolve(false)
        }
    })
    if (typeof e !== "undefined" && e !== null) {
        const b = e.getBoundingClientRect()
        yesno.style.top = b.y + b.height + "px"
        yesno.style.left = b.x + "px"
        yesno.style.transform = ""
    } else {
        yesno.style.top = "50vh"
        yesno.style.left = "50vw"
        yesno.style.transform = "translate(-50%,-50%)"
    }
    show(yesno, true)
    let b = yesno.getBoundingClientRect()
    const wBounds = document.body.getBoundingClientRect()
    if (b.x + b.width >= wBounds.width) {
        yesno.style.left = wBounds.width - b.width + "px"
    }
    if (b.y + b.height >= wBounds.height) {
        yesno.style.top = wBounds.height - b.height + "px"
    }
    b = yesno.getBoundingClientRect()
    if (b.x < 0) {
        yesno.style.left = 0
    }
    if (b.y < 0) {
        yesno.style.top = 0
    }
    return promise
}

export function areVisible() {
    return document.querySelectorAll("div.popup.visible").length !== 0
}

document.getElementById("popupBackdrop").onclick = () => {
    close()
}
document.querySelectorAll("button.closePopup").forEach(b => {
    b.onclick = () => {
        close(true)
    }
})

window.addEventListener("resize", close)

export function toast(text, duration = 2000) {
    document.querySelectorAll("#toasts>div.toast").forEach(t => {
        if (typeof t.flogo_autoOutTimer !== "undefined") {
            clearTimeout(t.flogo_autoOutTimer)
            t.flogo_leave()
        }
    })
    const t = document.createElement("div")
    t.className = "toast"
    t.innerText = text
    t.onanimationend = () => {
        t.flogo_leave = () => {
            t.style.animation = "toast-out var(--toast-animation-duration)"
            delete(t.flogo_autoOutTimer)
            delete(t.flogo_leave)
            t.onanimationend = () => {
                document.getElementById("toasts").removeChild(t)
            }
        }
        t.flogo_autoOutTimer = setTimeout(t.flogo_leave, duration)
    }
    t.style.animation = "toast-in var(--toast-animation-duration)"
    document.getElementById("toasts").appendChild(t)
}
