/*
 * This file contains the interpreter for Flogo. It's a simple interpreted prorgamming language.
 */

//-------- VARIABLES AND TYPE SYSTEM --------
/* Flogo is strongly and statically typed, but uses JS underneath so some checks are required to make sure that values are of the correct type and can't change over time, that variables aren't re-decleared, etc.
 *
 * Integers have a range of +/- ~2^53
 * Reals use 64-bit floating point
 * Strings are just JS strings
 * Booleans can only contain true/false
 * All variables can be set to null to indicate that they have not been initialized
 * Arrays are not implemented (for now)
 *
 * All variables are stored into a dictionary called variables; each variable is actually a Proxy to a hidden internal object that contains its type, value and initial value; the proxy is used to enforce typing. Code that needs to access a Flogo variable can just write variables["name"].value, a type attribute is also available. The variables dictionary can be read directly but should not be modified directly, use the provided functions instead.
 *
 * Two functions are also provided for convenience: clearVariables() deletes all variables, resetVariables() resets all variables to their original values; variables that don't have an initial value get null.
 */

let variables = {}

function _isValidVariableName(name) {
    if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(name)) {
        return false
    }
    if (["true", "false", "PI", "E"].includes(name)) {
        return false
    }
    return true
}

function declareVariable(name, type, value = null) {
    if (!_isValidVariableName(name)) {
        throw "Invalid name"
    }
    if (typeof variables[name] !== "undefined") throw "Variable already exists"
    if (type !== "integer" && type !== "real" && type !== "string" && type !== "boolean") throw "Invalid type"
    const variableGetterAndSetter = {
        set(target, prop, value) {
            if (prop !== "value") throw "Variables can only change value"
            if (value !== null) {
                switch (target["type"]) {
                    case "integer": {
                        if (typeof value !== "number") throw "Not a number"
                        if (isNaN(value)) throw "Not a valid number"
                        if (value < Number.MIN_SAFE_INTEGER || value > Number.MAX_SAFE_INTEGER) throw "Value too big"
                        if (Number.isInteger(value)) {
                            target.value = value
                        } else {
                            target.value = Math.trunc(value)
                        }
                    }
                    break
                    case "real": {
                        if (typeof value !== "number") throw "Not a number"
                        if (isNaN(value)) throw "Not a valid number"
                        target.value = value
                    }
                    break
                    case "string": {
                        if (typeof value === "string") {
                            target.value = value
                        } else {
                            target.value = "" + value
                        }
                    }
                    break
                    case "boolean": {
                        if (typeof value !== "boolean") throw "Not a boolean"
                        target.value = value
                    }
                }
            } else {
                target.value = null
            }
            target.modified = true
        },
        get(target, prop, receiver) {
            return target[prop]
        },
    }
    const v = {
        type: type,
        value: null,
        modified: false
    }
    const proxy = new Proxy(v, variableGetterAndSetter)
    proxy.value = value
    v.initialValue = v.value
    v.modified = false
    v.toSimpleObject = () => {
        return {
            type: v.type,
            value: v.initialValue
        }
    }
    v.reset = () => {
        v.value = v.initialValue
        v.modified = false
    }
    variables[name] = proxy
}

function clearVariables() {
    variables = {}
}

function resetVariables() {
    for (const v in variables) {
        variables[v].reset()
    }
}

function removeVariable(name) {
    if (typeof variables[name] === undefined) throw "Variable does not exist: " + name
    delete variables[name]
}

//-------- EXPRESSION PARSING --------
/*
 * Expressions are first parsed using the jsep library to turn them into an easily manageable AST; the AST is then processed recursively to evaluate the expression.
 * Math operators: ^ * / % + -
 * Comparison operators: < > <= >= == !=
 * Logical operators: ! && ||
 * Literals and constants: true, false, PI, E
 * Built-in functions: abs, sqrt, sin, cos, tan, asin, acos, atan, ln, log(base,val) ceil, floor, round, toFixed(val,digits), random (real between 0 and 1), len, charAt(string,index), codeToChar, charToCode, strToReal, strToInt, currentTime
 * Round brackets are allowed in expressions
 * Strings are delimited by single or double quotes
 * Trigonometric functions work with rads
 * + does both sum and string concatenation
 * Expressions are always evaluated fully (no lazy evaluation)
 *
 * The evaluateExpression function takes an expression in the form of text, parses and executes it; it returns the computed result of the expression or throws an exception in case of errors such as unclosed brackets, uninitialized variables, etc.
 */

//JSEP CONFIGURATION
jsep.removeAllUnaryOps()
jsep.removeAllBinaryOps()
jsep.removeAllLiterals()
jsep.addLiteral("true", true)
jsep.addLiteral("false", false)
jsep.addLiteral("PI", Math.PI)
jsep.addLiteral("E", Math.E)
jsep.addUnaryOp("-", 1)
jsep.addUnaryOp("!", 1)
jsep.addUnaryOp("+", 1)
jsep.addBinaryOp("||", 1)
jsep.addBinaryOp("&&", 2)
jsep.addBinaryOp("==", 6)
jsep.addBinaryOp("!=", 6)
jsep.addBinaryOp("<", 7)
jsep.addBinaryOp(">", 7)
jsep.addBinaryOp("<=", 7)
jsep.addBinaryOp(">=", 7)
jsep.addBinaryOp("+", 9)
jsep.addBinaryOp("-", 9)
jsep.addBinaryOp("*", 10)
jsep.addBinaryOp("/", 10)
jsep.addBinaryOp("%", 10)
jsep.addBinaryOp("^", 11, true)

//EXPRESSION EVALUATION AND BUILT-IN FUNCTIONS IMPLEMEMENTAION
function evaluateExpression(text) {
    const tree = jsep(text)
    const expr_rec = (n) => {
        switch (n.type) {
            case jsep.LITERAL: {
                return n.value
            }
            break
            case jsep.IDENTIFIER: {
                if (typeof variables[n.name] === "undefined") throw "Variable does not exist " + n.name
                if (variables[n.name].value === null) throw "Variable not initialized: " + n.name
                return variables[n.name].value
            }
            break
            case jsep.UNARY_EXP: {
                const val = expr_rec(n.argument)
                switch (n.operator) {
                    case "-": {
                        if (typeof val !== "number") throw "Not a valid number"
                        return -val
                    }
                    break
                    case "!": {
                        if (typeof val !== "boolean") throw "Not a valid condition"
                        return !val
                    }
                    break
                    case "+": {
                        if (typeof val !== "number") throw "Not a valid number"
                        return val
                    }
                    break
                    default: {
                        throw "Invalid operator: " + n.operator
                    }
                }
            }
            break
            case jsep.BINARY_EXP: {
                const left = expr_rec(n.left)
                const right = expr_rec(n.right)
                switch (n.operator) {
                    case "^": {
                        if (typeof left !== "number" || typeof right !== "number") throw "Power requires 2 numbers"
                        return Math.pow(left, right)
                    }
                    break
                    case "*": {
                        if (typeof left !== "number" || typeof right !== "number") throw "Multiplication requires 2 numbers"
                        return left * right
                    }
                    break
                    case "/": {
                        if (typeof left !== "number" || typeof right !== "number") throw "Division requires 2 numbers"
                        if (right === 0) throw "Division by 0"
                        return left / right
                    }
                    break
                    case "%": {
                        if (typeof left !== "number" || typeof right !== "number") throw "Modulus requires 2 numbers"
                        if (right === 0) throw "Modulus by 0"
                        return left % right
                    }
                    break
                    case "+": {
                        if ((typeof left !== "number" || typeof right !== "number") && !(typeof left === "string" || typeof right === "string"))
                            throw "Addition can only add numbers or concatenate strings"
                        return left + right
                    }
                    break
                    case "-": {
                        if (typeof left !== "number" || typeof right !== "number") throw "Subtraction requires 2 numbers"
                        return left - right
                    }
                    break
                    case "<": {
                        if (typeof left !== typeof right) throw "Can't compare different types"
                        if (typeof left === "boolean" || typeof right === "boolean") throw "< can't compare booleans"
                        return left < right
                    }
                    break
                    case ">": {
                        if (typeof left !== typeof right) throw "Can't compare different types"
                        if (typeof left === "boolean" || typeof right === "boolean") throw "> can't compare booleans"
                        return left > right
                    }
                    break
                    case "<=": {
                        if (typeof left !== typeof right) throw "Can't compare different types"
                        if (typeof left === "boolean" || typeof right === "boolean") throw "<= can't compare booleans"
                        return left <= right
                    }
                    break
                    case ">=": {
                        if (typeof left !== typeof right) throw "Can't compare different types"
                        if (typeof left === "boolean" || typeof right === "boolean") throw ">= can't compare booleans"
                        return left >= right
                    }
                    break
                    case "==": {
                        if (typeof left !== typeof right) throw "Can't compare different types"
                        return left == right
                    }
                    break
                    case "!=": {
                        if (typeof left !== typeof right) throw "Can't compare different types"
                        return left != right
                    }
                    break
                    case "&&": {
                        if (typeof left !== "boolean" || typeof right !== "boolean") throw "Not a valid condition"
                        return left && right
                    }
                    break
                    case "||": {
                        if (typeof left !== "boolean" || typeof right !== "boolean") throw "Not a valid condition"
                        return left || right
                    }
                    break
                    default: {
                        throw "Invalid operator: " + n.operator
                    }
                }
            }
            break
            case jsep.CALL_EXP: {
                switch (n.callee.name) {
                    case "abs": {
                        if (n.arguments.length !== 1) throw "abs requires 1 argument"
                        const val = expr_rec(n.arguments[0])
                        if (typeof val !== "number") throw "abs requires a number"
                        return Math.abs(val)
                    }
                    break
                    case "sqrt": {
                        if (n.arguments.length !== 1) throw "sqrt requires 1 argument"
                        const val = expr_rec(n.arguments[0])
                        if (typeof val !== "number") throw "sqrt requires a number"
                        if (val < 0) throw "sqrt requires a number >=0"
                        return Math.sqrt(val)
                    }
                    break
                    case "sin": {
                        if (n.arguments.length !== 1) throw "sin requires 1 argument"
                        const val = expr_rec(n.arguments[0])
                        if (typeof val !== "number") throw "sin requires a number"
                        return Math.sin(val)
                    }
                    break
                    case "cos": {
                        if (n.arguments.length !== 1) throw "cos requires 1 argument"
                        const val = expr_rec(n.arguments[0])
                        if (typeof val !== "number") throw "cos requires a number"
                        return Math.cos(val)
                    }
                    break
                    case "tan": {
                        if (n.arguments.length !== 1) throw "tan requires 1 argument"
                        let val = expr_rec(n.arguments[0])
                        if (typeof val !== "number") throw "tan requires a number"
                        val %= 2 * Math.PI
                        if (val === Math.PI / 2 || val === (3 * Math.PI) / 2) throw "tan is undefined for PI/2 and 3PI/2"
                        return Math.tan(val)
                    }
                    break
                    case "asin": {
                        if (n.arguments.length !== 1) throw "asin requires 1 argument"
                        const val = expr_rec(n.arguments[0])
                        if (typeof val !== "number") throw "asin requires a number"
                        if (val < -1 || val > 1) throw "asin requires a number between -1 and 1"
                        return Math.asin(val)
                    }
                    break
                    case "acos": {
                        if (n.arguments.length !== 1) throw "acos requires 1 argument"
                        const val = expr_rec(n.arguments[0])
                        if (typeof val !== "number") throw "acos requires a number"
                        if (val < -1 || val > 1) throw "acos requires a number between -1 and 1"
                        return Math.acos(val)
                    }
                    break
                    case "atan": {
                        if (n.arguments.length !== 1) throw "atan requires 1 argument"
                        const val = expr_rec(n.arguments[0])
                        if (typeof val !== "number") throw "atan requires a number"
                        return Math.atan(val)
                    }
                    break
                    case "ln": {
                        if (n.arguments.length !== 1) throw "ln requires 1 argument"
                        const val = expr_rec(n.arguments[0])
                        if (typeof val !== "number") throw "ln requires a number"
                        if (val <= 0) throw "ln requires a number >0"
                        return Math.log(val)
                    }
                    break
                    case "log": {
                        if (n.arguments.length !== 2) throw "log requires 2 arguments"
                        const base = expr_rec(n.arguments[0])
                        const val = expr_rec(n.arguments[1])
                        if (typeof base !== "number" || typeof val !== "number") throw "log requires 2 numbers"
                        if (base <= 0) throw "base must be a number >0"
                        if (val <= 0) throw "value must be a number >0"
                        return Math.log(val) / Math.log(base)
                    }
                    break
                    case "ceil": {
                        if (n.arguments.length !== 1) throw "ceil requires 1 argument"
                        const val = expr_rec(n.arguments[0])
                        if (typeof val !== "number") throw "ceil requires a number"
                        return Math.ceil(val)
                    }
                    break
                    case "floor": {
                        if (n.arguments.length !== 1) throw "floor requires 1 argument"
                        const val = expr_rec(n.arguments[0])
                        if (typeof val !== "number") throw "floor requires a number"
                        return Math.floor(val)
                    }
                    break
                    case "round": {
                        if (n.arguments.length !== 1) throw "round requires 1 argument"
                        const val = expr_rec(n.arguments[0])
                        if (typeof val !== "number") throw "round requires a number"
                        return Math.round(val)
                    }
                    break
                    case "random": {
                        if (n.arguments.length !== 0) throw "random takes no arguments"
                        return Math.random()
                    }
                    break
                    case "toFixed": {
                        if (n.arguments.length !== 2) throw "toFixed requires 2 arguments"
                        const val = expr_rec(n.arguments[0])
                        const digits = expr_rec(n.arguments[1])
                        if (typeof val !== "number") throw "toFixed requires a number"
                        if (!Number.isInteger(digits) || digits < 0) throw "The number of digits must be an integer >=0"
                        return val.toFixed(digits)
                    }
                    break
                    case "len": {
                        if (n.arguments.length !== 1) throw "len requires 1 argument"
                        const val = expr_rec(n.arguments[0])
                        if (typeof val !== "string") throw "len requires a string"
                        return val.length
                    }
                    break
                    case "charAt": {
                        if (n.arguments.length !== 2) throw "charAt requires 2 arguments"
                        const string = expr_rec(n.arguments[0])
                        const index = expr_rec(n.arguments[1])
                        if (typeof string !== "string") throw "charAt requires a string"
                        if (!Number.isInteger(index)) throw "index must be an integer"
                        if (index < 0 || index >= string.length) throw "index out of range"
                        return string.charAt(index)
                    }
                    break
                    case "charToCode": {
                        if (n.arguments.length !== 1) throw "charToCode requires 1 argument"
                        const val = expr_rec(n.arguments[0])
                        if (typeof val !== "string") throw "charToCode requires a string"
                        if (val.length !== 1) throw "charToCode requires a single character"
                        return val.charCodeAt(0)
                    }
                    break
                    case "codeToChar": {
                        if (n.arguments.length !== 1) throw "codeToChar requires 1 argument"
                        const val = expr_rec(n.arguments[0])
                        if (!Number.isInteger(val)) throw "codeToChar requires an integer"
                        return String.fromCharCode(val)
                    }
                    break
                    case "strToReal": {
                        if (n.arguments.length !== 1) throw "strToReal requires 1 argument"
                        let val = expr_rec(n.arguments[0])
                        if (typeof val !== "string") throw "strToReal requires a string"
                        val = parseFloat(val)
                        if (isNaN(val)) throw "String does not contain a valid number"
                        return val
                    }
                    break
                    case "strToInt": {
                        if (n.arguments.length !== 1) throw "strToInt requires 1 argument"
                        let val = expr_rec(n.arguments[0])
                        if (typeof val !== "string") throw "strToInt requires a string"
                        val = parseFloat(val)
                        if (isNaN(val)) throw "String does not contain a valid number"
                        if (!Number.isInteger(val) || val < Number.MIN_SAFE_INTEGER || val > Number.MAX_SAFE_INTEGER) throw "String does not contain a valid integer"
                        return Math.trunc(val)
                    }
                    break
                    case "currentTime": {
                        //TODO: maybe add functions for current date, month, year?
                        if (n.arguments.length !== 0) throw "currentTime takes no arguments"
                        return performance.now()
                    }
                    break
                    default: {
                        throw "Function does not exist: " + n.callee.name
                    }
                }
            }
            break
            default: {
                throw "Syntax error"
            }
        }
    }
    return expr_rec(tree)
}

//--------  BASIC PROGRAMMING CONSTRUCTS --------
/*
 * This section contains the implementation of basic programming constructs, as well as the main loop for the interpreter.
 * Flogo implements the following basic instructions:
 * - Assignment: var=expr
 * - If: if(condition) trueBranch; else falseBranch
 * - DoWhile: do body while(condition)
 * - While: while(condition) body
 * - For: BASIC-style for loop: requires a variable, a starting value, an end value (inclusive), a step, a direction (up/down).
 *      Equivalent to this code when going up: var=from; while(from<=to){ body; var+=step }
 *      Equivalent to this code when going down: var=from; while(from>=to){ body; var-=step }
 *      In other words, extremes are included in the range.
 *      Expressions can be used in the various fields.
 * - Breakpoint: simply pauses execution when the instruction is executed.
 *
 * The implementation of each instruction is relatively simple and modular.
 * Instructions are objects of a class that represents their type, such as the Assignment or the If class.
 * Each class implements a constructor that initializes an "empty" version of the instruction (such as an if with a null condition and empty true/false branches) and the following methods:
 * - tick(): runs a "step" of execution for this instruction; returns true if the instruction has finished executing, false otherwise. This allows for easy implementation of nested ifs, loops, etc.
 *          If this instruction has other sub-instructions inside it (such as a loop), these instructions will be in an InstructionSequence; this tick function will call the tick function recursively of the InstructionSequence and it will take care of keeping track of where we are inside the body/branch. Eventually the InstructionSequence's tick function will return true and we can update this instruction's state (for instance, if it's a for loop, we can do the increment and reevaluate the condition). To keep track of the current state, all instructions use a state attribute that is automatically reset when the program is (re)started; if you're going to implement your own instructions, remember to delete this.state before returning true
 *          The tick function of the "main" (the variable called program) is called repeatedly from the main loop; the call then continues recursively
 * - toSimpleObject(): returns a simplified version of this instruction that only contains the data that needs to be stored when the program is saved to JSON
 * - fromSimpleObject(o): static method, transforms a simple object back into a regular instruction that can be executed and returns it. This method also recursively transforms any sub-instruction.
 */

function InstructionSequence() {
    this.body = []
}
InstructionSequence.prototype = {
    constructor: InstructionSequence,
    tick: function() {
        interpreter.currentInstruction = this
        if (typeof this.state === "undefined") this.state = 0
        if (this.state < this.body.length) {
            if (this.body[this.state].tick()) {
                this.state++
                if (this.state === this.body.length) {
                    delete this.state
                    return true
                }
            }
            return false
        } else {
            delete this.state
            return true
        }
    },
    toSimpleObject: function() {
        const b = []
        this.body.forEach((i) => b.push(i.toSimpleObject()))
        return {
            type: "InstructionSequence",
            body: b,
        }
    },
}
InstructionSequence.fromSimpleObject = function(o) {
    if (o.type !== "InstructionSequence") throw "Not an InstructionSequence"
    const r = new InstructionSequence()
    o.body.forEach((i) => r.body.push(globalThis[i.type].fromSimpleObject(i)))
    return r
}

function Assign(variable = null, expression = null) {
    this.variable = variable
    this.expression = expression
}
Assign.prototype = {
    constructor: Assign,
    tick: function() {
        interpreter.currentInstruction = this
        if (this.variable === null || this.expression === null) throw "Incomplete instruction"
        if (typeof variables[this.variable] === "undefined") throw "Variable does not exist: " + this.variable
        variables[this.variable].value = evaluateExpression(this.expression)
        return true
    },
    toSimpleObject: function() {
        return {
            type: "Assign",
            variable: this.variable,
            expression: this.expression,
        }
    },
}
Assign.fromSimpleObject = function(o) {
    if (o.type !== "Assign") throw "Not an Assign"
    return new Assign(o.variable, o.expression)
}

function If(condition = null, trueBranch = new InstructionSequence(), falseBranch = new InstructionSequence()) {
    this.condition = condition
    this.trueBranch = trueBranch
    this.falseBranch = falseBranch
}
If.prototype = {
    constructor: If,
    tick: function() {
        if (typeof this.state !== "undefined") {
            const selectedBranch = this.state ? this.trueBranch : this.falseBranch
            if (selectedBranch.tick()) {
                delete this.state
                return true
            } else {
                return false
            }
        } else {
            interpreter.currentInstruction = this
            if (this.condition === null) throw "Incomplete instruction"
            const val = evaluateExpression(this.condition)
            if (typeof val !== "boolean") throw "Not a valid condition"
            this.state = val
            return false
        }
    },
    toSimpleObject: function() {
        return {
            type: "If",
            condition: this.condition,
            trueBranch: this.trueBranch.toSimpleObject(),
            falseBranch: this.falseBranch.toSimpleObject(),
        }
    },
}
If.fromSimpleObject = function(o) {
    if (o.type !== "If") throw "Not an If"
    const r = new If(o.condition)
    r.trueBranch = globalThis[o.trueBranch.type].fromSimpleObject(o.trueBranch)
    r.falseBranch = globalThis[o.falseBranch.type].fromSimpleObject(o.falseBranch)
    return r
}

function DoWhile(condition = null, body = new InstructionSequence()) {
    this.condition = condition
    this.body = body
}
DoWhile.prototype = {
    constructor: DoWhile,
    tick: function() {
        interpreter.currentInstruction = this
        if (typeof this.state === "undefined") {
            this.state = 0
        }
        if (this.state === 0) {
            if (this.body.tick()) {
                this.state = 1
            } else {
                return false
            }
        } else {
            if (this.condition === null) throw "Incomplete instruction"
            const val = evaluateExpression(this.condition)
            if (typeof val !== "boolean") throw "Not a valid condition"
            if (val) {
                this.state = 0
                return false
            } else {
                delete this.state
                return true
            }
        }
    },
    toSimpleObject: function() {
        const b = []
        return {
            type: "DoWhile",
            condition: this.condition,
            body: this.body.toSimpleObject(),
        }
    },
}
DoWhile.fromSimpleObject = function(o) {
    if (o.type !== "DoWhile") throw "Not a DoWhile"
    const r = new DoWhile(o.condition)
    r.body = globalThis[o.body.type].fromSimpleObject(o.body)
    return r
}

function While(condition = null, body = new InstructionSequence()) {
    this.condition = condition
    this.body = body
}
While.prototype = {
    constructor: While,
    tick: function() {
        interpreter.currentInstruction = this
        if (typeof this.state === "undefined") {
            this.state = 0
        }
        if (this.state !== 0) {
            if (this.body.tick()) {
                this.state = 0
            }
            return false
        } else {
            if (this.condition === null) throw "Incomplete instruction"
            const val = evaluateExpression(this.condition)
            if (typeof val !== "boolean") throw "Not a valid condition"
            if (!val) {
                delete this.state
                return true
            } else {
                this.state = 1
                return false
            }
        }
    },
    toSimpleObject: function() {
        return {
            type: "While",
            condition: this.condition,
            body: this.body.toSimpleObject(),
        }
    },
}
While.fromSimpleObject = function(o) {
    if (o.type !== "While") throw "Not a While"
    const r = new While(o.condition)
    r.body = globalThis[o.body.type].fromSimpleObject(o.body)
    return r
}

function For(variable = null, from = null, to = null, step = null, direction = null, body = new InstructionSequence()) {
    this.variable = variable
    this.from = from
    this.to = to
    this.step = step
    this.direction = direction
    this.body = body
}
For.prototype = {
    constructor: For,
    tick: function() {
        interpreter.currentInstruction = this
        if (typeof this.state === "undefined") {
            if (this.from === null) throw "Incomplete instruction"
            const val = evaluateExpression(this.from)
            if (typeof val !== "number") throw "Invalid expression: from"
            if (this.variable === null) throw "Incomplete instruction"
            if (typeof variables[this.variable] === "undefined") throw "Variable does not exist: " + this.variable
            variables[this.variable].value = val
            this.state = 0
        }
        if (this.state !== 0) {
            if (this.body.tick()) {
                if (this.step === null || this.direction === null) throw "Incomplete instruction"
                const inc = evaluateExpression(this.step)
                if (typeof inc !== "number") throw "Invalid expression: step"
                switch (this.direction) {
                    case "up": {
                        variables[this.variable].value += inc
                    }
                    break
                    case "down": {
                        variables[this.variable].value -= inc
                    }
                    break
                    default: {
                        throw "Invalid direction: " + this.direction
                    }
                }
                this.state = 0
            }
            return false
        } else {
            if (this.to === null || this.direction === null) throw "Incomplete instruction"
            const endVal = evaluateExpression(this.to)
            if (typeof endVal !== "number") throw "Invalid expression: to"
            if (this.variable === null) throw "Incomplete instruction"
            if (typeof variables[this.variable] === "undefined") throw "Variable does not exist: " + this.variable
            let repeat
            switch (this.direction) {
                case "up": {
                    repeat = variables[this.variable].value <= endVal
                }
                break
                case "down": {
                    repeat = variables[this.variable].value >= endVal
                }
                break
                default: {
                    throw "Invalid direction: " + this.direction
                }
            }
            if (repeat) {
                this.state = 1
                return false
            } else {
                delete this.state
                return true
            }
        }
    },
    toSimpleObject: function() {
        return {
            type: "For",
            variable: this.variable,
            from: this.from,
            to: this.to,
            step: this.step,
            direction: this.direction,
            body: this.body.toSimpleObject(),
        }
    },
}
For.fromSimpleObject = function(o) {
    if (o.type !== "For") throw "Not a For"
    const r = new For(o.variable, o.from, o.to, o.step, o.direction)
    r.body = globalThis[o.body.type].fromSimpleObject(o.body)
    return r
}

function Breakpoint() {}
Breakpoint.prototype = {
    constructor: Breakpoint,
    tick: function() {
        interpreter.currentInstruction = this
        if (typeof this.state === "undefined") {
            this.state = 0
            interpreter.pause()
            return false
        } else {
            delete this.state
            return true
        }
    },
    toSimpleObject: function() {
        return {
            type: "Breakpoint",
        }
    },
}
Breakpoint.fromSimpleObject = function(o) {
    if (o.type !== "Breakpoint") throw "Not a Breakpoint"
    return new Breakpoint()
}

/*
 * Main interpreter loop implementation (interpreter variable).
 * The interpreter is executed on every frame using requestAnimationFrame; all it does is call the tick method repeatedly on the program object, which then proceeds recursively until exactly one instruction is executed
 *
 * The interpreter can be in several states:
 * - STATE_STOPPED: the program is not started, has finished execution, or was stopped by the user. From this state, the program can be started by calling run(), which will put the interpreter into STATE_RUNNING and reset the state of the program
 * - STATE_RUNNING: the interpreter is running the program. Various execution modes are available, described below. From this state the program can be paused by calling pause(), which will put the interpreter into STATE_PAUSED; it can be stopped by calling stop(), which will put the interpreter into STATE_STOPPED without resetting the state of the program; or it can crash and end up in STATE_CRASHED
 * - STATE_PAUSED: the interpreter is paused, either manually or by a breakpoint; execution can be resumed by calling run(), which will put the interpreter back into STATE_RUNNING, or it can be stopped by calling stop(), which will put the interpreter into STATE_STOPPED
 * - STATE_CRASHED: the program has crashed; this state is similar to STATE_STOPPED
 *
 * The interpreter starts in STATE_STOPPED until run() is called.
 *
 * The state of the interpreter can be read using the getState() function, and can be changed using the stop(), run(), pause() functions.
 *
 * A useful clearProgram function is also provided, which removes all instructions from the current program (but not variables, use clearVariables for that)
 *
 * The interpreter can be in several execution modes, which control the speed at which the program can run:
 * - MODE_NORMAL: runs 1 instruction per frame
 * - MODE_SLOW: runs 1 instruction every 500ms (SLOW_DELAY)
 * - MODE_STEP: step-by-step execution, pauses the interpreter automatically after every instruction. When in this mode, run() needs to be called after each instruction to step through the program
 * - MODE_TURBO: runs the program as fast as possible, pausing every 10ms (TURBO_TSLICE) to allow the UI to update. Instructions can temporarily disable this by setting preventTurbo to true to avoid wasting CPU power doing things like busy waiting for inputs
 *
 * The interpreter starts in MODE_NORMAL, the mode can be accessed directly using the executionMode variable.
 *
 * Implementation note: the interpreter's internal state is not protected using a Proxy for performance reasons.
 *
 * For convenience, the UI can define 3 functions called ui_onProgramEnd, ui_onProgramPaused, and ui_onProgramCrash(err); these will be automatically called when the program ends, is paused, or when the program crashes; in the case of a crash, the exception is also passed to the function
 */

let program = new InstructionSequence()

function clearProgram() {
    program.body = []
}

const STATE_STOPPED = 0,
    STATE_RUNNING = 1,
    STATE_PAUSED = 2,
    STATE_CRASHED = -1
const MODE_NORMAL = 0,
    MODE_SLOW = 1,
    MODE_STEP = 2,
    MODE_TURBO = -1
const TURBO_TSLICE = 10,
    TURBO_TSLICE_ALT = 100 //Using a higher value will improve performance on low end PCs, but the UI will run at a noticeably lower framerate while the prorgam is running
const SLOW_DELAY = 500

let _altTurboTSlice = false

const interpreter = {
    _state: STATE_STOPPED,
    executionMode: MODE_NORMAL,
    currentInstruction: null, //Pointer to the currently running instruction. This is not actually used anywhere in the core, but the UI can use it to highlight it. All instructions will keep this updated
    preventTurbo: false,
    _lastInstrT: 0,
    getState() {
        return interpreter._state
    },
    run() {
        if (interpreter._state === STATE_RUNNING) throw "Program is already running"
        if (interpreter._state === STATE_CRASHED || interpreter._state === STATE_STOPPED) {
            resetVariables()
            const reset_rec = (instruction) => {
                delete instruction.state
                if (instruction.constructor.name === "InstructionSequence") {
                    instruction.body.forEach((i) => reset_rec(i))
                } else {
                    if (typeof instruction.body !== "undefined") {
                        reset_rec(instruction.body)
                    }
                    if (typeof instruction.trueBranch !== "undefined") {
                        reset_rec(instruction.trueBranch)
                    }
                    if (typeof instruction.falseBranch !== "undefined") {
                        reset_rec(instruction.falseBranch)
                    }
                }
            }
            reset_rec(program)
        }
        interpreter._state = STATE_RUNNING
    },
    stop() {
        if (interpreter._state === STATE_CRASHED || interpreter._state === STATE_STOPPED) throw "Cannot stop a stopped/crashed program"
        interpreter._state = STATE_STOPPED
        interpreter.currentInstruction = null
    },
    pause() {
        if (interpreter._state === STATE_CRASHED || interpreter._state === STATE_STOPPED) throw "Cannot pause a stopped/crashed program"
        interpreter._state = STATE_PAUSED
        if (typeof ui_onProgramPaused !== "undefined") ui_onProgramPaused()
    },
}
const mainLoop = function _mainLoop() {
    const stepProgram = () => {
        switch (interpreter._state) {
            case STATE_STOPPED: {
                interpreter.currentInstruction = null
            }
            break
            case STATE_RUNNING: {
                try {
                    if (program.tick()) {
                        interpreter._state = STATE_STOPPED
                        if (typeof ui_onProgramEnd !== "undefined") ui_onProgramEnd()
                    }
                } catch (e) {
                    interpreter._state = STATE_CRASHED
                    if (typeof ui_onProgramCrash !== "undefined") {
                        ui_onProgramCrash(e)
                    } else {
                        throw e
                    }
                }
            }
            break
            case STATE_PAUSED: {}
            break
            case STATE_CRASHED: {}
            break
            default: {
                throw "Internal error: invalid state " + interpreter._state
            }
        }
    }
    requestAnimationFrame(_mainLoop)
    switch (interpreter.executionMode) {
        case MODE_NORMAL: {
            stepProgram()
        }
        break
        case MODE_TURBO: {
            if (interpreter._state === STATE_RUNNING && !interpreter.preventTurbo) {
                let t = performance.now()
                while (performance.now() - t < (_altTurboTSlice ? TURBO_TSLICE_ALT : TURBO_TSLICE)) {
                    stepProgram()
                }
            } else {
                stepProgram()
            }
        }
        break
        case MODE_SLOW: {
            if (performance.now() - interpreter._lastInstrT >= SLOW_DELAY) {
                interpreter._lastInstrT = performance.now()
                stepProgram()
            }
        }
        break
        case MODE_STEP: {
            stepProgram()
            if (interpreter._state === STATE_RUNNING) {
                interpreter._state = STATE_PAUSED
            }
        }
        break
        default: {
            throw "Internal error: invalid execution mode " + interpreter.executionMode
        }
    }
}
mainLoop()
delete mainLoop

//--------  INPUT/OUTPUT --------
/*
 * This section implements 2 additional instructions:
 * - Input: reads a variable
 * - Output: prints a message
 *
 * To keep the core and UI separated, these instructions expect the UI to implement the following methods:
 * - ui_output(text,newLine): called when the program needs to output some text. newLine is a boolean that controls whether the new "message" is a whole message (true) or if it needs to be added to the previous one (false), allowing for easier concatenation without using the + operator
 * - ui_input(var,type,callback): called when the program needs to read something from the user. The callback is a function that the UI can call when the user enters the input and allows the Input instruction to continue.
 * Example:
 *      function ui_input(variable,type,callback){
 *          ...prepare input form...
 *          confirmButton.onclick=function(){
 *              callback(textBox.value)
 *          }
 *      }
 * If these functions are not implemented in the UI, Flogo will fall back to using alert and prompt, which is useful for testing
 */

function Output(expression = null, newLine = true) {
    this.expression = expression
    this.newLine = newLine
}
Output.prototype = {
    constructor: Output,
    tick: function() {
        interpreter.currentInstruction = this
        if (this.expression === null) throw "Incomplete instruction"
        let val = evaluateExpression(this.expression)
        val = "" + val
        if (typeof ui_output !== "undefined") {
            ui_output(val, this.newLine)
        } else {
            alert(val)
        }
        return true
    },
    toSimpleObject: function() {
        return {
            type: "Output",
            expression: this.expression,
            newLine: this.newLine,
        }
    },
}
Output.fromSimpleObject = function(o) {
    return new Output(o.expression, o.newLine)
}

function Input(variable = null) {
    this.variable = variable
}
Input.prototype = {
    constructor: Input,
    tick: function() {
        interpreter.currentInstruction = this
        if (typeof this.state === "undefined") {
            if (this.variable === null) throw "Incomplete instruction"
            if (typeof variables[this.variable] === "undefined") throw "Variable does not exist: " + this.variable
            this.state = null
            if (typeof ui_input !== "undefined") {
                interpreter.preventTurbo = true
                ui_input(this.variable, variables[this.variable].type, (val) => {
                    interpreter.preventTurbo = false
                    this.state = val
                })
                return false
            } else {
                interpreter.preventTurbo = true
                this.state = prompt(this.variable)
                interpreter.preventTurbo = false
                return false
            }
        } else {
            if (this.state === null) {
                return false
            } else {
                switch (variables[this.variable].type) {
                    case "integer":
                    case "real": {
                        if (isNaN(this.state)) throw "Not a number"
                        variables[this.variable].value = Number(this.state)
                    }
                    break
                    case "string": {
                        variables[this.variable].value = this.state
                    }
                    break
                    case "boolean": {
                        if (this.state !== "true" && this.state !== "false") throw "Not a valid boolean"
                        variables[this.variable].value = this.state === "true"
                    }
                    break
                    default: {
                        throw "Unknown variable type: " + variables[this.variable].type
                    }
                }
                delete this.state
                return true
            }
        }
    },
    toSimpleObject: function() {
        return {
            type: "Input",
            variable: this.variable,
        }
    },
}
Input.fromSimpleObject = function(o) {
    return new Input(o.variable)
}

//-------- COMMENTS --------
/*
 * Adds a simple comment block with some text in it. It does nothing when executed.
 */
function Comment(text = null) {
    this.text = text
}
Comment.prototype = {
    constructor: Comment,
    tick: function() {
        interpreter.currentInstruction = this
        return true
    },
    toSimpleObject: function() {
        return {
            type: "Comment",
            text: this.text,
        }
    },
}
Comment.fromSimpleObject = function(o) {
    if (o.type !== "Comment") throw "Not a Comment"
    return new Comment(o.text)
}

//-------- PROGRAM METADATA --------
/*
 * The metadata object stores metadata for the current program, specifically, it contains:
 * - id: UUID of the program
 * - authorId: UUID of the initial creator of the program
 * - title: title of the program (default: Program DD/MM/AAAA, HH:MM)
 * - author: the name of the author of the program (default: empty)
 * - created: timestamp when the program was created
 * - modified: array that stores each time the program was saved; each entry in the array contains a timestamp and the authorId of who saved it
 *
 * UUIDs are stored to track cheating, such as a student giving a copy of their program to someone else who will change it up a bit. This tracking is disabled automatically when Do Not Track is enabled in the browser.
 * No "real" security is implemented, a skilled student can easily modify these values, but that's not the kind of person who will be cheating anyway so this is good enough for now.
 *
 * For convenience, a clearMetadata() function is provided to reset the metadata for the current program.
 */
let metadata

function _getAuthorUUID() {
    if (navigator.doNotTrack != 1) {
        if (typeof localStorage.authorId === "undefined") {
            localStorage.authorId = crypto.randomUUID()
        }
        return localStorage.authorId
    } else {
        if (typeof localStorage.authorId !== "undefined") {
            delete localStorage.authorId
        }
        return ""
    }
}

function clearMetadata() {
    metadata = {
        id: navigator.doNotTrack != 1 ? crypto.randomUUID() : "",
        authorId: _getAuthorUUID(),
        title: "Program " +
            new Date().toLocaleString("en-GB", {
                year: "numeric",
                month: "numeric",
                day: "numeric",
                hour: "numeric",
                minute: "numeric",
            }),
        author: "",
        created: Date.now(),
        modified: [],
    }
}
clearMetadata()

//-------- SAVE/LOAD SYSTEM --------
/*
 * These functions allow for saving and loading of entire programs into JSON.
 *
 * The save function simply returns a JSON string of the program that contains the following information:
 *  - metadata: saves the contents of the metadata object. If DNT is not enabled, UUIDs will also be saved and an entry to the modified array is added to store who modified the program and when
 *  - variables: dictionary of all the current variables, each with its type and initial value
 *  - program: a simpleObject version of the main InstructionSequence (the program variable), this contains all the instructions of the program
 *
 * The load function deletes the current program and variables and loads the new program stored in a JSON string. If an error occurs during parsing, an exception is thrown and an empty program is loaded instead
 *
 * For convenience, two additional functions are provided:
 * - download(name): same as save() but you can pass it a filename and it will start a compressed file download
 * - loadFromFile(f,callback): same as load() but you can pass it a compressed file that the user has selected in a form
 *   example: loadFromFile(formInput.files[0],function(e){...})
 *   The callback will be called when the file is loaded; if loading failed, the exception will the passed to the callback as an argument; otherwise the program will simply be loaded and the callback will receive null
 */

function save(updateMetadata = true) {
    const vars = {}
    for (const v in variables) {
        vars[v] = variables[v].toSimpleObject()
    }
    if (updateMetadata) {
        if (navigator.doNotTrack != 1) {
            metadata.modified.push([Date.now(), _getAuthorUUID()])
        }
    }
    return JSON.stringify({
            metadata: metadata,
            variables: vars,
            program: program.toSimpleObject(),
        },
        null,
        2,
    )
}

function load(json) {
    if (interpreter.getState() !== STATE_STOPPED && interpreter.getState() !== STATE_CRASHED) throw "A program is already running"
    try {
        json = JSON.parse(json)
    } catch (e) {
        throw "Invalid or corrupt file"
    }
    try {
        clearVariables()
        clearProgram()
        metadata = json.metadata
        if (
            typeof metadata === "undefined" ||
            typeof metadata.id === "undefined" ||
            typeof metadata.authorId === "undefined" ||
            typeof metadata.title === "undefined" ||
            typeof metadata.created !== "number" ||
            typeof metadata.modified === "undefined" ||
            !Array.isArray(metadata.modified)
        ) {
            console.log("Invalid metadata")
            generateNewMetadata()
        }
        for (const v in json.variables) {
            declareVariable(v, json.variables[v].type, json.variables[v].value)
        }
        program = InstructionSequence.fromSimpleObject(json.program)
    } catch (e) {
        console.log(e)
        clearVariables()
        clearProgram()
        clearMetadata()
        throw "Invalid program"
    }
}

async function _compress(json) {
    const stream = new Blob([json], {
        type: 'application/json'
    }).stream()
    const compStream = stream.pipeThrough(new CompressionStream("gzip"))
    const compResp = await new Response(compStream)
    const blob = await compResp.blob()
    return new Blob(["flogo1", blob], {
        type: "application/octet-stream"
    })
}

function download(name) {
    if (typeof name === "undefined") {
        if (metadata.title.trim() !== "") {
            name = metadata.title
        } else {
            name = "Untitled"
        }
    }
    if (!name.endsWith(".flogo")) name += ".flogo"
    _compress(save()).then(blob => {
        const a = document.createElement("a")
        a.href = URL.createObjectURL(blob)
        a.download = name
        a.click()
    })
}

async function _decompress(blob) {
    if (blob.size < 6) throw ""
    const head = await blob.slice(0, 6).text()
    if (head !== "flogo1") throw ""
    const decStream = blob.slice(6).stream().pipeThrough(new DecompressionStream("gzip"))
    const decResp = await new Response(decStream)
    const decBlob = await decResp.blob()
    const json = await decBlob.text()
    return json
}

function loadFromFile(f, callback) {
    _decompress(f).then(json => {
        try {
            load(json)
            callback(null)
        } catch (e) {
            callback(e)
        }
    }).catch(() => {
        callback("Not a Flogo program")
    })
}
