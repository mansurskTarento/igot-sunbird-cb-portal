import { Component, Inject, OnInit, ViewChild, ElementRef } from '@angular/core'
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog'
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser'

@Component({
  selector: 'ws-app-video-preview-dialog',
  templateUrl: './video-preview-dialog.component.html',
  styleUrls: ['./video-preview-dialog.component.scss'],
})
export class VideoPreviewDialogComponent implements OnInit {
  @ViewChild('videoPlayer') videoPlayer!: ElementRef<HTMLVideoElement>

  viewType: 'video' | 'pdf' | null = null
  sanitizedPdfUrl: SafeResourceUrl | null = null

  // Video control properties
  isPlaying = false
  currentTime = 0
  duration = 0
  volume = 1
  isMuted = false
  playbackSpeed = 1
  isFullscreen = false
  showControls = true

  private hideControlsTimeout: any

  constructor(
    public dialogRef: MatDialogRef<VideoPreviewDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { url: string, name: string, type: string },
    private sanitizer: DomSanitizer,
  ) { }

  ngOnInit(): void {
    if (this.data && this.data.url) {
      if (this.data.type && (this.data.type.includes('pdf') || this.data.name.toLowerCase().endsWith('.pdf'))) {
        this.viewType = 'pdf'
        // Sanitize blob URL for iframe
        this.sanitizedPdfUrl = this.sanitizer.bypassSecurityTrustResourceUrl(this.data.url)
      } else {
        this.viewType = 'video'
      }
    }
  }

  ngAfterViewInit(): void {
    if (this.videoPlayer && this.videoPlayer.nativeElement) {
      const video = this.videoPlayer.nativeElement
      video.volume = this.volume
      video.playbackRate = this.playbackSpeed
      // Auto-play
      video.play().then(() => {
        this.isPlaying = true
      }).catch(err => {
        console.log('Auto-play prevented:', err)
      })
    }
  }

  togglePlay(): void {
    const video = this.videoPlayer.nativeElement
    if (video.paused) {
      video.play()
      this.isPlaying = true
    } else {
      video.pause()
      this.isPlaying = false
    }
  }

  onTimeUpdate(): void {
    if (this.videoPlayer) {
      this.currentTime = this.videoPlayer.nativeElement.currentTime
    }
  }

  onLoadedMetadata(): void {
    if (this.videoPlayer) {
      this.duration = this.videoPlayer.nativeElement.duration
    }
  }

  onVideoEnded(): void {
    this.isPlaying = false
  }

  seek(event: MouseEvent): void {
    const progressBar = event.currentTarget as HTMLElement
    const rect = progressBar.getBoundingClientRect()
    const pos = (event.clientX - rect.left) / rect.width
    const video = this.videoPlayer.nativeElement
    video.currentTime = pos * this.duration
  }

  adjustVolume(event: Event): void {
    const input = event.target as HTMLInputElement
    this.volume = parseInt(input.value) / 100
    this.videoPlayer.nativeElement.volume = this.volume
    this.isMuted = this.volume === 0
  }

  toggleMute(): void {
    const video = this.videoPlayer.nativeElement
    if (this.isMuted) {
      video.volume = this.volume || 0.5
      this.isMuted = false
    } else {
      video.volume = 0
      this.isMuted = true
    }
  }

  toggleSpeed(): void {
    // Toggle between 1x and 1.5x
    this.playbackSpeed = this.playbackSpeed === 1 ? 1.5 : 1
    this.videoPlayer.nativeElement.playbackRate = this.playbackSpeed
  }

  togglePictureInPicture(): void {
    const video = this.videoPlayer.nativeElement
    if (document.pictureInPictureElement) {
      document.exitPictureInPicture()
    } else {
      video.requestPictureInPicture()
    }
  }

  toggleFullscreen(): void {
    const container = this.videoPlayer.nativeElement.parentElement
    if (!document.fullscreenElement && container) {
      container.requestFullscreen()
      this.isFullscreen = true
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen()
        this.isFullscreen = false
      }
    }
  }

  hideControlsDelayed(): void {
    if (this.hideControlsTimeout) {
      clearTimeout(this.hideControlsTimeout)
    }
    this.hideControlsTimeout = setTimeout(() => {
      if (this.isPlaying) {
        this.showControls = false
      }
    }, 2000)
  }

  formatTime(seconds: number): string {
    if (!seconds || isNaN(seconds)) {
      return '0:00'
    }
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  getMimeType(): string {
    const type = this.data.type ? this.data.type.toLowerCase() : ''
    const name = this.data.name ? this.data.name.toLowerCase() : ''

    if (type.includes('mp4') || name.endsWith('.mp4')) {
      return 'video/mp4'
    } else if (type.includes('webm') || name.endsWith('.webm')) {
      return 'video/webm'
    } else if (type.includes('m3u8') || name.endsWith('.m3u8')) {
      return 'application/x-mpegURL'
    } else if (type.includes('ogg') || name.endsWith('.ogg')) {
      return 'video/ogg'
    }
    return 'video/mp4' // Default to mp4
  }

  close(): void {
    this.dialogRef.close()
  }
}
