export type JsonValue = string | number | boolean | null | JsonValue[] | { [key: string]: JsonValue }

export type Json<V = JsonValue> = { [key: string]: V }
