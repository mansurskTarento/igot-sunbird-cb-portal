// Same stubs as html.component.progress.spec.ts: the component imports NsContent as a
// value and the @sunbird-cb/toc barrel transitively loads ESM that jest does not
// transform.
jest.mock('@sunbird-cb/collection', () => ({
  NsContent: {
    EPrimaryCategory: { RESOURCE: 'Learning Resource' },
    EMimeTypes: { ZIP: 'application/zip' },
  },
}),          { virtual: true })
jest.mock('@sunbird-cb/toc', () => ({
  AppTocService: class AppTocService { },
  WidgetContentService: class WidgetContentService { },
  ViewerUtilService: class ViewerUtilService { },
}))

import { HtmlComponent } from './html.component'

/**
 * Which file the player launches a package at.
 *
 * The manifest's SCO is the LMS-wired entry and the only file that can report progress,
 * but it is not always safe to launch: see scriptsLostBySwappingLauncher. Both outcomes
 * are covered here, because each one has already been a production bug.
 */
const ROOT = '/scorm-content/assets/public/content/html/do_1/'

const manifest = (href: string) => `<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:adlcp="http://www.adlnet.org/xsd/adlcp_rootv1p2">
  <resources>
    <resource identifier="RES" type="webcontent" href="${href}" adlcp:scormtype="sco">
      <file href="${href}"/>
    </resource>
  </resources>
</manifest>`

// do_1146550966467788801127, trimmed to the tags that decide this. Both launchers load
// the same bootstrapper directly - the SCO is a second launcher, not a driver wrapper -
// and only index.html loads the jQuery the vendor's additions to slides.min.js need.
const storylineIndexHtml = `<html><head>
  <script>window.THREE = { };</script>
  <script type="text/javascript" src="UI_assets/jquery.min.js"></script>
  <script src="story_content/user.js"></script>
  <script src="html5/lib/scripts/bootstrapper.min.js"></script>
</head><body></body></html>`
const storylineIndexLmsHtml = `<html><head>
  <script src="lms/scormdriver.js" charset="utf-8"></script>
  <script src="story_content/user.js"></script>
  <script src="html5/lib/scripts/bootstrapper.min.js"></script>
</head><body></body></html>`

describe('HtmlComponent launch file selection', () => {
  let component: HtmlComponent
  let files: Record<string, string>
  let requested: string[]

  const pick = (entryFile: string | null) =>
    (component as any).pickLaunchFile(ROOT.replace(/\/$/, ''), entryFile) as
      Promise<{ file: string, source: string }>

  beforeEach(() => {
    files = {}
    requested = []
    component = new HtmlComponent(
      null as any, {} as any, {} as any, null as any, {} as any, null as any,
      null as any, null as any, {} as any, null as any, {} as any, {} as any,
    )
    component.htmlContent = { identifier: 'do_1', isTrackable: true } as any
      ; (global as any).fetch = jest.fn((url: string, init?: any) => {
        const path = url.split('?')[0].replace(ROOT, '')
        requested.push(`${(init && init.method) || 'GET'} ${path}`)
        if (files[path] === undefined) {
          return Promise.resolve({ ok: false, status: 404, text: () => Promise.resolve('') })
        }
        return Promise.resolve({ ok: true, status: 200, text: () => Promise.resolve(files[path]) })
      })
  })

  // The reported bug: launched at the SCO the package throws "$ is not defined" out of
  // autoShowHighlight and the learner cannot leave the first slide.
  it('keeps initFile when the SCO drops a script initFile loads', async () => {
    files['imsmanifest.xml'] = manifest('index_lms.html')
    files['index_lms.html'] = storylineIndexLmsHtml
    files['index.html'] = storylineIndexHtml
    await expect(pick('index.html')).resolves.toEqual({ file: 'index.html', source: '(initFile)' })
  })

  // The same package once the content is fixed - one script tag - launches at the SCO and
  // is tracked. Nothing else about the package changes.
  it('launches the SCO once it loads everything initFile does', async () => {
    files['imsmanifest.xml'] = manifest('index_lms.html')
    files['index_lms.html'] = storylineIndexLmsHtml.replace(
      '<script src="lms/scormdriver.js" charset="utf-8"></script>',
      '<script src="lms/scormdriver.js"></script><script src="UI_assets/jquery.min.js"></script>')
    files['index.html'] = storylineIndexHtml
    await expect(pick('index.html')).resolves.toEqual(
      expect.objectContaining({ file: 'index_lms.html' }))
  })

  // Rise: the SCO is a driver that hosts the content in a nested frame, so it shares no
  // script with the content's own page and there is nothing to lose by launching it. This
  // is the layout preferring the SCO exists for.
  it('launches the SCO of a driver-wrapper package', async () => {
    files['imsmanifest.xml'] = manifest('scormdriver/indexAPI.html')
    files['scormdriver/indexAPI.html'] =
      '<html><head><script src="scormdriver.js"></script></head>' +
      '<frameset><frame src="../scormcontent/index.html"></frameset></html>'
    files['scormcontent/index.html'] =
      '<html><head><script src="lib/main.bundle.js"></script></head><body></body></html>'
    await expect(pick('scormcontent/index.html')).resolves.toEqual(
      expect.objectContaining({ file: 'scormdriver/indexAPI.html' }))
  })

  // Two launchers off one publish that differ only in the driver: the swap costs nothing.
  it('launches the SCO when the two launchers load the same scripts', async () => {
    files['imsmanifest.xml'] = manifest('index_lms.html')
    files['index_lms.html'] = '<html><head><script src="a.js"></script>' +
      '<script src="lms/scormdriver.js"></script></head></html>'
    files['index.html'] = '<html><head><script src="a.js"></script></head></html>'
    await expect(pick('index.html')).resolves.toEqual(
      expect.objectContaining({ file: 'index_lms.html' }))
  })

  // A launcher that cannot be read is not evidence of anything, so the decision the
  // manifest asks for stands.
  it('launches the SCO when a launcher cannot be read', async () => {
    files['imsmanifest.xml'] = manifest('index_lms.html')
    files['index_lms.html'] = storylineIndexLmsHtml
    await expect(pick('index.html')).resolves.toEqual(
      expect.objectContaining({ file: 'index_lms.html' }))
  })

  // Untracked content never reads cmi.*, so it launches what the publisher recorded
  // without so much as fetching the manifest.
  it('launches initFile for untracked content without reading the package', async () => {
    component.htmlContent = { identifier: 'do_1' } as any
    files['imsmanifest.xml'] = manifest('index_lms.html')
    files['index_lms.html'] = storylineIndexLmsHtml
    files['index.html'] = storylineIndexHtml
    await expect(pick('index.html')).resolves.toEqual({ file: 'index.html', source: '(initFile)' })
    expect(requested).toEqual([])
  })

  // A package published as plain web content has no manifest at all.
  it('launches initFile when there is no manifest', async () => {
    await expect(pick('index.html')).resolves.toEqual({ file: 'index.html', source: '(initFile)' })
  })

  it('falls back to the manifest when there is no initFile', async () => {
    files['imsmanifest.xml'] = manifest('index_lms.html')
    files['index_lms.html'] = storylineIndexLmsHtml
    await expect(pick(null)).resolves.toEqual(
      expect.objectContaining({ file: 'index_lms.html' }))
  })
})
