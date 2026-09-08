import { createFileRoute } from "@tanstack/react-router";
import { metadataResponse } from "@/lib/movie-metadata.server";

export const Route = createFileRoute("/api/movie-metadata")({
  server: { handlers: { GET: ({ request }) => metadataResponse(request) } },
});
