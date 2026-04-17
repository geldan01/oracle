import { readFile, stat } from "fs/promises";
import path from "path";
import { NextRequest, NextResponse } from "next/server";

// Stream files from /public/uploads/ via a route handler.
// Next.js in standalone mode caches the public-file list at startup, so files
// written to /public/uploads at runtime return 404 until the container is
// restarted. This handler reads the file from disk on every request and
// bypasses that cache.

export const dynamic = "force-dynamic";

const UPLOADS_ROOT = path.join(process.cwd(), "public", "uploads");

const MIME_BY_EXT: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
  ".gif": "image/gif",
};

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ path: string[] }> },
) {
  const { path: segments } = await params;

  if (!segments || segments.length === 0) {
    return new NextResponse("Not found", { status: 404 });
  }

  // Resolve the requested file and make sure it stays inside UPLOADS_ROOT.
  // This guards against directory-traversal attempts via encoded ".." segments.
  const requested = path.join(UPLOADS_ROOT, ...segments);
  const resolved = path.resolve(requested);
  if (!resolved.startsWith(UPLOADS_ROOT + path.sep) && resolved !== UPLOADS_ROOT) {
    return new NextResponse("Not found", { status: 404 });
  }

  const ext = path.extname(resolved).toLowerCase();
  const mime = MIME_BY_EXT[ext];
  if (!mime) {
    return new NextResponse("Not found", { status: 404 });
  }

  try {
    const info = await stat(resolved);
    if (!info.isFile()) {
      return new NextResponse("Not found", { status: 404 });
    }

    const data = await readFile(resolved);
    return new NextResponse(new Uint8Array(data), {
      status: 200,
      headers: {
        "Content-Type": mime,
        "Content-Length": String(info.size),
        "Cache-Control": "public, max-age=3600, must-revalidate",
        "Last-Modified": info.mtime.toUTCString(),
      },
    });
  } catch {
    return new NextResponse("Not found", { status: 404 });
  }
}
