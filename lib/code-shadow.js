'use babel';
/* jshint esversion: 6 */

import CodeShadowView from './code-shadow-view';
import {
  CompositeDisposable
} from 'atom';

export default {

  subscriptions: null,

  activate(state) {
    // Events subscribed to in atom's system can be easily cleaned up with a CompositeDisposable
    this.subscriptions = new CompositeDisposable();

    this.subscriptions.add(atom.commands.add('atom-workspace', {
      'code-shadow:blop': () => this.blop()
    }));

    this.subscriptions.add(atom.workspace.observeTextEditors((editor) => {
      this.subscriptions.add(editor.onDidStopChanging(() => {
        this.blop(editor);
      }));
      this.blop(editor);
    }));

    console.log("I'm here yay");
  },

  deactivate() {
    this.subscriptions.dispose();
  },

  // serialize() {
  //   return {
  //     codeShadowViewState: this.codeShadowView.serialize()
  //   };
  // },

  blop(editor) {
    let scope = editor.getRootScopeDescriptor();
    if (scope.scopes[0] !== 'source.js') {
      //console.log('Wrong scope: ' + scope);
      return;
    }

    console.log('blop');
    // Analyse file
    let grammar = editor.getGrammar();
    let tokens = grammar.tokenizeLines(editor.getText());
    let markLines = [];

    // Iterate lines
    for (let i = 0; i < tokens.length; i++) {
      let lineN = i + 1;
      let line = tokens[i];
      let addLine = false;
      let funcName = '';

      // Tokens in line
      for (let t = 0; t < line.length; t++) {
        let token = line[t];
        let funcDef = false;
        // Scopes in token
        for (let s = 0; s < token.scopes.length; s++) {
          let scope = token.scopes[s];
          if (scope.startsWith('meta.function.method.definition')) {
            funcDef = true;
            // console.log(scope);
          } else if (scope.startsWith('entity.name.function')) {
            funcName = token.value;
            // console.log(token);
          }
        }
        if (funcDef) {
          addLine = true;
        }
      }

      if (addLine) {
        markLines.push({
          'line': i,
          'shadows': [{
            'type': 'func',
            'value': funcName
          }]
        });
      }
    }
    // console.log(markLines);
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
      // item.classList.add('popover-list');
      editor.decorateMarker(marker, {
        type: 'overlay',
        position: 'tail',
        item
      });
    }
  }

};
