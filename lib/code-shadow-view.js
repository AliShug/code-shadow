'use babel';
/* jshint esversion: 6 */

import {
  CompositeDisposable
} from 'atom';
import Shadow from './shadow.js';

acorn = require('acorn/dist/acorn_loose');
walk = require('acorn/dist/walk');

// Clone and extend the default Acorn walker
myWalker = {};
for (var key in walk.base) {
  myWalker[key] = walk.base[key];
}
myWalker.ExportNamedDeclaration = myWalker.ExportDefaultDeclaration = (node, st, c) => {
  st.depth += 1;
  walk.base.ExportDefaultDeclaration(node, st, c);
  st.depth -= 1;
};
myWalker.FunctionExpression = (node, st, c) => {
  if (st.method) {
    walk.base.FunctionExpression(node, st, c);
    // st.method = false;
  }
  else {
    st.depth += 1;
    walk.base.FunctionExpression(node, st, c);
    st.depth -= 1;
  }
};
myWalker.FunctionDeclaration = (node, st, c) => {
  st.depth += 1;
  walk.base.FunctionDeclaration(node, st, c);
  st.depth -= 1;
};
myWalker.MethodDefinition = (node, st, c) => {
  st.method = true;
  st.depth += 1;
  walk.base.MethodDefinition(node, st, c);
  st.depth -= 1;
  st.method = false;
};
myWalker.Class = (node, st, c) => {
  st.depth += 1;
  walk.base.Class(node, st, c);
  st.depth -= 1;
};
//myWalker.IfStatement = (node, st, c) => {
//  st.depth += 1;
//  walk.base.IfStatement(node, st, c);
//  st.depth -= 1;
//};
//myWalker.ForStatement = (node, st, c) => {
//  st.depth += 1;
//  walk.base.ForStatement(node, st, c);
//  st.depth -= 1;
//};
//myWalker.WhileStatement = (node, st, c) => {
//  st.depth += 1;
//  walk.base.WhileStatement(node, st, c);
//  st.depth -= 1;
//};
//myWalker.DoWhileStatement = (node, st, c) => {
//  st.depth += 1;
//  walk.base.DoWhileStatement(node, st, c);
//  st.depth -= 1;
//};


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
    }
    else {
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
    let program = acorn.parse_dammit(this.editor.getText(), {'locations':true});

    // Walk the AST to gather block nodes of interest
    // Custom walker provides depth tracking
    walk.simple(program, {
      "ExportDefaultDeclaration" : (node, state) => {
        this.shadows.push(new Shadow({
          'editor' : this.editor,
          'parentElement' : this.parentElement,
          'node' : node,
          'description' : 'export-default',
          'depth' : state.depth,
          'style' : 'keyword',
        }));
      },
      "FunctionExpression" : (node, state) => {
        if (!state.method) {
          this.shadows.push(new Shadow({
            'editor' : this.editor,
            'parentElement' : this.parentElement,
            'node' : node,
            'description' : 'function',
            'depth' : state.depth,
            'style' : 'function',
          }));
        }
      },
      "FunctionDeclaration" : (node, state) => {
        this.shadows.push(new Shadow({
          'editor' : this.editor,
          'parentElement' : this.parentElement,
          'node' : node,
          'description' : node.id.name + '()',
          'depth' : state.depth,
          'style' : 'function',
        }));
      },
      "MethodDefinition" : (node, state) => {
        this.shadows.push(new Shadow({
          'editor' : this.editor,
          'parentElement' : this.parentElement,
          'node' : node,
          'description' : this.formatMethodName(node),
          'depth' : state.depth,
          'style' : 'function',
        }));
        state.method = true;
      },
      "Class" : (node, state) => {
        this.shadows.push(new Shadow({
          'editor' : this.editor,
          'parentElement' : this.parentElement,
          'node' : node,
          'description' : node.id.name,
          'depth' : state.depth,
          'style' : 'class',
        }));
      },
//      "IfStatement" : (node, state) => {
//        this.shadows.push(new Shadow({
//          'editor' : this.editor,
//          'parentElement' : this.parentElement,
//          'node' : node,
//          'description' : this.formatIfStatement(node),
//          'depth' : state.depth,
//          'style' : 'keyword',
//        }));
//      },
//      "ForStatement" : (node, state) => {
//        this.shadows.push(new Shadow({
//          'editor' : this.editor,
//          'parentElement' : this.parentElement,
//          'node' : node,
//          'description' : this.formatForStatement(node),
//          'depth' : state.depth,
//          'style' : 'keyword',
//        }));
//      },
//      "WhileStatement" : (node, state) => {
//        this.shadows.push(new Shadow({
//          'editor' : this.editor,
//          'parentElement' : this.parentElement,
//          'node' : node,
//          'description' : this.formatWhileStatement(node),
//          'depth' : state.depth,
//          'style' : 'keyword',
//        }));
//      },
//      "DoWhileStatement" : (node, state) => {
//        this.shadows.push(new Shadow({
//          'editor' : this.editor,
//          'parentElement' : this.parentElement,
//          'node' : node,
//          'description' : this.formatDoWhileStatement(node),
//          'depth' : state.depth,
//          'style' : 'keyword',
//        }));
//      }
    }, myWalker, {
      'depth': 0,
      'method': false,
    });

    // Sort shadows on start line
    this.shadows.sort((a,b) => {
      return a.startChar - b.startChar;
    });

    this.updateShadows();
    console.log(program);
    console.log(this.shadows);
  }

  formatMethodName(node) {
    if (node.kind === 'method') {
      return node.key.name + '()';
    }
    else {
      return node.kind + '()';
    }
  }

  // formatIfStatement(node) {
  //   return 'if ' + node.test.raw;
  // }
  //
  // formatForStatement(node) {
  //   if (node.test === null) {
  //     return 'for;';
  //   }
  //   else {
  //     return 'for ' + node.test.raw;
  //   }
  // }
  //
  // formatWhileStatement(node) {
  //   return 'while' + node.test.raw;
  // }
  //
  // formatDoWhileStatement(node) {
  //   return 'do while ' + node.test.raw;
  // }
}
