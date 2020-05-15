import * as ConsoleStyle from './console_style'
import { Json, JsonValue } from './types/json'

const objectPaintType = (type: null | JsonValue[] | Json): string => {
  if (type === null) { return `${ConsoleStyle.lightMagenta}${ConsoleStyle.bold}null${ConsoleStyle.reset}` }

  if (Array.isArray(type)) {
    return `[${type.map(item => paintType(item)).join(', ')}]`
  }

  const items = Object.entries(type).map(([key, value]) => `${key}: ${paintType(value)}`)
  if (items.length > 1) {
    items[0] = ` ${items[0]}`
    items[items.length - 1] = `${items[items.length - 1]} `
  }
  return `{${items.join(', ')}}`
}

const paintType = (type: JsonValue) => {
  switch (typeof type) {
    case 'number':
    case 'bigint':
      return `${ConsoleStyle.cyan}${type}${ConsoleStyle.reset}`

    case 'string':
      return `${ConsoleStyle.green}${type}${ConsoleStyle.reset}`

    case 'boolean':
      return `${ConsoleStyle.yellow}${type}${ConsoleStyle.reset}`

    case 'object':
      return objectPaintType(type)
  }
}

export default paintType
