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

function indexOfOrMaxInt(str: string, fromPos: number) {
    const pos = this.indexOf(str, fromPos);
    return pos === -1 ? Infinity : pos;
}

function isValidVarnameChar(char): boolean {
    return (char >= '0' && char <= '9') ||
        (char >= 'A' && char <= 'Z') ||
        (char >= 'a' && char <= 'z') ||
        char === '_';
}

class Parser {
    private currentPosition: number = 0
    private result = {};

    constructor(
        private raw: string,
        private options: Options = {},
        ) {
    }

    public parse(): any {
        this.reset();

        this.detectComment();
        this.parseWhitespace();
        while(this.current()) {
            this.parseProperty(this.result);
            this.parseWhitespace();
        }

        return this.result;
    }


    public reset() {
        this.currentPosition = 0;
        this.result = {};
    }


    private current(): string {
        return this.raw[this.currentPosition] || '';
    }

    public translateString(string: string): string {
        if(typeof this.options.translations === "object") {
            return this.options.translations.hasOwnProperty(string) ?
                this.options.translations[string] : string;
        }

        return string;
    }


    private parseArray(): any[] {
        const result = [];
        this.assert(this.current() === chars.CURLY_OPEN);
        this.next();
        this.parseWhitespace();
        while (this.current() !== chars.CURLY_CLOSE) {
            result.push(this.parseNonArrayPropertyValue());
            this.parseWhitespace();
            if (this.current() === chars.COMMA) {
                this.next();
                this.parseWhitespace();
            } else {
                break;
            }

        }
        this.next();
        return result;
    }
    private parseProperty(context): any {
        let name = this.parsePropertyName(),
            value;

        this.parseWhitespace();

        switch (name) {
            case 'class':
                name = this.parsePropertyName();
                this.parseWhitespace();
                if (this.current() === ':') { // skip parent class declaration
                    this.next();
                    this.parseWhitespace();
                    this.parsePropertyName();
                    this.parseWhitespace();
                }
                break;
            case 'delete': // skip delete statements
                this.parsePropertyName();
                this.parseWhitespace();
                this.assert(this.current() === chars.SEMICOLON);
                this.next();
                return;
            case 'import': // skip import statements
                this.parseWhitespace();
                this.parsePropertyName();
                this.parseWhitespace();
                this.assert(this.current() === chars.SEMICOLON);
                this.next();
                return;
        }

        switch (this.current()) {
            case chars.SQUARE_OPEN:
                this.assert(this.next() === chars.SQUARE_CLOSE);
                this.next();
                this.parseWhitespace();
                this.assert(this.current() === chars.EQUALS);
                this.next();
                this.parseWhitespace();
                value = this.parseArray();
                break;
            case chars.EQUALS:
                this.next();
                this.parseWhitespace();
                value = this.parseNonArrayPropertyValue();
                break;
            case chars.CURLY_OPEN:
                value = this.parseClassValue();
                break;
            default:
                throw new Error('unexpected value at pos ' + this.currentPosition);
        }

        context[name] = value;
        this.parseWhitespace();
        this.assert(this.current() === chars.SEMICOLON);
        this.next();
    }
    private parseWhitespace(): void {
        while (this.isWhitespace()) {
            this.next();
        }
    }
    private isWhitespace (): boolean {
        return (' \t\r\n'.indexOf(this.raw[this.currentPosition]) !== -1) ||
            (this.raw.charCodeAt(this.currentPosition) < 32);
    }
    private assert(bool: boolean, msg: string = ''): void {
        if (bool) {
            return;
        }
        throw new Error(
            msg + ' at position ' + this.currentPosition + ', ' +
            'before: ' + JSON.stringify(this.raw.substr(Math.max(0, this.currentPosition - 40), 40)) + ', ' +
            'after: ' + JSON.stringify(this.raw.substr(this.currentPosition, 40))
        );
    }
    private detectComment(): void {
        if (this.current() === chars.SLASH && this.raw[this.currentPosition + 1] === chars.SLASH) {
            const indexOfLinefeed = this.raw.indexOf('\n', this.currentPosition);
            this.currentPosition = indexOfLinefeed === -1 ? this.raw.length : indexOfLinefeed;
        } else if(this.current() === chars.SLASH && this.raw[this.currentPosition + 1] === chars.ASTERISK) {
            const multilineClose = chars.ASTERISK + chars.SLASH;
            const indexOfCommentEnd = this.raw.indexOf(multilineClose, this.currentPosition + 2);
            this.currentPosition = indexOfCommentEnd === -1 ? this.raw.length : indexOfCommentEnd + multilineClose.length;
        }
    }
    private next(): string {
        this.currentPosition += 1;
        this.detectComment();
        return this.current();
    }
    private nextWithoutCommentDetection(): string {
        this.currentPosition += 1;
        return this.current();
    }

    private weHaveADoubleQuote(): boolean {
        return (this.raw.substr(this.currentPosition, 2).indexOf('""') === 0);
    }
    private weHaveAStringLineBreak (): boolean {
        return this.raw.substr(this.currentPosition, 6).indexOf('" \\n "') === 0;
    }
    private forwardToNextQuote(): void {
        this.currentPosition = indexOfOrMaxInt.call(this.raw, chars.QUOTE, this.currentPosition + 1);
    }
    private parseString(): any {
        let result = '';
        this.assert(this.current() === chars.QUOTE);
        this.nextWithoutCommentDetection();
        while (this.current()) {
            if (this.weHaveADoubleQuote()) {
                result += this.current();
                this.nextWithoutCommentDetection();
            } else if (this.weHaveAStringLineBreak()) {
                result += '\n';
                this.next();
                this.forwardToNextQuote();
            } else if (this.current() === chars.QUOTE) {
                break;
            } else {
                result += this.current();
            }
            this.nextWithoutCommentDetection();
        }
        this.assert(this.current() === chars.QUOTE);
        this.nextWithoutCommentDetection();
        return result;
    }

    private parseTranslationString(): string {
        let result: string = '';
        this.assert(this.current() === chars.DOLLAR);
        this.next();
        this.assert(
            this.raw.substr(this.currentPosition, 3).indexOf('STR') === 0,
            'Invalid translation string beginning'
        );
        while (this.current()) {
            if (
                this.current() === chars.SEMICOLON
                || (this.current() === chars.COMMA || this.current() === chars.CURLY_CLOSE)
            ) {
                break;
            } else {
                if (this.isWhitespace()) {
                    this.parseWhitespace();
                    break;
                } else {
                    result += this.current();
                }
            }
            this.nextWithoutCommentDetection();
        }
        this.assert(
            this.current() === chars.SEMICOLON
            || (this.current() === chars.COMMA || this.current() === chars.CURLY_CLOSE)
        );

        return this.translateString(result);
    }

    private parseMathExpression(): number {
        const posOfExpressionEnd = Math.min(
            indexOfOrMaxInt.call(this.raw, chars.SEMICOLON, this.currentPosition),
            indexOfOrMaxInt.call(this.raw, chars.CURLY_CLOSE, this.currentPosition),
            indexOfOrMaxInt.call(this.raw, chars.COMMA, this.currentPosition)
        );
        const expression = this.raw.substr(this.currentPosition, posOfExpressionEnd - this.currentPosition);
        this.assert(posOfExpressionEnd !== Infinity);
        this.currentPosition = posOfExpressionEnd;

        return +expression;
    }

    private parseNonArrayPropertyValue(): any {
        let result;

        if (this.current() === chars.CURLY_OPEN) {
            result = this.parseArray(); // on nested array property values
        } else if (this.current() === chars.QUOTE) {
            result = this.parseString();
        } else if (this.current() === chars.DOLLAR) {
            result = this.parseTranslationString();
        } else {
            result = this.parseMathExpression();
        }
        return result;
    }

    private parsePropertyName(): string {
        let result = this.current();
        while (isValidVarnameChar(this.next())) {
            result += this.current();
        }
        return result;
    }
    private parseClassValue(): any {
        const result = {};

        this.assert(this.current() === chars.CURLY_OPEN);
        this.next();
        this.parseWhitespace();

        while (this.current() !== chars.CURLY_CLOSE) {

            this.parseProperty(result);
            this.parseWhitespace();
        }

        this.next();

        return result;
    };
}

export const parse = function (raw: string, options?: Options): any {
    if (typeof raw !== 'string') {
        throw new TypeError('expecting string!');
    }
    const parser = new Parser(raw, options || {})

    return parser.parse();
};
