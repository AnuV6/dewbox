import { createSessionCookie, AuthEnv } from "../_lib/auth";

export const onRequestPost: PagesFunction<AuthEnv> = async ({ request, env }) => {
  const body = (await request.json()) as { password?: string };

  if (!body.password || body.password !== env.ADMIN_PASSWORD) {
    return Response.json({ error: "Wrong password" }, { status: 401 });
  }

  const cookie = await createSessionCookie(env);
  return new Response(JSON.stringify({ ok: true }), {
    headers: { "Content-Type": "application/json", "Set-Cookie": cookie },
  });
};
