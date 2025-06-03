import { Component, Inject, OnInit } from '@angular/core';
import { MAT_LEGACY_DIALOG_DATA, MatLegacyDialogRef } from '@angular/material/legacy-dialog';
import { ImageCroppedEvent } from 'ngx-image-cropper';

@Component({
  selector: 'ws-app-cover-photo-edit-popup',
  templateUrl: './cover-photo-edit-popup.component.html',
  styleUrls: ['./cover-photo-edit-popup.component.scss']
})
export class CoverPhotoEditPopupComponent implements OnInit {
  //#region (global variables)
  coverPhotoUrl = '';
  imageChangedEvent: any = '';
  showCropper = false; // Changed to false initially
  cropperPosition = {
    x1: 0,
    y1: 0,
    x2: 858,
    y2: 215
  };
  imageFile: File | null = null;
  fileName = ''
  //#endregion (global variables)

  constructor(
    private dialogRef: MatLegacyDialogRef<CoverPhotoEditPopupComponent>,
    @Inject(MAT_LEGACY_DIALOG_DATA) public data: any
  ) { }

  ngOnInit(): void {
    if (this.data && this.data.coverPhotoUrl) {
      this.coverPhotoUrl = this.data.coverPhotoUrl;
      // this.loadImageFromUrl(this.coverPhotoUrl);
    }
  }

  // private async loadImageFromUrl(url: string): Promise<void> {
  //   try {
  //     const response = await fetch(url);
  //     if (!response.ok) {
  //       throw new Error(`HTTP error! status: ${response.status}`);
  //     }
      
  //     const blob = await response.blob();
  //     const file = new File([blob], 'coverPhoto.png', { type: 'image/png' });
      
  //     this.imageChangedEvent = { 
  //       target: { 
  //         files: [file] 
  //       } 
  //     };
  //     this.fileName = file.name;
      
  //     // Wait for next tick to ensure image is loaded
  //     setTimeout(() => {
  //       this.showCropper = true;
  //     });
  //   } catch (error) {
  //     console.error('Error loading image:', error);
  //     this.showCropper = false;
  //   }
  // }

  onFileChange(event: any): void {
    this.imageChangedEvent = event;
    this.showCropper = true;
    this.fileName = event.target.files[0].name || 'coverPhoto.png';
  }

  imageCropped(event: ImageCroppedEvent) {
    const base64 = event.base64;
    if (base64) {
      this.coverPhotoUrl = base64;
      this.imageFile = this.base64ToFile(base64, this.fileName || 'coverPhoto.png');
    }
  }

  private base64ToFile(base64: string, filename: string): File {
  const arr = base64.split(',');
  const mime = arr[0].match(/:(.*?);/)?.[1] || '';
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);

  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }

  return new File([u8arr], filename, { type: mime });
}

  applyChanges() {
    // Handle saving the cropped image
    this.showCropper = false;
    this.closePopup(true);
  }

  closePopup(isUpdated = false) {
    const croppedImage = {
      isUpdated: isUpdated,
      coverPhotoUrl: this.coverPhotoUrl,
      file : this.imageFile
    }
    this.dialogRef.close(croppedImage);
  }

  deleteCoverPhoto() {
    this.coverPhotoUrl = '';
    this.imageFile = null;
    this.fileName = '';
    this.showCropper = false;
  }

}
