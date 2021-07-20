const fs = require('fs');
const parse = require('../dist/class-parser.js').parse;

const data = fs.readFileSync(process.stdin.fd, 'utf-8');

process.stdout.write(JSON.stringify(parse(data)))
