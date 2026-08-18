// concrete-volume's article TOC — delegates to the shared extractor.
import { getToc } from "../toc";

export const getConcreteVolumeToc = getToc("concrete-volume");

export type { TocEntry } from "../toc";
