import ejs from "ejs"
import path from "path"

function injectTopNavigationBase(html: string) {
  if (/<base\s/i.test(html)) {
    return html
  }
  return html.replace(/<head>/i, '<head><base target="_top">')
}

export async function renderLaunchHtml(options?: { forceTopNavigation?: boolean }) {
  const viewsDir = path.join(process.cwd(), "launch-ejs", "views")
  const templatePath = path.join(viewsDir, "index.ejs")
  const renderOptions = {
    views: [viewsDir],
    strict: false,
    _with: false,
    localsName: '__locals__',
    rmWhitespace: false,
  } as ejs.Options
  const renderedHtml = await ejs.renderFile(templatePath, {}, renderOptions)

  if (typeof renderedHtml !== "string") {
    throw new TypeError("Launch template did not render HTML")
  }

  if (options?.forceTopNavigation) {
    return injectTopNavigationBase(renderedHtml)
  }

  return renderedHtml
}
