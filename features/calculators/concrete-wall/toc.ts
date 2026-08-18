// concrete-wall's article TOC — delegates to the shared extractor.
import { getToc } from "../toc";

export const getConcreteWallToc = getToc("concrete-wall");

export type { TocEntry } from "../toc";