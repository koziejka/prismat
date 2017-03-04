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

module.exports = {
    getLanguageInfo
}