// src/lib/commonProps.ts
import type { GSTInvoice } from "../types/gst.types";

/** Generic onChange signature used throughout the UI */
export type ChangeHandler<Field extends string = string> = (
  field: Field,
  value: string
) => void;

/** Props that every component receiving `invoice` and an `onChange` share */
export interface CommonInvoiceProps {
  invoice: GSTInvoice;
  onChange: ChangeHandler;
}
