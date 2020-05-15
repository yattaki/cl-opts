// Print help Console.
const { ClOpts } = require('../dist/index.js')

const clOptions = new ClOpts({
  string: {
    value: 'text',
    description: 'This is string type sample.'
  },
  number: {
    value: 0,
    description: 'This is number type sample.'
  },
  boolean: 'This is boolean type sample',
  null: {
    value: null,
    description: 'This is null type sample.'
  },
  array: {
    value: ['string'],
    description: 'This is array type sample.'
  },
  json: {
    value: { string: 'string' },
    description: 'This is json type sample.'
  }
})

const options = clOptions.getAll()
console.log(options)
