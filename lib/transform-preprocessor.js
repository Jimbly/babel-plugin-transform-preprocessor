module.exports = function ({ types: t }) {

  function replacerFuncName(path) {
    let parent = path.getFunctionParent();
    if (!parent) {
      throw path.buildCodeFrameError('__funcname only supported within functions');
    }

    let name;
    if (parent.type === 'FunctionDeclaration' || parent.type === 'FunctionExpression') {
      name = parent.node.id && parent.node.id.name;
      if (!name && parent.parent.type === 'AssignmentExpression') {
        parent = parent.parent;
        if (parent.left.type === 'MemberExpression' && parent.left.property) {
          name = parent.left.property.name;
        }
      }
      if (!name && parent.parent.type === 'ObjectProperty') {
        parent = parent.parent;
        if (parent.key) {
          name = parent.key.name;
        }
      }
    } else if (parent.type === 'ClassMethod' || parent.type === 'ObjectMethod') {
      name = parent.node.key && parent.node.key.name;
    }

    if (!name) {
      throw path.buildCodeFrameError('__funcname not supported in anonymous functions');
    }
    path.replaceWith(
      t.stringLiteral(name)
    );
  }

  function replacerCode(str, path) {
    if (str === '') {
      path.remove();
    } else {
      path.replaceWithSourceString(str);
    }
  }


  let id_replacements = {
    __funcname: replacerFuncName,
  };

  return {
    pre() {
      this.callexpr = Object.create(null);
      this.id = Object.create(null);
      for (let key in id_replacements) {
        this.id[key] = id_replacements[key];
      }
      let replace = this.opts && this.opts.replace;
      if (replace) {
        for (let key in replace) {
          let target = replace[key];
          let m = key.match(/^(\w+)\(\)$/);
          if (m) {
            if (target === null) {
              delete this.callexpr[m[1]];
            } else if (typeof target === 'function') {
              this.callexpr[m[1]] = target;
            } else {
              this.callexpr[m[1]] = replacerCode.bind(null, target);
            }
          } else {
            m = key.match(/^(\w+)\(([^)]+)\)/);
            if (m) {
              // TODO support: F(A,B):f(A + 1,B) => F(2,3):f(2+1,3)
            }
            if (target === null) {
              delete this.id[key];
            } else if (typeof target === 'function') {
              this.id[key] = target;
            } else {
              this.id[key] = replacerCode.bind(null, target);
            }
          }
        }
      }
    },
    visitor: {
      Identifier(path, state) {
        let replacer = this.id[path.node.name];
        if (replacer) {
          replacer(path);
        }
      },
      CallExpression(path) {
        let replacer = this.callexpr[path.node.callee.name];
        if (replacer) {
          replacer(path);
        }
      }
    },
  };
};
