import { Component, EventEmitter, Inject, Input, OnInit, Output } from '@angular/core';
import { achievement } from '../../../models/profile-revamp.model';
import { MAT_LEGACY_DIALOG_DATA, MatLegacyDialogRef } from '@angular/material/legacy-dialog';
import { ProfileV2RevampService } from '../../../services/profile-v2-revamp.service';
import { MatLegacySnackBar } from '@angular/material/legacy-snack-bar';
import * as _ from 'lodash';

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
  ) {
    if (this.data && this.data.userId) {
      this.userId = data.userId;
      this.isPopup = true
    }
  }

  ngOnInit() {
    if (this.isPopup) {
      this.getAchievementsList();
    }
  }

  //#region (functions)

  getAchievementsList(): void {
    if (this.userId) {
      this.profileV2RevampSvc.fetchProfileEntries(this.userId, 'achievements').subscribe({
        next: (res: any) => {
          if (res) {
            this.achievementsList = _.get(res, 'result.response.achievements', []);
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
