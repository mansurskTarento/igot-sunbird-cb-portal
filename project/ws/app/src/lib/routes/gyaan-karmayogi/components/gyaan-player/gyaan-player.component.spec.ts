import { GyaanPlayerComponent } from './gyaan-player.component'
import { of } from 'rxjs'
import { NavigationEnd } from '@angular/router'

// @sunbird-cb/collection's real barrel (public-api.ts) transitively pulls in btn-kb ->
// ckeditor5, a package that isn't installed in this environment. This component only needs
// the VIEWER_ROUTE_FROM_MIME helper, so it is stubbed as a virtual module to avoid ever
// resolving that (broken) chain. Its own mapping logic is covered separately in
// viewer-route-util.spec.ts.
jest.mock('@sunbird-cb/collection', () => ({
  VIEWER_ROUTE_FROM_MIME: jest.fn((mimeType: string) => `route-for-${mimeType}`),
}), { virtual: true })

// @sunbird-cb/utils-v2 and @sunbird-cb/toc are workspace packages only referenced here for
// their types (ConfigurationsService / ViewerDataService); every instance used in these tests
// is a plain mock object, so the real services are stubbed out.
jest.mock('@sunbird-cb/utils-v2', () => ({
  ConfigurationsService: jest.fn(),
}), { virtual: true })

jest.mock('@sunbird-cb/toc', () => ({
  ViewerDataService: jest.fn(),
}), { virtual: true })

describe('GyaanPlayerComponent', () => {
  let component: GyaanPlayerComponent
  let mockViewerDataSvc: any
  let mockConfigSvc: any
  let mockRoute: any
  let mockTitleCasePipe: any
  let mockTranslate: any
  let mockRouter: any
  let routerEventsCallback: (val: any) => void

  const buildStripConfig = () => ({
    strips: [
      {
        title: '',
        request: {
          searchV6: {
            request: {
              limit: 0,
              filters: { existingFilter: 'existing' },
            },
          },
        },
      },
    ],
  })

  const buildRoute = (overrides: any = {}) => ({
    snapshot: { queryParams: {} },
    parent: {
      snapshot: {
        data: { pageData: { data: { stripConfig: buildStripConfig() } } },
        queryParams: {},
      },
    },
    queryParams: of({}),
    ...overrides,
  })

  const createComponent = (routeOverrides: any = {}, configOverrides: any = {}) => {
    mockViewerDataSvc = { resource: { name: 'Test Resource', mimeType: 'video/mp4' } }
    mockConfigSvc = {
      userProfile: { rootOrgId: 'org-1' },
      globalConfig: { agkPlayerPaage: { relatedResources: { enabled: true } } },
      ...configOverrides,
    }
    mockRoute = buildRoute(routeOverrides)
    mockTitleCasePipe = { transform: jest.fn((val: any) => val) }
    mockTranslate = { setDefaultLang: jest.fn(), use: jest.fn() }
    mockRouter = {
      events: {
        subscribe: jest.fn((cb: any) => {
          routerEventsCallback = cb
        }),
      },
    }
    return new GyaanPlayerComponent(
      mockViewerDataSvc,
      mockConfigSvc,
      mockRoute,
      mockTitleCasePipe,
      mockTranslate,
      mockRouter,
    )
  }

  beforeEach(() => {
    localStorage.removeItem('websiteLanguage')
    jest.spyOn(console, 'log').mockImplementation(() => undefined)
    component = createComponent()
  })

  afterEach(() => {
    jest.restoreAllMocks()
    jest.clearAllMocks()
    jest.useRealTimers()
  })

  it('should create', () => {
    expect(component).toBeTruthy()
  })

  describe('constructor', () => {
    it('sets playerPreview to false when the query param is absent', () => {
      expect(component.playerPreview).toBe(false)
    })

    it('sets playerPreview to true when the query param is present', () => {
      component = createComponent({ snapshot: { queryParams: { playerPreview: true } } })
      expect(component.playerPreview).toBe(true)
    })

    it('reads collectionId from the snapshot query params when there is no parent route', () => {
      component = createComponent({
        snapshot: { queryParams: { collectionId: 'col-1' } },
        parent: undefined,
      })
      expect(component.collectionId).toBe('col-1')
    })

    it('builds pageConfig and displayContents from the parent route when stripConfig is present', () => {
      component = createComponent({
        parent: {
          snapshot: {
            data: { pageData: { data: { stripConfig: buildStripConfig() } } },
            queryParams: { playerPreview: true, collectionId: 'parent-col' },
          },
        },
      })
      expect(component.pageConfig.stripConfig).toBeDefined()
      expect(component.displayContents).toBe(false)
      expect(component.collectionId).toBe('parent-col')
    })

    it('keeps displayContents true when the parent route has no playerPreview flag', () => {
      component = createComponent({
        parent: {
          snapshot: {
            data: { pageData: { data: { stripConfig: buildStripConfig() } } },
            queryParams: {},
          },
        },
      })
      expect(component.displayContents).toBe(true)
    })

    it('leaves pageConfig undefined when the parent route has no stripConfig', () => {
      component = createComponent({ parent: undefined })
      expect(component.pageConfig).toBeUndefined()
      expect(component.displayContents).toBe(true)
    })

    it('subscribes to router events', () => {
      expect(mockRouter.events.subscribe).toHaveBeenCalled()
    })

    it('refreshes state on a NavigationEnd router event', () => {
      const updateSectorSpy = jest.spyOn(component, 'updateSectorData').mockImplementation()
      const getRelatedContentSpy = jest.spyOn(component, 'getRelatedContent').mockImplementation()

      routerEventsCallback(new NavigationEnd(1, '/a', '/a'))

      expect(component.resourceData).toEqual(mockViewerDataSvc.resource)
      expect(component.relatedContentStrip).toEqual({})
      expect(updateSectorSpy).toHaveBeenCalled()
      expect(getRelatedContentSpy).toHaveBeenCalled()
    })

    it('ignores non-NavigationEnd router events', () => {
      const updateSectorSpy = jest.spyOn(component, 'updateSectorData').mockImplementation()

      routerEventsCallback({ some: 'event' })

      expect(updateSectorSpy).not.toHaveBeenCalled()
    })

    it('sets the translate language when websiteLanguage is stored', () => {
      localStorage.setItem('websiteLanguage', 'fr')
      component = createComponent()
      expect(mockTranslate.setDefaultLang).toHaveBeenCalledWith('en')
      expect(mockTranslate.use).toHaveBeenCalledWith('fr')
    })

    it('does not touch the translate language when websiteLanguage is absent', () => {
      expect(mockTranslate.setDefaultLang).not.toHaveBeenCalled()
      expect(mockTranslate.use).not.toHaveBeenCalled()
    })

    it('sets rootOrgId from the user profile when available', () => {
      expect(component.rootOrgId).toBe('org-1')
    })

    it('leaves rootOrgId undefined when there is no user profile', () => {
      component = createComponent({}, { userProfile: undefined })
      expect(component.rootOrgId).toBeUndefined()
    })

    it('computes resourceLink from the current location', () => {
      expect(component.resourceLink).toBe(`${window.location.pathname.substring(1)}${window.location.search}`)
    })
  })

  describe('ngOnInit', () => {
    it('clones the resource and refreshes sector data and related content', () => {
      const updateSectorSpy = jest.spyOn(component, 'updateSectorData').mockImplementation()
      const getRelatedContentSpy = jest.spyOn(component, 'getRelatedContent').mockImplementation()
      jest.spyOn(component, 'handleSubsector').mockImplementation()

      component.ngOnInit()

      expect(component.resourceData).toEqual(mockViewerDataSvc.resource)
      expect(updateSectorSpy).toHaveBeenCalled()
      expect(getRelatedContentSpy).toHaveBeenCalled()
    })

    it('builds the TOC breadcrumb when opened in playerPreview with a collectionId', () => {
      component = createComponent({
        snapshot: { queryParams: { playerPreview: true, collectionId: 'col-1' } },
        parent: undefined,
      })
      component.collectionId = 'col-1'
      component.playerPreview = true

      component.ngOnInit()

      expect(component.titles).toEqual([
        {
          title: 'TOC page', disableTranslate: true,
          queryParams: {}, url: `/app/toc/col-1/overview`, icon: 'menu_book',
        },
        { title: mockViewerDataSvc.resource.name, url: 'none', icon: '' },
      ])
    })

    it('builds the full breadcrumb when displayContents is false', () => {
      component = createComponent({
        parent: {
          snapshot: {
            data: { pageData: { data: { stripConfig: buildStripConfig() } } },
            queryParams: { playerPreview: true },
          },
        },
      })

      component.ngOnInit()

      expect(component.displayContents).toBe(false)
      expect(component.titles).toEqual([
        { title: 'Gyaan Karmayogi', url: '/app/amrit-gyaan-kosh/all', icon: 'menu_book' },
        {
          title: 'TOC page', disableTranslate: true,
          queryParams: {}, url: `/app/toc/${component.collectionId}/overview`, icon: '',
        },
        { title: mockViewerDataSvc.resource.name, url: 'none', icon: '' },
      ])
    })

    it('builds the default breadcrumb otherwise', () => {
      component.ngOnInit()

      expect(component.titles).toEqual([
        { title: mockViewerDataSvc.resource.name, url: 'none', icon: '' },
      ])
    })

    it('reads the "from" query param', () => {
      mockRoute.queryParams = of({ from: 'search' })
      component = createComponent({ queryParams: of({ from: 'search' }) })

      component.ngOnInit()

      expect(component.from).toBe('search')
    })

    it('checks the instructions length after the timeout elapses', () => {
      jest.useFakeTimers()
      const checkInstructionsSpy = jest.spyOn(component, 'checkInstructionsLength').mockImplementation()

      component.ngOnInit()
      jest.advanceTimersByTime(100)

      expect(checkInstructionsSpy).toHaveBeenCalled()
    })

    it('calls handleSubsector with the first sector detail when present', () => {
      component = createComponent()
      mockViewerDataSvc.resource = {
        ...mockViewerDataSvc.resource,
        sectorDetails_v1: [{ sectorId: 's1', sectorName: 'Sector 1' }],
      }
      const handleSubsectorSpy = jest.spyOn(component, 'handleSubsector').mockImplementation()

      component.ngOnInit()

      expect(handleSubsectorSpy).toHaveBeenCalledWith({ sectorId: 's1', sectorName: 'Sector 1' })
    })

    it('calls handleSubsector with an empty object when there is no sector detail', () => {
      const handleSubsectorSpy = jest.spyOn(component, 'handleSubsector').mockImplementation()

      component.ngOnInit()

      expect(handleSubsectorSpy).toHaveBeenCalledWith([])
    })
  })

  describe('resetEnableShare', () => {
    it('sets enableShare to false', () => {
      component.enableShare = true
      component.resetEnableShare()
      expect(component.enableShare).toBe(false)
    })
  })

  describe('getMimeType', () => {
    it('returns the viewer route for the current mimeType when resourceData is present', () => {
      component.resourceData = { mimeType: 'video/mp4' }
      expect(component.getMimeType).toBe('route-for-video/mp4')
    })

    it('returns an empty string when there is no resourceData', () => {
      component.resourceData = undefined
      expect(component.getMimeType).toBe('')
    })
  })

  describe('isRelatedContentSectionEnabled', () => {
    it('is false when explicitly disabled in config', () => {
      component = createComponent({}, { globalConfig: { agkPlayerPaage: { relatedResources: { enabled: false } } } })
      expect(component.isRelatedContentSectionEnabled).toBe(false)
    })

    it('is true when explicitly enabled in config', () => {
      expect(component.isRelatedContentSectionEnabled).toBe(true)
    })

    it('is true when the config is missing altogether', () => {
      component = createComponent({}, { globalConfig: undefined })
      expect(component.isRelatedContentSectionEnabled).toBe(true)
    })
  })

  describe('getRelatedContent', () => {
    it('does not build the strip when the section is disabled', () => {
      component = createComponent({}, { globalConfig: { agkPlayerPaage: { relatedResources: { enabled: false } } } })
      component.resourceData = { name: 'Resource' }
      component.relatedContentStrip = 'sentinel'

      component.getRelatedContent()

      expect(component.relatedContentStrip).toBe('sentinel')
    })

    it('does nothing when there is no resourceData', () => {
      component.resourceData = undefined
      component.relatedContentStrip = 'sentinel'

      component.getRelatedContent()

      expect(component.relatedContentStrip).toBe('sentinel')
    })

    it('builds the strip request including all available filters', () => {
      component.resourceData = {
        name: 'Current Resource',
        sectorName: 'Sector A',
        subSectorName: 'SubSector A',
        resourceCategory: 'Course',
      }

      component.getRelatedContent()

      const filters = component.relatedContentStrip.strips[0].request.searchV6.request.filters
      expect(component.relatedContentStrip.strips[0].title).toBe('Related resources')
      expect(component.relatedContentStrip.strips[0].request.searchV6.request.limit).toBe(3)
      expect(filters).toEqual({
        existingFilter: 'existing',
        sectorName: 'Sector A',
        subSectorName: 'SubSector A',
        resourceCategory: 'Course',
        name: { '!=': ['Current Resource'] },
      })
    })

    it('omits filters that are not present on the resource', () => {
      component.resourceData = { name: 'Current Resource' }

      component.getRelatedContent()

      const filters = component.relatedContentStrip.strips[0].request.searchV6.request.filters
      expect(filters).toEqual({
        existingFilter: 'existing',
        name: { '!=': ['Current Resource'] },
      })
    })
  })

  describe('updateSectorData', () => {
    it('does nothing when there is no sectorDetails_v1', () => {
      component.resourceData = {}
      component.updateSectorData()
      expect(component.resourceData.sectorsList).toBeUndefined()
    })

    it('parses a stringified sectorDetails_v1 and derives the sector lists', () => {
      const sectorDetails = [
        { sectorId: 's1', sectorName: 'Sector 1', subSectorId: 'sub1', subSectorName: 'SubSector 1' },
      ]
      component.resourceData = { sectorDetails_v1: JSON.stringify(sectorDetails) }

      component.updateSectorData()

      expect(Array.isArray(component.resourceData.sectorDetails_v1)).toBe(true)
      expect(component.resourceData.sectorsList).toEqual([{ sectorId: 's1', sectorName: 'Sector 1' }])
      expect(component.resourceData.subSectorsList).toEqual([{ subSectorId: 'sub1', subSectorName: 'SubSector 1' }])
    })

    it('logs an error and treats the data as empty when the string is not valid JSON', () => {
      const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => undefined)
      component.resourceData = { sectorDetails_v1: 'not-json' }

      expect(() => component.updateSectorData()).not.toThrow()

      expect(errorSpy).toHaveBeenCalled()
      expect(component.resourceData.sectorsList).toBeUndefined()
    })

    it('does nothing when sectorDetails_v1 is an empty array', () => {
      component.resourceData = { sectorDetails_v1: [] }
      component.updateSectorData()
      expect(component.resourceData.sectorsList).toBeUndefined()
    })

    it('filters out entries missing the sector or subsector identifiers', () => {
      component.resourceData = {
        sectorDetails_v1: [
          { sectorId: 's1', sectorName: 'Sector 1' },
          { sectorName: 'No Id Sector' },
          { sectorId: 's2', sectorName: 'Sector 2', subSectorId: 'sub2', subSectorName: 'SubSector 2' },
        ],
      }

      component.updateSectorData()

      expect(component.resourceData.sectorsList).toEqual([
        { sectorId: 's1', sectorName: 'Sector 1' },
        { sectorId: 's2', sectorName: 'Sector 2' },
      ])
      expect(component.resourceData.subSectorsList).toEqual([
        { subSectorId: 'sub2', subSectorName: 'SubSector 2' },
      ])
    })
  })

  describe('checkInstructionsLength', () => {
    it('does nothing when there are no instructions', () => {
      component.resourceData = {}
      component.checkInstructionsLength()
      expect(component.hasLongInstructions).toBe(false)
    })

    it('is false for short instructions', () => {
      component.resourceData = { instructions: '<p>short text</p>' }
      component.checkInstructionsLength()
      expect(component.hasLongInstructions).toBe(false)
    })

    it('is true for long instructions', () => {
      component.resourceData = { instructions: `<p>${'a'.repeat(250)}</p>` }
      component.checkInstructionsLength()
      expect(component.hasLongInstructions).toBe(true)
    })
  })

  describe('toggleInstructions', () => {
    it('toggles isInstructionsExpanded', () => {
      expect(component.isInstructionsExpanded).toBe(false)
      component.toggleInstructions()
      expect(component.isInstructionsExpanded).toBe(true)
      component.toggleInstructions()
      expect(component.isInstructionsExpanded).toBe(false)
    })
  })

  describe('handleSubsector', () => {
    it('resets state and returns early when there is no sectorDetails_v1', () => {
      component.subSectorsList = ['previous']
      component.resourceData = {}

      component.handleSubsector({ sectorName: 'Sector 1', sectorId: 's1' })

      expect(component.selectedSector).toBe('Sector 1')
      expect(component.selectedSectorId).toBe('s1')
      expect(component.subSectorDetailArr).toEqual([])
      expect(component.subSectorsList).toEqual(['previous'])
    })

    it('builds the subsector list for the selected sector', () => {
      component.resourceData = {
        sectorDetails_v1: [
          { sectorId: 's1', sectorName: 'Sector 1', subSectorName: 'SubSector 1' },
          { sectorId: 's1', sectorName: 'Sector 1', subSectorName: 'SubSector 1' },
          { sectorId: 's2', sectorName: 'Sector 2', subSectorName: 'SubSector 2' },
        ],
      }

      component.handleSubsector({ sectorName: 'Sector 1', sectorId: 's1' })

      // subSectorDetailArr keeps every matching entry (not deduplicated)
      expect(component.subSectorDetailArr).toEqual([
        { sectorId: 's1', sectorName: 'Sector 1', key: 'SubSector 1', value: ['SubSector 1'] },
        { sectorId: 's1', sectorName: 'Sector 1', key: 'SubSector 1', value: ['SubSector 1'] },
      ])
      // subSectorsList is deduplicated by subSectorName via getUniqueArray
      expect(component.subSectorsList).toHaveLength(1)
      expect(component.subSectorsList[0].widgetData.content).toEqual({
        sectorId: 's1',
        sectorName: 'Sector 1',
        key: 'SubSector 1',
        value: ['SubSector 1'],
      })
    })

    it('sets an empty subsector list when no entries match the selected sector', () => {
      component.resourceData = {
        sectorDetails_v1: [{ sectorId: 's2', sectorName: 'Sector 2', subSectorName: 'SubSector 2' }],
      }

      component.handleSubsector({ sectorName: 'Sector 1', sectorId: 's1' })

      expect(component.subSectorsList).toEqual([])
    })
  })

  describe('getUniqueArray', () => {
    it('returns an empty array for empty input', () => {
      expect(component.getUniqueArray([])).toEqual([])
    })

    it('deduplicates entries by subSectorName', () => {
      const result = component.getUniqueArray([
        { subSectorName: 'A', id: 1 },
        { subSectorName: 'A', id: 2 },
        { subSectorName: 'B', id: 3 },
      ])
      expect(result).toEqual([
        { subSectorName: 'A', id: 1 },
        { subSectorName: 'B', id: 3 },
      ])
    })
  })
})
