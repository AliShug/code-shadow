'use babel';
/* jshint esversion: 6 */

import {
  CompositeDisposable
} from 'atom';
import Shadow from './shadow.js';

acorn = require('acorn/dist/acorn_loose');
walk = require('acorn/dist/walk');

// Clone and extend the default Acorn walker
var sast = [];

function sastClear() {
  sast = [];
}

function sastPut(node, st) {
  sast.push({
    node: node,
    depth: st.depth,
    method: st.method,
  });
}
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

export default class CodeShadowView {

  constructor(editor) {
    this.subscriptions = new CompositeDisposable();
    this.shadows = [];
    this.editor = editor;
    this.parentElement = null;
    let editorElement = atom.views.getView(editor);
    // Structural changes
    this.subscriptions.add(editor.onDidStopChanging(() => {
      this.shade();
    }));
    // Visual changes
    this.subscriptions.add(editor.onDidChangeCursorPosition(() => {
      this.updateShadows();
    }));
    this.subscriptions.add(atom.config.onDidChange('editor.fontSize', (event) => {
      this.updateShadows();
    }));
    this.subscriptions.add(editorElement.onDidChangeScrollTop(() => {
      this.updateShadows();
    }));
    this.subscriptions.add(editor.displayLayer.onDidChangeSync((event) => {
      this.updateShadows();
    }));
    this.shade();
  }

  // Tear down any state and detach
  destroy() {
    this.clearShadows();
    this.subscriptions.dispose();
  }

  clearShadows() {
    for (var shadow of this.shadows) {
      shadow.destroy();
    }
    if (this.parentElement !== null) {
      this.parentElement.remove();
      this.parentElement = null;
    }
    this.shadows = [];
  }

  updateShadows() {
    let scope = this.editor.getRootScopeDescriptor();
    if (scope.scopes[0] !== 'source.js') {
      //console.log('Wrong scope: ' + scope);
      return;
    }
    // Position scrolling/indent
    let editorElement = atom.views.getView(this.editor);
    let scroll = editorElement.getScrollTop();
    let baseColumn = 0;
    if (this.editor.isSoftWrapped()) {
      baseColumn = this.editor.getSoftWrapColumn() + 2;
    } else {
      baseColumn = 82;
    }
    let gap = editorElement.getDefaultCharacterWidth() * baseColumn;
    if (isNaN(gap) || gap <= 0) {
      return;
    }
    // Parent element
    this.parentElement.style.left = gap + 'px';
    this.parentElement.style.top = -scroll + 'px';
    // Update shadows individually
    let lineHeight = this.editor.getLineHeightInPixels();
    let working_offset = 0;
    for (var shadow of this.shadows) {
      working_offset = shadow.update(lineHeight, scroll, working_offset);
    }
  }

  shade() {
    let scope = this.editor.getRootScopeDescriptor();
    if (scope.scopes[0] !== 'source.js') {
      //console.log('Wrong scope: ' + scope);
      return;
    }
    this.clearShadows();

    // Create parent element
    let editorElement = atom.views.getView(this.editor);
    let scrollView = editorElement.querySelector('.scroll-view');
    this.parentElement = document.createElement('code-shadow-container');
    scrollView.appendChild(this.parentElement);

    // Analyse file
    let text = this.editor.getText();
    let program = acorn.parse_dammit(text, {
      'locations': true
    });

    // Walk the AST to gather block nodes of interest
    // Custom walker provides depth tracking
    sastClear();
    walk.simple(program, {}, myWalker, {
      depth: 0,
      method: false
    });
    // Sort into reverse depth order (lower depths drawn on top)
    sast.sort((a, b) => {
      return b.depth - a.depth;
    });
    for (var point of sast) {
      switch (point.node.type) {
        case "ExportDefaultDeclaration":
          this.shadows.push(new Shadow({
            'editor': this.editor,
            'parentElement': this.parentElement,
            'node': point.node,
            'description': 'export-default',
            'depth': point.depth,
            'style': 'keyword',
          }));
          break;
        case "FunctionExpression":
          if (!point.method) {
            this.shadows.push(new Shadow({
              'editor': this.editor,
              'parentElement': this.parentElement,
              'node': point.node,
              'description': 'function',
              'depth': point.depth,
              'style': 'function',
            }));
          }
          break;
        case "FunctionDeclaration":
          this.shadows.push(new Shadow({
            'editor': this.editor,
            'parentElement': this.parentElement,
            'node': point.node,
            'description': point.node.id.name + '()',
            'depth': point.depth,
            'style': 'function',
          }));
          break;
        case "MethodDefinition":
          this.shadows.push(new Shadow({
            'editor': this.editor,
            'parentElement': this.parentElement,
            'node': point.node,
            'description': this.formatMethodName(point.node),
            'depth': point.depth,
            'style': 'function',
          }));
          point.method = true;
          break;
        case "Class":
          this.shadows.push(new Shadow({
            'editor': this.editor,
            'parentElement': this.parentElement,
            'node': point.node,
            'description': node.id.name,
            'depth': point.depth,
            'style': 'class',
          }));
          break;
        case "IfStatement":
          this.shadows.push(new Shadow({
            'editor': this.editor,
            'parentElement': this.parentElement,
            'node': point.node,
            'description': this.formatIfStatement(point.node, text),
            'depth': point.depth,
            'style': 'keyword',
          }));
          break;
        case "ForStatement":
          this.shadows.push(new Shadow({
            'editor': this.editor,
            'parentElement': this.parentElement,
            'node': point.node,
            'description': this.formatForStatement(point.node, text),
            'depth': point.depth,
            'style': 'keyword',
          }));
          break;
        case "WhileStatement":
          this.shadows.push(new Shadow({
            'editor': this.editor,
            'parentElement': this.parentElement,
            'node': point.node,
            'description': this.formatWhileStatement(point.node, text),
            'depth': point.depth,
            'style': 'keyword',
          }));
          break;
        case "DoWhileStatement":
          this.shadows.push(new Shadow({
            'editor': this.editor,
            'parentElement': this.parentElement,
            'node': point.node,
            'description': this.formatDoWhileStatement(point.node, text),
            'depth': point.depth,
            'style': 'keyword',
          }));
          break;
      }
    }
    // walk.simple(program, {
    //   "ExportDefaultDeclaration" : (node, state) => {
    //     this.shadows.push(new Shadow({
    //       'editor' : this.editor,
    //       'parentElement' : this.parentElement,
    //       'node' : node,
    //       'description' : 'export-default',
    //       'depth' : state.depth,
    //       'style' : 'keyword',
    //     }));
    //   },
    //   "FunctionExpression" : (node, state) => {
    //     if (!state.method) {
    //       this.shadows.push(new Shadow({
    //         'editor' : this.editor,
    //         'parentElement' : this.parentElement,
    //         'node' : node,
    //         'description' : 'function',
    //         'depth' : state.depth,
    //         'style' : 'function',
    //       }));
    //     }
    //   },
    //   "FunctionDeclaration" : (node, state) => {
    //     this.shadows.push(new Shadow({
    //       'editor' : this.editor,
    //       'parentElement' : this.parentElement,
    //       'node' : node,
    //       'description' : node.id.name + '()',
    //       'depth' : state.depth,
    //       'style' : 'function',
    //     }));
    //   },
    //   "MethodDefinition" : (node, state) => {
    //     this.shadows.push(new Shadow({
    //       'editor' : this.editor,
    //       'parentElement' : this.parentElement,
    //       'node' : node,
    //       'description' : this.formatMethodName(node),
    //       'depth' : state.depth,
    //       'style' : 'function',
    //     }));
    //     state.method = true;
    //   },
    //   "Class" : (node, state) => {
    //     this.shadows.push(new Shadow({
    //       'editor' : this.editor,
    //       'parentElement' : this.parentElement,
    //       'node' : node,
    //       'description' : node.id.name,
    //       'depth' : state.depth,
    //       'style' : 'class',
    //     }));
    //   },
    //  "IfStatement" : (node, state) => {
    //    this.shadows.push(new Shadow({
    //      'editor' : this.editor,
    //      'parentElement' : this.parentElement,
    //      'node' : node,
    //      'description' : this.formatIfStatement(node, text),
    //      'depth' : state.depth,
    //      'style' : 'keyword',
    //    }));
    //  },
    //  "ForStatement" : (node, state) => {
    //    this.shadows.push(new Shadow({
    //      'editor' : this.editor,
    //      'parentElement' : this.parentElement,
    //      'node' : node,
    //      'description' : this.formatForStatement(node, text),
    //      'depth' : state.depth,
    //      'style' : 'keyword',
    //    }));
    //  },
    //  "WhileStatement" : (node, state) => {
    //    this.shadows.push(new Shadow({
    //      'editor' : this.editor,
    //      'parentElement' : this.parentElement,
    //      'node' : node,
    //      'description' : this.formatWhileStatement(node, text),
    //      'depth' : state.depth,
    //      'style' : 'keyword',
    //    }));
    //  },
    //  "DoWhileStatement" : (node, state) => {
    //    this.shadows.push(new Shadow({
    //      'editor' : this.editor,
    //      'parentElement' : this.parentElement,
    //      'node' : node,
    //      'description' : this.formatDoWhileStatement(node, text),
    //      'depth' : state.depth,
    //      'style' : 'keyword',
    //    }));
    //  }
    // }, myWalker, {
    //   'depth': 0,
    //   'method': false,
    // });

    // Sort shadows on start line
    this.shadows.sort((a, b) => {
      return a.startChar - b.startChar;
    });

    this.updateShadows();
    console.log(program);
    console.log(this.shadows);
  }

  formatMethodName(node) {
    if (node.kind === 'method') {
      return node.key.name + '()';
    } else {
      return node.kind + '()';
    }
  }

  formatIfStatement(node, text) {
    // if (typeof node.test.raw !== 'undefined')
    //   return 'if ' + node.test.raw;
    // else if (typeof node.test.operator !== 'undefined') {
    //   //....
    // }
    return 'if ' + text.slice(node.test.start, node.test.end);
  }

  formatForStatement(node, text) {
    if (node.test === null) {
      return 'for;';
    } else {
      return 'for ' + text.slice(node.test.start, node.test.end);
    }
  }

  formatWhileStatement(node, text) {
    if (typeof node.test.name === 'undefined') {
      return 'while ' + text.slice(node.test.start, node.test.end);
    } else {
      return 'while ' + node.test.name;
    }
  }

  formatDoWhileStatement(node, text) {
    return 'do ' + this.formatWhileStatement(node, text);
  }
}

var foo = {
  'shoop': 'doopadoop',
  'doopa': 'loop',
};
