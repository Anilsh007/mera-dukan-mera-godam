import { EXACT_UI_TEXT_TRANSLATIONS, MESSAGE_OVERLAYS } from "@/app/messages/locales/ui";
export type LanguageCode =
  | "en" | "hi" | "bn" | "te" | "mr" | "ta" | "ur" | "gu" | "kn" | "ml" | "or"
  | "pa" | "as" | "mai" | "sat" | "ks" | "ne" | "sd" | "kok" | "doi" | "mni" | "brx" | "sa";

export type LanguageOption = {
  code: LanguageCode;
  nativeName: string;
  englishName: string;
  locale: string;
};

export const LANGUAGE_STORAGE_KEY = "mdmg-language";
export const LANGUAGE_COOKIE_NAME = "mdmg_language";

export const INDIAN_LANGUAGE_OPTIONS: LanguageOption[] = [
  { code: "en", nativeName: "English", englishName: "English", locale: "en-IN" },
  { code: "hi", nativeName: "हिन्दी", englishName: "Hindi", locale: "hi-IN" },
  { code: "bn", nativeName: "বাংলা", englishName: "Bengali", locale: "bn-IN" },
  { code: "te", nativeName: "తెలుగు", englishName: "Telugu", locale: "te-IN" },
  { code: "mr", nativeName: "मराठी", englishName: "Marathi", locale: "mr-IN" },
  { code: "ta", nativeName: "தமிழ்", englishName: "Tamil", locale: "ta-IN" },
  { code: "ur", nativeName: "اردو", englishName: "Urdu", locale: "ur-IN" },
  { code: "gu", nativeName: "ગુજરાતી", englishName: "Gujarati", locale: "gu-IN" },
  { code: "kn", nativeName: "ಕನ್ನಡ", englishName: "Kannada", locale: "kn-IN" },
  { code: "ml", nativeName: "മലയാളം", englishName: "Malayalam", locale: "ml-IN" },
  { code: "or", nativeName: "ଓଡ଼ିଆ", englishName: "Odia", locale: "or-IN" },
  { code: "pa", nativeName: "ਪੰਜਾਬੀ", englishName: "Punjabi", locale: "pa-IN" },
  { code: "as", nativeName: "অসমীয়া", englishName: "Assamese", locale: "as-IN" },
  { code: "mai", nativeName: "मैथिली", englishName: "Maithili", locale: "mai-IN" },
  { code: "sat", nativeName: "ᱥᱟᱱᱛᱟᱲᱤ", englishName: "Santali", locale: "sat-IN" },
  { code: "ks", nativeName: "کٲشُر", englishName: "Kashmiri", locale: "ks-IN" },
  { code: "ne", nativeName: "नेपाली", englishName: "Nepali", locale: "ne-IN" },
  { code: "sd", nativeName: "سنڌي", englishName: "Sindhi", locale: "sd-IN" },
  { code: "kok", nativeName: "कोंकणी", englishName: "Konkani", locale: "kok-IN" },
  { code: "doi", nativeName: "डोगरी", englishName: "Dogri", locale: "doi-IN" },
  { code: "mni", nativeName: "ꯃꯤꯇꯩ ꯂꯣꯟ", englishName: "Manipuri", locale: "mni-IN" },
  { code: "brx", nativeName: "बरʼ", englishName: "Bodo", locale: "brx-IN" },
  { code: "sa", nativeName: "संस्कृतम्", englishName: "Sanskrit", locale: "sa-IN" },
];

const overlay: Partial<Record<LanguageCode, Record<string, string>>> = MESSAGE_OVERLAYS;


export function getLanguageOption(code: string | null | undefined) {
  return INDIAN_LANGUAGE_OPTIONS.find((language) => language.code === code) || INDIAN_LANGUAGE_OPTIONS[0];
}

export function getCurrentLanguage(): LanguageCode {
  if (typeof window === "undefined") return "en";
  const saved = window.localStorage.getItem(LANGUAGE_STORAGE_KEY) as LanguageCode | null;
  return getLanguageOption(saved).code;
}

function proxyObject<T extends object>(base: T, path: string[] = []): T {
  return new Proxy(base, {
    get(target, prop, receiver) {
      if (typeof prop !== "string") return Reflect.get(target, prop, receiver);
      const value = Reflect.get(target, prop, receiver);
      const fullPath = [...path, prop];
      if (value && typeof value === "object" && !Array.isArray(value)) {
        return proxyObject(value as Record<string, unknown>, fullPath);
      }
      if (typeof value === "string") {
        const lang = getCurrentLanguage();
        return overlay[lang]?.[fullPath.join(".")] ?? translateUiText(value);
      }
      return value;
    },
  });
}

export function createMessageProxy<T extends object>(base: T): T {
  return proxyObject(base);
}

export function persistLanguage(code: LanguageCode) {
  const option = getLanguageOption(code);
  if (typeof window === "undefined") return;
  window.localStorage.setItem(LANGUAGE_STORAGE_KEY, option.code);
  document.cookie = `${LANGUAGE_COOKIE_NAME}=${option.code}; path=/; max-age=31536000; SameSite=Lax`;
  document.documentElement.lang = option.locale;
  document.documentElement.dir = option.code === "ur" || option.code === "ks" || option.code === "sd" ? "rtl" : "ltr";
  window.dispatchEvent(new CustomEvent("languagechange", { detail: option }));
}

const exactUiTextTranslations: Partial<Record<LanguageCode, Record<string, string>>> = EXACT_UI_TEXT_TRANSLATIONS;


const wordGlossaries: Partial<Record<LanguageCode, Record<string, string>>> = {
  hi: {
    "Inventory": "इन्वेंटरी", "Stock": "स्टॉक", "Product": "प्रोडक्ट", "Products": "प्रोडक्ट", "Purchase": "खरीद", "Purchases": "खरीद", "Supplier": "सप्लायर", "Suppliers": "सप्लायर", "Invoice": "इनवॉइस", "Invoices": "इनवॉइस", "GST": "GST", "Reports": "रिपोर्ट्स", "Settings": "सेटिंग्स", "Profile": "प्रोफाइल", "Dashboard": "डैशबोर्ड", "Search": "खोजें", "Save": "सेव", "Add": "जोड़ें", "Edit": "एडिट", "Delete": "डिलीट", "Remove": "हटाएं", "Download": "डाउनलोड", "Print": "प्रिंट", "Open": "खोलें", "Close": "बंद करें", "Back": "वापस", "Next": "अगला", "Previous": "पिछला", "Total": "कुल", "Balance": "बैलेंस", "Paid": "भुगतान", "Due": "बकाया", "Amount": "राशि", "Rate": "रेट", "Quantity": "मात्रा", "Qty": "मात्रा", "Unit": "यूनिट", "Category": "कैटेगरी", "Code": "कोड", "Date": "तारीख", "Expiry": "एक्सपायरी", "Buyer": "खरीदार", "Seller": "विक्रेता", "Address": "पता", "Phone": "फोन", "Email": "ईमेल", "Name": "नाम", "Bank": "बैंक", "Payment": "भुगतान", "Details": "विवरण", "History": "हिस्ट्री", "Value": "वैल्यू", "Low": "लो", "High": "हाई", "Warning": "चेतावनी", "Available": "उपलब्ध", "Loading": "लोड हो रहा है", "No": "कोई नहीं", "All": "सभी", "Clear": "साफ करें", "Select": "चुनें", "Required": "जरूरी", "Optional": "वैकल्पिक", "Description": "विवरण", "Note": "नोट", "Notes": "नोट्स", "Reason": "कारण", "Sale": "सेल", "Sales": "बिक्री", "Today": "आज", "Business": "बिजनेस", "Shop": "दुकान", "Data": "डेटा", "Page": "पेज", "Items": "आइटम", "Item": "आइटम", "Create": "बनाएं", "Update": "अपडेट", "Successful": "सफल", "Failed": "असफल", "Error": "त्रुटि", "Please": "कृपया", "Enter": "दर्ज करें", "Choose": "चुनें", "Filter": "फिल्टर", "Filters": "फिल्टर", "Found": "मिला", "Ready": "तैयार", "Cash": "नकद", "Card": "कार्ड"
  },
  bn: { "Inventory": "ইনভেন্টরি", "Stock": "স্টক", "Product": "পণ্য", "Products": "পণ্য", "Purchase": "ক্রয়", "Supplier": "সরবরাহকারী", "Invoice": "ইনভয়েস", "Reports": "রিপোর্ট", "Settings": "সেটিংস", "Profile": "প্রোফাইল", "Search": "খুঁজুন", "Save": "সংরক্ষণ", "Add": "যোগ করুন", "Total": "মোট", "Date": "তারিখ", "Quantity": "পরিমাণ", "Rate": "রেট", "Payment": "পেমেন্ট", "Due": "বকেয়া", "Paid": "পেইড" },
  ta: { "Inventory": "சரக்கு", "Stock": "ஸ்டாக்", "Product": "தயாரிப்பு", "Products": "தயாரிப்புகள்", "Purchase": "கொள்முதல்", "Supplier": "சப்ளையர்", "Invoice": "இன்வாய்ஸ்", "Reports": "அறிக்கைகள்", "Settings": "அமைப்புகள்", "Profile": "சுயவிவரம்", "Search": "தேடு", "Save": "சேமி", "Add": "சேர்", "Total": "மொத்தம்", "Date": "தேதி", "Quantity": "அளவு", "Rate": "விலை", "Payment": "பணம்", "Due": "நிலுவை", "Paid": "செலுத்தியது" },
  te: { "Inventory": "ఇన్వెంటరీ", "Stock": "స్టాక్", "Product": "ఉత్పత్తి", "Products": "ఉత్పత్తులు", "Purchase": "కొనుగోలు", "Supplier": "సరఫరాదారు", "Invoice": "ఇన్వాయిస్", "Reports": "రిపోర్టులు", "Settings": "సెట్టింగ్స్", "Profile": "ప్రొఫైల్", "Search": "శోధించండి", "Save": "సేవ్", "Add": "జోడించండి", "Total": "మొత్తం", "Date": "తేదీ", "Quantity": "పరిమాణం", "Rate": "రేట్", "Payment": "చెల్లింపు", "Due": "బకాయి", "Paid": "చెల్లించారు" },
  mr: { "Inventory": "इन्व्हेंटरी", "Stock": "स्टॉक", "Product": "उत्पादन", "Products": "उत्पादने", "Purchase": "खरेदी", "Supplier": "पुरवठादार", "Invoice": "इनव्हॉइस", "Reports": "अहवाल", "Settings": "सेटिंग्ज", "Profile": "प्रोफाइल", "Search": "शोधा", "Save": "सेव्ह", "Add": "जोडा", "Total": "एकूण", "Date": "तारीख", "Quantity": "प्रमाण", "Rate": "दर", "Payment": "पेमेंट", "Due": "बाकी", "Paid": "भरले" },
  gu: { "Inventory": "ઇન્વેન્ટરી", "Stock": "સ્ટોક", "Product": "ઉત્પાદન", "Products": "ઉત્પાદનો", "Purchase": "ખરીદી", "Supplier": "સપ્લાયર", "Invoice": "ઇનવોઇસ", "Reports": "રિપોર્ટ્સ", "Settings": "સેટિંગ્સ", "Profile": "પ્રોફાઇલ", "Search": "શોધો", "Save": "સેવ", "Add": "ઉમેરો", "Total": "કુલ", "Date": "તારીખ", "Quantity": "જથ્થો", "Rate": "દર", "Payment": "ચુકવણી", "Due": "બાકી", "Paid": "ચૂકવ્યું" }
};

export function normalizeUiText(value: string) {
  return value
    .replace(/[\u00a0\u200b]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

const phraseGlossaries: Partial<Record<LanguageCode, Record<string, string>>> = {
  hi: {
    "Inventory and GST billing for Indian shops": "भारतीय दुकानों के लिए इन्वेंटरी और GST बिलिंग",
    "Track stock, manage products, monitor sales, handle expiry alerts, and create GST invoices from one dashboard.": "एक ही डैशबोर्ड से स्टॉक ट्रैक करें, प्रोडक्ट मैनेज करें, बिक्री देखें, एक्सपायरी अलर्ट संभालें और GST इनवॉइस बनाएं।",
    "Inventory and billing workspace": "इन्वेंटरी और बिलिंग वर्कस्पेस",
    "See today's inventory, sales, and priority actions in one place so you can run your shop with confidence.": "आज की इन्वेंटरी, बिक्री और जरूरी काम एक जगह देखें ताकि दुकान भरोसे से चला सकें।",
    "Add products, restock items, and save supplier details.": "प्रोडक्ट जोड़ें, आइटम रीस्टॉक करें और सप्लायर विवरण सेव करें।",
    "Check sales, stock movement, and invoice-ready entries in one place.": "बिक्री, स्टॉक मूवमेंट और इनवॉइस-रेडी एंट्री एक जगह देखें।",
    "Open Expiry Alerts to review priority items.": "जरूरी आइटम देखने के लिए एक्सपायरी अलर्ट खोलें।",
    "Add incoming stock quickly. Use the Purchases module for full purchase bill records.": "आने वाला स्टॉक जल्दी जोड़ें। पूरे खरीद बिल रिकॉर्ड के लिए Purchases मॉड्यूल इस्तेमाल करें।",
    "Find products, review low stock, add or remove stock, record sales, and check earlier entries.": "प्रोडक्ट खोजें, लो स्टॉक देखें, स्टॉक जोड़ें/हटाएं, बिक्री रिकॉर्ड करें और पुरानी एंट्री जांचें।",
    "Track stock movement, sales, corrections, and printable stock entries.": "स्टॉक मूवमेंट, बिक्री, सुधार और प्रिंट योग्य स्टॉक एंट्री ट्रैक करें।",
    "Review products that are near expiry, expired, or need attention soon.": "जिन प्रोडक्ट की एक्सपायरी पास है, हो चुकी है या ध्यान चाहिए, उन्हें देखें।",
    "Create GST invoices with buyer, seller, item, tax, and payment details.": "खरीदार, विक्रेता, आइटम, टैक्स और भुगतान विवरण के साथ GST इनवॉइस बनाएं।",
    "Add purchase bills, supplier dues, and payment details in one place.": "खरीद बिल, सप्लायर बकाया और भुगतान विवरण एक जगह जोड़ें।",
    "Track supplier dues, settled accounts, and record payments from one place.": "सप्लायर बकाया, सेटल्ड अकाउंट और भुगतान एक जगह ट्रैक करें।",
    "View inventory health, sales snapshots, and category trends at a glance.": "इन्वेंटरी हेल्थ, बिक्री स्नैपशॉट और कैटेगरी ट्रेंड एक नजर में देखें।",
    "Export all data or download filtered records for a selected date range.": "सारा डेटा एक्सपोर्ट करें या चुनी तारीख सीमा के रिकॉर्ड डाउनलोड करें।",
    "Update your business details to personalize the app and generate accurate invoices.": "ऐप को पर्सनलाइज़ करने और सही इनवॉइस बनाने के लिए बिजनेस विवरण अपडेट करें।",
    "Street, Landmark, etc.": "गली, लैंडमार्क आदि",
    "City name": "शहर का नाम",
    "10 digit mobile number": "10 अंकों का मोबाइल नंबर",
    "Item name, code, supplier": "आइटम नाम, कोड, सप्लायर",
    "Search product, supplier, code": "प्रोडक्ट, सप्लायर, कोड खोजें",
    "Transport, bill remarks, delivery note": "ट्रांसपोर्ट, बिल टिप्पणी, डिलीवरी नोट",
    "Leave blank to auto-generate": "ऑटो-जेनरेट के लिए खाली छोड़ें",
    "Optional bill no": "वैकल्पिक बिल नंबर",
    "business@example.com": "business@example.com",
    "yourname@upi": "yourname@upi",
    "6 digits": "6 अंक",
    "Quantity unit": "मात्रा यूनिट",
    "Toggle theme": "थीम बदलें",
    "Choose language": "भाषा चुनें",
    "Print Receipt": "रसीद प्रिंट करें",
    "Stock add": "स्टॉक जोड़ें",
    "Add Stock": "स्टॉक जोड़ें",
    "Remove Stock": "स्टॉक हटाएं",
    "Set Stock Warnings": "स्टॉक चेतावनी सेट करें",
    "Hide Warning Settings": "चेतावनी सेटिंग छिपाएं",
    "More Details": "अधिक विवरण",
    "Less Details": "कम विवरण",
    "Save Changes": "बदलाव सेव करें",
    "Save Quick Purchase": "क्विक खरीद सेव करें",
    "Add another item": "एक और आइटम जोड़ें",
    "Add More Products": "और प्रोडक्ट जोड़ें",
    "Back to Home": "होम पर वापस",
    "Back to Profile": "प्रोफाइल पर वापस",
    "What Can We Help With?": "हम किसमें मदद कर सकते हैं?",
    "Your Feedback Matters": "आपकी प्रतिक्रिया महत्वपूर्ण है",
    "Help Center": "सहायता केंद्र",
    "About The Platform": "प्लेटफॉर्म के बारे में",
    "Business Inquiries": "बिजनेस पूछताछ",
    "Support": "सहायता",
    "FAQ": "अक्सर पूछे जाने वाले सवाल",
    "Terms": "नियम",
    "Privacy Policy": "गोपनीयता नीति"
  }
};

const uiSignalWords = [
  "inventory", "stock", "product", "purchase", "supplier", "invoice", "gst", "report", "setting", "profile", "dashboard",
  "search", "save", "add", "edit", "delete", "remove", "download", "print", "open", "close", "back", "next", "previous",
  "total", "balance", "paid", "due", "amount", "rate", "quantity", "unit", "category", "code", "date", "expiry", "buyer", "seller",
  "address", "phone", "email", "name", "bank", "payment", "detail", "history", "value", "warning", "available", "loading",
  "select", "required", "optional", "description", "note", "reason", "sale", "business", "shop", "data", "page", "item", "create",
  "update", "successful", "failed", "error", "please", "enter", "choose", "filter", "placeholder", "tagline", "support", "privacy", "terms"
];

const neverTranslatePatterns = [
  /^[-+]?\d+(\.\d+)?%?$/,
  /^[#₹$€£]?[\d,]+(\.\d+)?$/,
  /^[A-Z0-9_-]{2,}$/,
  /^https?:\/\//i,
  /^[\w.+-]+@[\w.-]+\.[A-Za-z]{2,}$/,
  /^\w+(?:-\w+)*:\S+$/,
  /^var\(--/,
  /^linear-gradient\(/,
  /[{}<>]/,
];

function hasLetters(value: string) {
  return /[A-Za-z]/.test(value);
}

function shouldNeverTranslate(value: string) {
  const key = normalizeUiText(value);
  if (!key || key.length < 2) return true;
  return neverTranslatePatterns.some((pattern) => pattern.test(key));
}

export function isProbablyUiText(value: string, uiText?: Record<string, string>) {
  const key = normalizeUiText(value);
  if (!key || shouldNeverTranslate(key) || !hasLetters(key)) return false;
  if (uiText?.[key] || exactUiTextTranslations[getCurrentLanguage()]?.[key]) return true;
  if (key.length <= 2 || key.length > 260) return false;
  const lower = key.toLowerCase();
  return uiSignalWords.some((word) => lower.includes(word));
}

function applyPhraseGlossary(text: string, language: LanguageCode) {
  const phrases = phraseGlossaries[language];
  if (!phrases) return text;
  let translated = text;
  for (const [english, localized] of Object.entries(phrases).sort((a, b) => b[0].length - a[0].length)) {
    translated = translated.replace(new RegExp(escapeRegExp(english), "gi"), localized);
  }
  return translated;
}

function applyWordGlossary(text: string, language: LanguageCode) {
  const glossary = wordGlossaries[language];
  if (!glossary) return text;
  let translated = text;
  for (const [english, localized] of Object.entries(glossary).sort((a, b) => b[0].length - a[0].length)) {
    translated = translated.replace(new RegExp(`\\b${escapeRegExp(english)}\\b`, "gi"), localized);
  }
  return translated;
}

export function translateUiText(value: string, uiText?: Record<string, string>) {
  const key = normalizeUiText(value);
  if (!key || shouldNeverTranslate(key)) return value;
  const language = getCurrentLanguage();
  if (language === "en") return key;
  const exact = exactUiTextTranslations[language]?.[key];
  if (exact) return exact;
  const fromMessages = uiText?.[key];
  const registered = fromMessages && fromMessages !== key ? fromMessages : key;
  const phraseResult = applyPhraseGlossary(registered, language);
  const glossaryResult = applyWordGlossary(phraseResult, language);
  return glossaryResult || key;
}
