export function trailerEmbed(value?: string): string | null {
  try {
    const url = new URL(value || "");
    if (url.protocol !== "https:") return null;
    const id =
      url.hostname === "youtu.be"
        ? url.pathname.slice(1)
        : ["youtube.com", "www.youtube.com", "www.youtube-nocookie.com"].includes(url.hostname)
          ? url.searchParams.get("v") || url.pathname.match(/^\/(?:embed|shorts)\/([^/]+)$/)?.[1]
          : null;
    return id && /^[\w-]{11}$/.test(id) ? `https://www.youtube-nocookie.com/embed/${id}` : null;
  } catch {
    return null;
  }
}
