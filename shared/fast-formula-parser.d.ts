// Minimal types for fast-formula-parser (MIT), which ships none. Only what shared/sheet.ts uses.
declare module "fast-formula-parser" {
  interface Position {
    row: number;
    col: number;
    sheet?: string;
  }
  interface Options {
    onCell?: (ref: { row: number; col: number; sheet?: string }) => unknown;
    onRange?: (ref: { from: { row: number; col: number }; to: { row: number; col: number }; sheet?: string }) => unknown;
    functions?: Record<string, (...args: never[]) => unknown>;
  }
  export default class FormulaParser {
    constructor(options?: Options);
    parse(formula: string, position?: Position): unknown;
  }
}
