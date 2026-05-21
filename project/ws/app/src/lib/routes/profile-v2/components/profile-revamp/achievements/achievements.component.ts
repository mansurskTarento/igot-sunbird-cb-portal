import { ChangeDetectorRef, Component, EventEmitter, Inject, Input, OnInit, Output } from '@angular/core'
import { achievement } from '../../../models/profile-revamp.model'
import { MAT_DIALOG_DATA, MatDialog, MatDialogRef } from '@angular/material/dialog'
import { ProfileV2RevampService } from '../../../services/profile-v2-revamp.service'
import { MatSnackBar } from '@angular/material/snack-bar'
import * as _ from 'lodash'
import { CertificateViewPopupComponent } from '../certificate-view-popup/certificate-view-popup.component'
import { PipeCertificateImageURL } from '@sunbird-cb/utils-v2'
import { NlwCertificateDialogComponent } from '@sunbird-cb/consumption'

@Component({
  selector: 'ws-app-achievements',
  templateUrl: './achievements.component.html',
  styleUrls: ['./achievements.component.scss'],
  providers: [PipeCertificateImageURL],
  standalone: false
})
export class AchievementsComponent implements OnInit {
  //#region (global variables)
  @Input() achievementsList: achievement[] = []
  @Input() isCurrentUser = false
  @Output() openProfileEntryEditDialog = new EventEmitter()
  @Output() openProfileEntryDeleteDialog = new EventEmitter()

  userId: string = ''
  isPopup: boolean = false
  //#endregion
  constructor(
    private dialogRef: MatDialogRef<AchievementsComponent>,
    @Inject(MAT_DIALOG_DATA) private data: any,
    private profileV2RevampSvc: ProfileV2RevampService,
    private snackBar: MatSnackBar,
    private dialog: MatDialog,
    private cdr: ChangeDetectorRef,
    private pipeImgUrl: PipeCertificateImageURL
  ) {
    if (this.data && this.data.userId) {
      this.userId = data.userId
      this.isPopup = true
      this.isCurrentUser = data.isCurrentUser || false
    }
  }

  ngOnInit() {
    if (this.isPopup) {
      this.getAchievementsList()
    } else {
      this.cdr.detectChanges()
    }
  }

  getAchievementsList(userId?: any): void {
    if (this.userId || userId) {
      this.profileV2RevampSvc.listAchievements(this.userId || userId).subscribe({
        next: (res: any) => {
          if (res) {
            this.achievementsList = _.get(res, 'result.search_results.data', [])
            this.cdr.detectChanges()
          }
        },
        error: (err: any) => {
          if (err) {
            this.openSnackbar('Something went wrong while fetching achievements, please try again later', 2000)
          }
        },
      })
    }
  }

  openEditDialog(entry: any = {}): void {
    if (this.isPopup) {
      this.dialogRef.close(entry)
    } else {
      this.openProfileEntryEditDialog.emit(entry)
    }
  }

  viewMore(achievement: any): void {
    if (achievement && achievement.showMore) {
      achievement.showMore = false
    } else {
      achievement['showMore'] = true
    }
  }

  openPDF(content: any): void {
    if (content?.uploadedDocumentUrl) {
      let dialogData = {
        pdfZoom: 'FitH',
        type: 'PDF',
        action: 'view',
        title: content.contextData?.fileName || content?.contextData?.title || 'PDF Document',
        url: content.uploadedDocumentUrl,
      }
      let dialogWidth = '700px'
      dialogWidth = window.innerWidth <= 768 ? '90vw' : '80vw'
      this.dialog.open(NlwCertificateDialogComponent, {
        data: dialogData,
        panelClass: 'nlw-experience-dialog-container',
        maxWidth: '95vw',
        width: dialogWidth,
        autoFocus: false,
      })
    }
  }

  openDocument(url: string): void {
    if (url) {
      this.dialog.open(CertificateViewPopupComponent, {
        width: '600px',
        panelClass: 'cover-photo-edit-popup',
        data: {
          certificateUrl: url,
        },
        disableClose: true,
        autoFocus: false,
      })
    }
  }

  openUrl(url: string): void {
    window.open(url, '_blank')
  }

  closePopup(): void {
    if (this.isPopup) {
      this.dialogRef.close()
    }
  }

  private openSnackbar(primaryMsg: string, duration: number = 5000) {
    this.snackBar.open(primaryMsg, 'X', {
      duration,
    })
  }
  //#endregion (functions)
  deleteAchievement(achievement: achievement): void {
    if (this.isPopup) {
      this.dialogRef.close({ achievement, action: 'delete' })
    } else {
      this.openProfileEntryDeleteDialog.emit(achievement)
    }
  }

  getUrl(url: string): string {
    if (url.includes('storage.googleapis')) {
      const folderNameToSplit = '/userAchievements/'
      const urlSplice = url.split(folderNameToSplit)[1]
      const uploadedFile = this.pipeImgUrl.transform(`${folderNameToSplit}${urlSplice}`)
      return uploadedFile
    }
    return url
  }
}
