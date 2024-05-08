import { Part } from "../pages/PartsPage";

export function instanceOfPart(part: any): part is Part {
  return "specificPartName" in part;
}
