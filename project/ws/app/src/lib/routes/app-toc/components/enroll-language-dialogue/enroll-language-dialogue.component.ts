import { Component, Inject, OnInit } from '@angular/core';
import { MatLegacyDialogRef as MatDialogRef, MAT_LEGACY_DIALOG_DATA as MAT_DIALOG_DATA } from '@angular/material/legacy-dialog'

@Component({
  selector: 'ws-app-enroll-language-dialogue',
  templateUrl: './enroll-language-dialogue.component.html',
  styleUrls: ['./enroll-language-dialogue.component.scss']
})
export class EnrollLanguageDialogueComponent implements OnInit {
  selectedLanguage: any
  languageList: any = []
 constructor(
   public dialogRef: MatDialogRef<EnrollLanguageDialogueComponent>,
   @Inject(MAT_DIALOG_DATA) public data: any,

 ) {}


 ngOnInit() {
  this.languageList = this.data.languageList || [];
  this.selectedLanguage = (this.languageList && this.languageList.length > 0) ? this.languageList[0] : null
  console.log('Language List:', this.languageList);
 }

 onLanguageChange($event: any) {
  console.log('Selected Language $event:', $event);
 }
  onSubmit() {
  if(this.selectedLanguage) {
    this.dialogRef.close(this.selectedLanguage); // Pass selected object to parent
  }
  }
}
