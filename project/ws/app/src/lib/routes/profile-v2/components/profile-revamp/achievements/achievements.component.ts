import { Component, EventEmitter, Inject, Input, OnInit, Output } from '@angular/core';
import { achievement } from '../../../models/profile-revamp.model';
import { MAT_LEGACY_DIALOG_DATA, MatLegacyDialog, MatLegacyDialogRef } from '@angular/material/legacy-dialog';
import { ProfileV2RevampService } from '../../../services/profile-v2-revamp.service';
import { MatLegacySnackBar } from '@angular/material/legacy-snack-bar';
import * as _ from 'lodash';
import { CertificateViewPopupComponent } from '../certificate-view-popup/certificate-view-popup.component';

@Component({
  selector: 'ws-app-achievements',
  templateUrl: './achievements.component.html',
  styleUrls: ['./achievements.component.scss']
})
export class AchievementsComponent implements OnInit {
  //#region (global variables)
  @Input() achievementsList: achievement[] = [];
  @Input() isCurrentUser = false;
  @Output() openProfileEntryEditDialog = new EventEmitter();

  userId: string = '';
  isPopup: boolean = false;
  //#endregion
  constructor(
    private dialogRef: MatLegacyDialogRef<AchievementsComponent>,
    @Inject(MAT_LEGACY_DIALOG_DATA) private data: any,
    private profileV2RevampSvc: ProfileV2RevampService,
    private snackBar: MatLegacySnackBar,
    private dialog: MatLegacyDialog,
  ) {
    if (this.data && this.data.userId) {
      this.userId = data.userId;
      this.isPopup = true
      this.isCurrentUser = data.isCurrentUser || false;
    }
  }

  ngOnInit() {
    if (this.isPopup) {
      this.getAchievementsList();
    } else {
      this.sortAchivements();
    }
  }

  //#region (functions)

  getAchievementsList(): void {
    if (this.userId) {
      this.profileV2RevampSvc.fetchProfileEntries(this.userId, 'achievement').subscribe({
        next: (res: any) => {
          if (res) {
            this.achievementsList = _.get(res, 'result.response.achievements', []);
            this.sortAchivements()
          }
        },
        error: (err: any) => {
          if (err) {
            this.openSnackbar('Something went wrong while fetching achievements, please try again later', 2000);
          }
        }
      })
    }
  }

  sortAchivements(): void {
    this.achievementsList = this.achievementsList.sort((a, b) => {
    const dateA = a.issuedDate ? new Date(a.issuedDate).getTime() : 0; // Assign 0 if issuedDate is empty
    const dateB = b.issuedDate ? new Date(b.issuedDate).getTime() : 0; // Assign 0 if issuedDate is empty

    // Sort by date in descending order, placing empty dates at the bottom
    if (dateA === 0 && dateB === 0) {
      return 0; // Both are empty, keep their order
    } else if (dateA === 0) {
      return 1; // Place `a` after `b`
    } else if (dateB === 0) {
      return -1; // Place `b` after `a`
    } else {
      return dateB - dateA; // Sort by latest date first
    }
  });
  }

  openEditDialog(entry: any = {}): void {
    this.openProfileEntryEditDialog.emit(entry);
  }

  viewMore(achievement: any): void {
    if (achievement && achievement.showMore) {
      achievement.showMore = false;
    } else {
      achievement['showMore'] = true;
    }
  }

  openDocument(url: string): void {
    if (url) {
      this.dialog.open(CertificateViewPopupComponent, {
        width: '600px',
        panelClass: 'cover-photo-edit-popup',
        data: {
          certificateUrl: url
        },
        disableClose: true,
        autoFocus: false,
      })
    }
  }

  openUrl(url: string): void {
    window.open(url, '_blank');
  }

  closePopup(): void {
    if(this.isPopup) {
      this.dialogRef.close();
    }
  }

  private openSnackbar(primaryMsg: string, duration: number = 5000) {
    this.snackBar.open(primaryMsg, 'X', {
      duration,
    })
  }
  //#endregion (functions)

}
