import { of } from 'rxjs'
import { SearchApiService } from './search-api.service'

describe('SearchApiService (No TestBed)', () => {
  let service: SearchApiService
  let mockHttp: any

  beforeEach(() => {
    mockHttp = {
      post: jest.fn(),
      get: jest.fn(),
    }
    service = new SearchApiService(mockHttp)
  })

  it('should be created', () => {
    expect(service).toBeTruthy()
  })

  describe('getSearchResults', () => {
    it('posts the social search request', done => {
      mockHttp.post.mockReturnValue(of({ result: [] }))
      service.getSearchResults({ q: 'x' } as any).subscribe((res: any) => {
        expect(mockHttp.post).toHaveBeenCalledWith('/apis/protected/v8/social/post/search', { q: 'x' })
        expect(res).toEqual({ result: [] })
        done()
      })
    })
  })

  describe('getSearchAutoCompleteResults', () => {
    it('gets the auto-complete results with the given params', done => {
      mockHttp.get.mockReturnValue(of([{ id: '1' }]))
      const params = { q: 'ab', l: 'en' }
      service.getSearchAutoCompleteResults(params).subscribe((res: any) => {
        expect(mockHttp.get).toHaveBeenCalledWith('/apis/protected/v8/content/searchAutoComplete', { params })
        expect(res).toEqual([{ id: '1' }])
        done()
      })
    })
  })

  describe('getSearchV6Results', () => {
    const searchconfig = [
      { name: 'language', values: [{ name: 'en', count: 3 }] },
      { name: 'catalogPaths', values: [] },
    ]

    it('builds facets from the search config when the response has facets', done => {
      mockHttp.post.mockReturnValue(of({
        result: { facets: [{ name: 'language' }] },
        filters: [],
      }))
      service.getSearchV6Results({} as any, searchconfig).subscribe((res: any) => {
        expect(mockHttp.post).toHaveBeenCalledWith('/apis/proxies/v8/sunbirdigot/search', {})
        const languageFilter = res.filters.find((f: any) => f.type === 'language')
        expect(languageFilter).toEqual(expect.objectContaining({
          displayName: 'language',
          content: [{ displayName: 'en', type: 'en', count: 3, id: '' }],
        }))
        done()
      })
    })

    it('flattens catalogPaths content down to [] when it holds exactly one entry', done => {
      const catalogSearchConfig = [
        { name: 'catalogPaths', values: [{ name: 'root', count: 1 }] },
      ]
      mockHttp.post.mockReturnValue(of({
        result: { facets: [{ name: 'catalogPaths' }] },
      }))
      service.getSearchV6Results({} as any, catalogSearchConfig).subscribe((res: any) => {
        const catalogFilter = res.filters.find((f: any) => f.type === 'catalogPaths')
        expect(catalogFilter.content).toEqual([])
        done()
      })
    })

    it('leaves catalogPaths content untouched when it holds more than one entry', done => {
      const catalogSearchConfig = [
        { name: 'catalogPaths', values: [{ name: 'a', count: 1 }, { name: 'b', count: 2 }] },
      ]
      mockHttp.post.mockReturnValue(of({
        result: { facets: [{ name: 'catalogPaths' }] },
      }))
      service.getSearchV6Results({} as any, catalogSearchConfig).subscribe((res: any) => {
        const catalogFilter = res.filters.find((f: any) => f.type === 'catalogPaths')
        expect(catalogFilter.content.length).toBe(2)
        done()
      })
    })

    it('skips building facets when the response has no facets', done => {
      mockHttp.post.mockReturnValue(of({ result: { facets: [] } }))
      service.getSearchV6Results({} as any, searchconfig).subscribe((res: any) => {
        expect(res.filters).toEqual([])
        done()
      })
    })
  })
})
