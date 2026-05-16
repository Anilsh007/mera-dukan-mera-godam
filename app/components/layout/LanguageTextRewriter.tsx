"use client";

import { useEffect } from "react";
import { en } from "@/app/messages/en";
import { isProbablyUiText, normalizeUiText, translateUiText } from "@/app/messages/translationRuntime";

const SKIP_TEXT_TAGS = new Set(["SCRIPT", "STYLE", "NOSCRIPT", "TEXTAREA", "INPUT", "CODE", "PRE", "SVG"]);
const ATTRIBUTES = ["placeholder", "aria-label", "title", "alt"] as const;
const originalTextNodes = new WeakMap<Text, string>();
const originalAttributes = new WeakMap<Element, Partial<Record<(typeof ATTRIBUTES)[number], string>>>();

function shouldSkipTextNode(node: Node) {
  const parent = node.parentElement;
  if (!parent) return true;
  return Boolean(parent.closest("[data-i18n-skip], [data-sonner-toaster]")) || SKIP_TEXT_TAGS.has(parent.tagName);
}

function preserveSpacing(original: string, translated: string) {
  const leading = original.match(/^\s*/)?.[0] ?? "";
  const trailing = original.match(/\s*$/)?.[0] ?? "";
  return `${leading}${translated}${trailing}`;
}

function rewriteTextNode(node: Text) {
  if (shouldSkipTextNode(node)) return;
  const current = node.nodeValue ?? "";
  const original = originalTextNodes.get(node) ?? current;
  const normalized = normalizeUiText(original);
  if (!isProbablyUiText(normalized, en.uiText as Record<string, string>)) return;
  originalTextNodes.set(node, original);
  const translated = translateUiText(normalized, en.uiText as Record<string, string>);
  const nextValue = preserveSpacing(original, translated);
  if (current !== nextValue) node.nodeValue = nextValue;
}

function rewriteAttributes(element: Element) {
  if (element.closest("[data-i18n-skip], [data-sonner-toaster]")) return;
  let originals = originalAttributes.get(element);
  for (const attribute of ATTRIBUTES) {
    const current = element.getAttribute(attribute);
    if (!current) continue;
    const cachedOriginal = originals?.[attribute];
    const candidate = cachedOriginal ?? current;
    const normalized = normalizeUiText(candidate);

    // Attributes are almost always UI copy, especially placeholders and aria labels.
    // Keep emails, numeric examples, codes, and CSS-like values untouched inside translateUiText.
    if (!isProbablyUiText(normalized, en.uiText as Record<string, string>) && attribute !== "placeholder" && attribute !== "aria-label") continue;

    if (!originals) {
      originals = {};
      originalAttributes.set(element, originals);
    }
    if (!cachedOriginal) originals[attribute] = current;

    const source = normalizeUiText(originals[attribute] ?? current);
    const translated = translateUiText(source, en.uiText as Record<string, string>);
    if (current !== translated) element.setAttribute(attribute, translated);
  }
}

function rewriteElementValueHints(element: Element) {
  if (!(element instanceof HTMLInputElement)) return;
  if (element.type !== "button" && element.type !== "submit" && element.type !== "reset") return;
  const value = element.getAttribute("value");
  if (!value) return;
  const normalized = normalizeUiText(value);
  if (!isProbablyUiText(normalized, en.uiText as Record<string, string>)) return;
  const translated = translateUiText(normalized, en.uiText as Record<string, string>);
  if (value !== translated) element.setAttribute("value", translated);
}

function rewriteTree(root: ParentNode = document.body) {
  if (!root) return;
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
    acceptNode(node) {
      return shouldSkipTextNode(node) ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT;
    },
  });

  let node = walker.nextNode();
  while (node) {
    rewriteTextNode(node as Text);
    node = walker.nextNode();
  }

  if (root instanceof Element) {
    rewriteAttributes(root);
    rewriteElementValueHints(root);
  }
  root.querySelectorAll?.("[placeholder], [aria-label], [title], img[alt], input[value]").forEach((element) => {
    rewriteAttributes(element);
    rewriteElementValueHints(element);
  });
}

export default function LanguageTextRewriter() {
  useEffect(() => {
    const run = () => requestAnimationFrame(() => rewriteTree());
    run();

    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        mutation.addedNodes.forEach((node) => {
          if (node.nodeType === Node.TEXT_NODE) rewriteTextNode(node as Text);
          if (node.nodeType === Node.ELEMENT_NODE) rewriteTree(node as Element);
        });
        if (mutation.type === "characterData" && mutation.target.nodeType === Node.TEXT_NODE) {
          rewriteTextNode(mutation.target as Text);
        }
        if (mutation.type === "attributes" && mutation.target.nodeType === Node.ELEMENT_NODE) {
          rewriteAttributes(mutation.target as Element);
          rewriteElementValueHints(mutation.target as Element);
        }
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
      characterData: true,
      attributes: true,
      attributeFilter: [...ATTRIBUTES, "value"],
    });

    window.addEventListener("languagechange", run);
    window.addEventListener("load", run);

    return () => {
      observer.disconnect();
      window.removeEventListener("languagechange", run);
      window.removeEventListener("load", run);
    };
  }, []);

  return null;
}
