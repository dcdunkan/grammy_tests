export * as Types from "https://deno.land/x/grammy@v1.14.1/types.ts";
export type {
  Bot,
  Context,
  RawApi,
  Transformer,
} from "https://deno.land/x/grammy@v1.14.1/mod.ts";

// a basic debug implementation
import * as c from "https://deno.land/std@0.179.0/fmt/colors.ts";
const COLORS = [c.red, c.green, c.blue, c.magenta, c.yellow, c.gray];

function colorFn(fn: (s: string) => string) {
  return Deno.noColor ? (s: string) => s : fn;
}

export function debug(ns: string) {
  let last: number;
  ns = colorFn(COLORS[Math.floor(Math.random() * COLORS.length)])(ns);
  return function (...data: unknown[]) {
    const now = Date.now(), diff = `+${now - (last ?? now)}ms`;
    last = now;
    console.error(ns, ...data, `${colorFn(c.cyan)(diff)}`);
  };
}
