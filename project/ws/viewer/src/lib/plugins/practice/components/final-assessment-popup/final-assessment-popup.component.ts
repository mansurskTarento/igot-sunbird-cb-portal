import { Component, Inject, OnInit, OnDestroy } from '@angular/core'
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog'
import { MatTableDataSource } from '@angular/material/table'
import { ITableData } from '@sunbird-cb/collection'
import * as _ from 'lodash'

@Component({
    selector: 'viewer-final-assessment-popup',
    templateUrl: './final-assessment-popup.component.html',
    styleUrls: ['./final-assessment-popup.component.scss'],
    standalone: false
})
export class FinalAssessmentPopupComponent implements OnInit, OnDestroy {

  assessmentData: any
  dataSource = new MatTableDataSource([])
  displayedColumns: any[] = []

  tableData!: ITableData | undefined
  countdown = 5
  countdownInterval: any

  constructor(
    private dialogRef: MatDialogRef<FinalAssessmentPopupComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
  ) {
    this.assessmentData = data
    if (data && data.tableDetails && data.tableDetails.tableData) {
      this.setTableDataSource(data.tableDetails.tableData)
    }

    // Start countdown timer if auto-redirect is enabled
    if (data && data.autoRedirect && data.redirectSeconds) {
      this.countdown = data.redirectSeconds
      this.startCountdown()
    }
  }

  ngOnInit() {
    if (this.assessmentData && this.assessmentData.tableDetails && this.assessmentData.tableDetails.tableColumns) {
      this.setTableColumns(this.assessmentData.tableDetails.tableColumns)
    }
  }

  ngOnDestroy() {
    if (this.countdownInterval) {
      clearInterval(this.countdownInterval)
    }
  }

  startCountdown() {
    this.countdownInterval = setInterval(() => {
      this.countdown--
      if (this.countdown <= 0) {
        clearInterval(this.countdownInterval)
        // Auto-close will be handled by parent component
      }
    },                                   1000)
  }

  setTableColumns(columns: any) {
    this.displayedColumns = columns
  }

  setTableDataSource(data: any) {
    // this.dataSource = new MatTableDataSource(data);
    this.dataSource.data = data
  }

  closePopup(response: any) {
    this.dialogRef.close(response)
  }

  get getFinalColumns(): string[] {
    const displayColumns = _.map(this.displayedColumns, c => c.key)
    return displayColumns
  }

}
