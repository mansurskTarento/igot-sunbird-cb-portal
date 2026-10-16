import { Router } from '@angular/router'
import { TranslateService } from '@ngx-translate/core'
import { WidgetContentService } from '@sunbird-cb/toc'
import { ConfigurationsService, MultilingualTranslationsService } from '@sunbird-cb/utils-v2'
import { of, Subject } from 'rxjs'

jest.mock('@sunbird-cb/toc', () => ({
  WidgetContentService: class { },
}))
jest.mock('@sunbird-cb/utils-v2', () => ({
  ConfigurationsService: class { },
  MultilingualTranslationsService: class { },
}))

import { ProfileKarmapointsComponent } from './profile-karmapoints.component'

const row = (overrides: any = {}) => ({
  operation_type: 'COURSE_COMPLETION',
  context_type: 'Course',
  credit_date: 1760000000000,
  points: 5,
  addinfo: '{"COURSENAME":"Basics of Governance"}',
  ...overrides,
})

const page = (rows: any[], count: number) => ({ kpList: rows, count })

describe('ProfileKarmapointsComponent', () => {
  let component: ProfileKarmapointsComponent
  let languageSelected: Subject<any>
  let configStub: { userProfile: any }
  let routerStub: { navigate: jest.Mock }
  let contentStub: { getKarmaPoitns: jest.Mock }
  let translateStub: { setDefaultLang: jest.Mock, use: jest.Mock }
  let langStub: { languageSelectedObservable: Subject<any>, translateLabel: jest.Mock }

  const build = () => new ProfileKarmapointsComponent(
    configStub as unknown as ConfigurationsService,
    routerStub as unknown as Router,
    contentStub as unknown as WidgetContentService,
    translateStub as unknown as TranslateService,
    langStub as unknown as MultilingualTranslationsService,
  )

  beforeEach(() => {
    localStorage.clear()
    languageSelected = new Subject()
    configStub = { userProfile: { userId: 'user-1' } }
    routerStub = { navigate: jest.fn() }
    contentStub = { getKarmaPoitns: jest.fn(() => of(page([], 0))) }
    translateStub = { setDefaultLang: jest.fn(), use: jest.fn() }
    langStub = {
      languageSelectedObservable: languageSelected,
      translateLabel: jest.fn((label: string) => `translated ${label}`),
    }
    component = build()
  })

  it('should create', () => {
    expect(component).toBeTruthy()
  })

  describe('constructor', () => {
    it('should take the current user from the configuration service', () => {
      expect(component.currentUser).toEqual({ userId: 'user-1' })
    })

    it('should leave currentUser undefined when there is no configuration service', () => {
      configStub = undefined as any

      expect(build().currentUser).toBeUndefined()
    })

    it('should start with an empty history and no loader or load more button', () => {
      expect(component.karmaPointsHistory).toEqual([])
      expect(component.total).toBe(0)
      expect(component.count).toBe(0)
      expect(component.showLoader).toBe(false)
      expect(component.showMoreBtn).toBe(false)
    })

    it('should start paging from the current time', () => {
      const before = Date.now()
      const built = build()
      const after = Date.now()

      expect(built.lastDate).toBeGreaterThanOrEqual(before)
      expect(built.lastDate).toBeLessThanOrEqual(after)
    })
  })

  describe('language selection', () => {
    it('should switch the translations to the stored website language', () => {
      localStorage.setItem('websiteLanguage', 'hi')

      languageSelected.next(true)

      expect(translateStub.setDefaultLang).toHaveBeenCalledWith('en')
      expect(translateStub.use).toHaveBeenCalledWith('hi')
    })

    it('should not touch the translations when no website language is stored', () => {
      languageSelected.next(true)

      expect(translateStub.setDefaultLang).not.toHaveBeenCalled()
      expect(translateStub.use).not.toHaveBeenCalled()
    })

    it('should follow every later language change', () => {
      localStorage.setItem('websiteLanguage', 'hi')
      languageSelected.next(true)
      localStorage.setItem('websiteLanguage', 'ta')
      languageSelected.next(true)

      expect(translateStub.use).toHaveBeenNthCalledWith(1, 'hi')
      expect(translateStub.use).toHaveBeenNthCalledWith(2, 'ta')
    })
  })

  describe('ngOnInit', () => {
    it('should load the first page of karma points', () => {
      component.ngOnInit()

      expect(contentStub.getKarmaPoitns).toHaveBeenCalledTimes(1)
    })
  })

  describe('getKarmaPoints', () => {
    it('should ask for ten records ending at lastDate', () => {
      component.lastDate = 1750000000000

      component.getKarmaPoints()

      expect(contentStub.getKarmaPoitns).toHaveBeenCalledWith(10, 1750000000000)
    })

    it('should show the loader while the request is pending', () => {
      contentStub.getKarmaPoitns.mockReturnValue(new Subject())

      component.getKarmaPoints()

      expect(component.showLoader).toBe(true)
    })

    it('should store the page and hide the loader once it arrives', () => {
      const rows = [row(), row({ operation_type: 'RATING' })]
      contentStub.getKarmaPoitns.mockReturnValue(of(page(rows, 2)))

      component.getKarmaPoints()

      expect(component.karmaPointsHistory).toEqual(rows)
      expect(component.total).toBe(2)
      expect(component.count).toBe(2)
      expect(component.showLoader).toBe(false)
    })

    it('should move lastDate to the credit date of the last record', () => {
      contentStub.getKarmaPoitns.mockReturnValue(of(page([
        row({ credit_date: 1760000000000 }),
        row({ credit_date: 1750000000000 }),
      ], 2)))

      component.getKarmaPoints()

      expect(component.lastDate).toBe(1750000000000)
    })

    it('should offer load more while the server holds more records than were fetched', () => {
      contentStub.getKarmaPoitns.mockReturnValue(of(page([row(), row()], 25)))

      component.getKarmaPoints()

      expect(component.showMoreBtn).toBe(true)
    })

    it('should not offer load more once every record was fetched', () => {
      contentStub.getKarmaPoitns.mockReturnValue(of(page([row(), row()], 2)))

      component.getKarmaPoints()

      expect(component.showMoreBtn).toBe(false)
    })

    it('should append later pages and stop offering load more on the last one', () => {
      const first = [row({ credit_date: 3 }), row({ credit_date: 2 })]
      const second = [row({ credit_date: 1 })]
      contentStub.getKarmaPoitns
        .mockReturnValueOnce(of(page(first, 3)))
        .mockReturnValueOnce(of(page(second, 3)))

      component.getKarmaPoints()
      expect(component.showMoreBtn).toBe(true)

      component.getKarmaPoints()

      expect(component.karmaPointsHistory).toEqual([...first, ...second])
      expect(component.count).toBe(3)
      expect(component.lastDate).toBe(1)
      expect(component.showMoreBtn).toBe(false)
    })

    it('should clear the loader and load more button on an empty page and keep what was fetched', () => {
      const first = [row(), row()]
      contentStub.getKarmaPoitns
        .mockReturnValueOnce(of(page(first, 5)))
        .mockReturnValueOnce(of(page([], 5)))

      component.getKarmaPoints()
      component.getKarmaPoints()

      expect(component.karmaPointsHistory).toEqual(first)
      expect(component.showLoader).toBe(false)
      expect(component.showMoreBtn).toBe(false)
    })

    it('should treat a response without a kpList as an empty page', () => {
      contentStub.getKarmaPoitns.mockReturnValue(of({ count: 0 }))

      component.getKarmaPoints()

      expect(component.karmaPointsHistory).toEqual([])
      expect(component.showLoader).toBe(false)
      expect(component.showMoreBtn).toBe(false)
    })

    it('should treat a null response as an empty page', () => {
      contentStub.getKarmaPoitns.mockReturnValue(of(null))

      component.getKarmaPoints()

      expect(component.karmaPointsHistory).toEqual([])
      expect(component.showLoader).toBe(false)
      expect(component.showMoreBtn).toBe(false)
    })
  })

  describe('loadMore', () => {
    it('should fetch the next page from the last record already shown', () => {
      contentStub.getKarmaPoitns.mockReturnValueOnce(of(page([row({ credit_date: 1750000000000 })], 4)))
      component.getKarmaPoints()

      component.loadMore()

      expect(contentStub.getKarmaPoitns).toHaveBeenLastCalledWith(10, 1750000000000)
    })
  })

  describe('getName', () => {
    it('should return the course name for a course record', () => {
      expect(component.getName(row())).toBe('Basics of Governance')
    })

    it('should return an empty string when a course record has no course name', () => {
      expect(component.getName(row({ addinfo: '{}' }))).toBe('')
    })

    it('should return the event name for an event record', () => {
      expect(component.getName(row({
        context_type: 'Event', addinfo: '{"EVENTNAME":"Karmayogi Talks"}',
      }))).toBe('Karmayogi Talks')
    })

    it('should match the event context type whatever its case', () => {
      expect(component.getName(row({
        context_type: 'EVENT', addinfo: '{"EVENTNAME":"Karmayogi Talks"}',
      }))).toBe('Karmayogi Talks')
    })

    it('should return an empty string when an event record has no event name', () => {
      expect(component.getName(row({ context_type: 'event', addinfo: '{}' }))).toBe('')
    })

    it('should not read a course name from an event record', () => {
      expect(component.getName(row({
        context_type: 'Event', addinfo: '{"COURSENAME":"Basics of Governance"}',
      }))).toBe('')
    })

    it('should match the course context type exactly', () => {
      expect(component.getName(row({ context_type: 'course' }))).toBe('')
    })

    it('should return an empty string for any other context type', () => {
      expect(component.getName(row({ context_type: 'Login' }))).toBe('')
    })

    it('should return an empty string when the record has no addinfo', () => {
      expect(component.getName(row({ addinfo: undefined }))).toBe('')
      expect(component.getName(row({ addinfo: '' }))).toBe('')
    })

    it('should return an empty string when there is no record', () => {
      expect(component.getName(null)).toBe('')
      expect(component.getName(undefined)).toBe('')
    })
  })

  describe('getAdditonInfo', () => {
    it('should return the ACBP value from the addinfo', () => {
      expect(component.getAdditonInfo(row({ addinfo: '{"ACBP":10}' }))).toBe(10)
    })

    it('should return undefined when the addinfo carries no ACBP value', () => {
      expect(component.getAdditonInfo(row({ addinfo: '{}' }))).toBeUndefined()
    })

    it('should return false when the record has no addinfo', () => {
      expect(component.getAdditonInfo(row({ addinfo: undefined }))).toBe(false)
      expect(component.getAdditonInfo(row({ addinfo: '' }))).toBe(false)
    })

    it('should return false when there is no record', () => {
      expect(component.getAdditonInfo(null)).toBe(false)
      expect(component.getAdditonInfo(undefined)).toBe(false)
    })
  })

  describe('getTitle', () => {
    it.each([
      ['COURSE_COMPLETION', 'Course Completion'],
      ['RATING', 'Course Rating'],
      ['FIRST_LOGIN', 'First Login'],
      ['FIRST_ENROLMENT', 'First Enrollment'],
    ])('should translate the %s title', (operationType, label) => {
      const title = component.getTitle(row({ operation_type: operationType }))

      expect(title).toBe(`translated ${label}`)
      expect(langStub.translateLabel).toHaveBeenCalledWith(label, 'profileKarmapoints', '')
    })

    it('should capitalise each word of an operation type with no translation', () => {
      expect(component.getTitle(row({ operation_type: 'LEARNING_HOUR' }))).toBe('Learning Hour')
    })

    it('should capitalise a single word operation type', () => {
      expect(component.getTitle(row({ operation_type: 'BONUS' }))).toBe('Bonus')
    })

    it('should capitalise an operation type of any case', () => {
      expect(component.getTitle(row({ operation_type: 'event_attendance_bonus' }))).toBe('Event Attendance Bonus')
      expect(component.getTitle(row({ operation_type: 'eVeNt_aTtEnDaNcE' }))).toBe('Event Attendance')
    })

    it('should not translate an operation type with no translation', () => {
      component.getTitle(row({ operation_type: 'LEARNING_HOUR' }))

      expect(langStub.translateLabel).not.toHaveBeenCalled()
    })

    it('should return No Title when there is no record', () => {
      expect(component.getTitle(null)).toBe('No Title')
      expect(component.getTitle(undefined)).toBe('No Title')
    })
  })

  describe('translateLabels', () => {
    it('should hand the label, type and subtype to the translation service', () => {
      const result = component.translateLabels('tooltip', 'profileKarmapoints', '')

      expect(langStub.translateLabel).toHaveBeenCalledWith('tooltip', 'profileKarmapoints', '')
      expect(result).toBe('translated tooltip')
    })
  })
})
