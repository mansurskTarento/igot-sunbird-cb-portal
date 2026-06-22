import { Directive, HostListener, input, inject } from '@angular/core';
import { Router } from '@angular/router';
import { MobileAppsService } from '../_services/mobile-apps.service';

@Directive({
  selector: '[wsWidgetUrlResolverV2]',
  standalone: true,
})
export class WidgetUrlResolverV2Directive {
  private router = inject(Router);
  private mobileAppsSvc = inject(MobileAppsService);

  wsWidgetUrlResolverV2 = input<boolean>(false);
  url = input<string>('');
  mobileAppFunction = input<string | undefined>(undefined);

  @HostListener('click', ['$event'])
  clicked(event: Event) {
    event.preventDefault();

    if (this.mobileAppFunction() && this.mobileAppsSvc.isMobile) {
      this.mobileAppsSvc.sendDataAppToClient(this.mobileAppFunction()!, {});
      return;
    }

    const urlValue = this.url();
    if (!urlValue) {
      return;
    }

    if (this.wsWidgetUrlResolverV2()) {
      this.router.navigate(['/externalRedirect', { externalUrl: urlValue }], {
        skipLocationChange: true,
      });
    } else {
      this.router.navigateByUrl(urlValue);
    }
  }
}
