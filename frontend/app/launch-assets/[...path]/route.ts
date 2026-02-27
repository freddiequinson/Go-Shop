import { readFile } from "fs/promises"
import path from "path"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const launchAssetsRoot = path.join(process.cwd(), "launch-ejs", "public")

function getContentType(filePath: string) {
  const ext = path.extname(filePath).toLowerCase()
  switch (ext) {
    case ".css":
      return "text/css; charset=utf-8"
    case ".js":
      return "application/javascript; charset=utf-8"
    case ".svg":
      return "image/svg+xml"
    case ".png":
      return "image/png"
    case ".jpg":
    case ".jpeg":
      return "image/jpeg"
    case ".gif":
      return "image/gif"
    case ".webp":
      return "image/webp"
    case ".ico":
      return "image/x-icon"
    case ".mp4":
      return "video/mp4"
    case ".mov":
      return "video/quicktime"
    default:
      return "application/octet-stream"
  }
}

function resolveAssetPath(segments: string[]) {
  const decodedSegments = segments.map((segment) => decodeURIComponent(segment))
  const resolvedPath = path.resolve(launchAssetsRoot, ...decodedSegments)
  const relativePath = path.relative(launchAssetsRoot, resolvedPath)
  if (relativePath.startsWith("..") || path.isAbsolute(relativePath)) {
    return null
  }
  return resolvedPath
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ path: string[] }> }
) {
  try {
    const resolvedParams = await params
    const segments = resolvedParams.path || []
    if (segments.length === 0) {
      return new Response("Asset path is required", { status: 400 })
    }

    const filePath = resolveAssetPath(segments)
    if (!filePath) {
      return new Response("Invalid asset path", { status: 400 })
    }

    const bytes = await readFile(filePath)
    return new Response(new Uint8Array(bytes), {
      status: 200,
      headers: {
        "content-type": getContentType(filePath),
      },
    })
  } catch {
    return new Response("Asset not found", { status: 404 })
  }
}
