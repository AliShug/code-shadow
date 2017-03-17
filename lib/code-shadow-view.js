'use babel';
/* jshint esversion: 6 */

import {
  CompositeDisposable
} from 'atom';
import Shadow from './shadow.js';

acorn = require('acorn/dist/acorn_loose');
acorn_walk = require('acorn/dist/walk');

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
    for (var shadow of this.shadows) {
      shadow.update(lineHeight, scroll);
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
    acorn_walk.simple(program, {
      "ExportDefaultDeclaration" : (node, state) => {
        this.shadows.push(new Shadow({
          'editor' : this.editor,
          'parentElement' : this.parentElement,
          'node' : node,
          'description' : 'export-default',
          'depth' : state.depth,
        }));
        state.depth += 1;
      },
      "FunctionExpression" : (node, state) => {
        this.shadows.push(new Shadow({
          'editor' : this.editor,
          'parentElement' : this.parentElement,
          'node' : node,
          'description' : 'function',
          'depth' : state.depth,
        }));
        state.depth += 1;
      },
      "ClassDeclaration" : (node, state) => {
        this.shadows.push(new Shadow({
          'editor' : this.editor,
          'parentElement' : this.parentElement,
          'node' : node,
          'description' : 'class',
          'depth' : state.depth,
        }));
        state.depth += 1;
      }
    }, null, {'depth': 0});
    this.updateShadows();
    console.log(this.parentElement);
  }
}
