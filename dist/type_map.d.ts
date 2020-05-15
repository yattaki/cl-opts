export declare type TypeMapFunction<T extends string | string[] | null = string | string[] | null, R = any> = (args: T, initialValue: any) => R;
export interface TypeMapAddTypeOptions {
    empty: boolean;
    array: boolean;
}
declare class TypeMap<R = any> {
    private readonly _types;
    add(name: string, func: TypeMapFunction<string[] | null, R>, options: TypeMapAddTypeOptions): this;
    add(name: string, func: TypeMapFunction<string | null, R>, options: {
        empty: true;
    }): this;
    add(name: string, func: TypeMapFunction<string[], R>, options: {
        array: true;
    }): this;
    add(name: string, func: TypeMapFunction<string, R>, options?: Partial<TypeMapAddTypeOptions>): this;
    cast(name: string, args: string[], defaultValue: any): R;
}
export default TypeMap;
