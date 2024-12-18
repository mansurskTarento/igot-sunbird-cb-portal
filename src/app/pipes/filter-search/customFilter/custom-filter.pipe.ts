import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'customFilter'
})
export class CustomFilterPipe implements PipeTransform {

  transform(items: any[], searchText: string): any[] {
    if (!items || !Array.isArray(items)) {
      return [];
    }
    if (!searchText) {
      return items
    }
    const searchTextLowerCase = searchText ? searchText.toLowerCase() : ''
    return items?.filter(item => 
      item?.title?.toLowerCase().includes(searchTextLowerCase)
    )
  }
}
