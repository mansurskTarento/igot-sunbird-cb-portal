import { Directive, ViewContainerRef } from '@angular/core'

@Directive({
    selector: '[wsLoginRoot]',
    standalone: false
})
export class LoginRootDirective {

  constructor(
    public viewContainerRef: ViewContainerRef,
  ) { }

}
