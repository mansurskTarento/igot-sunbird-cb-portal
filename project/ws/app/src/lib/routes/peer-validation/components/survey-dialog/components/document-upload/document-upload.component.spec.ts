import { of } from 'rxjs'
import { DocumentUploadComponent } from './document-upload.component'
import { NSPeerValidation } from '../../../../models/peer-validation.model'

// Mock environment so generateUrl doesn't fail
jest.mock('src/environments/environment', () => ({
  environment: { azureHost: 'https://azure.example.com' },
}))

const makeDoc = (overrides: Partial<NSPeerValidation.IUploadedDocument> = {}): NSPeerValidation.IUploadedDocument => ({
  id: 'd1',
  name: 'file.pdf',
  type: 'application/pdf',
  size: 1024,
  url: 'https://cdn.example.com/bucket/file.pdf',
  uploadedAt: new Date(),
  ...overrides,
})

const makeFile = (name: string, type: string, size = 1024) => {
  const f = new File(['x'], name, { type })
  Object.defineProperty(f, 'size', { value: size })
  return f
}

describe('DocumentUploadComponent', () => {
  let component: DocumentUploadComponent
  let peerValidationServiceMock: any
  let dialogMock: any
  let snackBarMock: any

  beforeEach(() => {
    peerValidationServiceMock = {
      uploadDocument: jest.fn().mockReturnValue(of(makeDoc({ url: 'https://cdn.example.com/bucket/upload.pdf' }))),
    }
    dialogMock = {
      open: jest.fn(),
    }
    snackBarMock = { open: jest.fn() }

    component = new DocumentUploadComponent(peerValidationServiceMock, dialogMock, snackBarMock)
  })

  it('should create the component', () => {
    expect(component).toBeTruthy()
  })

  // ─── onDragOver ───────────────────────────────────────────────────────────

  describe('onDragOver', () => {
    it('should set dragOver to true and prevent default', () => {
      const event = { preventDefault: jest.fn(), stopPropagation: jest.fn() } as any
      component.onDragOver(event)
      expect(component.dragOver).toBe(true)
      expect(event.preventDefault).toHaveBeenCalled()
    })
  })

  // ─── onDragLeave ──────────────────────────────────────────────────────────

  describe('onDragLeave', () => {
    it('should set dragOver to false', () => {
      component.dragOver = true
      const event = { preventDefault: jest.fn(), stopPropagation: jest.fn() } as any
      component.onDragLeave(event)
      expect(component.dragOver).toBe(false)
    })
  })

  // ─── onDrop ───────────────────────────────────────────────────────────────

  describe('onDrop', () => {
    it('should call handleFiles with dropped files', () => {
      const handleSpy = jest.spyOn(component, 'handleFiles').mockImplementation(() => { })
      const file = makeFile('test.pdf', 'application/pdf')
      const dt = { files: [file] } as any
      const event = { preventDefault: jest.fn(), stopPropagation: jest.fn(), dataTransfer: dt } as any
      component.onDrop(event)
      expect(component.dragOver).toBe(false)
      expect(handleSpy).toHaveBeenCalledWith([file])
    })

    it('should not throw when dataTransfer is null', () => {
      const event = { preventDefault: jest.fn(), stopPropagation: jest.fn(), dataTransfer: null } as any
      expect(() => component.onDrop(event)).not.toThrow()
    })
  })

  // ─── onFileSelect ─────────────────────────────────────────────────────────

  describe('onFileSelect', () => {
    it('should call handleFiles and reset input value', () => {
      const handleSpy = jest.spyOn(component, 'handleFiles').mockImplementation(() => { })
      const file = makeFile('test.pdf', 'application/pdf')
      const input = { files: [file], value: 'something' } as any
      component.onFileSelect({ target: input } as any)
      expect(handleSpy).toHaveBeenCalledWith([file])
      expect(input.value).toBe('')
    })

    it('should not throw and reset value when files is null', () => {
      const input = { files: null, value: 'something' } as any
      expect(() => component.onFileSelect({ target: input } as any)).not.toThrow()
      expect(input.value).toBe('')
    })
  })

  // ─── handleFiles – validation ─────────────────────────────────────────────

  describe('handleFiles', () => {
    it('should reject invalid file type with snackBar', () => {
      component.handleFiles([makeFile('img.png', 'image/png')])
      expect(snackBarMock.open).toHaveBeenCalledWith(
        expect.stringContaining('Only PDF and MP4 are allowed'),
        undefined,
        expect.anything()
      )
      expect(peerValidationServiceMock.uploadDocument).not.toHaveBeenCalled()
    })

    it('should reject second PDF when one already exists', () => {
      component.documents = [makeDoc({ type: 'application/pdf' })]
      component.handleFiles([makeFile('second.pdf', 'application/pdf')])
      expect(snackBarMock.open).toHaveBeenCalledWith(
        expect.stringContaining('Only one PDF is allowed'),
        undefined,
        expect.anything()
      )
    })

    it('should reject second video when one already exists', () => {
      component.documents = [makeDoc({ type: 'video/mp4', name: 'vid.mp4' })]
      component.handleFiles([makeFile('second.mp4', 'video/mp4')])
      expect(snackBarMock.open).toHaveBeenCalledWith(
        expect.stringContaining('Only one video is allowed'),
        undefined,
        expect.anything()
      )
    })

    it('should reject PDF exceeding 2 MB', () => {
      const bigPdf = makeFile('big.pdf', 'application/pdf', 3 * 1024 * 1024)
      component.handleFiles([bigPdf])
      expect(snackBarMock.open).toHaveBeenCalledWith(
        expect.stringContaining('2MB'),
        undefined,
        expect.anything()
      )
    })

    it('should reject MP4 exceeding 200 MB', () => {
      const bigMp4 = makeFile('big.mp4', 'video/mp4', 201 * 1024 * 1024)
      component.handleFiles([bigMp4])
      expect(snackBarMock.open).toHaveBeenCalledWith(
        expect.stringContaining('200MB'),
        undefined,
        expect.anything()
      )
    })

    it('should call uploadFile for a valid PDF', () => {
      const uploadSpy = jest.spyOn(component, 'uploadFile').mockImplementation(() => { })
      component.handleFiles([makeFile('ok.pdf', 'application/pdf', 500 * 1024)])
      expect(uploadSpy).toHaveBeenCalled()
    })

    it('should call uploadFile for a valid MP4', () => {
      const uploadSpy = jest.spyOn(component, 'uploadFile').mockImplementation(() => { })
      component.handleFiles([makeFile('ok.mp4', 'video/mp4', 10 * 1024 * 1024)])
      expect(uploadSpy).toHaveBeenCalled()
    })

    it('should process multiple files independently', () => {
      const uploadSpy = jest.spyOn(component, 'uploadFile').mockImplementation(() => { })
      component.handleFiles([
        makeFile('a.pdf', 'application/pdf', 100),
        makeFile('b.mp4', 'video/mp4', 100),
      ])
      expect(uploadSpy).toHaveBeenCalledTimes(2)
    })
  })

  // ─── uploadFile ───────────────────────────────────────────────────────────

  describe('uploadFile', () => {
    it('should add uploaded document to the list and emit', () => {
      const emitSpy = jest.spyOn(component.documentsChanged, 'emit')
      const file = makeFile('ok.pdf', 'application/pdf', 100)
      component.formId = 'form1'
      component.uploadFile(file)
      expect(peerValidationServiceMock.uploadDocument).toHaveBeenCalledWith(file, 'form1')
      expect(component.documents.length).toBe(1)
      expect(emitSpy).toHaveBeenCalledWith(component.documents)
      expect(component.isUploading).toBe(false)
    })

    it('should show snackBar and reset isUploading on error', () => {
      peerValidationServiceMock.uploadDocument.mockImplementation(() => ({
        subscribe: ({ error }: any) => error(new Error('Upload failed')),
      }))
      const file = makeFile('bad.pdf', 'application/pdf', 100)
      component.uploadFile(file)
      expect(snackBarMock.open).toHaveBeenCalledWith(
        expect.stringContaining('Failed to upload'),
        undefined,
        expect.anything()
      )
      expect(component.isUploading).toBe(false)
    })
  })

  // ─── removeDocument ───────────────────────────────────────────────────────

  describe('removeDocument', () => {
    it('should remove document at given index and emit', () => {
      component.documents = [makeDoc({ id: 'd1' }), makeDoc({ id: 'd2' }), makeDoc({ id: 'd3' })]
      const emitSpy = jest.spyOn(component.documentsChanged, 'emit')
      component.removeDocument(1)
      expect(component.documents.length).toBe(2)
      expect(component.documents.find(d => d.id === 'd2')).toBeUndefined()
      expect(emitSpy).toHaveBeenCalledWith(component.documents)
    })
  })

  // ─── formatFileSize ───────────────────────────────────────────────────────

  describe('formatFileSize', () => {
    it('should return bytes for < 1024', () => {
      expect(component.formatFileSize(512)).toBe('512 B')
    })

    it('should return KB', () => {
      expect(component.formatFileSize(2048)).toBe('2.0 KB')
    })

    it('should return MB', () => {
      expect(component.formatFileSize(1048576)).toBe('1.0 MB')
    })
  })

  // ─── previewFile ──────────────────────────────────────────────────────────

  describe('previewFile', () => {
    it('should open VideoPreviewDialogComponent for MP4', () => {
      component.previewFile(makeDoc({ type: 'video/mp4', name: 'vid.mp4', url: 'http://cdn/vid.mp4' }))
      expect(dialogMock.open).toHaveBeenCalled()
    })

    it('should open dialog for PDF', () => {
      component.previewFile(makeDoc({ type: 'application/pdf', url: 'http://cdn/file.pdf' }))
      expect(dialogMock.open).toHaveBeenCalled()
    })

    it('should NOT open dialog for unsupported types', () => {
      component.previewFile(makeDoc({ type: 'image/png', name: 'img.png' }))
      expect(dialogMock.open).not.toHaveBeenCalled()
    })
  })

  // ─── generateUrl ─────────────────────────────────────────────────────────

  describe('generateUrl', () => {
    it('should return empty string for empty input', () => {
      const result = component.generateUrl('')
      expect(result).toBe('')
    })

    it('should transform the host segment', () => {
      const original = 'https://old-host.example.com/bucket/path/file.pdf'
      const result = component.generateUrl(original)
      // Segment at index 3 is replaced with 'content-store'
      expect(result).toContain('content-store')
    })
  })
})
