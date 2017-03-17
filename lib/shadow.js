'use babel';
/* jshint esversion: 6 */

export default class Shadow {

  constructor(properties) {
    this.editor = properties.editor;
    this.editorElement = properties.editorElement;
    this.description = properties.description;
    this.node = properties.node;

    let scrollView = this.editorElement.querySelector('.scroll-view');
    this.startLine = this.node.loc.start.line;
    this.endLine = this.node.loc.end.line;
    // Create line display element
    this.lineElement = document.createElement('code-shadow');
    this.textContent = document.createTextNode(this.description);
    this.lineElement.appendChild(this.textContent);
    this.lineElement.classList.add('shadow-function');
    this.lineElement.style.visibility = 'hidden';
    scrollView.appendChild(this.lineElement);
  }

  update(left, lineHeight, scrollOffset) {
    if (isNaN(left) || left <= 0) {
      return;
    }
    // Show initially hidden elements
    this.lineElement.style.visibility = 'visible';
    // Called on scroll and other view changes - update element style
    this.lineElement.style.left = '' + Math.round(left) + 'px';
    let scrollTop = (this.startLine - 1) * lineHeight - scrollOffset;
    this.lineElement.style.top = '' + scrollTop + 'px';
    let height = (this.endLine - this.startLine + 1) * lineHeight;
    this.lineElement.style.height = '' + height  + 'px';
  }

  destroy() {
    this.lineElement.remove();
  }

}
