// concrete-footing's article TOC — delegates to the shared extractor.
import { getToc } from "../toc";

export const getConcreteFootingToc = getToc("concrete-footing");

export type { TocEntry } from "../toc";
