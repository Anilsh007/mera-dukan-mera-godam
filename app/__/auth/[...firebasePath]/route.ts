import { NextRequest, NextResponse } from "next/server";

const helperDomain =
  process.env.NEXT_PUBLIC_FIREBASE_HELPER_DOMAIN ||
  process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN;

function buildTargetUrl(pathSegments, searchParams) {
  if (!helperDomain) {
    return null;
  }

  const safeSegments = pathSegments.map((segment) => encodeURIComponent(segment));
  const targetUrl = new URL(`https://${helperDomain}/__/auth/${safeSegments.join("/")}`);

  for (const [key, value] of searchParams.entries()) {
    targetUrl.searchParams.append(key, value);
  }

  return targetUrl;
}

async function proxyFirebaseAuth(request, context) {
  const pathSegments = context.params?.firebasePath || [];
  const targetUrl = buildTargetUrl(pathSegments, request.nextUrl.searchParams);

  if (!targetUrl) {
    return NextResponse.json(
      { error: "Firebase helper domain is not configured." },
      { status: 500 },
    );
  }

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("host", helperDomain);

  const response = await fetch(targetUrl, {
    method: request.method,
    headers: requestHeaders,
    body: request.method === "GET" || request.method === "HEAD"
      ? undefined
      : await request.arrayBuffer(),
    redirect: "manual",
  });

  const responseHeaders = new Headers(response.headers);
  responseHeaders.delete("content-encoding");
  responseHeaders.delete("content-length");

  return new NextResponse(response.body, {
    status: response.status,
    headers: responseHeaders,
  });
}

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(request, context) {
  return proxyFirebaseAuth(request, context);
}

export async function POST(request, context) {
  return proxyFirebaseAuth(request, context);
}

export async function PUT(request, context) {
  return proxyFirebaseAuth(request, context);
}

export async function PATCH(request, context) {
  return proxyFirebaseAuth(request, context);
}

export async function DELETE(request, context) {
  return proxyFirebaseAuth(request, context);
}

export async function HEAD(request, context) {
  return proxyFirebaseAuth(request, context);
}

export async function OPTIONS(request, context) {
  return proxyFirebaseAuth(request, context);
}
