import { Application } from "https://deno.land/x/oak@v10.6.0/mod.ts";
import oakHtmxMiddleware from "https://deno.land/x/oak_htmx@v1.0.3/main.ts";
import { Bart } from "https://deno.land/x/die_bart@v1.0.10/main.ts";
import { viewEngine } from "https://deno.land/x/view_engine@v10.6.0/mod.ts";
import staticFiles from "https://deno.land/x/static_files@1.1.6/mod.ts";
import router from "./routes/index.ts";
import * as helpers from "../shared/helpers.ts";
import { engineAdapter } from "./lib/engineAdapter.ts";
import { bartEngine } from "./lib/bartEngine.ts";

const app = new Application();
const bart = new Bart();

bart.registerHelper("pathjoin", helpers.pathJoinHelper);

app.use(staticFiles("../shared"));
app.use(staticFiles("../assets"));

// add template engine
app.use(viewEngine(
  engineAdapter,
  bartEngine(bart, {
    extName: ".hbs",
    layout: "default.hbs",
    layoutPath: "../shared/views/layouts",
    partialPath: "../shared/views/partials",
  }),
  {
    viewRoot: "../shared/views",
    extName: ".hbs",
    layout: "default.hbs",
    layoutPath: "../shared/views/layouts",
    partialPath: "../shared/views/partials",
  },
));

app.use(oakHtmxMiddleware);

app.use(async (ctx, next) => {
  ctx.state.currentPath = ctx.request.url.pathname;
  ctx.state.data = {
    currentPath: ctx.request.url.pathname,
    nav: [
      { title: "Home", path: "/" },
      { title: "Projects", path: "/projects" },
      { title: "About", path: "/about" },
      { title: "Contact", path: "/contact" },
    ],
  };
  await next();
});

app.use(router.routes());

app.addEventListener("listen", ({ hostname, port }) => {
  console.log(`Listening on ${hostname}:${port}`);
});

app.listen({ port: 8000 });
