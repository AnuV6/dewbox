import { isAuthenticated, AuthEnv } from "../_lib/auth";

export const onRequestGet: PagesFunction<AuthEnv> = async ({ request, env }) => {
  const authed = await isAuthenticated(request, env);
  return Response.json({ authenticated: authed });
};
