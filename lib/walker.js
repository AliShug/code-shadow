'use babel';
/* jshint esversion: 6 */

walk = require('acorn/dist/walk');


// sast - "simplified abstract syntax tree"
// Really it's just a list
function sastPut(node, st) {
  // Dump state into the state. Meta af.
  st.sast.push({
    node: node,
    depth: st.depth,
    method: st.method,
  });
}

// Clone and extend the default Acorn walker
// This deals only with "interesting" blocks - functions, loops etc - anything
// we want to show up as Shadows.
var myWalker = {};
for (var key in walk.base) {
  myWalker[key] = walk.base[key];
}
myWalker.ExportDefaultDeclaration = (node, st, c) => {
  sastPut(node, st);
  st.depth += 1;
  walk.base.ExportDefaultDeclaration(node, st, c);
  st.depth -= 1;
};
myWalker.Function = (node, st, c) => {
  // Prevent 'double-counting' of method defs as function defs
  if (st.method) {
    st.method = false;
    walk.base.Function(node, st, c);
  } else {
    sastPut(node, st);
    st.depth += 1;
    walk.base.Function(node, st, c);
    st.depth -= 1;
  }
};
myWalker.Class = (node, st, c) => {
  sastPut(node, st);
  st.depth += 1;
  walk.base.Class(node, st, c);
  st.depth -= 1;
};
myWalker.ObjectExpression = (node, st, c) => {
  sastPut(node, st);
  st.depth += 1;
  walk.base.ObjectExpression(node, st, c);
  st.depth -= 1;
};
myWalker.MethodDefinition = (node, st, c) => {
  sastPut(node, st);
  st.depth += 1;
  st.method = true;
  walk.base.MethodDefinition(node, st, c);
  st.method = false;
  st.depth -= 1;
};
myWalker.ForStatement = (node, st, c) => {
  sastPut(node, st);
  st.depth += 1;
  walk.base.ForStatement(node, st, c);
  st.depth -= 1;
};
myWalker.WhileStatement = (node, st, c) => {
  sastPut(node, st);
  st.depth += 1;
  walk.base.WhileStatement(node, st, c);
  st.depth -= 1;
};
myWalker.DoWhileStatement = (node, st, c) => {
  sastPut(node, st);
  st.depth += 1;
  walk.base.DoWhileStatement(node, st, c);
  st.depth -= 1;
};
myWalker.ForOfStatement = (node, st, c) => {
  sastPut(node, st);
  st.depth += 1;
  walk.base.ForOfStatement(node, st, c);
  st.depth -= 1;
};
myWalker.ForInStatement = (node, st, c) => {
  sastPut(node, st);
  st.depth += 1;
  walk.base.ForInStatement(node, st, c);
  st.depth -= 1;
};
myWalker.SwitchStatement = (node, st, c) => {
  sastPut(node, st);
  st.depth += 1;
  walk.base.SwitchStatement(node, st, c);
  st.depth -= 1;
};
myWalker.WithStatement = (node, st, c) => {
  sastPut(node, st);
  st.depth += 1;
  walk.base.WithStatement(node, st, c);
  st.depth -= 1;
};
myWalker.LabeledStatement = (node, st, c) => {
  sastPut(node, st);
  st.depth += 1;
  walk.base.LabeledStatement(node, st, c);
  st.depth -= 1;
};
myWalker.TryStatement = (node, st, c) => {
  // TODO: Pull out catch/finally blocks
  sastPut(node, st);
  st.depth += 1;
  walk.base.TryStatement(node, st, c);
  st.depth -= 1;
};
myWalker.ArrayExpression = (node, st, c) => {
  sastPut(node, st);
  st.depth += 1;
  walk.base.ArrayExpression(node, st, c);
  st.depth -= 1;
};
myWalker.IfStatement = (node, st, c) => {
  // TODO: Pull out else/else if blocks
  sastPut(node, st);
  st.depth += 1;
  walk.base.IfStatement(node, st, c);
  st.depth -= 1;
};

export default myWalker;
