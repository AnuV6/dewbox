import { getAccessToken, YtEnv } from "../_lib/youtube";

export const onRequestGet: PagesFunction<YtEnv> = async ({ env }) => {
  try {
    const accessToken = await getAccessToken(env);
    const authHeader = { Authorization: `Bearer ${accessToken}` };

    const channelRes = await fetch(
      "https://www.googleapis.com/youtube/v3/channels?part=contentDetails&mine=true",
      { headers: authHeader }
    );
    if (!channelRes.ok) throw new Error(await channelRes.text());
    const channelData = (await channelRes.json()) as {
      items: { contentDetails: { relatedPlaylists: { uploads: string } } }[];
    };
    const uploadsPlaylistId = channelData.items[0]?.contentDetails.relatedPlaylists.uploads;
    if (!uploadsPlaylistId) {
      return Response.json({ videos: [] });
    }

    const playlistRes = await fetch(
      `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&maxResults=50&playlistId=${uploadsPlaylistId}`,
      { headers: authHeader }
    );
    if (!playlistRes.ok) throw new Error(await playlistRes.text());
    const playlistData = (await playlistRes.json()) as {
      items: {
        snippet: {
          resourceId: { videoId: string };
          title: string;
          description: string;
          thumbnails: { default?: { url: string }; medium?: { url: string }; high?: { url: string } };
          publishedAt: string;
        };
      }[];
    };

    const videoIds = playlistData.items.map((i) => i.snippet.resourceId.videoId).join(",");
    if (!videoIds) return Response.json({ videos: [] });

    const videosRes = await fetch(
      `https://www.googleapis.com/youtube/v3/videos?part=snippet,status&id=${videoIds}`,
      { headers: authHeader }
    );
    if (!videosRes.ok) throw new Error(await videosRes.text());
    const videosData = (await videosRes.json()) as {
      items: {
        id: string;
        snippet: {
          title: string;
          description: string;
          tags?: string[];
          thumbnails: { default?: { url: string }; medium?: { url: string }; high?: { url: string } };
          publishedAt: string;
        };
        status: { privacyStatus: string };
      }[];
    };

    const hiddenRaw = await env.TOKENS.get("hidden_ids");
    const hidden: string[] = hiddenRaw ? JSON.parse(hiddenRaw) : [];

    const videos = videosData.items
      .filter((v) => !hidden.includes(v.id))
      .map((v) => ({
        id: v.id,
        title: v.snippet.title,
        description: v.snippet.description,
        tags: v.snippet.tags ?? [],
        thumbnail:
          v.snippet.thumbnails.high?.url ??
          v.snippet.thumbnails.medium?.url ??
          v.snippet.thumbnails.default?.url ??
          `https://i.ytimg.com/vi/${v.id}/hqdefault.jpg`,
        publishedAt: v.snippet.publishedAt,
        privacyStatus: v.status.privacyStatus,
      }));

    return Response.json({ videos });
  } catch (err) {
    return Response.json({ error: (err as Error).message }, { status: 500 });
  }
};
