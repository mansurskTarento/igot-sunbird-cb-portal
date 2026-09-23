import { VIEWER_ROUTE_FROM_MIME, viewerRouteGenerator } from './viewer-route-util'
import { NsContent } from './widget-content.model'

describe('VIEWER_ROUTE_FROM_MIME', () => {
  afterEach(() => {
    window.history.pushState({}, '', '/')
  })

  it.each([
    [NsContent.EMimeTypes.MP3, 'audio'],
    [NsContent.EMimeTypes.M4A, 'audio-native'],
    [NsContent.EMimeTypes.COLLECTION, 'html'],
    [NsContent.EMimeTypes.CHANNEL, 'certification'],
    [NsContent.EMimeTypes.CERTIFICATION, 'certification'],
    [NsContent.EMimeTypes.TEXT_WEB, 'youtube'],
    [NsContent.EMimeTypes.SURVEY, 'survey'],
    [NsContent.EMimeTypes.IAP, 'iap'],
    [NsContent.EMimeTypes.ILP_FP, 'ilp-fp'],
    [NsContent.EMimeTypes.PDF, 'pdf'],
    [NsContent.EMimeTypes.MP4, 'video'],
    [NsContent.EMimeTypes.M3U8, 'video'],
    [NsContent.EMimeTypes.YOUTUBE, 'youtube'],
    [NsContent.EMimeTypes.WEB_MODULE, 'web-module'],
    [NsContent.EMimeTypes.WEB_MODULE_EXERCISE, 'web-module'],
    [NsContent.EMimeTypes.CLASS_DIAGRAM, 'class-diagram'],
    [NsContent.EMimeTypes.HANDS_ON, 'hands-on'],
    [NsContent.EMimeTypes.RDBMS_HANDS_ON, 'rdbms-hands-on'],
    [NsContent.EMimeTypes.HTML_PICKER, 'html-picker'],
    [NsContent.EMimeTypes.QUIZ, 'quiz'],
    [NsContent.EMimeTypes.APPLICATION_JSON, 'quiz'],
    [NsContent.EMimeTypes.PRACTICE_RESOURCE, 'practice'],
    [NsContent.EMimeTypes.COLLECTION_RESOURCE, 'resource-collection'],
    [NsContent.EMimeTypes.OFFLINE_SESSION, 'offline-session'],
    [NsContent.EMimeTypes.UNKNOWN, 'html'],
  ])('maps %s to %s', (mimeType, expected) => {
    expect(VIEWER_ROUTE_FROM_MIME(mimeType)).toBe(expected)
  })

  it.each([
    NsContent.EMimeTypes.HTML_TEXT,
    NsContent.EMimeTypes.HTML,
    NsContent.EMimeTypes.ZIP,
  ])('maps %s to html when the url does not include mobile/html', mimeType => {
    expect(VIEWER_ROUTE_FROM_MIME(mimeType)).toBe('html')
  })

  it.each([
    NsContent.EMimeTypes.HTML_TEXT,
    NsContent.EMimeTypes.HTML,
    NsContent.EMimeTypes.ZIP,
  ])('maps %s to mobile/html when the url includes mobile/html', mimeType => {
    window.history.pushState({}, '', '/mobile/html/some-content')
    expect(VIEWER_ROUTE_FROM_MIME(mimeType)).toBe('mobile/html')
  })
})

describe('viewerRouteGenerator', () => {
  afterEach(() => {
    window.history.pushState({}, '', '/')
  })

  it('builds a minimal url with no optional params', () => {
    const result = viewerRouteGenerator('content-1', NsContent.EMimeTypes.PDF)
    expect(result).toEqual({ url: '/viewer/pdf/content-1', queryParams: {} })
  })

  it('includes collectionId and collectionType when the collection type is supported', () => {
    const result = viewerRouteGenerator(
      'content-1', NsContent.EMimeTypes.PDF, 'col-1', NsContent.EPrimaryCategory.COURSE,
    )
    expect(result.queryParams).toEqual({ collectionId: 'col-1', collectionType: NsContent.EPrimaryCategory.COURSE })
  })

  it('drops collectionId and collectionType when the collection type is not supported', () => {
    const result = viewerRouteGenerator(
      'content-1', NsContent.EMimeTypes.PDF, 'col-1', 'Unsupported Type',
    )
    expect(result.queryParams).toEqual({})
  })

  it('includes primaryCategory, batchId and courseName when provided', () => {
    const result = viewerRouteGenerator(
      'content-1', NsContent.EMimeTypes.PDF, undefined, undefined, false,
      NsContent.EPrimaryCategory.COURSE, 'batch-1', 'Course Name',
    )
    expect(result.queryParams).toEqual({
      primaryCategory: NsContent.EPrimaryCategory.COURSE,
      batchId: 'batch-1',
      courseName: 'Course Name',
    })
  })

  it('includes preview when forPreview is true', () => {
    const result = viewerRouteGenerator('content-1', NsContent.EMimeTypes.PDF, undefined, undefined, true)
    expect(result.queryParams).toEqual({ preview: true })
  })

  it('includes editMode when the url has editMode=true', () => {
    window.history.pushState({}, '', '/viewer?editMode=true')
    const result = viewerRouteGenerator('content-1', NsContent.EMimeTypes.PDF)
    expect(result.queryParams).toEqual({ editMode: true })
  })

  it('includes ML and MLId only when both are provided', () => {
    const result = viewerRouteGenerator(
      'content-1', NsContent.EMimeTypes.PDF, undefined, undefined, false,
      undefined, undefined, undefined, 'ml-1', 'mlid-1',
    )
    expect(result.queryParams).toEqual({ ML: 'ml-1', MLId: 'mlid-1' })
  })

  it('omits ML and MLId when only one of them is provided', () => {
    const result = viewerRouteGenerator(
      'content-1', NsContent.EMimeTypes.PDF, undefined, undefined, false,
      undefined, undefined, undefined, 'ml-1', undefined,
    )
    expect(result.queryParams).toEqual({})
  })
})
