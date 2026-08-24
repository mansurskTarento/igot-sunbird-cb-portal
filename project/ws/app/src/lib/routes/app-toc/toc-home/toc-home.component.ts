import { Component, OnDestroy, OnInit } from '@angular/core'

@Component({
  selector: 'ws-app-toc-home',
  templateUrl: './toc-home.component.html',
  styleUrls: ['./toc-home.component.scss'],
  standalone: false
})
export class TocHomeComponent implements OnInit, OnDestroy {
  private parentContainer: HTMLElement | null = null
  private originalMinHeight = ''

  ngOnInit(): void {
    this.parentContainer = document.querySelector('.height-adjust') as HTMLElement
    if (this.parentContainer && window.innerWidth > 599) {
      this.originalMinHeight = this.parentContainer.style.minHeight
      this.parentContainer.style.minHeight = 'calc(100vh + 445px)'
    }
  }

  ngOnDestroy(): void {
    if (this.parentContainer) {
      this.parentContainer.style.minHeight = this.originalMinHeight
    }
  }
}
