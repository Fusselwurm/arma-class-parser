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
            context = {
                NONE: 'NONE',
                STRING: 'STRING',
                CLASS: 'CLASS',
                NAME: 'NAME',
                VALUE: 'VALUE'
            },
            chars = {
                QUOTE: '"',
                SEMICOLON: ';',
                EQUALS: '=',
                CURLY_OPEN: '{',
                CURLY_CLOSE: '}'
            };

        function assert(bool, msg) {
            if (!bool) {
                throw new Error(msg);
            }
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
                parseString = function () {
                    var startPosition = currentPosition + 1;
                    assert(raw[currentPosition] === chars.QUOTE);
                    next();
                    while (raw[currentPosition] !== chars.QUOTE) {
                        next();
                    }
                    return raw.substr(startPosition, currentPosition - startPosition);
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
                parsePropertyName = function () {
                    var
                        eqPos = raw.indexOf(chars.EQUALS, currentPosition),
                        result = raw.substr(currentPosition, eqPos - currentPosition).trim();


                    if (eqPos === -1) {
                        throw new Error('cannot find "="');
                    }

                    currentPosition = eqPos;

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

                        if (isClassStart()) {
                            parseClass(result);
                        } else {
                            parseProperty(result);
                        }

                        parseWhitespace();
                    }

                    next();

                    return result;
                },
                parseProperty = function (context) {
                    var name = parsePropertyName();

                    assert(current() === chars.EQUALS);
                    next();
                    parseWhitespace();
                    context[name] = parsePropertyValue();
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
                parseClass(result);
                next();
                parseWhitespace();
            }

            return result;
        }

    if (this === this.parent) {
        this.parse = parse;
    }

    return parse;
}));