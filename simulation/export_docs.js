stl = require('./stl.js')

var docs = stl.GetStlDocs()
console.log(JSON.stringify(docs, null, 2))
