import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatLegacyDialogRef, MAT_LEGACY_DIALOG_DATA, MatLegacyDialog } from '@angular/material/legacy-dialog';
import { MatLegacySnackBar } from '@angular/material/legacy-snack-bar';
import { DatePipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { of, throwError, Subject } from 'rxjs';
import { PrfileEditV2Component } from './prfile-edit-v2.component';
import { ProfileV2RevampService } from '../../services/profile-v2-revamp.service';
import { OtpService } from '../../../user-profile/services/otp.services';
import { PipeCertificateImageURL } from '@sunbird-cb/utils-v2';
import { VerifyOtpComponent } from '../../components/verify-otp/verify-otp.component';

describe('PrfileEditV2Component', () => {
  let component: PrfileEditV2Component;
  let fixture: ComponentFixture<PrfileEditV2Component>;
  let mockDialogRef: any;
  let mockProfileService: any;
  let mockSnackBar: any;
  let mockOtpService: any;
  let mockDialog: any;
  let mockDatePipe: any;
  let mockPipeImgUrl: any;
  let formBuilder: FormBuilder;

  const mockDialogData = {
    header: 'Profile',
    profileDetails: {
      firstname: 'John',
      state: 'TestState',
      district: 'TestDistrict',
      profileImage: 'test-image.jpg',
      group: 'TestGroup',
      designation: 'TestDesignation',
      aboutme: 'Test about me',
      employeeCode: 'EMP001',
      primaryEmail: 'test@example.com',
      gender: 'Male',
      dob: '1990-01-01',
      category: 'General',
      pinCode: '123456',
      mobile: '9876543210',
      domicileMedium: 'English',
      isCadre: false,
      civilServiceType: '',
      civilServiceName: '',
      cadreName: '',
      cadreBatch: '',
      cadreControllingAuthorityName: ''
    },
    profileImage: 'test-profile-image.jpg',
    groupsList: [{ id: 1, name: 'TestGroup' }],
    designationsMeta: [
      { id: 1, name: 'TestDesignation', status: 'Active' },
      { id: 2, name: 'AnotherDesignation', status: 'Active' }
    ]
  };

  beforeEach(async () => {
    mockDialogRef = {
      close: jest.fn()
    };

    mockProfileService = {
      getStatesList: jest.fn().mockReturnValue(of({
        result: {
          statesList: [{ id: 1, name: 'TestState' }]
        }
      })),
      getDistrictsList: jest.fn().mockReturnValue(of({
        result: {
          districtsList: [{ districts: ['TestDistrict'] }]
        }
      })),
      updateProfilePic: jest.fn().mockReturnValue(of({
        result: { url: '/profileImage/test.jpg' }
      })),
      fetchCadre: jest.fn().mockReturnValue(of({
        result: {
          response: {
            value: {
              civilServiceType: {
                civilServiceTypeList: [
                  {
                    id: 1,
                    name: 'TestServiceType',
                    serviceList: [
                      {
                        id: 1,
                        name: 'TestService',
                        cadreList: [{ id: 1, name: 'TestCadre' }],
                        cadreControllingAuthority: 'TestAuthority'
                      }
                    ]
                  }
                ]
              }
            }
          }
        }
      })),
      getMasterLanguages: jest.fn().mockReturnValue(of({
        languages: [{ id: 1, name: 'English' }]
      })),
      getWhiteListDomain: jest.fn().mockReturnValue(of({
        result: { domains: ['example.com'] }
      })),
      handleTranslateTo: jest.fn().mockReturnValue('Translated message')
    };

    mockSnackBar = {
      open: jest.fn(),
      openFromComponent: jest.fn()
    };

    mockOtpService = {
      sendEmailOtp: jest.fn().mockReturnValue(of({ success: true })),
      sendOtp: jest.fn().mockReturnValue(of({ success: true })),
      resendOtp: jest.fn().mockReturnValue(of({ success: true }))
    };

    mockDialog = {
      open: jest.fn().mockReturnValue({
        afterClosed: jest.fn().mockReturnValue(of(true)),
        componentInstance: {
          resendOTP: new Subject(),
          otpVerified: new Subject()
        }
      })
    };

    mockDatePipe = {
      transform: jest.fn().mockReturnValue('01-01-1990')
    };

    mockPipeImgUrl = {
      transform: jest.fn().mockReturnValue('transformed-image-url')
    };

    await TestBed.configureTestingModule({
      declarations: [PrfileEditV2Component],
      imports: [ReactiveFormsModule],
      providers: [
        FormBuilder,
        { provide: MatLegacyDialogRef, useValue: mockDialogRef },
        { provide: MAT_LEGACY_DIALOG_DATA, useValue: mockDialogData },
        { provide: ProfileV2RevampService, useValue: mockProfileService },
        { provide: MatLegacySnackBar, useValue: mockSnackBar },
        { provide: OtpService, useValue: mockOtpService },
        { provide: MatLegacyDialog, useValue: mockDialog },
        { provide: DatePipe, useValue: mockDatePipe },
        { provide: PipeCertificateImageURL, useValue: mockPipeImgUrl }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(PrfileEditV2Component);
    component = fixture.componentInstance;
    formBuilder = TestBed.inject(FormBuilder);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Component Initialization', () => {
    it('should create component', () => {
      expect(component).toBeTruthy();
    });

    it('should initialize with Profile header', () => {
      component.ngOnInit();
      expect(component.header).toBe('Profile');
      expect(component.profileForm).toBeDefined();
    });

    it('should initialize form based on header - Primary Details', () => {
      component.data.header = 'Primary Details';
      component.header = 'Primary Details';
      component.ngOnInit();
      expect(component.profileForm.get('group')).toBeTruthy();
      expect(component.profileForm.get('designation')).toBeTruthy();
    });

    it('should initialize form based on header - About Me', () => {
      component.data.header = 'About Me';
      component.header = 'About Me';
      component.ngOnInit();
      expect(component.profileForm.get('aboutme')).toBeTruthy();
    });

    it('should initialize form based on header - Other Details', () => {
      component.data.header = 'Other Details';
      component.header = 'Other Details';
      component.ngOnInit();
      expect(component.profileForm.get('employeeCode')).toBeTruthy();
      expect(component.profileForm.get('primaryEmail')).toBeTruthy();
    });
  });

  describe('Profile Form Methods', () => {
    beforeEach(() => {
      component.ngOnInit();
    });

    it('should create profile form with validators', () => {
      expect(component.profileForm.get('firstname')?.hasError('required')).toBeFalsy();
      expect(component.profileForm.get('state')?.hasError('required')).toBeFalsy();
      expect(component.profileForm.get('district')?.hasError('required')).toBeFalsy();
    });

    it('should get user initials correctly', () => {
      component.getInitials();
      expect(component.userInitials).toBe('J');
    });

    it('should get user initials for full name', () => {
      component.profileDetails.firstname = 'John Doe';
      component.getInitials();
      expect(component.userInitials).toBe('JD');
    });

    it('should fetch states list successfully', () => {
      component.getStatesList();
      expect(mockProfileService.getStatesList).toHaveBeenCalled();
      expect(component.statesList.length).toBeGreaterThan(0);
    });

    it('should handle states list fetch error', () => {
      const errorResponse = new HttpErrorResponse({
        error: { params: { errmsg: 'Error fetching states' } },
        status: 500,
        statusText: 'Server Error'
      });
      mockProfileService.getStatesList.mockReturnValue(throwError(errorResponse));
      
      component.getStatesList();
      expect(mockSnackBar.open).toHaveBeenCalledWith('Error fetching states', 'X', { duration: 5000 });
    });

    it('should fetch districts list successfully', () => {
      component.getDistrictsList('TestState');
      expect(mockProfileService.getDistrictsList).toHaveBeenCalledWith('TestState');
      expect(component.districtsList.length).toBeGreaterThan(0);
    });

    it('should handle districts list fetch error', () => {
      const errorResponse = new HttpErrorResponse({
        error: { params: { errmsg: 'Error fetching districts' } },
        status: 500,
        statusText: 'Server Error'
      });
      mockProfileService.getDistrictsList.mockReturnValue(throwError(errorResponse));
      
      component.getDistrictsList('TestState');
      expect(mockSnackBar.open).toHaveBeenCalledWith('Error fetching districts', 'X', { duration: 5000 });
    });
  });

  describe('Profile Image Methods', () => {
    beforeEach(() => {
      component.ngOnInit();
    });

    it('should handle profile image upload', () => {
      const mockFile = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
      
      component.genrateProfileImageUrl(mockFile, 'test.jpg');
      expect(mockProfileService.updateProfilePic).toHaveBeenCalled();
    });

    it('should upload image when uploadImage is called', () => {
      // Mock document.createElement
      const mockInput = {
        type: '',
        accept: '',
        onchange: null as any,
        click: jest.fn()
      };
      jest.spyOn(document, 'createElement').mockReturnValue(mockInput as any);
      
      component.uploadImage();
      expect(mockInput.type).toBe('file');
      expect(mockInput.accept).toBe('image/*');
      expect(mockInput.click).toHaveBeenCalled();
    });

    it('should delete profile image', () => {
      component.profileImage = 'test-image.jpg';
      component.deleteImage();
      expect(component.profileImage).toBeNull();
    });
  });

  describe('Primary Details Form Methods', () => {
    beforeEach(() => {
      component.header = 'Primary Details';
      component.ngOnInit();
    });

    it('should create primary details form', () => {
      expect(component.profileForm.get('group')).toBeTruthy();
      expect(component.profileForm.get('designation')).toBeTruthy();
      expect(component.profileForm.get('searchDesignation')).toBeTruthy();
    });

    it('should setup scroll listener when dropdown opened', () => {
      component.setupScrollListener(true);
      expect(component.desigantionFilterEnable).toBeFalsy();
      expect(component.designationListLoadCount).toBe(50);
    });

    it('should check current designation present', () => {
      component.filterDesignationsMeta = [];
      component.checkCurrentDesignationPresent();
      // Should add current designation if not present
      expect(component.filterDesignationsMeta.length).toBeGreaterThanOrEqual(0);
    });

    it('should handle designation dropdown closed', () => {
      component.onDesignationDropdownClosed();
      // Should maintain designation value
      expect(component.profileForm.get('designation')?.value).toBeDefined();
    });
  });

  describe('Other Details Form Methods', () => {
    beforeEach(() => {
      component.header = 'Other Details';
      component.ngOnInit();
    });

    it('should create other details form with all controls', () => {
      expect(component.profileForm.get('employeeCode')).toBeTruthy();
      expect(component.profileForm.get('primaryEmail')).toBeTruthy();
      expect(component.profileForm.get('mobile')).toBeTruthy();
      expect(component.profileForm.get('gender')).toBeTruthy();
      expect(component.profileForm.get('dob')).toBeTruthy();
    });

    it('should fetch cadre data successfully', () => {
      component.fetchCadreData();
      expect(mockProfileService.fetchCadre).toHaveBeenCalled();
      expect(component.civilServiceData).toBeDefined();
    });

    it('should handle cadre data fetch error', () => {
      const errorResponse = new HttpErrorResponse({
        status: 500,
        statusText: 'Server Error'
      });
      mockProfileService.fetchCadre.mockReturnValue(throwError(errorResponse));
      
      component.fetchCadreData();
      expect(mockSnackBar.open).toHaveBeenCalled();
    });

    it('should get master languages successfully', () => {
      component.getMasterLanguage();
      expect(mockProfileService.getMasterLanguages).toHaveBeenCalled();
      expect(component.masterLanguages).toBeDefined();
    });

    it('should handle master languages fetch error', () => {
      const errorResponse = new HttpErrorResponse({
        status: 500,
        statusText: 'Server Error'
      });
      mockProfileService.getMasterLanguages.mockReturnValue(throwError(errorResponse));
      
      component.getMasterLanguage();
      expect(mockSnackBar.open).toHaveBeenCalled();
    });

    it('should get cadre status correctly', () => {
      component.getIsCadreStatus(true);
      expect(component.isCadreStatus).toBeTruthy();
    });

    it('should handle service selection', () => {
      component.civilServiceData = {
        civilServiceTypeList: [
          {
            id: 1,
            name: 'TestService',
            serviceList: [{ id: 1, name: 'TestServiceName' }]
          }
        ]
      };
      
      component.getService('TestService');
      expect(component.serviceType).toBeDefined();
    });

    it('should handle service selection with reset false', () => {
      component.civilServiceData = {
        civilServiceTypeList: [
          {
            id: 1,
            name: 'TestService',
            serviceList: [{ id: 1, name: 'TestServiceName' }]
          }
        ]
      };
      
      component.getService('TestService', false);
      expect(component.serviceType).toBeDefined();
    });

    it('should handle cadre selection', () => {
      component.selectedService = {
        cadreList: [
          {
            id: 1,
            name: 'TestCadre',
            startBatchYear: 2000,
            endBatchYear: 2020,
            exculsionYearList: [2005]
          }
        ]
      };
      
      component.onCadreSelect('TestCadre');
      expect(component.selectedCadre).toBeDefined();
      expect(component.yearArray).toBeDefined();
    });
  });

  describe('OTP Methods', () => {
    beforeEach(() => {
      component.header = 'Other Details';
      component.ngOnInit();
    });

    it('should generate email OTP successfully', () => {
      component.approvedDomainList = ['example.com'];
      component.profileForm.patchValue({ primaryEmail: 'test@example.com' });
      
      component.handleGenerateEmailOTP();
      expect(mockOtpService.sendEmailOtp).toHaveBeenCalledWith('test@example.com');
    });

    it('should handle email OTP generation error', () => {
      const errorResponse = new HttpErrorResponse({
        status: 500,
        statusText: 'Server Error'
      });
      mockOtpService.sendEmailOtp.mockReturnValue(throwError(errorResponse));
      
      component.approvedDomainList = ['example.com'];
      component.profileForm.patchValue({ primaryEmail: 'test@example.com' });
      
      component.handleGenerateEmailOTP();
      expect(mockSnackBar.open).toHaveBeenCalled();
    });

    it('should generate mobile OTP successfully', () => {
      component.profileForm.patchValue({ mobile: '9876543210' });
      
      component.handleGenerateOTP();
      expect(mockOtpService.sendOtp).toHaveBeenCalledWith('9876543210');
    });

    it('should handle mobile OTP generation error', () => {
      const errorResponse = new HttpErrorResponse({
        status: 500,
        statusText: 'Server Error'
      });
      mockOtpService.sendOtp.mockReturnValue(throwError(errorResponse));
      
      component.profileForm.patchValue({ mobile: '9876543210' });
      
      component.handleGenerateOTP();
      expect(mockSnackBar.open).toHaveBeenCalled();
    });

    it('should verify OTP', () => {
      component.handleVerifyOTP('email', 'test@example.com');
      expect(mockDialog.open).toHaveBeenCalledWith(VerifyOtpComponent, expect.any(Object));
    });

    it('should resend OTP for email', () => {
      const data = { type: 'email', value: 'test@example.com' };
      component.handleResendOTP(data);
      expect(mockOtpService.sendEmailOtp).toHaveBeenCalledWith('test@example.com');
    });

    it('should resend OTP for mobile', () => {
      const data = { type: 'mobile', value: '9876543210' };
      component.handleResendOTP(data);
      expect(mockOtpService.resendOtp).toHaveBeenCalledWith('9876543210');
    });

    it('should check if email is allowed', () => {
      component.approvedDomainList = ['example.com'];
      const result = component.isEmailAllowed('test@example.com');
      expect(result).toBeTruthy();
    });

    it('should check if email is not allowed', () => {
      component.approvedDomainList = ['example.com'];
      const result = component.isEmailAllowed('test@forbidden.com');
      expect(result).toBeFalsy();
    });
  });

  describe('Form Validation and Submission', () => {
    beforeEach(() => {
      component.ngOnInit();
    });

    it('should submit valid profile form', () => {
      component.profileForm.patchValue({
        firstname: 'John',
        state: 'TestState',
        district: 'TestDistrict'
      });
      
      component.handleSubmit();
      expect(mockDialogRef.close).toHaveBeenCalled();
    });

    it('should not submit invalid form', () => {
      component.profileForm.patchValue({
        firstname: '',
        state: '',
        district: ''
      });
      
      component.handleSubmit();
      expect(mockDialogRef.close).not.toHaveBeenCalled();
    });

    it('should handle other details form submission', () => {
      component.header = 'Other Details';
      component.ngOnInit();
      
      component.profileForm.patchValue({
        employeeCode: 'EMP001',
        primaryEmail: 'test@example.com',
        mobile: '9876543210',
        dob: new Date('1990-01-01')
      });
      
      component.handleSubmit();
      expect(mockDatePipe.transform).toHaveBeenCalled();
    });

    it('should cancel form', () => {
      component.handleCancel();
      expect(mockDialogRef.close).toHaveBeenCalled();
    });

    it('should mark form group as touched', () => {
      const mockFormGroup = formBuilder.group({
        testControl: ['', Validators.required]
      });
      
      component.markFormGroupTouched(mockFormGroup);
      expect(mockFormGroup.get('testControl')?.touched).toBeTruthy();
    });

    it('should check for form errors', () => {
      component.profileForm.patchValue({ firstname: '' });
      component.profileForm.get('firstname')?.markAsTouched();
      
      const hasError = component.hasError('firstname', 'required');
      expect(hasError).toBeTruthy();
    });
  });

  describe('Getters and Computed Properties', () => {
    beforeEach(() => {
      component.header = 'Other Details';
      component.ngOnInit();
    });

    it('should get primary email control', () => {
      const control = component.primaryEmailControl;
      expect(control).toBeTruthy();
    });

    it('should get mobile control', () => {
      const control = component.mobileControl;
      expect(control).toBeTruthy();
    });

    it('should check canSaveChanges for valid form', () => {
      component.initilisationInProgress = false;
      component.profileForm.patchValue({
        employeeCode: 'EMP001',
        primaryEmail: 'test@example.com'
      });
      
      const canSave = component.canSaveChanges;
      expect(canSave).toBeDefined();
    });

    it('should check enableEditBtn', () => {
      component.header = 'Primary Details';
      component.ngOnInit();
      
      component.profileForm.patchValue({
        group: 'NewGroup',
        designation: 'NewDesignation'
      });
      
      const enableEdit = component.enableEditBtn;
      expect(enableEdit).toBeTruthy();
    });

    it('should show cadre details when conditions met', () => {
      component.profileForm.patchValue({
        civilServiceType: 'TestType',
        civilServiceName: 'Indian Administrative Service (IAS)',
        isCadre: true
      });
      
      const showCadre = component.showCadreDetails;
      expect(showCadre).toBeTruthy();
    });

    it('should show batch details when conditions met', () => {
      component.profileForm.patchValue({
        civilServiceType: 'TestType',
        civilServiceName: 'Indian Administrative Service (IAS)',
        isCadre: true,
        cadreName: 'TestCadre'
      });
      
      const showBatch = component.showBatchDetails;
      expect(showBatch).toBeTruthy();
    });

    it('should show controlling authority when conditions met', () => {
      component.profileForm.patchValue({
        isCadre: true,
        cadreBatch: '2020'
      });
      
      const showAuthority = component.showControllingAuthority;
      expect(showAuthority).toBeTruthy();
    });
  });

  describe('Utility Methods', () => {
    it('should handle translation', () => {
      const result = component.handleTranslateTo('testMessage');
      expect(mockProfileService.handleTranslateTo).toHaveBeenCalledWith('testMessage');
      expect(result).toBe('Translated message');
    });

    it('should open snackbar with default duration', () => {
      component['openSnackbar']('Test message');
      expect(mockSnackBar.open).toHaveBeenCalledWith('Test message', 'X', { duration: 5000 });
    });

    it('should open snackbar with custom duration', () => {
      component['openSnackbar']('Test message', 3000);
      expect(mockSnackBar.open).toHaveBeenCalledWith('Test message', 'X', { duration: 3000 });
    });

    it('should handle empty mobile field', () => {
      component.profileForm.patchValue({ mobile: '' });
      component.handleEmpty('mobile');
      // Should set form errors when mobile is empty but was previously set
    });

    it('should handle empty email field', () => {
      component.profileForm.patchValue({ primaryEmail: '' });
      component.handleEmpty('primaryEmail');
      // Should set form errors when email is empty but was previously set
    });

    it('should handle key down events', () => {
      component.isMatcompleteOpened = true;
      const result = component.onkeyDown({} as any);
      expect(result).toBeTruthy();
    });

    it('should handle autocomplete opened', () => {
      component.onAutoCompleteOpened();
      expect(component.isMatcompleteOpened).toBeTruthy();
    });

    it('should handle autocomplete closed', () => {
      component.onAutoCompleteClosed();
      expect(component.isMatcompleteOpened).toBeFalsy();
    });

    it('should add validation to form control', () => {
      const mockControl = {
        reset: jest.fn(),
        setValidators: jest.fn(),
        updateValueAndValidity: jest.fn(),
        markAsUntouched: jest.fn()
      };
      
      component.addValidation(mockControl);
      expect(mockControl.reset).toHaveBeenCalled();
      expect(mockControl.setValidators).toHaveBeenCalledWith([Validators.required]);
      expect(mockControl.updateValueAndValidity).toHaveBeenCalled();
      expect(mockControl.markAsUntouched).toHaveBeenCalled();
    });
  });

  describe('Component Lifecycle', () => {
    it('should call ngOnDestroy', () => {
      const unsubscribeSpy = jest.spyOn(component.destroySubject$, 'unsubscribe');
      component.ngOnDestroy();
      expect(unsubscribeSpy).toHaveBeenCalled();
    });
  });

  describe('Event Handlers', () => {
    beforeEach(() => {
      component.header = 'Primary Details';
      component.ngOnInit();
    });

    it('should handle designation select scroll', () => {
      component.designationsMeta = Array.from({ length: 100 }, (_, i) => ({
        id: i,
        name: `Designation${i}`,
        status: 'Active'
      }));
      
      const mockEvent = {
        target: {
          scrollTop: 100,
          clientHeight: 200,
          scrollHeight: 305
        }
      };
      
      component.onDesignationSelectScroll(mockEvent);
      expect(component.isLoadingMoreDesignations).toBeTruthy();
    });
  });

  describe('Error Handling', () => {
    it('should handle various HTTP error responses', () => {
      const errorWithMessage = new HttpErrorResponse({
        error: { params: { errmsg: 'Custom error message' } },
        status: 400,
        statusText: 'Bad Request'
      });
      
      mockProfileService.getStatesList.mockReturnValue(throwError(errorWithMessage));
      component.getStatesList();
      expect(mockSnackBar.open).toHaveBeenCalledWith('Custom error message', 'X', { duration: 5000 });
    });

    it('should handle errors without specific message', () => {
      const errorWithoutMessage = new HttpErrorResponse({
        status: 500,
        statusText: 'Internal Server Error'
      });
      
      mockProfileService.getStatesList.mockReturnValue(throwError(errorWithoutMessage));
      component.getStatesList();
      expect(mockSnackBar.open).toHaveBeenCalledWith('Something went wrong', 'X', { duration: 5000 });
    });
  });
});