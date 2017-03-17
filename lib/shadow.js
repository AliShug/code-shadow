'use babel';
/* jshint esversion: 6 */

export default class Shadow {

  constructor(properties) {
    this.editor = properties.editor;
    this.parentElement = properties.parentElement;
    this.description = properties.description;
    this.node = properties.node;
    this.startLine = this.node.loc.start.line;
    this.endLine = this.node.loc.end.line;
    this.depth = properties.depth;
    // Create line display element
    this.lineElement = document.createElement('code-shadow');
    this.lineElement.classList.add('line-element');
    this.lineElement.style.visibility = 'hidden';
    this.parentElement.appendChild(this.lineElement);
    // Create text display element
    let textContent = document.createTextNode(this.description);
    this.textElement = document.createElement('code-shadow');
    this.textElement.classList.add('text-element');
    this.lineElement.style.visibility = 'hidden';
    this.textElement.appendChild(textContent);
    this.parentElement.appendChild(this.textElement);
    // Indent
    let indent = this.depth*6;
    this.lineElement.style.left = indent + 'px';
    this.textElement.style.left = indent + 3 + 'px';
  }

  update(lineHeight, scrollOffset) {
    // Show initially hidden elements
    this.lineElement.style.visibility = 'visible';
    this.textElement.style.visibility = 'visible';
    // Called on scroll and other view changes - update element styles
    let screenStart = this.editor.screenPositionForBufferPosition([this.startLine, 0]);
    let screenEnd = this.editor.screenPositionForBufferPosition([this.endLine, 0]);
    let top = (screenStart.row - 1) * lineHeight;
    let height = (screenEnd.row - screenStart.row + 1) * lineHeight;
    this.lineElement.style.top = top + 'px';
    this.textElement.style.top = top + 'px';
    this.lineElement.style.height = height  + 'px';
  }

  destroy() {
    this.lineElement.remove();
    this.textElement.remove();
  }

}
