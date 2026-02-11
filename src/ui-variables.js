import * as FlogoLang from "./flogo-language.js"
import * as Theming from "./ui-theming.js"
import * as History from "./ui-history.js"
import * as Utils from "./ui-utils.js"
import * as Platform from "./platformSpecific.js"

let dragging = null,
    touchscreenDragWorkaround = false

function createVariable(name) {
    const v = document.createElement("div")
    v.className = "variable"
    if (name === null) {
        v.flogo_variable = "temp_" + Date.now()
        FlogoLang.declareVariable(v.flogo_variable, "integer")
        v.flogo_isNewVariable = true
    } else {
        v.flogo_variable = name
    }
    v.draggable = true
    v.ondragstart = e => {
        if (e.target !== v) e.preventDefault()
        dragging = v
        document.querySelectorAll("#variableList > div.variable > .value *").forEach(el => {
            el.style.pointerEvents = "none"
        })
    }
    v.ondragend = e => {
        if (Platform.isWebKit || e.dataTransfer.dropEffect !== "none" || touchscreenDragWorkaround) {
            moveVariableAtDropIndicator(v)
        }
        hideVariableDropIndicator()
        dragging = null
        document.querySelectorAll("#variableList > div.variable > .value *").forEach(el => {
            el.style.pointerEvents = ""
        })
    }
    v.onpointerdown = e => {
        //workaround: on mobile chromium, in ondragend, event.dataTransfer.dropEffect is none despite it being a valid drag
        touchscreenDragWorkaround = e.pointerType !== "mouse"
    }
    const nt = document.createElement("div")
    nt.className = "nameType"
    const nameVis = document.createElement("div")
    nameVis.className = "name vis"
    const nameEdit = document.createElement("span")
    nameEdit.contentEditable = true
    nameEdit.className = "name edit"
    nameEdit.onfocus = () => {
        Utils.selectContents(nameEdit)
    }
    Utils.disableSpellcheck(nameEdit)
    nt.appendChild(nameVis)
    nt.appendChild(nameEdit)
    const typeVis = document.createElement("div")
    typeVis.className = "type vis"
    const typeEdit = document.createElement("select")
    typeEdit.className = "type edit";
    ["integer", "real", "string", "boolean", "array"].forEach((t) => {
        let o = document.createElement("option")
        o.value = t
        o.innerText = t.slice(0, 1).toUpperCase() + t.slice(1)
        typeEdit.appendChild(o)
    })
    nt.appendChild(typeVis)
    nt.appendChild(typeEdit)
    const btns = document.createElement("div")
    btns.className = "buttonGroup"
    const delBtn = document.createElement("button")
    delBtn.className = "danger vis"
    delBtn.appendChild(Utils.makeIcon("delete"))
    delBtn.title = "Delete"
    delBtn.onclick = () => {
        deleteVariable(v)
    }
    btns.appendChild(delBtn)
    const editBtn = document.createElement("button")
    editBtn.className = "vis"
    editBtn.appendChild(Utils.makeIcon("edit"))
    editBtn.title = "Modify"
    editBtn.onclick = () => {
        editVariable(v)
    }
    btns.appendChild(editBtn)
    const cancelEditBtn = document.createElement("button")
    cancelEditBtn.className = "edit"
    cancelEditBtn.appendChild(Utils.makeIcon("close"))
    cancelEditBtn.title = "Cancel"
    cancelEditBtn.onclick = () => {
        cancelEditVariable(v)
    }
    btns.appendChild(cancelEditBtn)
    const confirmEditBtn = document.createElement("button")
    confirmEditBtn.className = "important edit"
    confirmEditBtn.appendChild(Utils.makeIcon("save"))
    confirmEditBtn.title = "Confirm"
    confirmEditBtn.onclick = () => {
        confirmEditVariable(v)
    }
    btns.appendChild(confirmEditBtn)
    nt.appendChild(btns)
    nt.ondragenter = () => {
        if (dragging !== null && dragging !== v && v.previousSibling !== dragging) {
            placeVariableDropIndicatorBefore(v)
        } else {
            hideVariableDropIndicator()
        }
    }
    v.appendChild(nt)
    const valVis = document.createElement("div")
    valVis.className = "value vis"
    const valEdit = document.createElement("div")
    valEdit.className = "value edit"
    const valEditArrayOnly = document.createElement("div")
    const init = document.createElement("input")
    init.type = "checkbox"
    init.onchange = e => {
        if (init.checked) {
            initVal.style.display = ""
            if (typeof e !== "undefined") {
                initVal.focus()
            }
        } else {
            initVal.style.display = "none"
        }
    }
    const initLabel = document.createElement("label")
    initLabel.innerText = "Initialize"
    initLabel.onclick = () => {
        init.click()
    }
    const initVal = document.createElement("div")
    initVal.contentEditable = true
    initVal.className = "initVal"
    initVal.style.display = "none"
    initVal.onfocus = () => {
        Utils.selectContents(initVal)
    }
    const arrType = document.createElement("select")
    arrType.className = "arrType";
    ["integer", "real", "string", "boolean"].forEach((t) => {
        let o = document.createElement("option")
        o.value = t
        o.innerText = t.slice(0, 1).toUpperCase() + t.slice(1)
        arrType.appendChild(o)
    })
    const arrTypeLabel = document.createElement("label")
    arrTypeLabel.innerText = "Array type"
    arrTypeLabel.onclick = () => {
        arrType.click()
    }
    const arrSize = document.createElement("div")
    arrSize.contentEditable = true
    arrSize.className = "arrSize"
    arrSize.onfocus = () => {
        Utils.selectContents(arrSize)
    }
    const arrSizeLabelBefore = document.createElement("span")
    arrSizeLabelBefore.innerText = "["
    const arrSizeLabelAfter = document.createElement("span")
    arrSizeLabelAfter.innerText = "]"
    Utils.disableSpellcheck(arrSize)
    Utils.disableSpellcheck(initVal)
    valEditArrayOnly.appendChild(arrTypeLabel)
    valEditArrayOnly.appendChild(arrType)
    valEditArrayOnly.appendChild(arrSizeLabelBefore)
    valEditArrayOnly.appendChild(arrSize)
    valEditArrayOnly.appendChild(arrSizeLabelAfter)
    valEdit.appendChild(valEditArrayOnly)
    valEdit.appendChild(init)
    valEdit.appendChild(initLabel)
    valEdit.appendChild(initVal)
    v.appendChild(valVis)
    v.appendChild(valEdit)
    v.flogo_name = {
        vis: nameVis,
        edit: nameEdit,
    }
    v.flogo_type = {
        vis: typeVis,
        edit: typeEdit,
    }
    v.flogo_val = {
        vis: valVis,
        edit: valEdit,
    }
    v.flogo_buttons = {
        confirm: confirmEditBtn,
        cancel: cancelEditBtn,
        edit: editBtn,
        del: delBtn,
        init: init
    }
    v.onkeydown = e => {
        if (e.key === "Escape") {
            e.preventDefault()
            v.flogo_buttons.cancel.click()
        } else if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault()
            v.flogo_buttons.confirm.click()
        }
    }
    typeEdit.onchange = () => {
        if (typeEdit.value === "array") {
            valEditArrayOnly.style.display = ""
        } else {
            valEditArrayOnly.style.display = "none"
        }
        init.onchange()
    }
    typeEdit.onchange()
    valEdit.ondragenter = valVis.ondragenter = () => {
        if (dragging !== null && dragging !== v && v.nextSibling !== dragging) {
            placeVariableDropIndicatorAfter(v)
        } else {
            hideVariableDropIndicator()
        }
    }
    valEdit.flogo_init = init
    valEdit.flogo_initVal = initVal
    valEdit.flogo_arrType = arrType
    valEdit.flogo_arrSize = arrSize
    updateVariableValue(v)
    if (name === null) {
        editVariable(v)
    } else {
        nameVis.innerText = name
        nameEdit.innerText = name
        if (FlogoLang.variables[name].isArray) {
            typeVis.innerText = "Array"
            typeEdit.value = "array"
        } else {
            typeVis.innerText = FlogoLang.variables[name].type.slice(0, 1).toUpperCase() + FlogoLang.variables[name].type.slice(1)
            typeEdit.value = FlogoLang.variables[name].type
        }
        if (typeof FlogoLang.variables[name].initialValue !== "undefined" && FlogoLang.variables[name].initialValue !== null) {
            init.checked = true
            initVal.style.display = "block"
            initVal.innerText = FlogoLang.variables[name].initialValue
        } else {
            init.checked = false
            initVal.style.display = "none"
        }
    }
    return v
}

function reorderProgramVariablesUsingOrderFromVisibleList() {
    const newOrder = []
    document.querySelectorAll("#variableList > div.variable").forEach(v => {
        newOrder.push(v.flogo_variable)
    })
    FlogoLang.reorderVariables(newOrder)
}

function deleteVariable(v) {
    document.getElementById("variableList").removeChild(v)
    FlogoLang.removeVariable(v.flogo_variable)
    History.commit()
}

function editVariable(v) {
    v.classList.add("editing")
    v.draggable = false
    v.flogo_type.edit.onchange()
    if (FlogoLang.variables[v.flogo_variable].isArray) {
        v.flogo_val.edit.flogo_arrType.value = FlogoLang.variables[v.flogo_variable].type
        v.flogo_val.edit.flogo_arrSize.innerText = FlogoLang.variables[v.flogo_variable].size
    }
    v.flogo_buttons.init.checked = FlogoLang.variables[v.flogo_variable].initialValue !== null
    v.flogo_buttons.init.onchange()
    requestAnimationFrame(() => {
        //needs to happen on the next frame because we can't focus an element that's not currently visible
        v.flogo_name.edit.focus()
    })
}

function cancelEditVariable(v) {
    v.classList.remove("editing")
    v.draggable = true
    if (v.flogo_isNewVariable) {
        document.getElementById("variableList").removeChild(v)
        document.getElementById("variableList").appendChild(newVarBtn)
        FlogoLang.removeVariable(v.flogo_variable)
    } else {
        v.flogo_name.edit.innerText = v.flogo_variable
        if (FlogoLang.variables[v.flogo_variable].isArray) {
            v.flogo_type.edit.value = "array"
            v.flogo_val.edit.flogo_arrType.value = FlogoLang.variables[v.flogo_variable].type
            v.flogo_val.edit.flogo_arrSize.innerText = FlogoLang.variables[v.flogo_variable].size
        } else {
            v.flogo_type.edit.value = FlogoLang.variables[v.flogo_variable].type
            if (FlogoLang.variables[v.flogo_variable].initialValue !== null) {
                v.flogo_val.edit.flogo_init.checked = true
                v.flogo_val.edit.flogo_initVal.innerText = FlogoLang.variables[v.flogo_variable].initialValue
            } else {
                v.flogo_val.edit.flogo_init.checked = false
                v.flogo_val.edit.flogo_initVal.innerText = ""
            }
        }
    }
}

function confirmEditVariable(v) {
    let size, arrType, val = null,
        changed = false,
        errorFields = []
    const name = v.flogo_name.edit.innerText.trim()
    if (!FlogoLang.isValidVariableName(name) || (typeof FlogoLang.variables[name] !== "undefined" && (name !== v.flogo_variable || v.flogo_isNewVariable))) {
        errorFields.push(v.flogo_name.edit)
    }
    v.flogo_name.edit.innerText = name
    const type = v.flogo_type.edit.value,
        tempName = "temp_" + Date.now()
    if (type === "array") {
        try {
            size = v.flogo_val.edit.flogo_arrSize.innerText.trim()
            if (size === "") throw ""
            size = Number(size)
            if (isNaN(size) || !Number.isInteger(size) || size <= 0) throw ""
        } catch (e) {
            errorFields.push(v.flogo_val.edit.flogo_arrSize)
        }
        try {
            arrType = v.flogo_val.edit.flogo_arrType.value
            if (v.flogo_val.edit.flogo_init.checked) {
                val = v.flogo_val.edit.flogo_initVal.innerText
                switch (arrType) {
                    case "integer":
                    case "real": {
                        val = val.trim()
                        v.flogo_val.edit.flogo_initVal.innerText = val
                        if (val === "") throw ""
                        val = Number(val)
                    }
                    break
                    case "boolean": {
                        val = val.trim()
                        v.flogo_val.edit.flogo_initVal.innerText = val
                        if (val !== "false" && val !== "true") throw ""
                        val = val === "true"
                    }
                    break
                }
            }
            if (errorFields.length === 0) {
                FlogoLang.declareVariable(tempName, arrType, size, val)
            }
        } catch (e) {
            errorFields.push(v.flogo_val.edit.flogo_initVal)
        }
    } else {
        try {
            if (v.flogo_val.edit.flogo_init.checked) {
                val = v.flogo_val.edit.flogo_initVal.innerText
                switch (type) {
                    case "integer":
                    case "real": {
                        val = val.trim()
                        v.flogo_val.edit.flogo_initVal.innerText = val
                        if (val === "") throw ""
                        val = Number(val)
                    }
                    break
                    case "boolean": {
                        val = val.trim()
                        v.flogo_val.edit.flogo_initVal.innerText = val
                        if (val !== "false" && val !== "true") throw ""
                        val = val === "true"
                    }
                    break
                }
            }
            if (errorFields.length === 0) {
                FlogoLang.declareVariable(tempName, type, 0, val)
            }
        } catch (e) {
            errorFields.push(v.flogo_val.edit.flogo_initVal)
        }
    }
    if (errorFields.length > 0) {
        errorFields.forEach(e => {
            Utils.errorFlash(e, errorFields[0])
        })
        return
    }
    if (v.flogo_isNewVariable) {
        document.getElementById("variableList").appendChild(newVarBtn)
    }
    if (name === v.flogo_variable) {
        if (JSON.stringify(FlogoLang.variables[name].toSimpleObject()) !== JSON.stringify(FlogoLang.variables[tempName].toSimpleObject())) changed = true
        FlogoLang.variables[name] = FlogoLang.variables[tempName]
        FlogoLang.removeVariable(tempName)
    } else {
        changed = true
        FlogoLang.removeVariable(v.flogo_variable)
        FlogoLang.renameVariable(tempName, name)
    }
    v.flogo_variable = name
    v.flogo_name.vis.innerText = name
    v.flogo_type.vis.innerText = type.slice(0, 1).toUpperCase() + type.slice(1)
    v.classList.remove("editing")
    v.draggable = true
    delete v.flogo_isNewVariable
    updateVariableValue(v)
    if (changed) {
        History.commit()
    }
}

const newVarBtn = document.createElement("button")
newVarBtn.id = "newVariable"
newVarBtn.className = "important"
newVarBtn.innerText = "New"
newVarBtn.prepend(Utils.makeIcon("add"))
newVarBtn.onclick = () => {
    const list = document.getElementById("variableList")
    list.removeChild(newVarBtn)
    list.appendChild(createVariable(null))
}

let ARRAY_VIEW_MAX = 1024

export function setUnlimitedArrayView(v) {
    if (v === true) {
        ARRAY_VIEW_MAX = Number.MAX_SAFE_INTEGER
    } else {
        ARRAY_VIEW_MAX = 1024
    }
}

export function getUnlimitedArrayView() {
    return ARRAY_VIEW_MAX === Number.MAX_SAFE_INTEGER
}

const tablePlaceholder = document.createElement("div")
tablePlaceholder.style.height = "999999rem"

function updateVariableValue(v) {
    if (FlogoLang.variables[v.flogo_variable].isArray) {
        if (typeof v.flogo_val.vis.arrayViewer === "undefined" || //we haven't created the array viewer yet
            v.flogo_val.vis.arrayViewer.flogo_arrType !== FlogoLang.variables[v.flogo_variable].type || //the type of the array has changed
            v.flogo_val.vis.arrayViewer.flogo_arrSize !== FlogoLang.variables[v.flogo_variable].size || //the size of the array has changed
            v.flogo_val.vis.arrayViewer.flogo_limit !== ARRAY_VIEW_MAX //the user has toggled the array view limit
        ) {
            if (typeof v.flogo_val.vis.simpleViewer !== "undefined") {
                v.flogo_val.vis.simpleViewer.remove()
                delete v.flogo_val.vis.simpleViewer
            }
            const d = document.createElement("details")
            v.flogo_val.vis.arrayViewer = d
            const s = document.createElement("summary")
            const shortText = "" + FlogoLang.variables[v.flogo_variable].value
            s.innerText = shortText.slice(0, 1).toUpperCase() + shortText.slice(1)
            v.flogo_val.vis.arrayViewer.flogo_arrType = FlogoLang.variables[v.flogo_variable].type
            v.flogo_val.vis.arrayViewer.flogo_arrSize = FlogoLang.variables[v.flogo_variable].size
            v.flogo_val.vis.arrayViewer.flogo_limit = ARRAY_VIEW_MAX
            d.appendChild(s)
            const t = document.createElement("table")
            v.flogo_val.vis.arrayViewer.tableElement = t
            v.flogo_val.vis.arrayViewer.arrContents = []
            for (let i = 0; i < FlogoLang.variables[v.flogo_variable].size; i++) {
                const tr = document.createElement("tr")
                if (i >= ARRAY_VIEW_MAX) {
                    const td = document.createElement("td")
                    td.setAttribute("colspan", "2")
                    td.innerText = "Too long, truncated"
                    tr.appendChild(td)
                    t.appendChild(tr)
                    break
                }
                const th = document.createElement("th")
                th.innerText = i
                tr.appendChild(th)
                const td = document.createElement("td")
                v.flogo_val.vis.arrayViewer.arrContents[i] = td
                tr.appendChild(td)
                t.appendChild(tr)
            }
            d.appendChild(t)
            v.flogo_val.vis.innerHTML = ""
            v.flogo_val.vis.appendChild(d)
        }
        if (v.flogo_val.vis.arrayViewer.open) {
            let needRefresh = false
            for (let i = 0; i < v.flogo_val.vis.arrayViewer.arrContents.length; i++) {
                if (typeof v.flogo_val.vis.arrayViewer.arrContents[i].flogo_value === "undefined" || FlogoLang.variables[v.flogo_variable].value[i] !== v.flogo_val.vis.arrayViewer.arrContents[i].flogo_value) {
                    needRefresh = true
                    break
                }
            }
            if (needRefresh) {
                v.flogo_val.vis.arrayViewer.replaceChild(tablePlaceholder, v.flogo_val.vis.arrayViewer.tableElement)
                for (let i = 0; i < v.flogo_val.vis.arrayViewer.arrContents.length; i++) {
                    let text
                    v.flogo_val.vis.arrayViewer.arrContents[i].flogo_value = FlogoLang.variables[v.flogo_variable].value[i]
                    if (FlogoLang.variables[v.flogo_variable].value[i] !== null) {
                        text = "" + FlogoLang.variables[v.flogo_variable].value[i]
                        v.flogo_val.vis.arrayViewer.arrContents[i].classList.remove("uninitialized")
                    } else {
                        text = "Not initialized"
                        v.flogo_val.vis.arrayViewer.arrContents[i].classList.add("uninitialized")
                    }
                    if (text !== v.flogo_val.vis.arrayViewer.arrContents[i].innerText) {
                        v.flogo_val.vis.arrayViewer.arrContents[i].innerText = text
                    }
                }
                v.flogo_val.vis.arrayViewer.replaceChild(v.flogo_val.vis.arrayViewer.tableElement, tablePlaceholder)
            }
        }
        v.flogo_val.vis.classList.remove("uninitialized")
    } else {
        if (typeof v.flogo_val.vis.arrayViewer !== "undefined") {
            v.flogo_val.vis.arrayViewer.remove()
            delete v.flogo_val.vis.arrayViewer
        }
        let text
        if (FlogoLang.variables[v.flogo_variable].value !== null) {
            text = "" + FlogoLang.variables[v.flogo_variable].value
            v.flogo_val.vis.classList.remove("uninitialized")
        } else {
            text = "Not initialized"
            v.flogo_val.vis.classList.add("uninitialized")
        }
        if (typeof v.flogo_val.vis.simpleViewer === "undefined") {
            const simpleViewer = document.createElement("div")
            simpleViewer.className = "simpleViewer"
            v.flogo_val.vis.appendChild(simpleViewer)
            v.flogo_val.vis.simpleViewer = simpleViewer
        }
        if (text !== v.flogo_val.vis.innerText) {
            v.flogo_val.vis.simpleViewer.innerText = text
        }
    }
    if (FlogoLang.variables[v.flogo_variable].modified) {
        v.flogo_val.vis.classList.add("modified")
    } else {
        v.flogo_val.vis.classList.remove("modified")
    }
}

function updateVariableValues() {
    requestAnimationFrame(updateVariableValues)
    const vars = document.querySelectorAll("#variableList > div.variable")
    vars.forEach(v => {
        updateVariableValue(v)
    })
}

updateVariableValues()

export function enable() {
    document.getElementById("variablesArea").classList.remove("noedit")
    const vars = document.querySelectorAll("#variableList > div.variable")
    vars.forEach(v => {
        v.draggable = true
    })
}

export function disable() {
    document.getElementById("variablesArea").classList.add("noedit")
    const vars = document.querySelectorAll("#variableList > div.variable")
    vars.forEach(v => {
        v.draggable = false
    })
}

function makeVariableDropIndicator() {
    const d = document.createElement("div")
    d.id = "variableDropIndicator"
    return d
}

function placeVariableDropIndicatorBefore(v) {
    const d = document.getElementById("variableDropIndicator")
    const vb = v.getBoundingClientRect()
    d.classList.add("visible")
    d.style.top = (vb.y - d.getBoundingClientRect().height) + "px"
    d.flogo_placeBefore = v
    d.flogo_placeAfter = null
}

function placeVariableDropIndicatorAfter(v) {
    const d = document.getElementById("variableDropIndicator")
    const vb = v.getBoundingClientRect()
    d.classList.add("visible")
    d.style.top = (vb.y + vb.height) + "px"
    d.flogo_placeBefore = null
    d.flogo_placeAfter = v
}

function hideVariableDropIndicator() {
    const d = document.getElementById("variableDropIndicator")
    d.classList.remove("visible")
    d.flogo_placeBefore = null
    d.flogo_placeAfter = null
}

function moveVariableAtDropIndicator(v) {
    const d = document.getElementById("variableDropIndicator")
    const list = document.getElementById("variableList")
    if (d.flogo_placeBefore !== null) {
        const before = v,
            after = d.flogo_placeBefore
        if (before == after || before === null || after === null) return
        list.removeChild(before)
        list.insertBefore(before, after)
    } else if (d.flogo_placeAfter !== null) {
        const before = d.flogo_placeAfter,
            after = v
        if (before == after || before === null || after === null) return
        list.removeChild(after)
        before.after(after)
    } else {
        return
    }
    reorderProgramVariablesUsingOrderFromVisibleList()
    History.commit()
}

export function getTempVariables() {
    const tempVars = []
    document.querySelectorAll("#variableList > div.variable").forEach(v => {
        if (v.flogo_isNewVariable) {
            tempVars.push(v.flogo_variable)
        }
    })
    return tempVars
}

export function init() {
    const list = document.getElementById("variableList")
    list.innerHTML = ""
    for (const v in FlogoLang.variables) {
        const div = createVariable(v)
        list.appendChild(div)
    }
    list.appendChild(newVarBtn)
    list.appendChild(makeVariableDropIndicator())
}

export function cancelAllEdits() {
    const vars = document.querySelectorAll("#variableList > div.variable.editing")
    vars.forEach(v => {
        cancelEditVariable(v)
    })
}

function toggleVariablesArea() {
    const va = document.getElementById("variablesArea")
    va.classList.toggle("expanded")
    //workaround: there is a 1 frame "jitter" in the layout when flowchartArea is resized because konva won't redraw until the frame after our layout shift. To workaround this, we add a transform that moves the old content in the new place, and remove it the very next frame after konva has drawn the new content in the correct spot. This issue is not visible in the right side, so toggleConsoleArea doesn't have this code
    const fc = document.getElementById("flowchartArea")
    fc.classList.toggle("variablesExpanded")
    if (fc.classList.contains("variablesExpanded")) {
        fc.style.transform = "translateX(calc(var(--layout-variablesArea-width) * -1))"
    } else {
        fc.style.transform = "translateX(var(--layout-variablesArea-width))"
    }
    requestAnimationFrame(() => {
        requestAnimationFrame(() => {
            fc.style.transform = ""
        })
    })
    va.flogo_toggledAt = Date.now() //used by autoLayout in ui-theming
}

document.getElementById("variablesExpander").onclick = toggleVariablesArea
document.getElementById("variablesExpander").ontouchstart = toggleVariablesArea
