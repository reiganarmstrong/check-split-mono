// normalize uris to use the .html suffix
function handler(event) {
  let request = event.request;
  let uri = request.uri;

  if (uri === "/") {
    return request;
  }

  if (uri.includes(".")) {
    return request;
  }

  if (uri.endsWith("/")) {
    uri = uri.slice(0, -1);
  }

  request.uri = uri + ".html";
  return request;
}
