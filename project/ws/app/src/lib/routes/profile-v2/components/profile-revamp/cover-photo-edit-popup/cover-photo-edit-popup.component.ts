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
  //#endregion (global variables)

  constructor(
    private dialogRef: MatLegacyDialogRef<CoverPhotoEditPopupComponent>,
    @Inject(MAT_LEGACY_DIALOG_DATA) public data: any
  ) { }

  ngOnInit(): void {
    if (this.data && this.data.coverPhotoUrl) {
      this.coverPhotoUrl = this.data.coverPhotoUrl;
      this.loadImageFromUrl(this.coverPhotoUrl);
    }
  }

  private async loadImageFromUrl(url: string): Promise<void> {
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const blob = await response.blob();
      const file = new File([blob], 'coverPhoto.png', { type: 'image/png' });
      
      this.imageChangedEvent = { 
        target: { 
          files: [file] 
        } 
      };
      
      // Wait for next tick to ensure image is loaded
      setTimeout(() => {
        this.showCropper = true;
      });
    } catch (error) {
      console.error('Error loading image:', error);
      this.showCropper = false;
    }
  }

  onFileChange(event: any): void {
    this.imageChangedEvent = event;
    this.showCropper = true;
  }

  imageCropped(event: ImageCroppedEvent) {
    this.coverPhotoUrl = event.base64 || '';
  }

  applyChanges() {
    // Handle saving the cropped image
    this.showCropper = false;
    this.closePopup(true);
  }

  closePopup(isUpdated = false) {
    const croppedImage = {
      isUpdated: isUpdated,
      coverPhotoUrl: this.coverPhotoUrl
    }
    this.dialogRef.close(croppedImage);
  }

  deleteCoverPhoto() {}

}
