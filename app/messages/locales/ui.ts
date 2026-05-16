import type { LanguageCode } from "@/app/messages/translationRuntime"
import { exactUiText as hiExactUiText, messageOverlay as hiMessageOverlay } from "./hi"
import { exactUiText as bnExactUiText, messageOverlay as bnMessageOverlay } from "./bn"
import { exactUiText as teExactUiText, messageOverlay as teMessageOverlay } from "./te"
import { exactUiText as mrExactUiText, messageOverlay as mrMessageOverlay } from "./mr"
import { exactUiText as taExactUiText, messageOverlay as taMessageOverlay } from "./ta"
import { exactUiText as urExactUiText, messageOverlay as urMessageOverlay } from "./ur"
import { exactUiText as guExactUiText, messageOverlay as guMessageOverlay } from "./gu"
import { exactUiText as knExactUiText, messageOverlay as knMessageOverlay } from "./kn"
import { exactUiText as mlExactUiText, messageOverlay as mlMessageOverlay } from "./ml"
import { exactUiText as orExactUiText, messageOverlay as orMessageOverlay } from "./or"
import { exactUiText as paExactUiText, messageOverlay as paMessageOverlay } from "./pa"
import { exactUiText as asExactUiText, messageOverlay as asMessageOverlay } from "./as"
import { exactUiText as maiExactUiText, messageOverlay as maiMessageOverlay } from "./mai"
import { exactUiText as satExactUiText, messageOverlay as satMessageOverlay } from "./sat"
import { exactUiText as ksExactUiText, messageOverlay as ksMessageOverlay } from "./ks"
import { exactUiText as neExactUiText, messageOverlay as neMessageOverlay } from "./ne"
import { exactUiText as sdExactUiText, messageOverlay as sdMessageOverlay } from "./sd"
import { exactUiText as kokExactUiText, messageOverlay as kokMessageOverlay } from "./kok"
import { exactUiText as doiExactUiText, messageOverlay as doiMessageOverlay } from "./doi"
import { exactUiText as mniExactUiText, messageOverlay as mniMessageOverlay } from "./mni"
import { exactUiText as brxExactUiText, messageOverlay as brxMessageOverlay } from "./brx"
import { exactUiText as saExactUiText, messageOverlay as saMessageOverlay } from "./sa"

export const EXACT_UI_TEXT_TRANSLATIONS: Partial<Record<LanguageCode, Record<string, string>>> = {
  hi: hiExactUiText,
  bn: bnExactUiText,
  te: teExactUiText,
  mr: mrExactUiText,
  ta: taExactUiText,
  ur: urExactUiText,
  gu: guExactUiText,
  kn: knExactUiText,
  ml: mlExactUiText,
  or: orExactUiText,
  pa: paExactUiText,
  as: asExactUiText,
  mai: maiExactUiText,
  sat: satExactUiText,
  ks: ksExactUiText,
  ne: neExactUiText,
  sd: sdExactUiText,
  kok: kokExactUiText,
  doi: doiExactUiText,
  mni: mniExactUiText,
  brx: brxExactUiText,
  sa: saExactUiText,
}

export const MESSAGE_OVERLAYS: Partial<Record<LanguageCode, Record<string, string>>> = {
  hi: hiMessageOverlay,
  bn: bnMessageOverlay,
  te: teMessageOverlay,
  mr: mrMessageOverlay,
  ta: taMessageOverlay,
  ur: urMessageOverlay,
  gu: guMessageOverlay,
  kn: knMessageOverlay,
  ml: mlMessageOverlay,
  or: orMessageOverlay,
  pa: paMessageOverlay,
  as: asMessageOverlay,
  mai: maiMessageOverlay,
  sat: satMessageOverlay,
  ks: ksMessageOverlay,
  ne: neMessageOverlay,
  sd: sdMessageOverlay,
  kok: kokMessageOverlay,
  doi: doiMessageOverlay,
  mni: mniMessageOverlay,
  brx: brxMessageOverlay,
  sa: saMessageOverlay,
}
