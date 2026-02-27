import ejs from "ejs"
import path from "path"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function GET() {
  try {
    const viewsDir = path.join(process.cwd(), "launch-ejs", "views")
    const templatePath = path.join(viewsDir, "index.ejs")
    const html = await ejs.renderFile(templatePath, {}, { views: [viewsDir] })

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
