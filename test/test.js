const assert = require('assert');
const plugin = require('../');
const prettier = require('prettier');
const babel = require('@babel/core');

const default_plugin_opts = {};

const tests = {
  'no change': {
    code: 'function foo() { return "__funcname" }',
  },
  '__funcname: no function': {
    code: '__funcname;',
    error: true,
  },
  '__funcname: function foo()': {
    code: 'function foo() { return __funcname; }',
    output: 'function foo() { return "foo"; }',
  },
  '__funcname: disabled': {
    code: 'function foo() { return __funcname; }',
    output: 'function foo() { return __funcname; }',
    opts: {
      replace: {
        __funcname: null,
      },
    },
  },
  '__funcname: class': {
    code: 'class Foo { bar() { return __funcname } }',
    output: 'class Foo { bar() { return "bar" } }',
  },
  '__funcname: class #2': {
    code: 'function Foo() {};  Foo.prototype.bar = function () { return __funcname }',
    output: 'function Foo() {};  Foo.prototype.bar = function () { return "bar" }',
  },
  '__funcname: object': {
    code: 'var a = { bar() { return __funcname } }',
    output: 'var a = { bar() { return "bar" } }',
  },
  '__funcname: object #2': {
    code: 'var a = { bar: function() { return __funcname } }',
    output: 'var a = { bar: function() { return "bar" } }',
  },
  '__funcname: object #3': {
    code: 'var a = { bar: function baz() { return __funcname } }',
    output: 'var a = { bar: function baz() { return "baz" } }',
  },
  '__funcname: anonymous': {
    code: 'function () { return __funcname }',
    error: true,
  },
  '__funcname: arrow': {
    code: 'var a = () => { return __funcname }',
    error: true,
  },
  'custom: id': {
    code: 'bar("foo"); foo();',
    output: 'bar("foo"); fuzz();',
    opts: {
      replace: {
        'foo': 'fuzz',
      },
    },
  },
  'custom: remove function': {
    code: 'foo(); bar();',
    output: 'foo();',
    opts: {
      replace: {
        'bar()': '',
      },
    },
  },
  'custom: function': {
    code: 'bar(); foo("bar()");',
    output: 'baz(1); foo("bar()");',
    opts: {
      replace: {
        'bar()': 'baz(1)',
      },
    },
  },
  'custom: function params': {
    // not yet supported
    skip: true,
    code: 'bar(7)',
    output: 'baz(7+1, 1)',
    opts: {
      replace: {
        'bar(a)': 'baz(a+1, 1)',
      },
    },
  },
  'custom + funcname': {
    code: 'function baz() { foo() }',
    output: 'function baz() { bar("baz") }',
    opts: {
      replace: {
        'foo()': 'bar(__funcname)',
      },
    },
  },
};

function format(code) {
  return prettier.format(code, { semi: true, parser: 'babel' }).replace(/\n\n+/g, '\n');
}

let any_only = false;
for (let key in tests) {
  if (tests[key].only) {
    any_only = true;
  }
}

for (let key in tests) {
  let test = tests[key];
  if (!test.only && (any_only || test.skip)) {
    continue;
  }
  let ret;
  let had_error = false;
  console.log(`Test: ${key}`);
  let opts = {
    babelrc: false,
    plugins: [[plugin, test.opts || default_plugin_opts]],
  };
  try {
    ret = babel.transformSync(test.code, opts);
  } catch (e) {
    if (test.error) {
      had_error = true;
      // OK
    } else {
      throw e;
    }
  }
  if (test.error && !had_error) {
    assert(false, 'Test expected to error');
  }
  if (!test.error) {
    assert.equal(format(ret.code), format(test.output || test.code));
  }
}

console.log('All complete.');
