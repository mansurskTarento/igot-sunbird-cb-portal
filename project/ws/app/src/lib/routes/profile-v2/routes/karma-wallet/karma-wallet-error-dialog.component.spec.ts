import { Location } from '@angular/common'
import { Router } from '@angular/router'
import { MatDialogRef } from '@angular/material/dialog'

import { IKarmaWalletErrorDialogData, KarmaWalletErrorDialogComponent } from './karma-wallet-error-dialog.component'

describe('KarmaWalletErrorDialogComponent', () => {
  let dialogRefStub: { close: jest.Mock }
  let locationStub: { back: jest.Mock }
  let routerStub: { navigate: jest.Mock }

  const build = (data: IKarmaWalletErrorDialogData | null) => new KarmaWalletErrorDialogComponent(
    dialogRefStub as unknown as MatDialogRef<KarmaWalletErrorDialogComponent>,
    locationStub as unknown as Location,
    routerStub as unknown as Router,
    data,
  )

  beforeEach(() => {
    dialogRefStub = { close: jest.fn() }
    locationStub = { back: jest.fn() }
    routerStub = { navigate: jest.fn() }
  })

  it('should close and go back to the page the user came from', () => {
    build({ canGoBack: true }).goBack()

    expect(dialogRefStub.close).toHaveBeenCalled()
    expect(locationStub.back).toHaveBeenCalled()
    expect(routerStub.navigate).not.toHaveBeenCalled()
  })

  it('should go home when the wallet was the first page of the app opened', () => {
    build({ canGoBack: false }).goBack()

    expect(dialogRefStub.close).toHaveBeenCalled()
    expect(locationStub.back).not.toHaveBeenCalled()
    expect(routerStub.navigate).toHaveBeenCalledWith(['/page/home'])
  })

  it('should go home when opened without data', () => {
    build(null).goBack()

    expect(routerStub.navigate).toHaveBeenCalledWith(['/page/home'])
  })
})
