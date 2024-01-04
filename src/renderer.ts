import type { IRenderer } from "@pintora/renderer";
import type { PintoraConfig, DeepPartial } from "@pintora/core";
import { JSDOM } from "jsdom";
import { pintoraStandalone } from "@pintora/standalone";

export const DEFAUT_BGS = {
  light: "#FFFFFF",
  dark: "#282A36",
};

export type CLIRenderOptions = {
  /**
   * pintora DSL to render
   */
  code: string;
  /**
   * Assign extra background color
   */
  backgroundColor?: string;
  pintoraConfig?: DeepPartial<PintoraConfig>;
  /**
   * width of the output, height will be calculated according to the diagram content ratio
   */
  width?: number;
};

/**
 * Renders the Pintora CLI options to the specified output format.
 * @param opts - The CLIRenderOptions.
 * @returns A promise that resolves to the rendered output.
 */
export function render(opts: CLIRenderOptions) {
  const { code, backgroundColor, pintoraConfig } = opts;

  const dom = new JSDOM("<!DOCTYPE html><body></body>");
  const document = dom.window.document;
  const container = document.createElement("div");
  // should be possible to avoid global polution
  // https://g.antv.antgroup.com/en/api/renderer/svg#%E6%9C%8D%E5%8A%A1%E7%AB%AF%E6%B8%B2%E6%9F%93
  global.document = document;

  let config = pintoraStandalone.getConfig<PintoraConfig>();
  if (pintoraConfig) {
    config = pintoraStandalone.configApi.gnernateNewConfig(pintoraConfig);
  }

  const containerSize = opts.width ? { width: opts.width } : undefined;
  if (opts.width) {
    config = pintoraStandalone.configApi.gnernateNewConfig({
      // does this ignore original `pintoraConfig`?
      core: { useMaxWidth: true },
    });
  }

  return new Promise<string>((resolve, reject) => {
    pintoraStandalone.renderTo(code, {
      container,
      renderer: "svg",
      containerSize,
      enhanceGraphicIR(ir: any) {
        if (!ir.bgColor) {
          const themeVariables: Partial<
            PintoraConfig["themeConfig"]["themeVariables"]
          > = config.themeConfig.themeVariables || {};
          const newBgColor =
            backgroundColor ||
            themeVariables.canvasBackground ||
            (themeVariables.isDark ? DEFAUT_BGS.dark : DEFAUT_BGS.light);
          ir.bgColor = newBgColor;
        }
        return ir;
      },
      onRender(renderer: IRenderer) {
        const rootElement = renderer.getRootElement() as SVGSVGElement;
        rootElement.setAttribute("xmlns", "http://www.w3.org/2000/svg");
        resolve(rootElement.outerHTML);
      },
      onError(e: Error) {
        reject(e);
      },
    });
  });
}
