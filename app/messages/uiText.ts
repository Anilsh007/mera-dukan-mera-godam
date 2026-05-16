import { en } from "@/app/messages/en";

export function uiText(value: string) {
  return (en.uiText as Record<string, string>)[value] ?? value;
}
