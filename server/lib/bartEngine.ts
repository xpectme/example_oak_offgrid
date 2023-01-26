import type {
  Engine,
} from "https://deno.land/x/view_engine@v10.6.0/lib/viewEngine.type.ts";
import { basename } from "https://deno.land/std@0.151.0/path/mod.ts";
import { Bart } from "https://deno.land/x/die_bart@v1.0.10/main.ts";

export interface BartEngineConfig {
  partialPath: string;
  layoutPath: string;
  layout: string;
  extName: string;
}

export function bartEngine(
  bart: Bart,
  options: Partial<BartEngineConfig> = {},
): Engine {
  // read directory and register partials
  if (options.partialPath) {
    const partials = Deno.readDirSync(options.partialPath);
    const templates: Record<string, string> = {};
    for (const partial of partials) {
      if (!partial.isFile) {
        continue;
      }
      const name = basename(partial.name, options.extName);
      const template = Deno.readTextFileSync(
        `${options.partialPath}/${partial.name}`,
      );
      templates[name] = template;
    }
    bart.registerPartials(templates);
  }

  return async (
    template: string,
    data: Record<string, unknown> = {},
    options: Partial<BartEngineConfig> = {},
  ) => {
    const content = bart.compile(template)(data);

    if (options.layout) {
      const layout = options.layoutPath
        ? `${options.layoutPath}/${options.layout}`
        : options.layout;
      const layoutTmpl = await Deno.readTextFile(layout);
      const layoutData = { ...data, content };
      return bart.compile(layoutTmpl)(layoutData);
    }
    return content;
  };
}
