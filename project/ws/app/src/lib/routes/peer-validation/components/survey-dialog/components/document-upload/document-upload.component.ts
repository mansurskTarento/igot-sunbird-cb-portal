import { Component, Input, Output, EventEmitter } from '@angular/core'
import { MatSnackBar } from '@angular/material/snack-bar'
import { NSPeerValidation } from '../../../../models/peer-validation.model'
import { PeerValidationService } from '../../../../services/peer-validation.service'
import { MatDialog } from '@angular/material/dialog'
import { VideoPreviewDialogComponent } from '../video-preview-dialog/video-preview-dialog.component'
import { environment } from 'src/environments/environment'

@Component({
    selector: 'ws-app-document-upload',
    templateUrl: './document-upload.component.html',
    styleUrls: ['./document-upload.component.scss'],
    standalone: false
})
export class DocumentUploadComponent {
  @Input() documents: NSPeerValidation.IUploadedDocument[] = []
  @Input() formId: string = ''
  @Output() documentsChanged = new EventEmitter<NSPeerValidation.IUploadedDocument[]>()

  isUploading = false
  dragOver = false

  constructor(
    private peerValidationService: PeerValidationService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar,
  ) { }

  onDragOver(event: DragEvent) {
    event.preventDefault()
    event.stopPropagation()
    this.dragOver = true
  }

  onDragLeave(event: DragEvent) {
    event.preventDefault()
    event.stopPropagation()
    this.dragOver = false
  }

  onDrop(event: DragEvent) {
    event.preventDefault()
    event.stopPropagation()
    this.dragOver = false

    const files = event.dataTransfer?.files
    if (files) {
      this.handleFiles(Array.from(files))
    }
  }

  onFileSelect(event: Event) {
    const input = event.target as HTMLInputElement
    if (input.files) {
      this.handleFiles(Array.from(input.files))
    }
    // Reset so selecting the same file again triggers 'change'
    input.value = ''
  }

  handleFiles(files: File[]) {
    files.forEach(file => {
      // Validate file type
      const validTypes = ['application/pdf', 'video/mp4']
      if (!validTypes.includes(file.type)) {
        this.showSnack(`Invalid file type: ${file.name}. Only PDF and MP4 are allowed.`)
        return
      }

      // Enforce one PDF and one video limit
      if (file.type === 'application/pdf') {
        const alreadyHasPdf = this.documents.some(doc => doc.type === 'application/pdf')
        if (alreadyHasPdf) {
          this.showSnack('Only one PDF is allowed. Please remove the existing PDF before uploading a new one.')
          return
        }
      } else if (file.type === 'video/mp4') {
        const alreadyHasVideo = this.documents.some(doc => doc.type === 'video/mp4')
        if (alreadyHasVideo) {
          this.showSnack('Only one video is allowed. Please remove the existing video before uploading a new one.')
          return
        }
      }

      // Validate file size: PDF max 2MB, MP4 max 200MB
      let maxSize: number
      let maxSizeLabel: string
      if (file.type === 'application/pdf') {
        maxSize = 2 * 1024 * 1024 // 2MB for PDF
        maxSizeLabel = '2MB'
      } else {
        maxSize = 200 * 1024 * 1024 // 200MB for MP4
        maxSizeLabel = '200MB'
      }

      if (file.size > maxSize) {
        this.showSnack(
          `"${file.name}" (${this.formatFileSize(file.size)}) exceeds the allowed limit. Maximum size for ${file.type === 'application/pdf' ? 'PDF' : 'MP4'} is ${maxSizeLabel}.`
        )
        return
      }

      this.uploadFile(file)
    })
  }

  uploadFile(file: File) {
    this.isUploading = true
    this.peerValidationService.uploadDocument(file, this.formId).subscribe({
      next: (uploadedDoc: NSPeerValidation.IUploadedDocument) => {
        uploadedDoc.url = this.generateUrl(uploadedDoc.url)
        this.documents = [...this.documents, uploadedDoc]
        this.documentsChanged.emit(this.documents)
        this.isUploading = false
      },
      error: (err: any) => {
        console.error('Upload error:', err)
        this.isUploading = false
        this.showSnack(`Failed to upload ${file.name}`)
      },
    })
  }

  removeDocument(index: number) {
    this.documents = this.documents.filter((_, i) => i !== index)
    this.documentsChanged.emit(this.documents)
  }

  formatFileSize(bytes: number): string {
    if (bytes < 1024) return bytes + ' B'
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
  }

  previewFile(doc: NSPeerValidation.IUploadedDocument) {
    if (doc.type.includes('mp4') || doc.type.includes('video') || doc.type.includes('pdf')) {
      this.dialog.open(VideoPreviewDialogComponent, {
        width: '800px',
        maxWidth: '90vw',
        height: doc.type.includes('pdf') ? '90vh' : 'auto',
        data: {
          url: doc.url,
          name: doc.name,
          type: doc.type,
        },
      })
    }
  }

  generateUrl(oldUrl: string): string {
    const chunk = oldUrl ? oldUrl.split('/') : []
    const newChunk = environment.azureHost.split('/')
    const newLink: string[] = []
    for (let i = 0; i < chunk.length; i += 1) {
      if (i === 2) {
        newLink.push(newChunk[i])
      } else if (i === 3) {
        newLink.push('content-store')
      } else {
        newLink.push(chunk[i])
      }
    }
    return newLink.join('/')
  }

  private showSnack(message: string) {
    this.snackBar.open(message, undefined, {
      duration: 3000,
      horizontalPosition: 'center',
      panelClass: ['center-snackbar'],
    })
  }
}
