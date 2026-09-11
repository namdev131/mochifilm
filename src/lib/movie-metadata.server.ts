const normalize = (value: string) =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]/gu, "");
export const matchingTitle = (left: string, right: string) =>
  Boolean(normalize(left)) && normalize(left) === normalize(right);
const names = (value: string) =>
  value && value !== "N/A"
    ? value
        .split(",")
        .map((name) => name.trim())
        .filter(Boolean)
    : [];

async function json(url: URL, headers?: HeadersInit) {
  const response = await fetch(url, { headers, signal: AbortSignal.timeout(6000) });
  if (!response.ok) throw new Error("Metadata provider unavailable");
  return response.json();
}

// ponytail: per-instance budget; use a shared gateway limiter when scaling to multiple instances.
let budget = { start: 0, count: 0 };
export async function metadataResponse(request: Request): Promise<Response> {
  const params = new URL(request.url).searchParams;
  const title = params.get("title")?.trim() || "";
  const year = params.get("year") || "";
  const type = params.get("type") || "movie";
  if (
    !title ||
    title.length > 200 ||
    (year && !/^\d{4}$/.test(year)) ||
    !["movie", "tv"].includes(type)
  ) {
    return Response.json({ error: "Invalid movie metadata query" }, { status: 400 });
  }
  const token = process.env.TMDB_READ_ACCESS_TOKEN;
  const key = process.env.OMDB_API_KEY;
  if (!token && !key) return Response.json({ metadata: null, status: "not_configured" });
  const now = Date.now();
  if (now - budget.start >= 60000) budget = { start: now, count: 0 };
  if (++budget.count > 60)
    return Response.json(
      { metadata: null, status: "rate_limited" },
      { status: 429, headers: { "Retry-After": "60", "Cache-Control": "no-store" } },
    );
  let failed = false;
  if (token) {
    try {
      const headers = { Authorization: `Bearer ${token}` };
      const url = new URL(`https://api.themoviedb.org/3/search/${type}`);
      url.searchParams.set("query", title);
      url.searchParams.set("language", "vi-VN");
      url.searchParams.set("include_adult", "false");
      if (year) url.searchParams.set(type === "movie" ? "year" : "first_air_date_year", year);
      const search = await json(url, headers);
      // ponytail: exact title/year only; add ID mapping when localized titles need reconciliation.
      const matches = (search.results || []).filter(
        (item: Record<string, string>) =>
          [item.title, item.original_title, item.name, item.original_name].some(
            (name) => name && matchingTitle(title, name),
          ) &&
          (!year || (item.release_date || item.first_air_date || "").slice(0, 4) === year),
      );
      if (matches.length === 1 && Number.isInteger(matches[0].id)) {
        const detail = await json(
          new URL(
            `https://api.themoviedb.org/3/${type}/${matches[0].id}?append_to_response=credits,videos&language=vi-VN`,
          ),
          headers,
        );
        return Response.json(
          {
            status: "ok",
            metadata: {
              trailer_url: (() => {
                const video = detail.videos?.results?.find(
                  (v: { site: string; type: string; official: boolean; key: string }) =>
                    v.site === "YouTube" &&
                    v.type === "Trailer" &&
                    v.official &&
                    /^[\w-]{11}$/.test(v.key),
                );
                return video ? `https://www.youtube.com/watch?v=${video.key}` : undefined;
              })(),
              provider: "TMDB",
              url: `https://www.themoviedb.org/${type}/${detail.id}`,
              vote_average:
                detail.vote_count > 0 && Number.isFinite(detail.vote_average)
                  ? detail.vote_average
                  : null,
              actors: (detail.credits?.cast || []).map((person: { name: string }) => person.name),
              director: (detail.credits?.crew || [])
                .filter((person: { job: string }) => person.job === "Director")
                .map((person: { name: string }) => person.name),
              content: detail.overview || "",
              time: detail.runtime ? `${detail.runtime} phút` : "",
              category: (detail.genres || []).map((genre: { name: string }) => genre.name),
            },
          },
          { headers: { "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400" } },
        );
      }
    } catch {
      failed = true;
    }
  }
  if (key) {
    try {
      const url = new URL("https://www.omdbapi.com/");
      url.searchParams.set("apikey", key);
      url.searchParams.set("t", title);
      url.searchParams.set("type", type === "tv" ? "series" : "movie");
      url.searchParams.set("plot", "full");
      if (year) url.searchParams.set("y", year);
      const detail = await json(url);
      if (detail.Response === "False" && detail.Error !== "Movie not found!") failed = true;
      if (
        detail.Response === "True" &&
        matchingTitle(title, detail.Title || "") &&
        (!year || String(detail.Year).slice(0, 4) === year) &&
        /^tt\d+$/.test(detail.imdbID)
      ) {
        const rating = Number(detail.imdbRating);
        return Response.json(
          {
            status: "ok",
            metadata: {
              provider: "IMDb (OMDb)",
              url: `https://www.imdb.com/title/${detail.imdbID}/`,
              vote_average: Number.isFinite(rating) && rating >= 0 && rating <= 10 ? rating : null,
              actors: names(detail.Actors),
              director: names(detail.Director),
              content: detail.Plot !== "N/A" ? detail.Plot : "",
              time: detail.Runtime !== "N/A" ? detail.Runtime : "",
              category: names(detail.Genre),
            },
          },
          { headers: { "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400" } },
        );
      }
    } catch {
      failed = true;
    }
  }
  return Response.json(
    { metadata: null, status: failed ? "unavailable" : "not_found" },
    { headers: { "Cache-Control": "no-store" } },
  );
}
