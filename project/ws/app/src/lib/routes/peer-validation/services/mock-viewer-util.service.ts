import { Injectable } from '@angular/core'
import { Subject, Observable, of } from 'rxjs'

/**
 * Mock implementation of ViewerUtilService to handle blob URLs correctly
 * for preview functionality. This service is used in preview dialogs to
 * bypass CDN URL transformations that would break local file previews.
 */
@Injectable()
export class MockViewerUtilService {
  autoPlayNextVideo = new Subject<boolean>()
  markAsCompleteSubject = new Subject<any>()

  // EventBus for PDF player
  public eventBus: any = {
    on: () => { },
    off: () => { },
    dispatch: () => { },
  }

  constructor() { }

  /**
   * Returns the URL as-is for blob URLs, bypassing CDN transformation.
   * This allows local file previews to work correctly.
   */
  getCdnUrl(url: string): string {
    if (url && url.startsWith('blob:')) {
      return url
    }
    return url
  }

  /**
   * Returns the URL as-is for authoring URLs.
   */
  getAuthoringUrl(url: string): string {
    return url
  }

  /**
   * Returns the URL as-is for public URLs, with special handling for blob URLs.
   */
  getPublicUrl(url: string): string {
    if (url && url.startsWith('blob:')) {
      return url
    }
    return url
  }

  /**
   * Mock implementation for getting content - returns null for previews.
   */
  getContent(_identifier: string): Observable<any> {
    return of(null)
  }

  /**
   * Mock implementation for getting batch and course IDs - returns null for previews.
   */
  getBatchIdAndCourseId(_collectionId: string, _userId: string): { batchId: string | null, courseId: string | null } {
    return { batchId: null, courseId: null }
  }

  /**
   * Mock implementation for real-time progress updates - no-op for previews.
   */
  realTimeProgressUpdate(_id: string, _request: any, _collectionId: string, _batchId: string): Promise<void> {
    return Promise.resolve()
  }
}
