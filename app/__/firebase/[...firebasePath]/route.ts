import { NextResponse } from "next/server";

const helperDomain =
  process.env.NEXT_PUBLIC_FIREBASE_HELPER_DOMAIN ||
  process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN;

function buildTargetUrl(pathSegments, searchParams) {
  if (!helperDomain) {
    return null;
  }

  const safeSegments = pathSegments.map((segment) => encodeURIComponent(segment));
  const targetUrl = new URL(`https://${helperDomain}/__/firebase/${safeSegments.join("/")}`);

  for (const [key, value] of searchParams.entries()) {
    targetUrl.searchParams.append(key, value);
  }

  return targetUrl;
}

async function proxyFirebaseAsset(request, context) {
  const pathSegments = context.params?.firebasePath || [];
  const targetUrl = buildTargetUrl(pathSegments, request.nextUrl.searchParams);

  if (!targetUrl) {
    return NextResponse.json(
      { error: "Firebase helper domain is not configured." },
      { status: 500 },
    );
  }

  const response = await fetch(targetUrl, {
    headers: request.headers,
    cache: "no-store",
    redirect: "manual",
  });

  const headers = new Headers(response.headers);
  headers.delete("content-encoding");
  headers.delete("content-length");

  return new NextResponse(response.body, {
    status: response.status,
    headers,
  });
}

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(request, context) {
  return proxyFirebaseAsset(request, context);
}

export async function HEAD(request, context) {
  return proxyFirebaseAsset(request, context);
}
