import type { LanguageCode } from "@/app/messages/translationRuntime"
import type { LocalizedSeoCopy } from "./types"
import enSeoCopy from "./en"
import hiSeoCopy from "./hi"
import bnSeoCopy from "./bn"
import teSeoCopy from "./te"
import mrSeoCopy from "./mr"
import taSeoCopy from "./ta"
import urSeoCopy from "./ur"
import guSeoCopy from "./gu"
import knSeoCopy from "./kn"
import mlSeoCopy from "./ml"
import orSeoCopy from "./or"
import paSeoCopy from "./pa"
import asSeoCopy from "./as"
import maiSeoCopy from "./mai"
import satSeoCopy from "./sat"
import ksSeoCopy from "./ks"
import neSeoCopy from "./ne"
import sdSeoCopy from "./sd"
import kokSeoCopy from "./kok"
import doiSeoCopy from "./doi"
import mniSeoCopy from "./mni"
import brxSeoCopy from "./brx"
import saSeoCopy from "./sa"

export type { LocalizedSeoCopy } from "./types"

export const LOCALIZED_SEO: Record<string, LocalizedSeoCopy> = {
  en: enSeoCopy,
  hi: hiSeoCopy,
  bn: bnSeoCopy,
  te: teSeoCopy,
  mr: mrSeoCopy,
  ta: taSeoCopy,
  ur: urSeoCopy,
  gu: guSeoCopy,
  kn: knSeoCopy,
  ml: mlSeoCopy,
  or: orSeoCopy,
  pa: paSeoCopy,
  as: asSeoCopy,
  mai: maiSeoCopy,
  sat: satSeoCopy,
  ks: ksSeoCopy,
  ne: neSeoCopy,
  sd: sdSeoCopy,
  kok: kokSeoCopy,
  doi: doiSeoCopy,
  mni: mniSeoCopy,
  brx: brxSeoCopy,
  sa: saSeoCopy,
}

export function getLocalizedSeoCopy(language: LanguageCode | string = "en") {
  return LOCALIZED_SEO[language] || LOCALIZED_SEO.en
}
