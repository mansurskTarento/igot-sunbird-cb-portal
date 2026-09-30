import { enableProdMode } from '@angular/core'
import { platformBrowser } from '@angular/platform-browser'
import { AppModule } from './app/app.module'
import { environment } from './environments/environment'
// Application env config, resolved before anything that reads it.
//
// Every environment.*.ts reads window.env['<key>'] at module-evaluation time, so this
// file must NOT statically import AppModule or environment: a static import is evaluated
// during this module's own initialization, i.e. before loadEnv() has resolved, and
// window.env['name'] then throws
//   TypeError: Cannot read properties of undefined (reading 'name')
// before a single pixel renders. Hence the dynamic imports in the chain at the bottom -
// they are what makes the ordering guarantee real, not just intended.
//
// index.html starts the request so it overlaps the bundle download and parks the promise
// on window.envReady; all this does is wait for it. Do not move the fetch here - that
// would serialise a network round trip ahead of bootstrap.

const MATCHING_IE = navigator.userAgent.match(/(msie|trident(?=\/))\/?\s*(\d+)/i) || []
if (/trident/i.test(MATCHING_IE[1])) {
  // tslint:disable-next-line: max-line-length
  document.body.innerHTML = '<h1 style="margin-top: 50px; text-align: center">IE 11 and lesser version browsers are not supported.</h1><h3 style="margin-top: 16px; text-align: center">For best experience, use Google Chrome</h3>'
} else {
  // loadEnv()
  //   .then(async () => {
  //     const { AppModule } = await import('./app/app.module')
  //     const { environment } = await import('./environments/environment')

  //     if (environment.production) {
  //       enableProdMode()
  //     }

  //     return platformBrowser().bootstrapModule(AppModule)
  //   })
  //   .catch(err => console.error(err))
  // const { AppModule } = await import('./app/app.module')
  // const { environment } = await import('./environments/environment')

  if (environment.production) {
    enableProdMode()
  }

  platformBrowser().bootstrapModule(AppModule).catch(err => console.error(err)) // tslint:disable-line:no-console
}