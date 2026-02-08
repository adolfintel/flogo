/*
 * This file contains the interpreter for Flogo. It's a simple interpreted prorgamming language.
 *
 * This module was designed to be reusable, it doesn't depend on the UI, it provides functions to interact with the interpreter and build a UI on top of it.
 */

import jsep from 'jsep'
import {
    storage
} from './platformSpecific.js'

//-------- VARIABLES AND TYPE SYSTEM --------
/* Flogo is strongly and statically typed, but uses JS underneath so some checks are required to make sure that values are of the correct type and can't change over time, that variables aren't re-decleared, etc.
 *
 * Integers have a range of +/- ~2^53
 * Reals use 64-bit floating point
 * Strings are just JS strings
 * Booleans can only contain true/false
 * All variables can be set to null to indicate that they have not been initialized
 * One-dimensional arrays of all types
 *
 * All variables are stored into a dictionary called variables; each variable is an object that contains its type, value and initial value; getters and setters automatically enforce types. Arrays are handled similarly, but they also have an isArray attribute and a size attribute. Code that needs to access a Flogo variable can just write variables["name"].value. The variables dictionary can be read and modified directly (although it's not recommended, and it's better to use the provided functions instead).
 *
 * Several functions are provided:
 * - declareVariable(name, type, arraySize, initialValue): creates a new variable. If arraySize>0, it creates an array. Throws exceptions in case of errors like invalid name, invalid initial value, etc.
 * - clearVariables(): deletes all variables
 * - resetVariables(): resets all variables to their original values; variables that don't have an initial value get null.
 * - removeVariable(name): deltes a variable
 * - renameVariable(oldName,newName): renames a variable
 * - reorderVariables(newOrder): changes the order of variables using the provided array of variable names
 */

export let variables = {}

export function isValidVariableName(name) {
    if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(name)) {
        return false
    }
    if (["true", "false", "PI", "E", "CURRENT_DAY", "CURRENT_MONTH", "CURRENT_YEAR", "CURRENT_HOURS", "CURRENT_MINUTES", "CURRENT_SECONDS"].includes(name)) {
        return false
    }
    return true
}

export function declareVariable(name, type, arraySize = 0, initialValue = null) {
    if (!isValidVariableName(name)) {
        throw "Invalid name"
    }
    if (typeof variables[name] !== "undefined") throw "Variable already exists"
    if (type !== "integer" && type !== "real" && type !== "string" && type !== "boolean") throw "Invalid type"
    if (arraySize === 0) {
        let value = null,
            modified = false
        const v = {
            get type() {
                return type
            },
            get value() {
                return value
            },
            set value(newValue) {
                if (newValue !== null) {
                    switch (type) {
                        case "integer": {
                            if (typeof newValue !== "number") throw "Not a number"
                            if (isNaN(newValue)) throw "Not a valid number"
                            if (newValue < Number.MIN_SAFE_INTEGER || newValue > Number.MAX_SAFE_INTEGER) throw "Value too big"
                            if (Number.isInteger(newValue)) {
                                value = newValue
                            } else {
                                value = Math.trunc(newValue)
                            }
                        }
                        break
                        case "real": {
                            if (typeof newValue !== "number") throw "Not a number"
                            if (isNaN(newValue)) throw "Not a valid number"
                            value = newValue
                        }
                        break
                        case "string": {
                            if (typeof newValue !== "string") {
                                newValue = "" + newValue
                            }
                            if (newValue.length <= 1048576) {
                                value = newValue
                            } else {
                                throw "String too long"
                            }
                        }
                        break
                        case "boolean": {
                            if (typeof newValue !== "boolean") throw "Not a boolean"
                            value = newValue
                        }
                    }
                } else {
                    value = null
                }
                modified = true
            },
            get modified() {
                return modified
            },
            get initialValue() {
                return initialValue
            },
            toSimpleObject: () => {
                return {
                    type: type,
                    value: initialValue
                }
            },
            reset: () => {
                v.value = initialValue
                modified = false
            }
        }
        v.reset()
        variables[name] = v
    } else {
        if (typeof arraySize !== "number" || !Number.isInteger(arraySize)) throw "Array size must be an integer"
        if (arraySize <= 0) throw "Array size must be >0"
        let modified = false
        const data = []
        const arrayGetterAndSetter = {
            set(target, prop, newValue) {
                try {
                    prop = prop.trim()
                    if (prop === "") throw ""
                    prop = Number(prop)
                    if (!Number.isInteger(prop)) throw ""
                } catch (e) {
                    throw "Array index must be an integer"
                }
                if (prop < 0 || prop >= arraySize) throw "Array index out of bounds: " + prop
                if (newValue !== null) {
                    switch (type) {
                        case "integer": {
                            if (typeof newValue !== "number") throw "Not a number"
                            if (isNaN(newValue)) throw "Not a valid number"
                            if (newValue < Number.MIN_SAFE_INTEGER || newValue > Number.MAX_SAFE_INTEGER) throw "Value too big"
                            if (Number.isInteger(newValue)) {
                                target[prop] = newValue
                            } else {
                                target[prop] = Math.trunc(newValue)
                            }
                        }
                        break
                        case "real": {
                            if (typeof newValue !== "number") throw "Not a number"
                            if (isNaN(newValue)) throw "Not a valid number"
                            target[prop] = newValue
                        }
                        break
                        case "string": {
                            if (typeof newValue !== "string") {
                                newValue = "" + newValue
                            }
                            if (newValue.length <= 1048576) {
                                target[prop] = newValue
                            } else {
                                throw "String too long"
                            }
                        }
                        break
                        case "boolean": {
                            if (typeof newValue !== "boolean") throw "Not a boolean"
                            target[prop] = newValue
                        }
                    }
                } else {
                    target[prop] = null
                }
                modified = true
                return true
            },
            get(target, prop, receiver) {
                if (typeof prop === "symbol") {
                    return () => type + "[" + arraySize + "]"
                }
                try {
                    prop = prop.trim()
                    if (prop === "") throw ""
                    prop = Number(prop)
                    if (!Number.isInteger(prop)) throw ""
                } catch (e) {
                    throw "Array index must be an integer"
                }
                if (prop < 0 || prop >= arraySize) throw "Array index out of bounds: " + prop
                return target[prop]
            },
        }
        const arrayProxy = new Proxy(data, arrayGetterAndSetter)
        const v = {
            get type() {
                return type
            },
            get initialValue() {
                return initialValue
            },
            get size() {
                return arraySize
            },
            get isArray() {
                return true
            },
            get modified() {
                return modified
            },
            get value() {
                return arrayProxy
            },
            toSimpleObject: () => {
                return {
                    type: type,
                    value: initialValue,
                    arraySize: arraySize,
                }
            },
            reset: () => {
                v.value[0] = initialValue
                for (let i = 1; i < arraySize; i++) {
                    data[i] = data[0]
                }
                modified = false
            }
        }
        v.reset()
        variables[name] = v
    }
}

export function clearVariables() {
    variables = {}
}

export function resetVariables() {
    for (const v in variables) {
        variables[v].reset()
    }
}

export function removeVariable(name) {
    if (typeof variables[name] === "undefined") throw "Variable does not exist: " + name
    delete variables[name]
}

export function renameVariable(oldName, newName) {
    if (typeof variables[oldName] === "undefined") {
        throw "Old name does not exist"
    }
    if (typeof variables[newName] !== "undefined") {
        throw "New name already in use"
    }
    if (!isValidVariableName(newName)) {
        throw "New name is not valid"
    }
    const newVars = {}
    for (const k in variables) {
        if (k !== oldName) {
            newVars[k] = variables[k]
        } else {
            newVars[newName] = variables[k]
        }
    }
    variables = newVars
}

export function reorderVariables(newOrder) {
    const newVars = {}
    newOrder.forEach(k => {
        if (typeof variables[k] === "undefined") {
            throw "Variable does not exist: " + k
        }
        if (typeof newVars[k] !== "undefined") {
            throw "Variable defined twice: " + k
        }
        newVars[k] = variables[k]
    })
    variables = newVars
}

//-------- EXPRESSION PARSING --------
/*
 * Expressions are first parsed using the jsep library to turn them into an easily manageable AST; the AST is then processed recursively to evaluate the expression.
 * Math operators: ^ * / % + -
 * Comparison operators: < > <= >= == !=
 * Logical operators: ! && ||
 * Literals and constants: true, false, PI, E, CURRENT_DAY, CURRENT_MONTH, CURRENT_YEAR, CURRENT_HOURS, CURRENT_MINUTES, CURRENT_SECONDS
 * Built-in functions: abs, sqrt, sin, cos, tan, asin, acos, atan, ln, log(base,val) ceil, floor, round, toFixed(val,digits), random (real between 0 and 1), len, end, charAt(string,index), codeToChar, charToCode, strToReal, strToInt
 * Round brackets are allowed in expressions
 * Strings are delimited by single or double quotes
 * Trigonometric functions work with rads
 * + does both sum and string concatenation
 * Expressions are evaluated using lazy evaluation
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
jsep.addLiteral("CURRENT_DAY", null)
jsep.addLiteral("CURRENT_MONTH", null)
jsep.addLiteral("CURRENT_YEAR", null)
jsep.addLiteral("CURRENT_HOURS", null)
jsep.addLiteral("CURRENT_MINUTES", null)
jsep.addLiteral("CURRENT_SECONDS", null)
jsep.addLiteral("CURRENT_TS", null)
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
let jsepCache = {}

function parseExpression(text) {
    if (typeof jsepCache[text] !== "undefined") {
        return jsepCache[text]
    } else {
        const tree = jsep(text)
        jsepCache[text] = tree
        return tree
    }
}

function evaluateExpression(expression) { //both text and pre-parsed jsep expressions are accepted
    let tree
    if (typeof expression === "string") {
        tree = parseExpression(expression)
    } else {
        tree = expression
    }
    const expr_rec = n => {
        switch (n.type) {
            case jsep.LITERAL: {
                if (n.value !== null) {
                    return n.value
                } else {
                    switch (n.raw) {
                        case "CURRENT_DAY":
                            return new Date().getDate()
                            break
                        case "CURRENT_MONTH":
                            return new Date().getMonth() + 1
                            break
                        case "CURRENT_YEAR":
                            return new Date().getFullYear()
                            break
                        case "CURRENT_HOURS":
                            return new Date().getHours()
                            break
                        case "CURRENT_MINUTES":
                            return new Date().getMinutes()
                            break
                        case "CURRENT_SECONDS":
                            return new Date().getSeconds()
                            break
                        case "CURRENT_TS":
                            return performance.now()
                            break
                        default:
                            throw "Syntax error"
                    }
                }
            }
            break
            case jsep.IDENTIFIER: {
                if (typeof variables[n.name] === "undefined") throw "Variable does not exist: " + n.name
                if (variables[n.name].isArray) throw "Variable is an array: " + n.name
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
                if (n.operator === "&&" || n.operator === "||") { // && and || need to be treated differently for lazy evaluation
                    switch (n.operator) {
                        case "&&": {
                            const left = expr_rec(n.left)
                            if (typeof left !== "boolean") throw "Not a valid condition"
                            if (!left) return false
                            const right = expr_rec(n.right)
                            if (typeof right !== "boolean") throw "Not a valid condition"
                            return left && right
                        }
                        break
                        case "||": {
                            const left = expr_rec(n.left)
                            if (typeof left !== "boolean") throw "Not a valid condition"
                            if (left) return true
                            const right = expr_rec(n.right)
                            if (typeof right !== "boolean") throw "Not a valid condition"
                            return left || right
                        }
                        break
                    }
                } else {
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
                        default: {
                            throw "Invalid operator: " + n.operator
                        }
                    }
                }
            }
            break
            case jsep.MEMBER_EXP: {
                if (n.object.type !== jsep.IDENTIFIER) throw "Syntax error"
                if (typeof variables[n.object.name] === "undefined") throw "Array does not exist: " + n.object.name
                if (!variables[n.object.name].isArray) throw "Variable is not an array: " + n.object.name
                const idx = expr_rec(n.property)
                const v = variables[n.object.name].value[idx]
                if (v === null) throw "Variable not initialized: " + n.object.name + "[" + idx + "]"
                return v
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
                        if (n.arguments[0].type === jsep.IDENTIFIER) {
                            if (typeof variables[n.arguments[0].name] === "undefined") throw "Variable does not exist: " + n.arguments[0].name
                            if (variables[n.arguments[0].name].isArray) {
                                return variables[n.arguments[0].name].size
                            } else {
                                if (variables[n.arguments[0].name].type !== "string") throw "len requires a string or an array"
                                return variables[n.arguments[0].name].value.length
                            }
                        } else {
                            const val = expr_rec(n.arguments[0])
                            if (typeof val !== "string") throw "len requires a string or an array"
                            return val.length
                        }
                    }
                    break
                    case "end": {
                        if (n.arguments.length !== 1) throw "end requires 1 argument"
                        if (n.arguments[0].type === jsep.IDENTIFIER) {
                            if (typeof variables[n.arguments[0].name] === "undefined") throw "Variable does not exist: " + n.arguments[0].name
                            if (variables[n.arguments[0].name].isArray) {
                                return variables[n.arguments[0].name].size - 1
                            } else {
                                if (variables[n.arguments[0].name].type !== "string") throw "end requires a string or an array"
                                return variables[n.arguments[0].name].value.length - 1
                            }
                        } else {
                            const val = expr_rec(n.arguments[0])
                            if (typeof val !== "string") throw "end requires a string or an array"
                            return val.length - 1
                        }
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
 *
 * The implementation of each instruction is relatively simple and modular.
 * Instructions are objects of a class that represents their type, such as the Assignment or the If class.
 * Each class implements a constructor that initializes an "empty" version of the instruction (such as an if with a null condition and empty true/false branches) and the following methods:
 * - tick(): runs a "step" of execution for this instruction; returns true if the instruction has finished executing, false otherwise. This allows for easy implementation of nested ifs, loops, etc.
 *          If this instruction has other sub-instructions inside it (such as a loop), these instructions will be in an InstructionSequence; this tick function will call the tick function recursively of the InstructionSequence and it will take care of keeping track of where we are inside the body/branch. Eventually the InstructionSequence's tick function will return true and we can update this instruction's state (for instance, if it's a for loop, we can do the increment and reevaluate the condition). To keep track of the current state, all instructions use a state attribute that is automatically reset when the program is (re)started; if you're going to implement your own instructions, remember to delete this.state before returning true
 *          The tick function of the "main" (the variable called program) is called repeatedly from the main loop; the call then continues recursively
 * - toSimpleObject(): returns a simplified version of this instruction that only contains the data that needs to be stored when the program is saved to JSON. Format described below
 * - fromSimpleObject(o): static method, transforms a simple object back into a regular instruction that can be executed and returns it. This method also recursively transforms any sub-instruction. Format described below.
 *
 * Instructions types need to be registered using the registerInstructionType(class,name,category) function.
 * The function requires 2 parameters:
 * - The class that implements the instruction type
 * - The name of the type of instruction as saved in JSON (must be the same name used in toSimpleObject and fromSimpleObject)
 * - Optionally, the category (there are 5 default categories: Interaction, Math, Selection, Loops, Tools). If not specified, the instruction will not be added to any category and it will not be visible to the user (although it will exist, see InstructionSequence for example)
 * Registering an instruction type will add a type attribute to the prototype of the class, containing the registered name, which can (and should) be used in the instruction implementation.
 *
 * Simple object format used for saving/loading:
 * {
 *  type: "registered name",
 *  ...
 * }
 */

const instructionCategories = {
    "Interaction": [],
    "Math": [],
    "Selection": [],
    "Loops": [],
    "Tools": []
}
const instructionTypes = {}

export function getInstructionTypes() {
    return {
        ...instructionTypes
    }
}

export function getInstructionCategories() {
    return {
        ...instructionCategories
    }
}

export function registerInstructionType(classref, name, category = null) {
    if (typeof instructionTypes[name] !== "undefined") throw "Already registered"
    if (typeof classref.prototype.type !== "undefined") throw "Already registered"
    classref.prototype.type = name
    instructionTypes[classref.prototype.type] = classref
    if (category !== null) {
        if (typeof instructionCategories[category] !== "undefined") {
            instructionCategories[category].push(classref)
        } else {
            instructionCategories[category] = [classref]
        }
    }
}

export function InstructionSequence() {
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
        const type = this.type
        const b = []
        this.body.forEach(i => b.push(i.toSimpleObject()))
        return {
            type: type,
            body: b,
        }
    },
}
InstructionSequence.fromSimpleObject = function(o) {
    if (o.type !== this.prototype.type) throw "Not a " + this.prototype.type
    const r = new InstructionSequence()
    o.body.forEach(i => r.body.push(instructionTypes[i.type].fromSimpleObject(i)))
    return r
}
registerInstructionType(InstructionSequence, "InstructionSequence", null)

export function Assign(variable = null, expression = null) {
    this.variable = variable
    this.expression = expression
}
Assign.prototype = {
    constructor: Assign,
    tick: function() {
        interpreter.currentInstruction = this
        if (this.variable === null || this.expression === null) throw "Incomplete instruction"
        const n = parseExpression(this.variable)
        switch (n.type) {
            case jsep.IDENTIFIER: {
                if (typeof variables[n.name] === "undefined") throw "Variable does not exist: " + n.name
                if (variables[n.name].isArray) throw "Variable is an array: " + n.name
                variables[n.name].value = evaluateExpression(this.expression)
            }
            break
            case jsep.MEMBER_EXP: {
                if (typeof variables[n.object.name] === "undefined") throw "Variable does not exist: " + n.object.name
                if (!variables[n.object.name].isArray) throw "Variable is not an array: " + n.object.name
                const idx = evaluateExpression(n.property)
                variables[n.object.name].value[idx] = evaluateExpression(this.expression)
            }
            break
            default:
                throw "Syntax error in variable name"
        }
        return true
    },
    toSimpleObject: function() {
        const type = this.type
        return {
            type: type,
            variable: this.variable,
            expression: this.expression,
        }
    },
}
Assign.fromSimpleObject = function(o) {
    if (o.type !== this.prototype.type) throw "Not a " + this.prototype.type
    return new Assign(o.variable, o.expression)
}
registerInstructionType(Assign, "Assign", "Math")

export function If(condition = null, trueBranch = new InstructionSequence(), falseBranch = new InstructionSequence()) {
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
        const type = this.type
        return {
            type: type,
            condition: this.condition,
            trueBranch: this.trueBranch.toSimpleObject(),
            falseBranch: this.falseBranch.toSimpleObject(),
        }
    },
}
If.fromSimpleObject = function(o) {
    if (o.type !== this.prototype.type) throw "Not a " + this.prototype.type
    const r = new If(o.condition)
    r.trueBranch = instructionTypes[o.trueBranch.type].fromSimpleObject(o.trueBranch)
    r.falseBranch = instructionTypes[o.falseBranch.type].fromSimpleObject(o.falseBranch)
    if (!(r.trueBranch instanceof InstructionSequence && r.falseBranch instanceof InstructionSequence)) {
        throw "True and false branches are not InstructionSequence"
    }
    return r
}
registerInstructionType(If, "If", "Selection")

export function DoWhile(condition = null, body = new InstructionSequence()) {
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
        const type = this.type
        const b = []
        return {
            type: type,
            condition: this.condition,
            body: this.body.toSimpleObject(),
        }
    },
}
DoWhile.fromSimpleObject = function(o) {
    if (o.type !== this.prototype.type) throw "Not a " + this.prototype.type
    const r = new DoWhile(o.condition)
    r.body = instructionTypes[o.body.type].fromSimpleObject(o.body)
    if (!(r.body instanceof InstructionSequence)) {
        throw "Body is not an InstructionSequence"
    }
    return r
}
registerInstructionType(DoWhile, "DoWhile", "Loops")

export function While(condition = null, body = new InstructionSequence()) {
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
        const type = this.type
        return {
            type: type,
            condition: this.condition,
            body: this.body.toSimpleObject(),
        }
    },
}
While.fromSimpleObject = function(o) {
    if (o.type !== this.prototype.type) throw "Not a " + this.prototype.type
    const r = new While(o.condition)
    r.body = instructionTypes[o.body.type].fromSimpleObject(o.body)
    if (!(r.body instanceof InstructionSequence)) {
        throw "Body is not an InstructionSequence"
    }
    return r
}
registerInstructionType(While, "While", "Loops")

export function For(variable = null, from = null, to = null, step = "1", direction = "up", body = new InstructionSequence()) {
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
            const n = parseExpression(this.variable)
            this.parsedVariableName = n
            switch (n.type) {
                case jsep.IDENTIFIER: {
                    if (typeof variables[n.name] === "undefined") throw "Variable does not exist: " + n.name
                    if (variables[n.name].isArray) throw "Variable is an array: " + n.name
                    variables[n.name].value = val
                }
                break
                case jsep.MEMBER_EXP: {
                    if (typeof variables[n.object.name] === "undefined") throw "Variable does not exist: " + n.object.name
                    if (!variables[n.object.name].isArray) throw "Variable is not an array: " + n.object.name
                    const idx = evaluateExpression(n.property)
                    variables[n.object.name].value[idx] = val
                }
                break
                default:
                    throw "Invalid variable name: " + this.variable
            }
            this.state = 0
        }
        if (this.state === 1) {
            if (this.body.tick()) {
                this.state = 2
            }
            return false
        } else {
            if (this.state === 2) {
                if (this.step === null || this.direction === null) throw "Incomplete instruction"
                const inc = evaluateExpression(this.step)
                if (typeof inc !== "number") throw "Invalid expression: step"
                const n = this.parsedVariableName
                switch (this.direction) {
                    case "up": {
                        switch (n.type) {
                            case jsep.IDENTIFIER: {
                                variables[n.name].value += inc
                            }
                            break
                            case jsep.MEMBER_EXP: {
                                const idx = evaluateExpression(n.property)
                                variables[n.object.name].value[idx] += inc
                            }
                            break
                        }
                    }
                    break
                    case "down": {
                        switch (n.type) {
                            case jsep.IDENTIFIER: {
                                variables[n.name].value -= inc
                            }
                            break
                            case jsep.MEMBER_EXP: {
                                const idx = evaluateExpression(n.property)
                                variables[n.object.name].value[idx] -= inc
                            }
                            break
                        }
                    }
                    break
                    default: {
                        throw "Invalid direction: " + this.direction
                    }
                }
            }
            if (this.to === null || this.direction === null) throw "Incomplete instruction"
            const endVal = evaluateExpression(this.to)
            if (typeof endVal !== "number") throw "Invalid expression: to"
            const n = this.parsedVariableName
            let repeat
            switch (this.direction) {
                case "up": {
                    switch (n.type) {
                        case jsep.IDENTIFIER: {
                            repeat = variables[n.name].value <= endVal
                        }
                        break
                        case jsep.MEMBER_EXP: {
                            const idx = evaluateExpression(n.property)
                            repeat = variables[n.object.name].value[idx] <= endVal
                        }
                        break
                    }
                }
                break
                case "down": {
                    switch (n.type) {
                        case jsep.IDENTIFIER: {
                            repeat = variables[n.name].value >= endVal
                        }
                        break
                        case jsep.MEMBER_EXP: {
                            const idx = evaluateExpression(n.property)
                            repeat = variables[n.object.name].value[idx] >= endVal
                        }
                        break
                    }
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
                delete this.parsedVariableName
                return true
            }
        }
    },
    toSimpleObject: function() {
        const type = this.type
        return {
            type: type,
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
    if (o.type !== this.prototype.type) throw "Not a " + this.prototype.type
    const r = new For(o.variable, o.from, o.to, o.step, o.direction)
    r.body = instructionTypes[o.body.type].fromSimpleObject(o.body)
    if (!(r.body instanceof InstructionSequence)) {
        throw "Body is not an InstructionSequence"
    }
    return r
}
registerInstructionType(For, "For", "Loops")

//-------- TOOLS --------
/*
 * This section implements 2 additional instructions:
 * - Comment: a simple comment block that allows you to store text but does nothing when executed
 * - Breakpoint: automatically pauses the program when the execution reaches it
 */

export function Comment(text = null) {
    this.text = text
}
Comment.prototype = {
    constructor: Comment,
    tick: function() {
        interpreter.currentInstruction = this
        return true
    },
    toSimpleObject: function() {
        const type = this.type
        return {
            type: type,
            text: this.text,
        }
    },
}
Comment.fromSimpleObject = function(o) {
    if (o.type !== this.prototype.type) throw "Not a " + this.prototype.type
    return new Comment(o.text)
}
registerInstructionType(Comment, "Comment", "Tools")

export function Breakpoint() {}
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
        const type = this.type
        return {
            type: type,
        }
    },
}
Breakpoint.fromSimpleObject = function(o) {
    if (o.type !== this.prototype.type) throw "Not a " + this.prototype.type
    return new Breakpoint()
}
registerInstructionType(Breakpoint, "Breakpoint", "Tools")

//--------  INPUT/OUTPUT --------
/*
 * This section implements 2 additional instructions:
 * - Input: reads a variable
 * - Output: prints a message
 *
 * To keep the core and UI separated, these instructions expect the UI to implement the following methods to be added to the interpreter object:
 * - interpreter.uiBridge.output(text,newLine): called when the program needs to output some text. newLine is a boolean that controls whether the new "message" is a whole message (true) or if it needs to be added to the previous one (false), allowing for easier concatenation without using the + operator
 * - interpreter.uiBridge.input(var,type,callback): called when the program needs to read something from the user. The callback is a function that the UI can call when the user enters the input and allows the Input instruction to continue.
 * Example:
 *      import * as FlogoLang from './flogo-language.js'
 *      ...
 *      FlogoLang.interpreter.uiBridge.input=(variable,type,callback)=>{
 *          ...prepare input form...
 *          confirmButton.onclick=function(){
 *              callback(textBox.value)
 *          }
 *      }
 * If these functions are not implemented in the UI, Flogo will fall back to using alert and prompt, which is useful for testing.
 *
 * These preparations must be done before running any program in Flogo.
 */

export function Input(variable = null) {
    this.variable = variable
}
Input.prototype = {
    constructor: Input,
    tick: function() {
        interpreter.currentInstruction = this
        if (typeof this.state === "undefined") {
            if (this.variable === null) throw "Incomplete instruction"
            const n = parseExpression(this.variable)
            this.parsedVariableName = n
            let varType
            switch (n.type) {
                case jsep.IDENTIFIER: {
                    if (typeof variables[n.name] === "undefined") throw "Variable does not exist: " + n.name
                    if (variables[n.name].isArray) throw "Variable is an array: " + n.name
                    varType = variables[n.name].type
                }
                break
                case jsep.MEMBER_EXP: {
                    if (typeof variables[n.object.name] === "undefined") throw "Variable does not exist: " + n.object.name
                    if (!variables[n.object.name].isArray) throw "Variable is not an array: " + n.object.name
                    varType = variables[n.object.name].type
                }
                break
                default:
                    throw "Invalid variable name"
            }
            this.state = null
            if (typeof interpreter.uiBridge.input !== "undefined") {
                interpreter.preventTurbo = true
                interpreter.uiBridge.input(this.variable, varType, val => {
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
                const n = this.parsedVariableName
                switch (n.type) {
                    case jsep.IDENTIFIER: {
                        if (typeof variables[n.name] === "undefined") throw "Variable does not exist: " + n.name
                        if (variables[n.name].isArray) throw "Variable is an array: " + n.name
                        switch (variables[n.name].type) {
                            case "integer":
                            case "real": {
                                if (isNaN(this.state)) throw "Not a number"
                                variables[n.name].value = Number(this.state)
                            }
                            break
                            case "string": {
                                variables[n.name].value = this.state
                            }
                            break
                            case "boolean": {
                                if (this.state !== "true" && this.state !== "false") throw "Not a valid boolean"
                                variables[n.name].value = this.state === "true"
                            }
                            break
                            default: {
                                throw "Unknown variable type: " + variables[n.name].type
                            }
                        }
                    }
                    break
                    case jsep.MEMBER_EXP: {
                        if (typeof variables[n.object.name] === "undefined") throw "Variable does not exist: " + n.object.name
                        if (!variables[n.object.name].isArray) throw "Variable is not an array: " + n.object.name
                        const idx = evaluateExpression(n.property)
                        switch (variables[n.object.name].type) {
                            case "integer":
                            case "real": {
                                if (isNaN(this.state)) throw "Not a number"
                                variables[n.object.name].value[idx] = Number(this.state)
                            }
                            break
                            case "string": {
                                variables[n.object.name].value[idx] = this.state
                            }
                            break
                            case "boolean": {
                                if (this.state !== "true" && this.state !== "false") throw "Not a valid boolean"
                                variables[n.object.name].value[idx] = this.state === "true"
                            }
                            break
                            default: {
                                throw "Unknown variable type: " + variables[n.object.name].type
                            }
                        }
                    }
                    break
                    default:
                        throw "Syntax error in variable name"
                }
                delete this.state
                delete this.parsedVariableName
                return true
            }
        }
    },
    toSimpleObject: function() {
        const type = this.type
        return {
            type: type,
            variable: this.variable,
        }
    },
}
Input.fromSimpleObject = function(o) {
    return new Input(o.variable)
}
registerInstructionType(Input, "Input", "Interaction")

export function Output(expression = null, newLine = true) {
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
        if (typeof interpreter.uiBridge.output !== "undefined") {
            interpreter.uiBridge.output(val, this.newLine)
        } else {
            alert(val)
        }
        return true
    },
    toSimpleObject: function() {
        const type = this.type
        return {
            type: type,
            expression: this.expression,
            newLine: this.newLine,
        }
    },
}
Output.fromSimpleObject = function(o) {
    return new Output(o.expression, o.newLine)
}
registerInstructionType(Output, "Output", "Interaction")

//--------  TURTLE GRAPHICS --------
/*
 * Turtle graphics is somewhat similar to the ancient LOGO programming language, or the python turtle library.
 * The program controls a cursor called the turtle, and this turtle can move (with or without leaving a line behind it), it can turn by a certain amount of degrees left or right, and it can also teleport itself back to the home (the center of the screen).
 *
 * These instructions use the konva.js library.
 *
 * This section implements 3 instructions:
 * - Move: moves the turtle. How much it moves is controlled by an expression, and it can also draw a line behind it or not
 * - Turn: rotates the turtle in place, either right (clockwise) or left (counterclockwise). How many degrees it rotates by is controlled by an expression
 * - Home: teleports the turtle back to the origin of the drawing, pointing upwards
 *
 * To keep the core and UI separated, these instructions expect the UI to implement a function and inform the core of the id of the container to which it can draw, both are done by setting attributes of the interpreter object as explained with the Input and Output instructions:
 * - interpreter.uiBridge.turtle_show(): called when a turtle instruction is executed. You need to make the drawing area visible
 * - interpreter.uiBridge.turtle_containerId: a string with the id of the div where it can draw
 *
 * These must be set before running any program and cannot be changed afterwards.
 *
 * Several functions are also implemented for convenience:
 * - clearTurtle(): deletes the current drawing. You may want to call it before running the program, but it's not mandatory
 * - hideTurtleCursor(): hides the turtle, leaving only the drawing visible
 * - showTurtleCursor(): shows a previously hidden turtle
 * - isTurtleCursorVisible(): tells whether the cursor is visible
 * - setTurtleColors(cursor, background, foreground): sets the colors used for turtle graphics
 * - downloadTurtleImage(name): saves the current drawing to a file
 *
 * There's also a setting that you might want to change:
 * - interpreter.uiBridge.turtle_maxPoints: controls the maximum "complexity" of the drawing. By default it's set to 10000, but you can also set it to 0 to disable the limit, or any other positive number
 *
 */

let turtle_initialized = false
let turtle_stage = null,
    turtle_drawing = null,
    turtle_cursor = null
let turtle_x, turtle_y, turtle_rot
let turtle_cursorColor = "#00a000",
    turtle_backgroundColor = "#ffffff",
    turtle_foregroundColor = "#000000"

function turtle_init() {
    if (!turtle_initialized) {
        turtle_stage = new Konva.Stage({
            container: interpreter.uiBridge.turtle_containerId,
        })
        turtle_drawing = new Konva.Layer({
            listening: false
        })
        turtle_cursor = new Konva.Layer({
            listening: false
        })
        turtle_stage.add(turtle_drawing)
        turtle_stage.add(turtle_cursor)
        turtle_makeCursor()
        if (typeof interpreter.uiBridge.turtle_maxPoints === "undefined") {
            interpreter.uiBridge.turtle_maxPoints = 10000
        }
        let bounds = null
        const resizeFun = () => {
            requestAnimationFrame(resizeFun)
            if (window.devicePixelRatio !== turtle_drawing.getCanvas().getPixelRatio()) {
                turtle_drawing.getCanvas().setPixelRatio(window.devicePixelRatio)
                turtle_cursor.getCanvas().setPixelRatio(window.devicePixelRatio)
            }
            const b = turtle_stage.container().getBoundingClientRect()
            if (bounds === null || b.width !== bounds.width || b.height !== bounds.height) {
                turtle_stage.width(b.width)
                turtle_stage.height(b.height)
                if (bounds !== null) {
                    let dx = b.width - bounds.width,
                        dy = b.height - bounds.height
                    turtle_stage.x(turtle_stage.x() + dx / 2)
                    turtle_stage.y(turtle_stage.y() + dy / 2)
                }
                bounds = b
            }
            turtle_autoZoom()
        }
        resizeFun()
        document.getElementById(interpreter.uiBridge.turtle_containerId).oncontextmenu = e => {
            e.preventDefault()
        }
        turtle_initialized = true
    }
    turtle_reset()
}

function turtle_reset() {
    turtle_x = 0
    turtle_y = 0
    turtle_rot = -90
    turtle_drawing.destroyChildren()
    turtle_nPoints = 0
    turtle_stage.scaleX(1)
    turtle_stage.scaleY(1)
    turtle_stage.x(turtle_stage.width() / 2)
    turtle_stage.y(turtle_stage.height() / 2)
    turtle_makeCursor()
    turtle_updateCursor()
    turtle_cursor.show()
}

function turtle_makeCursor() {
    const size = 10 / turtle_stage.scaleX()
    const cursor = new Konva.Line({
        points: [0, 0, -size, -size, size, 0, -size, size],
        fill: turtle_cursorColor,
        closed: true,
    })
    turtle_cursor.destroyChildren()
    turtle_cursor.add(cursor)
}

function turtle_updateCursor() {
    const cursor = turtle_cursor.children[0]
    cursor.x(turtle_x)
    cursor.y(turtle_y)
    cursor.rotation(turtle_rot)
    turtle_autoZoom()
}

function turtle_autoZoom(noRecursive = false) {
    const rect = turtle_drawing.getClientRect()
    if (rect.width === 0 || rect.height === 0) return
    const cursor = turtle_cursor.children[0].getClientRect()
    const stageWidth = turtle_stage.width(),
        stageHeight = turtle_stage.height()
    if (stageWidth === 0 || stageHeight === 0) return
    const left = Math.min(rect.x, cursor.x),
        right = Math.max(rect.x + rect.width, cursor.x + cursor.width),
        top = Math.min(rect.y, cursor.y),
        bottom = Math.max(rect.y + rect.height, cursor.y + cursor.height)
    if (left < 0 || right > stageWidth || top < 0 || bottom > stageHeight) { //need to zoom out
        const dx = (stageWidth / 2 - (left + right) / 2),
            dy = (stageHeight / 2 - (top + bottom) / 2)
        turtle_stage.position({
            x: turtle_stage.x() + dx,
            y: turtle_stage.y() + dy
        })
        const z = Math.min(1, turtle_stage.scaleX() * Math.min(0.9 * stageWidth / (right - left), 0.9 * stageHeight / (bottom - top)))
        turtle_stage.scaleX(z)
        turtle_stage.scaleY(z)
        turtle_makeCursor()
        turtle_updateCursor()
    } else if (!noRecursive) {
        if (Math.max((right - left) / stageWidth, (bottom - top) / stageHeight) < 0.8) { //can zoom out, so we reset the zoom and let it autozoom out
            turtle_stage.scaleX(1)
            turtle_stage.scaleY(1)
            turtle_autoZoom(true)
        }
    }
}

export function clearTurtle() {
    if (!turtle_initialized) return
    turtle_reset()
}

export function hideTurtleCursor() {
    turtle_cursor.hide()
}

export function showTurtleCursor() {
    turtle_cursor.show()
}

export function isTurtleCursorVisible() {
    return turtle_cursor.visible()
}

export function downloadTurtleImage(name = "Turtle drawing", background = true, superSampling = 2) {
    const oldContext = turtle_drawing.canvas.context._context
    const oldSPos = turtle_stage.position()
    const oldSScale = turtle_stage.scale()
    const oldDPixelRatio = turtle_drawing.getCanvas().getPixelRatio()
    turtle_stage.position({
        x: 0,
        y: 0
    })
    turtle_stage.scale({
        x: 1,
        y: 1
    })
    let bounds = turtle_drawing.getClientRect()
    const w = bounds.width,
        h = bounds.height
    let z = superSampling
    if (w > 2000 || h > 2000) {
        z *= 2000 / Math.max(w, h)
    }
    turtle_stage.scale({
        x: z,
        y: z
    })
    bounds = turtle_drawing.getClientRect()
    turtle_stage.position({
        x: -bounds.x + 8 * superSampling,
        y: -bounds.y + 8 * superSampling
    })
    const tempCanvas = document.createElement("canvas")
    turtle_drawing.canvas.context._context = tempCanvas.getContext("2d")
    tempCanvas.width = w * z + 16 * superSampling
    tempCanvas.height = h * z + 16 * superSampling
    let rect = null
    if (background) {
        if (turtle_backgroundColor !== null) {
            rect = new Konva.Rect({
                x: (bounds.x - 8 * superSampling) / z,
                y: (bounds.y - 8 * superSampling) / z,
                width: w + superSampling * 16 / z,
                height: h + superSampling * 16 / z,
                fill: turtle_backgroundColor,
            })
            turtle_drawing.add(rect)
            rect.moveToBottom()
        }
    }
    turtle_stage.draw()
    const out = tempCanvas.toDataURL("image/png")
    if (rect !== null) {
        rect.destroy()
    }
    turtle_drawing.canvas.context._context = oldContext
    turtle_drawing.getCanvas().setPixelRatio(oldDPixelRatio)
    turtle_stage.position(oldSPos)
    turtle_stage.scale(oldSScale)
    turtle_stage.draw()
    if (!name.endsWith(".png")) name += ".png"
    const a = document.createElement("a")
    a.href = out
    a.download = name
    a.click()
}

let turtle_nPoints = 0

function turtle_limitPoints() {
    if (interpreter.uiBridge.turtle_maxPoints <= 0 || turtle_nPoints <= interpreter.uiBridge.turtle_maxPoints) return
    let pointsToRemove = turtle_nPoints - interpreter.uiBridge.turtle_maxPoints
    turtle_nPoints -= pointsToRemove
    while (pointsToRemove > 0) {
        const oldestLine = turtle_drawing.children[0],
            points = oldestLine.points()
        if (pointsToRemove >= points.length / 2) {
            pointsToRemove -= points.length / 2
            oldestLine.destroy()
        } else {
            oldestLine.points(points.slice(pointsToRemove * 2))
            pointsToRemove = 0
        }
    }
}

export function setTurtleColors(cursor, background, foreground) {
    turtle_backgroundColor = background
    turtle_foregroundColor = foreground
    turtle_cursorColor = cursor
    if (turtle_initialized) {
        const c = turtle_cursor.children[0]
        if (typeof cursor !== "undefined") {
            c.fill(cursor)
        }
        turtle_drawing.children.forEach(line => line.stroke(foreground))
    }
}

export function Move(expression = null, draw = true) {
    this.expression = expression
    this.draw = draw
}
Move.prototype = {
    constructor: Move,
    tick: function() {
        interpreter.currentInstruction = this
        if (typeof interpreter.uiBridge.turtle_show !== "undefined") interpreter.uiBridge.turtle_show()
        if (this.expression === null || this.draw === null) throw "Incomplete instruction"
        const dist = evaluateExpression(this.expression)
        if (typeof dist !== "number") throw "Not a number"
        if (!turtle_initialized) turtle_init()
        const rad = 2 * Math.PI * turtle_rot / 360
        const dx = Math.cos(rad) * dist,
            dy = Math.sin(rad) * dist
        if (this.draw === true) {
            const lastLine = turtle_drawing.children[turtle_drawing.children.length - 1]
            let lastLinePoints = null
            if (typeof lastLine !== "undefined") {
                lastLinePoints = lastLine.points()
                if (lastLinePoints[lastLinePoints.length - 2] !== turtle_x || lastLinePoints[lastLinePoints.length - 1] !== turtle_y) {
                    lastLinePoints = null
                }
            }
            if (lastLinePoints !== null) {
                lastLine.points(lastLinePoints.concat(turtle_x + dx, turtle_y + dy))
            } else {
                const l = new Konva.Line({
                    points: [turtle_x, turtle_y, turtle_x + dx, turtle_y + dy],
                    stroke: turtle_foregroundColor,
                    strokeWidth: 1,
                    strokeScaleEnabled: false,
                    perfectDrawEnabled: false,
                })
                turtle_drawing.add(l)
            }
            turtle_nPoints++
            turtle_limitPoints()
        }
        turtle_x += dx
        turtle_y += dy
        turtle_updateCursor()
        return true
    },
    toSimpleObject: function() {
        const type = this.type
        return {
            type: type,
            expression: this.expression,
            draw: this.draw,
        }
    },
}
Move.fromSimpleObject = function(o) {
    if (o.type !== this.prototype.type) throw "Not a " + this.prototype.type
    return new Move(o.expression, o.draw)
}
registerInstructionType(Move, "Move", "Graphics")

export function Turn(expression = null, direction = "cw") {
    this.expression = expression
    this.direction = direction
}
Turn.prototype = {
    constructor: Turn,
    tick: function() {
        interpreter.currentInstruction = this
        if (typeof interpreter.uiBridge.turtle_show !== "undefined") interpreter.uiBridge.turtle_show()
        if (this.expression === null) throw "Incomplete instruction"
        const rot = evaluateExpression(this.expression)
        if (typeof rot !== "number") throw "Not a number"
        if (!turtle_initialized) turtle_init()
        switch (this.direction) {
            case 'cw':
                turtle_rot += rot
                break
            case 'ccw':
                turtle_rot -= rot
                break
            default:
                throw "Invalid direction: " + this.direction
        }
        turtle_updateCursor()
        return true
    },
    toSimpleObject: function() {
        const type = this.type
        return {
            type: type,
            expression: this.expression,
            direction: this.direction,
        }
    },
}
Turn.fromSimpleObject = function(o) {
    if (o.type !== this.prototype.type) throw "Not a " + this.prototype.type
    return new Turn(o.expression, o.direction)
}
registerInstructionType(Turn, "Turn", "Graphics")

export function Home() {}
Home.prototype = {
    constructor: Home,
    tick: function() {
        interpreter.currentInstruction = this
        if (typeof interpreter.uiBridge.turtle_show !== "undefined") interpreter.uiBridge.turtle_show()
        if (!turtle_initialized) turtle_init()
        turtle_x = 0
        turtle_y = 0
        turtle_rot = -90
        turtle_updateCursor()
        return true
    },
    toSimpleObject: function() {
        const type = this.type
        return {
            type: type,
        }
    },
}
Home.fromSimpleObject = function(o) {
    if (o.type !== this.prototype.type) throw "Not a " + this.prototype.type
    return new Home()
}
registerInstructionType(Home, "Home", "Graphics")

/*
 * Main interpreter loop implementation (interpreter variable).
 * The interpreter is executed on every frame using requestAnimationFrame; all it does is call the tick method repeatedly on the program object, which then proceeds recursively until exactly one instruction is executed
 *
 * The interpreter can be in several states, which can be obtained using interpreter.getState():
 * - "stopped": the program is not started, has finished execution, or was stopped by the user. From this state, the program can be started by calling run(), which will put the interpreter into running and reset the state of the program
 * - "running": the interpreter is running the program. Various execution modes are available, described below. From this state the program can be paused by calling pause(), which will put the interpreter into paused; it can be stopped by calling stop(), which will put the interpreter into stopped without resetting the state of the program; or it can crash and end up in crashed
 * - "paused": the interpreter is paused, either manually or by a breakpoint; execution can be resumed by calling run(), which will put the interpreter back into running, or it can be stopped by calling stop(), which will put the interpreter into stopped
 * - "crashed": the program has crashed; this state is similar to stopped
 *
 * The interpreter starts in the stopped state until run() is called.
 *
 * The state of the interpreter can be read using the getState() function, and can be changed using the stop(), run(), pause() functions.
 *
 * A useful clearProgram function is also provided, which removes all instructions from the current program (but not variables, use clearVariables for that)
 *
 * The interpreter can be in several execution modes, which control the speed at which the program can run; the execution mode can be changed using interpreter.setExecutionMode(mode) and can be obtained using interpreter.getExecutionMode():
 * - "normal": runs 1 instruction per frame
 * - "slow": runs 1 instruction every 500ms (SLOW_DELAY)
 * - "step": step-by-step execution, pauses the interpreter automatically after every instruction. When in this mode, run() needs to be called after each instruction to step through the program
 * - "turbo": runs the program as fast as possible, pausing every 10ms (TURBO_TSLICE) to allow the UI to update. Instructions can temporarily disable this by setting preventTurbo to true to avoid wasting CPU power doing things like busy waiting for inputs
 *
 * The interpreter starts in MODE_NORMAL when Flogo is loaded.
 *
 * The turbo mode has a special mode called alternative turbo timeslice, which sacrifices framerate for better program execution speed. It is disabled by default, but the functions interpreter.setAltTurboTSlice(enabled) and interpreter.getAltTurboTSlice() can be used.
 *
 * Implementation note: the interpreter's internal state is not protected using a Proxy for performance reasons.
 *
 * For convenience, the UI can optionally define 3 functions in the interpreter for callbacks:
 * - interpreter.uiBridge.onProgramEnd: called when the program ends normally
 * - interpreter.uiBridge.onProgramPaused: called when the program is paused
 * - interpreter.uiBridge.onProgramCrash(err): called when the program crashes, with an exception explaining what happened
 */

export let program = new InstructionSequence()

export function clearProgram() {
    program.body = []
    jsepCache = {}
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

const interpreter_internal = {
    state: STATE_STOPPED,
    executionMode: MODE_NORMAL,
    altTurboTSlice: false,
    lastInstrT: 0,
}

export const interpreter = {
    currentInstruction: null, //Pointer to the currently running instruction. This is not actually used anywhere in the core, but the UI can use it to highlight it. All instructions will keep this updated
    preventTurbo: false,
    uiBridge: {}, //UI callbacks and settings, can be modified freely
    getState: () => {
        switch (interpreter_internal.state) {
            case STATE_STOPPED:
                return "stopped"
            case STATE_RUNNING:
                return "running"
            case STATE_PAUSED:
                return "paused"
            case STATE_CRASHED:
                return "crashed"
            default:
                throw "Internal error: invalid interpreter state " + interpreter_internal.state
        }
    },
    run: () => {
        if (interpreter_internal.state === STATE_RUNNING) throw "Program is already running"
        if (interpreter_internal.state === STATE_CRASHED || interpreter_internal.state === STATE_STOPPED) {
            resetVariables()
            const reset_rec = instruction => {
                delete instruction.state
                if (instruction.type === "InstructionSequence") {
                    instruction.body.forEach(i => reset_rec(i))
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
        interpreter_internal.state = STATE_RUNNING
        interpreter.preventTurbo = false
    },
    stop: () => {
        if (interpreter_internal.state === STATE_CRASHED || interpreter_internal.state === STATE_STOPPED) throw "Cannot stop a stopped/crashed program"
        interpreter_internal.state = STATE_STOPPED
        interpreter.currentInstruction = null
    },
    pause: () => {
        if (interpreter_internal.state === STATE_CRASHED || interpreter_internal.state === STATE_STOPPED) throw "Cannot pause a stopped/crashed program"
        interpreter_internal.state = STATE_PAUSED
        if (typeof interpreter.uiBridge.onProgramPaused !== "undefined") {
            interpreter.uiBridge.onProgramPaused()
        }
    },
    getExecutionMode: () => {
        switch (interpreter_internal.executionMode) {
            case MODE_NORMAL:
                return "normal"
            case MODE_SLOW:
                return "slow"
            case MODE_STEP:
                return "step"
            case MODE_TURBO:
                return "turbo"
            default:
                throw "Internal error: invalid execution mode " + interpreter_internal.executionMode
        }
    },
    setExecutionMode: mode => {
        switch (mode) {
            case "normal":
                interpreter_internal.executionMode = MODE_NORMAL
                break
            case "slow":
                interpreter_internal.executionMode = MODE_SLOW
                break
            case "step":
                interpreter_internal.executionMode = MODE_STEP
                break
            case "turbo":
                interpreter_internal.executionMode = MODE_TURBO
                break
            default:
                throw "Invalid execution mode. Valid values are: normal, slow, step, turbo"
        }
    },
    setAltTurboTSlice: enabled => {
        interpreter_internal.altTurboTSlice = enabled === true
    },
    getAltTurboTSlice: () => {
        return interpreter_internal.altTurboTSlice
    }
}
Object.seal(interpreter)

function stepProgram() {
    switch (interpreter_internal.state) {
        case STATE_RUNNING: {
            try {
                if (program.tick()) {
                    interpreter_internal.state = STATE_STOPPED
                    if (typeof interpreter.uiBridge.onProgramEnd !== "undefined") {
                        interpreter.uiBridge.onProgramEnd()
                    }
                }
            } catch (e) {
                interpreter_internal.state = STATE_CRASHED
                if (typeof interpreter.uiBridge.onProgramCrash !== "undefined") {
                    interpreter.uiBridge.onProgramCrash(e)
                } else {
                    throw e
                }
            }
        }
        break
        case STATE_STOPPED: {
            interpreter.currentInstruction = null
        }
        break
        case STATE_PAUSED: {}
        break
        case STATE_CRASHED: {}
        break
        default: {
            throw "Internal error: invalid state " + interpreter_internal.state
        }
    }
}

function mainLoop() {
    requestAnimationFrame(mainLoop)
    switch (interpreter_internal.executionMode) {
        case MODE_TURBO: {
            if (interpreter_internal.state === STATE_RUNNING && !interpreter.preventTurbo) {
                const t = performance.now() + (interpreter_internal.altTurboTSlice ? TURBO_TSLICE_ALT : TURBO_TSLICE)
                while (performance.now() <= t) {
                    stepProgram()
                }
            } else {
                stepProgram()
            }
        }
        break
        case MODE_NORMAL: {
            stepProgram()
        }
        break
        case MODE_SLOW: {
            if (performance.now() - interpreter_internal.lastInstrT >= SLOW_DELAY) {
                interpreter_internal.lastInstrT = performance.now()
                stepProgram()
            }
        }
        break
        case MODE_STEP: {
            stepProgram()
            if (interpreter_internal.state === STATE_RUNNING) {
                interpreter_internal.state = STATE_PAUSED
            }
        }
        break
        default: {
            throw "Internal error: invalid execution mode " + interpreter_internal.executionMode
        }
    }
}
mainLoop()

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
export let metadata

function getAuthorUUID() {
    if (navigator.doNotTrack != 1) {
        if (typeof storage.authorId === "undefined") {
            storage.authorId = crypto.randomUUID()
        }
        return storage.authorId
    } else {
        if (typeof storage.authorId !== "undefined") {
            delete storage.authorId
        }
        return ""
    }
}

export function clearMetadata() {
    metadata = {
        id: navigator.doNotTrack != 1 ? crypto.randomUUID() : "",
        authorId: getAuthorUUID(),
        title: "Untitled",
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
 * Several functions are provided for easily loading/saving programs:
 * - load(json): loads a program from a JSON string. Deletes the current program. Throws an exception and loads an empty program if something goes wrong
 * - save(updateMetadata, varsToSkip): returns the current program as a JSON string. updateMetadata (default true) can be set to false if you don't want the uuid and timestamp of saving to be added to the metadata. varsToSkip is an optional array of variables that can be skipped when saving (used to exclude temporary variables created by the variables editor in the UI)
 * - download(name): same as save() but you can pass it a filename and it will start a compressed file download (Note: async function)
 * - loadFromFile(f): loads a program from a file, making sure that it is actually a valid Flogo program. This function is asynchronous and returns null if the program was loaded, or a string containing an error message if something went wrong
 *
 */

export function save(updateMetadata = true, varsToSkip = []) {
    const vars = {}
    for (const v in variables) {
        if (!varsToSkip.includes(v)) {
            vars[v] = variables[v].toSimpleObject()
        }
    }
    if (updateMetadata) {
        if (navigator.doNotTrack != 1) {
            metadata.modified.push([Date.now(), getAuthorUUID()])
        }
    }
    return JSON.stringify({
            metadata: metadata,
            variables: vars,
            program: program.toSimpleObject(),
        },
        null,
        2
    )
}

export function load(json) {
    if (interpreter_internal.state !== STATE_STOPPED && interpreter_internal.state !== STATE_CRASHED) throw "A program is already running"
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
            declareVariable(v, json.variables[v].type, json.variables[v].arraySize, json.variables[v].value)
        }
        program = InstructionSequence.fromSimpleObject(json.program)
        if (!(program instanceof InstructionSequence)) {
            throw "Program is not an InstructionSequence"
        }
    } catch (e) {
        console.log(e)
        clearVariables()
        clearProgram()
        clearMetadata()
        throw "Invalid program"
    }
}

async function compress(json) {
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

export async function download(name) {
    if (typeof name === "undefined") {
        if (metadata.title.trim() !== "") {
            name = metadata.title
        } else {
            name = "Untitled"
        }
    }
    if (!name.endsWith(".flogo")) name += ".flogo"
    const blob = await compress(save())
    const a = document.createElement("a")
    a.href = URL.createObjectURL(blob)
    a.download = name
    a.click()
}

async function decompress(blob) {
    if (blob.size < 6) throw ""
    const head = await blob.slice(0, 6).text()
    if (head !== "flogo1") throw ""
    const decStream = blob.slice(6).stream().pipeThrough(new DecompressionStream("gzip"))
    const decResp = await new Response(decStream)
    const decBlob = await decResp.blob()
    const json = await decBlob.text()
    return json
}

export async function loadFromFile(f) {
    try {
        const json = await decompress(f)
        try {
            load(json)
            return null
        } catch (e) {
            return e
        }
    } catch (e) {
        return "Not a Flogo program"
    }
}
