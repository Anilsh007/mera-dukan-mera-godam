// lib/getStateFromGSTIN.ts
import { GST_STATE_MAP } from "./gstStateMap";

export function getStateFromGSTIN(gstin: string): string | null {
  if (!gstin || gstin.length < 2) return null;

  const stateCode = gstin.slice(0, 2);
  return GST_STATE_MAP[stateCode] || null;
}