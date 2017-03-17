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
    this.shade();
  }

  // Tear down any state and detach
  destroy() {
    this.clearMarkers();
    this.subscriptions.dispose();
  }

  getElement() {
    return this.element;
  }

  clearShadows() {
    for (var shadow of this.shadows) {
      shadow.destroy();
    }
    this.shadows = [];
  }

  updateShadows() {
    for (var shadow of this.shadows) {
      // Update positions
      let editorElement = atom.views.getView(this.editor);
      let baseColumn = 0;
      if (this.editor.isSoftWrapped()) {
        baseColumn = this.editor.getSoftWrapColumn() + 2;
      }
      else {
        baseColumn = 82;
      }
      let gap = editorElement.getDefaultCharacterWidth() * baseColumn;
      let scroll = editorElement.getScrollTop();
      shadow.update(gap, this.editor.getLineHeightInPixels(), scroll);
    }
  }

  shade() {
    let scope = this.editor.getRootScopeDescriptor();
    if (scope.scopes[0] !== 'source.js') {
      //console.log('Wrong scope: ' + scope);
      return;
    }
    console.log('throwing shade');

    let editorElement = atom.views.getView(this.editor);
    // Analyse file
    let program = acorn.parse_dammit(this.editor.getText(), {'locations':true});
    this.clearShadows();

    // Walk the AST to gather block nodes of interest
    acorn_walk.simple(program, {
      "ExportDefaultDeclaration" : (node) => {
        this.shadows.push(new Shadow({
          'editor' : this.editor,
          'editorElement' : editorElement,
          'node' : node,
          'description' : 'export-default'
        }));
      },
      "FunctionExpression" : (node) => {
        this.shadows.push(new Shadow({
          'editor' : this.editor,
          'editorElement' : editorElement,
          'node' : node,
          'description' : 'function'
        }));
      },
      "ClassDeclaration" : (node) => {
        this.shadows.push(new Shadow({
          'editor' : this.editor,
          'editorElement' : editorElement,
          'node' : node,
          'description' : 'class'
        }));
      }
    });
    this.updateShadows();
    console.log(program);
  }
}
