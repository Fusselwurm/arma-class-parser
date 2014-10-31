if (!Array.prototype.last) {
    Array.prototype.last = function () {
        return this[this.length - 1];
    };
}

(function (callback) {
    if (typeof define === 'function' && define.amd) {
        define(callback);
    } else {
        callback();
    }
}(function () {
    var
        chars = {
            QUOTE: '"',
            SEMICOLON: ';',
            EQUALS: '=',
            CURLY_OPEN: '{',
            CURLY_CLOSE: '}',
            SQUARE_OPEN: '[',
            SQUARE_CLOSE: ']',
            COMMA: ',',
            MINUS: '-'
        };

    function parse(raw) {
        var
            currentPosition = 0,
            assert = function (bool, msg) {
                if (bool) {
                    return;
                }
                throw new Error(
                    msg + ' at position ' + currentPosition + ', ' +
                    'before: ' + JSON.stringify(raw.substr(Math.max(0, currentPosition - 40), 40)) + ', ' +
                    'after: ' + JSON.stringify(raw.substr(currentPosition, 40))
                );
            },
            next = function () {
                currentPosition += 1;
                return current();
            },
            current = function () {
                return raw[currentPosition];
            },
            result = {},
            parseString = function () {
                var result = '';
                assert(current() === chars.QUOTE);
                next();
                while (current() !== chars.QUOTE && raw[currentPosition - 1] !== '\\') {
                    result += current();
                    next();
                }
                assert(current() === chars.QUOTE);
                next();
                return result;
            },
            parseNumber = function () {
                var result = '';
                if (current() === chars.MINUS) {
                    result += current();
                    next();
                }
                while('01234567890.'.indexOf(current()) !== -1) {
                    result += current();
                    next();
                }

                return parseFloat(result);
            },
            parsePropertyValue = function () {
                var
                    result;

                if (current() === chars.QUOTE) {
                    result = parseString();
                } else {
                    result = parseNumber();
                }
                return result;

            },
            isValidVarnameChar = function (char) {
                return (char >= '0' && char <= '9') ||
                    (char >= 'A' && char <= 'Z') ||
                    (char >= 'a' && char <= 'z') ||
                    char === '_';
            },
            parsePropertyName = function () {
                var result = current();
                while (isValidVarnameChar(next())) {
                    result += current();
                }
                return result;
            },
            parseClassValue = function () {
                var result = {};

                assert(current() === chars.CURLY_OPEN);
                next();
                parseWhitespace();

                while(current() !== chars.CURLY_CLOSE) {

                    parseProperty(result);
                    parseWhitespace();
                }

                next();

                return result;
            },
            parseArray = function () {
                var result = [];
                assert(current() === chars.CURLY_OPEN);
                next();
                parseWhitespace();
                while (current() !== chars.CURLY_CLOSE) {
                    result.push(parsePropertyValue());
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
            },
            parseProperty = function (context) {
                var
                    name = parsePropertyName(),
                    value;

                parseWhitespace();

                if (name === 'class') {
                    name = parsePropertyName();
                    parseWhitespace();
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
                        value = parsePropertyValue();
                        break;
                    case chars.CURLY_OPEN:
                        value = parseClassValue();
                        break;
                    default:
                        throw new Error('unexpected value at pos ' + currentPosition);
                }

                context[name] = value;
                parseWhitespace();
                assert(current() === chars.SEMICOLON);
                next();
            },
            parseWhitespace = function () {
                while (
                (' \t\r\n'.indexOf(raw[currentPosition]) !== -1) ||
                (raw.charCodeAt(currentPosition) < 32)
                    ) {
                    next();
                }
            };

        if (typeof raw !== 'string') {
            throw new TypeError('expecting string!');
        }

        parseWhitespace();
        while(current()) {
            parseProperty(result);
            next();
            parseWhitespace();
        }

        return result;
    }

    if (this === this.parent) {
        this.parse = parse;
    }
    if (typeof module === 'object' && module) {
        module.exports = parse;
    }

    return parse;
}));
