/** This function is used to extract information from prismat lang.
 * @param {String} data
 * @returns {{if: [{test: String, action: String}], let:[{test: String, type: String, action: String}], break: RegExp}
 */
const getLanguageInfo = data => {
    if (data === null || data === undefined)
        throw new Error('You have to pass data into getLanguageInfo')
    if (typeof data !== 'string')
        throw new TypeError('data must be string')
    const langInfo = {
        if: [],
        let: [],
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
        }
        else throw new Error(`can't understand ${line}`)
    }

    return langInfo
}

/** This function is used to translate if info to js code.
 * @param {{test: String, action: String}} ifInfo
 * @returns {String}
 */
const ifToCode = ifInfo => {
    const test = ifInfo.test
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
    const action = ifInfo.action.replace(/^#(\w+)/, 'tokenTags.push("$1");')

    let testCode = '', actionCode = action, lookBack = 0, acces = 'token', lookAhead = false

    for (let i = 0; i < test.length; i++) {

        if ((test[i - 1] || {}).text === '->') {
            acces = `(data[i + ++skip] || '')`
            lookAhead = true
        } else if ((test[i + 1] || { text: '->' }).text === '->') {
            acces = 'token'
        } else if ((test[i + 1] || {}).text === '<-') {
            acces = '(tokens[tokens.length - lookBack--] || {})'
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
            case 'Varible':
            case 'Operator':
                if (test[i].text == '||') {
                    testCode += '||'
                } else {
                    testCode += '&&'
                }
        }

    }

    return testCode ? `if(${lookBack ? `lookBack=${lookBack},` : ''}${lookAhead ? `skip=0,` : ''}${testCode}){${actionCode}}` : ''
}

module.exports = {
    getLanguageInfo
}