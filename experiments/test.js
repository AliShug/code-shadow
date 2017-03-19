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
    let editor = atom.workspace.getActiveTextEditor();
    if (editor) {
      let marker = editor.getLastCursor().marker;
      item = document.createElement('div');
      item.classList.add('overlay-example');
      item.classList.add('popover-list');
      editor.decorateMarker(marker, {type: 'overlay', item});
      console.log(item);
    }
  }
};

var someObject = {
  'term' : 264374,
  'anotherTerm' : 'bloop',
  'afunc' : () => {
    plop();
  },
  'bigFunc' : function (foo, bar) {
    dont();
    stop();
    the_rock();

    foo = bar + func(foo);
  }
};

class AClass {
  constructor() {
    this.thingy = {
      'a' : 'a',
      'f' : (doob) => {
        return doob;
      },
      'f2' : function (roop) {
        return roop;
      }
    };

    this.b = {'a' : 1};

    for (var thing in this.thingy) {
      console.log(thing);
    }

    var hello = [
      {
        'a' : 'b',
        'c' : 'd'
      },
      {
        'e' : 'f',
        'g' : ['h', 'j', 'i', 'k']
      }
    ];
  }

  someMethod() {
    var f = function(a) {
      return a;
    };

    f();
  }
}

loop1:
for (i = 0; i < 3; i++) {      //The first for statement is labeled "loop1"
   loop2:
   for (j = 0; j < 3; j++) {   //The second for statement is labeled "loop2"
      if (i === 1 && j === 1) {
         continue loop1;
      }
      console.log('i = ' + i + ', j = ' + j);
   }
}
