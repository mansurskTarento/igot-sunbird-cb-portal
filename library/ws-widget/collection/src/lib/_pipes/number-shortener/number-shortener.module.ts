import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NumberShortenerPipe } from './number-shortener.pipe';



@NgModule({
  declarations: [NumberShortenerPipe],
  imports: [
    CommonModule
  ],
  exports: [NumberShortenerPipe]
})
export class NumberShortenerModule { }
