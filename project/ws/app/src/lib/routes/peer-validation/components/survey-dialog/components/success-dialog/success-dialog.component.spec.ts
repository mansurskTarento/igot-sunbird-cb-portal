import { SuccessDialogComponent } from './success-dialog.component'

describe('SuccessDialogComponent', () => {
  let component: SuccessDialogComponent
  let dialogRefMock: { close: jest.Mock }

  beforeEach(() => {
    dialogRefMock = { close: jest.fn() }
    component = new SuccessDialogComponent(dialogRefMock as any)
  })

  it('should create the component', () => {
    expect(component).toBeTruthy()
  })

  it('should expose the dialogRef publicly', () => {
    expect(component.dialogRef).toBe(dialogRefMock)
  })

  describe('onDone', () => {
    it('should close the dialog', () => {
      component.onDone()
      expect(dialogRefMock.close).toHaveBeenCalled()
    })

    it('should call close exactly once per invocation', () => {
      component.onDone()
      component.onDone()
      expect(dialogRefMock.close).toHaveBeenCalledTimes(2)
    })
  })
})
