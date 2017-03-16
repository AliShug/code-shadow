'use babel';
/* jshint esversion: 6 */

import CodeShadowView from './code-shadow-view';
import {
  CompositeDisposable
} from 'atom';

export default {

  subscriptions: null,

  activate(state) {
    console.log(acorn);
    // Events subscribed to in atom's system can be easily cleaned up with a CompositeDisposable
    this.subscriptions = new CompositeDisposable();
    this.views = [];

    this.subscriptions.add(atom.workspace.observeTextEditors((editor) => {
      this.views.push(new CodeShadowView(editor));
    }));
  },

  deactivate() {
    this.subscriptions.dispose();
    for (var view of this.views) {
      view.destroy();
    }
  },

  // serialize() {
  //   return {
  //     codeShadowViewState: this.codeShadowView.serialize()
  //   };
  // },

};
