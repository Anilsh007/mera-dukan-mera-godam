import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";
import { createVerify } from "node:crypto";
import { normalizeUserIdentity } from "@/app/lib/userIdentity";
import {
  assertContentLength,
  enforceRateLimit,
  sanitizeOptionalText,
  sanitizeRequiredText,
  SecurityError,
} from "@/app/api/_lib/security";

export const runtime = "nodejs";

const FIREBASE_CERTS_URL =
  "https://www.googleapis.com/robot/v1/metadata/x509/securetoken@system.gserviceaccount.com";

type ProfilePayload = {
  personal: {
    displayName: string;
    email: string;
    photoURL: string;
    phone: string;
    alternateEmail: string;
  };
  business: {
    shopName: string;
    gstNumber: string;
    businessType: string;
    upiId: string;
    invoicePrefix: string;
  };
  address: {
    address: string;
    district: string;
    state: string;
    pincode: string;
  };
  banking: {
    accountHolderName: string;
    accountNumber: string;
    ifscCode: string;
    bankName: string;
  };
  settings: {
    termsAndConditions: string;
  };
};

type FirebaseTokenPayload = {
  aud: string;
  email?: string;
  auth_time?: number;
  exp: number;
  iat: number;
  iss: string;
  sub: string;
  user_id?: string;
};

export async function GET(request: NextRequest) {
  try {
    enforceRateLimit(request, { key: "profile:get", limit: 60, windowMs: 60_000 });
    const userId = await getUserIdentityFromRequest(request);
    const supabase = createSupabaseAdminClient();

    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();

    if (error) {
      return NextResponse.json(
        { code: error.code, message: error.message, details: error.details, hint: error.hint },
        { status: 500 }
      );
    }

    if (!data) {
      return NextResponse.json({ message: "Profile not found" }, { status: 404 });
    }

    return NextResponse.json(mapDbToProfile(data, userId));
  } catch (error) {
    return toErrorResponse(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    enforceRateLimit(request, { key: "profile:post", limit: 30, windowMs: 60_000 });
    assertContentLength(request, 256 * 1024);
    const userId = await getUserIdentityFromRequest(request);
    const profile = validateProfilePayload((await request.json()) as ProfilePayload);
    const payload = mapProfileToDb(profile, userId);
    const supabase = createSupabaseAdminClient();

    const { error } = await supabase.from("profiles").upsert(payload, {
      onConflict: "user_id",
    });

    if (error) {
      return NextResponse.json(
        { code: error.code, message: error.message, details: error.details, hint: error.hint },
        { status: 500 }
      );
    }

    return NextResponse.json({
      ...profile,
      userId,
      updatedAt: payload.updated_at,
    });
  } catch (error) {
    return toErrorResponse(error);
  }
}

function createSupabaseAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error("Supabase server credentials are not configured");
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

async function getUserIdentityFromRequest(request: NextRequest) {
  const authorization = request.headers.get("authorization");

  if (!authorization?.startsWith("Bearer ")) {
    throw new ApiError("Missing Firebase token", 401);
  }

  const token = authorization.slice("Bearer ".length);
  const payload = await verifyFirebaseToken(token);
  const email = payload.email;

  if (!email) {
    throw new ApiError("Firebase token is missing email", 401);
  }

  return normalizeUserIdentity(email);
}

async function verifyFirebaseToken(token: string): Promise<FirebaseTokenPayload> {
  const [encodedHeader, encodedPayload, encodedSignature] = token.split(".");

  if (!encodedHeader || !encodedPayload || !encodedSignature) {
    throw new ApiError("Invalid Firebase token format", 401);
  }

  const header = JSON.parse(base64UrlDecode(encodedHeader)) as { alg?: string; kid?: string };
  const payload = JSON.parse(base64UrlDecode(encodedPayload)) as FirebaseTokenPayload;
  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;

  if (!projectId) {
    throw new Error("Firebase project id is not configured");
  }

  if (header.alg !== "RS256" || !header.kid) {
    throw new ApiError("Unsupported Firebase token header", 401);
  }

  if (payload.aud !== projectId) {
    throw new ApiError("Firebase token audience mismatch", 401);
  }

  if (payload.iss !== `https://securetoken.google.com/${projectId}`) {
    throw new ApiError("Firebase token issuer mismatch", 401);
  }

  if (!payload.sub) {
    throw new ApiError("Firebase token subject is missing", 401);
  }

  const now = Math.floor(Date.now() / 1000);
  if (payload.exp <= now || payload.iat > now) {
    throw new ApiError("Firebase token is expired or invalid", 401);
  }

  const certificates = await fetchFirebaseCertificates();
  const certificate = certificates[header.kid];

  if (!certificate) {
    throw new ApiError("Firebase signing certificate not found", 401);
  }

  const verifier = createVerify("RSA-SHA256");
  verifier.update(`${encodedHeader}.${encodedPayload}`);
  verifier.end();

  const isValid = verifier.verify(certificate, base64UrlToBuffer(encodedSignature));
  if (!isValid) {
    throw new ApiError("Firebase token signature verification failed", 401);
  }

  return payload;
}

async function fetchFirebaseCertificates(): Promise<Record<string, string>> {
  const response = await fetch(FIREBASE_CERTS_URL, {
    next: { revalidate: 3600 },
  });

  if (!response.ok) {
    throw new Error("Unable to fetch Firebase signing certificates");
  }

  return (await response.json()) as Record<string, string>;
}

function mapProfileToDb(profile: ProfilePayload, userId: string) {
  return {
    user_id: userId,
    updated_at: new Date().toISOString(),
    display_name: profile.personal.displayName,
    email: profile.personal.email,
    photo_url: profile.personal.photoURL,
    phone: profile.personal.phone,
    alternate_email: profile.personal.alternateEmail,
    shop_name: profile.business.shopName,
    gst_number: profile.business.gstNumber,
    business_type: profile.business.businessType,
    upi_id: profile.business.upiId,
    invoice_prefix: profile.business.invoicePrefix,
    address: profile.address.address,
    district: profile.address.district,
    state: profile.address.state,
    pincode: profile.address.pincode,
    account_holder_name: profile.banking.accountHolderName,
    account_number: profile.banking.accountNumber,
    ifsc_code: profile.banking.ifscCode,
    bank_name: profile.banking.bankName,
    terms_and_conditions: profile.settings.termsAndConditions,
  };
}

function mapDbToProfile(data: Record<string, unknown>, userId: string) {
  return {
    userId,
    updatedAt: String(data.updated_at ?? ""),
    personal: {
      displayName: String(data.display_name ?? ""),
      email: String(data.email ?? ""),
      photoURL: String(data.photo_url ?? ""),
      phone: String(data.phone ?? ""),
      alternateEmail: String(data.alternate_email ?? ""),
    },
    business: {
      shopName: String(data.shop_name ?? ""),
      gstNumber: String(data.gst_number ?? ""),
      businessType: String(data.business_type ?? "retail"),
      upiId: String(data.upi_id ?? ""),
      invoicePrefix: String(data.invoice_prefix ?? "INV"),
    },
    address: {
      address: String(data.address ?? ""),
      district: String(data.district ?? ""),
      state: String(data.state ?? ""),
      pincode: String(data.pincode ?? ""),
    },
    banking: {
      accountHolderName: String(data.account_holder_name ?? ""),
      accountNumber: String(data.account_number ?? ""),
      ifscCode: String(data.ifsc_code ?? ""),
      bankName: String(data.bank_name ?? ""),
    },
    settings: {
      termsAndConditions: String(data.terms_and_conditions ?? ""),
    },
  };
}

function toErrorResponse(error: unknown) {
  if (error instanceof SecurityError) {
    return NextResponse.json({ message: error.message }, { status: error.status });
  }

  if (error instanceof ApiError) {
    return NextResponse.json({ message: error.message }, { status: error.status });
  }

  const message = error instanceof Error ? error.message : "Unexpected profile API error";
  return NextResponse.json({ message }, { status: 500 });
}

function base64UrlDecode(value: string) {
  return Buffer.from(normalizeBase64Url(value), "base64").toString("utf8");
}

function base64UrlToBuffer(value: string) {
  return Buffer.from(normalizeBase64Url(value), "base64");
}

function normalizeBase64Url(value: string) {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
  const padding = (4 - (normalized.length % 4)) % 4;

  return `${normalized}${"=".repeat(padding)}`;
}

class ApiError extends Error {
  constructor(message: string, readonly status: number) {
    super(message);
  }
}

function validateProfilePayload(profile: ProfilePayload): ProfilePayload {
  if (!profile || typeof profile !== "object") {
    throw new SecurityError("Invalid profile payload", 400);
  }

  return {
    personal: {
      displayName: sanitizeOptionalText(profile.personal?.displayName, 120) || "",
      email: sanitizeOptionalText(profile.personal?.email, 160) || "",
      photoURL: sanitizeOptionalText(profile.personal?.photoURL, 500) || "",
      phone: sanitizeOptionalText(profile.personal?.phone, 30) || "",
      alternateEmail: sanitizeOptionalText(profile.personal?.alternateEmail, 160) || "",
    },
    business: {
      shopName: sanitizeRequiredText(profile.business?.shopName, 160, "Shop name"),
      gstNumber: sanitizeOptionalText(profile.business?.gstNumber, 30) || "",
      businessType: sanitizeOptionalText(profile.business?.businessType, 50) || "retail",
      upiId: sanitizeOptionalText(profile.business?.upiId, 80) || "",
      invoicePrefix: sanitizeOptionalText(profile.business?.invoicePrefix, 20) || "INV",
    },
    address: {
      address: sanitizeRequiredText(profile.address?.address, 300, "Address"),
      district: sanitizeRequiredText(profile.address?.district, 120, "District"),
      state: sanitizeRequiredText(profile.address?.state, 120, "State"),
      pincode: sanitizeRequiredText(profile.address?.pincode, 20, "Pincode"),
    },
    banking: {
      accountHolderName: sanitizeOptionalText(profile.banking?.accountHolderName, 160) || "",
      accountNumber: sanitizeOptionalText(profile.banking?.accountNumber, 40) || "",
      ifscCode: sanitizeOptionalText(profile.banking?.ifscCode, 20) || "",
      bankName: sanitizeOptionalText(profile.banking?.bankName, 160) || "",
    },
    settings: {
      termsAndConditions: sanitizeOptionalText(profile.settings?.termsAndConditions, 3000) || "",
    },
  };
}
