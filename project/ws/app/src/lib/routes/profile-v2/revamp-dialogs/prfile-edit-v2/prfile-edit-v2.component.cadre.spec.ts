import { PrfileEditV2Component } from './prfile-edit-v2.component'
import { FormBuilder } from '@angular/forms'
import { of } from 'rxjs'

/**
 * Covers the cadre chain: isCadre -> civil service type -> [state] -> service ->
 * cadre -> batch. The state step exists only for a type that nests its services
 * under a state level, per ICivilServiceType in cadre-mapping.service.ts.
 */
describe('PrfileEditV2Component cadre / state service chain', () => {
  const AIS = 'All India Services'
  const STATE_SERVICE = 'State Service'
  const ARPSS = 'Arunachal Pradesh Secretariat Service (ArPSS)'
  const ARUNACHAL = 'Arunachal Pradesh'

  const stateScopedType = () => ({
    id: 'cst-005',
    name: STATE_SERVICE,
    states: [
      {
        id: 'state-001',
        name: ARUNACHAL,
        serviceList: [{
          id: 'cs-050',
          name: ARPSS,
          cadreControllingAuthority: 'Government of Arunachal Pradesh',
          commonBatchStartYear: 1960,
          commonBatchEndYear: 1965,
          commonBatchExclusionYearList: [],
          cadreList: [],
        }],
      },
      { id: 'state-002', name: 'Bihar', serviceList: [{ id: 'cs-051', name: 'Bihar Secretariat Service' }] },
    ],
  })

  const flatType = () => ({
    id: 'cst-003',
    name: AIS,
    serviceList: [{
      id: 'cs-001',
      name: 'Indian Administrative Service (IAS)',
      cadreControllingAuthority: 'Department of Personnel and Training',
      commonBatchStartYear: 1960,
      commonBatchEndYear: 1962,
      commonBatchExclusionYearList: [],
      cadreList: [{ id: 'cadre-002', name: 'Andhra Pradesh', startBatchYear: 1960, endBatchYear: 1961, exculsionYearList: [] }],
    }],
  })

  const cadreConfig = (types: any[]) => ({
    result: { response: { value: { civilServiceType: { civilServiceTypeList: types } } } },
  })

  let component: any
  let service: any

  const build = (profileDetails: any = {}, types: any[] = [stateScopedType(), flatType()]) => {
    service = {
      fetchCadre: jest.fn().mockReturnValue(of(cadreConfig(types))),
      getMasterLanguages: jest.fn().mockReturnValue(of({ languages: [] })),
      fetchNodalDetails: jest.fn().mockReturnValue(of({ result: { response: { content: [] } } })),
      searchUserByField: jest.fn().mockReturnValue(of({ result: { response: { count: 0 } } })),
      handleTranslateTo: jest.fn().mockReturnValue('msg'),
    }
    const created = new PrfileEditV2Component(
      new FormBuilder(),
      { close: jest.fn() } as any,
      { header: 'Other Details', profileDetails } as any,
      service,
      { open: jest.fn(), openFromComponent: jest.fn() } as any,
      {} as any,
      { open: jest.fn() } as any,
      { transform: jest.fn() } as any,
      { transform: jest.fn() } as any,
      { handleTranslateTo: jest.fn() } as any,
      { unMappedUser: { id: 'u1' } } as any,
      { instant: jest.fn() } as any,
      { replaceState: jest.fn() } as any
    ) as any
    created.header = 'Other Details'
    return created
  }

  // exercises the real load path: build the form, then let fetchCadre resolve
  const load = (profileDetails: any, types?: any[]) => {
    component = build(profileDetails, types)
    component.ngOnInit()
    return component
  }

  describe('resolveStateLevel', () => {
    it('reads the documented `states` key', () => {
      component = build()
      expect((component as any).resolveStateLevel(stateScopedType()).map((s: any) => s.name))
        .toEqual([ARUNACHAL, 'Bihar'])
    })

    it('tolerates other key names for the same nesting', () => {
      component = build()
      const node: any = { id: 'x', name: STATE_SERVICE, stateList: [{ id: 's1', name: 'Goa', serviceList: [] }] }
      expect((component as any).resolveStateLevel(node).map((s: any) => s.name)).toEqual(['Goa'])
    })

    it('finds a state level under an unknown key by its shape', () => {
      component = build()
      const node: any = { id: 'x', name: STATE_SERVICE, stateWiseServices: [{ id: 's1', name: 'Goa', serviceList: [] }] }
      expect((component as any).resolveStateLevel(node).map((s: any) => s.name)).toEqual(['Goa'])
    })

    it('groups a flat serviceList that tags each service with a state', () => {
      component = build()
      const node: any = {
        id: 'x', name: STATE_SERVICE,
        serviceList: [
          { id: 'a', name: 'A', state: 'Goa', stateId: 'g1' },
          { id: 'b', name: 'B', state: 'Goa', stateId: 'g1' },
          { id: 'c', name: 'C', state: 'Kerala', stateId: 'k1' },
        ],
      }
      const resolved = (component as any).resolveStateLevel(node)
      expect(resolved.map((s: any) => s.name)).toEqual(['Goa', 'Kerala'])
      expect(resolved[0].serviceList).toHaveLength(2)
      expect(resolved[0].id).toBe('g1')
    })

    it('returns nothing for a plain type so the type -> service flow is untouched', () => {
      component = build()
      expect((component as any).resolveStateLevel(flatType())).toEqual([])
      expect((component as any).resolveStateLevel(null)).toEqual([])
    })
  })

  describe('selecting a state-scoped type', () => {
    beforeEach(() => {
      component = load({ isCadre: true })
      component.getService(STATE_SERVICE)
    })

    it('offers the states and holds the services back', () => {
      expect(component.hasCivilServiceStates).toBe(true)
      expect(component.civilServiceStateNames).toEqual([ARUNACHAL, 'Bihar'])
      expect(component.serviceNamesList).toEqual([])
    })

    it('shows the state field and hides services until a state is chosen', () => {
      component.profileForm.get('civilServiceType').setValue(STATE_SERVICE)
      component.profileForm.get('isCadre').setValue(true)
      expect(component.showStateSelection).toBe(true)
      expect(component.showServiceSelection).toBe(false)

      component.onStateSelect(ARUNACHAL)
      component.profileForm.get('civilServiceState').setValue(ARUNACHAL)
      expect(component.showServiceSelection).toBe(true)
    })

    it('makes the state required', () => {
      expect(component.profileForm.get('civilServiceState').validator).toBeTruthy()
      expect(component.profileForm.get('civilServiceState').hasError('required')).toBe(true)
    })

    it('populates the services and the state id once a state is picked', () => {
      component.onStateSelect(ARUNACHAL)
      expect(component.serviceNamesList).toEqual([ARPSS])
      expect(component.civilServiceStateId).toBe('state-001')
    })

    it('clears the downstream selections when the state changes', () => {
      component.onStateSelect(ARUNACHAL)
      component.profileForm.get('civilServiceName').setValue(ARPSS)
      component.profileForm.get('cadreBatch').setValue(1962)

      component.onStateSelect('Bihar')
      expect(component.profileForm.get('civilServiceName').value).toBeNull()
      expect(component.profileForm.get('cadreBatch').value).toBeNull()
      expect(component.civilServiceStateId).toBe('state-002')
    })
  })

  describe('switching back to a type without states', () => {
    it('drops the state value, its validator and its id', () => {
      component = load({ isCadre: true })
      component.getService(STATE_SERVICE)
      component.onStateSelect(ARUNACHAL)
      expect(component.civilServiceStateId).toBe('state-001')

      component.getService(AIS)
      expect(component.hasCivilServiceStates).toBe(false)
      expect(component.showStateSelection).toBe(false)
      expect(component.civilServiceStateId).toBe('')
      expect(component.profileForm.get('civilServiceState').value).toBe('')
      expect(component.profileForm.get('civilServiceState').validator).toBeNull()
      expect(component.serviceNamesList).toEqual(['Indian Administrative Service (IAS)'])
    })

    it('clears the state level when the user is no longer in an organised service', () => {
      component = load({ isCadre: true })
      component.getService(STATE_SERVICE)
      component.getIsCadreStatus(false)
      expect(component.hasCivilServiceStates).toBe(false)
      expect(component.civilServiceStateNames).toEqual([])
      expect(component.civilServiceStateId).toBe('')
    })
  })

  describe('batch years', () => {
    beforeEach(() => { component = build() })

    it.each([
      ['null (the config gap that rendered a single "0" option)', null, null],
      ['empty string', '', ''],
      ['zero', 0, 0],
      ['undefined', undefined, undefined],
      ['out of plausible range', 12, 99],
      ['end before start', 2024, 1960],
    ])('yields no options for %s', (_label, start, end) => {
      expect((component as any).buildYearArray(start, end, [])).toEqual([])
    })

    it('builds an inclusive range', () => {
      expect((component as any).buildYearArray(1960, 1964, [])).toEqual([1960, 1961, 1962, 1963, 1964])
    })

    it('honours the exclusion list', () => {
      expect((component as any).buildYearArray(1960, 1964, [1961, 1963])).toEqual([1960, 1962, 1964])
    })

    it('accepts years sent as strings', () => {
      expect((component as any).buildYearArray('1960', '1962', null)).toEqual([1960, 1961, 1962])
    })

    it('prefers the service range and falls back to the state', () => {
      component.selectedService = { commonBatchStartYear: 1990, commonBatchEndYear: 1992 }
      component.selectedCivilServiceState = { startBatchYear: 1970, endBatchYear: 1972 }
      expect((component as any).resolveBatchRange().start).toBe(1990)

      component.selectedService = { commonBatchStartYear: null, commonBatchEndYear: null }
      expect((component as any).resolveBatchRange().start).toBe(1970)

      component.selectedCivilServiceState = null
      expect((component as any).resolveBatchRange().start).toBeNull()
    })

    it('realigns a batch saved as a string so mat-select can match it', () => {
      component.profileForm = new FormBuilder().group({ cadreBatch: ['1962'] })
      component.yearArray = [1960, 1961, 1962]
      ;(component as any).syncBatchValue()
      expect(component.profileForm.get('cadreBatch').value).toBe(1962)
    })

    it('leaves a batch alone when it is not among the options', () => {
      component.profileForm = new FormBuilder().group({ cadreBatch: ['1800'] })
      component.yearArray = [1960, 1961]
      ;(component as any).syncBatchValue()
      expect(component.profileForm.get('cadreBatch').value).toBe('1800')
    })

    it('offers the batch for a service that omits cadreList entirely', () => {
      component = load({ isCadre: true })
      component.getService(STATE_SERVICE)
      component.onStateSelect(ARUNACHAL)
      component.onServiceSelect(ARPSS)
      expect(component.yearArray).toEqual([1960, 1961, 1962, 1963, 1964, 1965])
    })
  })

  describe('reopening a saved state service profile', () => {
    beforeEach(() => {
      component = load({
        isCadre: true,
        civilServiceType: STATE_SERVICE,
        civilServiceState: ARUNACHAL,
        civilServiceStateId: 'state-001',
        civilServiceName: ARPSS,
        cadreBatch: 1962,
      })
    })

    it('rebuilds the whole chain from the saved values', () => {
      expect(component.civilServiceStateNames).toEqual([ARUNACHAL, 'Bihar'])
      expect(component.serviceNamesList).toEqual([ARPSS])
      expect(component.civilServiceStateId).toBe('state-001')
      expect(component.cadreControllingAuthority).toBe('Government of Arunachal Pradesh')
    })

    it('keeps the saved state selected rather than clearing it', () => {
      expect(component.profileForm.get('civilServiceState').value).toBe(ARUNACHAL)
      expect(component.profileForm.get('civilServiceName').value).toBe(ARPSS)
    })

    it('populates the batch options so the saved batch renders', () => {
      expect(component.yearArray).toContain(1962)
      expect(component.profileForm.get('cadreBatch').value).toBe(1962)
    })
  })

  describe('submitted payload', () => {
    it('carries the state and its id', () => {
      component = load({ isCadre: true })
      component.getService(STATE_SERVICE)
      component.onStateSelect(ARUNACHAL)
      component.profileForm.patchValue({
        isCadre: true, civilServiceType: STATE_SERVICE, civilServiceState: ARUNACHAL,
        civilServiceName: ARPSS, cadreBatch: 1962,
      })
      component.genrateOtehrDetailsForm()

      const sent = component.dialogRef.close.mock.calls[0][0]
      expect(sent.civilServiceState).toBe(ARUNACHAL)
      expect(sent.civilServiceStateId).toBe('state-001')
    })

    it('blanks both state fields when the cadre chain is dropped', () => {
      component = load({ isCadre: false })
      component.profileForm.patchValue({
        isCadre: false, civilServiceType: '', civilServiceState: '', civilServiceName: '', cadreBatch: '',
      })
      component.genrateOtehrDetailsForm()

      const sent = component.dialogRef.close.mock.calls[0][0]
      expect(sent.civilServiceState).toBe('')
      expect(sent.civilServiceStateId).toBe('')
    })
  })
})
