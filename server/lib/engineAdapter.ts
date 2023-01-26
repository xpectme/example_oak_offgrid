import { Status } from "https://deno.land/std@0.173.0/http/http_status.ts";
import type {
  Context,
  RouteParams,
  State,
  ViewEngineOptions,
} from "https://deno.land/x/oak@v10.6.0/mod.ts";
import { getTemplate } from "https://deno.land/x/view_engine@v10.6.0/lib/adapters/oak/oak.utils.ts";
import {
  Adapter,
  Engine,
  ViewConfig,
} from "https://deno.land/x/view_engine@v10.6.0/mod.ts";

declare module "https://deno.land/x/view_engine@v10.6.0/mod.ts" {
  interface ViewConfig {
    layout?: string;
    layoutPath?: string;
    partialPath?: string;
    extName?: string;
  }
}

declare module "https://deno.land/x/oak@v10.6.0/mod.ts" {
  interface ViewEngineOptions {
    viewRoot: string;
    layout?: string;
    layoutPath?: string;
    partialPath?: string;
    extName?: string;
  }

  // App level Context
  interface Context {
    partial: (fileName: string, data?: Record<string, unknown>) => void;
    view: (
      fileName: string,
      data?: Record<string, unknown>,
      options?: ViewEngineOptions,
    ) => void;
  }

  // Router level Context
  interface RouterContext<
    R extends string,
    P extends RouteParams<R> = RouteParams<R>,
    // deno-lint-ignore no-explicit-any
    S extends State = Record<string, any>,
  > {
    partial: (fileName: string, data?: Record<string, unknown>) => void;
    view: (
      fileName: string,
      data?: Record<string, unknown>,
      options?: ViewEngineOptions,
    ) => void;
  }

  // add viewConfig to Application interface
  interface Application {
    viewConfig: ViewConfig;
  }
}

function createBodyHandler(
  renderEngine: Engine,
  filename: string,
  data: Record<string, unknown>,
  config: ViewConfig = <ViewConfig> {},
) {
  return async () => {
    return renderEngine(
      await getTemplate(
        config.viewRoot ?? "./",
        filename + (config?.extName ?? ".html"),
      ),
      data,
      config,
      filename,
    );
  };
}

//! Add `render` function to Context
export const engineAdapter: Adapter = (
  renderEngine: Engine,
  config: ViewConfig = <ViewConfig> {},
) => {
  return async function (ctx: Context, next: () => Promise<void>) {
    // load default view setting
    if (!ctx.app.viewConfig) {
      ctx.app.viewConfig = { ...config };
    }

    ctx.render = (
      filename: string,
      data: Record<string, unknown> = {},
      options: ViewEngineOptions = <ViewEngineOptions> {},
    ) => {
      if (ctx.state.isHTMX) {
        return ctx.partial(filename, data);
      } else {
        return ctx.view(filename, data, options);
      }
    };

    ctx.view = (
      filename: string,
      data: Record<string, unknown> = {},
      options: ViewEngineOptions = <ViewEngineOptions> {},
    ) => {
      try {
        const viewConfig = ctx.app.viewConfig;

        ctx.response.headers.set("Content-Type", "text/html; charset=utf-8");
        ctx.response.body = createBodyHandler(
          renderEngine,
          filename,
          data,
          {
            ...viewConfig,
            layout: options?.layout ?? viewConfig.layout,
            layoutPath: options?.layoutPath ?? viewConfig.layoutPath,
          },
        );
      } catch (e) {
        // Route was found, but there was an error rendering it.
        ctx.throw(Status.InternalServerError, e.message, {
          message: e.message,
          stack: e.stack,
        });
      }
    };

    ctx.partial = (
      filename: string,
      data: Record<string, unknown> = {},
    ) => {
      try {
        const viewConfig = ctx.app.viewConfig;

        ctx.response.headers.set("Content-Type", "text/html; charset=utf-8");
        ctx.response.body = createBodyHandler(
          renderEngine,
          filename,
          data,
          {
            extName: viewConfig.extName,
            viewRoot: viewConfig.viewRoot,
          },
        );
      } catch (e) {
        // Route was found, but there was an error rendering it.
        ctx.throw(Status.InternalServerError, e.message, {
          message: e.message,
          stack: e.stack,
        });
      }
    };

    await next();
  };
};
