import { getAccessToken, YtEnv } from "../_lib/youtube";
import { isAuthenticated, AuthEnv } from "../_lib/auth";

export const onRequestPost: PagesFunction<YtEnv & AuthEnv> = async ({ request, env }) => {
  if (!(await isAuthenticated(request, env))) {
    return Response.json({ error: "Not authenticated" }, { status: 401 });
  }

  try {
    const accessToken = await getAccessToken(env);

    const form = await request.formData();
    const file = form.get("video");
    const title = String(form.get("title") ?? "Untitled");
    const description = String(form.get("description") ?? "");
    const tags = String(form.get("tags") ?? "")
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);

    if (!(file instanceof File)) {
      return Response.json({ error: "No video file provided" }, { status: 400 });
    }

    const metadata = {
      snippet: { title, description, tags },
      status: { privacyStatus: "unlisted" },
    };

    const initRes = await fetch(
      "https://www.googleapis.com/upload/youtube/v3/videos?uploadType=resumable&part=snippet,status",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json; charset=UTF-8",
          "X-Upload-Content-Type": file.type || "video/*",
          "X-Upload-Content-Length": String(file.size),
        },
        body: JSON.stringify(metadata),
      }
    );

    if (!initRes.ok) {
      return Response.json({ error: await initRes.text() }, { status: 502 });
    }

    const uploadUrl = initRes.headers.get("Location");
    if (!uploadUrl) {
      return Response.json({ error: "No upload URL returned by YouTube" }, { status: 502 });
    }

    const uploadRes = await fetch(uploadUrl, {
      method: "PUT",
      headers: {
        "Content-Type": file.type || "video/*",
        "Content-Length": String(file.size),
      },
      body: file.stream(),
    });

    if (!uploadRes.ok) {
      return Response.json({ error: await uploadRes.text() }, { status: 502 });
    }

    const result = await uploadRes.json();
    return Response.json({ video: result });
  } catch (err) {
    return Response.json({ error: (err as Error).message }, { status: 500 });
  }
};
