import { ContactHomeComponent } from './contact-home.component';
import { staticEnContent, staticHiContent } from './../../../../../app/modules/public-home/components/latest-updates/latest-updates.model';
import { CONTACTUS, FOOTER_PROVIDER, NAV_FOOTER_DETAILS } from './../../../shared/constant/app.constant';

describe('ContactHomeComponent', () => {
  let component: ContactHomeComponent;
  
  // Mock window.scrollTo
  const originalScrollTo = window.scrollTo;
  
  beforeEach(() => {
    // Initialize the component
    component = new ContactHomeComponent();
    
    // Mock window.scrollTo
    window.scrollTo = jest.fn();
    
    // Clear localStorage before each test
    localStorage.clear();
  });
  
  afterEach(() => {
    // Restore original window.scrollTo
    window.scrollTo = originalScrollTo;
    
    // Clear localStorage after each test
    localStorage.clear();
  });
  
  it('should create', () => {
    expect(component).toBeTruthy();
  });
  
  it('should initialize with default values', () => {
    expect(component.navFooterDetails).toBe(NAV_FOOTER_DETAILS);
    expect(component.contactUs).toBe(CONTACTUS);
    expect(component.footerProvider).toEqual(FOOTER_PROVIDER);
  });
  
  it('should call window.scrollTo in ngOnInit', () => {
    // Call ngOnInit
    component.ngOnInit();
    
    // Verify window.scrollTo was called with correct parameters
    expect(window.scrollTo).toHaveBeenCalledWith(0, 0);
  });
  
  it('should set English static content when language is English', () => {
    // Set localStorage
    localStorage.setItem('selectedAppLanguage', 'English');
    
    // Call ngOnInit
    component.ngOnInit();
    
    // Verify the content is set correctly
    expect(component.staticContent).toBe(staticEnContent);
  });
  
  it('should set Hindi static content when language is not English', () => {
    // Set localStorage
    localStorage.setItem('selectedAppLanguage', 'Hindi');
    
    // Call ngOnInit
    component.ngOnInit();
    
    // Verify the content is set correctly
    expect(component.staticContent).toBe(staticHiContent);
  });
  
  it('should default to Hindi static content when no language is set', () => {
    // Call ngOnInit without setting localStorage
    component.ngOnInit();
    
    // Verify the content defaults to Hindi
    expect(component.staticContent).toBe(staticHiContent);
  });
});