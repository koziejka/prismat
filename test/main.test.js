const { describe, it } = require('mocha')
const { assert, expect } = chai = require('chai')
const { getLanguageInfo, ifToCode, testToCode, actionToCode } = require('../src/main')

describe('#main.js', () => {

    describe('#getLanguageInfo', () => {

        describe('#arguments', () => {

            it('null passed', () => {
                expect(() => getLanguageInfo(null)).to.throw(Error)
            })

            it('object passed', () => {
                expect(() => getLanguageInfo({})).to.throw(TypeError)
                expect(() => getLanguageInfo([])).to.throw(TypeError)
            })

            it('invalid type of argument', () => {
                expect(() => getLanguageInfo(1)).to.throw(TypeError)
                expect(() => getLanguageInfo(false)).to.throw(TypeError)
            })

            it('empty string passed', () => {
                let data
                expect(() => data = getLanguageInfo('')).to.not.throw()
                assert.isObject(data)
            })

            it('valid lang info string passed', () => {
                expect(() => getLanguageInfo(`if 'test' then continue`)).to.not.throw()
            })

            it('invalid lang info string passed', () => {
                expect(() => getLanguageInfo('hdfgkfb sdiofusd 3i904')).to.throw()
            })
        })

        describe('#data structure', () => {

            it('is object', () => {
                assert.isObject(getLanguageInfo('if /regex/ then skip token'))
            })

            it('corect data structure', () => {
                const langInfo = getLanguageInfo(`let 'const' <- /\w+/ be #const`)
                assert.isArray(langInfo.if)
                assert.isArray(langInfo.let)
                assert.property(langInfo, 'break')
                assert.isArray(langInfo.def)
            })

        })

        describe('#language', () => {

            it('skip empty lines', () => {
                expect(() => getLanguageInfo(`

                `)).to.not.throw()
            })

            it('skip line comments', () => {
                expect(() => getLanguageInfo(`~ this is comment`)).to.not.throw()
            })

            describe('#break on', () => {
                it('understanding syntax', () => {
                    const data = getLanguageInfo('break on /regex/')
                    expect(data.break.test('regex')).to.equal(true)
                })
            })

            describe('#define', () => {
                it('understanding syntax', () => {
                    const data = getLanguageInfo('define x = 1')
                    expect(data.def[0].name).to.equal('x')
                    expect(data.def[0].value).to.equal('1')
                })
            })

            describe('#if then', () => {
                it('understanding syntax', () => {
                    const data = getLanguageInfo('if /regex/ && [(js expresion)] then continue')

                    expect(data.if[0].test).to.equal('/regex/ && [(js expresion)]')
                    expect(data.if[0].action).to.equal('continue')
                })
            })

            describe('#let be', () => {
                it('understanding syntax', () => {
                    const data = getLanguageInfo(`let /regex/ <- 'test' be #this`)

                    expect(data.let[0].test).to.equal(`/regex/ <- 'test'`)
                    expect(data.let[0].type).to.equal('be')
                    expect(data.let[0].action).to.equal('#this')
                })
            })

        })

    })

    describe('#test generation', () => {

        it('string comparison', () => {
            const _if = getLanguageInfo(`if 'test' then continue`).if[0]

            const code = 'if(' + testToCode(_if.test) + ')return true;return false'
            const test = Function('token', code)

            const result1 = test({ text: 'test' })
            const result2 = test({ text: 'testhudfis' })

            expect(result1).to.equal(true)
            expect(result2).to.equal(false)
        })

        it('regex test', () => {
            const _if = getLanguageInfo(`if /{.*?}$/ then continue`).if[0]
            const code = 'if(' + testToCode(_if.test) + ')return true;return false'

            const test = Function('token', code)

            const result1 = test({ text: 'test' })
            const result2 = test({ text: 'testhudfis' })
            const result3 = test({ text: '{23}' })

            expect(result1).to.equal(false)
            expect(result2).to.equal(false)
            expect(result3).to.equal(true)

        })

        it('js evaluation', () => {
            const _if = getLanguageInfo(`if [(test)] then continue`).if[0]
            const code = 'if(' + testToCode(_if.test) + ')return true;return false'

            const test = Function('test', code)

            const result1 = test(true)
            const result2 = test(false)

            expect(result1).to.equal(true)
            expect(result2).to.equal(false)

        })

        it('look behind operator', () => {
            const _if = getLanguageInfo(`if 'test' <- 'token' then continue`).if[0]
            const code = 'if(' + testToCode(_if.test) + ')return true;return false'

            const test = Function('tokens', 'token', code)

            const result1 = test([{ text: 'test' }], { text: 'token' })
            const result2 = test([{ text: 'te' }], { text: 'token' })
            const result3 = test([], { text: 'token' })

            expect(result1).to.equal(true)
            expect(result2).to.equal(false)
            expect(result3).to.equal(false)

        })

        it('look behind with token tag check', () => {
            const _if = getLanguageInfo(`if #test <- 'token' then continue`).if[0]
            const code = 'if(' + testToCode(_if.test) + ')return true;return false'

            const test = Function('tokens', 'token', code)

            const result1 = test([{ tags: ['#test'] }], { text: 'token' })
            const result2 = test([{ tags: ['#te'] }], { text: 'token' })
            const result3 = test([], {})

            expect(result1).to.equal(true)
            expect(result2).to.equal(false)
            expect(result3).to.equal(false)

        })

        it('look ahead operator', () => {
            const _if = getLanguageInfo(`if 'token' -> 'i' then continue`).if[0]
            const code = 'i=0;if(' + testToCode(_if.test) + ')return true;return false'
            const test = Function('data', 'token', code)

            const result1 = test('this is data', { text: 'token' })
            const result2 = test(' is data', { text: 'token' })
            const result3 = test('', { text: 'token' })

            expect(result1).to.equal(false)
            expect(result2).to.equal(true)
            expect(result3).to.equal(false)

        })

        it('&& operator', () => {
            const _if = getLanguageInfo(`if [(x)] && 'token' then continue`).if[0]
            const code = 'if(' + testToCode(_if.test) + ')return true;return false'
            const test = Function('x', 'token', code)

            const result1 = test(true, { text: 'token' })
            const result2 = test(false, { text: 'token' })

            expect(result1).to.equal(true)
            expect(result2).to.equal(false)

        })

        it('|| operator', () => {
            const _if = getLanguageInfo(`if [(x)] || [(y)] then continue`).if[0]
            const code = 'if(' + testToCode(_if.test) + ')return true;return false'
            const test = Function('x', 'y', code)

            const result1 = test(true, true)
            const result2 = test(false, false)
            const result3 = test(false, true)

            expect(result1).to.equal(true)
            expect(result2).to.equal(false)
            expect(result3).to.equal(true)

        })
    })

    describe('#action translation', () => {
        it('continue', () => {
            let func = Function(`
                let data = 'this|is|a|test'
                let token = { text: '', tags: [] }
                for (let i = 0; i < data.length; i++){
                    const curentChar = data[i]
                    if (data[i] == '|') {
                        ${actionToCode('then', 'continue')}
                        token = {}
                    } else token.text += curentChar
                }
                return token.text
            `)
            expect(func()).to.equal('this|is|a|test')
        })
        it('skip n', () => {
            let func = Function(`
                let data = 'this|is|a|test'
                let token = { text: '', tags: [] }
                for (let index = 0; index < data.length; index++){
                    const curentChar = data[index]
                    if (data[index] == '|') {
                        ${actionToCode('then', 'skip 1')}
                        token = {}
                    } else token.text += curentChar
                }
                return token.text
            `)
            expect(func()).to.equal('thisisatest')
        })
        it('skip token', () => {
            let func = Function(`
                let data = 'this|'
                let token = { text: '', tags: [] }
                for (let index = 0; index < data.length; index++){
                    const curentChar = data[index]
                    if (data[index] == '|') {
                        if (token.text === 'this') {
                            ${actionToCode('then', 'skip token')}
                        }
                        token = {text:'',tags:[]}
                    } else token.text += curentChar
                }
                return token.text
            `)
            expect(func()).to.equal('')
        })
        it('js evaluation', () => {
            expect(Function(actionToCode('then', `[(return 'ok')]`))()).to.equal('ok')
        })
        it('throw', () => {
            expect(Function(actionToCode('then', `throw 'this is an Error'`))).to.throw()
        })
    })

    describe('#if then', () => {

    })
})
