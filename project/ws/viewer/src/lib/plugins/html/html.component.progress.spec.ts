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
describe('HtmlComponent progress reading', () => {
  let component: HtmlComponent
  let store: any

  const trackable = { identifier: 'do_123', isTrackable: true, duration: 600 }
  const untracked = { identifier: 'do_456', duration: 600 }

  beforeEach(() => {
    store = {
      data: {} as any,
      getAll() { return this.data },
      getItem(key: string) { return this.data[key] },
      setItem(key: string, value: any) { this.data[key] = value },
    }
    const adapter: any = {
      scorm2004Api: {},
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

    it('falls back to score when there are no objectives', () => {
      store.data['cmi.core.score.raw'] = '30'
      store.data['cmi.core.score.max'] = '100'
      expect(component.calculateCompletionStatus(trackable)).toEqual(
        expect.objectContaining({ completionPercentage: 30, status: 1 }))
    })

    it('falls back to elapsed time when the package reported nothing at all', () => {
      component.ticks = 120
      expect(component.calculateCompletionStatus(trackable)).toEqual(
        expect.objectContaining({ completionPercentage: 20, status: 1 }))
    })

    it('never lets the elapsed-time proxy reach the completion threshold', () => {
      component.ticks = 6000
      const result: any = component.calculateCompletionStatus(trackable)
      expect(result.completionPercentage).toBe(69)
      expect(result.status).toBe(1)
    })

    it('never reports 100 without the package saying so', () => {
      store.data['cmi.objectives._count'] = '2'
      store.data['cmi.objectives.0.status'] = 'completed'
      store.data['cmi.objectives.1.status'] = 'passed'
      const result: any = component.calculateCompletionStatus(trackable)
      expect(result.completionPercentage).toBe(99)
      expect(result.status).toBe(1)
    })

    it('completes when the package writes cmi.core.lesson_status', () => {
      store.data['cmi.core.lesson_status'] = 'completed'
      expect(component.calculateCompletionStatus(trackable)).toEqual(
        expect.objectContaining({ completionPercentage: 100, status: 2 }))
    })

    // A session starts with an empty CMI store: the first interaction fires the debounced
    // update before the package has written anything back.
    it('does not fall below the percentage already recorded', () => {
      store.data['completionPercentage'] = 60
      store.data['completionStatus'] = 1
      expect(component.calculateCompletionStatus(trackable)).toEqual(
        expect.objectContaining({ completionPercentage: 60, status: 1 }))
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

  // tocConfigData is a BehaviorSubject seeded with {}, so tocConfig is truthy before any
  // real config arrives and getThreshold answers undefined. That is left as it is - it
  // decides completion on the untracked path - so the reading has to survive it.
  describe('an unusable completion threshold', () => {
    it('leaves getThreshold answering what it always did', () => {
      component.tocConfig = {}
      expect(component.getThreshold()).toBeUndefined()
    })

    it('does not let it reach the elapsed-time proxy as NaN', () => {
      component.tocConfig = {}
      component.ticks = 6000
      const result: any = component.calculateCompletionStatus(trackable)
      expect(result.completionPercentage).toBe(69)
      expect(result.status).toBe(1)
    })

    it('honours a configured threshold', () => {
      component.tocConfig = { ScormProgressThreshold: 80 }
      expect(component.getThreshold()).toBe(80)
    })
  })
})
