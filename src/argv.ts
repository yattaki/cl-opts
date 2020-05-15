const command = process.argv[1]
const argv = process.argv.slice(2)

const entries: string[] = []
const options: { [key: string]: string[] } = {}

let key
for (const arg of argv) {
  if (/^-/.test(arg)) {
    key = arg
    if (!(key in options)) { options[key] = [] }
    continue
  }

  if (key === undefined) {
    entries.push(arg)
    continue
  }

  options[key].push(arg)
}

export { command, entries, options }
