import { isAuthenticated, AuthEnv } from "../_lib/auth";

interface Env extends AuthEnv {
  TOKENS: KVNamespace;
}

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  if (!(await isAuthenticated(request, env))) {
    return Response.json({ error: "Not authenticated" }, { status: 401 });
  }

  const body = (await request.json()) as { videoId?: string };
  if (!body.videoId) {
    return Response.json({ error: "Missing videoId" }, { status: 400 });
  }

  const raw = await env.TOKENS.get("hidden_ids");
  const hidden: string[] = raw ? JSON.parse(raw) : [];

  if (!hidden.includes(body.videoId)) {
    hidden.push(body.videoId);
    await env.TOKENS.put("hidden_ids", JSON.stringify(hidden));
  }

  return Response.json({ ok: true });
};
