import { Pipe, PipeTransform } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

@Pipe({
  name: 'highlight'
})
export class HighlightPipe implements PipeTransform {
  constructor(private sanitizer: DomSanitizer) {}

  transform(text: string, keyword: string, shouldHighlight: boolean): SafeHtml {
    if (!shouldHighlight || !keyword || !text) return text;
    console.log(shouldHighlight, keyword, text)
   // const escapedKeyword = keyword.replace(/[-[\]/{}()*+?.\\^$|]/g, '\\$&');

    try {
      const regex = new RegExp(keyword, 'gi');
      const highlighted = text.replace(regex, (match) => `<span class="highlight">${match}</span>`);
      return this.sanitizer.bypassSecurityTrustHtml(highlighted);
    } catch (err) {
      console.warn('Regex error:', err);
      return text;
    }
  }
}