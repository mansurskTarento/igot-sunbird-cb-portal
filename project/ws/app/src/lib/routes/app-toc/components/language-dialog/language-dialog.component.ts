import { Component, Inject, OnInit } from '@angular/core';
import { MatLegacyDialogRef as MatDialogRef, MAT_LEGACY_DIALOG_DATA as MAT_DIALOG_DATA } from '@angular/material/legacy-dialog'

@Component({
  selector: 'ws-app-language-dialog',
  templateUrl: './language-dialog.component.html',
  styleUrls: ['./language-dialog.component.scss']
})
export class LanguageDialogComponent implements OnInit{
  selectedLanguage: any
   languageList: any = []
  constructor(
    public dialogRef: MatDialogRef<LanguageDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    //  @Inject(MAT_DIALOG_DATA) public data: Array<{ name: string; localName: string; code: string }>,
      
  ) {}
  // selectedLanguage = 'en'; 
  

  ngOnInit() {
  
    console.log(this.selectedLanguage, 'selectedLanguage========')
    this.languageList = Object.entries(this.data?.content)
      .filter(([_, val]: [string, any]) => val.status === "live")
      .map(([lang, val]: [string, any]) => ({
        name: lang,
        id: val.id,
        status: val.status
      }))
      console.log(this.languageList, 'languageList from ngOnInit')
  }
  
   

 onSubmit() {
  // console.log(selectedLang, 'selected language from onSubmit=======')
  if(this.selectedLanguage) {
    this.dialogRef.close(this.selectedLanguage); // Pass selected object to parent
  }
}

}