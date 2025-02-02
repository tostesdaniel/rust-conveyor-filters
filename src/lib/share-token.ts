import { nanoid } from "nanoid";

export function generateShareToken() {
  return nanoid(21);
}
