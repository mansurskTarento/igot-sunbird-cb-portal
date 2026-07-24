import { Component, signal, effect, OnDestroy } from '@angular/core'
import { MatIconModule } from '@angular/material/icon'

@Component({
  selector: 'app-no-connection-v2',
  templateUrl: './no-connection-v2.component.html',
  styleUrls: ['./no-connection-v2.component.scss'],
  standalone: true,
  imports: [MatIconModule],
})
export class NoConnectionV2Component implements OnDestroy {
  isOnline = signal(navigator.onLine)
  display = signal(true)

  private onlineHandler = () => this.handleConnectionChange(true)
  private offlineHandler = () => this.handleConnectionChange(false)
  private hideTimeout: ReturnType<typeof setTimeout> | null = null

  constructor() {
    window.addEventListener('online', this.onlineHandler)
    window.addEventListener('offline', this.offlineHandler)

    effect(() => {
      if (this.display()) {
        this.scheduleHide()
      }
    })
  }

  private handleConnectionChange(online: boolean) {
    this.isOnline.set(online)
    this.display.set(true)
  }

  private scheduleHide() {
    if (this.hideTimeout) {
      clearTimeout(this.hideTimeout)
    }
    this.hideTimeout = setTimeout(() => {
      this.display.set(false)
    }, 3000)
  }

  ngOnDestroy() {
    window.removeEventListener('online', this.onlineHandler)
    window.removeEventListener('offline', this.offlineHandler)
    if (this.hideTimeout) {
      clearTimeout(this.hideTimeout)
    }
  }
}
