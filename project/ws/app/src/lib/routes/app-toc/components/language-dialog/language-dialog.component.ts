import { Component, Inject, OnInit } from '@angular/core';
import { MatLegacyDialogRef as MatDialogRef, MAT_LEGACY_DIALOG_DATA as MAT_DIALOG_DATA } from '@angular/material/legacy-dialog'

@Component({
  selector: 'ws-app-language-dialog',
  templateUrl: './language-dialog.component.html',
  styleUrls: ['./language-dialog.component.scss']
})
export class LanguageDialogComponent implements OnInit{
  selectedLanguage = '';
  constructor(
    public dialogRef: MatDialogRef<LanguageDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    //  @Inject(MAT_DIALOG_DATA) public data: Array<{ name: string; localName: string; code: string }>,
      
  ) {}
  // selectedLanguage = 'en'; 
  

  ngOnInit() {
    console.log(this.data, 'data========')
  }

}
