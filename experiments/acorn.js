/* jshint esversion: 6 */

var acorn = require('acorn/dist/acorn_loose');
var walk = require('acorn/dist/walk');

var fs = require('fs');
var path = require('path');

var present = require('present');

var lines = 0;
var chars = 0;

filePath = 'experiments\\code-shadow.js';

// Try lexing a file
fs.readFile(filePath, {
  encoding: 'utf-8'
}, function(err, data) {
  if (!err) {
    program = acorn.parse_dammit(data);

    // Clone and extend the default walker
    myWalker = {};
    for (var key in walk.base) {
      myWalker[key] = walk.base[key];
    }
    myWalker.ExportNamedDeclaration = myWalker.ExportDefaultDeclaration = (node, st, c) => {
      st.depth += 1;
      walk.base.ExportDefaultDeclaration(node, st, c);
      st.depth -= 1;
    };
    myWalker.Function = (node, st, c) => {
      st.depth += 1;
      walk.base.Function(node, st, c);
      st.depth -= 1;
    };
    myWalker.Class = (node, st, c) => {
      st.depth += 1;
      walk.base.Class(node, st, c);
      st.depth -= 1;
    };

    walk.simple(program, {
      "ExportDefaultDeclaration" : (node, state) => {
        console.log(node.type + ': ' + state.depth);
      },
      "Function" : (node, state) => {
        console.log(node.type + ': ' + state.depth);
      },
      "ClassDeclaration" : (node, state) => {
        console.log(node.type + ': ' + state.depth);
      }
    }, myWalker, {
      'depth': 0,
    });
  } else {
    console.log(err);
  }
});
