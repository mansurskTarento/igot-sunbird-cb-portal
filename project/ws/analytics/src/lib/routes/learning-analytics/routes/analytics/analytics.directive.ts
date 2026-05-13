import { Directive, ViewContainerRef } from '@angular/core'

@Directive({
    selector: '[wsAnalyticsAnalytics]',
    standalone: false
})
export class AnalyticsDirective {

  constructor(
    public viewContainerRef: ViewContainerRef,
  ) { }

}
