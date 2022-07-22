babel-plugin-transform-preprocessor
===================================

Simple identifier replacements for Babel, supporting function name (`__funcname`) as well as any custom mapping, such as would usually be handled by a preprocessor in other languages.  This is particularly useful if you have a profiling build that wants additional instrumentation.

**Example (__funcname and custom replace)**

Configuration (.babelrc or otherwise):
```json
{
  "plugins": [
    ["transform-preprocessor", {
      "replace": {
        "trace()": "if (_enabled) logTrace(__funcname)",
      }
    }]
  ]
}
```
Input:
```javascript
function test1() {
  console.log(__funcname);
}

function test2() {
  trace();
}
```
Output:
```javascript
function test1() {
  console.log("test1");
}

function test2() {
  if (_enabled) logTrace("test2");
}
```

**Options**
```javascript
{
  replace: {
    'source': 'dest', // simple replacement applied to Identifiers, replaces with specified code
    'source()': 'dest()', // simple replacement applied to a CallExpressions, replaces with specified code
    'source': (path) => {}, // calls replacement function, maybe just write a Babel plugin instead?
    'source()': '', // replace a CallExpression with nothing
    '__funcname': null, // disable a default replacement (__funcname will remain in output source)
  }
}
```
Default options
```javascript
{
  replace: {
    '__funcname': replacerFuncName, // see lib/transform-preprocessor.js
  }
}
```

**Future work**

* Support more complex call expression replacements, e.g. `F(A, B)` => `f(A + 1, B, c)`
* Extend this to support some simple per-file macros in a JS-friendly way, e.g. `const WIDTH = __define(10)`, or leave this kind of optimization to the minifiers?
