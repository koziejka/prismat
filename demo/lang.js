const fs = require('fs')
const { getLanguageInfo, ifToCode, letToCode, createTokenizer } = require('../src/main')

const data = fs.readFileSync('./simple.prism', 'utf8')
const langInfo = getLanguageInfo(data)

const tokenizer = createTokenizer(langInfo)

console.log(tokenizer(fs.readFileSync('./demo.lang', 'utf8')))