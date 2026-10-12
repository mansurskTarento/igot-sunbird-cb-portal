import { NO_ERRORS_SCHEMA } from '@angular/core'
import { ComponentFixture, TestBed } from '@angular/core/testing'
import { MatDialog } from '@angular/material/dialog'
import { Router } from '@angular/router'
import { ConfigurationsService, EventService } from '@sunbird-cb/utils-v2'
import { of, Subject } from 'rxjs'
import { AppChatbotComponent } from './app-chatbot.component'
import { RootService } from './../root/root.service'
import { ZohoSupportService } from '../../services/zoho-support.service'

// The component only imports the Zoho dialog to open it; stub it so the spec does not
// pull in the whole @ws/app library.
jest.mock('@ws/app', () => ({ DialogBoxComponent: class {} }))

describe('AppChatbotComponent', () => {
  let component: AppChatbotComponent
  let fixture: ComponentFixture<AppChatbotComponent>

  const mockConfigSvc: any = {
    userProfile: { firstName: 'Test', profileImage: '' },
    iGOTAIConfig: {},
    unMappedUser: { userId: 'user-1' },
    updatePlatformRatingObservable$: of({}),
  }
  const mockRootSvc: any = {
    openSupportAIChatbot: new Subject<boolean>(),
    getLangugages: jest.fn(() => of({})),
    getChatData: jest.fn(() => of({})),
    iGOTAIChatHistory: [],
  }

  beforeEach(async () => {
    localStorage.clear()
    // jsdom does not implement scrollTo; ngAfterViewChecked calls it on the open panel.
    Element.prototype.scrollTo = jest.fn()
    await TestBed.configureTestingModule({
      declarations: [AppChatbotComponent],
      providers: [
        { provide: ConfigurationsService, useValue: mockConfigSvc },
        { provide: EventService, useValue: { dispatchChatbotEvent: jest.fn() } },
        { provide: RootService, useValue: mockRootSvc },
        { provide: ZohoSupportService, useValue: { getZohoHtml: jest.fn(() => of('')) } },
        { provide: MatDialog, useValue: { open: jest.fn() } },
        { provide: Router, useValue: { events: new Subject() } },
      ],
      // Child components, cdkDrag, clickOutside and Material elements are not under test here.
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents()

    fixture = TestBed.createComponent(AppChatbotComponent)
    component = fixture.componentInstance
    fixture.detectChanges()
  })

  it('should create', () => {
    expect(component).toBeTruthy()
  })

  describe('chatbot panel', () => {
    const openPanel = () => {
      component.showIcon = false
      fixture.detectChanges()
      return fixture.nativeElement.querySelector('.chatbot-panel') as HTMLElement | null
    }

    it('should not render the panel while only the launcher icon is shown', () => {
      expect(fixture.nativeElement.querySelector('.chatbot-panel')).toBeNull()
    })

    // .chatbot-panel pins the panel's text colour so it does not inherit the body's
    // white text in dark mode; it must wrap the header, the message area and the footer.
    it('should wrap the header and the content area in .chatbot-panel', () => {
      const panel = openPanel()
      expect(panel).not.toBeNull()
      expect(panel!.querySelector('.chatbot-wrapper')).not.toBeNull()
      expect(panel!.querySelector('#chatbot-wrapper')).not.toBeNull()
    })

    it('should keep .chatbot-panel alongside the size class set by ngClass', () => {
      component.enableIGOTAIFlag = true
      component.maximizeChatFlag = true
      component.fullScreenChatFlag = false
      const panel = openPanel()
      expect(panel!.classList).toContain('chatbot-panel')
      expect(panel!.classList).toContain('chatbot-with-ai')
    })

    it('should keep .chatbot-panel in full screen mode', () => {
      component.enableIGOTAIFlag = true
      component.fullScreenChatFlag = true
      const panel = openPanel()
      expect(panel!.classList).toContain('chatbot-panel')
      expect(panel!.classList).toContain('chatbot-with-ai-full')
    })
  })
})
