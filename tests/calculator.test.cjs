// Run with: node --test tests/calculator.test.cjs
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const html = fs.readFileSync(path.join(__dirname, '../index.html'), 'utf8');
const script = html.match(/<script>([\s\S]*?)<\/script>/)[1];
function calculator() {
    const display = {value: ''};
    const context = vm.createContext({document: {getElementById: () => display}});
    vm.runInContext(script, context);
    return {display, context};
}

test('small results in scientific notation can be reused', () => {
    const {display, context} = calculator();
    display.value = '1/10000000';
    context.calculate();
    assert.equal(display.value, '1e-7');
    context.appendOperator('*'); context.appendNumber('10'); context.calculate();
    assert.equal(Number(display.value), 0.000001);
});

test('large results in scientific notation can be reused', () => {
    const {display, context} = calculator();
    display.value = '1000000000000000000000'; context.calculate();
    assert.equal(display.value, '1e+21');
    context.appendOperator('/'); context.appendNumber('10'); context.calculate();
    assert.equal(Number(display.value), 1e20);
});

test('signed exponents retain normal operator precedence', () => {
    const {context} = calculator();
    assert.equal(context.evaluateExpression('2E+3+1e-2*100'), 2001);
    assert.equal(context.evaluateExpression('-1e-7*10'), -0.000001);
    assert.equal(context.evaluateExpression('2+3*4'), 14);
});

test('malformed numbers, non-finite results, and code remain rejected', () => {
    const {context} = calculator();
    for (const input of ['1e', '1e+', '1e--2', '1e999', '1/0', 'alert(1)', '2;3', 'Math.random()']) {
        assert.throws(() => context.evaluateExpression(input), input);
    }
});

test('decimal button cannot corrupt a displayed exponent', () => {
    for (const value of ['1e-7', '1e+21', '1.5e-7', '-1e-7']) {
        const {display, context} = calculator();
        display.value = value;
        context.appendDecimal();
        assert.equal(display.value, value);
        context.calculate();
        assert.notEqual(display.value, 'Error');
    }
});

test('decimal button still handles new operands and ordinary decimals', () => {
    for (const [input, expected] of [['', '0.'], ['2+', '2+0.'], ['1e-7+', '1e-7+0.'], ['2', '2.'], ['2.5', '2.5'], ['Error', '0.']]) {
        const {display, context} = calculator();
        display.value = input;
        context.appendDecimal();
        assert.equal(display.value, expected);
    }
});

test('equals on an empty display leaves it ready for input',()=>{
    const x=calculator();x.context.calculate();assert.equal(x.display.value,'');
    x.context.appendNumber('2');x.context.calculate();assert.equal(x.display.value,'2');
});
test('invalid nonempty expressions still show Error',()=>{
    const x=calculator();x.display.value='2/0';x.context.calculate();assert.equal(x.display.value,'Error');
});
test('new binary operator replaces an unfinished binary operator',()=>{
    for(const [input,op,expected] of [['2+','*','2*'],['2*','/','2/'],['2/','+','2+'],['2+','+','2+']]){
        const x=calculator();x.display.value=input;x.context.appendOperator(op);assert.equal(x.display.value,expected);
        x.context.appendNumber('3');x.context.calculate();assert.notEqual(x.display.value,'Error');
    }
});
test('unary minus after multiplication and signed exponents are preserved',()=>{
    const x=calculator();x.display.value='2*';x.context.appendOperator('-');x.context.appendNumber('3');x.context.calculate();assert.equal(x.display.value,'-6');
    x.display.value='1e+21';x.context.appendOperator('/');assert.equal(x.display.value,'1e+21/');
});
