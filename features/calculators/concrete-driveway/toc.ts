// concrete-driveway's article TOC — delegates to the shared extractor.
import { getToc } from "../toc";

export const getConcreteDrivewayToc = getToc("concrete-driveway");

export type { TocEntry } from "../toc";