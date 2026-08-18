// Rebar's article TOC — delegates to the shared extractor.
import { getToc } from "../toc";

export const getRebarToc = getToc("rebar");

export type { TocEntry } from "../toc";
