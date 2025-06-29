/*
 * This file extends flogo.js by adding code for drawing the current program as a flowchart. Some interactions like zooming and scrolling are also implemented here, while inserting, editing, etc. is implemented in app.js
 */

let ASSIGN_COLOR1,
    ASSIGN_COLOR2,
    OUTPUT_COLOR1,
    OUTPUT_COLOR2,
    INPUT_COLOR1,
    INPUT_COLOR2,
    IF_COLOR1,
    IF_COLOR2,
    DOWHILE_COLOR1,
    DOWHILE_COLOR2,
    WHILE_COLOR1,
    WHILE_COLOR2,
    FOR_COLOR1,
    FOR_COLOR2,
    BREAKPOINT_COLOR1,
    BREAKPOINT_COLOR2,
    COMMENT_COLOR1,
    COMMENT_COLOR2,
    COMMENT_DASH_LENGTH,
    ERROR_COLOR1,
    ERROR_COLOR2,
    ROUND_COLOR1,
    ROUND_COLOR2,
    BLOCK_OUTLINE_THICKNESS,
    HIGHLIGHT_COLOR,
    FLOWCHART_FONT,
    BLOCK_FONT_SIZE,
    LINE_THICKNESS,
    LINE_ARROW_SIZE,
    LINE_COLOR,
    LINE_FONT_SIZE,
    LINE_SELECTED_COLOR,
    BLOCK_TEXT_COLOR,
    PADDING_BASE,
    SPACE_BETWEEN_INSTRUCTIONS,
    BLOCK_TEXT_MAX_WIDTH,
    ROUND_MIN_WIDTH,
    LINE_HITBOX_EXTRA,
    COMMENT_TEXT_MAX_LENGTH,
    SCROLLBAR_THICKNESS,
    SCROLLBAR_COLOR,
    SCROLLBAR_PADDING,
    MINVIS

let _selectionMode = false //TODO: implement
let _allowZoomOnFlowchart = false

function _makeArrowHighlightable(arrow) {
    arrow.on("mouseover", () => {
        if (_selectionMode || arrow.flogo_forceHighlighted) return
        const intState = interpreter.getState()
        if (intState === STATE_RUNNING || intState === STATE_PAUSED) return
        arrow.stroke(LINE_SELECTED_COLOR)
        arrow.fill(LINE_SELECTED_COLOR)
    })
    arrow.on("mouseout", () => {
        if (_selectionMode || arrow.flogo_forceHighlighted) return
        const intState = interpreter.getState()
        if (intState === STATE_RUNNING || intState === STATE_PAUSED) return
        arrow.stroke(LINE_COLOR)
        arrow.fill(LINE_COLOR)
    })
}

Assign.prototype.createDrawable = function() {
    let string
    if (this.variable !== null && this.expression !== null) {
        string = this.variable + " = " + this.expression
    } else {
        string = "Assign"
    }
    const text = new Konva.Text({
        x: 0,
        y: 0,
        text: string,
        padding: PADDING_BASE,
        fontSize: BLOCK_FONT_SIZE,
        fontFamily: FLOWCHART_FONT,
        fill: BLOCK_TEXT_COLOR,
        align: "center",
    })
    if (text.width() > BLOCK_TEXT_MAX_WIDTH) {
        text.width(BLOCK_TEXT_MAX_WIDTH)
    }
    const rect = new Konva.Rect({
        x: 0,
        y: 0,
        width: text.width(),
        height: text.height(),
        fill: ASSIGN_COLOR1,
        stroke: ASSIGN_COLOR2,
        strokeWidth: BLOCK_OUTLINE_THICKNESS,
    })
    rect.flogo_originalFill = rect.fill()
    rect.flogo_originalStroke = rect.stroke()
    const group = new Konva.Group({
        x: 0,
        y: 0,
    })
    group.add(rect)
    group.add(text)
    group.on("dblclick", (e) => _dispatchEdit(this, e, group.flogo_parentInstruction, group.flogo_parentPos))
    group.on("click tap", (e) => _dispatchEdit2(this, e, group.flogo_parentInstruction, group.flogo_parentPos))
    group.flogo_width = rect.width()
    group.flogo_height = rect.height()
    group.flogo_connX = group.flogo_width / 2
    group.flogo_highlightable = rect
    group.flogo_shapeOnly = group
    this.drawable = group
    return group
}

Input.prototype.createDrawable = function() {
    let string = "Input"
    if (this.variable !== null) {
        string += " " + this.variable
    }
    const text = new Konva.Text({
        x: PADDING_BASE / 2,
        y: 0,
        text: string,
        padding: PADDING_BASE,
        fontSize: BLOCK_FONT_SIZE,
        fontFamily: FLOWCHART_FONT,
        fill: BLOCK_TEXT_COLOR,
        align: "center",
    })
    if (text.width() > BLOCK_TEXT_MAX_WIDTH) {
        text.width(BLOCK_TEXT_MAX_WIDTH)
    }
    const tw = text.width() + PADDING_BASE,
        th = text.height()
    const rect = new Konva.Line({
        points: [PADDING_BASE, 0, tw, 0, tw - PADDING_BASE, th, 0, th],
        fill: INPUT_COLOR1,
        stroke: INPUT_COLOR2,
        strokeWidth: BLOCK_OUTLINE_THICKNESS,
        closed: true,
    })
    rect.flogo_originalFill = rect.fill()
    rect.flogo_originalStroke = rect.stroke()
    const group = new Konva.Group({
        x: 0,
        y: 0,
    })
    group.add(rect)
    group.add(text)
    group.on("dblclick", (e) => _dispatchEdit(this, e, group.flogo_parentInstruction, group.flogo_parentPos))
    group.on("click tap", (e) => _dispatchEdit2(this, e, group.flogo_parentInstruction, group.flogo_parentPos))
    group.flogo_width = rect.width()
    group.flogo_height = rect.height()
    group.flogo_connX = group.flogo_width / 2
    group.flogo_highlightable = rect
    group.flogo_shapeOnly = group
    this.drawable = group
    return group
}

Output.prototype.createDrawable = function() {
    let string = "Output"
    if (!this.newLine) {
        string += "+"
    }
    if (this.expression !== null) {
        string += " " + this.expression
    }
    const text = new Konva.Text({
        x: PADDING_BASE / 2,
        y: 0,
        text: string,
        padding: PADDING_BASE,
        fontSize: BLOCK_FONT_SIZE,
        fontFamily: FLOWCHART_FONT,
        fill: BLOCK_TEXT_COLOR,
        align: "center",
    })
    if (text.width() > BLOCK_TEXT_MAX_WIDTH) {
        text.width(BLOCK_TEXT_MAX_WIDTH)
    }
    const tw = text.width() + PADDING_BASE,
        th = text.height()
    const rect = new Konva.Line({
        points: [PADDING_BASE, 0, tw, 0, tw - PADDING_BASE, th, 0, th],
        fill: OUTPUT_COLOR1,
        stroke: OUTPUT_COLOR2,
        strokeWidth: BLOCK_OUTLINE_THICKNESS,
        closed: true,
    })
    rect.flogo_originalFill = rect.fill()
    rect.flogo_originalStroke = rect.stroke()
    const group = new Konva.Group({
        x: 0,
        y: 0,
    })
    group.add(rect)
    group.add(text)
    group.on("dblclick", (e) => _dispatchEdit(this, e, group.flogo_parentInstruction, group.flogo_parentPos))
    group.on("click tap", (e) => _dispatchEdit2(this, e, group.flogo_parentInstruction, group.flogo_parentPos))
    group.flogo_width = rect.width()
    group.flogo_height = rect.height()
    group.flogo_connX = group.flogo_width / 2
    group.flogo_highlightable = rect
    group.flogo_shapeOnly = group
    this.drawable = group
    return group
}

Comment.prototype.createDrawable = function() {
    let string
    if (this.text !== null) {
        string = this.text
    } else {
        string = "Comment"
    }
    if (string.length > COMMENT_TEXT_MAX_LENGTH) {
        let firstSpace = string.slice(COMMENT_TEXT_MAX_LENGTH).search(/\s/)
        if (firstSpace !== -1) {
            firstSpace += COMMENT_TEXT_MAX_LENGTH
            string = string.slice(0, firstSpace) + "..."
        } else {
            string = string.slice(0, COMMENT_TEXT_MAX_LENGTH) + "..."
        }
    }
    const text = new Konva.Text({
        x: 0,
        y: 0,
        text: string,
        padding: PADDING_BASE,
        fontSize: BLOCK_FONT_SIZE,
        fontFamily: FLOWCHART_FONT,
        fill: BLOCK_TEXT_COLOR,
    })
    if (text.width() > BLOCK_TEXT_MAX_WIDTH) {
        text.width(BLOCK_TEXT_MAX_WIDTH)
    }
    const rect = new Konva.Rect({
        x: 0,
        y: 0,
        width: text.width(),
        height: text.height(),
        fill: COMMENT_COLOR1,
        stroke: COMMENT_COLOR2,
        strokeWidth: BLOCK_OUTLINE_THICKNESS,
        dash: [COMMENT_DASH_LENGTH, COMMENT_DASH_LENGTH],
    })
    rect.flogo_originalFill = rect.fill()
    rect.flogo_originalStroke = rect.stroke()
    const group = new Konva.Group({
        x: 0,
        y: 0,
    })
    group.add(rect)
    group.add(text)
    group.on("dblclick", (e) => _dispatchEdit(this, e, group.flogo_parentInstruction, group.flogo_parentPos))
    group.on("click tap", (e) => _dispatchEdit2(this, e, group.flogo_parentInstruction, group.flogo_parentPos))
    group.flogo_width = rect.width()
    group.flogo_height = rect.height()
    group.flogo_connX = group.flogo_width / 2
    group.flogo_highlightable = rect
    group.flogo_shapeOnly = group
    this.drawable = group
    return group
}

Breakpoint.prototype.createDrawable = function() {
    const tw = PADDING_BASE * 2 + BLOCK_FONT_SIZE,
        th = PADDING_BASE * 2 + BLOCK_FONT_SIZE
    const rect = new Konva.Line({
        points: [PADDING_BASE, 0, tw, 0, tw + PADDING_BASE, th / 2, tw, th, PADDING_BASE, th, 0, th / 2],
        fill: BREAKPOINT_COLOR1,
        stroke: BREAKPOINT_COLOR2,
        strokeWidth: BLOCK_OUTLINE_THICKNESS,
        closed: true,
    })
    rect.flogo_originalFill = rect.fill()
    rect.flogo_originalStroke = rect.stroke()
    const s1 = new Konva.Rect({
        x: rect.width() / 2 - BLOCK_FONT_SIZE / 2,
        y: PADDING_BASE,
        width: BLOCK_FONT_SIZE / 4,
        height: BLOCK_FONT_SIZE,
        fill: BLOCK_TEXT_COLOR,
    })
    const s2 = new Konva.Rect({
        x: rect.width() / 2 + BLOCK_FONT_SIZE / 4,
        y: PADDING_BASE,
        width: BLOCK_FONT_SIZE / 4,
        height: BLOCK_FONT_SIZE,
        fill: BLOCK_TEXT_COLOR,
    })
    const group = new Konva.Group({
        x: 0,
        y: 0,
    })
    group.add(rect)
    group.add(s1)
    group.add(s2)
    group.on("dblclick", (e) => _dispatchEdit(this, e, group.flogo_parentInstruction, group.flogo_parentPos))
    group.on("click tap", (e) => _dispatchEdit2(this, e, group.flogo_parentInstruction, group.flogo_parentPos))
    group.flogo_width = rect.width()
    group.flogo_height = rect.height()
    group.flogo_connX = group.flogo_width / 2
    group.flogo_highlightable = rect
    group.flogo_shapeOnly = group
    this.drawable = group
    return group
}

InstructionSequence.prototype.createDrawable = function(skipFirstArrow = false, skipLastArrow = false) {
    const contents = []
    let maxW = 0
    let idx = 0 //TODO: replace with for
    this.body.forEach((i) => {
        let b = i.createDrawable()
        b.flogo_parentInstruction = this
        b.flogo_parentPos = idx
        idx++
        if (b.flogo_width > maxW) maxW = b.flogo_width
        contents.push(b)
    })
    const group = new Konva.Group({
        x: 0,
        y: 0,
    })
    let y = 0
    if (!skipFirstArrow) {
        y += SPACE_BETWEEN_INSTRUCTIONS
    }
    let minX = +Infinity,
        maxX = -Infinity
    for (let i = 0; i < contents.length; i++) {
        const b = contents[i]
        group.add(b)
        b.x(maxW / 2 - b.flogo_connX)
        b.y(y)
        if (b.x() < minX) minX = b.x()
        if (b.flogo_width + b.x() > maxX) maxX = b.flogo_width + b.x()
        y += b.flogo_height + SPACE_BETWEEN_INSTRUCTIONS
    }
    if (skipLastArrow) y -= SPACE_BETWEEN_INSTRUCTIONS
    if (contents.length === 0) {
        maxW = 0
    } else {
        maxW = maxX - minX
        contents.forEach((b) => b.x(b.x() - minX))
    }
    group.flogo_width = maxW
    group.flogo_height = y
    group.flogo_connX = contents.length === 0 ? 0 : contents[0].x() + contents[0].flogo_connX
    if (!skipFirstArrow) {
        const a = new Konva.Arrow({
            x: group.flogo_connX,
            y: 0,
            points: [0, 0, 0, SPACE_BETWEEN_INSTRUCTIONS],
            pointerLength: LINE_ARROW_SIZE,
            pointerWidth: LINE_ARROW_SIZE,
            fill: LINE_COLOR,
            stroke: LINE_COLOR,
            strokeWidth: LINE_THICKNESS,
            hitStrokeWidth: LINE_THICKNESS + LINE_HITBOX_EXTRA,
        })
        a.on("click tap", (e) => _dispatchInsert(this, 0, e, a))
        _makeArrowHighlightable(a)
        group.add(a)
    }
    let n = contents.length
    if (skipLastArrow) n--
    for (let i = 0; i < n; i++) {
        const b = contents[i]
        const a = new Konva.Arrow({
            x: b.x() + b.flogo_connX,
            y: b.y() + b.flogo_height,
            points: [0, 0, 0, SPACE_BETWEEN_INSTRUCTIONS],
            pointerLength: LINE_ARROW_SIZE,
            pointerWidth: LINE_ARROW_SIZE,
            fill: LINE_COLOR,
            stroke: LINE_COLOR,
            strokeWidth: LINE_THICKNESS,
            hitStrokeWidth: LINE_THICKNESS + LINE_HITBOX_EXTRA,
        })
        a.on("click tap", (e) => _dispatchInsert(this, i + 1, e, a))
        _makeArrowHighlightable(a)
        group.add(a)
    }
    group.flogo_highlightable = null
    group.flogo_shapeOnly = null
    if (this !== program) {
        this.drawable = group
        return group
    } else {
        const makeRound = (string) => {
            const text = new Konva.Text({
                x: 0,
                y: 0,
                text: string,
                padding: PADDING_BASE,
                fontSize: BLOCK_FONT_SIZE,
                fontFamily: FLOWCHART_FONT,
                fill: BLOCK_TEXT_COLOR,
                align: "center",
            })
            if (text.width() > BLOCK_TEXT_MAX_WIDTH) {
                text.width(BLOCK_TEXT_MAX_WIDTH)
            }
            if (text.width() < ROUND_MIN_WIDTH) {
                text.width(ROUND_MIN_WIDTH)
            }
            const rect = new Konva.Rect({
                x: 0,
                y: 0,
                width: text.width(),
                height: text.height(),
                fill: ROUND_COLOR1,
                stroke: ROUND_COLOR2,
                strokeWidth: BLOCK_OUTLINE_THICKNESS,
                cornerRadius: Infinity,
            })
            rect.flogo_originalFill = rect.fill()
            rect.flogo_originalStroke = rect.stroke()
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
        if (group.flogo_width <= startBlock.flogo_width) {
            const xOff = (startBlock.flogo_width - group.flogo_width) / 2
            group.x(xOff)
            mainGroup.flogo_width = startBlock.flogo_width
        } else {
            startBlock.x(group.flogo_connX - startBlock.flogo_width / 2)
            endBlock.x(group.flogo_connX - startBlock.flogo_width / 2)
            mainGroup.flogo_width = group.flogo_width
        }
        group.y(startBlock.flogo_height)
        endBlock.y(group.y() + group.flogo_height)
        mainGroup.flogo_height = endBlock.y() + endBlock.flogo_height
        mainGroup.flogo_connX = startBlock.x() + startBlock.flogo_width / 2
        mainGroup.flogo_highlightable = null
        mainGroup.flogo_shapeOnly = null
        this.drawable = mainGroup
        return mainGroup
    }
}

If.prototype.createDrawable = function() {
    let string = "If"
    if (this.condition !== null) {
        string = this.condition
    }
    const text = new Konva.Text({
        x: 0,
        y: 0,
        text: string,
        padding: PADDING_BASE * 1.25,
        fontSize: BLOCK_FONT_SIZE,
        fontFamily: FLOWCHART_FONT,
        fill: BLOCK_TEXT_COLOR,
        align: "center",
    })
    if (text.width() > BLOCK_TEXT_MAX_WIDTH) {
        text.width(BLOCK_TEXT_MAX_WIDTH)
    }
    const tw = text.width(),
        th = text.height()
    const sqrt2 = Math.sqrt(2)
    const rw = tw * sqrt2,
        rh = th * sqrt2
    const rect = new Konva.Line({
        points: [rw / 2, 0, rw, rh / 2, rw / 2, rh, 0, rh / 2],
        fill: IF_COLOR1,
        stroke: IF_COLOR2,
        strokeWidth: BLOCK_OUTLINE_THICKNESS,
        closed: true,
    })
    rect.flogo_originalFill = rect.fill()
    rect.flogo_originalStroke = rect.stroke()
    text.x(rw / 2 - tw / 2)
    text.y(rh / 2 - th / 2)
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
    const tPad = t.flogo_width < LINE_FONT_SIZE * 5 ? LINE_FONT_SIZE * 3 : PADDING_BASE
    const fPad = f.flogo_width < LINE_FONT_SIZE * 5 ? LINE_FONT_SIZE * 3 : PADDING_BASE
    const group = new Konva.Group({
        x: 0,
        y: 0,
    })
    group.add(condition)
    condition.on("dblclick", (e) => _dispatchEdit(this, e, group.flogo_parentInstruction, group.flogo_parentPos))
    condition.on("click tap", (e) => _dispatchEdit2(this, e, group.flogo_parentInstruction, group.flogo_parentPos))
    group.add(f)
    group.add(t)
    f.x(0)
    f.y(condition.flogo_height + PADDING_BASE)
    condition.x(f.flogo_width + fPad)
    condition.y(0)
    t.x(condition.x() + condition.flogo_width + tPad)
    t.y(condition.flogo_height + PADDING_BASE)
    const endY = Math.max(t.y() + t.flogo_height, f.y() + f.flogo_height) + SPACE_BETWEEN_INSTRUCTIONS
    if (this.trueBranch.body.length > 0) {
        const tArrowIn = new Konva.Arrow({
            x: condition.x() + condition.flogo_width,
            y: condition.flogo_height / 2,
            points: [0, 0, t.flogo_connX + tPad, 0, t.flogo_connX + tPad, condition.flogo_height / 2 + PADDING_BASE],
            pointerLength: LINE_ARROW_SIZE,
            pointerWidth: LINE_ARROW_SIZE,
            fill: LINE_COLOR,
            stroke: LINE_COLOR,
            strokeWidth: LINE_THICKNESS,
            hitStrokeWidth: LINE_THICKNESS + LINE_HITBOX_EXTRA,
        })
        tArrowIn.on("click tap", (e) => _dispatchInsert(this.trueBranch, 0, e, tArrowIn))
        _makeArrowHighlightable(tArrowIn)
        group.add(tArrowIn)
        const tArrowOut = new Konva.Arrow({
            x: t.x() + t.flogo_connX,
            y: t.y() + t.flogo_height,
            points: [0, 0, 0, endY - (t.y() + t.flogo_height), -(t.flogo_connX + tPad + condition.flogo_width / 2), endY - (t.y() + t.flogo_height)],
            pointerLength: LINE_ARROW_SIZE,
            pointerWidth: LINE_ARROW_SIZE,
            fill: LINE_COLOR,
            stroke: LINE_COLOR,
            strokeWidth: LINE_THICKNESS,
            hitStrokeWidth: LINE_THICKNESS + LINE_HITBOX_EXTRA,
        })
        tArrowOut.on("click tap", (e) => _dispatchInsert(this.trueBranch, this.trueBranch.body.length, e, tArrowOut))
        _makeArrowHighlightable(tArrowOut)
        group.add(tArrowOut)
    } else {
        const tArrowLoop = new Konva.Arrow({
            x: condition.x() + condition.flogo_width,
            y: condition.flogo_height / 2,
            points: [0, 0, t.flogo_connX + tPad, 0, t.flogo_connX + tPad, endY - condition.flogo_height / 2, -condition.flogo_width / 2, endY - condition.flogo_height / 2],
            pointerLength: LINE_ARROW_SIZE,
            pointerWidth: LINE_ARROW_SIZE,
            fill: LINE_COLOR,
            stroke: LINE_COLOR,
            strokeWidth: LINE_THICKNESS,
            hitStrokeWidth: LINE_THICKNESS + LINE_HITBOX_EXTRA,
        })
        tArrowLoop.on("click tap", (e) => _dispatchInsert(this.trueBranch, 0, e, tArrowLoop))
        _makeArrowHighlightable(tArrowLoop)
        group.add(tArrowLoop)
    }
    if (this.falseBranch.body.length > 0) {
        const fArrowIn = new Konva.Arrow({
            x: condition.x(),
            y: condition.flogo_height / 2,
            points: [0, 0, -(f.flogo_width - f.flogo_connX + fPad), 0, -(f.flogo_width - f.flogo_connX + fPad), condition.flogo_height / 2 + PADDING_BASE],
            pointerLength: LINE_ARROW_SIZE,
            pointerWidth: LINE_ARROW_SIZE,
            fill: LINE_COLOR,
            stroke: LINE_COLOR,
            strokeWidth: LINE_THICKNESS,
            hitStrokeWidth: LINE_THICKNESS + LINE_HITBOX_EXTRA,
        })
        fArrowIn.on("click tap", (e) => _dispatchInsert(this.falseBranch, 0, e, fArrowIn))
        _makeArrowHighlightable(fArrowIn)
        group.add(fArrowIn)
        const fArrowOut = new Konva.Arrow({
            x: f.x() + f.flogo_connX,
            y: f.y() + f.flogo_height,
            points: [0, 0, 0, endY - (f.y() + f.flogo_height), condition.x() - f.flogo_connX + condition.flogo_width / 2, endY - (f.y() + f.flogo_height)],
            pointerLength: LINE_ARROW_SIZE,
            pointerWidth: LINE_ARROW_SIZE,
            fill: LINE_COLOR,
            stroke: LINE_COLOR,
            strokeWidth: LINE_THICKNESS,
            hitStrokeWidth: LINE_THICKNESS + LINE_HITBOX_EXTRA,
        })
        fArrowOut.on("click tap", (e) => _dispatchInsert(this.falseBranch, this.falseBranch.body.length, e, fArrowOut))
        _makeArrowHighlightable(fArrowOut)
        group.add(fArrowOut)
    } else {
        const fArrowLoop = new Konva.Arrow({
            x: condition.x(),
            y: condition.flogo_height / 2,
            points: [
                0,
                0,
                -(f.flogo_width - f.flogo_connX + fPad),
                0,
                -(f.flogo_width - f.flogo_connX + fPad),
                endY - condition.flogo_height / 2,
                condition.x() + condition.flogo_width / 2 - fPad,
                endY - condition.flogo_height / 2,
            ],
            pointerLength: LINE_ARROW_SIZE,
            pointerWidth: LINE_ARROW_SIZE,
            fill: LINE_COLOR,
            stroke: LINE_COLOR,
            strokeWidth: LINE_THICKNESS,
            hitStrokeWidth: LINE_THICKNESS + LINE_HITBOX_EXTRA,
        })
        fArrowLoop.on("click tap", (e) => _dispatchInsert(this.falseBranch, 0, e, fArrowLoop))
        _makeArrowHighlightable(fArrowLoop)
        group.add(fArrowLoop)
    }
    const fText = new Konva.Text({
        x: 0,
        y: condition.flogo_height / 2 - LINE_FONT_SIZE - LINE_THICKNESS / 2,
        text: "False",
        fontSize: LINE_FONT_SIZE,
        fontFamily: FLOWCHART_FONT,
        fill: LINE_COLOR,
    })
    fText.x(condition.x() - fText.width())
    group.add(fText)
    const tText = new Konva.Text({
        x: condition.x() + condition.flogo_width,
        y: condition.flogo_height / 2 - LINE_FONT_SIZE - LINE_THICKNESS / 2,
        text: "True",
        fontSize: LINE_FONT_SIZE,
        fontFamily: FLOWCHART_FONT,
        fill: LINE_COLOR,
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

DoWhile.prototype.createDrawable = function() {
    let string = "Do-While"
    if (this.condition !== null) {
        string = this.condition
    }
    const text = new Konva.Text({
        x: PADDING_BASE / 2,
        y: 0,
        text: string,
        padding: PADDING_BASE,
        fontSize: BLOCK_FONT_SIZE,
        fontFamily: FLOWCHART_FONT,
        fill: BLOCK_TEXT_COLOR,
        align: "center",
    })
    if (text.width() > BLOCK_TEXT_MAX_WIDTH) {
        text.width(BLOCK_TEXT_MAX_WIDTH)
    }
    const tw = text.width(),
        th = text.height()
    const rect = new Konva.Line({
        points: [PADDING_BASE, 0, tw, 0, tw + PADDING_BASE, th / 2, tw, th, PADDING_BASE, th, 0, th / 2],
        fill: DOWHILE_COLOR1,
        stroke: DOWHILE_COLOR2,
        strokeWidth: BLOCK_OUTLINE_THICKNESS,
        closed: true,
    })
    rect.flogo_originalFill = rect.fill()
    rect.flogo_originalStroke = rect.stroke()
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
    condition.on("dblclick", (e) => _dispatchEdit(this, e, group.flogo_parentInstruction, group.flogo_parentPos))
    condition.on("click tap", (e) => _dispatchEdit2(this, e, group.flogo_parentInstruction, group.flogo_parentPos))
    group.add(b)
    b.x(condition.flogo_width + PADDING_BASE)
    b.y(SPACE_BETWEEN_INSTRUCTIONS)
    condition.x(0)
    if (this.body.body.length > 0) {
        condition.y(b.y() + b.flogo_height + SPACE_BETWEEN_INSTRUCTIONS - condition.flogo_height / 2)
        const arrowIn = new Konva.Arrow({
            x: condition.flogo_width / 2,
            y: 0,
            points: [0, 0, condition.flogo_width / 2 + b.flogo_connX + PADDING_BASE, 0, condition.flogo_width / 2 + b.flogo_connX + PADDING_BASE, SPACE_BETWEEN_INSTRUCTIONS],
            pointerLength: LINE_ARROW_SIZE,
            pointerWidth: LINE_ARROW_SIZE,
            fill: LINE_COLOR,
            stroke: LINE_COLOR,
            strokeWidth: LINE_THICKNESS,
            hitStrokeWidth: LINE_THICKNESS + LINE_HITBOX_EXTRA,
        })
        arrowIn.on("click tap", (e) => _dispatchInsert(this.body, 0, e, arrowIn))
        _makeArrowHighlightable(arrowIn)
        group.add(arrowIn)
        const arrowToCond = new Konva.Arrow({
            x: b.x() + b.flogo_connX,
            y: b.y() + b.flogo_height,
            points: [0, 0, 0, SPACE_BETWEEN_INSTRUCTIONS, -(b.flogo_connX + PADDING_BASE), SPACE_BETWEEN_INSTRUCTIONS],
            pointerLength: LINE_ARROW_SIZE,
            pointerWidth: LINE_ARROW_SIZE,
            fill: LINE_COLOR,
            stroke: LINE_COLOR,
            strokeWidth: LINE_THICKNESS,
            hitStrokeWidth: LINE_THICKNESS + LINE_HITBOX_EXTRA,
        })
        arrowToCond.on("click tap", (e) => _dispatchInsert(this.body, this.body.body.length, e, arrowToCond))
        _makeArrowHighlightable(arrowToCond)
        group.add(arrowToCond)
    } else {
        condition.y(b.y() + b.flogo_height + SPACE_BETWEEN_INSTRUCTIONS)
        const loopArrow = new Konva.Arrow({
            x: condition.flogo_width / 2,
            y: 0,
            points: [
                0,
                0,
                condition.flogo_width / 2 + b.flogo_connX + PADDING_BASE,
                0,
                condition.flogo_width / 2 + b.flogo_connX + PADDING_BASE,
                condition.y() + condition.flogo_height / 2,
                condition.flogo_width / 2,
                condition.y() + condition.flogo_height / 2,
            ],
            pointerLength: LINE_ARROW_SIZE,
            pointerWidth: LINE_ARROW_SIZE,
            fill: LINE_COLOR,
            stroke: LINE_COLOR,
            strokeWidth: LINE_THICKNESS,
            hitStrokeWidth: LINE_THICKNESS + LINE_HITBOX_EXTRA,
        })
        loopArrow.on("click tap", (e) => _dispatchInsert(this.body, 0, e, loopArrow))
        _makeArrowHighlightable(loopArrow)
        group.add(loopArrow)
    }
    const arrowToTop = new Konva.Arrow({
        x: condition.flogo_width / 2,
        y: condition.y(),
        points: [0, 0, 0, -(b.flogo_height + 2 * SPACE_BETWEEN_INSTRUCTIONS - (this.body.body.length > 0 ? condition.flogo_height / 2 : 0))],
        pointerLength: LINE_ARROW_SIZE,
        pointerWidth: LINE_ARROW_SIZE,
        fill: LINE_COLOR,
        stroke: LINE_COLOR,
        strokeWidth: LINE_THICKNESS,
        hitStrokeWidth: LINE_THICKNESS + LINE_HITBOX_EXTRA,
    })
    group.add(arrowToTop)
    const fText = new Konva.Text({
        x: 0,
        y: condition.y() + condition.flogo_height + BLOCK_OUTLINE_THICKNESS,
        text: "False",
        fontSize: LINE_FONT_SIZE,
        fontFamily: FLOWCHART_FONT,
        fill: LINE_COLOR,
    })
    fText.x(condition.flogo_width / 2 - fText.width() - LINE_THICKNESS / 2 - LINE_FONT_SIZE / 4)
    group.add(fText)
    const tText = new Konva.Text({
        x: 0,
        y: condition.y() - LINE_FONT_SIZE,
        text: "True",
        fontSize: LINE_FONT_SIZE,
        fontFamily: FLOWCHART_FONT,
        fill: LINE_COLOR,
    })
    tText.x(condition.flogo_width / 2 - tText.width() - LINE_THICKNESS / 2 - LINE_FONT_SIZE / 4)
    group.add(tText)
    group.flogo_width = b.x() + b.flogo_width
    group.flogo_height = condition.y() + condition.flogo_height
    group.flogo_connX = condition.flogo_width / 2
    group.flogo_highlightable = rect
    group.flogo_shapeOnly = condition
    this.drawable = group
    return group
}

While.prototype.createDrawable = function() {
    let string = "While"
    if (this.condition !== null) {
        string = this.condition
    }
    const text = new Konva.Text({
        x: PADDING_BASE / 2,
        y: 0,
        text: string,
        padding: PADDING_BASE,
        fontSize: BLOCK_FONT_SIZE,
        fontFamily: FLOWCHART_FONT,
        fill: BLOCK_TEXT_COLOR,
        align: "center",
    })
    if (text.width() > BLOCK_TEXT_MAX_WIDTH) {
        text.width(BLOCK_TEXT_MAX_WIDTH)
    }
    const tw = text.width(),
        th = text.height()
    const rect = new Konva.Line({
        points: [PADDING_BASE, 0, tw, 0, tw + PADDING_BASE, th / 2, tw, th, PADDING_BASE, th, 0, th / 2],
        fill: WHILE_COLOR1,
        stroke: WHILE_COLOR2,
        strokeWidth: BLOCK_OUTLINE_THICKNESS,
        closed: true,
    })
    rect.flogo_originalFill = rect.fill()
    rect.flogo_originalStroke = rect.stroke()
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
    condition.on("dblclick", (e) => _dispatchEdit(this, e, group.flogo_parentInstruction, group.flogo_parentPos))
    condition.on("click tap", (e) => _dispatchEdit2(this, e, group.flogo_parentInstruction, group.flogo_parentPos))
    group.add(b)
    const bPad = b.flogo_width < LINE_FONT_SIZE * 5 ? LINE_FONT_SIZE * 3 : PADDING_BASE
    b.x(condition.flogo_width + bPad)
    b.y(condition.flogo_height + PADDING_BASE)
    const endY = b.y() + b.flogo_height + SPACE_BETWEEN_INSTRUCTIONS + PADDING_BASE
    if (this.body.body.length > 0) {
        const arrowIn = new Konva.Arrow({
            x: condition.flogo_width,
            y: condition.flogo_height / 2,
            points: [0, 0, b.flogo_connX + bPad, 0, b.flogo_connX + bPad, condition.flogo_height / 2 + PADDING_BASE],
            pointerLength: LINE_ARROW_SIZE,
            pointerWidth: LINE_ARROW_SIZE,
            fill: LINE_COLOR,
            stroke: LINE_COLOR,
            strokeWidth: LINE_THICKNESS,
            hitStrokeWidth: LINE_THICKNESS + LINE_HITBOX_EXTRA,
        })
        arrowIn.on("click tap", (e) => _dispatchInsert(this.body, 0, e, arrowIn))
        _makeArrowHighlightable(arrowIn)
        group.add(arrowIn)
        const arrowToTop = new Konva.Arrow({
            x: condition.flogo_width + b.flogo_connX + bPad,
            y: b.y() + b.flogo_height,
            points: [
                0,
                0,
                0,
                SPACE_BETWEEN_INSTRUCTIONS,
                -(b.flogo_connX + condition.flogo_width / 2 + bPad) + PADDING_BASE,
                SPACE_BETWEEN_INSTRUCTIONS,
                -(b.flogo_connX + condition.flogo_width / 2 + bPad) + PADDING_BASE,
                -(b.flogo_height + PADDING_BASE),
            ],
            pointerLength: LINE_ARROW_SIZE,
            pointerWidth: LINE_ARROW_SIZE,
            fill: LINE_COLOR,
            stroke: LINE_COLOR,
            strokeWidth: LINE_THICKNESS,
            hitStrokeWidth: LINE_THICKNESS + LINE_HITBOX_EXTRA,
        })
        arrowToTop.on("click tap", (e) => _dispatchInsert(this.body, this.body.body.length, e, arrowToTop))
        _makeArrowHighlightable(arrowToTop)
        group.add(arrowToTop)
    } else {
        const loopArrow = new Konva.Arrow({
            x: condition.flogo_width,
            y: condition.flogo_height / 2,
            points: [
                0,
                0,
                b.flogo_connX + bPad,
                0,
                b.flogo_connX + bPad,
                condition.flogo_height / 2 + SPACE_BETWEEN_INSTRUCTIONS,
                -condition.flogo_width / 2 + PADDING_BASE,
                condition.flogo_height / 2 + SPACE_BETWEEN_INSTRUCTIONS,
                -condition.flogo_width / 2 + PADDING_BASE,
                condition.flogo_height / 2,
            ],
            pointerLength: LINE_ARROW_SIZE,
            pointerWidth: LINE_ARROW_SIZE,
            fill: LINE_COLOR,
            stroke: LINE_COLOR,
            strokeWidth: LINE_THICKNESS,
            hitStrokeWidth: LINE_THICKNESS + LINE_HITBOX_EXTRA,
        })
        loopArrow.on("click tap", (e) => _dispatchInsert(this.body, 0, e, loopArrow))
        _makeArrowHighlightable(loopArrow)
        group.add(loopArrow)
    }
    const arrowOut = new Konva.Arrow({
        x: condition.flogo_width / 2,
        y: condition.flogo_height,
        points: [0, 0, 0, b.flogo_height + SPACE_BETWEEN_INSTRUCTIONS * 2],
        pointerLength: 0,
        pointerWidth: 0,
        fill: LINE_COLOR,
        stroke: LINE_COLOR,
        strokeWidth: LINE_THICKNESS,
        hitStrokeWidth: LINE_THICKNESS + LINE_HITBOX_EXTRA,
    })
    group.add(arrowOut)
    const fText = new Konva.Text({
        x: 0,
        y: condition.flogo_height + BLOCK_OUTLINE_THICKNESS,
        text: "False",
        fontSize: LINE_FONT_SIZE,
        fontFamily: FLOWCHART_FONT,
        fill: LINE_COLOR,
    })
    fText.x(condition.flogo_width / 2 - fText.width() - LINE_THICKNESS / 2 - LINE_FONT_SIZE / 4)
    group.add(fText)
    const tText = new Konva.Text({
        x: condition.x() + condition.flogo_width,
        y: condition.flogo_height / 2 - LINE_FONT_SIZE - LINE_THICKNESS / 2,
        text: "True",
        fontSize: LINE_FONT_SIZE,
        fontFamily: FLOWCHART_FONT,
        fill: LINE_COLOR,
    })
    group.add(tText)
    group.flogo_width = b.x() + b.flogo_width
    group.flogo_height = endY
    group.flogo_connX = condition.flogo_width / 2
    group.flogo_highlightable = rect
    group.flogo_shapeOnly = condition
    this.drawable = group
    return group
}

For.prototype.createDrawable = function() {
    let string = "For"
    if (this.variable !== null && this.from !== null && this.to !== null && this.step !== null && this.direction !== null) {
        string = this.variable + " = " + this.from + " to " + this.to
        if (this.step !== "1") string += " step " + this.step
        if (this.direction !== "up") string += " " + this.direction
    }
    const text = new Konva.Text({
        x: PADDING_BASE / 2,
        y: 0,
        text: string,
        padding: PADDING_BASE,
        fontSize: BLOCK_FONT_SIZE,
        fontFamily: FLOWCHART_FONT,
        fill: BLOCK_TEXT_COLOR,
        align: "center",
    })
    if (text.width() > BLOCK_TEXT_MAX_WIDTH) {
        text.width(BLOCK_TEXT_MAX_WIDTH)
    }
    const tw = text.width(),
        th = text.height()
    const rect = new Konva.Line({
        points: [PADDING_BASE, 0, tw, 0, tw + PADDING_BASE, th / 2, tw, th, PADDING_BASE, th, 0, th / 2],
        fill: FOR_COLOR1,
        stroke: FOR_COLOR2,
        strokeWidth: BLOCK_OUTLINE_THICKNESS,
        closed: true,
    })
    rect.flogo_originalFill = rect.fill()
    rect.flogo_originalStroke = rect.stroke()
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
    condition.on("dblclick", (e) => _dispatchEdit(this, e, group.flogo_parentInstruction, group.flogo_parentPos))
    condition.on("click tap", (e) => _dispatchEdit2(this, e, group.flogo_parentInstruction, group.flogo_parentPos))
    group.add(b)
    const bPad = b.flogo_width < LINE_FONT_SIZE * 5 ? LINE_FONT_SIZE * 3 : PADDING_BASE
    b.x(condition.flogo_width + bPad)
    b.y(condition.flogo_height + PADDING_BASE)
    const endY = b.y() + b.flogo_height + SPACE_BETWEEN_INSTRUCTIONS + PADDING_BASE
    if (this.body.body.length > 0) {
        const arrowIn = new Konva.Arrow({
            x: condition.flogo_width,
            y: condition.flogo_height / 2,
            points: [0, 0, b.flogo_connX + bPad, 0, b.flogo_connX + bPad, condition.flogo_height / 2 + PADDING_BASE],
            pointerLength: LINE_ARROW_SIZE,
            pointerWidth: LINE_ARROW_SIZE,
            fill: LINE_COLOR,
            stroke: LINE_COLOR,
            strokeWidth: LINE_THICKNESS,
            hitStrokeWidth: LINE_THICKNESS + LINE_HITBOX_EXTRA,
        })
        arrowIn.on("click tap", (e) => _dispatchInsert(this.body, 0, e, arrowIn))
        _makeArrowHighlightable(arrowIn)
        group.add(arrowIn)
        const arrowToTop = new Konva.Arrow({
            x: condition.flogo_width + b.flogo_connX + bPad,
            y: b.y() + b.flogo_height,
            points: [
                0,
                0,
                0,
                SPACE_BETWEEN_INSTRUCTIONS,
                -(b.flogo_connX + condition.flogo_width / 2 + bPad) + PADDING_BASE,
                SPACE_BETWEEN_INSTRUCTIONS,
                -(b.flogo_connX + condition.flogo_width / 2 + bPad) + PADDING_BASE,
                -(b.flogo_height + PADDING_BASE),
            ],
            pointerLength: LINE_ARROW_SIZE,
            pointerWidth: LINE_ARROW_SIZE,
            fill: LINE_COLOR,
            stroke: LINE_COLOR,
            strokeWidth: LINE_THICKNESS,
            hitStrokeWidth: LINE_THICKNESS + LINE_HITBOX_EXTRA,
        })
        arrowToTop.on("click tap", (e) => _dispatchInsert(this.body, this.body.body.length, e, arrowToTop))
        _makeArrowHighlightable(arrowToTop)
        group.add(arrowToTop)
    } else {
        const loopArrow = new Konva.Arrow({
            x: condition.flogo_width,
            y: condition.flogo_height / 2,
            points: [
                0,
                0,
                b.flogo_connX + bPad,
                0,
                b.flogo_connX + bPad,
                condition.flogo_height / 2 + SPACE_BETWEEN_INSTRUCTIONS,
                -condition.flogo_width / 2 + PADDING_BASE,
                condition.flogo_height / 2 + SPACE_BETWEEN_INSTRUCTIONS,
                -condition.flogo_width / 2 + PADDING_BASE,
                condition.flogo_height / 2,
            ],
            pointerLength: LINE_ARROW_SIZE,
            pointerWidth: LINE_ARROW_SIZE,
            fill: LINE_COLOR,
            stroke: LINE_COLOR,
            strokeWidth: LINE_THICKNESS,
            hitStrokeWidth: LINE_THICKNESS + LINE_HITBOX_EXTRA,
        })
        loopArrow.on("click tap", (e) => _dispatchInsert(this.body, 0, e, loopArrow))
        _makeArrowHighlightable(loopArrow)
        group.add(loopArrow)
    }
    const arrowOut = new Konva.Arrow({
        x: condition.flogo_width / 2,
        y: condition.flogo_height,
        points: [0, 0, 0, b.flogo_height + SPACE_BETWEEN_INSTRUCTIONS * 2],
        pointerLength: 0,
        pointerWidth: 0,
        fill: LINE_COLOR,
        stroke: LINE_COLOR,
        strokeWidth: LINE_THICKNESS,
        hitStrokeWidth: LINE_THICKNESS + LINE_HITBOX_EXTRA,
    })
    group.add(arrowOut)
    const fText = new Konva.Text({
        x: 0,
        y: condition.flogo_height + BLOCK_OUTLINE_THICKNESS,
        text: "Done",
        fontSize: LINE_FONT_SIZE,
        fontFamily: FLOWCHART_FONT,
        fill: LINE_COLOR,
    })
    fText.x(condition.flogo_width / 2 - fText.width() - LINE_THICKNESS / 2 - LINE_FONT_SIZE / 4)
    group.add(fText)
    const tText = new Konva.Text({
        x: condition.x() + condition.flogo_width,
        y: condition.flogo_height / 2 - LINE_FONT_SIZE - LINE_THICKNESS / 2,
        text: "Next",
        fontSize: LINE_FONT_SIZE,
        fontFamily: FLOWCHART_FONT,
        fill: LINE_COLOR,
    })
    group.add(tText)
    group.flogo_width = b.x() + b.flogo_width
    group.flogo_height = endY
    group.flogo_connX = condition.flogo_width / 2
    group.flogo_highlightable = rect
    group.flogo_shapeOnly = condition
    this.drawable = group
    return group
}

function _dispatchEdit(instruction, evt, parent, posInParent) {
    if (_selectionMode) return
    const intState = interpreter.getState()
    if (intState === STATE_RUNNING || intState === STATE_PAUSED) return
    if (typeof ui_edit !== "undefined") {
        ui_edit(instruction, evt, parent, posInParent)
    } else {
        console.log("Edit " + instruction.constructor.name)
    }
}

function _dispatchEdit2(instruction, evt, parent, posInParent) {
    const intState = interpreter.getState()
    if (intState === STATE_RUNNING || intState === STATE_PAUSED) return
    let fire = false
    if (evt.type === "click") {
        if (evt.evt.button === 2) {
            fire = true
        }
    } else if (evt.type === "tap") {
        fire = true
    }
    if (fire) {
        if (typeof ui_edit2 !== "undefined") {
            ui_edit2(instruction, evt, parent, posInParent)
        } else {
            console.log("Edit 2 " + instruction.constructor.name)
        }
    }
}

function _dispatchInsert(instruction, pos, evt, arrow) {
    if (_selectionMode) return
    const intState = interpreter.getState()
    if (intState === STATE_RUNNING || intState === STATE_PAUSED) return
    if (typeof ui_insert !== "undefined") {
        arrow.flogo_forceHighlighted = true
        arrow.stroke(LINE_SELECTED_COLOR)
        arrow.fill(LINE_SELECTED_COLOR)
        const callback = () => {
            arrow.flogo_forceHighlighted = false
            arrow.stroke(LINE_COLOR)
            arrow.fill(LINE_COLOR)
        }
        ui_insert(instruction, pos, evt, callback)
    } else {
        console.log("Insert " + instruction.constructor.name + " @ " + pos)
    }
}

function _extractCoordFromEvent(evt, name, defaultVal = 0) {
    if (typeof evt[name] !== "undefined") return evt[name]
    if (typeof evt.changedTouches !== "undefined") {
        if (evt.changedTouches.length > 0) {
            return evt.changedTouches[0][name]
        }
    }
    if (typeof evt.touches !== "undefined") {
        if (evt.touches.length > 0) {
            return evt.touches[0][name]
        }
    }
    return defaultVal
}

let stage = null
let blockLayer, scollbarsLayer

function initFlowchart(id) {
    if (stage !== null) throw "Already initialized"
    stage = new Konva.Stage({
        container: id,
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
            pos.x = stage.width() - SCROLLBAR_PADDING - SCROLLBAR_THICKNESS
            if (pos.y < SCROLLBAR_PADDING + SCROLLBAR_THICKNESS) pos.y = SCROLLBAR_PADDING + SCROLLBAR_THICKNESS
            if (pos.y + vbar.height() * stage.scaleY() > stage.height() - SCROLLBAR_PADDING - SCROLLBAR_THICKNESS)
                pos.y = stage.height() - SCROLLBAR_PADDING - SCROLLBAR_THICKNESS - vbar.height() * stage.scaleY()
            return pos
        },
    })
    const hbar = new Konva.Rect({
        draggable: true,
        cornerRadius: Infinity,
        dragBoundFunc: function(pos) {
            if (pos.x < SCROLLBAR_PADDING + SCROLLBAR_THICKNESS) pos.x = SCROLLBAR_PADDING + SCROLLBAR_THICKNESS
            if (pos.x + hbar.width() * stage.scaleX() > stage.width() - SCROLLBAR_PADDING - SCROLLBAR_THICKNESS)
                pos.x = stage.width() - SCROLLBAR_PADDING - SCROLLBAR_THICKNESS - hbar.width() * stage.scaleX()
            pos.y = stage.height() - SCROLLBAR_PADDING - SCROLLBAR_THICKNESS
            return pos
        },
    })
    scrollbarsLayer.add(vbar)
    scrollbarsLayer.add(hbar)
    let bounds = null
    const resizeFun = () => {
        requestAnimationFrame(resizeFun)
        if (window.devicePixelRatio !== blockLayer.getCanvas().getPixelRatio()) {
            blockLayer.getCanvas().setPixelRatio(window.devicePixelRatio)
        }
        const b = stage.container().getBoundingClientRect()
        if (bounds === null || b.width !== bounds.width || b.height !== bounds.height) {
            stage.width(b.width)
            stage.height(b.height)
            if (bounds !== null) {
                let dx = b.width - bounds.width
                stage.x(stage.x() + dx / 2)
            }
            /*if(interpreter.currentInstruction!==null){
                ensureInstructionVisibleInFlowchart(interpreter.currentInstruction)
            }*/
            bounds = b
        }
    }
    resizeFun()
    const boundsFun = () => {
        requestAnimationFrame(boundsFun)
        const stageTop = stage.y(),
            stageLeft = stage.x(),
            stageBottom = stage.y() + stage.flogo_realHeight * stage.scaleY(),
            stageRight = stage.x() + stage.flogo_realWidth * stage.scaleX()
        const playY = stageBottom - stageTop + MINVIS - stage.height()
        if (playY > 0) {
            const minY = -(stageBottom - stageTop) + stage.height() - MINVIS
            if (stageTop < minY) {
                stage.y(minY)
            }
            if (stageTop > MINVIS) {
                stage.y(MINVIS)
            }
            vbar.show()
        } else {
            stage.y(PADDING_BASE)
            vbar.hide()
        }
        const playX = stageRight - stageLeft - stage.width()
        const chartMidX = (stage.flogo_realWidth * stage.scaleX()) / 2
        if (playX > 0) {
            const midX = stage.width() / 2
            const minX = midX - playX / 2 - MINVIS,
                maxX = midX + playX / 2 + MINVIS
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
    }
    boundsFun()
    stage.on("wheel", (e) => {
        if (e.evt.ctrlKey) {
            if (!_allowZoomOnFlowchart) return
            e.evt.preventDefault()
            const oldZoom = stage.scaleX()
            const ptr = stage.getPointerPosition()
            const mouseTo = {
                x: (ptr.x - stage.x()) / oldZoom,
                y: (ptr.y - stage.y()) / oldZoom,
            }
            let zoom = oldZoom * (1 - e.evt.deltaY / 1000)
            setFlowchartZoom(zoom)
            zoom = stage.scaleX()
            stage.position({
                x: ptr.x - mouseTo.x * zoom,
                y: ptr.y - mouseTo.y * zoom,
            })
        } else {
            stage.x(stage.x() - e.evt.deltaX / 2)
            stage.y(stage.y() - e.evt.deltaY / 2)
        }
    })
    stage.on("click", (e) => {
        if (e.target === stage) {
            if (typeof ui_cancel !== "undefined") {
                ui_cancel()
            } else {
                console.log("cancel")
            }
        }
    })
    stage.on("contextmenu", (e) => {
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
    stage.on("touchmove", (e) => {
        e.evt.preventDefault()
        if (e.evt.touches.length !== 2) return
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
                y: (newCenter.y - stage.y()) / stage.scaleX(),
            }
            let scale = stage.scaleX() * (dist / lastDist)
            setFlowchartZoom(scale)
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
    })
    let prevHighlightInstr = null
    const highlightFun = () => {
        requestAnimationFrame(highlightFun)
        if (!_selectionMode) {
            const i = interpreter.currentInstruction
            if (prevHighlightInstr !== i) {
                if (prevHighlightInstr !== null && prevHighlightInstr.drawable.flogo_highlightable !== null) {
                    if (prevHighlightInstr.drawable.flogo_highlightable.fill() !== prevHighlightInstr.drawable.flogo_highlightable.flogo_originalFill) {
                        prevHighlightInstr.drawable.flogo_highlightable.fill(prevHighlightInstr.drawable.flogo_highlightable.flogo_originalFill)
                    }
                    if (prevHighlightInstr.drawable.flogo_highlightable.stroke() !== prevHighlightInstr.drawable.flogo_highlightable.flogo_originalStroke) {
                        prevHighlightInstr.drawable.flogo_highlightable.stroke(prevHighlightInstr.drawable.flogo_highlightable.flogo_originalStroke)
                    }
                }
                if (i !== null && i.drawable.flogo_highlightable !== null) {
                    if (interpreter.getState() === STATE_CRASHED) {
                        if (i.drawable.flogo_highlightable.fill() !== ERROR_COLOR1) {
                            i.drawable.flogo_highlightable.fill(ERROR_COLOR1)
                        }
                        if (i.drawable.flogo_highlightable.stroke() !== ERROR_COLOR2) {
                            i.drawable.flogo_highlightable.stroke(ERROR_COLOR2)
                        }
                    } else {
                        if (i.drawable.flogo_highlightable.fill() !== i.drawable.flogo_highlightable.flogo_originalFill) {
                            i.drawable.flogo_highlightable.fill(i.drawable.flogo_highlightable.flogo_originalFill)
                        }
                        if (i.drawable.flogo_highlightable.stroke() !== HIGHLIGHT_COLOR) {
                            i.drawable.flogo_highlightable.stroke(HIGHLIGHT_COLOR)
                        }
                    }
                }
                ensureInstructionVisibleInFlowchart(i)
            }
            prevHighlightInstr = i
        }
    }
    highlightFun()
    let oldScrollbarState = null
    const updateScrollbars = () => {
        requestAnimationFrame(updateScrollbars)
        const newScrollbarState = JSON.stringify([
            //TODO: there's probably a better way to detect changes in these
            stage.x(),
            stage.y(),
            stage.width(),
            stage.height(),
            stage.flogo_realWidth,
            stage.flogo_realHeight,
            window.devicePixelRatio,
            SCROLLBAR_COLOR,
            SCROLLBAR_THICKNESS,
            SCROLLBAR_PADDING,
        ])
        if (newScrollbarState !== oldScrollbarState) {
            oldScrollbarState = newScrollbarState
            if (vbar.visible()) {
                const realHeight = stage.flogo_realHeight + (MINVIS * 2) / stage.scaleY()
                let yPos = -((stage.y() - MINVIS) / stage.scaleY()) / (realHeight - stage.height() / stage.scaleY())
                yPos = yPos < 0 ? 0 : yPos > 1 ? 1 : yPos
                vbar.x((stage.width() - stage.x() - SCROLLBAR_THICKNESS - SCROLLBAR_PADDING) / stage.scaleX())
                vbar.width(SCROLLBAR_THICKNESS / stage.scaleX())
                const maxYSize = stage.height() * 0.9
                let ySize = (500 * (stage.height() / stage.scaleY())) / realHeight
                ySize = ySize < 20 ? 20 : ySize > maxYSize ? maxYSize : ySize
                vbar.height(ySize / stage.scaleY())
                vbar.y((SCROLLBAR_PADDING + SCROLLBAR_THICKNESS + yPos * (stage.height() - ySize - 2 * (SCROLLBAR_PADDING + SCROLLBAR_THICKNESS)) - stage.y()) / stage.scaleY())
                vbar.fill(SCROLLBAR_COLOR)
                vbar.setHitStrokeWidth(SCROLLBAR_PADDING)
            }
            if (hbar.visible()) {
                const realWidth = stage.flogo_realWidth + (MINVIS * 2) / stage.scaleX()
                let xPos = -((stage.x() - MINVIS) / stage.scaleX()) / (realWidth - stage.width() / stage.scaleX())
                xPos = xPos < 0 ? 0 : xPos > 1 ? 1 : xPos
                hbar.y((stage.height() - stage.y() - SCROLLBAR_THICKNESS - SCROLLBAR_PADDING) / stage.scaleY())
                hbar.height(SCROLLBAR_THICKNESS / stage.scaleY())
                const maxXSize = stage.width() * 0.9
                let xSize = (500 * (stage.width() / stage.scaleX())) / realWidth
                xSize = xSize < 20 ? 20 : xSize > maxXSize ? maxXSize : xSize
                hbar.width(xSize / stage.scaleX())
                hbar.x((SCROLLBAR_PADDING + SCROLLBAR_THICKNESS + xPos * (stage.width() - xSize - 2 * (SCROLLBAR_PADDING + SCROLLBAR_THICKNESS)) - stage.x()) / stage.scaleX())
                hbar.fill(SCROLLBAR_COLOR)
                hbar.setHitStrokeWidth(SCROLLBAR_PADDING)
            }
        }
    }
    let yDragOff = 0,
        xDragOff = 0
    vbar.on("dragmove", (e) => {
        const y = _extractCoordFromEvent(e.evt, "clientY", 0) - yDragOff - blockLayer.getCanvas()._canvas.getBoundingClientRect().top
        const yTop = SCROLLBAR_PADDING + SCROLLBAR_THICKNESS,
            yBottom = stage.height() - (SCROLLBAR_PADDING + SCROLLBAR_THICKNESS) - vbar.height() * stage.scaleY()
        let yPos = (y - yTop) / (yBottom - yTop)
        yPos = yPos < 0 ? 0 : yPos > 1 ? 1 : yPos
        const h = stage.flogo_realHeight * stage.scaleY() + MINVIS * 2 - stage.height()
        yPos *= h
        stage.y(-yPos + MINVIS)
    })
    vbar.on("dragstart", (e) => {
        yDragOff = _extractCoordFromEvent(e.evt, "clientY", 0) - (vbar.y() * stage.scaleY() + stage.y()) - blockLayer.getCanvas()._canvas.getBoundingClientRect().top
    })
    hbar.on("dragmove", (e) => {
        const x = _extractCoordFromEvent(e.evt, "clientX", 0) - xDragOff - blockLayer.getCanvas()._canvas.getBoundingClientRect().left
        const xLeft = SCROLLBAR_PADDING + SCROLLBAR_THICKNESS,
            xRight = stage.width() - (SCROLLBAR_PADDING + SCROLLBAR_THICKNESS) - hbar.width() * stage.scaleX()
        let xPos = (x - xLeft) / (xRight - xLeft)
        xPos = xPos < 0 ? 0 : xPos > 1 ? 1 : xPos
        const w = stage.flogo_realWidth * stage.scaleX() + MINVIS * 2 - stage.width()
        xPos *= w
        stage.x(-xPos + MINVIS)
    })
    hbar.on("dragstart", (e) => {
        xDragOff = _extractCoordFromEvent(e.evt, "clientX", 0) - (hbar.x() * stage.scaleX() + stage.x()) - blockLayer.getCanvas()._canvas.getBoundingClientRect().left
    })
    stage.on("dragstart dragmove dragend", (e) => {
        if (e.target === vbar || e.target === hbar) {
            e.evt.preventDefault()
        }
    })
    updateScrollbars()
    loadFlowchartThemeFromCSS()
}

function ensureInstructionVisibleInFlowchart(i) {
    if (i !== null && i.drawable.flogo_highlightable !== null) {
        let ipos = i.drawable.flogo_highlightable.absolutePosition()
        const x = ipos.x + i.drawable.flogo_highlightable.width() * stage.scaleX()
        const y = ipos.y + i.drawable.flogo_highlightable.height() * stage.scaleY()
        if (x >= stage.width()) {
            const diff = x - stage.width() + PADDING_BASE
            stage.x(stage.x() - diff)
        }
        if (y >= stage.height()) {
            const diff = y - stage.height() + PADDING_BASE
            stage.y(stage.y() - diff)
        }
        ipos = i.drawable.flogo_highlightable.absolutePosition()
        if (ipos.x < 0) {
            stage.x(stage.x() - ipos.x + PADDING_BASE)
        }
        if (ipos.y < 0) {
            stage.y(stage.y() - ipos.y + PADDING_BASE)
        }
    }
}

let _prevFlowChartWidth = 0

function updateFlowchart(resetCamera = false) {
    blockLayer.destroyChildren()
    const i = program.createDrawable()
    stage.flogo_realWidth = i.flogo_width
    stage.flogo_realHeight = i.y() + i.flogo_height
    _prevFlowChartWidth = i.flogo_width * stage.scaleX()
    blockLayer.add(i)
    if (resetCamera) {
        setFlowchartZoom(1)
        setFlowchartCamera(stage.width() / 2 - i.flogo_connX, PADDING_BASE)
    }
}

function setFlowchartZoom(zoom) {
    if (isNaN(zoom)) zoom = 1
    zoom = zoom < 0.2 ? 0.2 : zoom > 5 ? 5 : zoom
    const oldZoom = stage.scaleX()
    stage.scale({
        x: zoom,
        y: zoom,
    })
    _prevFlowChartWidth = (_prevFlowChartWidth / oldZoom) * zoom
}

function setFlowchartCamera(x, y) {
    stage.position({
        x: x,
        y: y,
    })
}

function _getCSSVal(name, defaultValue, element = blockLayer.getCanvas()._canvas) {
    const v = getComputedStyle(element).getPropertyValue(name)
    if (v !== "") {
        return v
    } else {
        return defaultValue
    }
}

function loadFlowchartThemeFromCSS(callback) {
    ASSIGN_COLOR1 = _getCSSVal("--flowchart-Assign-color1", "#696a30")
    ASSIGN_COLOR2 = _getCSSVal("--flowchart-Assign-color2", "#84853d")
    OUTPUT_COLOR1 = _getCSSVal("--flowchart-Output-color1", "#3f7335")
    OUTPUT_COLOR2 = _getCSSVal("--flowchart-Output-color2", "#509243")
    INPUT_COLOR1 = _getCSSVal("--flowchart-Input-color1", "#305c6a")
    INPUT_COLOR2 = _getCSSVal("--flowchart-Input-color2", "#3d7585")
    IF_COLOR1 = _getCSSVal("--flowchart-If-color1", "#783753")
    IF_COLOR2 = _getCSSVal("--flowchart-If-color2", "#924365")
    DOWHILE_COLOR1 = _getCSSVal("--flowchart-DoWhile-color1", "#326d4f")
    DOWHILE_COLOR2 = _getCSSVal("--flowchart-DoWhile-color2", "#3e8762")
    WHILE_COLOR1 = _getCSSVal("--flowchart-While-color1", "#326d4f")
    WHILE_COLOR2 = _getCSSVal("--flowchart-While-color2", "#3e8762")
    FOR_COLOR1 = _getCSSVal("--flowchart-For-color1", "#326d4f")
    FOR_COLOR2 = _getCSSVal("--flowchart-For-color2", "#3e8762")
    BREAKPOINT_COLOR1 = _getCSSVal("--flowchart-Breakpoint-color1", "#9a5758")
    BREAKPOINT_COLOR2 = _getCSSVal("--flowchart-Breakpoint-color2", "#bd6b6c")
    COMMENT_COLOR1 = _getCSSVal("--flowchart-Comment-color1", null)
    COMMENT_COLOR2 = _getCSSVal("--flowchart-Comment-color2", "#cccccc")
    COMMENT_DASH_LENGTH = Number(_getCSSVal("--flowchart-Comment-dashLength", 10))
    ERROR_COLOR1 = _getCSSVal("--flowchart-Error-color1", "#000000")
    ERROR_COLOR2 = _getCSSVal("--flowchart-Error-color2", "#c00000")
    ROUND_COLOR1 = _getCSSVal("--flowchart-Round-color1", "#4c45a5")
    ROUND_COLOR2 = _getCSSVal("--flowchart-Round-color2", "#3d3886")
    BLOCK_OUTLINE_THICKNESS = Number(_getCSSVal("--flowchart-Block-outline-thickness", 2))
    HIGHLIGHT_COLOR = _getCSSVal("--flowchart-Block-highlight-color", "#ffffff")
    FLOWCHART_FONT = _getCSSVal("--flowchart-Font-family", "monospace")
    BLOCK_FONT_SIZE = Number(_getCSSVal("--flowchart-Block-font-size", 12))
    BLOCK_TEXT_COLOR = _getCSSVal("--flowchart-Block-text-color", "#ffffff")
    LINE_THICKNESS = Number(_getCSSVal("--flowchart-Line-thickness", 2))
    LINE_ARROW_SIZE = Number(_getCSSVal("--flowchart-Line-arrow-size", 4))
    LINE_HITBOX_EXTRA = LINE_ARROW_SIZE + 6
    LINE_FONT_SIZE = Number(_getCSSVal("--flowchart-Line-font-size", 10))
    LINE_COLOR = _getCSSVal("--flowchart-Line-color", "#ffffff")
    LINE_SELECTED_COLOR = _getCSSVal("--flowchart-Line-selected-color", "#ff0000")
    PADDING_BASE = Number(_getCSSVal("--flowchart-Padding-base", 10))
    MINVIS = PADDING_BASE * 2
    SPACE_BETWEEN_INSTRUCTIONS = Number(_getCSSVal("--flowchart-Padding-spaceBetweenInstructions", 24))
    BLOCK_TEXT_MAX_WIDTH = Number(_getCSSVal("--flowchart-Block-text-maxWidth", 25)) * BLOCK_FONT_SIZE
    ROUND_MIN_WIDTH = Number(_getCSSVal("--flowchart-Round-text-minWidth", 7)) * BLOCK_FONT_SIZE
    COMMENT_TEXT_MAX_LENGTH = Number(_getCSSVal("--flowchart-Comment-text-maxLength", 250))
    SCROLLBAR_THICKNESS = Number(_getCSSVal("--flowchart-scrollbar-thickness", 6))
    SCROLLBAR_PADDING = Number(_getCSSVal("--flowchart-scrollbar-padding", 4))
    SCROLLBAR_COLOR = _getCSSVal("--flowchart-scrollbar-color", "#ffffff60")
    const fontChecker = () => {
        if (FLOWCHART_FONT !== "" && !document.fonts.check("1em " + FLOWCHART_FONT)) {
            requestAnimationFrame(fontChecker)
        } else {
            updateFlowchart()
            if (typeof callback !== "undefined") {
                callback()
            }
        }
    }
    updateFlowchart(true)
    if (FLOWCHART_FONT !== "" && !document.fonts.check("1em " + FLOWCHART_FONT)) {
        fontChecker()
    } else {
        if (typeof callback !== "undefined") {
            callback()
        }
    }
}

async function _fontToBase64(url) {
    const response = await fetch(url)
    const buffer = await response.arrayBuffer()
    const base64 = btoa(String.fromCharCode(...new Uint8Array(buffer)))
    return `data:font/woff2;base64,${base64}`
}

function downloadSVG(name) {
    const oldX = stage.x(),
        oldY = stage.y(),
        oldZ = stage.scale()
    const oldContext = blockLayer.canvas.context._context
    const tempCtx = (blockLayer.canvas.context._context = new Context({
        width: stage.flogo_realWidth + 2 * PADDING_BASE,
        height: stage.flogo_realHeight + 2 * PADDING_BASE,
        ctx: oldContext,
    }))
    stage.x(PADDING_BASE)
    stage.y(PADDING_BASE)
    stage.scale({
        x: 1,
        y: 1,
    })
    stage.draw()
    let out = tempCtx.getSerializedSvg()
    out = out.replace(/<rect[a-zA-Z0-9\s="#.()]*\/>/, "") //gets rid of the background rect
    blockLayer.canvas.context._context = oldContext
    stage.x(oldX)
    stage.y(oldY)
    stage.scale(oldZ)
    stage.draw()
    if (typeof name === "undefined") {
        if (metadata.title.trim() !== "") {
            name = metadata.title
        } else {
            name = "Untitled"
        }
    }
    if (!name.endsWith(".svg")) name += ".svg"
    const doDownload = () => {
        const blob = new Blob([out], {
            type: "image/svg+xml;charset=utf-8",
        })
        const a = document.createElement("a")
        a.href = URL.createObjectURL(blob)
        a.download = name
        a.click()
    }
    let embeddableFontURL = _getCSSVal("--flowchart-Font-svgEmbeddableFile", null)
    if (embeddableFontURL !== null) {
        if (embeddableFontURL.startsWith('"') || embeddableFontURL.startsWith("'")) {
            embeddableFontURL = embeddableFontURL.slice(1, embeddableFontURL.length - 1)
        }
        _fontToBase64(embeddableFontURL)
            .then((data) => {
                const svgStyle = `<style>@font-face{font-family:${FLOWCHART_FONT};src:url('${data}') format('woff2');}</style>`
                const pos = out.indexOf(">") + 1
                out = out.slice(0, pos) + svgStyle + out.slice(pos)
                doDownload()
            })
            .catch((err) => {
                console.log("Not embedding font in SVG: " + err)
                doDownload()
            })
    } else {
        console.log("Not embedding font in SVG: no svgEmbeddableFile")
        doDownload()
    }
}

function downloadPNG(name, superSampling = 2) {
    const oldX = stage.x(),
        oldY = stage.y(),
        oldZ = stage.scale()
    const oldContext = blockLayer.canvas.context._context
    const tempCanvas = document.createElement("canvas")
    const cw = (stage.flogo_realWidth + 2 * MINVIS) * superSampling
    const ch = (stage.flogo_realHeight + 2 * MINVIS) * superSampling
    if (cw > 16000 || ch > 16000) {
        console.log("PNG output too large, reducing quality")
        superSampling *= 16000 / Math.max(cw, ch)
    }
    tempCanvas.width = (stage.flogo_realWidth + 2 * MINVIS) * superSampling
    tempCanvas.height = (stage.flogo_realHeight + 2 * MINVIS) * superSampling
    blockLayer.canvas.context._context = tempCanvas.getContext("2d")
    stage.x(MINVIS * superSampling)
    stage.y(MINVIS * superSampling)
    stage.scale({
        x: superSampling,
        y: superSampling,
    })
    stage.draw()
    const out = tempCanvas.toDataURL("image/png")
    blockLayer.canvas.context._context = oldContext
    stage.x(oldX)
    stage.y(oldY)
    stage.scale(oldZ)
    stage.draw()
    if (typeof name === "undefined") {
        if (metadata.title.trim() !== "") {
            name = metadata.title
        } else {
            name = "Untitled"
        }
    }
    if (!name.endsWith(".png")) name += ".png"
    const a = document.createElement("a")
    a.href = out
    a.download = name
    a.click()
}
