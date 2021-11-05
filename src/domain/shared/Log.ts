//
//  Log.ts
//
//  Created by Nshan G. on 29 Oct 2021.
//  Copyright 2021 Vircadia contributors.
//
//  Distributed under the Apache License, Version 2.0.
//  See the accompanying file LICENSE or http://www.apache.org/licenses/LICENSE-2.0.html
//


export enum LogLevel {
    DEBUG,
    DEFAULT,
    INFO,
    WARNING,
    ERROR
}

export const allLogLevels = [
    LogLevel.DEBUG,
    LogLevel.DEFAULT,
    LogLevel.INFO,
    LogLevel.WARNING,
    LogLevel.ERROR
] as const;

type LogFunction = (message: string, messageType?: string) => void;

/*@devdoc
 *  The <code>LoggerContext</code> is an interface for configuration of the output of the <code>Logger</code> class.
 *  @interface LoggerContext
 *
 */
export interface LoggerContext {
    getFunction(level: LogLevel): LogFunction | undefined;
}


/*@devdoc
 *  The <code>StringLoggerContext</code> is a logger configuration for logging to the dev console.
 *
 *  @class Logger
 */
export class ConsoleLoggerContext implements LoggerContext {

    static #_typeFirst(func: (fisrs: string, second?: string) => void): LogFunction {
        return (message: string, messageType?: string) => {
            if (messageType) {
                return func(`[${messageType}]`, message);
            }
            return func(message);
        };
    }

    // it is necessary to capture the console object here, for things like jest's mocks to work,
    // hence the no-op looking lambda wrappers
    static #_functions = new Map<LogLevel, LogFunction>([
        /* eslint-disable @typescript-eslint/no-explicit-any */
        [
            LogLevel.DEFAULT, ConsoleLoggerContext.#_typeFirst((...params: any[]) => {
                return console.log(...params);
            })
        ],
        [
            LogLevel.DEBUG, ConsoleLoggerContext.#_typeFirst((...params: any[]) => {
                return console.debug(...params);
            })
        ],
        [
            LogLevel.INFO, ConsoleLoggerContext.#_typeFirst((...params: any[]) => {
                return console.info(...params);
            })
        ],
        [
            LogLevel.WARNING, ConsoleLoggerContext.#_typeFirst((...params: any[]) => {
                return console.warn(...params);
            })
        ],
        [
            LogLevel.ERROR, ConsoleLoggerContext.#_typeFirst((...params: any[]) => {
                return console.error(...params);
            })
        ]
        /* eslint-enable @typescript-eslint/no-explicit-any */
    ]);

    /* eslint-disable class-methods-use-this */
    getFunction(level: LogLevel): LogFunction | undefined {
        return ConsoleLoggerContext.#_functions.get(level);
    }
    /* eslint-enable class-methods-use-this */
}

/*@devdoc
 *  The <code>StringLoggerContext</code> is a configuration for logging to a string.
 *
 *  @class Logger
 */
export class StringLoggerContext implements LoggerContext {
    buffer = "";
    #_functions = new Map<LogLevel, LogFunction>();

    constructor() {
        for (const level of allLogLevels) {
            this.#_functions.set(level, (message: string, messageType?: string) => {
                if (messageType) {
                    this.buffer += `[${messageType}]`;
                }
                this.buffer += `[${LogLevel[level] as string}] ${message}\n`;
            });
        }
    }

    getFunction(level: LogLevel): LogFunction | undefined {
        return this.#_functions.get(level);
    }

}

/*@devdoc
 *  The <code>Logger</code> class serves as a convenience utility and a centralized configuration point for logging.
 *
 *  @class Logger
 */
export class Logger {
    #_context: LoggerContext;
    #_activeFunctions = new Map<LogLevel, LogFunction>();
    #_typeFilter?: Array<string | undefined>;

    #_messageIds = new Map<string, unknown>();
    #_typedMessageIds = new Map<string, unknown>();
    #_messageFlags = new Map<unknown, boolean>();

    /*@devdoc
     *  Creates a logger instance with a specified context.
     *  @param {context} LoggerContext - The context this instance will use for output,
     *  which can also store any addition state, like an output buffer.
     */
    constructor(context: LoggerContext) {
        this.#_context = context;
        this.filterLevels(() => {
            return true;
        });
    }

    /*@devdoc
     *  Logs a message at an appropriate level, with optional type.
     *  @param {level} LogLevel - the level to log at
     *  @param {message} string - the message to log
     *  @param {messageType} string - optional user defined message type
     */
    level(level: LogLevel, message: string, messageType?: string): void {
        const log = this.#_activeFunctions.get(level);
        if (log && this.#_isTypeAllowed(messageType)) {
            log(message, messageType);
        }
    }

    /*@devdoc
     *  Logs a message at an appropriate level, with optional type, only once.
     *  @param {level} LogLevel - the level to log at
     *  @param {message} string - the message to log
     *  @param {messageType} string - optional user defined message type
     */
    once(level: LogLevel, message: string, messageType?: string): void {
        const idMap = messageType ? this.#_typedMessageIds : this.#_messageIds;

        const key = `${messageType || "undefined"} | ${level} | ${message}`;

        const id = Logger.#_getMessageId(idMap, key);

        if (!this.#_messageFlags.get(id)) {
            this.#_messageFlags.set(id, true);
            this.level(level, message, messageType);
        }
    }

    /*@devdoc
     *  Logs a message at the default level, with optional type.
     *  @param {message} string - the message to log
     *  @param {messageType} string - optional user defined message type
     */
    message(message: string, messageType?: string): void {
        this.level(LogLevel.DEFAULT, message, messageType);
    }

    /*@devdoc
     *  Logs a message at the info level, with optional type.
     *  @param {message} string - the message to log
     *  @param {messageType} string - optional user defined message type
     */
    info(message: string, messageType?: string): void {
        this.level(LogLevel.INFO, message, messageType);
    }

    /*@devdoc
     *  Logs a message at the debug level, with optional type.
     *  @param {message} string - the message to log
     *  @param {messageType} string - optional user defined message type
     */
    debug(message: string, messageType?: string): void {
        this.level(LogLevel.DEBUG, message, messageType);
    }

    /*@devdoc
     *  Logs a message at the warning level, with optional type.
     *  @param {message} string - the message to log
     *  @param {messageType} string - optional user defined message type
     */
    warning(message: string, messageType?: string): void {
        this.level(LogLevel.WARNING, message, messageType);
    }

    /*@devdoc
     *  Logs a message at the error level, with optional type.
     *  @param {message} string - the message to log
     *  @param {messageType} string - optional user defined message type
     */
    error(message: string, messageType?: string): void {
        this.level(LogLevel.ERROR, message, messageType);
    }

    /*@devdoc
     *  Applies a filer to all subsequently logged messages, based on level.
     *  @param {pred} (level: LogLevel) => boolean - the filtering condition
     */
    filterLevels(pred: (level: LogLevel) => boolean): void {
        this.#_activeFunctions = new Map<LogLevel, LogFunction>();
        for (const level of allLogLevels) {
            const func = this.#_context.getFunction(level);
            if (func && pred(level)) {
                this.#_activeFunctions.set(level, func);
            }
        }
    }

    /*@devdoc
     *  Sets a filter for all subsequently logged messages, based on user defined types.
     *  @param {filter} Array<string | undefined> - the collection of types to allow,
     *  presence or presence of undefined value will determine whether to show or hide messages with no type specified.
     */
    setTypeFilter(filter?: Array<string | undefined>): void {
        this.#_typeFilter = filter;
    }

    #_isTypeAllowed(messageType?: string): boolean {
        return !this.#_typeFilter || this.#_typeFilter.includes(messageType);
    }

    static #_getMessageId(idMap: Map<string, unknown>, key: string): unknown {
        if (!idMap.has(key)) {
            const id = {};
            idMap.set(key, id);
            return id;
        }
        return idMap.get(key);
    }

}

/*@devdoc
 *  The <code>Log</code> is the main <code>Logger</code> instance used in the SDK.
 */
const Log = new Logger(new ConsoleLoggerContext());

export default Log;
