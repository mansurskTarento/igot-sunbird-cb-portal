import { of } from 'rxjs'
import { SearchServService } from './search-serv.service'

describe('SearchServService (No TestBed)', () => {
  let service: SearchServService
  let mockEvents: any
  let mockSearchApi: any
  let mockConfigSrv: any
  let mockHttp: any

  beforeEach(() => {
    mockEvents = {
      dispatchEvent: jest.fn(),
    }

    mockSearchApi = {
      getSearchAutoCompleteResults: jest.fn().mockReturnValue(of([{ id: '1' }])),
      getSearchV6Results: jest.fn().mockReturnValue(of({ result: { content: [] } })),
      getSearchResults: jest.fn().mockReturnValue(of({ result: [] })),
    }

    mockConfigSrv = {
      sitePath: 'https://site.example.com',
      activeOrg: 'org-1',
      rootOrg: 'root-org-1',
    }

    mockHttp = {
      get: jest.fn().mockReturnValue({ toPromise: jest.fn().mockResolvedValue({ search: {} }) }),
    }

    service = new SearchServService(mockEvents, mockSearchApi, mockConfigSrv, mockHttp)
    jest.spyOn(Storage.prototype, 'getItem').mockReturnValue(null)
    jest.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { })
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  it('should be created', () => {
    expect(service).toBeTruthy()
  })

  describe('defaultFiltersTranslated', () => {
    it('returns the default translation shape', () => {
      expect(service.defaultFiltersTranslated).toEqual({ en: {}, all: {} })
    })
  })

  describe('getSearchConfig', () => {
    it('fetches and caches the config on first call', async () => {
      const result = await service.getSearchConfig()
      expect(mockHttp.get).toHaveBeenCalledWith(`${mockConfigSrv.sitePath}/feature/search.json`)
      expect(result).toEqual({ search: {} })
    })

    it('reuses the cached config on subsequent calls', async () => {
      await service.getSearchConfig()
      mockHttp.get.mockClear()
      const result = await service.getSearchConfig()
      expect(mockHttp.get).not.toHaveBeenCalled()
      expect(result).toEqual({ search: {} })
    })
  })

  describe('getApplyPhraseSearch', () => {
    it('returns true when phraseSearch is enabled', async () => {
      jest.spyOn(service, 'getSearchConfig').mockResolvedValue({ search: { tabs: [{ phraseSearch: true }] } })
      expect(await service.getApplyPhraseSearch()).toBe(true)
    })

    it('returns true when phraseSearch is undefined', async () => {
      jest.spyOn(service, 'getSearchConfig').mockResolvedValue({ search: { tabs: [{}] } })
      expect(await service.getApplyPhraseSearch()).toBe(true)
    })

    it('returns false when phraseSearch is explicitly disabled', async () => {
      jest.spyOn(service, 'getSearchConfig').mockResolvedValue({ search: { tabs: [{ phraseSearch: false }] } })
      expect(await service.getApplyPhraseSearch()).toBe(false)
    })
  })

  describe('searchAutoComplete', () => {
    it('calls the api for a single non-all language', async () => {
      const result = await service.searchAutoComplete({ q: 'ABC', l: 'en' } as any)
      expect(mockSearchApi.getSearchAutoCompleteResults).toHaveBeenCalled()
      expect(result).toEqual([{ id: '1' }])
    })

    it('resolves to an empty array for multiple languages', async () => {
      const result = await service.searchAutoComplete({ q: 'ABC', l: 'en,fr' } as any)
      expect(result).toEqual([])
    })

    it('resolves to an empty array for "all"', async () => {
      const result = await service.searchAutoComplete({ q: 'ABC', l: 'all' } as any)
      expect(result).toEqual([])
    })
  })

  describe('getLearning / searchV6Wrapper', () => {
    it('builds a v6 request from the search config and delegates to searchApi', done => {
      service.searchConfig = { search: { visibleFiltersV2: { language: {} } }, defaultsearch: {} }
      const request = {
        request: {
          query: 'angular',
          filters: {},
          sort_by: { lastUpdatedOn: 'desc' },
          fields: ['name'],
        },
      }
      service.getLearning(request as any).subscribe((res: any) => {
        expect(mockSearchApi.getSearchV6Results).toHaveBeenCalledWith(
          expect.objectContaining({ request: expect.objectContaining({ query: 'angular', fuzzy: false }) }),
          service.searchConfig.defaultsearch
        )
        expect(res).toEqual({ result: { content: [] } })
        done()
      })
    })
  })

  describe('fetchSocialSearchUsers', () => {
    it('merges org context into the request and delegates to searchApi', () => {
      service.fetchSocialSearchUsers({ q: 'x' } as any)
      expect(mockSearchApi.getSearchResults).toHaveBeenCalledWith(expect.objectContaining({
        org: 'org-1',
        rootOrg: 'root-org-1',
        q: 'x',
      }))
    })
  })

  describe('fetchSearchDataDocs / fetchSearchDataProjects', () => {
    it('return an empty string placeholder', () => {
      expect(service.fetchSearchDataDocs({})).toBe('')
      expect(service.fetchSearchDataProjects({})).toBe('')
    })
  })

  describe('updateSelectedFiltersSet', () => {
    it('splits tag filters into hierarchical path segments', () => {
      const result = service.updateSelectedFiltersSet({ tags: ['a/b/c'] })
      expect(result.filterReset).toBe(true)
      expect(Array.from(result.filterSet)).toEqual(['a', 'a/b', 'a/b/c'])
    })

    it('adds non-tag filters directly', () => {
      const result = service.updateSelectedFiltersSet({ language: ['en', 'fr'] })
      expect(Array.from(result.filterSet)).toEqual(['en', 'fr'])
      expect(result.filterReset).toBe(true)
    })

    it('reports no reset needed for empty filters', () => {
      const result = service.updateSelectedFiltersSet({ language: [] })
      expect(result.filterReset).toBe(false)
    })

    it('handles a null/undefined filters map', () => {
      const result = service.updateSelectedFiltersSet(undefined as any)
      expect(Array.from(result.filterSet)).toEqual([])
      expect(result.filterReset).toBe(false)
    })
  })

  describe('transformSearchV6Filters', () => {
    it('flattens andFilters into a single object', () => {
      const result = service.transformSearchV6Filters([
        { andFilters: [{ language: ['en'] }, { organisation: ['org'] }] },
      ] as any)
      expect(result).toEqual({ language: ['en'], organisation: ['org'] })
    })

    it('ignores entries without andFilters', () => {
      const result = service.transformSearchV6Filters([{} as any])
      expect(result).toEqual({})
    })
  })

  describe('handleFilters', () => {
    const filters = [
      {
        type: 'concepts',
        content: Array.from({ length: 12 }, (_, i) => ({ type: `c${i}` })),
      },
      { type: 'dtLastModified', content: [] },
      { type: 'contentType', content: [{ type: 'course' }] },
      {
        type: 'language',
        content: [
          { type: 'en', children: [{ type: 'en-in' }] },
          { type: 'fr' },
        ],
      },
    ] as any

    it('extracts the first 10 concepts and drops dtLastModified', () => {
      const result = service.handleFilters(filters, new Set(['en']), { language: ['en'] })
      expect(result.concept.length).toBe(10)
      expect(result.filtersRes.some((f: any) => f.type === 'dtLastModified')).toBe(false)
    })

    it('drops contentType when showContentType is true', () => {
      const result = service.handleFilters(filters, new Set(), {}, true)
      expect(result.filtersRes.some((f: any) => f.type === 'contentType')).toBe(false)
    })

    it('keeps contentType when showContentType is false', () => {
      const result = service.handleFilters(filters, new Set(), {}, false)
      expect(result.filtersRes.some((f: any) => f.type === 'contentType')).toBe(true)
    })

    it('marks matching filter content as checked and expands children', () => {
      const result = service.handleFilters(filters, new Set(['en']), { language: ['en'] })
      const languageFilter: any = result.filtersRes.find((f: any) => f.type === 'language')
      expect(languageFilter.checked).toBe(true)
      const enContent: any = languageFilter.content.find((c: any) => c.type === 'en')
      expect(enContent.checked).toBe(true)
      expect(enContent.children[0]).toEqual(expect.objectContaining({ type: 'en-in', checked: false }))
    })
  })

  describe('setTilesDocs', () => {
    it('maps a response into tile objects', () => {
      const tiles = service.setTilesDocs([
        { itemId: '1', source: 'KShop', title: 't1' },
      ])
      expect(tiles[0]).toEqual(expect.objectContaining({ itemId: '1', title: 't1', color: '3px solid #f26522' }))
    })

    it('falls back to the default border color for other sources', () => {
      const tiles = service.setTilesDocs([{ itemId: '2', source: 'other', title: 't2' }])
      expect(tiles[0].color).toBe('3px solid #28a9b2')
    })
  })

  describe('setTileProject', () => {
    it('maps a response into project tile objects', () => {
      const tiles = service.setTileProject([
        { itemId: 'p1', mstProjectName: 'Project 1', dateStartDate: '2024-01-01' },
      ])
      expect(tiles[0]).toEqual(expect.objectContaining({ itemId: 'p1', title: 'Project 1', category: 'Project' }))
    })
  })

  describe('formatKhubFilters', () => {
    it('builds a filter unit response array', () => {
      const result = service.formatKhubFilters({ automationCentral: [{ doc_count: 2, key: 'tool-a' }] })
      expect(result[0]).toEqual(expect.objectContaining({ type: 'automationCentral', displayName: 'Tools' }))
      expect(result[0].content[0]).toEqual({ count: 2, displayName: 'tool-a', type: 'tool-a' })
    })
  })

  describe('formatFilterForSearch', () => {
    it('formats non-empty filters into a query string', () => {
      const result = service.formatFilterForSearch({ language: ['en', 'fr'] })
      expect(result).toBe('"language":["en","fr"]')
    })

    it('skips empty filter arrays', () => {
      const result = service.formatFilterForSearch({ language: [] })
      expect(result).toBe('')
    })
  })

  describe('getDisplayName', () => {
    it.each([
      ['automationcentral', 'Tools'],
      ['autogeneratedtopic', 'Topics'],
      ['topics', 'Topics'],
      ['kshopdocument', 'Kshop Document'],
      ['project', 'Project References'],
      ['kshop', 'Documents'],
      ['itemtype', 'Item Type'],
      ['authors.mailid', 'Authors'],
      ['mstlocation', 'Location'],
      ['status', 'Project Status'],
      ['marketing', 'Marketing'],
      ['unknown-type', 'unknown-type'],
    ])('maps %s to %s', (type, expected) => {
      expect(service.getDisplayName(type)).toBe(expected)
    })
  })

  describe('getLanguageSearchIndex', () => {
    it('maps zh-CN to zh', () => {
      expect(service.getLanguageSearchIndex('zh-CN')).toBe('zh')
    })

    it('returns other languages unchanged', () => {
      expect(service.getLanguageSearchIndex('en')).toBe('en')
    })
  })

  describe('raiseSearchEvent', () => {
    it('dispatches a telemetry interact event', () => {
      service.raiseSearchEvent('angular', { language: ['en'] }, 'en')
      expect(mockEvents.dispatchEvent).toHaveBeenCalledWith(expect.objectContaining({
        from: 'search',
        to: 'telemetry',
        data: expect.objectContaining({ object: expect.objectContaining({ query: 'angular' }) }),
      }))
    })
  })

  describe('raiseSearchResponseEvent', () => {
    it('dispatches a telemetry search event', () => {
      service.raiseSearchResponseEvent('angular', {}, 5, 'en')
      expect(mockEvents.dispatchEvent).toHaveBeenCalledWith(expect.objectContaining({
        from: 'search',
        to: 'telemetry',
        data: expect.objectContaining({ query: 'angular', size: 5 }),
      }))
    })
  })

  describe('translateSearchFilters', () => {
    it('fetches and caches a translation for a new language', async () => {
      mockHttp.get.mockReturnValue({ toPromise: jest.fn().mockResolvedValue({ some: 'translation' }) })
      const result = await service.translateSearchFilters('fr')
      expect(mockHttp.get).toHaveBeenCalled()
      expect(result).toEqual({ some: 'translation' })
    })

    it('reuses an already-translated language from storage', async () => {
      jest.spyOn(Storage.prototype, 'getItem').mockReturnValue(JSON.stringify({ fr: { cached: true } }))
      const result = await service.translateSearchFilters('fr')
      expect(mockHttp.get).not.toHaveBeenCalled()
      expect(result).toEqual({ cached: true })
    })

    it('returns the english translation for a multi-locale request', async () => {
      jest.spyOn(Storage.prototype, 'getItem').mockReturnValue(JSON.stringify({ en: { hello: 'world' } }))
      const result = await service.translateSearchFilters('en,fr')
      expect(result).toEqual({ hello: 'world' })
    })

    it('returns an empty object when no english translation is cached', async () => {
      jest.spyOn(Storage.prototype, 'getItem').mockReturnValue(JSON.stringify({}))
      const result = await service.translateSearchFilters('en,fr')
      expect(result).toEqual({})
    })
  })
})
