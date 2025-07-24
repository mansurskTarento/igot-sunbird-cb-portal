import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';

@Component({
  selector: 'viewer-player-overlay',
  templateUrl: './player-overlay.component.html',
  styleUrls: ['./player-overlay.component.scss']
})
export class PlayerOverlayComponent implements OnInit {
@Input() languageList: any = []
  selectedLanguage: any = null
    @Output() languageSelected = new EventEmitter<any>()

  constructor(){}

  ngOnInit() {
    console.log(this.languageList, 'languageList from player overlay')
  }

 onLanguageChange(lang: any) {
   this.languageSelected.emit(lang)
    this.selectedLanguage = lang
  }
}
