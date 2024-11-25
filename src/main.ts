import { enableProdMode } from '@angular/core'
import { platformBrowser } from '@angular/platform-browser'

import { environment } from './environments/environment'
import { AppModule } from './app/app.module'

if (environment.production) {
  enableProdMode()
}

const MATCHING_IE = navigator.userAgent.match(/(msie|trident(?=\/))\/?\s*(\d+)/i) || []
if (/trident/i.test(MATCHING_IE[1])) {
  // tslint:disable-next-line: max-line-length
  document.body.innerHTML = '<h1 style="margin-top: 50px; text-align: center">IE 11 and lesser version browsers are not supported.</h1><h3 style="margin-top: 16px; text-align: center">For best experience, use Google Chrome</h3>'
} else {
  if (environment.production) {
    enableProdMode()
  }

  platformBrowser()
    .bootstrapModule(AppModule)
    .catch(err => console.error(err)) // tslint:disable-line:no-console
}
