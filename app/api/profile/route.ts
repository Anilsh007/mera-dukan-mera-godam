import { NextRequest, NextResponse } from "next/server";
import {
  createSupabaseAdminClient,
  getUserIdentityFromRequest,
  toApiErrorResponse,
} from "@/app/api/_lib/auth";
import {
  assertContentLength,
  readJsonBody,
  enforceRateLimit,
  sanitizeOptionalText,
  sanitizeRequiredText,
  SecurityError,
} from "@/app/api/_lib/security";

export const runtime = "nodejs";

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
    return toApiErrorResponse(error, "Unexpected profile API error");
  }
}

export async function POST(request: NextRequest) {
  try {
    enforceRateLimit(request, { key: "profile:post", limit: 30, windowMs: 60_000 });
    assertContentLength(request, 256 * 1024);
    const userId = await getUserIdentityFromRequest(request);
    const profile = validateProfilePayload(await readJsonBody<ProfilePayload>(request));
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
    return toApiErrorResponse(error, "Unexpected profile API error");
  }
}

export async function DELETE(request: NextRequest) {
  try {
    enforceRateLimit(request, { key: "profile:delete", limit: 10, windowMs: 60_000 });
    const userId = await getUserIdentityFromRequest(request);
    const supabase = createSupabaseAdminClient();

    const { error } = await supabase
      .from("profiles")
      .delete()
      .eq("user_id", userId);

    if (error) {
      return NextResponse.json(
        { code: error.code, message: error.message, details: error.details, hint: error.hint },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return toApiErrorResponse(error, "Unexpected profile delete API error");
  }
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
  const payload = data.payload && typeof data.payload === "object"
    ? data.payload as Record<string, unknown>
    : null
  const personal = payload?.personal && typeof payload.personal === "object"
    ? payload.personal as Record<string, unknown>
    : null
  const business = payload?.business && typeof payload.business === "object"
    ? payload.business as Record<string, unknown>
    : null
  const address = payload?.address && typeof payload.address === "object"
    ? payload.address as Record<string, unknown>
    : null
  const banking = payload?.banking && typeof payload.banking === "object"
    ? payload.banking as Record<string, unknown>
    : null
  const settings = payload?.settings && typeof payload.settings === "object"
    ? payload.settings as Record<string, unknown>
    : null

  return {
    userId,
    updatedAt: String(data.updated_at ?? payload?.updatedAt ?? ""),
    personal: {
      displayName: String(data.display_name ?? personal?.displayName ?? ""),
      email: String(data.email ?? personal?.email ?? ""),
      photoURL: String(data.photo_url ?? personal?.photoURL ?? personal?.photoUrl ?? ""),
      phone: String(data.phone ?? personal?.phone ?? ""),
      alternateEmail: String(data.alternate_email ?? personal?.alternateEmail ?? ""),
    },
    business: {
      shopName: String(data.shop_name ?? business?.shopName ?? ""),
      gstNumber: String(data.gst_number ?? business?.gstNumber ?? ""),
      businessType: String(data.business_type ?? business?.businessType ?? ""),
      upiId: String(data.upi_id ?? business?.upiId ?? ""),
      invoicePrefix: String(data.invoice_prefix ?? business?.invoicePrefix ?? "INV"),
    },
    address: {
      address: String(data.address ?? address?.address ?? ""),
      district: String(data.district ?? address?.district ?? ""),
      state: String(data.state ?? address?.state ?? ""),
      pincode: String(data.pincode ?? address?.pincode ?? ""),
    },
    banking: {
      accountHolderName: String(data.account_holder_name ?? banking?.accountHolderName ?? ""),
      accountNumber: String(data.account_number ?? banking?.accountNumber ?? ""),
      ifscCode: String(data.ifsc_code ?? banking?.ifscCode ?? ""),
      bankName: String(data.bank_name ?? banking?.bankName ?? ""),
    },
    settings: {
      termsAndConditions: String(data.terms_and_conditions ?? settings?.termsAndConditions ?? ""),
    },
  };
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
      businessType: sanitizeOptionalText(profile.business?.businessType, 50) || "",
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
