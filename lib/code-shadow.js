'use babel';
/* jshint esversion: 6 */

import CodeShadowView from './code-shadow-view';
import {
  CompositeDisposable
} from 'atom';

acorn = require('acorn/dist/acorn_loose');
acorn_walk = require('acorn/dist/walk');

export default {

  subscriptions: null,

  activate(state) {
    console.log(acorn);
    // Events subscribed to in atom's system can be easily cleaned up with a CompositeDisposable
    this.subscriptions = new CompositeDisposable();
    this.markers = [];
    this.subscriptions.add(atom.commands.add('atom-workspace', {
      'code-shadow:blop': () => this.blop()
    }));

    this.subscriptions.add(atom.workspace.observeTextEditors((editor) => {
      this.subscriptions.add(editor.onDidStopChanging(() => {
        this.blop(editor);
      }));
      this.subscriptions.add(atom.config.onDidChange('editor.fontSize', (event) => {
        this.blop(editor);
      }));
      this.blop(editor);
    }));
  },

  deactivate() {
    this.subscriptions.dispose();
  },

  // serialize() {
  //   return {
  //     codeShadowViewState: this.codeShadowView.serialize()
  //   };
  // },

  clearMarkers() {
    for (var marker of this.markers) {
      marker.destroy();
    }
    this.markers = [];
  },

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

    // Walk the AST to gather nodes of interest
    acorn_walk.simple(program, {
      "ExportDefaultDeclaration" : (node) => {
        markLines.push({
          'line' : node.loc.start.line,
          'shadows' : [{
            'type' : 'export',
            'value' : 'default',
          }]
        });
      },
      "FunctionExpression" : (node) => {
        markLines.push({
          'line' : node.loc.start.line,
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
      let marker = editor.markBufferPosition([lineDesc.line, 0]);
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
      // item.classList.add('popover-list');
      this.markers.push(editor.decorateMarker(marker, {
        type: 'overlay',
        position: 'tail',
        item
      }));
    }
  }

};
