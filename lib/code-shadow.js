'use babel';

import CodeShadowView from './code-shadow-view';
import { CompositeDisposable } from 'atom';

export default {

  codeShadowView: null,
  subscriptions: null,

  activate(state) {
    // this.codeShadowView = new CodeShadowView(state.codeShadowViewState);
    // this.modalPanel = atom.workspace.addModalPanel({
    //   item: this.codeShadowView.getElement(),
    //   visible: false
    // });

    // Events subscribed to in atom's system can be easily cleaned up with a CompositeDisposable
    this.subscriptions = new CompositeDisposable();

    // Register command that toggles this view
    this.subscriptions.add(atom.commands.add('atom-workspace', {
      'code-shadow:blop': () => this.blop()
    }));

    console.log("I'm here yay")
  },

  deactivate() {
    this.subscriptions.dispose();
  },

  // serialize() {
  //   return {
  //     codeShadowViewState: this.codeShadowView.serialize()
  //   };
  // },

  blop() {
    let editor
    if (editor = atom.workspace.getActiveTextEditor()) {
      let selection = editor.getSelectedText()
      let reversed = selection.split('').reverse().join('')
      editor.insertText(reversed)
    }
  }

};
