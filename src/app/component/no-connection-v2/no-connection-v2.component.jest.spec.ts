import { NoConnectionV2Component } from './no-connection-v2.component'

describe('NoConnectionV2Component (No TestBed)', () => {
  let component: NoConnectionV2Component

  beforeEach(() => {
    jest.useFakeTimers()
    component = new NoConnectionV2Component()
  })

  afterEach(() => {
    component.ngOnDestroy()
    jest.useRealTimers()
  })

  it('should create the component', () => {
    expect(component).toBeTruthy()
  })

  it('should initialize isOnline based on navigator.onLine', () => {
    expect(component.isOnline()).toBe(navigator.onLine)
  })

  it('should initialize display as true', () => {
    expect(component.display()).toBe(true)
  })

  describe('online/offline handling', () => {
    it('should set isOnline to true when online event fires', () => {
      window.dispatchEvent(new Event('online'))
      expect(component.isOnline()).toBe(true)
      expect(component.display()).toBe(true)
    })

    it('should set isOnline to false when offline event fires', () => {
      window.dispatchEvent(new Event('offline'))
      expect(component.isOnline()).toBe(false)
      expect(component.display()).toBe(true)
    })

    it('should hide display after 3 seconds', () => {
      window.dispatchEvent(new Event('offline'))
      expect(component.display()).toBe(true)
      jest.advanceTimersByTime(3000)
      expect(component.display()).toBe(false)
    })

    it('should reset hide timeout on subsequent events', () => {
      window.dispatchEvent(new Event('offline'))
      jest.advanceTimersByTime(2000)
      window.dispatchEvent(new Event('online'))
      jest.advanceTimersByTime(2000)
      // Should still be displayed because timer was reset
      expect(component.display()).toBe(true)
      jest.advanceTimersByTime(1000)
      expect(component.display()).toBe(false)
    })
  })

  describe('ngOnDestroy', () => {
    it('should remove event listeners and clear timeout', () => {
      const removeEventListenerSpy = jest.spyOn(window, 'removeEventListener')
      component.ngOnDestroy()
      expect(removeEventListenerSpy).toHaveBeenCalledWith('online', expect.any(Function))
      expect(removeEventListenerSpy).toHaveBeenCalledWith('offline', expect.any(Function))
    })

    it('should handle being called multiple times', () => {
      expect(() => {
        component.ngOnDestroy()
        component.ngOnDestroy()
      }).not.toThrow()
    })
  })
})
