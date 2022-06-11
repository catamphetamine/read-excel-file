`xlsx-xpath.js` is an "alternative" implementation of `./xml/xlsx.js` functions using the [`XPath`](https://www.w3schools.com/xml/xpath_syntax.asp) XML document query language.

`XPath` is no longer used in this project and has been substituted with a simpler set of functions defined in `./xml/dom.js` that're used in `./xml/xlsx.js`.

The reason is that `xpathBrowser.js` turned out to be [not supported](https://github.com/catamphetamine/read-excel-file/issues/26) in Internet Explorer 11, and including a [polyfill](https://www.npmjs.com/package/xpath) for `XPath` (`xpathNode.js`) would increase the bundle size by about 100 kilobytes.