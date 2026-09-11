import { createFileRoute } from "@tanstack/react-router";
// ponytail: per-instance budget; shared rate limit needed for multi-instance scale.
let budget = { start: 0, count: 0 };
export const Route = createFileRoute("/api/actor")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const p = new URL(request.url).searchParams;
        const name = p.get("name")?.trim() || "";
        const id = p.get("id");
        if (!name || name.length > 120 || (id && !/^\d{1,10}$/.test(id)))
          return Response.json({ error: "Tên diễn viên không hợp lệ" }, { status: 400 });
        const token = process.env.TMDB_READ_ACCESS_TOKEN;
        if (!token)
          return Response.json(
            { error: "Chưa cấu hình TMDB để tải hồ sơ diễn viên." },
            { status: 503 },
          );
        if (Date.now() - budget.start >= 60000) budget = { start: Date.now(), count: 0 };
        if (++budget.count > 60)
          return Response.json(
            { error: "Quá nhiều yêu cầu, thử lại sau." },
            { status: 429, headers: { "Retry-After": "60" } },
          );
        const get = async (path: string) => {
          const r = await fetch(`https://api.themoviedb.org/3/${path}`, {
            headers: { Authorization: `Bearer ${token}` },
            signal: AbortSignal.timeout(8000),
          });
          if (!r.ok) throw new Error();
          return r.json();
        };
        try {
          if (!id) {
            const result = await get(
              `search/person?query=${encodeURIComponent(name)}&include_adult=false&language=vi-VN`,
            );
            return Response.json({
              candidates: (result.results || [])
                .filter((x: any) => x.known_for_department === "Acting")
                .map((x: any) => ({ id: x.id, name: x.name, image: x.profile_path })),
            });
          }
          const actor = await get(
            `person/${id}?append_to_response=combined_credits&language=vi-VN`,
          );
          return Response.json(
            {
              actor: {
                name: actor.name,
                biography: actor.biography,
                birthday: actor.birthday,
                birthplace: actor.place_of_birth,
                image: actor.profile_path,
              },
              movies: (actor.combined_credits?.cast || [])
                .filter((x: any) => !x.adult)
                .map((x: any) => ({
                  id: x.id,
                  type: x.media_type,
                  title: x.title || x.name,
                  original: x.original_title || x.original_name,
                  poster: x.poster_path,
                  year: (x.release_date || x.first_air_date || "").slice(0, 4),
                  character: x.character,
                })),
            },
            { headers: { "Cache-Control": "public, s-maxage=3600" } },
          );
        } catch {
          return Response.json(
            { error: "Không kết nối được TMDB. Vui lòng thử lại." },
            { status: 502 },
          );
        }
      },
    },
  },
});
