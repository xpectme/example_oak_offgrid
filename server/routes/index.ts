import { Router } from "https://deno.land/x/oak@v10.6.0/mod.ts";

const router = new Router();

router.get("/", (ctx) => {
  const data = {
    ...ctx.state.data,
    title: "Offgrid Project",
  };

  if (ctx.state.isHTMX) {
    ctx.partial("home", data);
  } else {
    ctx.view("home", data);
  }
});

router.get("/projects", (ctx) => {
  const data = {
    ...ctx.state.data,
    title: "Project",
    content: "Offgrid Projects",
    projects: [
      { name: "Offgrid Router", slug: "/xpectme/offgrid_router" },
      { name: "Offgrid Diebart", slug: "/xpectme/offgrid_diebart" },
      { name: "Offgrid Htmx", slug: "/xpectme/offgrid_htmx" },
      { name: "Offgrid Oak Htmx", slug: "/xpectme/oak_htmx" },
      { name: "HTMX Server Headers", slug: "/xpectme/htmx_headers" },
      { name: "Template Engine Bart", slug: "/mstoecklein/die_bart" },
    ],
  };

  if (ctx.state.isHTMX) {
    ctx.partial("projects", data);
  } else {
    ctx.view("projects", data);
  }
});

router.get("/about", (ctx) => {
  const data = {
    ...ctx.state.data,
    title: "About",
    content: "I am a software developer. I love to code and learn new things.",
  };

  if (ctx.state.isHTMX) {
    ctx.partial("about", data);
  } else {
    ctx.view("about", data);
  }
});

router.get("/contact", (ctx) => {
  const data = {
    ...ctx.state.data,
    title: "Contact",
    contactMe: "Contact me at",
    email: "mstoecklein@xp.live",
  };

  if (ctx.state.isHTMX) {
    ctx.partial("contact", data);
  } else {
    ctx.view("contact", data);
  }
});

export default router;
