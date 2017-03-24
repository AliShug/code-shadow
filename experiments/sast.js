/* jshint esversion: 6 */

var acorn = require('acorn/dist/acorn_loose');
// var acorn = require('acorn');
var esprima = require('esprima');
var walk = require('acorn/dist/walk');
var present = require('present');
var StatsArray = require('stats-array');

var fs = require('fs');
var path = require('path');

var present = require('present');

var timeit = true;

// filePath = 'experiments\\test.js';
// filePath = 'lib\\code-shadow-view.js';
filePath = 'experiments\\jquery-3.2.0.js';

function show(node, st) {
  if (node.loc.end.line - node.loc.start.line < 6) {
    console.log(node.type + ' @' + node.loc.start.line + ': ' + JSON.stringify(st));
  }
  else {
    console.log(node.type + ' @' + node.loc.start.line + ': ' + JSON.stringify(st) + ' SHOWN');
  }
}

// Generate a simplified abstract syntax tree: hierarchal structure containing
// scope-like nodes: control blocks, loops, class definitions, modules etc
fs.readFile(filePath, {
  encoding: 'utf-8'
}, function(err, data) {
  if (!err) {
    if (timeit) {
      let iters = 1000;
      let timings = new Array(iters);
      let start = present();
      let last = start;
      for (var i = 0; i < iters; i++) {
        program = acorn.parse_dammit(data, {'locations':true});
        // program = esprima.parse(data);
        // program = acorn.parse(data);
        let now = present();
        timings[i] = now - last;
        last = now;
      }
      let end = present();
      console.log(`Average ${(end-start)/iters}ms to parse`);
      console.log(`Std-dev ${timings.stdDeviation()}, max ${timings.max()}, min ${timings.min()}`);
      fs.writeFile("timings.txt", String(timings), function(err) {
        if(err) {
          console.log(err);
        }

        console.log("The file was saved!");
      });

      return;
    }
    else {
      program = acorn.parse_dammit(data, {'locations': true});
    }

    // Clone and extend the default walker
    myWalker = {};
    for (var key in walk.base) {
      myWalker[key] = walk.base[key];
    }
    myWalker.ExportDefaultDeclaration = (node, st, c) => {
      show(node, st);
      st.depth += 1;
      walk.base.ExportDefaultDeclaration(node, st, c);
      st.depth -= 1;
    };
    myWalker.Function = (node, st, c) => {
      // Prevent 'double-counting' of method defs as function defs
      if (st.method) {
        st.method = false;
        walk.base.Function(node, st, c);
      }
      else {
        show(node, st);
        st.depth += 1;
        walk.base.Function(node, st, c);
        st.depth -= 1;
      }
    };
    myWalker.Class = (node, st, c) => {
      show(node, st);
      st.depth += 1;
      walk.base.Class(node, st, c);
      st.depth -= 1;
    };
    myWalker.ObjectExpression = (node, st, c) => {
      show(node, st);
      st.depth += 1;
      walk.base.ObjectExpression(node, st, c);
      st.depth -= 1;
    };
    myWalker.MethodDefinition = (node, st, c) => {
      show(node, st);
      st.depth += 1;
      st.method = true;
      walk.base.MethodDefinition(node, st, c);
      st.method = false;
      st.depth -= 1;
    };
    myWalker.ForStatement = (node, st, c) => {
      show(node, st);
      st.depth += 1;
      walk.base.ForStatement(node, st, c);
      st.depth -= 1;
    };
    myWalker.WhileStatement = (node, st, c) => {
      show(node, st);
      st.depth += 1;
      walk.base.WhileStatement(node, st, c);
      st.depth -= 1;
    };
    myWalker.DoWhileStatement = (node, st, c) => {
      show(node, st);
      st.depth += 1;
      walk.base.DoWhileStatement(node, st, c);
      st.depth -= 1;
    };
    myWalker.ForOfStatement = (node, st, c) => {
      show(node, st);
      st.depth += 1;
      walk.base.ForOfStatement(node, st, c);
      st.depth -= 1;
    };
    myWalker.ForInStatement = (node, st, c) => {
      show(node, st);
      st.depth += 1;
      walk.base.ForInStatement(node, st, c);
      st.depth -= 1;
    };
    myWalker.SwitchStatement = (node, st, c) => {
      show(node, st);
      st.depth += 1;
      walk.base.SwitchStatement(node, st, c);
      st.depth -= 1;
    };
    myWalker.WithStatement = (node, st, c) => {
      show(node, st);
      st.depth += 1;
      walk.base.WithStatement(node, st, c);
      st.depth -= 1;
    };
    myWalker.LabeledStatement = (node, st, c) => {
      show(node, st);
      st.depth += 1;
      walk.base.LabeledStatement(node, st, c);
      st.depth -= 1;
    };
    myWalker.TryStatement = (node, st, c) => {
      show(node, st);
      st.depth += 1;
      walk.base.TryStatement(node, st, c);
      st.depth -= 1;
    };
    myWalker.ArrayExpression = (node, st, c) => {
      show(node, st);
      st.depth += 1;
      walk.base.ArrayExpression(node, st, c);
      st.depth -= 1;
    };


    walk.simple(program, {}, myWalker, {
      'depth': 0,
      'method': false,
    });
  } else {
    console.log(err);
  }
});
