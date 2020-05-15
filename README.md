# cl-opts

![npm version](https://img.shields.io/npm/v/cl-opts)
![npm bundle size](https://img.shields.io/bundlephobia/min/cl-opts)
![npm license](https://img.shields.io/npm/l/cl-opts)
![npm downloads](https://img.shields.io/npm/dt/cl-opts)
![npm type definitions](https://img.shields.io/npm/types/cl-opts)

## Description

The cl-opts is a package that allows you to easily set options.

[View on npm](https://www.npmjs.com/package/cl-opts)

[View on github](https://github.com/yattaki/cl-opts)

![capture](img/capture.gif "capture")

## Feature

- Automatically display colorful usage.
- A short handler will be added automatically.
- Config file can be set.
- Provides the type of typescript.

## Install

npm

```bash
npm i cl-opts
```

## Reference

node

```javascript
const { ClOpts } = require('cl-opts')
```

typescript

```typescript
import { ClOpts } from 'cl-opts'
```

### ClOpts

```typescript
new ClOpts(map: ClOptsObjectMap, options?: ClOptsOptions)
```

ClOpts is a class that sets options at run time.

Options can be entered from the command line or from a configuration file.

- **map**: [ClOptsObjectMap](###ClOptsObjectMap)

  An object specifies characteristics about the options.

- **options**: [ClOptsOptions](###ClOptsOptions)

  An options object specifies characteristics about the clOpts.

#### getOptions

```typescript
clOpts.getOptions(name: string): ClOptsObject
```

The ClOpts method getOptions() get the options.

- **name**: string

  A string that represents the option name to be acquired.

- **return**: [ClOptsObject](###ClOptsObject)

  An object that represents the obtained option.

#### search

```typescript
clOpts.search(...keywords: string[]): string[]
```

The ClOpts method search() searches for options and returns a list of matching option names.

- **keywords**: string[]

  Keywords to search.

- **return**: string[]

  An array that represents the list of option names that hit the search.

### get

```typescript
clOpts.get(name: string, options?: boolean | ClOptsGetOptions): ClOptsValue
```

The ClOpts method get() get the options value.

- **name**: string

  A string that represents the option name to be acquired.

- **options**: boolean | [ClOptsGetOptions](###ClOptsGetOptions)

  Specifies the characteristics of how to get the value.

- **return**: [ClOptsValue](###ClOptsValue)

  A value that represents the obtained option value.

### getAll

```typescript
getAll(options?: boolean | ClOptsGetOptions): { [key: string]: ClOptsValue }
```

The ClOpts method getAll() gets all the options.

- **options**: boolean | [ClOptsGetOptions](###ClOptsGetOptions)

  Specifies the characteristics of how to get the value.

- **return**: { [key: string]: [ClOptsValue](###ClOptsValue) }

  An object that represents a list of option values ​​that have option names as keys.

### stringToOptionName

```typescript
clOpts.stringToOptionName(key: string): string
```

The ClOpts method stringToOptionName() converts a string into an option name.

The string to convert is an option name with a short handler and a hyphen.

- **key**: string

  List of configuration files to add.

- **return**: string

  A string that represents the converted option name.

### setConfigFile

```typescript
clOpts.setConfigFile(...files: ...string[]): ClOpts
```

The ClOpts method setConfigFile() adds a configuration file to read.

- **files**: string[]

  List of configuration files to add.

- **return**: [ClOpts](###ClOpts)

  Since it returns ClOpts as a return value, it can be described in a method chain.

### showVersion

```typescript
clOpts.showVersion(): ClOpts
```

The ClOpts method showVersion() displays the package version in the console.
The version is automatically obtained from package.json.

- **return**: [ClOpts](###ClOpts)

  Since it returns ClOpts as a return value, it can be described in a method chain.

### showUsage

```typescript
clOpts.showUsage(): ClOpts
```

The ClOpts method showUsage() shows how to declare it on the command line in the console.

- **return**: [ClOpts](###ClOpts)

  Since it returns ClOpts as a return value, it can be described in a method chain.

### showOptions

```typescript
clOpts.showOptions(...names: string[]): ClOpts
```

The ClOpts method showOptions() displays a list of options in the console.

- **names**: string[]

  List of options to display. If not specified, all options will be displayed.

- **return**: [ClOpts](###ClOpts)

  Since it returns ClOpts as a return value, it can be described in a method chain.

### ClOptsValue

```typescript
type ClOptsValue = string | number | boolean | string[] | { [key: string]: string }
```

A type is the type that can be specified as a value for the command line option.

### ClOptsObject

```typescript
interface ClOptsObject {
  value: ClOptsValue
  short?: string | null
  required?: boolean
  entry?: number
  description?: string
}
```

A type is the type that can be specified as a value for the command line option.

- **value**: [ClOptsValue](###ClOptsValue)

  A value that represents the initial value of the option.
  It can be a string, number, boolean, array\<string\>, or object\<string\>.

- **short**?: string | null

  A string representing the short form of the command line option.

- **required**?: boolean

  A Boolean value indicating that an optional setting should be made.

- **entry**?: number

  A number that represents the order of values that this option takes from the command line.
  If a required option is not set, it will automatically be set as a required option.

- **description**?: string

  A string that describes the command line option.

### ClOptsObjectMap

```typescript
interface ClOptsObjectMap {
  [key: string]: string | Partial<ClOptsObject>
}
```

An object specifies characteristics about the options.

### ClOptsOptions

```typescript
interface ClOptsOptions {
  command: string
  showType: boolean
  showDefault: boolean
  logger: {
    log (...label: any[]): void
    warn (...label: any[]): void
    error (...label: any[]): void
    group (...label: any[]): void
    groupEnd (): void
  }
}
```

An options object specifies characteristics about the clOpts.

- **command**: string

  A string indicating that the command is displayed as the calling method when displaying the usage.

- **showType**: boolean

  A Boolean value that indicates whether to show the type when showing the option.

- **showDefault**: boolean

  A Boolean value that indicates whether to show the default value when showing the option.

- **logger**: Object

  An object that outputs the log.

## Release Note

- 2020-05-15 ver1.0.0
  - First release.

## License

[MIT license](https://github.com/yattaki/cl-opts/blob/master/License)
