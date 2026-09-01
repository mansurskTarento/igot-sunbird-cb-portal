import { IndexedDbService } from './indexed-db.service'

// jsdom does not implement `indexedDB` in this workspace's Jest environment (there is no
// fake-indexeddb dependency and no existing global polyfill in src/setup-jest.ts or test/), so this
// spec hand-writes a minimal fake of the callback-based `indexedDB.open`/`transaction`/`objectStore`
// API, driving each request's onsuccess/onerror/onupgradeneeded manually via a real setTimeout(0) -
// this lets `await` on the service's methods naturally wait for the whole async chain to settle,
// without needing fake timers.

type FakeRequest = {
  onsuccess: (() => void) | null
  onerror: (() => void) | null
  result?: any
  error?: any
}

const createFakeRequest = (): FakeRequest => ({ onsuccess: null, onerror: null })

interface StoreBehavior {
  putShouldError?: boolean
  getShouldError?: boolean
  getResult?: any
  deleteShouldError?: boolean
}

const createFakeStore = (behavior: StoreBehavior = {}) => {
  const put = jest.fn((_value: any) => {
    const request = createFakeRequest()
    setTimeout(() => {
      if (behavior.putShouldError) {
        request.error = new Error('put failed')
        if (request.onerror) { request.onerror() }
      } else if (request.onsuccess) {
        request.onsuccess()
      }
    }, 0)
    return request
  })

  const get = jest.fn((_key: any) => {
    const request = createFakeRequest()
    setTimeout(() => {
      if (behavior.getShouldError) {
        request.error = new Error('get failed')
        if (request.onerror) { request.onerror() }
      } else {
        request.result = behavior.getResult
        if (request.onsuccess) { request.onsuccess() }
      }
    }, 0)
    return request
  })

  const del = jest.fn((_key: any) => {
    const request = createFakeRequest()
    setTimeout(() => {
      if (behavior.deleteShouldError) {
        request.error = new Error('delete failed')
        if (request.onerror) { request.onerror() }
      } else if (request.onsuccess) {
        request.onsuccess()
      }
    }, 0)
    return request
  })

  return { put, get, delete: del }
}

const createFakeDb = (store: any) => ({
  objectStoreNames: { contains: jest.fn().mockReturnValue(false) },
  createObjectStore: jest.fn(),
  transaction: jest.fn().mockReturnValue({ objectStore: jest.fn().mockReturnValue(store) }),
})

interface InstallOptions {
  openShouldError?: boolean
  store?: any
  db?: any
}

const installFakeIndexedDb = (options: InstallOptions = {}) => {
  const store = options.store || createFakeStore()
  const db = options.db || createFakeDb(store)

  const open = jest.fn(() => {
    const request = createFakeRequest()
    setTimeout(() => {
      if (options.openShouldError) {
        request.error = new Error('open failed')
        if (request.onerror) { request.onerror() }
      } else {
        request.result = db
        const upgradeHandler = (request as any).onupgradeneeded
        if (upgradeHandler) { upgradeHandler({ target: { result: db } }) }
        if (request.onsuccess) { request.onsuccess() }
      }
    }, 0)
    return request
  })

  ;(global as any).indexedDB = { open }
  return { open, db, store }
}

describe('IndexedDbService (No TestBed)', () => {
  const originalIndexedDb = (global as any).indexedDB
  const flush = () => new Promise(resolve => setTimeout(resolve, 0))

  // The service's constructor fires initDB() without attaching a .catch(). To exercise the
  // "open() fails" branch of a public method without ever leaving that constructor call's own
  // promise unhandled, construct the service against a working fake first (so the constructor's
  // own initDB() resolves cleanly), then force a re-open against a failing fake for the call
  // under test - whose rejection our test does await/catch.
  const createServiceThatWillFailToReopen = async () => {
    installFakeIndexedDb()
    const service = new IndexedDbService()
    await flush()
    ;(service as any).db = null
    installFakeIndexedDb({ openShouldError: true })
    return service
  }

  afterEach(() => {
    jest.restoreAllMocks()
    ;(global as any).indexedDB = originalIndexedDb
  })

  it('is created and kicks off initDB from the constructor', async () => {
    const { open } = installFakeIndexedDb()
    const service = new IndexedDbService()
    expect(service).toBeTruthy()
    await flush()
    expect(open).toHaveBeenCalledWith('SearchV3DB', 1)
  })

  it('creates the enrollmentDetails object store on upgrade when it does not already exist', async () => {
    const store = createFakeStore()
    const db = createFakeDb(store)
    installFakeIndexedDb({ db, store })
    // tslint:disable-next-line
    new IndexedDbService()
    await flush()
    expect(db.createObjectStore).toHaveBeenCalledWith('enrollmentDetails', { keyPath: 'id' })
  })

  it('does not recreate the object store when it already exists', async () => {
    const store = createFakeStore()
    const db = createFakeDb(store)
    db.objectStoreNames.contains.mockReturnValue(true)
    installFakeIndexedDb({ db, store })
    // tslint:disable-next-line
    new IndexedDbService()
    await flush()
    expect(db.createObjectStore).not.toHaveBeenCalled()
  })

  describe('setEnrollmentDetails', () => {
    it('stores the payload under the fixed "current" key and resolves', async () => {
      const store = createFakeStore()
      installFakeIndexedDb({ store })
      const service = new IndexedDbService()
      await flush()

      await service.setEnrollmentDetails({ courses: ['c1'] })

      expect(store.put).toHaveBeenCalledWith({ id: 'current', enrollmentDetails: { courses: ['c1'] } })
    })

    it('rejects when the underlying put request errors', async () => {
      const store = createFakeStore({ putShouldError: true })
      installFakeIndexedDb({ store })
      const service = new IndexedDbService()
      await flush()

      await expect(service.setEnrollmentDetails({ a: 1 })).rejects.toBeDefined()
    })

    it('logs and rethrows when opening the database fails', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation()
      const service = await createServiceThatWillFailToReopen()

      await expect(service.setEnrollmentDetails({ a: 1 })).rejects.toBeDefined()
      expect(consoleSpy).toHaveBeenCalledWith('Error in setEnrollmentDetails:', expect.anything())
    })
  })

  describe('getEnrollmentDetails', () => {
    it('resolves the cached enrollmentDetails when present', async () => {
      const store = createFakeStore({ getResult: { id: 'current', enrollmentDetails: { foo: 'bar' } } })
      installFakeIndexedDb({ store })
      const service = new IndexedDbService()
      await flush()

      const result = await service.getEnrollmentDetails()
      expect(result).toEqual({ foo: 'bar' })
    })

    it('resolves null when there is no cached record', async () => {
      const store = createFakeStore({ getResult: undefined })
      installFakeIndexedDb({ store })
      const service = new IndexedDbService()
      await flush()

      const result = await service.getEnrollmentDetails()
      expect(result).toBeNull()
    })

    it('rejects when the underlying get request errors', async () => {
      const store = createFakeStore({ getShouldError: true })
      installFakeIndexedDb({ store })
      const service = new IndexedDbService()
      await flush()

      await expect(service.getEnrollmentDetails()).rejects.toBeDefined()
    })

    it('resolves null and logs an error when opening the database fails', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation()
      const service = await createServiceThatWillFailToReopen()

      const result = await service.getEnrollmentDetails()
      expect(result).toBeNull()
      expect(consoleSpy).toHaveBeenCalledWith('Error in getEnrollmentDetails:', expect.anything())
    })
  })

  describe('clearEnrollmentDetails', () => {
    it('deletes the "current" record and resolves', async () => {
      const store = createFakeStore()
      installFakeIndexedDb({ store })
      const service = new IndexedDbService()
      await flush()

      await service.clearEnrollmentDetails()
      expect(store.delete).toHaveBeenCalledWith('current')
    })

    it('rejects when the underlying delete request errors', async () => {
      const store = createFakeStore({ deleteShouldError: true })
      installFakeIndexedDb({ store })
      const service = new IndexedDbService()
      await flush()

      await expect(service.clearEnrollmentDetails()).rejects.toBeDefined()
    })

    it('logs and rethrows when opening the database fails', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation()
      const service = await createServiceThatWillFailToReopen()

      await expect(service.clearEnrollmentDetails()).rejects.toBeDefined()
      expect(consoleSpy).toHaveBeenCalledWith('Error in clearEnrollmentDetails:', expect.anything())
    })
  })

  describe('ensureDB reuse', () => {
    it('only opens the database once across multiple calls once it is initialized', async () => {
      const store = createFakeStore()
      const { open } = installFakeIndexedDb({ store })
      const service = new IndexedDbService()
      // Let the constructor's own fire-and-forget initDB() call finish opening the DB first.
      await flush()
      await flush()
      open.mockClear()

      await service.getEnrollmentDetails()
      await service.getEnrollmentDetails()

      expect(open).not.toHaveBeenCalled()
    })
  })
})
