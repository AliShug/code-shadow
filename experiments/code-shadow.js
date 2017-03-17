'use babel';
/* jshint esversion: 6 */

import CodeShadowView from './code-shadow-view';
import { CompositeDisposable } from 'atom';

export default {

  subscriptions: null,

  activate(state) {
    // Events subscribed to in atom's system can be easily cleaned up with a CompositeDisposable
    this.subscriptions = new CompositeDisposable();

    this.subscriptions.add(atom.commands.add('atom-workspace', {
      'code-shadow:blop': () => this.blop()
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

  blop() {
    console.log("Blopping");
    let editor;
    if (editor = atom.workspace.getActiveTextEditor()) {
      let marker = editor.getLastCursor().marker;
      item = document.createElement('div');
      item.classList.add('overlay-example');
      item.classList.add('popover-list');
      editor.decorateMarker(marker, {type: 'overlay', item});
      console.log(item);
    }
  }

};
