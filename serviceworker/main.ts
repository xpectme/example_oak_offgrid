// deno-lint-ignore-file no-explicit-any
import {
  hooks,
  Router,
} from "https://deno.land/x/offgrid_router@v1.0.4/main.ts";
import { BartEngine } from "https://deno.land/x/offgrid_diebart@v1.0.0/main.ts";
import htmxHook from "https://deno.land/x/offgrid_htmx@v1.0.0/main.ts";

const router = new Router();

// enable logging
router.hooks.add(hooks.logging());

// enable current path in context.state.currentPath
router.hooks.add(hooks.path());

// updates online state in context.state.onlineState
// and allows offline fallbacks.
router.hooks.add(hooks.onlineState({
  // 0.5mbps
  downlink: 0.5,
  // 750ms
  latency: 750,
}));

// enable htmx server hook
router.hooks.add(htmxHook());

const engine = new BartEngine({
  // this is a service worker, so keep in mind it's relative to the
  // URL and not the filesystem.
  rootPath: "/views",

  // I use .hbs extension for my templates, even though they're not
  // Handlebars templates. This is because I use a similar syntax
  // for my templates, and it's convenient to have syntax highlighting.
  extName: ".hbs",
});
router.setViewEngine(engine);

addEventListener("fetch", (event) => {
  router.listen(event as any);
});
