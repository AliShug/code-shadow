'use babel';
/* jshint esversion: 6 */

import {
  CompositeDisposable
} from 'atom';
import Shadow from './shadow.js';
import myWalker from './walker.js';

acorn = require('acorn/dist/acorn_loose');
walk = require('acorn/dist/walk');

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
    state = {depth: 0, method: false, sast: []};
    walk.simple(program, {}, myWalker, state);
    // Sort into reverse depth order (lower depths drawn on top)
    state.sast.sort((a, b) => {
      return b.depth - a.depth;
    });

    for (var point of state.sast) {
      switch (point.node.type) {
        case "ExportDefaultDeclaration":
          this.generateShadow(point,
            ['export', 'default'],
            'keyword');
          break;
        case "FunctionExpression":
          if (!point.method) {
            this.generateShadow(point,
              this.formatFunctionExpression(point.node, text),
              'function');
          }
          break;
        case "ArrowFunctionExpression":
          this.generateShadow(point,
            this.formatArrowFunction(point.node, text),
            'function');
          break;
        case "FunctionDeclaration":
          this.generateShadow(point,
            [point.node.id.name + '()'],
            'function');
          break;
        case "MethodDefinition":
          this.generateShadow(point,
            this.formatMethodName(point.node),
            'function');
          point.method = true;
          break;
        case "ClassDeclaration":
          this.generateShadow(point,
            [point.node.id.name],
            'class');
          break;
        case "IfStatement":
          this.generateShadow(point,
            this.formatIfStatement(point.node, text),
            'keyword');
          break;
        case "ForStatement":
          this.generateShadow(point,
            this.formatForStatement(point.node, text),
            'keyword');
          break;
        case "ForOfStatement":
          this.generateShadow(point,
            this.formatForXXStatement(point.node, text),
            'keyword');
          break;
        case "ForInStatement":
          this.generateShadow(point,
            this.formatForXXStatement(point.node, text),
            'keyword');
          break;
        case "WhileStatement":
          this.generateShadow(point,
            this.formatWhileStatement(point.node, text),
            'keyword');
          break;
        case "DoWhileStatement":
          this.generateShadow(point,
            this.formatDoWhileStatement(point.node, text),
            'keyword');
          break;
        case "ObjectExpression":
          this.generateShadow(point,
            this.formatObjectExpression(point.node, text),
            'class');
          break;
        case "SwitchStatement":
          this.generateShadow(point,
            this.formatSwitchStatement(point.node, text),
            'variable');
          break;
        case "LabeledStatement":
          this.generateShadow(point,
            this.formatLabeledStatement(point.node, text),
            'plain');
          break;
      }
    }

    // Sort shadows on start line
    this.shadows.sort((a, b) => {
      return a.startChar - b.startChar;
    });

    this.updateShadows();
    // console.log(program);
    // console.log(this.shadows);
  }

  generateShadow(point, description, style) {
    let loc = point.node.loc;
    if (loc.end.line - loc.start.line < 2) {
      return;
    }
    this.shadows.push(new Shadow({
      'editor': this.editor,
      'parentElement': this.parentElement,
      'node': point.node,
      'description': description,
      'depth': point.depth,
      'style': style,
    }));
  }

  formatMethodName(node) {
    if (node.kind === 'method') {
      return ['', node.key.name + '()'];
    } else {
      return ['', node.kind + '()'];
    }
  }

  formatFunctionExpression(node, text) {
    if (node.id !== null) {
      return ['', `${node.id.name}()`];
    }
    else {
      // TODO: find a 'reasonable' description
      return ['anon ()'];
    }
  }

  formatIfStatement(node, text) {
    return ['if', text.slice(node.test.start, node.test.end)];
  }

  formatForStatement(node, text) {
    if (node.test === null) {
      return ['for;'];
    } else {
      return ['for', text.slice(node.test.start, node.test.end)];
    }
  }

  formatForXXStatement(node, text) {
    return ['for', text.slice(node.left.start, node.right.end)];
  }

  formatWhileStatement(node, text) {
    if (typeof node.test.name === 'undefined') {
      return ['while ', text.slice(node.test.start, node.test.end)];
    } else {
      return ['while ', node.test.name];
    }
  }

  formatDoWhileStatement(node, text) {
    return ['do while ', this.formatWhileStatement(node, text)[1]];
  }

  formatObjectExpression(node, text) {
    // TODO: better description
    return ['', 'object'];
  }

  formatSwitchStatement(node, text) {
    if (typeof node.discriminant.name === 'undefined') {
      return ['switch', text.slice(node.discriminant.start, node.discriminant.end)];
    }
    else {
      return ['switch', node.discriminant.name];
    }
  }

  formatLabeledStatement(node, text) {
    return [`${node.label.name}:`];
  }

  formatArrowFunction(node, text) {
    return [`() =>`];
  }
}
