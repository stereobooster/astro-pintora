import { type CLIRenderOptions, render } from "./renderer";

export interface RenderOptions
  extends Omit<CLIRenderOptions, "code"> {}

export interface Result {
  type: "svg";
  value: string;
}

const themeCSS = {
  primaryColor: `rgb(var(--primaryColor))`,
  secondaryColor: `rgb(var(--secondaryColor))`,
  tertiaryColor: `rgb(var(--tertiaryColor))`,

  lineColor: `rgb(var(--lineColor))`,

  primaryLineColor: `rgb(var(--primaryLineColor))`,
  secondaryLineColor: `rgb(var(--secondaryLineColor))`,

  textColor: `rgb(var(--textColor))`,
  primaryTextColor: `rgb(var(--primaryTextColor))`,
  secondaryTextColor: `rgb(var(--secondaryTextColor))`,
  teritaryTextColor: `rgb(var(--teritaryTextColor))`,

  primaryBorderColor: `rgb(var(--primaryBorderColor))`,
  secondaryBorderColor: `rgb(var(--secondaryBorderColor))`,
  tertiaryBorderColor: `rgb(var(--tertiaryBorderColor))`,

  canvasBackground: `rgb(var(--canvasBackground))`,
  background1: `rgb(var(--background1))`,
  lightestBackground: `rgb(var(--lightestBackground))`,
  groupBackground: `rgb(var(--groupBackground))`,

  noteBackground: `rgb(var(--noteBackground))`,
  noteTextColor: `rgb(var(--noteTextColor))`,
};

export const renderDiagram = async (
  options: CLIRenderOptions
): Promise<Result> => {
  options = {
    ...options,
    pintoraConfig: { themeConfig: { themeVariables: themeCSS } },
  };
  return {
    type: "svg",
    value: (await render(options)) as string,
  };
};

/*
    cyrb53a (c) 2023 bryc (github.com/bryc)
    License: Public domain. Attribution appreciated.
    The original cyrb53 has a slight mixing bias in the low bits of h1.
    This shouldn't be a huge problem, but I want to try to improve it.
    This new version should have improved avalanche behavior, but
    it is not quite final, I may still find improvements.
    So don't expect it to always produce the same output.
*/
const cyrb53a = function (str: string, seed = 0): number {
  let h1 = 0xdeadbeef ^ seed,
    h2 = 0x41c6ce57 ^ seed;
  for (let i = 0, ch; i < str.length; i++) {
    ch = str.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 0x85ebca77);
    h2 = Math.imul(h2 ^ ch, 0xc2b2ae3d);
  }
  h1 ^= Math.imul(h1 ^ (h2 >>> 15), 0x735a2d97);
  h2 ^= Math.imul(h2 ^ (h1 >>> 15), 0xcaf649a9);
  h1 ^= h2 >>> 16;
  h2 ^= h1 >>> 16;
  return 2097152 * (h2 >>> 0) + (h1 >>> 11);
};

const cache: Record<string, Result> = Object.create(null);

export const renderDiagramMemoized = async (
  options: CLIRenderOptions
): Promise<Result> => {
  const key = cyrb53a(JSON.stringify(options));
  if (cache[key] === undefined) {
    cache[key] = await renderDiagram(options);
  }
  return cache[key];
};
