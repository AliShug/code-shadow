'use babel';
/* jshint esversion: 6 */

import {
  CompositeDisposable
} from 'atom';

acorn = require('acorn/dist/acorn_loose');
acorn_walk = require('acorn/dist/walk');

export default class CodeShadowView {

  constructor(editor) {
    this.subscriptions = new CompositeDisposable();
    this.markers = [];
    this.subscriptions.add(editor.onDidStopChanging(() => {
      this.blop(editor);
    }));
    this.subscriptions.add(atom.config.onDidChange('editor.fontSize', (event) => {
      this.blop(editor);
    }));
    this.blop(editor);
  }

  // Tear down any state and detach
  destroy() {
    this.clearMarkers();
    this.subscriptions.dispose();
  }

  getElement() {
    return this.element;
  }

  clearMarkers() {
    for (var marker of this.markers) {
      marker.element.remove(marker);
    }
    this.markers = [];
  }

  updateMarkers() {
    for (var marker of this.markers) {
      // Update positions
    }
  }

  blop(editor) {
    let scope = editor.getRootScopeDescriptor();
    if (scope.scopes[0] !== 'source.js') {
      //console.log('Wrong scope: ' + scope);
      return;
    }

    let view = atom.views.getView(editor);
    console.log('blop');
    // Analyse file
    let grammar = editor.getGrammar();
    let program = acorn.parse_dammit(editor.getText(), {'locations':true});
    // let tokens = grammar.tokenizeLines(editor.getText());
    let markLines = [];

    // Walk the AST to gather block nodes of interest
    acorn_walk.simple(program, {
      "ExportDefaultDeclaration" : (node) => {
        markLines.push({
          'line' : node.loc.start.line,
          'end' : node.loc.end.line,
          'shadows' : [{
            'type' : 'export',
            'value' : 'default',
          }]
        });
      },
      "FunctionExpression" : (node) => {
        markLines.push({
          'line' : node.loc.start.line,
          'end' : node.loc.end.line,
          'shadows' : [{
            'type' : 'func',
            'value' : '',
          }]
        });
      },
    });

    this.clearMarkers();

    // Mark selected lines
    for (let i = 0; i < markLines.length; i++) {
      let lineDesc = markLines[i];
      // Decorative marker
      let marker = editor.markBufferPosition([lineDesc.line - 1, 0]);
      let item = document.createElement('code-shadow');
      let description = '';
      for (let i = 0; i < lineDesc.shadows.length; i++) {
        let shadow = lineDesc.shadows[i];
        description += shadow.type + ':' + shadow.value;
      }
      let content = document.createTextNode(description);
      item.appendChild(content);
      item.classList.add('shadow-function');
      let baseColumn = editor.getSoftWrapColumn();
      let width = view.getDefaultCharacterWidth() * baseColumn;
      item.style.left = '' + Math.round(width) + 'px';
      item.style.height = '' + (lineDesc.end - lineDesc.line) + 'em';
      item.style.top = '' + lineDesc.line + 'em';
      let scrollView = view.querySelector('.scroll-view');
      scrollView.appendChild(item);
      this.markers.push({
        'desc':lineDesc,
        'element':item
      });
      console.log(this.markers);
    }
  }
}
