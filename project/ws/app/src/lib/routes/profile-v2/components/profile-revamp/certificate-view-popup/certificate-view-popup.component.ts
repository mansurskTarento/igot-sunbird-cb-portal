import { Component, Inject, OnInit } from '@angular/core'
import { MAT_LEGACY_DIALOG_DATA, MatLegacyDialogRef } from '@angular/material/legacy-dialog'
import { PipeCertificateImageURL } from '@sunbird-cb/utils-v2'

@Component({
  selector: 'ws-app-certificate-view-popup',
  templateUrl: './certificate-view-popup.component.html',
  styleUrls: ['./certificate-view-popup.component.scss'],
  providers: [PipeCertificateImageURL]
})
export class CertificateViewPopupComponent implements OnInit {
  certificateUrl = '';

  constructor(private dialogRef: MatLegacyDialogRef<CertificateViewPopupComponent>,
    private pipeImgUrl: PipeCertificateImageURL,
    @Inject(MAT_LEGACY_DIALOG_DATA) public data: any) {
  }

  ngOnInit(): void {
    if (this.data && this.data.certificateUrl) {
      this.certificateUrl = this.getUrl(this.data.certificateUrl)
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

  closePopup() {
    this.dialogRef.close()
  }

}
