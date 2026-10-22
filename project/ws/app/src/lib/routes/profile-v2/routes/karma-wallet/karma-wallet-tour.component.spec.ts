import { ChangeDetectorRef, ElementRef, NgZone } from '@angular/core'

import { KarmaWalletTourComponent } from './karma-wallet-tour.component'
import { IKarmaTourStep } from './karma-wallet-tour.model'

/**
 * No TestBed: the tour positions itself from getBoundingClientRect, which jsdom always reports
 * as zero, so each anchor's rect is stubbed here and the popover template is never rendered
 * (its height falls back to the component's 200px default).
 */
describe('KarmaWalletTourComponent', () => {
  let component: KarmaWalletTourComponent
  let scrollBy: jest.Mock
  const originalScrollBy = window.scrollBy
  const originalWidth = window.innerWidth
  const originalHeight = window.innerHeight

  const setViewport = (width: number, height: number) => {
    Object.defineProperty(window, 'innerWidth', { value: width, configurable: true, writable: true })
    Object.defineProperty(window, 'innerHeight', { value: height, configurable: true, writable: true })
  }

  /* An anchor at the given viewport position, in the page or inside `parent` */
  const anchor = (cls: string, top: number, height: number, parent: HTMLElement = document.body) => {
    const el = document.createElement('div')
    el.className = cls
    jest.spyOn(el, 'getBoundingClientRect').mockReturnValue({
      top, bottom: top + height, left: 420, right: 1500, width: 1080, height, x: 420, y: top,
      toJSON: () => ({}),
    } as DOMRect)
    parent.appendChild(el)
    return el
  }

  /* The tour scrolls instantly, overriding the page's smooth scroll-behavior */
  const scrolledBy = (top: number) => ({ top, left: 0, behavior: 'instant' })

  const step = (selector: string, placement: IKarmaTourStep['placement'] = 'bottom'): IKarmaTourStep =>
    ({ selector, placement, title: selector, body: '' })

  beforeEach(() => {
    const zoneStub = { run: (fn: () => any) => fn(), runOutsideAngular: (fn: () => any) => fn() }
    component = new KarmaWalletTourComponent(
      { detectChanges: jest.fn() } as unknown as ChangeDetectorRef,
      zoneStub as unknown as NgZone,
      new ElementRef(document.createElement('ws-app-karma-wallet-tour')),
    )
    scrollBy = jest.fn()
    window.scrollBy = scrollBy as any
    setViewport(1280, 470)
  })

  afterEach(() => {
    component.ngOnDestroy()
    document.body.innerHTML = ''
    document.body.className = ''
    window.scrollBy = originalScrollBy
    delete (document as any).elementsFromPoint
    setViewport(originalWidth, originalHeight)
  })

  it('should scroll a web target below the fold up to the top of the viewport', async () => {
    /* step 2: Coin History starts under a short (devtools-open) viewport */
    anchor('kw__history', 460, 700)
    await component.start([step('.kw__history', 'right')])

    /* 460 - (SPOT_PAD 6 + VIEWPORT_MARGIN 12) */
    expect(scrollBy).toHaveBeenCalledWith(scrolledBy(442))
    expect(document.body.classList.contains('kwt-scroll-lock')).toBe(true)
  })

  it('should leave room above a web target whose popover sits on top of it', async () => {
    anchor('kw__history', 460, 700)
    await component.start([step('.kw__history', 'top')])

    /* popover 200 + ARROW_GAP 14 + SPOT_PAD 6 + VIEWPORT_MARGIN 12 */
    expect(scrollBy).toHaveBeenCalledWith(scrolledBy(460 - 232))
  })

  it('should leave a web target alone when it is already in view', async () => {
    anchor('kw__stats', 155, 165)
    await component.start([step('.kw__stats')])

    expect(scrollBy).not.toHaveBeenCalled()
  })

  it('should bring back a web target whose top has scrolled above the viewport', async () => {
    /* tall enough to fill the screen, but its heading is out of sight */
    anchor('kw__history', -300, 1200)
    await component.start([step('.kw__history', 'right')])

    expect(scrollBy).toHaveBeenCalledWith(scrolledBy(-318))
  })

  it('should bring a step\'s scroll anchor back into view even when its target is on screen', async () => {
    anchor('kw__header', -40, 60)
    anchor('kw__stats', 40, 165)
    await component.start([{ ...step('.kw__stats'), scrollAnchor: '.kw__header' }])

    expect(scrollBy).toHaveBeenCalledWith(scrolledBy(-40 - 18))
  })

  it('should line the anchor up with the top even when the page already shows it', async () => {
    anchor('kw__header', 187, 60)
    anchor('kw__stats', 250, 165)
    setViewport(1280, 900)
    await component.start([{ ...step('.kw__stats'), scrollAnchor: '.kw__header' }])

    expect(scrollBy).toHaveBeenCalledWith(scrolledBy(187 - 18))
  })

  it('should scroll the anchor, not the target, to the top when the target is below the fold', async () => {
    anchor('kw__header', 300, 60)
    anchor('kw__stats', 500, 165)
    await component.start([{ ...step('.kw__stats'), scrollAnchor: '.kw__header' }])

    expect(scrollBy).toHaveBeenCalledWith(scrolledBy(300 - 18))
  })

  it('should land a web target below a fixed header rather than under it', async () => {
    const header = document.createElement('ws-header-v2')
    header.style.position = 'fixed'
    jest.spyOn(header, 'getBoundingClientRect').mockReturnValue({ bottom: 87 } as DOMRect)
    document.body.appendChild(header)
    ;(document as any).elementsFromPoint = jest.fn(() => [header, document.body, document.documentElement])
    anchor('kw__history', 460, 700)

    await component.start([step('.kw__history', 'right')])

    expect(scrollBy).toHaveBeenCalledWith(scrolledBy(460 - (87 + 18)))
  })

  it('should not count a full-height fixed layer, or the tour overlay, as a header', async () => {
    const backdrop = document.createElement('div')
    backdrop.style.position = 'fixed'
    jest.spyOn(backdrop, 'getBoundingClientRect').mockReturnValue({ bottom: 470 } as DOMRect)
    document.body.appendChild(backdrop)
    anchor('kw__history', 460, 700)
    ;(document as any).elementsFromPoint = jest.fn(() => {
      const overlay = document.querySelector('ws-app-karma-wallet-tour') as HTMLElement
      overlay.style.position = 'fixed'
      jest.spyOn(overlay, 'getBoundingClientRect').mockReturnValue({ bottom: 40 } as DOMRect)
      return [overlay, backdrop, document.body]
    })

    await component.start([step('.kw__history', 'right')])

    expect(scrollBy).toHaveBeenCalledWith(scrolledBy(442))
  })

  it('should not count an ordinary element under the top edge as a header', async () => {
    /* after a scroll, a Coin History row can sit under y=1 - it moves with the page */
    const row = document.createElement('div')
    jest.spyOn(row, 'getBoundingClientRect').mockReturnValue({ bottom: 60 } as DOMRect)
    document.body.appendChild(row)
    ;(document as any).elementsFromPoint = jest.fn(() => [row, document.body, document.documentElement])
    anchor('kw__history', 460, 700)

    await component.start([step('.kw__history', 'right')])

    expect(scrollBy).toHaveBeenCalledWith(scrolledBy(442))
  })

  it('should not scroll the page for a target inside a fixed layer such as the convert dialog', async () => {
    const overlay = document.createElement('div')
    overlay.className = 'cdk-overlay-container'
    overlay.style.position = 'fixed'
    document.body.appendChild(overlay)
    /* the dialog is fixed, so page scroll could never move it into view anyway */
    anchor('krd__entry', -20, 300, overlay)

    await component.start([step('.krd__entry')])

    expect(scrollBy).not.toHaveBeenCalled()
  })

  it('should scroll back up to an earlier target when the user presses Back', async () => {
    const stats = anchor('kw__stats', 155, 165)
    const history = anchor('kw__history', 460, 700)
    await component.start([step('.kw__stats'), step('.kw__history', 'right')])
    await component.next()
    expect(scrollBy).toHaveBeenLastCalledWith(scrolledBy(442))

    /* the page has now moved by 442px */
    ;(stats.getBoundingClientRect as jest.Mock).mockReturnValue({
      ...stats.getBoundingClientRect(), top: 155 - 442, bottom: 155 - 442 + 165,
    })
    ;(history.getBoundingClientRect as jest.Mock).mockReturnValue({
      ...history.getBoundingClientRect(), top: 18, bottom: 718,
    })
    await component.back()

    expect(scrollBy).toHaveBeenLastCalledWith(scrolledBy(155 - 442 - 18))
  })

  it('should take its overlay out of body when the user leaves the page mid-tour', async () => {
    anchor('kw__stats', 155, 165)
    await component.start([step('.kw__stats'), step('.kw__history', 'right')])
    expect(document.body.querySelector(':scope > ws-app-karma-wallet-tour')).not.toBeNull()

    /* navigating away destroys the wallet page, whose DOM no longer contains the host */
    component.ngOnDestroy()

    expect(document.querySelector('ws-app-karma-wallet-tour')).toBeNull()
    expect(document.body.classList.contains('kwt-tour-active')).toBe(false)
    expect(document.body.classList.contains('kwt-scroll-lock')).toBe(false)
  })

  it('should keep lifting a phone target clear of the popover stacked above it', async () => {
    setViewport(390, 700)
    anchor('kw__history', 900, 600)
    await component.start([step('.kw__history', 'right')])

    /* popover 200 + ARROW_GAP 14 + SPOT_PAD 6 + VIEWPORT_MARGIN 12 */
    expect(scrollBy).toHaveBeenCalledWith(scrolledBy(900 - 232))
  })

  it('should leave a phone target alone when it is already on screen', async () => {
    setViewport(390, 700)
    anchor('kw__stats', 120, 300)
    await component.start([step('.kw__stats')])

    expect(scrollBy).not.toHaveBeenCalled()
  })

  describe('lifecycle and navigation', () => {
    let finished: jest.Mock
    let actions: jest.Mock

    beforeEach(() => {
      finished = jest.fn()
      actions = jest.fn()
      component.finished.subscribe(finished)
      component.action.subscribe(actions)
      anchor('one', 100, 50)
      anchor('two', 200, 50)
    })

    it('should ignore an empty step list', async () => {
      await component.start([])
      await component.start(undefined as any)
      expect(component.active).toBe(false)
    })

    it('should walk forward, back and finish with an ok on the last step', async () => {
      await component.start([step('.one'), step('.two', 'left')])
      expect(component.active).toBe(true)
      expect(component.isFirst).toBe(true)
      expect(component.step!.selector).toBe('.one')

      await component.back()
      expect(actions).not.toHaveBeenCalled()

      await component.next()
      expect(component.index).toBe(1)
      expect(component.isLast).toBe(true)
      expect(actions).toHaveBeenLastCalledWith({ step: 1, action: 'next' })

      await component.back()
      expect(component.index).toBe(0)
      expect(actions).toHaveBeenLastCalledWith({ step: 2, action: 'back' })

      await component.next()
      await component.next()
      expect(actions).toHaveBeenLastCalledWith({ step: 2, action: 'ok' })
      expect(finished).toHaveBeenCalledWith('completed')
      expect(component.active).toBe(false)
    })

    it('should run the before and onBack hooks and block navigation while busy', async () => {
      const before = jest.fn()
      const onBack = jest.fn()
      await component.start([step('.one'), { ...step('.two'), before, onBack }])
      await component.next()
      expect(before).toHaveBeenCalled()

      component.busy = true
      await component.next()
      await component.back()
      expect(component.index).toBe(1)
      component.busy = false

      await component.back()
      expect(onBack).toHaveBeenCalled()
    })

    it('should complete when the next anchor is missing', async () => {
      await component.start([step('.one'), step('.missing')])
      await component.next()
      expect(finished).toHaveBeenCalledWith('completed')
    })

    it('should complete when there is no current step', async () => {
      component.steps = []
      await (component as any).enterStep()
      expect(finished).toHaveBeenCalledWith('completed')
    })

    it('should report skip and stop, but only stop an active tour', async () => {
      component.stop()
      expect(finished).not.toHaveBeenCalled()

      await component.start([step('.one')])
      component.skip()
      expect(actions).toHaveBeenLastCalledWith({ step: 1, action: 'skip' })
      expect(finished).toHaveBeenCalledWith('skipped')

      await component.start([step('.one')])
      component.stop()
      expect(finished).toHaveBeenCalledTimes(2)
    })

    it('should skip on Escape only while active', async () => {
      component.onEscape()
      expect(finished).not.toHaveBeenCalled()

      await component.start([step('.one')])
      component.onEscape()
      expect(finished).toHaveBeenCalledWith('skipped')
    })

    it('should re-measure once per frame on viewport changes while active', async () => {
      component.onViewportChange()
      expect((component as any).measureHandle).toBe(0)

      await component.start([step('.one')])
      const measure = jest.spyOn(component as any, 'measure')
      component.onViewportChange()
      component.onViewportChange()
      await new Promise(resolve => setTimeout(resolve, 50))
      expect(measure).toHaveBeenCalledTimes(1)
    })

    it('should compensate the scrollbar gutter while locked and restore it afterwards', async () => {
      document.body.style.paddingRight = '3px'
      await component.start([step('.one')])
      expect(document.body.style.paddingRight).toBe('1280px')
      expect(document.body.classList.contains('kwt-scroll-lock')).toBe(true)

      component.skip()
      expect(document.body.style.paddingRight).toBe('3px')
      expect(document.body.classList.contains('kwt-scroll-lock')).toBe(false)
    })

    it('should cancel a pending frame and clear timers on destroy', async () => {
      await component.start([step('.one')])
      const cancel = jest.spyOn(window, 'cancelAnimationFrame')
      ;(component as any).measureHandle = 5
      component.ngOnDestroy()
      expect(cancel).toHaveBeenCalledWith(5)
      expect((component as any).measureHandle).toBe(0)
      expect(component.active).toBe(false)
    })

    it('should flip the popover to the opposite side or the roomier one when the preferred has no room', async () => {
      setViewport(1280, 300)
      anchor('tall', 0, 280)
      await component.start([step('.tall', 'bottom')])
      expect(['top', 'left', 'right', 'bottom']).toContain(component.placement)

      setViewport(390, 700)
      await component.start([step('.one', 'left')])
      expect(component.placement).not.toBe('left')
      expect(component.popoverWidth).toBe(390 - 2 * 8)
    })

    it('should honour an explicit spotlight radius', async () => {
      await component.start([{ ...step('.one'), radius: 6 }])
      expect(component.radius).toBe(6)
    })
  })
})
