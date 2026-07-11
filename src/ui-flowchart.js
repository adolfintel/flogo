import * as FlogoLang from "./flogo-language.js"
import Konva from "konva"
import {
    Context as SVGCanvasContext
} from "svgcanvas"
import * as Platform from "./platformSpecific.js"
import * as Utils from "./ui-utils.js"
import * as Theming from "./ui-theming.js"
import '@material-design-icons/font/sharp.css'
import * as History from "./ui-history.js"

export let callbacks = {
    ui_edit: (instruction, evt, parent, posInParent) => { //called when a block is double clicked
        console.log("Edit " + instruction.type)
    },
    ui_edit2: (instruction, evt, parent, posInParent) => { //called when a block is right clicked
        console.log("Edit2 " + instruction.type)
    },
    ui_insert: (instruction, pos, evt, callback) => { //called when an arrow is clicked
        console.log("Insert " + instruction.type + " @ " + pos)
    }
}

function makeArrowHighlightable(arrow) {
    arrow.on("mouseover", () => {
        if (arrow.flogo_forceHighlighted) return
        const intState = FlogoLang.interpreter.getState()
        if (intState === "running" || intState === "paused") return
        arrow.stroke(Theming.LINE_SELECTED_COLOR)
        arrow.fill(Theming.LINE_SELECTED_COLOR)
    })
    arrow.on("mouseout", () => {
        if (arrow.flogo_forceHighlighted) return
        const intState = FlogoLang.interpreter.getState()
        if (intState === "running" || intState === "paused") return
        arrow.stroke(Theming.LINE_COLOR)
        arrow.fill(Theming.LINE_COLOR)
    })
}

function fitText(string, maxWidth) {
    const breakCandidates = [' ', '\n', '+', '-', '*', '/', '%', '^', '&', '|', '<', '>', '=', ',']
    let ret = ""
    let w = 0
    for (let i = 0; i < string.length; i++) {
        if (w >= maxWidth && !breakCandidates.includes(string[i])) {
            let lastWrapSpot = ret.length - 1
            while (lastWrapSpot >= 0 && !breakCandidates.includes(ret[lastWrapSpot])) {
                lastWrapSpot--
            }
            if (lastWrapSpot !== -1 && ret[lastWrapSpot] != '\n') {
                if (ret[lastWrapSpot] === ' ') {
                    ret = ret.slice(0, lastWrapSpot) + '\n' + ret.slice(lastWrapSpot + 1) + string[i]
                    w = ret.length - lastWrapSpot - 1
                } else {
                    ret = ret.slice(0, lastWrapSpot + 1) + '\n' + ret.slice(lastWrapSpot + 1) + string[i]
                    w = ret.length - lastWrapSpot - 2
                }
            } else {
                ret += '\n' + string[i]
                w = 0
            }
        } else {
            if (string[i] === ' ' && w >= maxWidth) {
                ret += '\n'
                w = 0
            } else {
                ret += string[i]
                if (string[i] === '\n') {
                    w = 0
                } else {
                    w++
                }
            }
        }
    }
    return ret
}

FlogoLang.Assign.prototype.createDrawable = function() {
    let string
    if (this.variable !== null && this.expression !== null) {
        string = this.variable + " = " + this.expression
    } else {
        string = "Assign"
    }
    if (Theming.BLOCK_TEXT_WRAP_MODE === "new") {
        string = fitText(string, Theming.BLOCK_TEXT_MAX_WIDTH)
    }
    const text = new Konva.Text({
        x: 0,
        y: 0,
        text: string,
        padding: Theming.PADDING_BASE,
        fontSize: Theming.BLOCK_FONT_SIZE,
        fontFamily: Theming.FLOWCHART_FONT,
        fill: Theming.ASSIGN_COLOR3,
        align: "center",
        wrap: Theming.BLOCK_TEXT_WRAP_MODE === "new" ? "none" : "word",
    })
    if (Theming.BLOCK_TEXT_WRAP_MODE !== "new" && text.width() > Theming.BLOCK_TEXT_MAX_WIDTH * Theming.BLOCK_FONT_SIZE) {
        text.width(Theming.BLOCK_TEXT_MAX_WIDTH * Theming.BLOCK_FONT_SIZE)
    }
    const rect = new Konva.Rect({
        x: 0,
        y: 0,
        width: text.width(),
        height: text.height(),
        fill: Theming.ASSIGN_COLOR1,
        stroke: Theming.ASSIGN_COLOR2,
        strokeWidth: Theming.BLOCK_OUTLINE_THICKNESS,
    })
    rect.flogo_originalFill = rect.fill()
    rect.flogo_originalStroke = rect.stroke()
    rect.flogo_text = [text]
    rect.flogo_originalTextColor = text.fill()
    const group = new Konva.Group({
        x: 0,
        y: 0,
    })
    group.add(rect)
    group.add(text)
    group.on("dblclick", e => block_dblclick(this, e, group.flogo_parentInstruction, group.flogo_parentPos))
    group.on("click", e => block_click(this, e, group.flogo_parentInstruction, group.flogo_parentPos))
    group.on("touchstart", e => block_touchstart(this, e, group.flogo_parentInstruction, group.flogo_parentPos))
    group.on("touchend", e => block_touchend(this, e, group.flogo_parentInstruction, group.flogo_parentPos))
    group.flogo_width = rect.width()
    group.flogo_height = rect.height()
    group.flogo_connX = group.flogo_width / 2
    group.flogo_highlightable = rect
    group.flogo_shapeOnly = group
    this.drawable = group
    return group
}

FlogoLang.Input.prototype.createDrawable = function() {
    let string = "Input"
    if (this.variable !== null) {
        string += " " + this.variable
    }
    string = fitText(string, Theming.BLOCK_TEXT_MAX_WIDTH)
    const text = new Konva.Text({
        x: Theming.PADDING_BASE / 2,
        y: 0,
        text: string,
        padding: Theming.PADDING_BASE,
        fontSize: Theming.BLOCK_FONT_SIZE,
        fontFamily: Theming.FLOWCHART_FONT,
        fill: Theming.INPUT_COLOR3,
        align: "center",
        wrap: "none",
    })
    const tw = text.width() + Theming.PADDING_BASE,
        th = text.height()
    const rect = new Konva.Line({
        points: [Theming.PADDING_BASE, 0, tw, 0, tw - Theming.PADDING_BASE, th, 0, th],
        fill: Theming.INPUT_COLOR1,
        stroke: Theming.INPUT_COLOR2,
        strokeWidth: Theming.BLOCK_OUTLINE_THICKNESS,
        closed: true,
    })
    rect.flogo_originalFill = rect.fill()
    rect.flogo_originalStroke = rect.stroke()
    rect.flogo_text = [text]
    rect.flogo_originalTextColor = text.fill()
    const group = new Konva.Group({
        x: 0,
        y: 0,
    })
    group.add(rect)
    group.add(text)
    group.on("dblclick", e => block_dblclick(this, e, group.flogo_parentInstruction, group.flogo_parentPos))
    group.on("click", e => block_click(this, e, group.flogo_parentInstruction, group.flogo_parentPos))
    group.on("touchstart", e => block_touchstart(this, e, group.flogo_parentInstruction, group.flogo_parentPos))
    group.on("touchend", e => block_touchend(this, e, group.flogo_parentInstruction, group.flogo_parentPos))
    group.flogo_width = rect.width()
    group.flogo_height = rect.height()
    group.flogo_connX = group.flogo_width / 2
    group.flogo_highlightable = rect
    group.flogo_shapeOnly = group
    this.drawable = group
    return group
}

FlogoLang.Output.prototype.createDrawable = function() {
    let string = "Output"
    if (!this.newLine) {
        string += "+"
    }
    if (this.expression !== null) {
        string += " " + this.expression
    }
    if (Theming.BLOCK_TEXT_WRAP_MODE === "new") {
        string = fitText(string, Theming.BLOCK_TEXT_MAX_WIDTH)
    }
    const text = new Konva.Text({
        x: Theming.PADDING_BASE / 2,
        y: 0,
        text: string,
        padding: Theming.PADDING_BASE,
        fontSize: Theming.BLOCK_FONT_SIZE,
        fontFamily: Theming.FLOWCHART_FONT,
        fill: Theming.OUTPUT_COLOR3,
        align: "center",
        wrap: Theming.BLOCK_TEXT_WRAP_MODE === "new" ? "none" : "word",
    })
    if (Theming.BLOCK_TEXT_WRAP_MODE !== "new" && text.width() > Theming.BLOCK_TEXT_MAX_WIDTH * Theming.BLOCK_FONT_SIZE) {
        text.width(Theming.BLOCK_TEXT_MAX_WIDTH * Theming.BLOCK_FONT_SIZE)
    }
    const tw = text.width() + Theming.PADDING_BASE,
        th = text.height()
    const rect = new Konva.Line({
        points: [Theming.PADDING_BASE, 0, tw, 0, tw - Theming.PADDING_BASE, th, 0, th],
        fill: Theming.OUTPUT_COLOR1,
        stroke: Theming.OUTPUT_COLOR2,
        strokeWidth: Theming.BLOCK_OUTLINE_THICKNESS,
        closed: true,
    })
    rect.flogo_originalFill = rect.fill()
    rect.flogo_originalStroke = rect.stroke()
    rect.flogo_text = [text]
    rect.flogo_originalTextColor = text.fill()
    const group = new Konva.Group({
        x: 0,
        y: 0,
    })
    group.add(rect)
    group.add(text)
    group.on("dblclick", e => block_dblclick(this, e, group.flogo_parentInstruction, group.flogo_parentPos))
    group.on("click", e => block_click(this, e, group.flogo_parentInstruction, group.flogo_parentPos))
    group.on("touchstart", e => block_touchstart(this, e, group.flogo_parentInstruction, group.flogo_parentPos))
    group.on("touchend", e => block_touchend(this, e, group.flogo_parentInstruction, group.flogo_parentPos))
    group.flogo_width = rect.width()
    group.flogo_height = rect.height()
    group.flogo_connX = group.flogo_width / 2
    group.flogo_highlightable = rect
    group.flogo_shapeOnly = group
    this.drawable = group
    return group
}

FlogoLang.Comment.prototype.createDrawable = function() {
    let string
    if (this.text !== null) {
        string = this.text
    } else {
        string = "Comment"
    }
    if (string.length > Theming.COMMENT_TEXT_MAX_LENGTH) {
        let firstSpace = string.slice(Theming.COMMENT_TEXT_MAX_LENGTH).search(/\s/)
        if (firstSpace !== -1) {
            firstSpace += Theming.COMMENT_TEXT_MAX_LENGTH
            string = string.slice(0, firstSpace) + "..."
        } else {
            string = string.slice(0, Theming.COMMENT_TEXT_MAX_LENGTH) + "..."
        }
    }
    const text = new Konva.Text({
        x: 0,
        y: 0,
        text: string,
        padding: Theming.PADDING_BASE,
        fontSize: Theming.BLOCK_FONT_SIZE,
        fontFamily: Theming.FLOWCHART_FONT,
        fill: Theming.COMMENT_COLOR3,
        align: "center",
    })
    if (text.width() > Theming.COMMENT_TEXT_MAX_WIDTH * Theming.BLOCK_FONT_SIZE) {
        text.width(Theming.COMMENT_TEXT_MAX_WIDTH * Theming.BLOCK_FONT_SIZE)
    }
    const rect = new Konva.Rect({
        x: 0,
        y: 0,
        width: text.width(),
        height: text.height(),
        fill: Theming.COMMENT_COLOR1,
        stroke: Theming.COMMENT_COLOR2,
        strokeWidth: Theming.BLOCK_OUTLINE_THICKNESS,
        dash: [Theming.COMMENT_DASH_LENGTH, Theming.COMMENT_DASH_LENGTH],
    })
    rect.flogo_originalFill = rect.fill()
    rect.flogo_originalStroke = rect.stroke()
    rect.flogo_text = [text]
    rect.flogo_originalTextColor = text.fill()
    const group = new Konva.Group({
        x: 0,
        y: 0,
    })
    group.add(rect)
    group.add(text)
    group.on("dblclick", e => block_dblclick(this, e, group.flogo_parentInstruction, group.flogo_parentPos))
    group.on("click", e => block_click(this, e, group.flogo_parentInstruction, group.flogo_parentPos))
    group.on("touchstart", e => block_touchstart(this, e, group.flogo_parentInstruction, group.flogo_parentPos))
    group.on("touchend", e => block_touchend(this, e, group.flogo_parentInstruction, group.flogo_parentPos))
    group.flogo_width = rect.width()
    group.flogo_height = rect.height()
    group.flogo_connX = group.flogo_width / 2
    group.flogo_highlightable = rect
    group.flogo_shapeOnly = group
    this.drawable = group
    return group
}

FlogoLang.Breakpoint.prototype.createDrawable = function() {
    const tw = Theming.PADDING_BASE * 2 + Theming.BLOCK_FONT_SIZE,
        th = Theming.PADDING_BASE * 2 + Theming.BLOCK_FONT_SIZE
    const rect = new Konva.Line({
        points: [Theming.PADDING_BASE, 0, tw, 0, tw + Theming.PADDING_BASE, th / 2, tw, th, Theming.PADDING_BASE, th, 0, th / 2],
        fill: Theming.BREAKPOINT_COLOR1,
        stroke: Theming.BREAKPOINT_COLOR2,
        strokeWidth: Theming.BLOCK_OUTLINE_THICKNESS,
        closed: true,
    })
    rect.flogo_originalFill = rect.fill()
    rect.flogo_originalStroke = rect.stroke()
    const s1 = new Konva.Rect({
        x: rect.width() / 2 - Theming.BLOCK_FONT_SIZE / 2,
        y: Theming.PADDING_BASE,
        width: Theming.BLOCK_FONT_SIZE / 4,
        height: Theming.BLOCK_FONT_SIZE,
        fill: Theming.BREAKPOINT_COLOR3,
    })
    const s2 = new Konva.Rect({
        x: rect.width() / 2 + Theming.BLOCK_FONT_SIZE / 4,
        y: Theming.PADDING_BASE,
        width: Theming.BLOCK_FONT_SIZE / 4,
        height: Theming.BLOCK_FONT_SIZE,
        fill: Theming.BREAKPOINT_COLOR3,
    })
    rect.flogo_text = [s1, s2]
    rect.flogo_originalTextColor = s1.fill()
    const group = new Konva.Group({
        x: 0,
        y: 0,
    })
    group.add(rect)
    group.add(s1)
    group.add(s2)
    group.on("dblclick", e => block_dblclick(this, e, group.flogo_parentInstruction, group.flogo_parentPos))
    group.on("click", e => block_click(this, e, group.flogo_parentInstruction, group.flogo_parentPos))
    group.on("touchstart", e => block_touchstart(this, e, group.flogo_parentInstruction, group.flogo_parentPos))
    group.on("touchend", e => block_touchend(this, e, group.flogo_parentInstruction, group.flogo_parentPos))
    group.flogo_width = rect.width()
    group.flogo_height = rect.height()
    group.flogo_connX = group.flogo_width / 2
    group.flogo_highlightable = rect
    group.flogo_shapeOnly = group
    this.drawable = group
    return group
}

FlogoLang.InstructionSequence.prototype.createDrawable = function(skipFirstArrow = false, skipLastArrow = false) {
    const contents = []
    let maxW = 0
    for (let idx = 0; idx < this.body.length; idx++) {
        const i = this.body[idx]
        const b = i.createDrawable()
        b.flogo_parentInstruction = this
        b.flogo_parentPos = idx
        if (b.flogo_width > maxW) maxW = b.flogo_width
        contents.push(b)
    }
    const group = new Konva.Group({
        x: 0,
        y: 0,
    })
    let y = 0
    if (!skipFirstArrow) {
        y += Theming.SPACE_BETWEEN_INSTRUCTIONS
    }
    let minX = +Infinity,
        maxX = -Infinity
    for (let i = 0; i < contents.length; i++) {
        const b = contents[i]
        group.add(b)
        b.position({
            x: maxW / 2 - b.flogo_connX,
            y: y
        })
        if (b.x() < minX) minX = b.x()
        if (b.flogo_width + b.x() > maxX) maxX = b.flogo_width + b.x()
        y += b.flogo_height + Theming.SPACE_BETWEEN_INSTRUCTIONS
    }
    if (skipLastArrow) y -= Theming.SPACE_BETWEEN_INSTRUCTIONS
    if (contents.length === 0) {
        maxW = 0
    } else {
        maxW = maxX - minX
        contents.forEach(b => b.x(b.x() - minX))
    }
    group.flogo_width = maxW
    group.flogo_height = y
    group.flogo_connX = contents.length === 0 ? 0 : contents[0].x() + contents[0].flogo_connX
    if (!skipFirstArrow) {
        const a = new Konva.Arrow({
            x: group.flogo_connX,
            y: 0,
            points: [0, 0, 0, Theming.SPACE_BETWEEN_INSTRUCTIONS],
            pointerLength: Theming.LINE_ARROW_SIZE,
            pointerWidth: Theming.LINE_ARROW_SIZE,
            fill: Theming.LINE_COLOR,
            stroke: Theming.LINE_COLOR,
            strokeWidth: Theming.LINE_THICKNESS,
            hitStrokeWidth: Theming.LINE_THICKNESS + Theming.LINE_HITBOX_EXTRA,
        })
        a.on("click tap", e => dispatchInsert(this, 0, e, a))
        makeArrowHighlightable(a)
        group.add(a)
    }
    let n = contents.length
    if (n > 0) {
        group.flogo_nextArrowStartYOffset = contents[n - 1].flogo_nextArrowStartYOffset
    }
    if (skipLastArrow) n--
    for (let i = 0; i < n; i++) {
        const b = contents[i]
        const a = new Konva.Arrow({
            x: b.x() + b.flogo_connX,
            y: b.y() + b.flogo_height,
            points: [0, -(b.flogo_nextArrowStartYOffset ?? 0), 0, Theming.SPACE_BETWEEN_INSTRUCTIONS],
            pointerLength: Theming.LINE_ARROW_SIZE,
            pointerWidth: Theming.LINE_ARROW_SIZE,
            fill: Theming.LINE_COLOR,
            stroke: Theming.LINE_COLOR,
            strokeWidth: Theming.LINE_THICKNESS,
            hitStrokeWidth: Theming.LINE_THICKNESS + Theming.LINE_HITBOX_EXTRA,
        })
        a.on("click tap", e => dispatchInsert(this, i + 1, e, a))
        makeArrowHighlightable(a)
        group.add(a)
    }
    group.flogo_highlightable = null
    group.flogo_shapeOnly = null
    if (this !== FlogoLang.program) {
        this.drawable = group
        return group
    } else {
        const makeRound = string => {
            const text = new Konva.Text({
                x: 0,
                y: 0,
                text: string,
                padding: Theming.PADDING_BASE,
                fontSize: Theming.BLOCK_FONT_SIZE,
                fontFamily: Theming.FLOWCHART_FONT,
                fill: Theming.ROUND_COLOR3,
                align: "center",
            })
            if (text.width() > Theming.BLOCK_TEXT_MAX_WIDTH) {
                text.width(Theming.BLOCK_TEXT_MAX_WIDTH)
            }
            if (text.width() < Theming.ROUND_MIN_WIDTH) {
                text.width(Theming.ROUND_MIN_WIDTH)
            }
            const rect = new Konva.Rect({
                x: 0,
                y: 0,
                width: text.width(),
                height: text.height(),
                fill: Theming.ROUND_COLOR1,
                stroke: Theming.ROUND_COLOR2,
                strokeWidth: Theming.BLOCK_OUTLINE_THICKNESS,
                cornerRadius: Infinity,
            })
            const group = new Konva.Group({
                x: 0,
                y: 0,
            })
            group.add(rect)
            group.add(text)
            group.flogo_width = rect.width()
            group.flogo_height = rect.height()
            return group
        }
        const startBlock = makeRound("Start")
        const endBlock = makeRound("End")
        const mainGroup = new Konva.Group({
            x: 0,
            y: 0,
        })
        mainGroup.add(startBlock)
        mainGroup.add(endBlock)
        mainGroup.add(group)
        if (group.flogo_connX - startBlock.flogo_width / 2 < 0) {
            group.x(startBlock.flogo_width / 2 - group.flogo_connX)
        } else {
            startBlock.x(group.flogo_connX - startBlock.flogo_width / 2)
            endBlock.x(group.flogo_connX - startBlock.flogo_width / 2)
        }
        group.y(startBlock.flogo_height)
        endBlock.y(group.y() + group.flogo_height)
        const leftMostX = Math.min(startBlock.x(), group.x()),
            rightMostX = Math.max(startBlock.x() + startBlock.flogo_width, group.x() + group.flogo_width)
        mainGroup.flogo_width = rightMostX - leftMostX
        mainGroup.flogo_height = endBlock.y() + endBlock.flogo_height
        mainGroup.flogo_connX = startBlock.x() + startBlock.flogo_width / 2
        mainGroup.flogo_highlightable = null
        mainGroup.flogo_shapeOnly = null
        this.drawable = mainGroup
        return mainGroup
    }
}

FlogoLang.If.prototype.createDrawable = function() {
    let string = "If"
    if (this.condition !== null) {
        string = this.condition
    }
    if (Theming.BLOCK_TEXT_WRAP_MODE === "new") {
        string = fitText(string, Theming.BLOCK_TEXT_MAX_WIDTH)
    }
    const text = new Konva.Text({
        x: 0,
        y: 0,
        text: string,
        fontSize: Theming.BLOCK_FONT_SIZE,
        fontFamily: Theming.FLOWCHART_FONT,
        fill: Theming.IF_COLOR3,
        align: "center",
        wrap: Theming.BLOCK_TEXT_WRAP_MODE === "new" ? "none" : "word",
    })
    let rw, rh
    if (Theming.BLOCK_TEXT_WRAP_MODE !== "new" && text.width() > Theming.BLOCK_TEXT_MAX_WIDTH * Theming.BLOCK_FONT_SIZE) {
        text.width(Theming.BLOCK_TEXT_MAX_WIDTH * Theming.BLOCK_FONT_SIZE)
        rw = text.width() * 2
        rh = text.height() * 2
    } else {
        if (string.indexOf("\n") !== -1) {
            rw = text.width() * 2
            rh = text.height() * 2
        } else {
            text.padding(Theming.PADDING_BASE)
            rw = text.width() * 1.5
            rh = text.height() * 1.5
        }
    }
    const tw = text.width(),
        th = text.height()
    const rect = new Konva.Line({
        points: [rw / 2, 0, rw, rh / 2, rw / 2, rh, 0, rh / 2],
        fill: Theming.IF_COLOR1,
        stroke: Theming.IF_COLOR2,
        strokeWidth: Theming.BLOCK_OUTLINE_THICKNESS,
        closed: true,
    })
    rect.flogo_originalFill = rect.fill()
    rect.flogo_originalStroke = rect.stroke()
    rect.flogo_text = [text]
    rect.flogo_originalTextColor = text.fill()
    text.position({
        x: rw / 2 - tw / 2,
        y: rh / 2 - th / 2
    })
    const condition = new Konva.Group({
        x: 0,
        y: 0,
    })
    condition.add(rect)
    condition.add(text)
    condition.flogo_width = rect.width()
    condition.flogo_height = rect.height()
    condition.flogo_connX = rect.width() / 2
    const t = this.trueBranch.createDrawable(true, true)
    const f = this.falseBranch.createDrawable(true, true)
    const minTPad = Theming.LINE_FONT_SIZE * 4,
        minFPad = Theming.LINE_FONT_SIZE * 4
    const group = new Konva.Group({
        x: 0,
        y: 0,
    })
    group.add(condition)
    condition.on("dblclick", e => block_dblclick(this, e, group.flogo_parentInstruction, group.flogo_parentPos))
    condition.on("click", e => block_click(this, e, group.flogo_parentInstruction, group.flogo_parentPos))
    condition.on("touchstart", e => block_touchstart(this, e, group.flogo_parentInstruction, group.flogo_parentPos))
    condition.on("touchend", e => block_touchend(this, e, group.flogo_parentInstruction, group.flogo_parentPos))
    group.add(f)
    group.add(t)
    f.position({
        x: 0,
        y: condition.flogo_height + Theming.PADDING_BASE
    })
    if (f.flogo_width - f.flogo_connX + Theming.PADDING_BASE - condition.flogo_width / 2 >= minFPad) {
        condition.x(f.flogo_width - condition.flogo_width / 2 + Theming.PADDING_BASE)
    } else {
        condition.x(f.flogo_connX + minFPad)
    }
    condition.y(0)
    if (t.flogo_connX + Theming.PADDING_BASE - condition.flogo_width / 2 >= minTPad) {
        t.x(condition.x() + condition.flogo_width / 2 + Theming.PADDING_BASE)
    } else {
        t.x(condition.x() + condition.flogo_width - t.flogo_connX + minTPad)
    }
    t.y(condition.flogo_height + Theming.PADDING_BASE)
    const endY = Math.max(t.y() + t.flogo_height, f.y() + f.flogo_height) + Theming.SPACE_BETWEEN_INSTRUCTIONS
    if (this.trueBranch.body.length > 0) {
        const tArrowIn = new Konva.Arrow({
            x: condition.x() + condition.flogo_width,
            y: condition.flogo_height / 2,
            points: [0, 0, t.x() + t.flogo_connX - (condition.x() + condition.flogo_width), 0, t.x() + t.flogo_connX - (condition.x() + condition.flogo_width), condition.flogo_height / 2 + Theming.PADDING_BASE],
            pointerLength: Theming.LINE_ARROW_SIZE,
            pointerWidth: Theming.LINE_ARROW_SIZE,
            fill: Theming.LINE_COLOR,
            stroke: Theming.LINE_COLOR,
            strokeWidth: Theming.LINE_THICKNESS,
            hitStrokeWidth: Theming.LINE_THICKNESS + Theming.LINE_HITBOX_EXTRA,
        })
        tArrowIn.on("click tap", e => dispatchInsert(this.trueBranch, 0, e, tArrowIn))
        makeArrowHighlightable(tArrowIn)
        group.add(tArrowIn)
        const tArrowOut = new Konva.Arrow({
            x: t.x() + t.flogo_connX,
            y: t.y() + t.flogo_height,
            points: [0, -(t.flogo_nextArrowStartYOffset ?? 0), 0, endY - (t.y() + t.flogo_height), -(t.flogo_connX + (t.x() - (condition.x() + condition.flogo_width / 2))), endY - (t.y() + t.flogo_height)],
            pointerLength: Theming.LINE_ARROW_SIZE,
            pointerWidth: Theming.LINE_ARROW_SIZE,
            fill: Theming.LINE_COLOR,
            stroke: Theming.LINE_COLOR,
            strokeWidth: Theming.LINE_THICKNESS,
            hitStrokeWidth: Theming.LINE_THICKNESS + Theming.LINE_HITBOX_EXTRA,
        })
        tArrowOut.on("click tap", e => dispatchInsert(this.trueBranch, this.trueBranch.body.length, e, tArrowOut))
        makeArrowHighlightable(tArrowOut)
        group.add(tArrowOut)
    } else {
        const tArrowLoop = new Konva.Arrow({
            x: condition.x() + condition.flogo_width,
            y: condition.flogo_height / 2,
            points: [0, -(t.flogo_nextArrowStartYOffset ?? 0), t.flogo_connX + minTPad, 0, t.flogo_connX + minTPad, endY - condition.flogo_height / 2, -condition.flogo_width / 2, endY - condition.flogo_height / 2],
            pointerLength: Theming.LINE_ARROW_SIZE,
            pointerWidth: Theming.LINE_ARROW_SIZE,
            fill: Theming.LINE_COLOR,
            stroke: Theming.LINE_COLOR,
            strokeWidth: Theming.LINE_THICKNESS,
            hitStrokeWidth: Theming.LINE_THICKNESS + Theming.LINE_HITBOX_EXTRA,
        })
        tArrowLoop.on("click tap", e => dispatchInsert(this.trueBranch, 0, e, tArrowLoop))
        makeArrowHighlightable(tArrowLoop)
        group.add(tArrowLoop)
    }
    if (this.falseBranch.body.length > 0) {
        const fArrowIn = new Konva.Arrow({
            x: condition.x(),
            y: condition.flogo_height / 2,
            points: [0, 0, -(condition.x() - f.flogo_connX), 0, -(condition.x() - f.flogo_connX), condition.flogo_height / 2 + Theming.PADDING_BASE],
            pointerLength: Theming.LINE_ARROW_SIZE,
            pointerWidth: Theming.LINE_ARROW_SIZE,
            fill: Theming.LINE_COLOR,
            stroke: Theming.LINE_COLOR,
            strokeWidth: Theming.LINE_THICKNESS,
            hitStrokeWidth: Theming.LINE_THICKNESS + Theming.LINE_HITBOX_EXTRA,
        })
        fArrowIn.on("click tap", e => dispatchInsert(this.falseBranch, 0, e, fArrowIn))
        makeArrowHighlightable(fArrowIn)
        group.add(fArrowIn)
        const fArrowOut = new Konva.Arrow({
            x: f.x() + f.flogo_connX,
            y: f.y() + f.flogo_height,
            points: [0, -(f.flogo_nextArrowStartYOffset ?? 0), 0, endY - (f.y() + f.flogo_height), condition.x() - f.flogo_connX + condition.flogo_width / 2, endY - (f.y() + f.flogo_height)],
            pointerLength: Theming.LINE_ARROW_SIZE,
            pointerWidth: Theming.LINE_ARROW_SIZE,
            fill: Theming.LINE_COLOR,
            stroke: Theming.LINE_COLOR,
            strokeWidth: Theming.LINE_THICKNESS,
            hitStrokeWidth: Theming.LINE_THICKNESS + Theming.LINE_HITBOX_EXTRA,
        })
        fArrowOut.on("click tap", e => dispatchInsert(this.falseBranch, this.falseBranch.body.length, e, fArrowOut))
        makeArrowHighlightable(fArrowOut)
        group.add(fArrowOut)
    } else {
        const fArrowLoop = new Konva.Arrow({
            x: condition.x(),
            y: condition.flogo_height / 2,
            points: [
                0,
                0,
                -(f.flogo_width - f.flogo_connX + minFPad),
                0,
                -(f.flogo_width - f.flogo_connX + minFPad),
                endY - condition.flogo_height / 2,
                condition.x() + condition.flogo_width / 2 - minFPad,
                endY - condition.flogo_height / 2,
            ],
            pointerLength: Theming.LINE_ARROW_SIZE,
            pointerWidth: Theming.LINE_ARROW_SIZE,
            fill: Theming.LINE_COLOR,
            stroke: Theming.LINE_COLOR,
            strokeWidth: Theming.LINE_THICKNESS,
            hitStrokeWidth: Theming.LINE_THICKNESS + Theming.LINE_HITBOX_EXTRA,
        })
        fArrowLoop.on("click tap", e => dispatchInsert(this.falseBranch, 0, e, fArrowLoop))
        makeArrowHighlightable(fArrowLoop)
        group.add(fArrowLoop)
    }
    const fText = new Konva.Text({
        x: 0,
        y: condition.flogo_height / 2 - Theming.LINE_FONT_SIZE - Theming.LINE_THICKNESS / 2,
        text: "False",
        fontSize: Theming.LINE_FONT_SIZE,
        fontFamily: Theming.FLOWCHART_FONT,
        fill: Theming.LINE_COLOR,
    })
    fText.x(condition.x() - fText.width())
    group.add(fText)
    const tText = new Konva.Text({
        x: condition.x() + condition.flogo_width,
        y: condition.flogo_height / 2 - Theming.LINE_FONT_SIZE - Theming.LINE_THICKNESS / 2,
        text: "True",
        fontSize: Theming.LINE_FONT_SIZE,
        fontFamily: Theming.FLOWCHART_FONT,
        fill: Theming.LINE_COLOR,
    })
    group.add(tText)
    group.flogo_width = t.x() + t.flogo_width
    group.flogo_height = endY
    group.flogo_connX = condition.x() + condition.flogo_width / 2
    group.flogo_highlightable = rect
    group.flogo_shapeOnly = condition
    this.drawable = group
    return group
}

FlogoLang.DoWhile.prototype.createDrawable = function() {
    let string = "Do-While"
    if (this.condition !== null) {
        string = this.condition
    }
    if (Theming.BLOCK_TEXT_WRAP_MODE === "new") {
        string = fitText(string, Theming.BLOCK_TEXT_MAX_WIDTH)
    }
    const text = new Konva.Text({
        x: Theming.PADDING_BASE / 2,
        y: 0,
        text: string,
        padding: Theming.PADDING_BASE,
        fontSize: Theming.BLOCK_FONT_SIZE,
        fontFamily: Theming.FLOWCHART_FONT,
        fill: Theming.DOWHILE_COLOR3,
        align: "center",
        wrap: Theming.BLOCK_TEXT_WRAP_MODE === "new" ? "none" : "word",
    })
    if (Theming.BLOCK_TEXT_WRAP_MODE !== "new" && text.width() > Theming.BLOCK_TEXT_MAX_WIDTH * Theming.BLOCK_FONT_SIZE) {
        text.width(Theming.BLOCK_TEXT_MAX_WIDTH * Theming.BLOCK_FONT_SIZE)
    }
    const tw = text.width(),
        th = text.height()
    const rect = new Konva.Line({
        points: [Theming.PADDING_BASE, 0, tw, 0, tw + Theming.PADDING_BASE, th / 2, tw, th, Theming.PADDING_BASE, th, 0, th / 2],
        fill: Theming.DOWHILE_COLOR1,
        stroke: Theming.DOWHILE_COLOR2,
        strokeWidth: Theming.BLOCK_OUTLINE_THICKNESS,
        closed: true,
    })
    rect.flogo_originalFill = rect.fill()
    rect.flogo_originalStroke = rect.stroke()
    rect.flogo_text = [text]
    rect.flogo_originalTextColor = text.fill()
    const condition = new Konva.Group({
        x: 0,
        y: 0,
    })
    condition.add(rect)
    condition.add(text)
    condition.flogo_width = rect.width()
    condition.flogo_height = rect.height()
    const b = this.body.createDrawable(true, true)
    const group = new Konva.Group({
        x: 0,
        y: 0,
    })
    group.add(condition)
    condition.on("dblclick", e => block_dblclick(this, e, group.flogo_parentInstruction, group.flogo_parentPos))
    condition.on("click", e => block_click(this, e, group.flogo_parentInstruction, group.flogo_parentPos))
    condition.on("touchstart", e => block_touchstart(this, e, group.flogo_parentInstruction, group.flogo_parentPos))
    condition.on("touchend", e => block_touchend(this, e, group.flogo_parentInstruction, group.flogo_parentPos))
    group.add(b)
    if (b.flogo_connX >= condition.flogo_width / 2) {
        b.x(condition.flogo_width / 2 + Theming.PADDING_BASE)
    } else {
        b.x(condition.flogo_width + Theming.PADDING_BASE - b.flogo_connX)
    }
    b.y(Theming.SPACE_BETWEEN_INSTRUCTIONS)
    condition.x(0)
    if (this.body.body.length > 0) {
        if (condition.flogo_height >= Theming.SPACE_BETWEEN_INSTRUCTIONS) {
            condition.y(b.y() + b.flogo_height + Theming.PADDING_BASE * 2)
        } else {
            condition.y(b.y() + b.flogo_height + Theming.SPACE_BETWEEN_INSTRUCTIONS + condition.flogo_height)
        }
        const arrowIn = new Konva.Arrow({
            x: condition.flogo_width / 2,
            y: 0,
            points: [0, 0, b.x() + b.flogo_connX - condition.flogo_width / 2, 0, b.x() + b.flogo_connX - condition.flogo_width / 2, Theming.SPACE_BETWEEN_INSTRUCTIONS],
            pointerLength: Theming.LINE_ARROW_SIZE,
            pointerWidth: Theming.LINE_ARROW_SIZE,
            fill: Theming.LINE_COLOR,
            stroke: Theming.LINE_COLOR,
            strokeWidth: Theming.LINE_THICKNESS,
            hitStrokeWidth: Theming.LINE_THICKNESS + Theming.LINE_HITBOX_EXTRA,
        })
        arrowIn.on("click tap", e => dispatchInsert(this.body, 0, e, arrowIn))
        makeArrowHighlightable(arrowIn)
        group.add(arrowIn)
        const arrowToCond = new Konva.Arrow({
            x: b.x() + b.flogo_connX,
            y: b.y() + b.flogo_height,
            points: [0, -(b.flogo_nextArrowStartYOffset ?? 0), 0, condition.y() + condition.flogo_height / 2 - (b.y() + b.flogo_height), -(b.x() + b.flogo_connX - (condition.x() + condition.flogo_width)), condition.y() + condition.flogo_height / 2 - (b.y() + b.flogo_height)],
            pointerLength: Theming.LINE_ARROW_SIZE,
            pointerWidth: Theming.LINE_ARROW_SIZE,
            fill: Theming.LINE_COLOR,
            stroke: Theming.LINE_COLOR,
            strokeWidth: Theming.LINE_THICKNESS,
            hitStrokeWidth: Theming.LINE_THICKNESS + Theming.LINE_HITBOX_EXTRA,
        })
        arrowToCond.on("click tap", e => dispatchInsert(this.body, this.body.body.length, e, arrowToCond))
        makeArrowHighlightable(arrowToCond)
        group.add(arrowToCond)
    } else {
        condition.y(b.y())
        const loopArrow = new Konva.Arrow({
            x: condition.flogo_width / 2,
            y: 0,
            points: [
                0,
                0,
                condition.flogo_width / 2 + b.flogo_connX + Theming.PADDING_BASE,
                0,
                condition.flogo_width / 2 + b.flogo_connX + Theming.PADDING_BASE,
                condition.y() + condition.flogo_height / 2,
                condition.flogo_width / 2,
                condition.y() + condition.flogo_height / 2,
            ],
            pointerLength: Theming.LINE_ARROW_SIZE,
            pointerWidth: Theming.LINE_ARROW_SIZE,
            fill: Theming.LINE_COLOR,
            stroke: Theming.LINE_COLOR,
            strokeWidth: Theming.LINE_THICKNESS,
            hitStrokeWidth: Theming.LINE_THICKNESS + Theming.LINE_HITBOX_EXTRA,
        })
        loopArrow.on("click tap", e => dispatchInsert(this.body, 0, e, loopArrow))
        makeArrowHighlightable(loopArrow)
        group.add(loopArrow)
    }
    const arrowToTop = new Konva.Arrow({
        x: condition.flogo_width / 2,
        y: condition.y(),
        points: [0, 0, 0, -condition.y()],
        pointerLength: Theming.LINE_ARROW_SIZE,
        pointerWidth: Theming.LINE_ARROW_SIZE,
        fill: Theming.LINE_COLOR,
        stroke: Theming.LINE_COLOR,
        strokeWidth: Theming.LINE_THICKNESS,
        hitStrokeWidth: Theming.LINE_THICKNESS + Theming.LINE_HITBOX_EXTRA,
    })
    group.add(arrowToTop)
    const fText = new Konva.Text({
        x: 0,
        y: condition.y() + condition.flogo_height + Theming.BLOCK_OUTLINE_THICKNESS,
        text: "False",
        fontSize: Theming.LINE_FONT_SIZE,
        fontFamily: Theming.FLOWCHART_FONT,
        fill: Theming.LINE_COLOR,
    })
    fText.x(condition.flogo_width / 2 - fText.width() - Theming.LINE_THICKNESS / 2 - Theming.LINE_FONT_SIZE / 4)
    group.add(fText)
    const tText = new Konva.Text({
        x: 0,
        y: condition.y() - Theming.LINE_FONT_SIZE,
        text: "True",
        fontSize: Theming.LINE_FONT_SIZE,
        fontFamily: Theming.FLOWCHART_FONT,
        fill: Theming.LINE_COLOR,
    })
    tText.x(condition.flogo_width / 2 - tText.width() - Theming.LINE_THICKNESS / 2 - Theming.LINE_FONT_SIZE / 4)
    group.add(tText)
    group.flogo_width = b.x() + b.flogo_width
    group.flogo_height = condition.y() + condition.flogo_height
    group.flogo_connX = condition.flogo_width / 2
    if (fText.x() < 0) {
        const diff = condition.x() - fText.x()
        group.children.forEach(e => {
            e.x(e.x() + diff)
        })
        group.flogo_width += diff
        group.flogo_connX += diff
    }
    if (tText.x() < 0) {
        const diff = condition.x() - tText.x()
        group.children.forEach(e => {
            e.x(e.x() + diff)
        })
        group.flogo_width += diff
        group.flogo_connX += diff
    }
    group.flogo_highlightable = rect
    group.flogo_shapeOnly = condition
    this.drawable = group
    return group
}

FlogoLang.While.prototype.createDrawable = function() {
    let string = "While"
    if (this.condition !== null) {
        string = this.condition
    }
    if (Theming.BLOCK_TEXT_WRAP_MODE === "new") {
        string = fitText(string, Theming.BLOCK_TEXT_MAX_WIDTH)
    }
    const text = new Konva.Text({
        x: Theming.PADDING_BASE / 2,
        y: 0,
        text: string,
        padding: Theming.PADDING_BASE,
        fontSize: Theming.BLOCK_FONT_SIZE,
        fontFamily: Theming.FLOWCHART_FONT,
        fill: Theming.WHILE_COLOR3,
        align: "center",
        wrap: Theming.BLOCK_TEXT_WRAP_MODE === "new" ? "none" : "word",
    })
    if (Theming.BLOCK_TEXT_WRAP_MODE !== "new" && text.width() > Theming.BLOCK_TEXT_MAX_WIDTH * Theming.BLOCK_FONT_SIZE) {
        text.width(Theming.BLOCK_TEXT_MAX_WIDTH * Theming.BLOCK_FONT_SIZE)
    }
    const tw = text.width(),
        th = text.height()
    const rect = new Konva.Line({
        points: [Theming.PADDING_BASE, 0, tw, 0, tw + Theming.PADDING_BASE, th / 2, tw, th, Theming.PADDING_BASE, th, 0, th / 2],
        fill: Theming.WHILE_COLOR1,
        stroke: Theming.WHILE_COLOR2,
        strokeWidth: Theming.BLOCK_OUTLINE_THICKNESS,
        closed: true,
    })
    rect.flogo_originalFill = rect.fill()
    rect.flogo_originalStroke = rect.stroke()
    rect.flogo_text = [text]
    rect.flogo_originalTextColor = text.fill()
    const condition = new Konva.Group({
        x: 0,
        y: 0,
    })
    condition.add(rect)
    condition.add(text)
    condition.flogo_width = rect.width()
    condition.flogo_height = rect.height()
    const b = this.body.createDrawable(true, true)
    const group = new Konva.Group({
        x: 0,
        y: 0,
    })
    group.add(condition)
    condition.on("dblclick", e => block_dblclick(this, e, group.flogo_parentInstruction, group.flogo_parentPos))
    condition.on("click", e => block_click(this, e, group.flogo_parentInstruction, group.flogo_parentPos))
    condition.on("touchstart", e => block_touchstart(this, e, group.flogo_parentInstruction, group.flogo_parentPos))
    condition.on("touchend", e => block_touchend(this, e, group.flogo_parentInstruction, group.flogo_parentPos))
    group.add(b)
    const minBPad = Theming.LINE_FONT_SIZE * 3
    if (condition.flogo_width / 2 + Theming.PADDING_BASE * 2 + b.flogo_connX >= condition.flogo_width + minBPad) {
        b.x(condition.flogo_width / 2 + Theming.PADDING_BASE * 2)
    } else {
        b.x(condition.flogo_width + (minBPad - b.flogo_connX))
    }
    b.y(condition.flogo_height + Theming.PADDING_BASE)
    const endY = b.y() + b.flogo_height + Theming.SPACE_BETWEEN_INSTRUCTIONS + Theming.PADDING_BASE
    if (this.body.body.length > 0) {
        const arrowIn = new Konva.Arrow({
            x: condition.flogo_width,
            y: condition.flogo_height / 2,
            points: [0, 0, b.x() - condition.flogo_width + b.flogo_connX, 0, b.x() - condition.flogo_width + b.flogo_connX, condition.flogo_height / 2 + Theming.PADDING_BASE],
            pointerLength: Theming.LINE_ARROW_SIZE,
            pointerWidth: Theming.LINE_ARROW_SIZE,
            fill: Theming.LINE_COLOR,
            stroke: Theming.LINE_COLOR,
            strokeWidth: Theming.LINE_THICKNESS,
            hitStrokeWidth: Theming.LINE_THICKNESS + Theming.LINE_HITBOX_EXTRA,
        })
        arrowIn.on("click tap", e => dispatchInsert(this.body, 0, e, arrowIn))
        makeArrowHighlightable(arrowIn)
        group.add(arrowIn)
        const arrowToTop = new Konva.Arrow({
            x: b.x() + b.flogo_connX,
            y: b.y() + b.flogo_height,
            points: [
                0,
                -(b.flogo_nextArrowStartYOffset ?? 0),
                0,
                Theming.SPACE_BETWEEN_INSTRUCTIONS,
                -(b.x() + b.flogo_connX) + condition.flogo_width / 2 + Theming.PADDING_BASE,
                Theming.SPACE_BETWEEN_INSTRUCTIONS,
                -(b.x() + b.flogo_connX) + condition.flogo_width / 2 + Theming.PADDING_BASE,
                -(b.flogo_height + Theming.PADDING_BASE),
            ],
            pointerLength: Theming.LINE_ARROW_SIZE,
            pointerWidth: Theming.LINE_ARROW_SIZE,
            fill: Theming.LINE_COLOR,
            stroke: Theming.LINE_COLOR,
            strokeWidth: Theming.LINE_THICKNESS,
            hitStrokeWidth: Theming.LINE_THICKNESS + Theming.LINE_HITBOX_EXTRA,
        })
        arrowToTop.on("click tap", e => dispatchInsert(this.body, this.body.body.length, e, arrowToTop))
        makeArrowHighlightable(arrowToTop)
        group.add(arrowToTop)
    } else {
        const loopArrow = new Konva.Arrow({
            x: condition.flogo_width,
            y: condition.flogo_height / 2,
            points: [
                0,
                0,
                b.flogo_connX + minBPad,
                0,
                b.flogo_connX + minBPad,
                condition.flogo_height / 2 + Theming.SPACE_BETWEEN_INSTRUCTIONS,
                -condition.flogo_width / 2 + Theming.PADDING_BASE,
                condition.flogo_height / 2 + Theming.SPACE_BETWEEN_INSTRUCTIONS,
                -condition.flogo_width / 2 + Theming.PADDING_BASE,
                condition.flogo_height / 2,
            ],
            pointerLength: Theming.LINE_ARROW_SIZE,
            pointerWidth: Theming.LINE_ARROW_SIZE,
            fill: Theming.LINE_COLOR,
            stroke: Theming.LINE_COLOR,
            strokeWidth: Theming.LINE_THICKNESS,
            hitStrokeWidth: Theming.LINE_THICKNESS + Theming.LINE_HITBOX_EXTRA,
        })
        loopArrow.on("click tap", e => dispatchInsert(this.body, 0, e, loopArrow))
        makeArrowHighlightable(loopArrow)
        group.add(loopArrow)
    }
    group.flogo_nextArrowStartYOffset = endY - condition.flogo_height
    const fText = new Konva.Text({
        x: 0,
        y: condition.flogo_height + Theming.BLOCK_OUTLINE_THICKNESS,
        text: "False",
        fontSize: Theming.LINE_FONT_SIZE,
        fontFamily: Theming.FLOWCHART_FONT,
        fill: Theming.LINE_COLOR,
    })
    fText.x(condition.flogo_width / 2 - fText.width() - Theming.LINE_THICKNESS / 2 - Theming.LINE_FONT_SIZE / 4)
    group.add(fText)
    const tText = new Konva.Text({
        x: condition.x() + condition.flogo_width,
        y: condition.flogo_height / 2 - Theming.LINE_FONT_SIZE - Theming.LINE_THICKNESS / 2,
        text: "True",
        fontSize: Theming.LINE_FONT_SIZE,
        fontFamily: Theming.FLOWCHART_FONT,
        fill: Theming.LINE_COLOR,
    })
    group.add(tText)
    group.flogo_width = b.x() + b.flogo_width
    group.flogo_height = endY
    group.flogo_connX = condition.flogo_width / 2
    if (fText.x() < 0) {
        const diff = condition.x() - fText.x()
        group.children.forEach(e => {
            e.x(e.x() + diff)
        })
        group.flogo_width += diff
        group.flogo_connX += diff
    }
    group.flogo_highlightable = rect
    group.flogo_shapeOnly = condition
    this.drawable = group
    return group
}

FlogoLang.For.prototype.createDrawable = function() {
    let string = "For"
    if (this.variable !== null && this.from !== null && this.to !== null && this.step !== null && this.direction !== null) {
        string = this.variable + " = " + this.from + " to " + this.to
        if (this.step !== "1") string += " step " + this.step
        if (this.direction !== "up") string += " " + this.direction
    }
    if (Theming.BLOCK_TEXT_WRAP_MODE === "new") {
        string = fitText(string, Theming.BLOCK_TEXT_MAX_WIDTH)
    }
    const text = new Konva.Text({
        x: Theming.PADDING_BASE / 2,
        y: 0,
        text: string,
        padding: Theming.PADDING_BASE,
        fontSize: Theming.BLOCK_FONT_SIZE,
        fontFamily: Theming.FLOWCHART_FONT,
        fill: Theming.FOR_COLOR3,
        align: "center",
        wrap: Theming.BLOCK_TEXT_WRAP_MODE === "new" ? "none" : "word",
    })
    if (Theming.BLOCK_TEXT_WRAP_MODE !== "new" && text.width() > Theming.BLOCK_TEXT_MAX_WIDTH * Theming.BLOCK_FONT_SIZE) {
        text.width(Theming.BLOCK_TEXT_MAX_WIDTH * Theming.BLOCK_FONT_SIZE)
    }
    const tw = text.width(),
        th = text.height()
    const rect = new Konva.Line({
        points: [Theming.PADDING_BASE, 0, tw, 0, tw + Theming.PADDING_BASE, th / 2, tw, th, Theming.PADDING_BASE, th, 0, th / 2],
        fill: Theming.FOR_COLOR1,
        stroke: Theming.FOR_COLOR2,
        strokeWidth: Theming.BLOCK_OUTLINE_THICKNESS,
        closed: true,
    })
    rect.flogo_originalFill = rect.fill()
    rect.flogo_originalStroke = rect.stroke()
    rect.flogo_text = [text]
    rect.flogo_originalTextColor = text.fill()
    const condition = new Konva.Group({
        x: 0,
        y: 0,
    })
    condition.add(rect)
    condition.add(text)
    condition.flogo_width = rect.width()
    condition.flogo_height = rect.height()
    const b = this.body.createDrawable(true, true)
    const group = new Konva.Group({
        x: 0,
        y: 0,
    })
    group.add(condition)
    condition.on("dblclick", e => block_dblclick(this, e, group.flogo_parentInstruction, group.flogo_parentPos))
    condition.on("click", e => block_click(this, e, group.flogo_parentInstruction, group.flogo_parentPos))
    condition.on("touchstart", e => block_touchstart(this, e, group.flogo_parentInstruction, group.flogo_parentPos))
    condition.on("touchend", e => block_touchend(this, e, group.flogo_parentInstruction, group.flogo_parentPos))
    group.add(b)
    const minBPad = Theming.LINE_FONT_SIZE * 3
    if (condition.flogo_width / 2 + Theming.PADDING_BASE * 2 + b.flogo_connX >= condition.flogo_width + minBPad) {
        b.x(condition.flogo_width / 2 + Theming.PADDING_BASE * 2)
    } else {
        b.x(condition.flogo_width + (minBPad - b.flogo_connX))
    }
    b.y(condition.flogo_height + Theming.PADDING_BASE)
    const endY = b.y() + b.flogo_height + Theming.SPACE_BETWEEN_INSTRUCTIONS + Theming.PADDING_BASE
    if (this.body.body.length > 0) {
        const arrowIn = new Konva.Arrow({
            x: condition.flogo_width,
            y: condition.flogo_height / 2,
            points: [0, 0, b.x() - condition.flogo_width + b.flogo_connX, 0, b.x() - condition.flogo_width + b.flogo_connX, condition.flogo_height / 2 + Theming.PADDING_BASE],
            pointerLength: Theming.LINE_ARROW_SIZE,
            pointerWidth: Theming.LINE_ARROW_SIZE,
            fill: Theming.LINE_COLOR,
            stroke: Theming.LINE_COLOR,
            strokeWidth: Theming.LINE_THICKNESS,
            hitStrokeWidth: Theming.LINE_THICKNESS + Theming.LINE_HITBOX_EXTRA,
        })
        arrowIn.on("click tap", e => dispatchInsert(this.body, 0, e, arrowIn))
        makeArrowHighlightable(arrowIn)
        group.add(arrowIn)
        const arrowToTop = new Konva.Arrow({
            x: b.x() + b.flogo_connX,
            y: b.y() + b.flogo_height,
            points: [
                0,
                -(b.flogo_nextArrowStartYOffset ?? 0),
                0,
                Theming.SPACE_BETWEEN_INSTRUCTIONS,
                -(b.x() + b.flogo_connX) + condition.flogo_width / 2 + Theming.PADDING_BASE,
                Theming.SPACE_BETWEEN_INSTRUCTIONS,
                -(b.x() + b.flogo_connX) + condition.flogo_width / 2 + Theming.PADDING_BASE,
                -(b.flogo_height + Theming.PADDING_BASE),
            ],
            pointerLength: Theming.LINE_ARROW_SIZE,
            pointerWidth: Theming.LINE_ARROW_SIZE,
            fill: Theming.LINE_COLOR,
            stroke: Theming.LINE_COLOR,
            strokeWidth: Theming.LINE_THICKNESS,
            hitStrokeWidth: Theming.LINE_THICKNESS + Theming.LINE_HITBOX_EXTRA,
        })
        arrowToTop.on("click tap", e => dispatchInsert(this.body, this.body.body.length, e, arrowToTop))
        makeArrowHighlightable(arrowToTop)
        group.add(arrowToTop)
    } else {
        const loopArrow = new Konva.Arrow({
            x: condition.flogo_width,
            y: condition.flogo_height / 2,
            points: [
                0,
                0,
                b.flogo_connX + minBPad,
                0,
                b.flogo_connX + minBPad,
                condition.flogo_height / 2 + Theming.SPACE_BETWEEN_INSTRUCTIONS,
                -condition.flogo_width / 2 + Theming.PADDING_BASE,
                condition.flogo_height / 2 + Theming.SPACE_BETWEEN_INSTRUCTIONS,
                -condition.flogo_width / 2 + Theming.PADDING_BASE,
                condition.flogo_height / 2,
            ],
            pointerLength: Theming.LINE_ARROW_SIZE,
            pointerWidth: Theming.LINE_ARROW_SIZE,
            fill: Theming.LINE_COLOR,
            stroke: Theming.LINE_COLOR,
            strokeWidth: Theming.LINE_THICKNESS,
            hitStrokeWidth: Theming.LINE_THICKNESS + Theming.LINE_HITBOX_EXTRA,
        })
        loopArrow.on("click tap", e => dispatchInsert(this.body, 0, e, loopArrow))
        makeArrowHighlightable(loopArrow)
        group.add(loopArrow)
    }
    group.flogo_nextArrowStartYOffset = endY - condition.flogo_height
    const fText = new Konva.Text({
        x: 0,
        y: condition.flogo_height + Theming.BLOCK_OUTLINE_THICKNESS,
        text: "Done",
        fontSize: Theming.LINE_FONT_SIZE,
        fontFamily: Theming.FLOWCHART_FONT,
        fill: Theming.LINE_COLOR,
    })
    fText.x(condition.flogo_width / 2 - fText.width() - Theming.LINE_THICKNESS / 2 - Theming.LINE_FONT_SIZE / 4)
    group.add(fText)
    const tText = new Konva.Text({
        x: condition.x() + condition.flogo_width,
        y: condition.flogo_height / 2 - Theming.LINE_FONT_SIZE - Theming.LINE_THICKNESS / 2,
        text: "Next",
        fontSize: Theming.LINE_FONT_SIZE,
        fontFamily: Theming.FLOWCHART_FONT,
        fill: Theming.LINE_COLOR,
    })
    group.add(tText)
    group.flogo_width = b.x() + b.flogo_width
    group.flogo_height = endY
    group.flogo_connX = condition.flogo_width / 2
    if (fText.x() < 0) {
        const diff = condition.x() - fText.x()
        group.children.forEach(e => {
            e.x(e.x() + diff)
        })
        group.flogo_width += diff
        group.flogo_connX += diff
    }
    group.flogo_highlightable = rect
    group.flogo_shapeOnly = condition
    this.drawable = group
    return group
}

FlogoLang.Move.prototype.createDrawable = function() {
    let string = ""
    if (this.expression === null || this.draw === null) {
        string = "Move/Draw"
    } else {
        if (this.draw === true) {
            string += "Draw"
        } else {
            string += "Move"
        }
        string += " " + this.expression
    }
    if (Theming.BLOCK_TEXT_WRAP_MODE === "new") {
        string = fitText(string, Theming.BLOCK_TEXT_MAX_WIDTH)
    }
    const text = new Konva.Text({
        x: Theming.PADDING_BASE / 2,
        y: 0,
        text: string,
        padding: Theming.PADDING_BASE,
        fontSize: Theming.BLOCK_FONT_SIZE,
        fontFamily: Theming.FLOWCHART_FONT,
        fill: Theming.TURTLE_MOVE_COLOR3,
        align: "center",
        wrap: Theming.BLOCK_TEXT_WRAP_MODE === "new" ? "none" : "word",
    })
    if (Theming.BLOCK_TEXT_WRAP_MODE !== "new" && text.width() > Theming.BLOCK_TEXT_MAX_WIDTH * Theming.BLOCK_FONT_SIZE) {
        text.width(Theming.BLOCK_TEXT_MAX_WIDTH * Theming.BLOCK_FONT_SIZE)
    }
    const th = text.height()
    let tw = text.width()
    let colorPreview = null
    if (this.draw === true && this.expression !== null) {
        colorPreview = new Konva.Rect({
            x: tw + Theming.PADDING_BASE / 2,
            y: th / 2 - Theming.BLOCK_FONT_SIZE / 2,
            width: Theming.BLOCK_FONT_SIZE,
            height: Theming.BLOCK_FONT_SIZE,
            fill: Theming.TURTLE_PALETTE[this.color < 0 || this.color >= Theming.TURTLE_PALETTE.length ? 0 : this.color],
            stroke: Theming.TURTLE_MOVE_COLOR2,
            strokeWidth: Theming.BLOCK_OUTLINE_THICKNESS
        })
        tw += Theming.BLOCK_FONT_SIZE + Theming.PADDING_BASE
    }
    const rect = new Konva.Line({
        points: [0, 0, tw, 0, tw + Theming.PADDING_BASE, th / 2, tw, th, 0, th, Theming.PADDING_BASE, th / 2],
        fill: Theming.TURTLE_MOVE_COLOR1,
        stroke: Theming.TURTLE_MOVE_COLOR2,
        strokeWidth: Theming.BLOCK_OUTLINE_THICKNESS,
        closed: true,
    })
    rect.flogo_originalFill = rect.fill()
    rect.flogo_originalStroke = rect.stroke()
    rect.flogo_text = [text]
    rect.flogo_originalTextColor = text.fill()
    const group = new Konva.Group({
        x: 0,
        y: 0,
    })
    group.add(rect)
    group.add(text)
    if (colorPreview !== null) {
        group.add(colorPreview)
    }
    group.on("dblclick", e => block_dblclick(this, e, group.flogo_parentInstruction, group.flogo_parentPos))
    group.on("click", e => block_click(this, e, group.flogo_parentInstruction, group.flogo_parentPos))
    group.on("touchstart", e => block_touchstart(this, e, group.flogo_parentInstruction, group.flogo_parentPos))
    group.on("touchend", e => block_touchend(this, e, group.flogo_parentInstruction, group.flogo_parentPos))
    group.flogo_width = rect.width()
    group.flogo_height = rect.height()
    group.flogo_connX = group.flogo_width / 2
    group.flogo_highlightable = rect
    group.flogo_shapeOnly = group
    this.drawable = group
    return group
}

FlogoLang.Turn.prototype.createDrawable = function() {
    let string = "Turn"
    const complete = this.expression !== null && this.directories !== null
    if (complete) {
        string += " " + this.expression
    }
    if (Theming.BLOCK_TEXT_WRAP_MODE === "new") {
        string = fitText(string, Theming.BLOCK_TEXT_MAX_WIDTH)
    }
    const text = new Konva.Text({
        x: 0,
        y: -Theming.PADDING_BASE / 2,
        text: string,
        padding: Theming.PADDING_BASE * 1.25,
        fontSize: Theming.BLOCK_FONT_SIZE,
        fontFamily: Theming.FLOWCHART_FONT,
        fill: Theming.TURTLE_TURN_COLOR3,
        align: "center",
        wrap: Theming.BLOCK_TEXT_WRAP_MODE === "new" ? "none" : "word",
    })
    if (Theming.BLOCK_TEXT_WRAP_MODE !== "new" && text.width() > Theming.BLOCK_TEXT_MAX_WIDTH * Theming.BLOCK_FONT_SIZE) {
        text.width(Theming.BLOCK_TEXT_MAX_WIDTH * Theming.BLOCK_FONT_SIZE)
    }
    const tw = text.width(),
        th = text.height()
    const padding_1_5 = Theming.PADDING_BASE * 1.5
    let points
    if (complete) {
        switch (this.direction) {
            case "cw":
                points = [0, Theming.PADDING_BASE, tw, Theming.PADDING_BASE, tw, 0, tw + padding_1_5, (Theming.PADDING_BASE + th) / 2, tw, th + Theming.PADDING_BASE, tw, th, 0, th]
                break
            case "ccw":
                points = [padding_1_5, Theming.PADDING_BASE, tw + padding_1_5, Theming.PADDING_BASE, tw + padding_1_5, th, padding_1_5, th, padding_1_5, th + Theming.PADDING_BASE, 0, (Theming.PADDING_BASE + th) / 2, padding_1_5, 0]
                text.x(padding_1_5)
                break
        }
    } else {
        points = [padding_1_5, Theming.PADDING_BASE, tw + padding_1_5, Theming.PADDING_BASE, tw + padding_1_5, 0, tw + 2 * padding_1_5, (Theming.PADDING_BASE + th) / 2, tw + padding_1_5, th + Theming.PADDING_BASE, tw + padding_1_5, th, padding_1_5, th, padding_1_5, th + Theming.PADDING_BASE, 0, (Theming.PADDING_BASE + th) / 2, padding_1_5, 0]
        text.x(padding_1_5)
    }
    const rect = new Konva.Line({
        x: 0,
        y: -Theming.PADDING_BASE,
        points: points,
        fill: Theming.TURTLE_TURN_COLOR1,
        stroke: Theming.TURTLE_TURN_COLOR2,
        strokeWidth: Theming.BLOCK_OUTLINE_THICKNESS,
        closed: true,
    })
    rect.flogo_originalFill = rect.fill()
    rect.flogo_originalStroke = rect.stroke()
    rect.flogo_text = [text]
    rect.flogo_originalTextColor = text.fill()
    const group = new Konva.Group({
        x: 0,
        y: 0,
    })
    group.add(rect)
    group.add(text)
    group.on("dblclick", e => block_dblclick(this, e, group.flogo_parentInstruction, group.flogo_parentPos))
    group.on("click", e => block_click(this, e, group.flogo_parentInstruction, group.flogo_parentPos))
    group.on("touchstart", e => block_touchstart(this, e, group.flogo_parentInstruction, group.flogo_parentPos))
    group.on("touchend", e => block_touchend(this, e, group.flogo_parentInstruction, group.flogo_parentPos))
    group.flogo_width = rect.width()
    group.flogo_height = rect.height() - 2 * Theming.PADDING_BASE
    group.flogo_connX = group.flogo_width / 2
    group.flogo_highlightable = rect
    group.flogo_shapeOnly = group
    this.drawable = group
    return group
}

FlogoLang.Home.prototype.createDrawable = function() {
    let string = "Home"
    if (Theming.BLOCK_TEXT_WRAP_MODE === "new") {
        string = fitText(string, Theming.BLOCK_TEXT_MAX_WIDTH)
    }
    const text = new Konva.Text({
        x: 0,
        y: Theming.PADDING_BASE / 2,
        text: string,
        padding: Theming.PADDING_BASE,
        fontSize: Theming.BLOCK_FONT_SIZE,
        fontFamily: Theming.FLOWCHART_FONT,
        fill: Theming.TURTLE_HOME_COLOR3,
        align: "center",
        wrap: Theming.BLOCK_TEXT_WRAP_MODE === "new" ? "none" : "word",
    })
    if (Theming.BLOCK_TEXT_WRAP_MODE !== "new" && text.width() > Theming.BLOCK_TEXT_MAX_WIDTH * Theming.BLOCK_FONT_SIZE) {
        text.width(Theming.BLOCK_TEXT_MAX_WIDTH * Theming.BLOCK_FONT_SIZE)
    }
    const tw = text.width(),
        th = text.height()
    const rect = new Konva.Line({
        points: [0, Theming.PADDING_BASE, tw / 2, 0, tw, Theming.PADDING_BASE, tw, th + Theming.PADDING_BASE / 2, 0, th + Theming.PADDING_BASE / 2],
        fill: Theming.TURTLE_HOME_COLOR1,
        stroke: Theming.TURTLE_HOME_COLOR2,
        strokeWidth: Theming.BLOCK_OUTLINE_THICKNESS,
        closed: true,
    })
    rect.flogo_originalFill = rect.fill()
    rect.flogo_originalStroke = rect.stroke()
    rect.flogo_text = [text]
    rect.flogo_originalTextColor = text.fill()
    const group = new Konva.Group({
        x: 0,
        y: 0,
    })
    group.add(rect)
    group.add(text)
    group.on("dblclick", e => block_dblclick(this, e, group.flogo_parentInstruction, group.flogo_parentPos))
    group.on("click", e => block_click(this, e, group.flogo_parentInstruction, group.flogo_parentPos))
    group.on("touchstart", e => block_touchstart(this, e, group.flogo_parentInstruction, group.flogo_parentPos))
    group.on("touchend", e => block_touchend(this, e, group.flogo_parentInstruction, group.flogo_parentPos))
    group.flogo_width = rect.width()
    group.flogo_height = rect.height()
    group.flogo_connX = group.flogo_width / 2
    group.flogo_highlightable = rect
    group.flogo_shapeOnly = group
    this.drawable = group
    return group
}

function dispatchEdit(instruction, evt, parent, posInParent) {
    if (stage.isDragging()) {
        stage.stopDrag()
    }
    callbacks.ui_edit(instruction, evt, parent, posInParent)
}

function dispatchEdit2(instruction, evt, parent, posInParent) {
    if (stage.isDragging()) {
        stage.stopDrag()
    }
    callbacks.ui_edit2(instruction, evt, parent, posInParent)
}

function dispatchInsert(instruction, pos, evt, arrow) {
    const intState = FlogoLang.interpreter.getState()
    if (intState === "running" || intState === "paused") return
    const ctrlKey = Platform.isMac ? (evt.evt.ctrlKey || evt.evt.metaKey) : evt.evt.ctrlKey
    if (!ctrlKey) {
        cancelSelection()
    }
    arrow.flogo_forceHighlighted = true
    arrow.stroke(Theming.LINE_SELECTED_COLOR)
    arrow.fill(Theming.LINE_SELECTED_COLOR)
    const callback = () => {
        arrow.flogo_forceHighlighted = false
        arrow.stroke(Theming.LINE_COLOR)
        arrow.fill(Theming.LINE_COLOR)
    }
    callbacks.ui_insert(instruction, pos, evt, callback)
}

let selectedInstructions = []
let touchMultiselectMode = false

export function getSelectedInstructions() {
    return selectedInstructions
}

export function startTouchMultiSelect() {
    touchMultiselectMode = true
}

export function isTouchMultiSelectEnabled() {
    return touchMultiselectMode
}

export function cancelSelection() {
    selectedInstructions.forEach(i => selectionMode_deselect_rec(i))
    selectedInstructions = []
    touchMultiselectMode = false
}

function selectionMode_sanityCheck() {
    if (selectedInstructions.length === 0) return true
    //a selection is valid if all the instructions have the same parent
    const parentInstruction = selectedInstructions[0].drawable.flogo_parentInstruction
    for (let i = 1; i < selectedInstructions.length; i++) {
        if (selectedInstructions[i].drawable.flogo_parentInstruction !== parentInstruction) return false
    }
    //unless the program is malformed, the parent is guaranteed to be an InstructionSequence, so we sort the selected instructions in case the user has selected them in non-sequential order
    selectedInstructions.sort((a, b) => a.drawable.flogo_parentPos - b.drawable.flogo_parentPos)
    return true
}

function selectionMode_select_rec(i) {
    if (Array.isArray(i)) {
        i.forEach(i => selectionMode_select_rec(i))
    } else {
        if (i.drawable.flogo_highlightable !== null) {
            if (Theming.SELECTED_COLOR1 !== "keep") i.drawable.flogo_highlightable.stroke(Theming.SELECTED_COLOR1)
            if (Theming.SELECTED_COLOR2 !== "keep") i.drawable.flogo_highlightable.fill(Theming.SELECTED_COLOR2)
            if (Theming.SELECTED_COLOR3 !== "keep") i.drawable.flogo_highlightable.flogo_text.forEach(e => {
                e.fill(Theming.SELECTED_COLOR3)
            })
        }
        if (typeof i.trueBranch !== "undefined") selectionMode_select_rec(i.trueBranch)
        if (typeof i.falseBranch !== "undefined") selectionMode_select_rec(i.falseBranch)
        if (typeof i.body !== "undefined") selectionMode_select_rec(i.body)
    }
}

function selectionMode_deselect_rec(i) {
    if (Array.isArray(i)) {
        i.forEach(i => selectionMode_deselect_rec(i))
    } else {
        if (typeof i.drawable !== "undefined" && i.drawable.flogo_highlightable !== null) {
            i.drawable.flogo_highlightable.stroke(i.drawable.flogo_highlightable.flogo_originalStroke)
            i.drawable.flogo_highlightable.fill(i.drawable.flogo_highlightable.flogo_originalFill)
            i.drawable.flogo_highlightable.flogo_text.forEach(e => {
                e.fill(i.drawable.flogo_highlightable.flogo_originalTextColor)
            })
        }
        if (typeof i.trueBranch !== "undefined") selectionMode_deselect_rec(i.trueBranch)
        if (typeof i.falseBranch !== "undefined") selectionMode_deselect_rec(i.falseBranch)
        if (typeof i.body !== "undefined") selectionMode_deselect_rec(i.body)
    }
}

export function selectInstruction(instr, single) {
    if (single) {
        if (selectedInstructions.length === 1 && selectedInstructions[0] === instr) return
        selectedInstructions.forEach(i => selectionMode_deselect_rec(i))
        selectedInstructions = [instr]
    } else {
        if (selectedInstructions.includes(instr)) return
        selectedInstructions.push(instr)
        if (!selectionMode_sanityCheck()) {
            selectedInstructions.forEach(i => selectionMode_deselect_rec(i))
            selectedInstructions = [instr]
        }
    }
    selectionMode_select_rec(instr)
}

export function deselectInstruction(instr) {
    if (!selectedInstructions.includes(instr)) return
    selectedInstructions.splice(selectedInstructions.indexOf(instr), 1)
    selectionMode_deselect_rec(instr)
    if (selectedInstructions.length === 0) {
        cancelSelection()
    }
}

export function selectAllInstructions() {
    cancelSelection()
    FlogoLang.program.body.forEach(i => {
        selectInstruction(i, false)
    })
}

export function copySelectedInstructions() {
    if (selectedInstructions.length === 0) return
    const saved = []
    selectedInstructions.forEach(i => saved.push(i.toSimpleObject()))
    Platform.clipboard.write(saved)
    cancelSelection()
    return saved.length
}

export function deleteSelectedInstructions() {
    if (selectedInstructions.length === 0) return 0
    const ret = selectedInstructions.length
    selectedInstructions.forEach(i => i.drawable.flogo_parentInstruction.body.splice(i.drawable.flogo_parentInstruction.body.indexOf(i), 1))
    History.commit()
    cancelSelection()
    update()
    return ret
}

export function cutSelectedInstructions() {
    if (selectedInstructions.length === 0) return 0
    const saved = []
    selectedInstructions.forEach(i => {
        saved.push(i.toSimpleObject())
        i.drawable.flogo_parentInstruction.body.splice(i.drawable.flogo_parentInstruction.body.indexOf(i), 1)
    })
    Platform.clipboard.write(saved)
    History.commit()
    cancelSelection()
    update()
    return saved.length
}

export function pasteClipboard(parent, posInParent) {
    if (Platform.clipboard.isEmpty()) return
    const saved = Platform.clipboard.read()
    const instructionTypes = FlogoLang.getInstructionTypes()
    for (let i = 0; i < saved.length; i++) {
        parent.body.splice(posInParent + i, 0, instructionTypes[saved[i].type].fromSimpleObject(saved[i]))
    }
    History.commit()
    cancelSelection()
    update()
    return saved.length
}

function block_dblclick(instr, e, parentInstr, parentPos) {
    const intState = FlogoLang.interpreter.getState()
    if (intState === "running" || intState === "paused") return
    const ctrlKey = Platform.isMac ? (e.evt.ctrlKey || e.evt.metaKey) : e.evt.ctrlKey
    if (ctrlKey) return
    if (e.evt.button === 2) return
    dispatchEdit(instr, e, parentInstr, parentPos)
}

function block_click(instr, e, parentInstr, parentPos) {
    const intState = FlogoLang.interpreter.getState()
    if (intState === "running" || intState === "paused") return
    const rightClick = e.type === "click" && e.evt.button === 2
    const ctrlKey = Platform.isMac ? (e.evt.ctrlKey || e.evt.metaKey) : e.evt.ctrlKey
    if (rightClick) {
        if (!selectedInstructions.includes(instr)) {
            selectInstruction(instr, !ctrlKey)
        }
        dispatchEdit2(instr, e, parentInstr, parentPos)
    } else {
        if (touchMultiselectMode) {
            if (!selectedInstructions.includes(instr)) {
                selectInstruction(instr, false)
            } else {
                deselectInstruction(instr)
            }
        } else {
            if (!selectedInstructions.includes(instr)) {
                selectInstruction(instr, !ctrlKey)
            } else {
                if (!ctrlKey) {
                    selectInstruction(instr, true)
                } else {
                    deselectInstruction(instr)
                }
            }
        }
    }
}

function block_tap(instr, e, parentInstr, parentPos) {
    const intState = FlogoLang.interpreter.getState()
    if (intState === "running" || intState === "paused") return
    if (touchMultiselectMode) {
        if (!selectedInstructions.includes(instr)) {
            selectInstruction(instr, false)
        } else {
            deselectInstruction(instr)
        }
    } else {
        dispatchEdit(instr, e, parentInstr, parentPos)
    }
}

let longPressTimeout = null
let touchStartPos = null

function block_touchstart(instr, e, parentInstr, parentPos) {
    const intState = FlogoLang.interpreter.getState()
    if (intState === "running" || intState === "paused") return
    if (longPressTimeout !== null) {
        clearTimeout(longPressTimeout)
    }
    longPressTimeout = setTimeout(() => {
        longPressTimeout = null
        if (!stage.isDragging()) {
            try {
                navigator.vibrate(70)
            } catch (e) {}
            if (touchMultiselectMode) {
                if (!selectedInstructions.includes(instr)) {
                    selectInstruction(instr)
                }
            }
            dispatchEdit2(instr, e, parentInstr, parentPos)
        }
    }, 400)
    touchStartPos = stage.position()
}

function block_touchend(instr, e, parentInstr, parentPos) {
    const intState = FlogoLang.interpreter.getState()
    if (intState === "running" || intState === "paused") return
    if (longPressTimeout !== null) {
        clearTimeout(longPressTimeout)
        longPressTimeout = null
        const touchEndPos = stage.position()
        if (Math.sqrt((touchEndPos.x - touchStartPos.x) ** 2 + (touchEndPos.y - touchStartPos.y) ** 2) < 20) {
            block_tap(instr, e, parentInstr, parentPos)
        }
    }
}

let cullingEnabled = true

function cull_rec(instruction, parentCoords, cameraViewRect) {
    if (typeof instruction.drawable === "undefined") return
    const coords = {
        x: parentCoords.x + instruction.drawable.x(),
        y: parentCoords.y + instruction.drawable.y(),
        width: instruction.flogo_width,
        height: instruction.flogo_height
    }
    if (Konva.Util.haveIntersection(coords, cameraViewRect)) {
        if (!instruction.drawable.visible()) {
            instruction.drawable.visible(true)
        }
        if (instruction.type === "InstructionSequence") {
            instruction.body.forEach(i => cull_rec(i, coords, cameraViewRect))
        } else {
            if (typeof instruction.body !== "undefined") {
                cull_rec(instruction.body, coords, cameraViewRect)
            }
            if (typeof instruction.trueBranch !== "undefined") {
                cull_rec(instruction.trueBranch, coords, cameraViewRect)
            }
            if (typeof instruction.falseBranch !== "undefined") {
                cull_rec(instruction.falseBranch, coords, cameraViewRect)
            }
        }
    } else {
        if (instruction.drawable.visible()) {
            instruction.drawable.visible(false)
        }
    }
}

let prevCameraViewRect = null

function doCulling(forced = false) {
    if (!cullingEnabled) return
    const cameraViewRect = {
        x: -stage.x() / stage.scaleX(),
        y: -stage.y() / stage.scaleY(),
        width: stage.width() / stage.scaleX(),
        height: stage.height() / stage.scaleY()
    }
    if (forced || JSON.stringify(prevCameraViewRect) !== JSON.stringify(cameraViewRect)) {
        prevCameraViewRect = cameraViewRect
        if (typeof cameraViewRect !== "undefined") {
            const origin = {
                x: 0,
                y: 0
            }
            cull_rec(FlogoLang.program, origin, cameraViewRect)
        }
    }
}

export function setCulling(enabled) {
    if (enabled) {
        cullingEnabled = true
        prevCameraViewRect = null
    } else {
        cullingEnabled = false
        if (typeof blockLayer !== "undefined") {
            update()
        }
    }
}

export function isCullingEnabled() {
    return cullingEnabled
}

let stage = null
let blockLayer, scrollbarsLayer

let FLOWCHART_OCCLUDED_ON_TOP = 0

export function init() {
    if (stage !== null) throw "Already initialized"
    stage = new Konva.Stage({
        container: "flowchartArea",
        draggable: true,
    })
    blockLayer = new Konva.Layer()
    stage.add(blockLayer)
    scrollbarsLayer = new Konva.Layer()
    stage.add(scrollbarsLayer)
    const vbar = new Konva.Rect({
        draggable: true,
        cornerRadius: Infinity,
        dragBoundFunc: function(pos) {
            pos.x = stage.width() - Theming.SCROLLBAR_PADDING - Theming.SCROLLBAR_THICKNESS
            if (pos.y < Theming.SCROLLBAR_PADDING + Theming.SCROLLBAR_THICKNESS + FLOWCHART_OCCLUDED_ON_TOP) pos.y = Theming.SCROLLBAR_PADDING + Theming.SCROLLBAR_THICKNESS + FLOWCHART_OCCLUDED_ON_TOP
            if (pos.y + vbar.height() * stage.scaleY() > stage.height() - Theming.SCROLLBAR_PADDING - Theming.SCROLLBAR_THICKNESS)
                pos.y = stage.height() - Theming.SCROLLBAR_PADDING - Theming.SCROLLBAR_THICKNESS - vbar.height() * stage.scaleY()
            return pos
        },
    })
    const hbar = new Konva.Rect({
        draggable: true,
        cornerRadius: Infinity,
        dragBoundFunc: function(pos) {
            if (pos.x < Theming.SCROLLBAR_PADDING + Theming.SCROLLBAR_THICKNESS) pos.x = Theming.SCROLLBAR_PADDING + Theming.SCROLLBAR_THICKNESS
            if (pos.x + hbar.width() * stage.scaleX() > stage.width() - Theming.SCROLLBAR_PADDING - Theming.SCROLLBAR_THICKNESS)
                pos.x = stage.width() - Theming.SCROLLBAR_PADDING - Theming.SCROLLBAR_THICKNESS - hbar.width() * stage.scaleX()
            pos.y = stage.height() - Theming.SCROLLBAR_PADDING - Theming.SCROLLBAR_THICKNESS
            return pos
        },
    })
    scrollbarsLayer.add(vbar)
    scrollbarsLayer.add(hbar)
    let bounds = null
    const resizeFun = () => {
        if (window.devicePixelRatio !== blockLayer.getCanvas().getPixelRatio()) {
            blockLayer.getCanvas().setPixelRatio(window.devicePixelRatio)
        }
        const b = stage.container().getBoundingClientRect()
        if (bounds === null || b.width !== bounds.width || b.height !== bounds.height) {
            stage.size({
                width: b.width,
                height: b.height
            })
            if (bounds !== null) {
                let dx = b.width - bounds.width
                stage.x(stage.x() + dx / 2)
            }
            /*if(FlogoLang.interpreter.currentInstruction!==null){
                 *                ensureInstructionVisibleInFlowchart(FlogoLang.interpreter.currentInstruction)
            }*/
            bounds = b
        }
        requestAnimationFrame(resizeFun)
    }
    resizeFun()
    const boundsFun = () => {
        const minVis = Theming.PADDING_BASE * 2
        const stageTop = stage.y(),
            stageLeft = stage.x(),
            stageBottom = stage.y() + stage.flogo_realHeight * stage.scaleY(),
            stageRight = stage.x() + stage.flogo_realWidth * stage.scaleX()
        const playY = stageBottom - stageTop + minVis - stage.height() + FLOWCHART_OCCLUDED_ON_TOP
        if (playY > 0) {
            const minY = -(stageBottom - stageTop) + stage.height() - minVis * 2
            if (stageTop < minY) {
                stage.y(minY)
            }
            if (stageTop > minVis + FLOWCHART_OCCLUDED_ON_TOP) {
                stage.y(minVis + FLOWCHART_OCCLUDED_ON_TOP)
            }
            vbar.show()
        } else {
            stage.y(Theming.PADDING_BASE + FLOWCHART_OCCLUDED_ON_TOP)
            vbar.hide()
        }
        const playX = stageRight - stageLeft - stage.width() + minVis * 4
        const chartMidX = (stage.flogo_realWidth * stage.scaleX()) / 2
        if (playX > 0) {
            const midX = stage.width() / 2
            const minX = midX - playX / 2 - minVis * 2,
                maxX = midX + playX / 2 + minVis * 2
            const stageMidX = (stageLeft + stageRight) / 2
            if (stageMidX < minX) {
                stage.x(minX - chartMidX)
            } else if (stageMidX > maxX) {
                stage.x(maxX - chartMidX)
            }
            hbar.show()
        } else {
            stage.x(stage.width() / 2 - chartMidX)
            hbar.hide()
        }
        requestAnimationFrame(boundsFun)
    }
    boundsFun()
    stage.on("wheel", e => {
        const ctrlKey = Platform.isMac ? (e.evt.ctrlKey || e.evt.metaKey) : e.evt.ctrlKey
        if (ctrlKey) return
        stage.position({
            x: stage.x() - e.evt.deltaX / 2,
            y: stage.y() - e.evt.deltaY / 2
        })
    })
    stage.on("click", e => {
        const ctrlKey = Platform.isMac ? (e.evt.ctrlKey || e.evt.metaKey) : e.evt.ctrlKey
        if (ctrlKey) return
        if (e.target === stage) {
            cancelSelection()
        }
    })
    stage.on("contextmenu", e => {
        e.evt.preventDefault()
    })
    //pinch zoom (adapted from konva documentation)
    Konva.hitOnDragEnabled = true
    const getDistance = (p1, p2) => Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2))
    const getCenter = (p1, p2) => {
        return {
            x: (p1.x + p2.x) / 2,
            y: (p1.y + p2.y) / 2,
        }
    }
    let lastCenter = null
    let lastDist = 0
    let dragStopped = false
    stage.on("touchmove", e => {
        e.evt.preventDefault()
        if (e.evt.touches.length !== 2) return
        if (longPressTimeout !== null) {
            clearTimeout(longPressTimeout)
            longPressTimeout = null
        }
        const touch1 = e.evt.touches[0]
        const touch2 = e.evt.touches[1]
        if (touch1 && !touch2 && !stage.isDragging() && dragStopped) {
            stage.startDrag()
            dragStopped = false
        }
        if (touch1 && touch2) {
            if (stage.isDragging()) {
                dragStopped = true
                stage.stopDrag()
            }
            const p1 = {
                x: touch1.clientX,
                y: touch1.clientY,
            }
            const p2 = {
                x: touch2.clientX,
                y: touch2.clientY,
            }
            if (!lastCenter) {
                lastCenter = getCenter(p1, p2)
                return
            }
            const newCenter = getCenter(p1, p2)
            const dist = getDistance(p1, p2)
            if (!lastDist) {
                lastDist = dist
            }
            const pointTo = {
                x: (newCenter.x - stage.x()) / stage.scaleX(),
                y: (newCenter.y - stage.y()) / stage.scaleY(),
            }
            let scale = stage.scaleX() * (dist / lastDist)
            setZoom(scale)
            scale = stage.scaleX()
            const dx = newCenter.x - lastCenter.x
            const dy = newCenter.y - lastCenter.y
            stage.position({
                x: newCenter.x - pointTo.x * scale + dx,
                y: newCenter.y - pointTo.y * scale + dy,
            })
            lastDist = dist
            lastCenter = newCenter
        }
    })
    stage.on("touchend", () => {
        lastDist = 0
        lastCenter = null
        if (longPressTimeout !== null) {
            clearTimeout(longPressTimeout)
            longPressTimeout = null
        }
    })
    let prevHighlightInstr = null,
        prevIntState = "stopped"
    const highlightFun = () => {
        const i = FlogoLang.interpreter.currentInstruction,
            intState = FlogoLang.interpreter.getState()
        if ((intState === "running" || intState === "paused") && (prevIntState === "stopped" || prevIntState === "crashed")) {
            //when the program is started, make sure that all arrows are reset their original color, in case the user has the mouse over an arrow and presses the run button with the keyboard
            const resetArrows_rec = i => {
                if (typeof i.children !== "undefined") {
                    i.children.forEach(i => resetArrows_rec(i))
                } else {
                    if (i instanceof Konva.Arrow) {
                        i.stroke(Theming.LINE_COLOR)
                    }
                }
            }
            resetArrows_rec(blockLayer)
        }
        if (prevHighlightInstr !== i) {
            if (prevHighlightInstr !== null && prevHighlightInstr.drawable.flogo_highlightable !== null) {
                prevHighlightInstr.drawable.flogo_highlightable.fill(prevHighlightInstr.drawable.flogo_highlightable.flogo_originalFill)
                prevHighlightInstr.drawable.flogo_highlightable.stroke(prevHighlightInstr.drawable.flogo_highlightable.flogo_originalStroke)
                prevHighlightInstr.drawable.flogo_highlightable.flogo_text.forEach(e => {
                    e.fill(prevHighlightInstr.drawable.flogo_highlightable.flogo_originalTextColor)
                })
            }
            if (i !== null && i.drawable.flogo_highlightable !== null) {
                if (intState === "crashed") {
                    if (Theming.ERROR_COLOR1 !== "keep") i.drawable.flogo_highlightable.fill(Theming.ERROR_COLOR1)
                    if (Theming.ERROR_COLOR2 !== "keep") i.drawable.flogo_highlightable.stroke(Theming.ERROR_COLOR2)
                    if (Theming.ERROR_COLOR3 !== "keep") i.drawable.flogo_highlightable.flogo_text.forEach(e => {
                        e.fill(Theming.ERROR_COLOR3)
                    })
                } else {
                    if (Theming.HIGHLIGHT_COLOR1 !== "keep") i.drawable.flogo_highlightable.fill(Theming.HIGHLIGHT_COLOR1)
                    if (Theming.HIGHLIGHT_COLOR2 !== "keep") i.drawable.flogo_highlightable.stroke(Theming.HIGHLIGHT_COLOR2)
                    if (Theming.HIGHLIGHT_COLOR3 !== "keep") i.drawable.flogo_highlightable.flogo_text.forEach(e => {
                        e.fill(Theming.HIGHLIGHT_COLOR3)
                    })
                }
            }
            ensureInstructionVisibleInFlowchart(i)
        }
        prevHighlightInstr = i
        prevIntState = intState
        requestAnimationFrame(highlightFun)
    }
    highlightFun()
    let oldScrollbarState = null
    const updateScrollbars = () => {
        const minVis = Theming.PADDING_BASE * 2
        const newScrollbarState = JSON.stringify([
            //TODO: there's probably a better way to detect changes in these
            stage.position(),
            stage.size(),
            stage.flogo_realWidth,
            stage.flogo_realHeight,
            window.devicePixelRatio,
            Theming.SCROLLBAR_COLOR,
            Theming.SCROLLBAR_THICKNESS,
            Theming.SCROLLBAR_PADDING,
        ])
        if (newScrollbarState !== oldScrollbarState) {
            oldScrollbarState = newScrollbarState
            if (vbar.visible()) {
                const realHeight = stage.flogo_realHeight + (minVis * 3 + FLOWCHART_OCCLUDED_ON_TOP) / stage.scaleY()
                let yPos = -((stage.y() - minVis - FLOWCHART_OCCLUDED_ON_TOP) / stage.scaleY()) / (realHeight - stage.height() / stage.scaleY())
                yPos = yPos < 0 ? 0 : yPos > 1 ? 1 : yPos
                vbar.x((stage.width() - stage.x() - Theming.SCROLLBAR_THICKNESS - Theming.SCROLLBAR_PADDING) / stage.scaleX())
                vbar.width(Theming.SCROLLBAR_THICKNESS / stage.scaleX())
                const maxYSize = (stage.height() - FLOWCHART_OCCLUDED_ON_TOP) * 0.9
                let ySize = (500 * ((stage.height() - FLOWCHART_OCCLUDED_ON_TOP) / stage.scaleY())) / realHeight
                ySize = ySize < 20 ? 20 : ySize > maxYSize ? maxYSize : ySize
                vbar.height(ySize / stage.scaleY())
                vbar.y((FLOWCHART_OCCLUDED_ON_TOP + Theming.SCROLLBAR_PADDING + Theming.SCROLLBAR_THICKNESS + yPos * (stage.height() - ySize - 2 * (Theming.SCROLLBAR_PADDING + Theming.SCROLLBAR_THICKNESS) - FLOWCHART_OCCLUDED_ON_TOP) - stage.y()) / stage.scaleY())
                vbar.fill(Theming.SCROLLBAR_COLOR)
                vbar.setHitStrokeWidth(Theming.SCROLLBAR_PADDING)
            }
            if (hbar.visible()) {
                const realWidth = stage.flogo_realWidth + (minVis * 8) / stage.scaleX()
                let xPos = -((stage.x() - minVis * 4) / stage.scaleX()) / (realWidth - stage.width() / stage.scaleX())
                xPos = xPos < 0 ? 0 : xPos > 1 ? 1 : xPos
                hbar.y((stage.height() - stage.y() - Theming.SCROLLBAR_THICKNESS - Theming.SCROLLBAR_PADDING) / stage.scaleY())
                hbar.height(Theming.SCROLLBAR_THICKNESS / stage.scaleY())
                const maxXSize = stage.width() * 0.9
                let xSize = (500 * (stage.width() / stage.scaleX())) / realWidth
                xSize = xSize < 20 ? 20 : xSize > maxXSize ? maxXSize : xSize
                hbar.width(xSize / stage.scaleX())
                hbar.x((Theming.SCROLLBAR_PADDING + Theming.SCROLLBAR_THICKNESS + xPos * (stage.width() - xSize - 2 * (Theming.SCROLLBAR_PADDING + Theming.SCROLLBAR_THICKNESS)) - stage.x()) / stage.scaleX())
                hbar.fill(Theming.SCROLLBAR_COLOR)
                hbar.setHitStrokeWidth(Theming.SCROLLBAR_PADDING)
            }
        }
        requestAnimationFrame(updateScrollbars)
    }
    let yDragOff = 0,
        xDragOff = 0
    vbar.on("dragmove", e => {
        const minVis = Theming.PADDING_BASE * 2
        const y = Utils.extractCoordFromEvent(e.evt, "clientY", 0) - yDragOff - blockLayer.getCanvas()._canvas.getBoundingClientRect().top - FLOWCHART_OCCLUDED_ON_TOP
        const yTop = Theming.SCROLLBAR_PADDING + Theming.SCROLLBAR_THICKNESS,
            yBottom = stage.height() - (Theming.SCROLLBAR_PADDING + Theming.SCROLLBAR_THICKNESS) - vbar.height() * stage.scaleY()
        let yPos = (y - yTop) / (yBottom - yTop - FLOWCHART_OCCLUDED_ON_TOP)
        yPos = yPos < 0 ? 0 : yPos > 1 ? 1 : yPos
        const h = stage.flogo_realHeight * stage.scaleY() + minVis * 3 - stage.height() + FLOWCHART_OCCLUDED_ON_TOP
        yPos *= h
        stage.y(-yPos + minVis + FLOWCHART_OCCLUDED_ON_TOP)
    })
    vbar.on("dragstart", e => {
        yDragOff = Utils.extractCoordFromEvent(e.evt, "clientY", 0) - (vbar.y() * stage.scaleY() + stage.y()) - blockLayer.getCanvas()._canvas.getBoundingClientRect().top
    })
    hbar.on("dragmove", e => {
        const minVis = Theming.PADDING_BASE * 2
        const x = Utils.extractCoordFromEvent(e.evt, "clientX", 0) - xDragOff - blockLayer.getCanvas()._canvas.getBoundingClientRect().left
        const xLeft = Theming.SCROLLBAR_PADDING + Theming.SCROLLBAR_THICKNESS,
            xRight = stage.width() - (Theming.SCROLLBAR_PADDING + Theming.SCROLLBAR_THICKNESS) - hbar.width() * stage.scaleX()
        let xPos = (x - xLeft) / (xRight - xLeft)
        xPos = xPos < 0 ? 0 : xPos > 1 ? 1 : xPos
        const w = stage.flogo_realWidth * stage.scaleX() + minVis * 8 - stage.width()
        xPos *= w
        stage.x(-xPos + minVis * 4)
    })
    hbar.on("dragstart", e => {
        xDragOff = Utils.extractCoordFromEvent(e.evt, "clientX", 0) - (hbar.x() * stage.scaleX() + stage.x()) - blockLayer.getCanvas()._canvas.getBoundingClientRect().left
    })
    stage.on("dragstart dragmove dragend", e => {
        if (e.target === vbar || e.target === hbar) {
            e.evt.preventDefault()
        }
    })
    updateScrollbars()
    const updateCulling = () => {
        doCulling()
        requestAnimationFrame(updateCulling)
    }
    updateCulling()
}

export function ensureInstructionVisibleInFlowchart(i) {
    if (i !== null && i.drawable.flogo_highlightable !== null && !stage.isDragging()) {
        let ipos = i.drawable.flogo_highlightable.absolutePosition()
        const x = ipos.x + i.drawable.flogo_highlightable.width() * stage.scaleX()
        const y = ipos.y + i.drawable.flogo_highlightable.height() * stage.scaleY()
        if (x + Theming.PADDING_BASE >= stage.width()) {
            const diff = x - stage.width() + i.drawable.flogo_highlightable.width() * stage.scaleX()
            stage.x(stage.x() - diff)
        }
        if (y + Theming.PADDING_BASE >= stage.height()) {
            const diff = y - stage.height() + i.drawable.flogo_highlightable.height() * stage.scaleY()
            stage.y(stage.y() - diff)
        }
        ipos = i.drawable.flogo_highlightable.absolutePosition()
        if (ipos.x < 0) {
            stage.x(stage.x() - ipos.x + Theming.PADDING_BASE)
        }
        if (ipos.y < 0) {
            stage.y(stage.y() - ipos.y + Theming.PADDING_BASE)
        }
    }
}

let prevFlowchartWidth = 0

export function update(resetCamera = false) {
    blockLayer.destroyChildren()
    const i = FlogoLang.program.createDrawable()
    stage.flogo_realWidth = i.flogo_width
    stage.flogo_realHeight = i.y() + i.flogo_height
    prevFlowchartWidth = i.flogo_width * stage.scaleX()
    blockLayer.add(i)
    if (resetCamera) {
        setZoom(1)
        setCamera(stage.width() / 2 - i.flogo_connX, Theming.PADDING_BASE + FLOWCHART_OCCLUDED_ON_TOP)
    } else {
        doCulling(true)
    }
}

export function setZoom(zoom) {
    if (isNaN(zoom)) zoom = 1
    zoom = zoom < 0.2 ? 0.2 : zoom > 5 ? 5 : zoom
    const oldZoom = stage.scaleX()
    stage.scale({
        x: zoom,
        y: zoom,
    })
    prevFlowchartWidth = (prevFlowchartWidth / oldZoom) * zoom
}

export function getZoom() {
    return stage.getScaleX()
}

export function setCamera(x, y) {
    stage.position({
        x: x,
        y: y,
    })
}

export function centerCameraOnProgramEnd() {
    if (stage.isDragging()) return
    const p = blockLayer.children[0]
    const x = stage.width() / 2 - p.flogo_connX * stage.scaleX()
    const y = -p.flogo_height * stage.scaleY()
    setCamera(x, y)
}

export function setTopOcclusion(occludedTop) {
    FLOWCHART_OCCLUDED_ON_TOP = occludedTop
}

async function fontToBase64(url) {
    if (url.startsWith('"') || url.startsWith("'")) {
        url = url.slice(1, url.length - 1)
    }
    const response = await fetch(url)
    const buffer = await response.arrayBuffer()
    const base64 = btoa(String.fromCharCode(...new Uint8Array(buffer)))
    return `data:font/woff2;base64,${base64}`
}

export async function downloadSVG(name, background = true) {
    const oldPos = stage.position(),
        oldZ = stage.scale()
    const oldContext = blockLayer.canvas.context._context
    const tempCtx = (blockLayer.canvas.context._context = new SVGCanvasContext({
        width: stage.flogo_realWidth + 2 * Theming.PADDING_BASE,
        height: stage.flogo_realHeight + 2 * Theming.PADDING_BASE,
        ctx: oldContext,
    }))
    stage.position({
        x: Theming.PADDING_BASE,
        y: Theming.PADDING_BASE
    })
    stage.scale({
        x: 1,
        y: 1,
    })
    const oldCulling = cullingEnabled
    setCulling(false)
    stage.draw()
    let out = tempCtx.getSerializedSvg()
    const bkColor = Utils.getCSSVal("--ui-color-background1", null)
    if (background && bkColor !== null) {
        out = out.replace(/<rect[a-zA-Z0-9\s="#.()]*\/>/, `<rect x="0" y="0" width="${tempCtx.width}" height="${tempCtx.height}" fill="${bkColor}"/>`)
    } else {
        out = out.replace(/<rect[a-zA-Z0-9\s="#.()]*\/>/, "")
    }
    blockLayer.canvas.context._context = oldContext
    stage.position(oldPos)
    stage.scale(oldZ)
    setCulling(oldCulling)
    stage.draw()
    if (typeof name === "undefined") {
        if (FlogoLang.metadata.title.trim() !== "") {
            name = FlogoLang.metadata.title
        } else {
            name = "Untitled"
        }
    }
    if (!name.endsWith(".svg")) name += ".svg"
    const doDownload = () => {
        const blob = new Blob([out], {
            type: "image/svg+xml;charset=utf-8",
        })
        Platform.saveBlob(name, blob, {
            name: "SVG Image",
            extensions: ["svg"]
        })
    }
    let embeddableFontURL = Utils.getCSSVal("--flowchart-Font-svgEmbeddableFile", null)
    if (embeddableFontURL !== null) {
        try {
            const data = await fontToBase64(embeddableFontURL)
            const svgStyle = `<style>@font-face{font-family:${Theming.FLOWCHART_FONT};src:url('${data}') format('woff2');}</style>`
            const pos = out.indexOf(">") + 1
            out = out.slice(0, pos) + svgStyle + out.slice(pos)
            doDownload()
        } catch (e) {
            console.log("Not embedding font in SVG: " + err)
            doDownload()
        }
    } else {
        console.log("Not embedding font in SVG: no svgEmbeddableFile")
        doDownload()
    }
}

export function downloadPNG(name, background = true, superSampling = 2) {
    const oldPos = stage.position(),
        oldZ = stage.scale()
    const minVis = Theming.PADDING_BASE * 2
    const oldContext = blockLayer.canvas.context._context
    const tempCanvas = document.createElement("canvas")
    const cw = (stage.flogo_realWidth + 2 * minVis) * superSampling
    const ch = (stage.flogo_realHeight + 2 * minVis) * superSampling
    if (cw > 16000 || ch > 16000) {
        superSampling *= 16000 / Math.max(cw, ch)
    }
    tempCanvas.width = (stage.flogo_realWidth + 2 * minVis) * superSampling
    tempCanvas.height = (stage.flogo_realHeight + 2 * minVis) * superSampling
    blockLayer.canvas.context._context = tempCanvas.getContext("2d")
    stage.position({
        x: minVis * superSampling,
        y: minVis * superSampling
    })
    stage.scale({
        x: superSampling,
        y: superSampling,
    })
    const oldCulling = cullingEnabled
    setCulling(false)
    let rect = null
    if (background) {
        const bkColor = Utils.getCSSVal("--ui-color-background1", null)
        if (bkColor !== null) {
            rect = new Konva.Rect({
                x: stage.x() - cw / 2,
                y: stage.y() - ch / 2,
                width: cw,
                height: ch,
                fill: bkColor
            })
            blockLayer.add(rect)
            rect.moveToBottom()
        }
    }
    stage.draw()
    const dataURL = tempCanvas.toDataURL("image/png")
    if (rect !== null) {
        rect.destroy()
    }
    blockLayer.canvas.context._context = oldContext
    stage.position(oldPos)
    stage.scale(oldZ)
    setCulling(oldCulling)
    stage.draw()
    if (typeof name === "undefined") {
        if (FlogoLang.metadata.title.trim() !== "") {
            name = FlogoLang.metadata.title
        } else {
            name = "Untitled"
        }
    }
    if (!name.endsWith(".png")) name += ".png"
    Platform.saveBlob(name, dataURL, {
        name: "PNG Image",
        extensions: ["png"]
    })
}
