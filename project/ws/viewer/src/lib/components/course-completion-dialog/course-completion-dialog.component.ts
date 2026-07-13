import { Component, Inject, OnInit } from '@angular/core'
import { ActivatedRoute } from '@angular/router'
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog'
import { AppTocService, TocConfigService } from '@sunbird-cb/toc'
import { LoggerService, MultilingualTranslationsService, EventService, WsEvents } from '@sunbird-cb/utils-v2'
import { TranslateService } from '@ngx-translate/core'

import { RatingService } from '@sunbird-cb/collection'
@Component({
  selector: 'viewer-course-completion-dialog',
  templateUrl: './course-completion-dialog.component.html',
  styleUrls: ['./course-completion-dialog.component.scss'],
  standalone: false
})
export class CourseCompletionDialogComponent implements OnInit {
  courseName = ''
  userRating: any = {}
  showRating = false
  isEditMode = false
  badge: any = null
  collectionId = ''
  showStarRating = true
  constructor(
    private ratingSvc: RatingService,
    private tocSvc: AppTocService,
    private tocConfigSvc: TocConfigService,
    private activatedRoute: ActivatedRoute,
    private loggerSvc: LoggerService,
    private translate: TranslateService,
    public dialogRef: MatDialogRef<CourseCompletionDialogComponent>,
    private langtranslations: MultilingualTranslationsService,
    public events: EventService,
    @Inject(MAT_DIALOG_DATA) public data: any) {
    if (localStorage.getItem('websiteLanguage')) {
      this.translate.setDefaultLang('en')
      const lang = localStorage.getItem('websiteLanguage')!
      this.translate.use(lang)
    }
  }

  ngOnInit() {
    const badgeDetails = this.data?.baseContentReadData?.badgeDetails_v1
    if (badgeDetails && badgeDetails.length) {
      const badge = badgeDetails[0]
      const now = Date.now()
      if (badge?.criteria == 'partialRandomCompletion') {
        this.badge = null
        return
      }
      if (!badge.badgeEarningDateTime || badge.badgeEarningDateTime > now) {
        this.badge = badge
      } else {
        this.badge = null
      }

    }
    const app: any = document.getElementById('viewer-conatiner-backdrop')
    if (app) {
      app.style.filter = 'blur(5px)'
    }
    if (typeof (this.data.courseName) !== 'undefined') {
      this.courseName = this.data.courseName
    } else {
      this.courseName = 'course'
    }
    // In case of multilingual course, redirection should happen to base collectionID
    this.collectionId = this.data.collectionId
    this.resolveStarRatingVisibility()
    this.getUserRating()
  }

  // uiVisibility.rightPanel.starRating from the toc page form config decides
  // whether the stars are shown; when false an Okay button (navigates to TOC
  // via mat-dialog-close) is shown instead. The form data is read from the
  // active route's resolved pageData, falling back to the cached toc form.
  private resolveStarRatingVisibility() {
    let route = this.activatedRoute.snapshot
    while (route.firstChild) {
      route = route.firstChild
    }
    const routeTocConfig = route.data && route.data.pageData && route.data.pageData.data
    if (routeTocConfig?.uiVisibility?.rightPanel) {
      this.showStarRating = routeTocConfig.uiVisibility.rightPanel.starRating !== false
    } else {
      this.tocConfigSvc.getTocConfig().subscribe((config: any) => {
        this.showStarRating = config?.uiVisibility?.rightPanel?.starRating !== false
      })
    }
  }

  // openRatingDialog() {
  //   this.getUserRating()
  // }

  getUserRating() {
    if (this.data && this.data.identifier && this.data.primaryCategory) {
      this.ratingSvc.getRating(this.data.identifier, this.data.primaryCategory, this.data.userId).subscribe(
        (res: any) => {
          if (res && res.result && res.result.response) {
            this.userRating = res.result.response
            this.tocSvc.changeUpdateReviews(true)
            // this.showRating = true
            this.isEditMode = true
          } else {
            this.userRating = {
              rating: 0,
              comment: null,
            }
            this.isEditMode = false
            // this.showRating = true
          }
        },
        (err: any) => {
          this.loggerSvc.error('USER RATING FETCH ERROR >', err)
        }
      )
    }
  }

  addRating(index: number) {
    this.showRating = true
    this.userRating = {
      rating: index + 1,
      comment: null,
      review: this.userRating?.review || '',
    }
    if (this.data && this.data.content) {
      this.events.raiseInteractTelemetry(
        {
          type: 'rating',
          subType: 'content',
          id: this.data.content.identifier || '',
        },
        {
          id: this.data.content.identifier || '',
          rating: this.userRating.rating,
        },
        {
          pageIdExt: 'rating-popup',
          module: WsEvents.EnumTelemetrymodules.FEEDBACK,
        })
    }
  }

  translateLabels(label: string, type: any) {
    return this.langtranslations.translateLabelWithoutspace(label, type, '')
  }
}
