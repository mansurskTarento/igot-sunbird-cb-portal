import { deriveContentType, stampContentType } from './content-type-util'
import { NsContent } from './widget-content.model'

describe('deriveContentType', () => {
  it('keeps the contentType the content already carries', () => {
    expect(deriveContentType({ contentType: 'Resource', primaryCategory: 'Course' })).toBe('Resource')
  })

  it('maps the primaryCategory of a dictionary entry to its contentType', () => {
    expect(deriveContentType({ primaryCategory: NsContent.EPrimaryCategory.COURSE }))
      .toBe(NsContent.EContentTypes.COURSE)
    expect(deriveContentType({ primaryCategory: NsContent.EPrimaryCategory.RESOURCE }))
      .toBe(NsContent.EContentTypes.RESOURCE)
    expect(deriveContentType({ primaryCategory: NsContent.EPrimaryCategory.MODULE }))
      .toBe(NsContent.EContentTypes.MODULE)
    expect(deriveContentType({ primaryCategory: NsContent.EPrimaryCategory.PROGRAM }))
      .toBe(NsContent.EContentTypes.PROGRAMV2)
    expect(deriveContentType({ primaryCategory: NsContent.EPrimaryCategory.BLENDED_PROGRAM }))
      .toBe(NsContent.EContentTypes.COURSE)
  })

  it('falls back to courseCategory when there is no primaryCategory', () => {
    expect(deriveContentType({ courseCategory: NsContent.ECourseCategory.MODERATED_COURSE }))
      .toBe(NsContent.EContentTypes.COURSE)
  })

  it('returns an unmapped category as-is', () => {
    expect(deriveContentType({ primaryCategory: 'Event' })).toBe('Event')
  })

  it('returns an empty string when the content says nothing about its type', () => {
    expect(deriveContentType({ identifier: 'do_1' })).toBe('')
    expect(deriveContentType(null)).toBe('')
  })
})

describe('stampContentType', () => {
  it('fills in the contentType the dictionary left out', () => {
    const stamped: any = stampContentType({ identifier: 'do_1', primaryCategory: 'Learning Resource' })
    expect(stamped.contentType).toBe(NsContent.EContentTypes.RESOURCE)
    expect(stamped.identifier).toBe('do_1')
  })

  it('returns the same object when nothing needs stamping', () => {
    const content = { identifier: 'do_1', contentType: 'Course', primaryCategory: 'Course' }
    expect(stampContentType(content)).toBe(content)
    const untyped = { identifier: 'do_2' }
    expect(stampContentType(untyped)).toBe(untyped)
  })
})
