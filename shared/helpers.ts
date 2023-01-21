import { join } from "https://deno.land/std@0.151.0/path/mod.ts";

export function pathJoinHelper(path: string, ...args: string[]) {
  return join(path, ...args);
}
