import { Pipe, PipeTransform } from '@angular/core'

@Pipe({
    name: 'treeCatalogRoute',
    standalone: false
})
export class TreeCatalogRoutePipe implements PipeTransform {

  transform(tag: string): string {
    return `/page/explore/${encodeURIComponent(tag)}`
  }

}
