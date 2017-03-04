/** This function is used to extract information from prismat lang.
 * @param {String} data Prismat lang string.
 * @returns {getLanguageInfo~langInfo}
 * @version 1.0.1
 * @author Maciej Kozieja <koziejka.com@gmail.com>
 */
const getLanguageInfo = data => {
    if (data === null || data === undefined)
        throw new Error('You have to pass data into getLanguageInfo')
    if (typeof data !== 'string')
        throw new TypeError('data must be string')
    const langInfo = {
        if: [],
        let: [],
        def: [],
        break: /\W/
    }

    const lines = data.split('\n')

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i]
        if (/^~.*/.test(line)) continue
        if (/^\s*$/.test(line)) continue

        if (/^\s*if/i.test(line)) {
            const [, test, action] = line.match(/^if\s+(.*?)\s+then\s+(.*)/i)
            langInfo.if.push({ test, action })
        } else if (/^\s*let/i.test(line)) {
            const [, test, type, action] = line.match(/^let\s+(.*?)\s+(be\s+group|be|throw|expand\s+group)\s+(.*)/)
            langInfo.let.push({ test, type, action })
        } else if (/^break\s+on/.test(line)) {
            const value = line.match(/break\s+on\s+(.*)/)[1].trim()
            langInfo.break = new RegExp(value.trim().substr(1, value.length - 2))
        } else if (/^define/.test(line)) {
            const [, name, value] = line.match(/define\s+([a-zA-Z_]\w*)\s*=?\s*(.*)/)
            langInfo.def.push({ name, value })
        } else throw new Error(`can't understand ${line}`)
    }

    return langInfo
}

/** This function is used to translate prismat tests to javascript code.
 * @param {String} testInfo
 * @returns {String}
 * @version 1.0.2
 * @author Maciej Kozieja <koziejka.com@gmail.com>
 */
const createTestCode = testInfo => {
    const test = testInfo
        .split(/\s*(#?\w+|\/[^\/\\]*(?:\\.[^\/\\]*)*\/|'[^\\']*(?:\\.[^\/']*)*'|"[^\\"]*(?:\\.[^\/"]*)*"|`[^\\`]*(?:\\.[^\/`]*)*`|\[\(.*?\)\])\s*/)
        .filter(Boolean)
        .map(text => ({
            text,
            type: /^\/.*?\/$/.test(text) ? 'RegExp'
                : /^([`'"]).*?\1$/.test(text) ? 'String'
                    : /^\[\(.*?\)\]$/.test(text) ? 'JsExpresion'
                        : /#.*/.test(text) ? 'Tag'
                            : /\w+/.test(text) ? 'Varible'
                                : 'Operator'
        }))

    let testCode = '', lookBack = 0, acces = 'token', lookAhead = false

    for (let i = 0; i < test.length; i++) {

        if ((test[i - 1] || {}).text === '->') {
            acces = `(data[i + ++skip] || '')`
            lookAhead = true
        } else if ((test[i + 1] || { text: '->' }).text === '->') {
            acces = 'token'
        } else if ((test[i + 1] || {}).text === '<-') {
            acces = '(tokens[tokens.length - lookBack--] || {tags: []})'
            lookBack++
        }

        switch (test[i].type) {
            case 'RegExp':
                testCode += `(${test[i].text}).test(${acces}${lookAhead ? '' : '.text'})`
                break
            case 'String':
                testCode += `(${test[i].text}===${acces}${lookAhead ? '' : '.text'})`
                break
            case 'JsExpresion':
                testCode += test[i].text.substr(1, test[i].text.length - 2)
                break
            case 'Tag':
                testCode += `${acces}.tags.indexOf('${test[i].text}')!==-1`
                break
            case 'Varible':
                break
            case 'Operator':
                if (test[i].text == '||') {
                    testCode += '||'
                } else {
                    testCode += '&&'
                }
        }

    }

    return `${lookBack ? `lookBack=${lookBack},` : ''}${lookAhead ? `skip=0,` : ''}${testCode}`
}

/** This function is used to translate prismat actions  to javascript code.
 * @param {'then'|'be'|'be group'|'expand group'|'throw'} actionType
 * @param {String} actionInfo
 * @returns {String}
 * @version 1.0.0
 * @author Maciej Kozieja <koziejka.com@gmail.com>
 */
const actionToCode = (actionType, actionInfo) => {
    const actions = actionInfo
        .split(/\s*(#?\w+|'[^\\']*(?:\\.[^\/']*)*'|"[^\\"]*(?:\\.[^\/"]*)*"|`[^\\`]*(?:\\.[^\/`]*)*`|\[\(.*?\)\])\s*/)
        .filter(x => x !== ',' && x !== '')

    let code = ''

    for (let i = 0; i < actions.length; i++) {
        switch (actions[i]) {
            case 'continue':
                if (actionType !== 'then') throw new Error(`continue is allowed only in if.`)
                code += 'token.text+=curentChar;continue;'
                break
            case 'skip':
                if (actionType !== 'then') throw new Error(`skip is allowed only in if.`)
                if (/^\d+$/.test(actions[++i])) {
                    code += `index+=${parseInt(actions[i]) - 1};continue;`
                } else if (actions[++i] === 'token') {
                    code += `token={text:'',tags:[]};continue;`
                }
                break
            case 'throw':
                code += `throw ${actions[++i]}`
                break
            case '':
                break
            default:
                if (/^\[\(.*?\)\]$/.test(actions[i])) {
                    code += actions[i].substr(2, actions[i].length - 4) + ';'
                }
                break
        }
    }

    return code
}

/** This function is used to translate if info to js code.
 * @param {{test: String, action: String}} ifInfo
 * @returns {String}
 * @version 1.0.2
 * @author Maciej Kozieja <koziejka.com@gmail.com>
 */
const ifToCode = ifInfo => {

    const action = ifInfo.action.replace(/^#(\w+)/, 'tokenTags.push("$1");')
    let actionCode = action
    let testCode = createTestCode(ifInfo.test)

    return `if(${testCode}){${actionCode}}`
}

module.exports = {
    getLanguageInfo,
    ifToCode,
    createTestCode,
    actionToCode
}