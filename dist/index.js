'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

var path = require('path');

class TypeMap {
    constructor() {
        this._types = new Map();
    }
    add(name, func, options = {}) {
        this._types.set(name, { func, options });
        return this;
    }
    cast(name, args, defaultValue) {
        const changeTypeMap = this._types.get(name);
        if (!changeTypeMap) {
            throw Error(`Type '${name}' is undefined.`);
        }
        let arg;
        if (args.length > 1) {
            if (changeTypeMap.options.array) {
                arg = args;
            }
            else {
                throw Error(`Multiple arguments '[${args.join(', ')}]' were specified.`);
            }
        }
        else if (args.length < 1) {
            if (changeTypeMap.options.empty) {
                arg = null;
            }
            else {
                throw Error('Nothing is assigned to the argument to convert.');
            }
        }
        else {
            arg = args[0];
        }
        return changeTypeMap.func(arg, defaultValue);
    }
}

const command = process.argv[1];
const argv = process.argv.slice(2);
const entries = [];
const options = {};
let key;
for (const arg of argv) {
    if (/^-/.test(arg)) {
        key = arg;
        if (!(key in options)) {
            options[key] = [];
        }
        continue;
    }
    if (key === undefined) {
        entries.push(arg);
        continue;
    }
    options[key].push(arg);
}

const reset = '\u001b[0m';
const bold = '\u001b[1m';
const red = '\u001b[31m';
const green = '\u001b[32m';
const yellow = '\u001b[33m';
const blue = '\u001b[34m';
const cyan = '\u001b[36m';
const lightMagenta = '\u001b[95m';

const objectPaintType = (type) => {
    if (type === null) {
        return `${lightMagenta}${bold}null${reset}`;
    }
    if (Array.isArray(type)) {
        return `[${type.map(item => paintType(item)).join(', ')}]`;
    }
    const items = Object.entries(type).map(([key, value]) => `${key}: ${paintType(value)}`);
    if (items.length > 1) {
        items[0] = ` ${items[0]}`;
        items[items.length - 1] = `${items[items.length - 1]} `;
    }
    return `{${items.join(', ')}}`;
};
const paintType = (type) => {
    switch (typeof type) {
        case 'number':
        case 'bigint':
            return `${cyan}${type}${reset}`;
        case 'string':
            return `${green}${type}${reset}`;
        case 'boolean':
            return `${yellow}${type}${reset}`;
        case 'object':
            return objectPaintType(type);
    }
};

const packageObject = {};
try {
    const readPath = path.join(process.cwd(), 'package.json');
    const readPackage = require(readPath);
    Object.assign(packageObject, readPackage);
}
catch (error) { }

class ClOpts {
    /**
     * ClOpts is a class that sets options at run time.
     * Options can be entered from the command line or from a configuration file.
     * @param map An object specifies characteristics about the options.
     * @param options An options object specifies characteristics about the clOpts.
     */
    constructor(map, options = {}) {
        this._typeMap = new TypeMap();
        this._setArgvOptionsMap = new Map();
        this._entries = [];
        this._needsShowHelp = true;
        this._needsShowVersion = true;
        /**
         * An object of settings obtained from the default options.
         */
        this.options = {};
        /**
         * An object of settings obtained from the command line.
         */
        this.commandOptions = {};
        /**
         * An object of settings obtained from the file options.
         */
        this.fileOptions = {};
        this._clOptsOptions = {
            command: options.command || path.basename(command, path.extname(command)),
            showType: typeof options.showType === 'boolean' ? options.showType : true,
            showDefault: typeof options.showDefault === 'boolean' ? options.showDefault : true,
            logger: options.logger || console
        };
        const optionMap = this._addDefaultOptions(map);
        const optionsEntries = Object.entries(optionMap).sort(([a], [b]) => {
            if (a < b) {
                return -1;
            }
            if (a > b) {
                return 1;
            }
            return 0;
        });
        for (const [name, options] of optionsEntries) {
            const addOptions = this._castOptions(options);
            if (addOptions.entry !== undefined) {
                if (this._entries[addOptions.entry]) {
                    throw Error(`The Entry number '${addOptions.entry}' has already been created.`);
                }
                this._entries[addOptions.entry - 1] = name;
            }
            this.options[name] = addOptions.value;
            this._setArgvOptionsMap.set(name, addOptions);
        }
        this._init();
    }
    _addDefaultOptions(map) {
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
        };
    }
    _castOptions(options) {
        options = typeof options === 'string' ? { description: options } : { ...options };
        if (options.value === undefined) {
            options.value = false;
        }
        if (options.entry !== undefined && options.required === undefined) {
            options.required = true;
        }
        return options;
    }
    _init() {
        this._addTypes();
        this._updateShort();
        try {
            this._setEntries();
            this._setArgv();
            this._commandRunIfNeeded();
            this._checkRequired();
        }
        catch (error) {
            this._clOptsOptions.logger.error(`${red}${error}${reset}`);
            process.exit(-1);
        }
    }
    _addTypes() {
        this._typeMap.add('string', (arg) => arg);
        this._typeMap.add('number', (arg) => {
            const number = Number(arg);
            if (Number.isNaN(number)) {
                throw Error(`Cannot cast '${arg}' to number type.`);
            }
            return number;
        });
        this._typeMap.add('boolean', (arg, initialValue) => {
            if (arg === null) {
                return !initialValue;
            }
            if (/^true$/i.test(arg)) {
                return true;
            }
            if (/^false$/i.test(arg)) {
                return false;
            }
            throw Error(`Cannot cast '${arg}' to boolean type.`);
        }, { empty: true });
        this._typeMap.add('string[]', (args) => args, { array: true });
        this._typeMap.add('object', (args) => args.reduce((obj, arg) => {
            const parse = arg.split(':');
            const key = parse.shift();
            if (!key) {
                throw Error(`Cannot cast '${arg}' to json type.`);
            }
            const value = parse.join(':');
            obj[key] = value;
            return obj;
        }, {}), { array: true });
    }
    _setEntries() {
        const names = this._entries;
        const entries$1 = entries;
        if (names.length < entries$1.length) {
            const overEntries = entries$1.slice(names.length);
            throw Error(`The '${overEntries.join(', ')}' arguments is exceeded. Argv has too many arguments.`);
        }
        let index = 0;
        for (const name of names) {
            if (!name) {
                continue;
            }
            const args = entries$1[index];
            if (!args) {
                continue;
            }
            const options = this.getOptions(name);
            const type = Array.isArray(options.value) ? 'array' : typeof options.value;
            this.commandOptions[name] = this._typeMap.cast(type, [args], options.value);
            index++;
        }
    }
    _setArgv() {
        const unknownOptions = [];
        for (const [key, optionValue] of Object.entries(options)) {
            let optionName;
            try {
                optionName = this.stringToOptionName(key);
            }
            catch (error) {
                unknownOptions.push(key);
                continue;
            }
            const options = this._setArgvOptionsMap.get(optionName);
            if (!options) {
                unknownOptions.push(key);
                continue;
            }
            const type = Array.isArray(options.value) ? 'string[]' : typeof options.value;
            const value = this._typeMap.cast(type, optionValue, options.value);
            this.commandOptions[optionName] = value;
        }
        if (unknownOptions.length > 0) {
            throw Error(`'${unknownOptions.join(', ')}' is an invalid option name.`);
        }
    }
    _checkRequired() {
        const errorRequired = [];
        for (const [name, { required }] of this._setArgvOptionsMap) {
            if (!required) {
                continue;
            }
            if (name in this.commandOptions) {
                continue;
            }
            errorRequired.push(name);
        }
        if (errorRequired.length > 0) {
            throw Error(`'${errorRequired.join(', ')}' must be declared from the command line.`);
        }
    }
    _updateShort() {
        const optionShorts = [...this._setArgvOptionsMap.values()].map(options => options.short).filter(Boolean);
        const shorts = [...new Set(optionShorts)];
        if (optionShorts.length !== shorts.length) {
            const duplicateShort = optionShorts.filter(i => !shorts.includes(i));
            throw Error(`Duplicate value ‘${duplicateShort.join(', ')}’ for short option.`);
        }
        const duplicateName = [...this._setArgvOptionsMap.keys()].filter(i => shorts.includes(i));
        if (duplicateName.length > 0) {
            throw Error(`Short option value '${duplicateName.join(', ')}' duplicates option name.`);
        }
        for (const [name, options] of this._setArgvOptionsMap) {
            if (options.short !== undefined) {
                continue;
            }
            let checkShort = '';
            for (const char of name) {
                checkShort += char;
                if (checkShort === name) {
                    options.short = null;
                    break;
                }
                if (!shorts.includes(checkShort)) {
                    options.short = checkShort;
                    shorts.push(checkShort);
                    break;
                }
            }
        }
    }
    _commandRunIfNeeded(options) {
        if (this._needsShowHelp && this.get('help', options)) {
            this._needsShowHelp = false;
            this._showConsoleHelp();
            const isArgvHelp = Object.keys(this.commandOptions).includes('help');
            if (isArgvHelp) {
                process.exit(0);
            }
        }
        if (this._needsShowVersion && this.get('version', options)) {
            this._needsShowVersion = false;
            this.showVersion();
            const isArgvVersion = Object.keys(this.commandOptions).includes('version');
            if (isArgvVersion) {
                process.exit(0);
            }
        }
    }
    _showConsoleHelp() {
        const commandKeys = Object.keys(this.commandOptions);
        const showOptionNames = new Set(commandKeys.filter(key => key !== 'help'));
        for (const keywords of Object.values(options)) {
            if (keywords.length < 1) {
                continue;
            }
            const hits = this.search(...keywords);
            if (hits.length < 1) {
                this._clOptsOptions.logger.warn(`${yellow}Options unknown. The searched keyword is '${keywords.join(' ')}'${reset}`);
            }
            for (const hit of hits) {
                showOptionNames.add(hit);
            }
        }
        try {
            this.showUsage();
            this._clOptsOptions.logger.log();
            this.showOptions(...showOptionNames);
        }
        catch (error) {
            this._clOptsOptions.logger.log(`${red}${error}${reset}`);
        }
    }
    /**
     * The ClOpts method getOptions() get the options.
     * @param name A string that represents the option name to be acquired.
     */
    getOptions(name) {
        const options = this._setArgvOptionsMap.get(name);
        if (!options) {
            throw Error(`'${name}' is an invalid option name.`);
        }
        return options;
    }
    /**
     * The ClOpts method search() searches for options and returns a list of matching option names.
     * @param keywords Keywords to search.
     */
    search(...keywords) {
        const result = [];
        for (const [name, options] of this._setArgvOptionsMap) {
            let isHit = true;
            for (const keyword of keywords) {
                if (name.indexOf(keyword) > -1) {
                    continue;
                }
                if (options.short && options.short.indexOf(keyword) > -1) {
                    continue;
                }
                if (options.description && options.description.indexOf(keyword) > -1) {
                    continue;
                }
                isHit = false;
                break;
            }
            if (isHit) {
                result.push(name);
            }
        }
        return result;
    }
    /**
     * The ClOpts method get() get the options value.
     * @param name A string that represents the option name to be acquired.
     * @param options Specifies the characteristics of how to get the value.
     */
    get(name, options = true) {
        if (typeof options === 'boolean') {
            options = { file: options, command: options };
        }
        let value = this.getOptions(name).value;
        if (options.file) {
            try {
                const fileOptions = this.fileOptions;
                const fileValue = fileOptions[name];
                if (fileValue !== undefined) {
                    value = fileValue;
                }
            }
            catch (error) {
                this._clOptsOptions.logger.error(`${red}${error}${reset}`);
                process.exit(-1);
            }
        }
        if (options.command) {
            const commandOptions = this.commandOptions;
            const commandValue = commandOptions[name];
            if (commandValue !== undefined) {
                value = commandValue;
            }
        }
        return value;
    }
    /**
     * The ClOpts method getAll() gets all the options.
     * @param options Specifies the characteristics of how to get the value.
     */
    getAll(options = true) {
        const result = {};
        for (const name of this._setArgvOptionsMap.keys()) {
            result[name] = this.get(name, options);
        }
        return result;
    }
    /**
     * The ClOpts method stringToOptionName() converts a string into an option name.
     * The string to convert is an option name with a short handler and a hyphen.
     * @param key List of configuration files to add.
     */
    stringToOptionName(key) {
        if (/^-[^-]/.test(key)) {
            const short = key.slice(1);
            for (const [optionNames, options] of this._setArgvOptionsMap) {
                if (options.short === short) {
                    return optionNames;
                }
            }
        }
        else {
            const resultName = key.replace(/^--/, '');
            if (this._setArgvOptionsMap.has(resultName)) {
                return resultName;
            }
        }
        throw Error(`Unknown command options '${key}'.`);
    }
    /**
     * The ClOpts method setConfigFile() adds a configuration file to read.
     * @param files List of configuration files to add.
     */
    setConfigFile(...files) {
        for (const file of files) {
            try {
                const filePath = path.join(process.cwd(), file);
                const options = require(filePath);
                for (const key of Object.keys(options)) {
                    if ([...this._setArgvOptionsMap.keys()].includes(key)) {
                        continue;
                    }
                    throw Error(`The ’${file}’ option in the '${key}' file is an invalid option name.`);
                }
                Object.assign(this.fileOptions, options);
            }
            catch (error) {
                if (error.code === 'MODULE_NOT_FOUND') {
                    continue;
                }
                throw error;
            }
        }
        this._commandRunIfNeeded({ file: true });
        return this;
    }
    /**
     * The ClOpts method showVersion() displays the package version in the console.
     * The version is automatically obtained from package.json.
     */
    showVersion() {
        if (packageObject.version) {
            this._clOptsOptions.logger.log('version:', paintType(packageObject.version));
        }
        else {
            this._clOptsOptions.logger.log('version is undefined.');
        }
        return this;
    }
    /**
     * The ClOpts method showUsage() shows how to declare it on the command line in the console.
     */
    showUsage() {
        this._clOptsOptions.logger.group('Usage:');
        const messages = [this._clOptsOptions.command];
        if (this._entries.length > 0) {
            const entries = this._entries.map(name => `[${name}]`);
            messages.push(`${green}${entries.join(' ')}${reset}`);
        }
        messages.push(`${blue}<options>${reset}`);
        const message = messages.join(' ');
        this._clOptsOptions.logger.log(message);
        this._clOptsOptions.logger.groupEnd();
        return this;
    }
    /**
     * The ClOpts method showOptions() displays a list of options in the console.
     * @param names List of options to display. If not specified, all options will be displayed.
     */
    showOptions(...names) {
        this._clOptsOptions.logger.group('Options:');
        const showNames = names = names.length < 1
            ? [...this._setArgvOptionsMap.keys()]
            : names.map(name => this.stringToOptionName(name));
        const helps = showNames.map(name => {
            const options = this.getOptions(name);
            return {
                name: `--${name}`,
                short: options.short ? `-${options.short}` : '',
                type: Array.isArray(options.value) ? 'array' : typeof options.value,
                value: options.value,
                required: options.required,
                description: options.description || ''
            };
        });
        const maxNameLength = Math.max(...helps.map(i => i.name.length));
        const maxShortLength = Math.max(...helps.map(i => i.short.length));
        const maxTypeLength = Math.max(...helps.map(i => i.type.length));
        for (const help of helps) {
            const name = `${blue}${help.name.padEnd(maxNameLength)}${reset}`;
            const short = `${blue}${help.short.padEnd(maxShortLength)}${reset}`;
            let message = `${name} ${short}`;
            if (this._clOptsOptions.showType) {
                const type = `${green}${help.type.padEnd(maxTypeLength)}${reset}`;
                message += ` ${type}`;
            }
            message += ` ${help.description}`;
            if (this._clOptsOptions.showDefault && !help.required) {
                const value = `${blue}(default:${reset} ${paintType(help.value)}${blue})${reset}`;
                message += ` ${value}`;
            }
            this._clOptsOptions.logger.log(message);
        }
        this._clOptsOptions.logger.groupEnd();
        return this;
    }
}

exports.ClOpts = ClOpts;
//# sourceMappingURL=index.js.map
