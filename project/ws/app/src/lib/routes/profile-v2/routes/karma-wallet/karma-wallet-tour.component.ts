import {
  ChangeDetectorRef, Component, ElementRef, EventEmitter, HostListener, NgZone,
  OnDestroy, Output,
} from '@angular/core'
import { IKarmaTourAction, IKarmaTourStep, TKarmaTourPlacement } from './karma-wallet-tour.model'

const ARROW_GAP = 14
const SPOT_PAD = 6
const VIEWPORT_MARGIN = 12
const ARROW_INSET = 22
const NARROW_VIEWPORT = 600
const NARROW_GUTTER = 8
const POPOVER_WIDTH = 360

interface IRect { top: number; left: number; width: number; height: number }

@Component({
  selector: 'ws-app-karma-wallet-tour',
  templateUrl: './karma-wallet-tour.component.html',
  styleUrls: ['./karma-wallet-tour.component.scss'],
  standalone: false,
})
export class KarmaWalletTourComponent implements OnDestroy {

  @Output() finished = new EventEmitter<'completed' | 'skipped'>()
  @Output() action = new EventEmitter<IKarmaTourAction>()

  steps: IKarmaTourStep[] = []
  index = 0
  active = false
  busy = false

  spot: IRect = { top: 0, left: 0, width: 0, height: 0 }
  popover: { top: number; left: number } = { top: 0, left: 0 }
  arrowOffset = 0
  popoverWidth: number | null = null
  placement: TKarmaTourPlacement = 'bottom'
  radius = 12

  private target: HTMLElement | null = null
  private basePlacement: TKarmaTourPlacement = 'bottom'
  private measureHandle = 0

  constructor(private cdr: ChangeDetectorRef, private zone: NgZone, private host: ElementRef) { }

  get step(): IKarmaTourStep | undefined {
    return this.steps[this.index]
  }

  get isFirst(): boolean {
    return this.index === 0
  }

  get isLast(): boolean {
    return this.index === this.steps.length - 1
  }

  async start(steps: IKarmaTourStep[]) {
    if (!steps || !steps.length) {
      return
    }
    this.steps = steps
    this.index = 0
    this.active = true
    document.body.appendChild(this.host.nativeElement)
    document.body.classList.add('kwt-tour-active')
    await this.enterStep()
  }

  async next() {
    if (this.busy) {
      return
    }
    /* The last step's primary reads 'Ok', and reports itself as such */
    this.action.emit({ step: this.index + 1, action: this.isLast ? 'ok' : 'next' })
    if (this.isLast) {
      this.close('completed')
      return
    }
    this.index += 1
    await this.enterStep()
  }

  async back() {
    if (this.busy || this.isFirst) {
      return
    }
    this.action.emit({ step: this.index + 1, action: 'back' })
    const leaving = this.step
    this.index -= 1
    await this.run(leaving && leaving.onBack)
    await this.enterStep()
  }

  skip() {
    this.action.emit({ step: this.index + 1, action: 'skip' })
    this.close('skipped')
  }

  @HostListener('document:keydown.escape')
  onEscape() {
    if (this.active) {
      this.skip()
    }
  }

  @HostListener('window:resize')
  @HostListener('window:scroll')
  onViewportChange() {
    if (!this.active || this.measureHandle) {
      return
    }
    this.zone.runOutsideAngular(() => {
      this.measureHandle = requestAnimationFrame(() => {
        this.measureHandle = 0
        this.zone.run(() => {
          if (this.active) {
            this.measure()
          }
        })
      })
    })
  }

  ngOnDestroy() {
    this.active = false
    if (this.measureHandle) {
      cancelAnimationFrame(this.measureHandle)
      this.measureHandle = 0
    }
    document.body.classList.remove('kwt-tour-active')
  }

  private async enterStep() {
    const step = this.step
    if (!step) {
      this.close('completed')
      return
    }
    await this.run(step.before)
    this.target = document.querySelector(step.selector) as HTMLElement | null
    if (!this.target) {
      /* A missing anchor should not strand the user behind a dim backdrop */
      this.close('completed')
      return
    }
    this.basePlacement = step.placement
    this.placement = step.placement
    this.radius = step.radius === undefined ? 12 : step.radius
    this.cdr.detectChanges()
    this.applyPopoverWidth()
    if (window.innerWidth <= NARROW_VIEWPORT && !this.isTargetOnScreen()) {
      this.scrollTargetBelowPopover()
    }
    /* Two frames: one for any scroll to settle, one for the layout it triggered */
    await this.nextFrame()
    await this.nextFrame()
    this.measure()
  }

  private scrollTargetBelowPopover() {
    if (!this.target) {
      return
    }
    const vh = window.innerHeight
    const el = this.host.nativeElement.querySelector('.kwt__popover') as HTMLElement | null
    const h = el ? el.offsetHeight : 200
    const desiredTop = Math.min(h + ARROW_GAP + SPOT_PAD + VIEWPORT_MARGIN, vh * 0.6)
    const delta = this.target.getBoundingClientRect().top - desiredTop
    if (Math.abs(delta) > 4) {
      window.scrollBy(0, delta)
    }
  }

  private applyPopoverWidth() {
    const vw = window.innerWidth
    const width = vw <= NARROW_VIEWPORT ? vw - NARROW_GUTTER * 2 : null
    if (this.popoverWidth !== width) {
      this.popoverWidth = width
      this.cdr.detectChanges()
    }
  }

  private isTargetOnScreen(): boolean {
    if (!this.target) {
      return true
    }
    const r = this.target.getBoundingClientRect()
    const vh = window.innerHeight
    const overlap = Math.min(r.bottom, vh) - Math.max(r.top, 0)
    return overlap >= Math.min(r.height, vh * 0.5)
  }

  private async run(hook: (() => Promise<void> | void) | undefined) {
    if (!hook) {
      return
    }
    this.busy = true
    this.cdr.detectChanges()
    try {
      await hook()
    } finally {
      this.busy = false
    }
  }

  private nextFrame(): Promise<void> {
    return new Promise<void>(resolve => {
      this.zone.runOutsideAngular(() => requestAnimationFrame(() => this.zone.run(() => resolve())))
    })
  }

  private measure() {
    if (!this.target) {
      return
    }
    const r = this.target.getBoundingClientRect()
    const top = Math.max(r.top - SPOT_PAD, 0)
    const left = Math.max(r.left - SPOT_PAD, 0)
    const bottom = Math.min(r.bottom + SPOT_PAD, window.innerHeight)
    const right = Math.min(r.right + SPOT_PAD, window.innerWidth)
    this.spot = {
      top,
      left,
      width: Math.max(right - left, 0),
      height: Math.max(bottom - top, 0),
    }
    this.placePopover()
    this.cdr.detectChanges()
  }

  private placePopover() {
    const vw = window.innerWidth
    const vh = window.innerHeight
    const narrow = vw <= NARROW_VIEWPORT
    this.applyPopoverWidth()
    const el = this.host.nativeElement.querySelector('.kwt__popover') as HTMLElement | null
    const w = narrow ? (this.popoverWidth as number) : (el ? el.offsetWidth : POPOVER_WIDTH)
    const h = el ? el.offsetHeight : 200
    const s = this.spot

    let preferred = this.basePlacement
    if (narrow && (preferred === 'left' || preferred === 'right')) {
      preferred = 'bottom'
    }
    const place = this.resolvePlacement(preferred, w, h, vw, vh)
    this.placement = place

    let top: number
    let left: number
    if (place === 'bottom' || place === 'top') {
      top = place === 'bottom' ? s.top + s.height + ARROW_GAP : s.top - ARROW_GAP - h
      left = s.left + s.width / 2 - w / 2
    } else {
      left = place === 'right' ? s.left + s.width + ARROW_GAP : s.left - ARROW_GAP - w
      top = s.top + s.height / 2 - h / 2
    }

    left = narrow
      ? NARROW_GUTTER
      : Math.min(Math.max(left, VIEWPORT_MARGIN), vw - w - VIEWPORT_MARGIN)
    top = Math.min(Math.max(top, VIEWPORT_MARGIN), vh - h - VIEWPORT_MARGIN)
    this.popover = { top, left }
    const along = (place === 'bottom' || place === 'top')
      ? s.left + s.width / 2 - left
      : s.top + s.height / 2 - top
    const span = (place === 'bottom' || place === 'top') ? w : h
    this.arrowOffset = Math.min(Math.max(along, ARROW_INSET), span - ARROW_INSET)
  }

  private resolvePlacement(
    preferred: TKarmaTourPlacement, w: number, h: number, vw: number, vh: number,
  ): TKarmaTourPlacement {
    const s = this.spot
    const room: { [K in TKarmaTourPlacement]: number } = {
      bottom: vh - (s.top + s.height) - ARROW_GAP,
      top: s.top - ARROW_GAP,
      right: vw - (s.left + s.width) - ARROW_GAP,
      left: s.left - ARROW_GAP,
    }
    const opposite: { [K in TKarmaTourPlacement]: TKarmaTourPlacement } = {
      bottom: 'top', top: 'bottom', left: 'right', right: 'left',
    }
    const needed = (p: TKarmaTourPlacement) => (p === 'top' || p === 'bottom') ? h : w
    if (room[preferred] >= needed(preferred)) {
      return preferred
    }
    const other = opposite[preferred]
    if (room[other] >= needed(other)) {
      return other
    }
    return room[preferred] >= room[other] ? preferred : other
  }

  private close(reason: 'completed' | 'skipped') {
    this.active = false
    this.target = null
    document.body.classList.remove('kwt-tour-active')
    this.finished.emit(reason)
    this.cdr.detectChanges()
  }
}
