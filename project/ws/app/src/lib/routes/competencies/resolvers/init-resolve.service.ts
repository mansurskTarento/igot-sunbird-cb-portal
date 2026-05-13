import { Injectable } from '@angular/core'
import { ActivatedRouteSnapshot } from '@angular/router'
import { Observable, forkJoin, of } from 'rxjs'
@Injectable()
export class InitResolver {
  constructor(
    // private ckEditorInject: CKEditorService,
  ) { }

  resolve(route: ActivatedRouteSnapshot): Observable<any> {
    const forkProcess: Observable<any>[] = [of(undefined)]
    const data: string[] = route.data ? route.data.load || [] : []

    if (data.includes('ckeditor')) {
      // forkProcess.push(this.ckEditorInject.inject())
    }
    return forkJoin(forkProcess).pipe()
  }
}
