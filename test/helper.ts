export function html(html: string): Element {
  var body = document.body;
  let div = document.createElement('div');
  div.innerHTML = html;
  body.appendChild(div);
  //if (body.childNodes.length == 1 && body.firstChild instanceof HTMLElement)
  //  return <Element>body.firstChild;
  return div;
}

export function deleteHtml(el: Element) {
  document.body.removeChild(el);
}