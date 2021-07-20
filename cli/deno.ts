import { parse } from './src/class-parser.ts'

const stdin = new TextDecoder().decode(await Deno.readAll(Deno.stdin));

console.log(parse(stdin))
