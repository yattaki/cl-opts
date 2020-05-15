// command line: node examples/sample02 [message] <options>

const { ClOpts } = require('../dist/index.js')
const http = require('http')

const config = {
  message: {
    value: 'Hello World.',
    required: false,
    entry: 1,
    description: 'Sample run server.'
  },
  port: {
    value: process.env.PORT || 3000,
    description: 'Sample port number.'
  }
}
const clOptions = new ClOpts(config)
  .setConfigFile('examples/sample02.config.json')

const port = clOptions.get('port')
const message = clOptions.get('message')

http.createServer((_, res) => {
  res.statusCode = 200
  res.setHeader('Content-Type', 'text/plain')
  res.end(message)
}).listen(port)

console.log(`Server running. http://localhost:${port}`)
