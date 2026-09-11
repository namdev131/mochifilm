import { HeadContent, Outlet, Scripts, createRootRoute } from "@tanstack/react-router";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useEffect, useState, type ReactNode } from "react";
import { MochiLoadingScreen } from "@/components/common/MochiLoadingScreen";
import { NotFoundPage } from "@/components/common/NotFoundPage";
import { AuthDataProvider } from "@/lib/auth-data-provider";
import { initializeMochiSettings } from "@/lib/mochi-settings";
import appCss from "../styles.css?url";
import desktopNavigationCss from "../styles/desktop-navigation.css?url";

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Mochi Film - Rạp Chiếu Phim Trực Tuyến Đỉnh Cao" },
      {
        name: "description",
        content:
          "Xem phim bom tấn, phim lẻ, phim bộ, anime chất lượng 4K Ultra HD miễn phí với giao diện hiện đại cùng Mochi Film.",
      },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "stylesheet", href: desktopNavigationCss },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Be+Vietnam+Pro:wght@400;500;600;700;800&family=Dancing+Script:wght@600;700&family=Fredoka:wght@500;600;700&display=swap",
      },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundPage,
});

function RootComponent() {
  useEffect(() => initializeMochiSettings(), []);
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 1000 * 30,
            refetchOnWindowFocus: true,
          },
        },
      }),
  );

  return (
    <>
      <AuthDataProvider>
        <QueryClientProvider client={queryClient}>
          <Outlet />
        </QueryClientProvider>
        <MochiLoadingScreen />
      </AuthDataProvider>
    </>
  );
}

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="vi" className="dark">
      <head>
        <HeadContent />

        <script
          dangerouslySetInnerHTML={{
            __html: `if("serviceWorker" in navigator){addEventListener("load",function(){navigator.serviceWorker.register("/sw.js")})}`,
          }}
        />
      </head>
      <body className="bg-[#09090d] text-zinc-100 antialiased selection:bg-pink-500 selection:text-white">
        {children}
        <Scripts />
      </body>
    </html>
  );
}
