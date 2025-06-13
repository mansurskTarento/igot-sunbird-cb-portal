import { ProfilePrimaryDetailsComponent } from './profile-primary-details.component';
import { of, throwError } from 'rxjs';
import { HttpErrorResponse } from '@angular/common/http';

describe('ProfilePrimaryDetailsComponent', () => {
  let component: ProfilePrimaryDetailsComponent;
  let mockProfileV2RevampSvc: any;
  let mockMatSnackBar: any;
  let mockConfigService: any;
  let mockDialog: any;
  let mockDialogRef: any;

  beforeEach(() => {
    // Mock services
    mockProfileV2RevampSvc = {
      fetchApprovalDetails: jest.fn(),
      withDrawRequest: jest.fn(),
      handleTranslateTo: jest.fn().mockReturnValue('translated-text')
    };

    mockMatSnackBar = {
      open: jest.fn()
    };

    mockConfigService = {
      unMappedUser: {
        id: 'test-user-id',
        profileDetails: {
          profileStatus: 'active',
          employmentDetails: {
            departmentName: 'test-department'
          }
        }
      }
    };

    mockDialogRef = {
      afterClosed: jest.fn().mockReturnValue(of(true))
    };

    mockDialog = {
      open: jest.fn().mockReturnValue(mockDialogRef)
    };

    // Create component instance
    component = new ProfilePrimaryDetailsComponent(
      mockProfileV2RevampSvc,
      mockMatSnackBar,
      mockConfigService,
      mockDialog
    );

    // Initialize component properties
    component.primaryDetails = {
      group: 'Test Group',
      designation: 'Test Designation',
      profileGroupStatus: 'VERIFIED',
      profileDesignationStatus: 'VERIFIED',
      employeeCode: 'EMP001',
      primaryEmail: 'test@example.com',
      mobile: '9876543210',
      gender: 'Male',
      dob: '1990-01-01',
      domicileMedium: 'English',
      category: 'General',
      pinCode: '123456',
      externalSystemId: 'EXT001',
      externalSystemDor: '2060-01-01',
      isCadre: true,
      civilServiceType: 'IAS',
      civilServiceName: 'Indian Administrative Service',
      cadreName: 'Test Cadre',
      cadreBatch: '2020',
      cadreControllingAuthorityName: 'Test Authority'
    };

    component.isCurrentUser = true;
    component.enableWTR = false;
    component.enableWR = false;
    component.unVerifiedObj = {
      designation: 'Pending Designation',
      group: 'Pending Group',
      organization: 'Test Org',
      groupRequestTime: 1640995200000,
      designationRequestTime: 1640995200000
    };
    component.rejectedFields = {
      name: 'Rejected Name',
      group: 'Rejected Group',
      designation: 'Rejected Designation',
      groupRejectionComments: 'Group rejection reason',
      designationRejectionComments: 'Designation rejection reason',
      groupRejectionTime: 1640995200000,
      designationRejectionTime: 1640995200000
    };
    component.approvalPendingFields = [
      { wfId: 'wf-001' },
      { wfId: 'wf-002' }
    ];
  });

  describe('Component Initialization', () => {
    it('should create component', () => {
      expect(component).toBeTruthy();
    });

    it('should initialize properties correctly', () => {
      expect(component.groupApprovedTime).toBe(0);
      expect(component.designationApprovedTime).toBe(0);
      expect(component.panelOpenState).toBe(false);
      expect(component.isIgotOrg).toBe(false);
      expect(component.isNotMyUser).toBe(false);
    });

    it('should call getApprovedFields and set user flags on ngOnInit', () => {
      const getApprovedFieldsSpy = jest.spyOn(component, 'getApprovedFields');
      mockProfileV2RevampSvc.fetchApprovalDetails.mockReturnValue(of({
        result: { data: [] }
      }));

      component.ngOnInit();

      expect(getApprovedFieldsSpy).toHaveBeenCalled();
      expect(component.isNotMyUser).toBe(false);
      expect(component.isIgotOrg).toBe(false);
    });

    // it('should set isNotMyUser to true when profile status is not-my-user', () => {
    //   mockConfigService.unMappedUser.profileDetails.profileStatus = 'not-my-user';
      
    //   component.ngOnInit();
      
    //   expect(component.isNotMyUser).toBe(true);
    // });

    // it('should set isIgotOrg to true when department is igot', () => {
    //   mockConfigService.unMappedUser.profileDetails.employmentDetails.departmentName = 'igot';
      
    //   component.ngOnInit();
      
    //   expect(component.isIgotOrg).toBe(true);
    // });
  });

  describe('getApprovedFields', () => {
    it('should fetch approval details successfully', () => {
      const mockResponse = {
        result: {
          data: [
            { group: 'Test Group', lastUpdatedOn: 1640995200000 },
            { designation: 'Test Designation', lastUpdatedOn: 1640995300000 }
          ]
        }
      };
      mockProfileV2RevampSvc.fetchApprovalDetails.mockReturnValue(of(mockResponse));

      component.getApprovedFields();

      expect(mockProfileV2RevampSvc.fetchApprovalDetails).toHaveBeenCalledWith({
        serviceName: 'profile',
        applicationStatus: 'APPROVED'
      });
      expect(component.groupApprovedTime).toBe(1640995200000);
      expect(component.designationApprovedTime).toBe(1640995300000);
    });

    it('should handle error when fetching approval details', () => {
      const errorResponse = new HttpErrorResponse({
        error: 'Server Error',
        status: 500,
        statusText: 'Internal Server Error'
      });
      mockProfileV2RevampSvc.fetchApprovalDetails.mockReturnValue(throwError(errorResponse));
      const openSnackbarSpy = jest.spyOn(component as any, 'openSnackbar');

      component.getApprovedFields();

      expect(openSnackbarSpy).toHaveBeenCalledWith('translated-text');
    });

    it('should update groupApprovedTime when group object has higher lastUpdatedOn', () => {
      const mockResponse = {
        result: {
          data: [
            { group: 'Group 1', lastUpdatedOn: 1640995100000 },
            { group: 'Group 2', lastUpdatedOn: 1640995200000 }
          ]
        }
      };
      mockProfileV2RevampSvc.fetchApprovalDetails.mockReturnValue(of(mockResponse));

      component.getApprovedFields();

      expect(component.groupApprovedTime).toBe(1640995200000);
    });
  });

  describe('editPrimaryDetails', () => {
    it('should emit openProfileEditDialog with header', () => {
      const emitSpy = jest.spyOn(component.openProfileEditDialog, 'emit');
      const header = 'Test Header';

      component.editPrimaryDetails(header);

      expect(emitSpy).toHaveBeenCalledWith(header);
    });
  });

  describe('Computed Properties', () => {
    describe('showPrimaryDetailsEdit', () => {
      it('should return true when conditions are met', () => {
        component.enableWTR = false;
        component.enableWR = false;
        component.isCurrentUser = true;
        component.isNotMyUser = false;
        component.isIgotOrg = false;

        expect(component.showPrimaryDetailsEdit).toBe(true);
      });

      it('should return false when enableWTR is true', () => {
        component.enableWTR = true;
        component.enableWR = false;
        component.isCurrentUser = true;
        component.isNotMyUser = false;
        component.isIgotOrg = false;

        expect(component.showPrimaryDetailsEdit).toBe(false);
      });

      it('should return false when isNotMyUser is true', () => {
        component.enableWTR = false;
        component.enableWR = false;
        component.isCurrentUser = true;
        component.isNotMyUser = true;
        component.isIgotOrg = false;

        expect(component.showPrimaryDetailsEdit).toBe(false);
      });
    });

    describe('disablePrimaryDetailsEdit', () => {
      it('should return true when enableWTR is true and conditions are met', () => {
        component.enableWTR = true;
        component.isNotMyUser = false;
        component.isIgotOrg = false;

        expect(component.disablePrimaryDetailsEdit).toBe(true);
      });

      it('should return false when enableWTR is false', () => {
        component.enableWTR = false;

        expect(component.disablePrimaryDetailsEdit).toBe(false);
      });

      it('should return false when both isNotMyUser and isIgotOrg are true', () => {
        component.enableWTR = true;
        component.isNotMyUser = true;
        component.isIgotOrg = true;

        expect(component.disablePrimaryDetailsEdit).toBe(false);
      });
    });

    describe('showWithdrawRequestBtn', () => {
      it('should return true when conditions are met', () => {
        component.enableWR = true;
        component.isCurrentUser = true;
        component.isNotMyUser = false;
        component.isIgotOrg = false;

        expect(component.showWithdrawRequestBtn).toBe(true);
      });

      it('should return false when enableWR is false', () => {
        component.enableWR = false;
        component.isCurrentUser = true;
        component.isNotMyUser = false;
        component.isIgotOrg = false;

        expect(component.showWithdrawRequestBtn).toBe(false);
      });

      it('should return false when both isNotMyUser and isIgotOrg are true', () => {
        component.enableWR = true;
        component.isCurrentUser = true;
        component.isNotMyUser = true;
        component.isIgotOrg = true;

        expect(component.showWithdrawRequestBtn).toBe(false);
      });
    });

    describe('showApprovalStatus', () => {
      it('should return true when group approval time is less than rejection time', () => {
        component.groupApprovedTime = 1640995100000;
        component.rejectedFields.groupRejectionTime = 1640995200000;
        component.isCurrentUser = true;

        expect(component.showApprovalStatus).toBe(true);
      });

      it('should return true when designation approval time is less than request time', () => {
        component.designationApprovedTime = 1640995100000;
        component.unVerifiedObj.designationRequestTime = 1640995200000;
        component.isCurrentUser = true;

        expect(component.showApprovalStatus).toBe(true);
      });

      it('should return false when isCurrentUser is false', () => {
        component.groupApprovedTime = 1640995100000;
        component.rejectedFields.groupRejectionTime = 1640995200000;
        component.isCurrentUser = false;

        expect(component.showApprovalStatus).toBe(false);
      });
    });

    describe('showGroupPending', () => {
      it('should return true when group is pending', () => {
        component.groupApprovedTime = 1640995000000;
        component.unVerifiedObj.groupRequestTime = 1640995200000;
        component.rejectedFields.groupRejectionTime = 1640995100000;
        component.unVerifiedObj.group = 'Pending Group';
        component.rejectedFields.designationRejectionTime = 1640995000000;
        component.unVerifiedObj.designationRequestTime = 1640995000000;

        expect(component.showGroupPending).toBe(true);
      });

      it('should return false when group is not set', () => {
        component.groupApprovedTime = 1640995000000;
        component.unVerifiedObj.groupRequestTime = 1640995200000;
        component.rejectedFields.groupRejectionTime = 1640995100000;
        component.unVerifiedObj.group = '';

        expect(component.showGroupPending).toBe(false);
      });
    });

    describe('showGroupRejection', () => {
      it('should return true when group is rejected', () => {
        component.groupApprovedTime = 1640995000000;
        component.rejectedFields.groupRejectionTime = 1640995200000;
        component.unVerifiedObj.groupRequestTime = 1640995100000;
        component.rejectedFields.group = 'Rejected Group';
        component.rejectedFields.designationRejectionTime = 1640995000000;
        component.unVerifiedObj.designationRequestTime = 1640995000000;

        expect(component.showGroupRejection).toBe(true);
      });

      it('should return false when group rejection field is not set', () => {
        component.groupApprovedTime = 1640995000000;
        component.rejectedFields.groupRejectionTime = 1640995200000;
        component.unVerifiedObj.groupRequestTime = 1640995100000;
        component.rejectedFields.group = '';

        expect(component.showGroupRejection).toBe(false);
      });
    });

    describe('showDesignationPending', () => {
      it('should return true when designation is pending', () => {
        component.designationApprovedTime = 1640995000000;
        component.unVerifiedObj.designationRequestTime = 1640995200000;
        component.rejectedFields.designationRejectionTime = 1640995100000;
        component.unVerifiedObj.designation = 'Pending Designation';
        component.rejectedFields.groupRejectionTime = 1640995000000;
        component.unVerifiedObj.groupRequestTime = 1640995000000;

        expect(component.showDesignationPending).toBe(true);
      });

      it('should return false when designation is not set', () => {
        component.designationApprovedTime = 1640995000000;
        component.unVerifiedObj.designationRequestTime = 1640995200000;
        component.rejectedFields.designationRejectionTime = 1640995100000;
        component.unVerifiedObj.designation = '';

        expect(component.showDesignationPending).toBe(false);
      });
    });

    describe('showDesignationRejection', () => {
      it('should return true when designation is rejected', () => {
        component.designationApprovedTime = 1640995000000;
        component.rejectedFields.designationRejectionTime = 1640995200000;
        component.unVerifiedObj.designationRequestTime = 1640995100000;
        component.rejectedFields.designation = 'Rejected Designation';
        component.rejectedFields.groupRejectionTime = 1640995000000;
        component.unVerifiedObj.groupRequestTime = 1640995000000;

        expect(component.showDesignationRejection).toBe(true);
      });

      it('should return false when designation rejection field is not set', () => {
        component.designationApprovedTime = 1640995000000;
        component.rejectedFields.designationRejectionTime = 1640995200000;
        component.unVerifiedObj.designationRequestTime = 1640995100000;
        component.rejectedFields.designation = '';

        expect(component.showDesignationRejection).toBe(false);
      });
    });
  });

  describe('viewReason', () => {
    it('should open rejection reason popup dialog', () => {
      const comments = 'Test rejection reason';

      component.viewReason(comments);

      expect(mockDialog.open).toHaveBeenCalledWith(
        expect.anything(),
        {
          data: {
            comments: 'Test rejection reason',
            buttonText: 'OK'
          },
          disableClose: true,
          width: '500px',
          maxWidth: '90vw'
        }
      );
    });
  });

  describe('showWithdrawRequestPopup', () => {
    it('should open withdraw request dialog and handle response', () => {
      const handleWithdrawRequestSpy = jest.spyOn(component, 'handleWithdrawRequest');

      component.showWithdrawRequestPopup();

      expect(mockDialog.open).toHaveBeenCalledWith(
        expect.anything(),
        {
          data: {
            withDrawType: 'primaryDetails'
          },
          disableClose: true,
          panelClass: 'common-modal'
        }
      );
      expect(mockDialogRef.afterClosed).toHaveBeenCalled();
      expect(handleWithdrawRequestSpy).toHaveBeenCalled();
    });

    it('should not call handleWithdrawRequest when dialog returns false', () => {
      mockDialogRef.afterClosed.mockReturnValue(of(false));
      const handleWithdrawRequestSpy = jest.spyOn(component, 'handleWithdrawRequest');

      component.showWithdrawRequestPopup();

      expect(handleWithdrawRequestSpy).not.toHaveBeenCalled();
    });
  });

  describe('handleWithdrawRequest', () => {
    it('should process withdraw request successfully', () => {
      const mockResponse = { success: true };
      mockProfileV2RevampSvc.withDrawRequest.mockReturnValue(of(mockResponse));
      const getApprovalStatusSpy = jest.spyOn(component.getApprovalStatus, 'emit');
      const openSnackbarSpy = jest.spyOn(component as any, 'openSnackbar');

      component.handleWithdrawRequest();

      expect(mockProfileV2RevampSvc.withDrawRequest).toHaveBeenCalledTimes(2);
      expect(getApprovalStatusSpy).toHaveBeenCalledWith('withdraw');
      expect(component.unVerifiedObj.group).toBe('');
      expect(component.unVerifiedObj.designation).toBe('');
      expect(openSnackbarSpy).toHaveBeenCalledWith('translated-text');
      expect(component.enableWR).toBe(false);
    });

    it('should handle withdraw request error', () => {
      const errorResponse = new HttpErrorResponse({
        error: 'Server Error',
        status: 500,
        statusText: 'Internal Server Error'
      });
      mockProfileV2RevampSvc.withDrawRequest.mockReturnValue(throwError(errorResponse));
      const openSnackbarSpy = jest.spyOn(component as any, 'openSnackbar');

      component.handleWithdrawRequest();

      expect(openSnackbarSpy).toHaveBeenCalledWith('translated-text');
    });

    it('should create correct payload for withdraw request', () => {
      const mockResponse = { success: true };
      mockProfileV2RevampSvc.withDrawRequest.mockReturnValue(of(mockResponse));

      component.handleWithdrawRequest();

      expect(mockProfileV2RevampSvc.withDrawRequest).toHaveBeenCalledWith({
        action: 'WITHDRAW',
        state: 'SEND_FOR_APPROVAL',
        userId: 'test-user-id',
        applicationId: 'test-user-id',
        actorUserId: 'test-user-id',
        wfId: 'wf-001',
        serviceName: 'profile',
        updateFieldValues: [],
        comment: ''
      });
    });
  });

  describe('handleTranslateTo', () => {
    it('should call profileV2RevampSvc handleTranslateTo method', () => {
      const menuName = 'testMenu';

      const result = component.handleTranslateTo(menuName);

      expect(mockProfileV2RevampSvc.handleTranslateTo).toHaveBeenCalledWith(menuName);
      expect(result).toBe('translated-text');
    });
  });

  describe('openSnackbar', () => {
    it('should open snackbar with default duration', () => {
      const message = 'Test message';

      (component as any).openSnackbar(message);

      expect(mockMatSnackBar.open).toHaveBeenCalledWith(message, 'X', {
        duration: 5000
      });
    });

    it('should open snackbar with custom duration', () => {
      const message = 'Test message';
      const duration = 3000;

      (component as any).openSnackbar(message, duration);

      expect(mockMatSnackBar.open).toHaveBeenCalledWith(message, 'X', {
        duration: 3000
      });
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty approval data', () => {
      const mockResponse = {
        result: { data: [] }
      };
      mockProfileV2RevampSvc.fetchApprovalDetails.mockReturnValue(of(mockResponse));

      component.getApprovedFields();

      expect(component.groupApprovedTime).toBe(0);
      expect(component.designationApprovedTime).toBe(0);
    });

    it('should handle approval data without required properties', () => {
      const mockResponse = {
        result: {
          data: [
            { someOtherProperty: 'value', lastUpdatedOn: 1640995200000 }
          ]
        }
      };
      mockProfileV2RevampSvc.fetchApprovalDetails.mockReturnValue(of(mockResponse));

      component.getApprovedFields();

      expect(component.groupApprovedTime).toBe(0);
      expect(component.designationApprovedTime).toBe(0);
    });

    it('should handle empty approvalPendingFields array', () => {
      component.approvalPendingFields = [];
      const mockResponse = { success: true };
      mockProfileV2RevampSvc.withDrawRequest.mockReturnValue(of(mockResponse));

      component.handleWithdrawRequest();

      expect(mockProfileV2RevampSvc.withDrawRequest).not.toHaveBeenCalled();
    });

    it('should handle undefined config service values', () => {
      mockConfigService.unMappedUser = undefined;

      expect(() => component.ngOnInit()).toThrow();
    });
  });
});