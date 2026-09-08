interface Env {
  GOOGLE_CLIENT_ID: string;
  GOOGLE_CLIENT_SECRET: string;
  OAUTH_REDIRECT_URI: string;
  TOKENS: KVNamespace;
}

export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  if (!code) {
    return new Response("Missing code", { status: 400 });
  }

  const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: env.GOOGLE_CLIENT_ID,
      client_secret: env.GOOGLE_CLIENT_SECRET,
      redirect_uri: env.OAUTH_REDIRECT_URI,
      grant_type: "authorization_code",
    }),
  });

  if (!tokenRes.ok) {
    const errText = await tokenRes.text();
    return new Response(`OAuth exchange failed: ${errText}`, { status: 502 });
  }

  const tokens = (await tokenRes.json()) as {
    refresh_token?: string;
    access_token: string;
    expires_in: number;
  };

  if (!tokens.refresh_token) {
    return new Response(
      "No refresh token returned. Revoke app access at https://myaccount.google.com/permissions and try connecting again.",
      { status: 400 }
    );
  }

  await env.TOKENS.put("yt_refresh_token", tokens.refresh_token);

  return Response.redirect(new URL("/upload.html?connected=1", request.url).toString(), 302);
};
