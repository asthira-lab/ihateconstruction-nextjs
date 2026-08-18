// concrete-staircase's article TOC — delegates to the shared extractor.
import { getToc } from "../toc";

export const getConcreteStaircaseToc = getToc("concrete-staircase");

export type { TocEntry } from "../toc";