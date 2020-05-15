/**
 * A type is the type that can be specified as a value for the command line option.
 */
export declare type ClOptsValue = string | number | boolean | string[] | {
    [key: string]: string;
};
/**
 * An object is an option for defining options.
 */
export interface ClOptsObject {
    /**
     * A value that represents the initial value of the option.
     * It can be a string, number, boolean, array<string>, or object<string>.
     */
    value: ClOptsValue;
    /**
    * A string representing the short form of the command line option.
    */
    short?: string | null;
    /**
     * A Boolean value indicating that an optional setting should be made.
     */
    required?: boolean;
    /**
     * A number that represents the order of values that this option takes from the command line.
     * If a required option is not set, it will automatically be set as a required option.
     */
    entry?: number;
    /**
     * A string that describes the command line option.
     */
    description?: string;
}
/**
 * An object specifies characteristics about the options.
 */
export interface ClOptsObjectMap {
    [key: string]: string | Partial<ClOptsObject>;
}
/**
 * An options object specifies characteristics about the clOpts.
 */
export interface ClOptsOptions {
    /**
     * A string indicating that the command is displayed as the calling method when displaying the usage.
     */
    command: string;
    /**
     * A Boolean value that indicates whether to show the type when showing the option.
     */
    showType: boolean;
    /**
     * A Boolean value that indicates whether to show the default value when showing the option.
     */
    showDefault: boolean;
    /**
     * An object that outputs the log.
     */
    logger: {
        log(...label: any[]): void;
        warn(...label: any[]): void;
        error(...label: any[]): void;
        group(...label: any[]): void;
        groupEnd(): void;
    };
}
/**
 * An options object specifies the characteristics of how to get the value.
 */
export interface ClOptsGetOptions {
    /**
     * A Boolean value indicating that the config file should be referenced when getting the value.
     */
    file?: boolean;
    /**
     * A Boolean value indicating that the command line should be referenced when getting the value.
     */
    command?: boolean;
}
export declare class ClOpts<T extends ClOptsObjectMap, K extends Extract<keyof T, string> | 'help' | 'version'> {
    private readonly _typeMap;
    private readonly _setArgvOptionsMap;
    private readonly _clOptsOptions;
    private _entries;
    private _needsShowHelp;
    private _needsShowVersion;
    /**
     * An object of settings obtained from the default options.
     */
    readonly options: {
        [key: string]: ClOptsValue;
    };
    /**
     * An object of settings obtained from the command line.
     */
    readonly commandOptions: {
        [key: string]: ClOptsValue;
    };
    /**
     * An object of settings obtained from the file options.
     */
    readonly fileOptions: {
        [key: string]: ClOptsValue;
    };
    /**
     * ClOpts is a class that sets options at run time.
     * Options can be entered from the command line or from a configuration file.
     * @param map An object specifies characteristics about the options.
     * @param options An options object specifies characteristics about the clOpts.
     */
    constructor(map: T, options?: Partial<ClOptsOptions>);
    private _addDefaultOptions;
    private _castOptions;
    private _init;
    private _addTypes;
    private _setEntries;
    private _setArgv;
    private _checkRequired;
    private _updateShort;
    private _commandRunIfNeeded;
    private _showConsoleHelp;
    /**
     * The ClOpts method getOptions() get the options.
     * @param name A string that represents the option name to be acquired.
     */
    getOptions(name: K): ClOptsObject;
    /**
     * The ClOpts method search() searches for options and returns a list of matching option names.
     * @param keywords Keywords to search.
     */
    search(...keywords: string[]): string[];
    /**
     * The ClOpts method get() get the options value.
     * @param name A string that represents the option name to be acquired.
     * @param options Specifies the characteristics of how to get the value.
     */
    get(name: K, options?: boolean | ClOptsGetOptions): ClOptsValue;
    /**
     * The ClOpts method getAll() gets all the options.
     * @param options Specifies the characteristics of how to get the value.
     */
    getAll(options?: boolean | ClOptsGetOptions): { [U in K]: U extends "help" ? boolean : U extends "version" ? boolean : T[U] extends ClOptsObject ? T[U]["value"] : boolean; };
    /**
     * The ClOpts method stringToOptionName() converts a string into an option name.
     * The string to convert is an option name with a short handler and a hyphen.
     * @param key List of configuration files to add.
     */
    stringToOptionName(key: string): K;
    /**
     * The ClOpts method setConfigFile() adds a configuration file to read.
     * @param files List of configuration files to add.
     */
    setConfigFile(...files: [string, ...string[]]): this;
    /**
     * The ClOpts method showVersion() displays the package version in the console.
     * The version is automatically obtained from package.json.
     */
    showVersion(): this;
    /**
     * The ClOpts method showUsage() shows how to declare it on the command line in the console.
     */
    showUsage(): this;
    /**
     * The ClOpts method showOptions() displays a list of options in the console.
     * @param names List of options to display. If not specified, all options will be displayed.
     */
    showOptions(...names: string[]): this;
}
