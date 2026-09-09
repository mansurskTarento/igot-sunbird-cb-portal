import { NsContent } from './widget-content.model'

/**
 * The content dictionary API (/apis/proxies/v8/content/v5/dictionary) returns each entry
 * with `primaryCategory` and `courseCategory` but WITHOUT `contentType`, while the content
 * read API (/content/v2/read) - the dictionary cache's per-id fallback - does return it.
 * So dictionary-sourced content reaches the cards missing a field they branch on
 * (card icon, resource-vs-course layout, `contentTags.excludeContentType`), and the same
 * card renders differently depending on which path filled the cache.
 *
 * These helpers close that gap on the read side by deriving `contentType` from the
 * categories the dictionary does carry.
 */

/**
 * primaryCategory -> contentType. Only the categories whose contentType differs from the
 * category name need an entry; anything else falls through to the identity mapping below,
 * which is what the cards already do (`primaryCategory || contentType`).
 */
const PRIMARY_CATEGORY_TO_CONTENT_TYPE: { [primaryCategory: string]: string } = {
  [NsContent.EPrimaryCategory.COURSE]: NsContent.EContentTypes.COURSE,
  [NsContent.EPrimaryCategory.MODULE]: NsContent.EContentTypes.MODULE,
  [NsContent.EPrimaryCategory.PROGRAM]: NsContent.EContentTypes.PROGRAMV2,
  [NsContent.EPrimaryCategory.RESOURCE]: NsContent.EContentTypes.RESOURCE,
  [NsContent.EPrimaryCategory.PRACTICE_RESOURCE]: NsContent.EContentTypes.RESOURCE,
  [NsContent.EPrimaryCategory.FINAL_ASSESSMENT]: NsContent.EContentTypes.RESOURCE,
  [NsContent.EPrimaryCategory.COMP_ASSESSMENT]: NsContent.EContentTypes.RESOURCE,
  // every program/assessment flavour below is a course under the hood - the flavour lives
  // in courseCategory, and contentType stays 'Course'
  [NsContent.EPrimaryCategory.BLENDED_PROGRAM]: NsContent.EContentTypes.COURSE,
  [NsContent.EPrimaryCategory.CURATED_PROGRAM]: NsContent.EContentTypes.COURSE,
  [NsContent.EPrimaryCategory.STANDALONE_ASSESSMENT]: NsContent.EContentTypes.COURSE,
  [NsContent.ECourseCategory.MODERATED_COURSE]: NsContent.EContentTypes.COURSE,
  [NsContent.ECourseCategory.MODERATED_PROGRAM]: NsContent.EContentTypes.COURSE,
  [NsContent.ECourseCategory.MODERATED_ASSESSEMENT]: NsContent.EContentTypes.COURSE,
  [NsContent.ECourseCategory.INVITE_ONLY_PROGRAM]: NsContent.EContentTypes.COURSE,
  [NsContent.ECourseCategory.CASE_STUDY]: NsContent.EContentTypes.COURSE,
  [NsContent.ECourseCategory.LEARNING_PATHWAY]: NsContent.EContentTypes.COURSE,
}

/**
 * The content type for a dictionary entry: its own `contentType` when the entry already
 * carries one, otherwise derived from `primaryCategory` (falling back to `courseCategory`).
 * Returns '' when the entry says nothing about its type, so callers can leave the field
 * untouched rather than stamping a wrong value.
 */
export function deriveContentType(content: any): string {
  if (!content) {
    return ''
  }
  if (content.contentType) {
    return content.contentType
  }
  const category = content.primaryCategory || content.courseCategory
  if (!category) {
    return ''
  }
  return PRIMARY_CATEGORY_TO_CONTENT_TYPE[category] || category
}

/**
 * A copy of `content` with `contentType` filled in when the dictionary left it out.
 * A no-op for content that already has one, so it is safe on any content object.
 */
export function stampContentType<T>(content: T): T {
  const derived = deriveContentType(content)
  if (!derived || (content as any).contentType === derived) {
    return content
  }
  return { ...(content as any), contentType: derived }
}
