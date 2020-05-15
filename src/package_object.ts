import * as path from 'path'
import { Json } from './types/json'

const packageObject: Json = {}

try {
  const readPath = path.join(process.cwd(), 'package.json')
  const readPackage = require(readPath)
  Object.assign(packageObject, readPackage)
} catch (error) { }

export default packageObject
