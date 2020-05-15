import * as path from 'path'
import TypeMap from './type_map'
import * as Argv from './argv'
import * as ConsoleStyle from './console_style'
import paintType from './paint_type'
import packageObject from './package_object'

/**
 * A type is the type that can be specified as a value for the command line option.
 */
export type ClOptsValue = string | number | boolean | string[] | { [key: string]: string }

/**
 * An object is an option for defining options.
 */
export interface ClOptsObject {
  /**
   * A value that represents the initial value of the option.
   * It can be a string, number, boolean, array<string>, or object<string>.
   */
  value: ClOptsValue

  /**
  * A string representing the short form of the command line option.
  */
  short?: string | null

  /**
   * A Boolean value indicating that an optional setting should be made.
   */
  required?: boolean

  /**
   * A number that represents the order of values that this option takes from the command line.
   * If a required option is not set, it will automatically be set as a required option.
   */
  entry?: number

  /**
   * A string that describes the command line option.
   */
  description?: string
}

/**
 * An object specifies characteristics about the options.
 */
export interface ClOptsObjectMap {
  [key: string]: string | Partial<ClOptsObject>
}

/**
 * An options object specifies characteristics about the clOpts.
 */
export interface ClOptsOptions {
  /**
   * A string indicating that the command is displayed as the calling method when displaying the usage.
   */
  command: string

  /**
   * A Boolean value that indicates whether to show the type when showing the option.
   */
  showType: boolean
  /**
   * A Boolean value that indicates whether to show the default value when showing the option.
   */
  showDefault: boolean

  /**
   * An object that outputs the log.
   */
  logger: {
    log (...label: any[]): void
    warn (...label: any[]): void
    error (...label: any[]): void
    group (...label: any[]): void
    groupEnd (): void
  }
}

/**
 * An options object specifies the characteristics of how to get the value.
 */
export interface ClOptsGetOptions {
  /**
   * A Boolean value indicating that the config file should be referenced when getting the value.
   */
  file?: boolean

  /**
   * A Boolean value indicating that the command line should be referenced when getting the value.
   */
  command?: boolean
}

export class ClOpts<T extends ClOptsObjectMap, K extends Extract<keyof T, string> | 'help' | 'version'> {
  private readonly _typeMap = new TypeMap<ClOptsValue>()
  private readonly _setArgvOptionsMap: Map<string, ClOptsObject> = new Map()
  private readonly _clOptsOptions: ClOptsOptions
  private _entries: string[] = []
  private _needsShowHelp = true
  private _needsShowVersion = true

  /**
   * An object of settings obtained from the default options.
   */
  readonly options: { [key: string]: ClOptsValue } = {}

  /**
   * An object of settings obtained from the command line.
   */
  readonly commandOptions: { [key: string]: ClOptsValue } = {}

  /**
   * An object of settings obtained from the file options.
   */
  readonly fileOptions: { [key: string]: ClOptsValue } = {}

  /**
   * ClOpts is a class that sets options at run time.
   * Options can be entered from the command line or from a configuration file.
   * @param map An object specifies characteristics about the options.
   * @param options An options object specifies characteristics about the clOpts.
   */
  constructor (map: T, options: Partial<ClOptsOptions> = {}) {
    this._clOptsOptions = {
      command: options.command || path.basename(Argv.command, path.extname(Argv.command)),
      showType: typeof options.showType === 'boolean' ? options.showType : true,
      showDefault: typeof options.showDefault === 'boolean' ? options.showDefault : true,
      logger: options.logger || console
    }

    const optionMap = this._addDefaultOptions(map)

    const optionsEntries = Object.entries(optionMap).sort(([a], [b]) => {
      if (a < b) { return -1 }
      if (a > b) { return 1 }
      return 0
    })

    for (const [name, options] of optionsEntries) {
      const addOptions = this._castOptions(options)

      if (addOptions.entry !== undefined) {
        if (this._entries[addOptions.entry]) {
          throw Error(`The Entry number '${addOptions.entry}' has already been created.`)
        }
        this._entries[addOptions.entry - 1] = name
      }

      this.options[name] = addOptions.value

      this._setArgvOptionsMap.set(name, addOptions)
    }

    this._init()
  }

  private _addDefaultOptions<U extends ClOptsObjectMap> (map: U) {
    return {
      help: {
        short: 'h',
        description: 'Print this message.'
      },
      version: {
        short: 'v',
        description: 'Print the project version.'
      },
      ...map
    }
  }

  private _castOptions (options: string | Partial<ClOptsObject>) {
    options = typeof options === 'string' ? { description: options } : { ...options }

    if (options.value === undefined) {
      options.value = false
    }

    if (options.entry !== undefined && options.required === undefined) {
      options.required = true
    }

    return options as ClOptsObject
  }

  private _init () {
    this._addTypes()
    this._updateShort()

    try {
      this._setEntries()
      this._setArgv()
      this._commandRunIfNeeded()
      this._checkRequired()
    } catch (error) {
      this._clOptsOptions.logger.error(`${ConsoleStyle.red}${error}${ConsoleStyle.reset}`)
      process.exit(-1)
    }
  }

  private _addTypes () {
    this._typeMap.add('string', (arg) => arg)
    this._typeMap.add('number', (arg) => {
      const number = Number(arg)
      if (Number.isNaN(number)) { throw Error(`Cannot cast '${arg}' to number type.`) }
      return number
    })
    this._typeMap.add('boolean', (arg, initialValue) => {
      if (arg === null) { return !initialValue }
      if (/^true$/i.test(arg)) { return true }
      if (/^false$/i.test(arg)) { return false }
      throw Error(`Cannot cast '${arg}' to boolean type.`)
    }, { empty: true })
    this._typeMap.add('string[]', (args) => args, { array: true })
    this._typeMap.add('object', (args) => args.reduce((obj, arg) => {
      const parse = arg.split(':')
      const key = parse.shift()
      if (!key) { throw Error(`Cannot cast '${arg}' to json type.`) }
      const value = parse.join(':')
      obj[key] = value
      return obj
    }, {} as { [key: string]: string }), { array: true })
  }

  private _setEntries () {
    const names = this._entries
    const entries = Argv.entries
    if (names.length < entries.length) {
      const overEntries = entries.slice(names.length)
      throw Error(`The '${overEntries.join(', ')}' arguments is exceeded. Argv has too many arguments.`)
    }

    let index = 0
    for (const name of names) {
      if (!name) { continue }
      const args = entries[index]
      if (!args) { continue }

      const options = this.getOptions(name as K)
      const type = Array.isArray(options.value) ? 'array' : typeof options.value
      this.commandOptions[name] = this._typeMap.cast(type, [args], options.value)
      index++
    }
  }

  private _setArgv () {
    const unknownOptions: string[] = []
    for (const [key, optionValue] of Object.entries(Argv.options)) {
      let optionName: string
      try {
        optionName = this.stringToOptionName(key)
      } catch (error) {
        unknownOptions.push(key)
        continue
      }

      const options = this._setArgvOptionsMap.get(optionName)
      if (!options) {
        unknownOptions.push(key)
        continue
      }

      const type = Array.isArray(options.value) ? 'string[]' : typeof options.value
      const value = this._typeMap.cast(type, optionValue, options.value)
      this.commandOptions[optionName] = value
    }

    if (unknownOptions.length > 0) {
      throw Error(`'${unknownOptions.join(', ')}' is an invalid option name.`)
    }
  }

  private _checkRequired () {
    const errorRequired: string[] = []

    for (const [name, { required }] of this._setArgvOptionsMap) {
      if (!required) { continue }
      if (name in this.commandOptions) { continue }

      errorRequired.push(name)
    }

    if (errorRequired.length > 0) {
      throw Error(`'${errorRequired.join(', ')}' must be declared from the command line.`)
    }
  }

  private _updateShort () {
    const optionShorts = [...this._setArgvOptionsMap.values()].map(options => options.short).filter(Boolean) as string[]

    const shorts = [...new Set(optionShorts)]
    if (optionShorts.length !== shorts.length) {
      const duplicateShort = optionShorts.filter(i => !shorts.includes(i))
      throw Error(`Duplicate value ‘${duplicateShort.join(', ')}’ for short option.`)
    }

    const duplicateName = [...this._setArgvOptionsMap.keys()].filter(i => shorts.includes(i))
    if (duplicateName.length > 0) {
      throw Error(`Short option value '${duplicateName.join(', ')}' duplicates option name.`)
    }

    for (const [name, options] of this._setArgvOptionsMap) {
      if (options.short !== undefined) { continue }

      let checkShort: string = ''
      for (const char of name) {
        checkShort += char
        if (checkShort === name) {
          options.short = null
          break
        }

        if (!shorts.includes(checkShort)) {
          options.short = checkShort
          shorts.push(checkShort)
          break
        }
      }
    }
  }

  private _commandRunIfNeeded (options?: ClOptsGetOptions) {
    if (this._needsShowHelp && this.get('help' as K, options)) {
      this._needsShowHelp = false

      this._showConsoleHelp()

      const isArgvHelp = Object.keys(this.commandOptions).includes('help')
      if (isArgvHelp) { process.exit(0) }
    }

    if (this._needsShowVersion && this.get('version' as K, options)) {
      this._needsShowVersion = false

      this.showVersion()

      const isArgvVersion = Object.keys(this.commandOptions).includes('version')
      if (isArgvVersion) { process.exit(0) }
    }
  }

  private _showConsoleHelp () {
    const commandKeys = Object.keys(this.commandOptions)
    const showOptionNames = new Set(commandKeys.filter(key => key !== 'help'))

    for (const keywords of Object.values(Argv.options)) {
      if (keywords.length < 1) { continue }
      const hits = this.search(...keywords)
      if (hits.length < 1) {
        this._clOptsOptions.logger.warn(`${ConsoleStyle.yellow}Options unknown. The searched keyword is '${keywords.join(' ')}'${ConsoleStyle.reset}`)
      }

      for (const hit of hits) {
        showOptionNames.add(hit)
      }
    }

    try {
      this.showUsage()
      this._clOptsOptions.logger.log()
      this.showOptions(...showOptionNames)
    } catch (error) {
      this._clOptsOptions.logger.log(`${ConsoleStyle.red}${error}${ConsoleStyle.reset}`)
    }
  }

  /**
   * The ClOpts method getOptions() get the options.
   * @param name A string that represents the option name to be acquired.
   */
  getOptions (name: K) {
    const options = this._setArgvOptionsMap.get(name)
    if (!options) { throw Error(`'${name}' is an invalid option name.`) }
    return options
  }

  /**
   * The ClOpts method search() searches for options and returns a list of matching option names.
   * @param keywords Keywords to search.
   */
  search (...keywords: string[]) {
    const result: string[] = []

    for (const [name, options] of this._setArgvOptionsMap) {
      let isHit = true
      for (const keyword of keywords) {
        if (name.indexOf(keyword) > -1) { continue }
        if (options.short && options.short.indexOf(keyword) > -1) { continue }
        if (options.description && options.description.indexOf(keyword) > -1) { continue }

        isHit = false
        break
      }

      if (isHit) { result.push(name) }
    }

    return result
  }

  /**
   * The ClOpts method get() get the options value.
   * @param name A string that represents the option name to be acquired.
   * @param options Specifies the characteristics of how to get the value.
   */
  get (name: K, options: boolean | ClOptsGetOptions = true) {
    if (typeof options === 'boolean') {
      options = { file: options, command: options }
    }

    let value: ClOptsValue = this.getOptions(name).value
    if (options.file) {
      try {
        const fileOptions = this.fileOptions
        const fileValue = fileOptions[name]
        if (fileValue !== undefined) { value = fileValue }
      } catch (error) {
        this._clOptsOptions.logger.error(`${ConsoleStyle.red}${error}${ConsoleStyle.reset}`)
        process.exit(-1)
      }
    }

    if (options.command) {
      const commandOptions = this.commandOptions
      const commandValue = commandOptions[name]
      if (commandValue !== undefined) { value = commandValue }
    }

    return value
  }

  /**
   * The ClOpts method getAll() gets all the options.
   * @param options Specifies the characteristics of how to get the value.
   */
  getAll (options: boolean | ClOptsGetOptions = true) {
    const result = {} as { [U in K]: ClOptsValue }

    for (const name of this._setArgvOptionsMap.keys() as IterableIterator<K>) {
      result[name] = this.get(name, options)
    }

    return result as {
      [U in K]: U extends 'help'
      ? boolean
      : U extends 'version'
      ? boolean
      : T[U] extends ClOptsObject
      ? T[U]['value']
      : boolean
    }
  }

  /**
   * The ClOpts method stringToOptionName() converts a string into an option name.
   * The string to convert is an option name with a short handler and a hyphen.
   * @param key List of configuration files to add.
   */
  stringToOptionName (key: string): K {
    if (/^-[^-]/.test(key)) {
      const short = key.slice(1)
      for (const [optionNames, options] of this._setArgvOptionsMap) {
        if (options.short === short) { return optionNames as K }
      }
    } else {
      const resultName = key.replace(/^--/, '')
      if (this._setArgvOptionsMap.has(resultName)) {
        return resultName as K
      }
    }

    throw Error(`Unknown command options '${key}'.`)
  }

  /**
   * The ClOpts method setConfigFile() adds a configuration file to read.
   * @param files List of configuration files to add.
   */
  setConfigFile (...files: [string, ...string[]]) {
    for (const file of files) {
      try {
        const filePath = path.join(process.cwd(), file)
        const options = require(filePath)
        for (const key of Object.keys(options)) {
          if ([...this._setArgvOptionsMap.keys()].includes(key)) { continue }
          throw Error(`The ’${file}’ option in the '${key}' file is an invalid option name.`)
        }

        Object.assign(this.fileOptions, options)
      } catch (error) {
        if (error.code === 'MODULE_NOT_FOUND') { continue }
        throw error
      }
    }

    this._commandRunIfNeeded({ file: true })

    return this
  }

  /**
   * The ClOpts method showVersion() displays the package version in the console.
   * The version is automatically obtained from package.json.
   */
  showVersion () {
    if (packageObject.version) {
      this._clOptsOptions.logger.log('version:', paintType(packageObject.version))
    } else {
      this._clOptsOptions.logger.log('version is undefined.')
    }

    return this
  }

  /**
   * The ClOpts method showUsage() shows how to declare it on the command line in the console.
   */
  showUsage () {
    this._clOptsOptions.logger.group('Usage:')

    const messages = [this._clOptsOptions.command]
    if (this._entries.length > 0) {
      const entries = this._entries.map(name => `[${name}]`)
      messages.push(`${ConsoleStyle.green}${entries.join(' ')}${ConsoleStyle.reset}`)
    }
    messages.push(`${ConsoleStyle.blue}<options>${ConsoleStyle.reset}`)

    const message = messages.join(' ')
    this._clOptsOptions.logger.log(message)

    this._clOptsOptions.logger.groupEnd()

    return this
  }

  /**
   * The ClOpts method showOptions() displays a list of options in the console.
   * @param names List of options to display. If not specified, all options will be displayed.
   */
  showOptions (...names: string[]) {
    this._clOptsOptions.logger.group('Options:')

    const showNames = names = names.length < 1
      ? [...this._setArgvOptionsMap.keys()]
      : names.map(name => this.stringToOptionName(name))

    const helps = showNames.map(name => {
      const options = this.getOptions(name as K)

      return {
        name: `--${name}`,
        short: options.short ? `-${options.short}` : '',
        type: Array.isArray(options.value) ? 'array' : typeof options.value,
        value: options.value,
        required: options.required,
        description: options.description || ''
      }
    })

    const maxNameLength = Math.max(...helps.map(i => i.name.length))
    const maxShortLength = Math.max(...helps.map(i => i.short.length))
    const maxTypeLength = Math.max(...helps.map(i => i.type.length))

    for (const help of helps) {
      const name = `${ConsoleStyle.blue}${help.name.padEnd(maxNameLength)}${ConsoleStyle.reset}`
      const short = `${ConsoleStyle.blue}${help.short.padEnd(maxShortLength)}${ConsoleStyle.reset}`
      let message = `${name} ${short}`

      if (this._clOptsOptions.showType) {
        const type = `${ConsoleStyle.green}${help.type.padEnd(maxTypeLength)}${ConsoleStyle.reset}`
        message += ` ${type}`
      }

      message += ` ${help.description}`

      if (this._clOptsOptions.showDefault && !help.required) {
        const value = `${ConsoleStyle.blue}(default:${ConsoleStyle.reset} ${paintType(help.value)}${ConsoleStyle.blue})${ConsoleStyle.reset}`
        message += ` ${value}`
      }

      this._clOptsOptions.logger.log(message)
    }

    this._clOptsOptions.logger.groupEnd()

    return this
  }
}
