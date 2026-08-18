// concrete-slab's article TOC — delegates to the shared extractor.
import { getToc } from "../toc";

export const getConcreteSlabToc = getToc("concrete-slab");

export type { TocEntry } from "../toc";