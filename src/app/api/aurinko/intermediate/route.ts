import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const scope = searchParams.get("scope");

  if (!code || !state) {
    return NextResponse.json({ error: "Missing required parameters" }, { status: 400 });
  }

  const aurinkoCallbackUrl = `https://api.aurinko.io/v1/auth/callback?code=${encodeURIComponent(
    code
  )}&state=${encodeURIComponent(state)}${
    scope ? `&scope=${encodeURIComponent(scope)}` : ""
  }`;

  return NextResponse.redirect(aurinkoCallbackUrl);
}
