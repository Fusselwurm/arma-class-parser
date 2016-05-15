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
            MINUS: '-',
            SLASH: '/'
        };

    function parse(raw, options) {
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
            detectLineComment = function () {
                var indexOfLinefeed;
                if (current() === chars.SLASH && raw[currentPosition + 1] === chars.SLASH) {
                    indexOfLinefeed = raw.indexOf('\n', currentPosition);
                    currentPosition = indexOfLinefeed === -1 ? raw.length : indexOfLinefeed;
                }
            },
            next = function () {
                currentPosition += 1;
                detectLineComment();
                return current();
            },
            nextWithoutCommentDetection = function () {
                currentPosition += 1;
                return current();
            },
            current = function () {
                return raw[currentPosition];
            },
            result = {},
            weHaveADoubleQuote = function () {
                return (raw.substr(currentPosition, 2).indexOf('""') === 0);
            },
            weHaveAStringLineBreak = function () {
                return raw.substr(currentPosition, 6).indexOf('" \\n "') === 0;
            },
            forwardToNextQuote = function () {
                currentPosition = indexOfOrMaxInt.call(raw, chars.QUOTE, currentPosition + 1);
            },
            parseString = function () {
                var result = '';
                assert(current() === chars.QUOTE);
                nextWithoutCommentDetection();
                while (true) {
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
            parseNumber = function (str) {
                str = str.trim();
                if (str.substr(0, 2) === '0x') {
                    return parseInt(str);
                }
                if (str.match(/\-?[\d]*(\.\d)?(e\-?\d+)?/)) {
                    return parseFloat(str);
                }
                throw new Error('not a number: ' + str);
            },
            indexOfOrMaxInt = function (str, fromPos) {
                var pos = this.indexOf(str, fromPos);
                return pos === -1 ? Infinity : pos;
            },
            parseMathExpression = function () {
                var
                    posOfExpressionEnd = Math.min(
                        indexOfOrMaxInt.call(raw, chars.SEMICOLON, currentPosition),
                        indexOfOrMaxInt.call(raw, chars.CURLY_CLOSE, currentPosition),
                        indexOfOrMaxInt.call(raw, chars.COMMA, currentPosition)
                    ),
                    expression = raw.substr(currentPosition, posOfExpressionEnd - currentPosition);
                assert(posOfExpressionEnd !== -1);
                currentPosition = posOfExpressionEnd;

                // DONT LOOK, IT HURTS
                return expression.split('+').map(parseNumber).reduce(function (prev, cur) {
                    return prev + cur;
                }, 0);
            },
            parsePropertyValue = function () {
                var
                    result;

                if (current() === chars.QUOTE) {
                    result = parseString();
                } else {
                    result = parseMathExpression();
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
                        value = parsePropertyValue();
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

        options = options || {};

        if (typeof raw !== 'string') {
            throw new TypeError('expecting string!');
        }

        detectLineComment();
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
