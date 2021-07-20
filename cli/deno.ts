import { parse } from "../src/class-parser.ts"

const stdin = new TextDecoder().decode(await Deno.readAll(Deno.stdin));

Deno.stdout.write(new TextEncoder().encode(JSON.stringify(parse(stdin))))
