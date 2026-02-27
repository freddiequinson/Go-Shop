import { renderLaunchHtml } from "@/lib/launch/render-launch-html"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function GET() {
  try {
    const html = await renderLaunchHtml({ forceTopNavigation: true })

    return new Response(html, {
      status: 200,
      headers: {
        "content-type": "text/html; charset=utf-8",
      },
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown launch rendering error"
    return new Response(`Launch page rendering failed: ${message}`, { status: 500 })
  }
}
