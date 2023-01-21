import { Router } from "https://deno.land/x/oak@v10.6.0/mod.ts";

const router = new Router();

router.get("/", (ctx) => {
  ctx.render("home.hbs", {
    ...ctx.state.data,
    title: "Offgrid Project",
  });
});

router.get("/projects", (ctx) => {
  ctx.render("projects.hbs", {
    ...ctx.state.data,
    title: "Project",
    content: "Offgrid Projects",
    projects: [
      { name: "Offgrid Router", slug: "/xpectme/offgrid_router" },
      { name: "Offgrid Diebart", slug: "/xpectme/offgrid_diebart" },
      { name: "Offgrid Htmx", slug: "/xpectme/offgrid_htmx" },
      { name: "Offgrid Oak Htmx", slug: "/xpectme/oak_htmx" },
      { name: "Offgrid Oak", slug: "/xpectme/oak" },
      { name: "HTMX Server Headers", slug: "/xpectme/htmx_headers" },
      { name: "Template Engine Bart", slug: "/mstoecklein/die_bart" },
    ],
  });
});

router.get("/about", (ctx) => {
  ctx.render("about.hbs", {
    ...ctx.state.data,
    title: "About",
    content: "I am a software developer. I love to code and learn new things.",
  });
});

router.get("/contact", (ctx) => {
  ctx.render("contact.hbs", {
    ...ctx.state.data,
    title: "Contact",
    contactMe: "Contact me at",
    email: "mstoecklein@xp.live",
  });
});

export default router;
