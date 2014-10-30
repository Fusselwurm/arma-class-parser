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
                SQUARE_CLOSE: ']'
            };

        function assert(bool, msg) {
            if (bool) {
                return;
            }
            throw new Error(msg);
        }
        function parse(raw) {
            var
                currentPosition = 0,
                next = function () {
                    currentPosition += 1;
                    return current();
                },
                current = function () {
                    return raw[currentPosition];
                },
                result = {},
                isClassStart = function () {
                    return raw.substr(currentPosition, 5) === 'class' && ' \t\n\r{'.indexOf(raw[currentPosition + 5]) !== -1;
                },
                parsePropertyValue = function () {
                    var
                        endPosition = raw.indexOf(chars.SEMICOLON, currentPosition),
                        result;

                    if (endPosition === -1) {
                        throw new Error('cannot find semicolon o.O');
                    }

                    result = raw.substr(currentPosition, endPosition -currentPosition).trim();

                    if (result[0] === chars.QUOTE) {
                        result = result.substr(1,  result.length - 2);
                    } else {
                        result = parseFloat(result);
                    }

                    currentPosition = endPosition;

                    return result;

                },
                isValidVarnameChar = function (char) {
                    return (char >= '0' && char <= '9') ||
                        (char >= 'A' && char <= 'z') ||
                        char === '_';
                },
                parsePropertyName = function () {
                    var result = current();
                    while (isValidVarnameChar(next())) {
                        result += current();
                    }
                    return result;
                },
                parseClassName = function () {
                    var
                        curlyPosition = raw.indexOf(chars.CURLY_OPEN, currentPosition),
                        result;

                    if (curlyPosition === -1) {
                        throw new Error('cannot find opening brace');
                    }

                    result = raw.substr(currentPosition, curlyPosition - currentPosition).trim();
                    currentPosition = curlyPosition;

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
                parseClass = function (context) {
                    var className;

                    assert(isClassStart(), 'Expected "class"');

                    currentPosition += 5;
                    parseWhitespace();

                    className = parseClassName();
                    parseWhitespace();
                    context[className] = parseClassValue();
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
