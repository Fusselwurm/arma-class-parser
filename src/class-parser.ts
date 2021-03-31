const chars = {
    QUOTE: '"',
    SEMICOLON: ';',
    EQUALS: '=',
    CURLY_OPEN: '{',
    CURLY_CLOSE: '}',
    SQUARE_OPEN: '[',
    SQUARE_CLOSE: ']',
    COMMA: ',',
    MINUS: '-',
    SLASH: '/',
    DOLLAR: '$',
    ASTERISK: '*',
};

export interface Options {
    translations?: {
        [key: string]: string;
    }
}

export const parse = function (raw: string, options?: Options): any {
    let currentPosition: number = 0;
    let current = function (): string {
        return raw[currentPosition] || '';
    };
    let translateString = function(string: string): string {
        if(typeof options.translations === "object") {
            return options.translations.hasOwnProperty(string) ?
                options.translations[string] : string;
        }

        return string;
    };
    let indexOfOrMaxInt = function (str: string, fromPos: number) {
        const pos = this.indexOf(str, fromPos);
        return pos === -1 ? Infinity : pos;
    };
    let parseArray = function (): any[] {
        const result = [];
        assert(current() === chars.CURLY_OPEN);
        next();
        parseWhitespace();
        while (current() !== chars.CURLY_CLOSE) {
            result.push(parseNonArrayPropertyValue());
            parseWhitespace();
            if (current() === chars.COMMA) {
                next();
                parseWhitespace();
            } else {
                break;
            }

        }
        next();
        return result;
    };
    let parseProperty = function (context): any {
        let name = parsePropertyName(),
            value;

        parseWhitespace();

        if (name === 'class') {
            name = parsePropertyName();
            parseWhitespace();
            if (current() === ':') {
                next();
                parseWhitespace();
                parsePropertyName();
                parseWhitespace();
            }
        }
        switch (current()) {
            case chars.SQUARE_OPEN:
                assert(next() === chars.SQUARE_CLOSE);
                next();
                parseWhitespace();
                assert(current() === chars.EQUALS);
                next();
                parseWhitespace();
                value = parseArray();
                break;
            case chars.EQUALS:
                next();
                parseWhitespace();
                value = parseNonArrayPropertyValue();
                break;
            case chars.CURLY_OPEN:
                value = parseClassValue();
                break;
            case chars.SLASH:
                if (next() === chars.SLASH) {
                    currentPosition = raw.indexOf('\n', currentPosition);
                    break;
                }
                throw new Error('unexpected value at post ' + currentPosition);
            case chars.DOLLAR:
                result = parseTranslationString();
                break;
            default:
                throw new Error('unexpected value at pos ' + currentPosition);
        }

        context[name] = value;
        parseWhitespace();
        assert(current() === chars.SEMICOLON);
        next();
    };
    let parseWhitespace = function (): void {
        while (isWhitespace()) {
            next();
        }
    };
    let isWhitespace = function (): boolean {
        return (' \t\r\n'.indexOf(raw[currentPosition]) !== -1) ||
            (raw.charCodeAt(currentPosition) < 32);
    };
    let assert = function(bool: boolean, msg: string = ''): void {
            if (bool) {
                return;
            }
            throw new Error(
                msg + ' at position ' + currentPosition + ', ' +
                'before: ' + JSON.stringify(raw.substr(Math.max(0, currentPosition - 40), 40)) + ', ' +
                'after: ' + JSON.stringify(raw.substr(currentPosition, 40))
            );
        },
        detectComment = function(): void {
            let indexOfLinefeed;
            if (current() === chars.SLASH && raw[currentPosition + 1] === chars.SLASH) {
                indexOfLinefeed = raw.indexOf('\n', currentPosition);
                currentPosition = indexOfLinefeed === -1 ? raw.length : indexOfLinefeed;
            } else if(current() === chars.SLASH && raw[currentPosition + 1] === chars.ASTERISK) {
                const multilineClose = chars.ASTERISK + chars.SLASH;
                indexOfLinefeed = raw.indexOf(multilineClose, currentPosition);
                currentPosition = indexOfLinefeed === -1 ? raw.length : indexOfLinefeed + multilineClose.length;
            }
        },
        next = function(): string {
            currentPosition += 1;
            detectComment();
            return current();
        },
        nextWithoutCommentDetection = function(): string {
            currentPosition += 1;
            return current();
        },
        result = {},
        weHaveADoubleQuote = function(): boolean {
            return (raw.substr(currentPosition, 2).indexOf('""') === 0);
        },
        weHaveAStringLineBreak = function(): boolean {
            return raw.substr(currentPosition, 6).indexOf('" \\n "') === 0;
        },
        forwardToNextQuote = function(): void {
            currentPosition = indexOfOrMaxInt.call(raw, chars.QUOTE, currentPosition + 1);
        },
        parseString = function(): any {
            let result = '';
            assert(current() === chars.QUOTE);
            nextWithoutCommentDetection();
            while (current()) {
                if (weHaveADoubleQuote()) {
                    result += current();
                    nextWithoutCommentDetection();
                } else if (weHaveAStringLineBreak()) {
                    result += '\n';
                    next();
                    forwardToNextQuote();
                } else if (current() === chars.QUOTE) {
                    break;
                } else {
                    result += current();
                }
                nextWithoutCommentDetection();
            }
            assert(current() === chars.QUOTE);
            nextWithoutCommentDetection();
            return result;
        },
        parseTranslationString = function(): string {
            let result: string = '';
            assert(current() === chars.DOLLAR);
            next();
            assert(
                raw.substr(currentPosition, 3).indexOf('STR') === 0,
                'Invalid translation string beginning'
            );
            while (current()) {
                if (
                    current() === chars.SEMICOLON
                    || (current() === chars.COMMA || current() === chars.CURLY_CLOSE)
                ) {
                    break;
                } else {
                    if (isWhitespace()) {
                        parseWhitespace();
                        break;
                    } else {
                        result += current();
                    }
                }
                nextWithoutCommentDetection();
            }
            assert(
                current() === chars.SEMICOLON
                || (current() === chars.COMMA || current() === chars.CURLY_CLOSE)
            );

            return translateString(result);
        },
        parseMathExpression = function() {
            const posOfExpressionEnd = Math.min(
                indexOfOrMaxInt.call(raw, chars.SEMICOLON, currentPosition),
                indexOfOrMaxInt.call(raw, chars.CURLY_CLOSE, currentPosition),
                indexOfOrMaxInt.call(raw, chars.COMMA, currentPosition)
            );
            const expression = raw.substr(currentPosition, posOfExpressionEnd - currentPosition);
            assert(posOfExpressionEnd !== Infinity);
            currentPosition = posOfExpressionEnd;

            return +expression;
        },
        parseNonArrayPropertyValue = function(): any {
            let result;

            if (current() === chars.CURLY_OPEN) {
                result = parseArray(); // on nested array property values
            } else if (current() === chars.QUOTE) {
                result = parseString();
            } else if (current() === chars.DOLLAR) {
                result = parseTranslationString();
            } else {
                result = parseMathExpression();
            }
            return result;
        },
        isValidVarnameChar = function(char): boolean {
            return (char >= '0' && char <= '9') ||
                (char >= 'A' && char <= 'Z') ||
                (char >= 'a' && char <= 'z') ||
                char === '_';
        },
        parsePropertyName = function(): string {
            let result = current();
            while (isValidVarnameChar(next())) {
                result += current();
            }
            return result;
        },
        parseClassValue = function(): any {
            const result = {};

            assert(current() === chars.CURLY_OPEN);
            next();
            parseWhitespace();

            while (current() !== chars.CURLY_CLOSE) {

                parseProperty(result);
                parseWhitespace();
            }

            next();

            return result;
        };

    options = options || {};

    if (typeof raw !== 'string') {
        throw new TypeError('expecting string!');
    }

    detectComment();
    parseWhitespace();
    while(current()) {
        parseProperty(result);
        next();
        parseWhitespace();
    }

    return result;
};
