/**
 * Logger Utility
 *
 * Simple logging utility for consistent log formatting across the API
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface Logger {
    debug: (message: string, ...args: any[]) => void;
    info: (message: string, ...args: any[]) => void;
    warn: (message: string, ...args: any[]) => void;
    error: (message: string, ...args: any[]) => void;
}

const formatMessage = (level: LogLevel, message: string): string => {
    const timestamp = new Date().toISOString();
    return `[${timestamp}] [${level.toUpperCase()}] ${message}`;
};

const logger: Logger = {
    debug: (message: string, ...args: any[]) => {
        if (process.env.NODE_ENV !== 'production') {
            console.debug(formatMessage('debug', message), ...args);
        }
    },

    info: (message: string, ...args: any[]) => {
        console.info(formatMessage('info', message), ...args);
    },

    warn: (message: string, ...args: any[]) => {
        console.warn(formatMessage('warn', message), ...args);
    },

    error: (message: string, ...args: any[]) => {
        console.error(formatMessage('error', message), ...args);
    }
};

export default logger;
