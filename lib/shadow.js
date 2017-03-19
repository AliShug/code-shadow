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
    this.startChar = this.node.start;
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
    this.textElement.style.left = indent + 'px';
    // Set type-specific styles
    if (properties.style !== '') {
      this.lineElement.classList.add(properties.style);
      this.textElement.classList.add(properties.style);
    }
  }

  update(lineHeight, scrollOffset, workingOffset) {
    // Show initially hidden elements
    this.lineElement.style.visibility = 'visible';
    this.textElement.style.visibility = 'visible';
    // Called on scroll and other view changes - update element styles
    let screenStart = this.editor.screenPositionForBufferPosition([this.startLine, 0]);
    let screenEnd = this.editor.screenPositionForBufferPosition([this.endLine, 0]);
    let desiredTop = (screenStart.row - 1) * lineHeight;
    let top = Math.max(desiredTop, workingOffset);
    let height = (screenEnd.row - screenStart.row + 1) * lineHeight;
    this.lineElement.style.top = desiredTop + Math.round(lineHeight/2) + 'px';
    // Text elements stop at top of screen
    let textTop = Math.min(Math.max(top + Math.round(lineHeight/8), scrollOffset), desiredTop + height - lineHeight);
    this.textElement.style.top = textTop + 'px';
    this.lineElement.style.height = height - lineHeight + 'px';

    // New working offset just after text position
    return Math.max(textTop + 0.8*lineHeight, workingOffset);
  }

  destroy() {
    this.lineElement.remove();
    this.textElement.remove();
  }

}
