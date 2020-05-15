export type TypeMapFunction<T extends string | string[] | null = string | string[] | null, R = any> = (args: T, initialValue: any) => R
export interface TypeMapAddTypeOptions {
  empty: boolean
  array: boolean
}

class TypeMap<R = any> {
  private readonly _types: Map<string, { func: TypeMapFunction, options: Partial<TypeMapAddTypeOptions> }> = new Map()

  add (name: string, func: TypeMapFunction<string[] | null, R>, options: TypeMapAddTypeOptions): this
  add (name: string, func: TypeMapFunction<string | null, R>, options: { empty: true }): this
  add (name: string, func: TypeMapFunction<string[], R>, options: { array: true }): this
  add (name: string, func: TypeMapFunction<string, R>, options?: Partial<TypeMapAddTypeOptions>): this
  add (name: string, func: TypeMapFunction<any, R>, options: Partial<TypeMapAddTypeOptions> = {}) {
    this._types.set(name, { func, options })
    return this
  }

  cast (name: string, args: string[], defaultValue: any): R {
    const changeTypeMap = this._types.get(name)
    if (!changeTypeMap) { throw Error(`Type '${name}' is undefined.`) }

    let arg: string | string[] | null
    if (args.length > 1) {
      if (changeTypeMap.options.array) {
        arg = args
      } else {
        throw Error(`Multiple arguments '[${args.join(', ')}]' were specified.`)
      }
    } else if (args.length < 1) {
      if (changeTypeMap.options.empty) {
        arg = null
      } else {
        throw Error('Nothing is assigned to the argument to convert.')
      }
    } else {
      arg = args[0]
    }

    return changeTypeMap.func(arg, defaultValue)
  }
}

export default TypeMap
