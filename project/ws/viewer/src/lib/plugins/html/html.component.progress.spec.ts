// The component imports NsContent as a value (enum members) and the @sunbird-cb/toc
// barrel transitively loads ESM that jest does not transform. Only DI tokens and a
// couple of enum members are needed here, so both are stubbed.
jest.mock('@sunbird-cb/collection', () => ({
  NsContent: {
    EPrimaryCategory: { RESOURCE: 'Learning Resource' },
    EMimeTypes: { ZIP: 'application/zip' },
  },
  // virtual: the package resolves through a tsconfig path, which jest does not read.
}),          { virtual: true })
jest.mock('@sunbird-cb/toc', () => ({
  AppTocService: class AppTocService { },
  WidgetContentService: class WidgetContentService { },
  ViewerUtilService: class ViewerUtilService { },
}))

import { HtmlComponent } from './html.component'
import { SCORM_COMPLETION_ELEMENTS, isCompleteStatusValue } from './SCORMAdapter/scormAdapter'

/**
 * The reading a partially consumed SCORM package gets.
 *
 * Everything here goes through calculateCompletionStatus, which is the single source of
 * the completionPercentage both the progress PATCH and the mobile SCORM_EVENT carry.
 */
/** LZW-compress, so a fixture can be written as the JSON it represents. */
function lzw(input: string): number[] {
  const dictionary: any = {}
  for (let i = 0; i < 256; i += 1) {
    dictionary[String.fromCharCode(i)] = i
  }
  let next = 256
  let current = ''
  const codes: number[] = []
  for (const char of input) {
    const combined = current + char
    if (dictionary[combined] !== undefined) {
      current = combined
    } else {
      codes.push(dictionary[current])
      dictionary[combined] = next
      next += 1
      current = char
    }
  }
  if (current !== '') {
    codes.push(dictionary[current])
  }
  return codes
}

describe('HtmlComponent progress reading', () => {
  let component: HtmlComponent
  let store: any

  const trackable = { identifier: 'do_123', isTrackable: true, duration: 600 }
  const untracked = { identifier: 'do_456', duration: 600 }

  beforeEach(() => {
    // Keyed by content the way the real Storage is, so a test can tell which content's
    // data was dropped rather than only that something was.
    store = {
      key: 'do_123',
      buckets: { do_123: {} } as any,
      cleared: [] as string[],
      get data() {
        if (!this.buckets[this.key]) { this.buckets[this.key] = {} }
        return this.buckets[this.key]
      },
      getAll() { return this.data },
      getItem(key: string) { return this.data[key] },
      setItem(key: string, value: any) { this.data[key] = value },
      setAll(data: any) { this.buckets[this.key] = data },
      clearAll() { this.cleared.push(this.key); this.buckets[this.key] = {} },
    }
    const adapter: any = {
      scorm2004Api: {},
      set contentId(id: string) { store.key = id },
      loadDataV2: () => undefined,
      getStatus: (data: any) =>
        SCORM_COMPLETION_ELEMENTS.some(key => isCompleteStatusValue(data && data[key])) ? 2 : 1,
    }
    component = new HtmlComponent(
      null as any, {} as any, adapter, null as any, {} as any, null as any,
      null as any, null as any, store, null as any, {} as any, {} as any,
    )
  })

  describe('trackable content', () => {
    it('reports 0 for a package that has been opened but not consumed', () => {
      component.ticks = 0
      expect(component.calculateCompletionStatus(trackable)).toEqual(
        expect.objectContaining({ completionPercentage: 0, status: 1 }))
    })

    it('reports cmi.progress_measure when the package writes one', () => {
      store.data['cmi.progress_measure'] = '0.45'
      expect(component.calculateCompletionStatus(trackable)).toEqual(
        expect.objectContaining({ completionPercentage: 45, status: 1 }))
    })

    it('completes on cmi.progress_measure 1', () => {
      store.data['cmi.progress_measure'] = '1'
      expect(component.calculateCompletionStatus(trackable)).toEqual(
        expect.objectContaining({ completionPercentage: 100, status: 2 }))
    })

    // Rounded before the comparison, as this branch has always done it.
    it('completes on a progress_measure that rounds to 100', () => {
      store.data['cmi.progress_measure'] = '0.996'
      expect(component.calculateCompletionStatus(trackable)).toEqual(
        expect.objectContaining({ completionPercentage: 100, status: 2 }))
    })

    // The reported bug: SCORM 1.2 has no progress_measure, so this used to be 0 until the
    // package declared itself complete.
    it('falls back to completed objectives for a SCORM 1.2 package', () => {
      store.data['cmi.objectives._count'] = '4'
      store.data['cmi.objectives.0.id'] = 'slide-1'
      store.data['cmi.objectives.0.status'] = 'completed'
      store.data['cmi.objectives.1.id'] = 'slide-2'
      store.data['cmi.objectives.1.status'] = 'incomplete'
      expect(component.calculateCompletionStatus(trackable)).toEqual(
        expect.objectContaining({ completionPercentage: 25, status: 1 }))
    })

    // Score is deliberately not a progress signal: a learner can be 4% scored having seen
    // every slide, or 100% scored on question 1 of 20.
    it('does not read score as progress', () => {
      component.ticks = 0
      store.data['cmi.core.score.raw'] = '4'
      store.data['cmi.core.score.max'] = '100'
      expect(component.calculateCompletionStatus(trackable)).toEqual(
        expect.objectContaining({ completionPercentage: 0, status: 1 }))
    })

    // Time spent is not a reading of how far the learner has got, so it is no longer one
    // of the signals - the package is the only authority on trackable content.
    it('ignores time spent entirely', () => {
      component.ticks = 6000
      expect(component.calculateCompletionStatus(trackable)).toEqual(
        expect.objectContaining({ completionPercentage: 0, status: 1 }))
    })

    it('reports 100 when the package says every objective is done', () => {
      store.data['cmi.objectives._count'] = '2'
      store.data['cmi.objectives.0.status'] = 'completed'
      store.data['cmi.objectives.1.status'] = 'passed'
      expect(component.calculateCompletionStatus(trackable)).toEqual(
        expect.objectContaining({ completionPercentage: 100, status: 2 }))
    })

    it('completes when the package writes cmi.core.lesson_status', () => {
      store.data['cmi.core.lesson_status'] = 'completed'
      expect(component.calculateCompletionStatus(trackable)).toEqual(
        expect.objectContaining({ completionPercentage: 100, status: 2 }))
    })

    // A session starts with an empty CMI store: the first interaction fires the debounced
    // update before the package has written anything back.
    // The store starts every session empty, so "the package has said nothing yet" must not
    // write a 0 over what the learner has already earned.
    it('keeps the recorded percentage while the package is silent', () => {
      store.data['completionPercentage'] = 60
      store.data['completionStatus'] = 1
      expect(component.calculateCompletionStatus(trackable)).toEqual(
        expect.objectContaining({ completionPercentage: 60, status: 1 }))
    })

    // The package is the authority: a lower figure from it means the record is out of date.
    it('reports a package figure below the recorded percentage', () => {
      store.data['completionPercentage'] = 83
      store.data['cmi.progress_measure'] = '0.5'
      expect(component.calculateCompletionStatus(trackable)).toEqual(
        expect.objectContaining({ completionPercentage: 50, status: 1 }))
    })

    it('reports the package reading once it passes the recorded percentage', () => {
      store.data['completionPercentage'] = 60
      store.data['cmi.progress_measure'] = '0.75'
      expect(component.calculateCompletionStatus(trackable)).toEqual(
        expect.objectContaining({ completionPercentage: 75, status: 1 }))
    })

    it('reports 100 for a record already marked complete without a percentage', () => {
      store.data['completionStatus'] = 2
      expect(component.calculateCompletionStatus(trackable)).toEqual(
        expect.objectContaining({ completionPercentage: 100, status: 2 }))
    })
  })

  // Nothing on this path moves except the floor: the reading and the threshold it is
  // compared against are exactly what they were, so untracked content completes when it
  // always did.
  describe('untracked content (behaviour pinned to what it was)', () => {
    it('still completes on elapsed time at the threshold', () => {
      component.ticks = 500
      expect(component.calculateCompletionStatus(untracked)).toEqual(
        expect.objectContaining({ completionPercentage: 100, status: 2 }))
    })

    it('reports the elapsed-time ratio below the threshold', () => {
      component.ticks = 120
      expect(component.calculateCompletionStatus(untracked)).toEqual(
        expect.objectContaining({ completionPercentage: 20, status: 1 }))
    })

    it('lets cmi.progress_measure win over the clock, including a measure of 0', () => {
      component.ticks = 500
      store.data['cmi.progress_measure'] = '0'
      expect(component.calculateCompletionStatus(untracked)).toEqual(
        expect.objectContaining({ completionPercentage: 0, status: 1 }))
    })

    it('does not let objectives or score raise the reading here', () => {
      component.ticks = 120
      store.data['cmi.objectives._count'] = '2'
      store.data['cmi.objectives.0.status'] = 'completed'
      store.data['cmi.core.score.raw'] = '90'
      expect(component.calculateCompletionStatus(untracked)).toEqual(
        expect.objectContaining({ completionPercentage: 20, status: 1 }))
    })

    it('does not fall below the percentage already recorded', () => {
      component.ticks = 60
      store.data['completionPercentage'] = 45
      expect(component.calculateCompletionStatus(untracked)).toEqual(
        expect.objectContaining({ completionPercentage: 45, status: 1 }))
    })
  })

  // Both fixtures are verbatim cmi.suspend_data from real do_114645010983215104146
  // progress requests.
  describe('an Articulate Rise package (cmi.suspend_data)', () => {
    // Lessons 1 and 2 complete, lesson 3 half done, and a course-level p of 50 - which is
    // the "50% COMPLETE" Rise itself was showing at the time.
    const RISE_HALF = '{"v":2,"d":' +
'[' +
      '123,34,112,114,111,103,114,101,115,115,34,58,256,108,263,115,111,110,265,267,34,49,266,256,99,266,' +
      '49,44,257,281,48,48,283,105,278,34,48,290,280,58,282,34,289,275,292,275,294,49,125,304,283,277,301,' +
      '281,288,290,300,279,281,304,125,283,50,293,309,297,311,319,295,316,276,323,303,317,327,325,51,330,' +
      '283,52,330,305,34,332,308,295,310,299,336,325,335,340,296,298,256,312,34,302,315,283,53,327,342,350,' +
      '344,283,54,357,321,343,347,354,34,55,363,349,291,333,326,366,337,56,370,322,375,367,318,347,283,112,' +
      '285,287,364,359,383,388,372,380,306,378,365,313,324,394,366,329,400,338,373,346,397,303,337,382,406,' +
      '358,392,406,315,337,339,256,385,58,53,387,371,351,302,411,423,314,399,413,401,429,403,393,374,256,' +
      '349,414,325,418,420,304' +
      ']' + ',"cpv":"dTFga61Y"}'

    // An earlier session on the same content: 8 of 9 items into lesson 1, no lesson
    // finished yet, and so no course-level p at all.
    const RISE_FIRST_LESSON = '{"v":2,"d":' +
'[' +
      '123,34,112,114,111,103,114,101,115,115,34,58,256,108,263,115,111,110,265,267,34,49,266,256,112,266,' +
      '56,57,44,34,105,278,34,48,287,99,266,49,284,286,275,289,275,291,58,49,125,302,284,277,298,292,294,' +
      '287,297,256,299,301,303,34,50,290,307,285,309,317,300,125,304,321,301,284,316,306,322,284,51,325,' +
      '323,34,52,333,314,332,329,293,319,296,337,334,336,340,308,343,340,302,334,53,325,348,256,310,34,312,' +
      '351,284,54,354,342,356,344,284,55,363,295,365,350,324,350,314,56,287,370,351,379' +
      ']' + ',"cpv":"dTFga61Y"}'

    const riseContent = { identifier: 'do_114645010983215104146', isTrackable: true, duration: 9000 }

    beforeEach(() => {
      store.data['cmi.core.exit'] = 'suspend'
      store.data['cmi.core.lesson_location'] = 'index.html#/lessons/3vCK5GdCttR_-_ivOgVj4s6jXV4cK__t'
      store.data['spentTime'] = 97
    })

    it('reports the figure Rise itself displays', () => {
      store.data['cmi.suspend_data'] = RISE_HALF
      expect(component.calculateCompletionStatus(riseContent)).toEqual(
        expect.objectContaining({ completionPercentage: 50, status: 1 }))
    })

    // (100 + 100 + 50) / 3 - the lessons the learner has not reached are simply not in the
    // object, so anything averaged from it divides by the wrong total.
    it('does not average the per-lesson percentages to 83', () => {
      store.data['cmi.suspend_data'] = RISE_HALF
      const result: any = component.calculateCompletionStatus(riseContent)
      expect(result.completionPercentage).not.toBe(83)
    })

    it('is what the payload carries', () => {
      store.data['cmi.suspend_data'] = RISE_HALF
      const details = (component as any).buildProgressDetails(
        component.calculateCompletionStatus(riseContent))
      expect(details.completionPercentage).toBe(50)
      expect(details.completionStatus).toBe(1)
      expect(details.spentTime).toBe(97)
      expect(details.scormData['cmi.suspend_data']).toBe(RISE_HALF)
    })

    // No lesson finished, so Rise records no course-level figure. 89% of lesson 1 of six
    // is not 89% of the course, and there is nothing here that says what it is.
    it('does not read a part-finished first lesson as the whole course', () => {
      store.data['cmi.suspend_data'] = RISE_FIRST_LESSON
      store.data['spentTime'] = 429
      const result: any = component.calculateCompletionStatus(riseContent)
      expect(result.completionPercentage).not.toBe(89)
      expect(result.completionPercentage).toBe(0)
    })

    // The bad 83 already written by the averaging bug must not stick.
    it('corrects a record left too high by an earlier reading', () => {
      store.data['cmi.suspend_data'] = RISE_HALF
      store.data['completionPercentage'] = 83
      expect(component.calculateCompletionStatus(riseContent)).toEqual(
        expect.objectContaining({ completionPercentage: 50 }))
    })

    it('still completes when the package says so', () => {
      store.data['cmi.suspend_data'] = RISE_HALF
      store.data['cmi.core.lesson_status'] = 'completed'
      expect(component.calculateCompletionStatus(riseContent)).toEqual(
        expect.objectContaining({ completionPercentage: 100, status: 2 }))
    })

    it('reports 100 when Rise says the course is done', () => {
      store.data['cmi.suspend_data'] =
        '{"v":2,"d":' + JSON.stringify(lzw('{"progress":{"lessons":{},"p":100}}')) + '}'
      expect(component.calculateCompletionStatus(riseContent)).toEqual(
        expect.objectContaining({ completionPercentage: 100, status: 2 }))
    })

    it('falls through when suspend_data is another format', () => {
      // Storyline's is not JSON at all.
      store.data['cmi.suspend_data'] = '1a2b3c4d5e'
      store.data['completionPercentage'] = 30
      expect(component.calculateCompletionStatus(riseContent)).toEqual(
        expect.objectContaining({ completionPercentage: 30 }))
    })

    it('falls through on a corrupt code stream instead of throwing', () => {
      store.data['cmi.suspend_data'] = '{"v":2,"d":[123,34,9999]}'
      store.data['completionPercentage'] = 30
      expect(component.calculateCompletionStatus(riseContent)).toEqual(
        expect.objectContaining({ completionPercentage: 30 }))
    })
  })

  // The CMI store is a cache of the server's record, not a second source of truth - so it
  // is dropped when the session ends and put back by the read.
  describe('clearing the CMI store', () => {
    beforeEach(() => {
      store.data['cmi.core.lesson_location'] = 'slide-7'
      store.data['cmi.suspend_data'] = 'abc'
      ;(component as any).fireRealTimeProgress = () => undefined
      component.htmlContent = { identifier: 'do_123', duration: 600 } as any
    })

    it('drops it on teardown', () => {
      component.ngOnDestroy()
      expect(store.getAll()).toEqual({})
    })

    it('keeps it on the mobile route, where nothing reads progress back', () => {
      component.isMobileApp = true
      ;(component as any).emitScormEventToMobile = () => undefined
      component.ngOnDestroy()
      expect(store.cleared).toEqual([])
      expect(store.getAll()['cmi.core.lesson_location']).toBe('slide-7')
    })

    it('drops the outgoing content\'s store, not the incoming one\'s', () => {
      ;(component as any).oldData = { identifier: 'do_123' }
      ;(component as any).configSvc = { instanceConfig: null }
      component.htmlContent = { identifier: 'do_456', artifactUrl: '' } as any
      component.ngOnChanges()
      expect(store.cleared).toEqual(['do_123'])
      expect(store.key).toBe('do_456')
    })

    // The teardown clear is only safe because the payload is built before it runs.
    it('builds the update payload before dropping the store', () => {
      let seen: any = null
      ;(component as any).fireRealTimeProgress = () => { seen = { ...store.getAll() } }
      component.ngOnDestroy()
      expect(seen['cmi.core.lesson_location']).toBe('slide-7')
      expect(store.getAll()).toEqual({})
    })
  })

  // tocConfigData is a BehaviorSubject seeded with {}, so tocConfig is truthy before any
  // real config arrives and getThreshold answers undefined. That is left as it is - it
  // decides completion on the untracked path - so the reading has to survive it.
  describe('an unusable completion threshold', () => {
    it('leaves getThreshold answering what it always did', () => {
      component.tocConfig = {}
      expect(component.getThreshold()).toBeUndefined()
    })

    it('honours a configured threshold', () => {
      component.tocConfig = { ScormProgressThreshold: 80 }
      expect(component.getThreshold()).toBe(80)
    })
  })
})
