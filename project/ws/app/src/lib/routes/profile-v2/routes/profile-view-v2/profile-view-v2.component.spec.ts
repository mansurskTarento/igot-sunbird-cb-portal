import { of, Subject, throwError } from 'rxjs';
// The real @sunbird-cb/consumption and @sunbird-cb/utils-v2 packages (and the dialog/child
// components below) pull in modules Jest cannot resolve here (@project-sunbird/telemetry-sdk,
// jspdf canvas, a second rxjs copy). Only a few symbols are used at runtime, so stubs keep this
// spec isolated from that unrelated breakage.
jest.mock('@sunbird-cb/consumption', () => ({
  buildWeeklyClapsData: jest.fn((v: any) => v),
  ConfirmationDialogComponent: class ConfirmationDialogComponent { },
  NlwCertificateDialogComponent: class NlwCertificateDialogComponent { },
}));
jest.mock('@sunbird-cb/utils-v2', () => ({
  ConfigurationsService: class ConfigurationsService { },
  EventService: class EventService { },
  MultilingualTranslationsService: class MultilingualTranslationsService { },
  PipeCertificateImageURL: class PipeCertificateImageURL { },
  WsEvents: {
    EnumInteractTypes: { CLICK: 'click' },
    EnumInteractSubTypes: {},
    EnumTelemetrymodules: { NETWORK: 'network' },
  },
}));
jest.mock('@sunbird-cb/collection/src/lib/_services/enrollment-summary-state.service', () => ({
  EnrollmentSummaryStateService: class EnrollmentSummaryStateService { },
}));
jest.mock('src/app/services/home-page.service', () => ({
  HomePageService: class HomePageService { },
}));
jest.mock('../../../../routes/services/common-data.service', () => ({
  CommonDataService: class CommonDataService { },
}));
jest.mock('../../../../routes/services/netcore.service', () => ({
  NetCoreService: class NetCoreService { },
}));
jest.mock('../../services/profile-v2-revamp.service', () => ({
  ProfileV2RevampService: class ProfileV2RevampService { },
}));
jest.mock('../../revamp-dialogs/prfile-edit-v2/prfile-edit-v2.component', () => ({
  PrfileEditV2Component: class PrfileEditV2Component { },
}));
jest.mock('../../revamp-dialogs/profile-entry-edit/profile-entry-edit.component', () => ({
  ProfileEntryEditComponent: class ProfileEntryEditComponent { },
}));
jest.mock('../../revamp-dialogs/dynamic-entry-edit/dynamic-entry-edit.component', () => ({
  DynamicEntryEditComponent: class DynamicEntryEditComponent { },
}));
jest.mock('../../components/profile-revamp/cover-photo-edit-popup/cover-photo-edit-popup.component', () => ({
  CoverPhotoEditPopupComponent: class CoverPhotoEditPopupComponent { },
}));
jest.mock('../../components/profile-revamp/service-history/service-history.component', () => ({
  ServiceHistoryComponent: class ServiceHistoryComponent { },
}));
jest.mock('../../components/profile-revamp/educational-qualifications/educational-qualifications.component', () => ({
  EducationalQualificationsComponent: class EducationalQualificationsComponent { },
}));
jest.mock('../../components/profile-revamp/achievements/achievements.component', () => ({
  AchievementsComponent: class AchievementsComponent { },
}));
jest.mock('../../components/transfer-request/transfer-request.component', () => ({
  TransferRequestComponent: class TransferRequestComponent { },
}));
jest.mock('../../components/withdraw-request/withdraw-request.component', () => ({
  WithdrawRequestComponent: class WithdrawRequestComponent { },
}));
// the component calls inject(DestroyRef) in a field initializer, which needs an injection context
jest.mock('@angular/core', () => ({
  ...jest.requireActual('@angular/core'),
  inject: jest.fn(() => ({ onDestroy: jest.fn() })),
}));

import { ProfileViewV2Component } from './profile-view-v2.component';

// Mock all dependencies
const mockDialog = {
  open: jest.fn().mockReturnValue({
    afterClosed: jest.fn().mockReturnValue({ subscribe: jest.fn() }),
    componentInstance: { enableWithdraw: { subscribe: jest.fn() }, enableMakeTransfer: { subscribe: jest.fn() } }
  })
};

const mockActivatedRoute = {
  data: { subscribe: jest.fn() },
  fragment: { subscribe: jest.fn() },
  queryParamMap: of({ get: () => null }),
  snapshot: { queryParamMap: { get: () => null } },
  parent: { snapshot: { data: { pageData: { data: {} } } } }
};

const mockProfileV2RevampService = {
  getGroups: jest.fn().mockReturnValue({ pipe: jest.fn().mockReturnValue({ subscribe: jest.fn() }) }),
  getDesignations: jest.fn().mockReturnValue({ subscribe: jest.fn() }),
  fetchProfile: jest.fn().mockReturnValue({ subscribe: jest.fn() }),
  updateBannerPic: jest.fn().mockReturnValue({ pipe: jest.fn().mockReturnValue({ subscribe: jest.fn() }) }),
  updateProfileDetails: jest.fn().mockReturnValue({ subscribe: jest.fn() }),
  fetchApprovalDetails: jest.fn().mockReturnValue({ pipe: jest.fn().mockReturnValue({ subscribe: jest.fn() }) }),
  addEntriesToProfile: jest.fn().mockReturnValue({ subscribe: jest.fn() }),
  updateEntriesOfProfile: jest.fn().mockReturnValue({ subscribe: jest.fn() }),
  fetchProfileEntries: jest.fn().mockReturnValue({ subscribe: jest.fn() }),
  connectToNetwork: jest.fn().mockReturnValue({ subscribe: jest.fn() }),
  getConnectionStatus: jest.fn().mockReturnValue({ subscribe: jest.fn() }),
  listAchievements: jest.fn().mockReturnValue({ subscribe: jest.fn() }),
  getOrgSearch: jest.fn().mockReturnValue(of({ result: { response: { content: [] } } })),
  getInsightsData: jest.fn().mockReturnValue({ pipe: jest.fn().mockReturnValue({ subscribe: jest.fn() }) }),
  updateDegree: jest.fn().mockReturnValue({ subscribe: jest.fn() }),
  updateInstitution: jest.fn().mockReturnValue({ subscribe: jest.fn() }),
  handleTranslateTo: jest.fn().mockReturnValue('Translated Text')
};

const mockSnackBar = {
  open: jest.fn()
};

const mockPipeImgUrl = {
  transform: jest.fn().mockReturnValue('transformed-url')
};

const mockConfigSvc = {
  userProfile: { userId: 'test-user-id', departmentName: 'Test Department' },
  userRoles: new Set(['mentor'])
};

const mockBreakpointObserver = {
  observe: jest.fn().mockReturnValue({ subscribe: jest.fn() })
};

const mockTranslateService = {
  setDefaultLang: jest.fn(),
  use: jest.fn()
};

const mockDatePipe = {
  transform: jest.fn()
};

const mockEvents = {
  raiseInteractTelemetry: jest.fn()
};

const mockMultilingualTranslationsService = {
  languageSelectedObservable: { subscribe: jest.fn() }
};

const mockCommonDataService = {
  getNlw2026CertifiedStatus: jest.fn().mockReturnValue({ pipe: jest.fn().mockReturnValue({ subscribe: jest.fn() }) })
};

const mockRouter = {};

const mockNetCoreService = {};

const mockHomePageService = {
  getLearnerLeaderboardCached: jest.fn().mockReturnValue({ pipe: jest.fn().mockReturnValue({ subscribe: jest.fn() }) })
};

const mockEnrollmentSummaryState: any = {
  loading$: of(false)
};

describe('ProfileViewV2Component', () => {
  let component: ProfileViewV2Component;

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();
    
    // Mock localStorage
    Object.defineProperty(window, 'localStorage', {
      value: {
        getItem: jest.fn(),
        setItem: jest.fn(),
        clear: jest.fn()
      },
      writable: true
    });

    // Mock sessionStorage
    Object.defineProperty(window, 'sessionStorage', {
      value: {
        getItem: jest.fn(),
        setItem: jest.fn(),
        clear: jest.fn()
      },
      writable: true
    });

    // Mock document methods
    Object.defineProperty(document, 'getElementById', {
      value: jest.fn().mockReturnValue({
        scrollIntoView: jest.fn()
      }),
      writable: true
    });

    Object.defineProperty(document.documentElement.style, 'setProperty', {
      value: jest.fn(),
      writable: true
    });

    // Mock window methods
    Object.defineProperty(window, 'open', {
      value: jest.fn(),
      writable: true
    });

    Object.defineProperty(navigator, 'clipboard', {
      value: {
        writeText: jest.fn().mockResolvedValue(undefined)
      },
      writable: true
    });

    // Create component instance
    component = new ProfileViewV2Component(
      mockDialog as any,
      mockActivatedRoute as any,
      mockProfileV2RevampService as any,
      mockSnackBar as any,
      mockPipeImgUrl as any,
      mockConfigSvc as any,
      mockBreakpointObserver as any,
      mockTranslateService as any,
      mockDatePipe as any,
      mockEvents as any,
      mockMultilingualTranslationsService as any,
      mockCommonDataService as any,
      mockRouter as any,
      mockNetCoreService as any,
      mockHomePageService as any,
      mockEnrollmentSummaryState as any
    );
  });

  describe('Component Initialization', () => {
    it('should create component', () => {
      expect(component).toBeDefined();
    });

    it('should initialize with default values', () => {
      expect(component.isCurrentUser).toBe(false);
      expect(component.userId).toBe('');
      expect(component.profileCompletionPercentage).toBe(0);
      expect(component.activeRoutId).toBe('about-me');
      expect(component.connectionStatus).toBe('Connect');
      expect(component.userStats).toHaveLength(5);
      expect(component.profileRoutes).toHaveLength(5);
    });

    it('should call initialization methods on ngOnInit', () => {
      const getProfileDetailsSpy = jest.spyOn(component, 'getProfileDetailsFromRoutes').mockImplementation();
      const getAchievementsSpy = jest.spyOn(component, 'getAchievements').mockImplementation();
      const setAchievementStatsSpy = jest.spyOn(component, 'setAchievementStats').mockImplementation();
      const getSendApprovalSpy = jest.spyOn(component, 'getSendApprovalStatus').mockImplementation();
      const getRejectedSpy = jest.spyOn(component, 'getRejectedStatus').mockImplementation();
      const getGroupDataSpy = jest.spyOn(component, 'getGroupData').mockImplementation();
      const getInsightsDataSpy = jest.spyOn(component, 'getInsightsData').mockImplementation();

      component.ngOnInit();

      expect(getProfileDetailsSpy).toHaveBeenCalled();
      expect(getAchievementsSpy).toHaveBeenCalled();
      expect(setAchievementStatsSpy).toHaveBeenCalled();
      expect(getSendApprovalSpy).toHaveBeenCalled();
      expect(getRejectedSpy).toHaveBeenCalled();
      expect(getGroupDataSpy).toHaveBeenCalled();
      expect(getInsightsDataSpy).toHaveBeenCalled();
    });

    it('should set default language if websiteLanguage exists in localStorage', () => {
      (window.localStorage.getItem as jest.Mock).mockReturnValue('fr');
      
      component.ngOnInit();

      expect(mockTranslateService.setDefaultLang).toHaveBeenCalledWith('en');
      expect(mockTranslateService.use).toHaveBeenCalledWith('fr');
    });
  });

  describe('Not-my-user org flags (isNotMyUserAndIgotOrg / isNotMyUserAndNotIgotOrg)', () => {
    const setUnMappedUser = (profileStatus: string, departmentName: string) => {
      (mockConfigSvc as any).unMappedUser = {
        profileDetails: {
          profileStatus,
          employmentDetails: { departmentName }
        }
      };
      (mockActivatedRoute.data as any).subscribe = (cb: any) => cb({});
    };

    beforeEach(() => {
      jest.spyOn(component, 'patchProfileDetails').mockImplementation();
      jest.spyOn(component, 'setUserStats').mockImplementation();
      jest.spyOn(component, 'patchEntries').mockImplementation();
      jest.spyOn(component, 'checkIsMentor').mockImplementation();
    });

    afterEach(() => {
      delete (mockConfigSvc as any).unMappedUser;
      mockActivatedRoute.data.subscribe = jest.fn();
    });

    it('sets isNotMyUserAndIgotOrg true and isNotMyUserAndNotIgotOrg false for a not-my-user profile in the IGOT org', () => {
      setUnMappedUser('not-my-user', 'IGOT');

      component.getProfileDetailsFromRoutes();

      expect(component.isNotMyUser).toBe(true);
      expect(component.isIgotOrg).toBe(true);
      expect(component.isNotMyUserAndIgotOrg).toBe(true);
      expect(component.isNotMyUserAndNotIgotOrg).toBe(false);
    });

    it('sets isNotMyUserAndNotIgotOrg true and isNotMyUserAndIgotOrg false for a not-my-user profile outside the IGOT org', () => {
      setUnMappedUser('not-my-user', 'Some Other Department');

      component.getProfileDetailsFromRoutes();

      expect(component.isNotMyUser).toBe(true);
      expect(component.isIgotOrg).toBe(false);
      expect(component.isNotMyUserAndIgotOrg).toBe(false);
      expect(component.isNotMyUserAndNotIgotOrg).toBe(true);
    });

    it('keeps both flags false for the current/own user', () => {
      setUnMappedUser('active', 'Some Other Department');

      component.getProfileDetailsFromRoutes();

      expect(component.isNotMyUser).toBe(false);
      expect(component.isNotMyUserAndIgotOrg).toBe(false);
      expect(component.isNotMyUserAndNotIgotOrg).toBe(false);
    });

    it('evaluates profileStatus and departmentName case-insensitively', () => {
      setUnMappedUser('Not-My-User', 'igot');

      component.getProfileDetailsFromRoutes();

      expect(component.isNotMyUserAndIgotOrg).toBe(true);
      expect(component.isNotMyUserAndNotIgotOrg).toBe(false);
    });
  });

  describe('Profile Details', () => {
    it('should patch profile details correctly', () => {
      component.profesionalDetails = {
        profileImageUrl: 'test-image.jpg',
        profileBannerUrl: 'test-banner.jpg',
        personalDetails: { firstname: 'John Doe' },
        employmentDetails: { aboutme: 'Test about me' }
      };
      component.profileData = { firstname: 'John' };

      const getInitialsSpy = jest.spyOn(component, 'getInitials').mockImplementation();
      const setProfileCompletionSpy = jest.spyOn(component, 'setProfileCompletionGraph').mockImplementation();

      component.patchProfileDetails();

      expect(component.profileImageUrl).toBe('test-image.jpg');
      expect(component.profileBannerUrl).toBe('test-banner.jpg');
      expect(component.aboutme).toBe('Test about me');
      expect(getInitialsSpy).toHaveBeenCalled();
      expect(setProfileCompletionSpy).toHaveBeenCalled();
    });

    it('should generate initials correctly for single name', () => {
      component.primaryDetails = { firstname: 'John' };

      component.getInitials();

      expect(component.nameInitials).toBe('J');
    });

    it('should generate initials correctly for multiple names', () => {
      component.primaryDetails = { firstname: 'John Doe' };

      component.getInitials();

      expect(component.nameInitials).toBe('JD');
    });

    it('should set profile completion graph', () => {
      component.profileCompletionPercentage = 75;

      component.setProfileCompletionGraph();

      expect(document.documentElement.style.setProperty).toHaveBeenCalledWith('--i', '61.75');
    });
  });

  describe('User Stats', () => {
    it('should set user stats correctly', () => {
      component.profileData = {
        karmaPoints: 100,
        certificateCount: 5,
        postCount: 10,
        badgeCount: 2
      };

      component.setUserStats();

      const byIdentifier = (identifier: string): any =>
        component.userStats.find((stat: any) => stat.identifier === identifier);

      expect(byIdentifier('karmaPoints').totalPoints).toBe(100);
      expect(byIdentifier('certificateCount').totalPoints).toBe(5);
      expect(byIdentifier('postCount').totalPoints).toBe(10);
      expect(byIdentifier('myBadges').totalPoints).toBe(2);
      expect(component.myBadgesCount).toBe(2);
    });
  });

  describe('Route Selection', () => {
    it('should select route and scroll to element', () => {
      const mockElement = { scrollIntoView: jest.fn() };
      (document.getElementById as jest.Mock).mockReturnValue(mockElement);

      component.selectRoute('about-me');

      expect(document.getElementById).toHaveBeenCalledWith('about-me');
      expect(mockElement.scrollIntoView).toHaveBeenCalledWith({
        behavior: 'smooth',
        block: 'start'
      });
      expect(component.activeRoutId).toBe('about-me');
      expect(window.sessionStorage.setItem).toHaveBeenCalledWith('lastProfileSection', 'about-me');
    });
  });

  describe('Dialog Operations', () => {
    it('should open cover photo dialog', () => {
      component.profileBannerUrl = 'test-banner.jpg';
      component.isMobile = false;

      component.openCoverPhotoDialog();

      expect(mockDialog.open).toHaveBeenCalledWith(
        expect.any(Function),
        expect.objectContaining({
          width: '500px',
          maxWidth: '500px',
          height: 'auto',
          panelClass: 'cover-photo-edit-popup',
          data: { coverPhotoUrl: 'test-banner.jpg' },
          disableClose: true,
          autoFocus: false
        })
      );
    });

    it('should open profile edit dialog', () => {
      component.primaryDetails = { firstname: 'John' };
      component.locationDetails = { state: 'Test State' };

      component.openProfileEditDialog('Profile');

      expect(mockDialog.open).toHaveBeenCalled();
    });
  });

  describe('Profile Entry Operations', () => {
    it('should generate service history form body', () => {
      const serviceHistory = { title: 'Test Job', company: 'Test Company', showMore: true };
      const oldDetails = { uuid: 'test-uuid' };
      component.userId = 'test-user';

      const result = component.generateServiceHistoryFormBody(serviceHistory, oldDetails);

      expect(result.request.userId).toBe('test-user');
      expect(result.request.serviceHistory[0].uuid).toBe('test-uuid');
      expect(result.request.serviceHistory[0].showMore).toBeUndefined();
    });

    it('should generate achievements form body', () => {
      const achievements = { title: 'Test Achievement', year: '2023' };
      const oldDetails = { id: 'test-id' };

      const result = component.generateAchievementsFormBody(achievements, oldDetails);

      expect(result.request.contextType).toBe('achievements');
      expect(result.request.source).toBe('igot');
      expect(result.request.contextData).toBe(achievements);
      expect(result.request.id).toBe('test-id');
    });
  });

  describe('API Calls', () => {
    it('should fetch profile details', () => {
      const mockResponse = {
        result: {
          response: {
            profiledetails: { personalDetails: { firstname: 'John' } },
            profileCompletionPercentage: 80
          }
        }
      };
      mockProfileV2RevampService.fetchProfile.mockReturnValue({
        subscribe: jest.fn().mockImplementation(({ next }) => next(mockResponse))
      });

      const patchSpy = jest.spyOn(component, 'patchProfileDetails').mockImplementation();
      component.userId = 'test-user';

      component.fetchProfileDetails();

      expect(mockProfileV2RevampService.fetchProfile).toHaveBeenCalledWith(
        expect.objectContaining({ urlConfigPath: 'profileV1Basic' }),
        'test-user',
        true
      );
      expect(component.profileCompletionPercentage).toBe(80);
      expect(patchSpy).toHaveBeenCalled();
    });

    it('should handle API error in fetchProfile', () => {
      const mockError = { ok: false };
      mockProfileV2RevampService.fetchProfile.mockReturnValue({
        subscribe: jest.fn().mockImplementation(({ error }) => error(mockError))
      });

      const openSnackbarSpy = jest.spyOn(component, 'openSnackbar' as any).mockImplementation();

      component.fetchProfileDetails();

      expect(openSnackbarSpy).toHaveBeenCalledWith('Something went wrong please try again');
    });

    it('should get groups data', () => {
      const mockResponse = { result: { response: ['Group1', 'Group2', 'Others'] } };
      mockProfileV2RevampService.getGroups.mockReturnValue({
        pipe: jest.fn().mockReturnValue({
          subscribe: jest.fn().mockImplementation((callback) => callback(mockResponse))
        })
      });

      component.getGroupData();

      expect(component.groupsList).toEqual(['Group1', 'Group2']);
    });
  });

  describe('Connection Operations', () => {
    it('should send connection request', () => {
      component.userId = 'target-user';
      component.primaryDetails = { firstname: 'Target User', departmentName: 'Target Department' };
      mockProfileV2RevampService.connectToNetwork.mockReturnValue({
        subscribe: jest.fn().mockImplementation(({ next }) => next({}))
      });

      const openSnackbarSpy = jest.spyOn(component, 'openSnackbar' as any).mockImplementation();
      const getConnectionStatusSpy = jest.spyOn(component, 'getConnectionStatus').mockImplementation();

      component.sendConnectionRequest();

      expect(mockProfileV2RevampService.connectToNetwork).toHaveBeenCalledWith({
        connectionId: 'target-user',
        userIdFrom: 'test-user-id',
        userNameFrom: '',
        userDepartmentFrom: 'Test Department',
        userIdTo: 'target-user',
        userNameTo: 'Target User',
        userDepartmentTo: 'Target Department'
      });
      expect(getConnectionStatusSpy).toHaveBeenCalled();
      expect(openSnackbarSpy).toHaveBeenCalledWith('Connection request sent successfully');
    });

    it('should handle connection request error', () => {
      component.userId = 'target-user';
      component.primaryDetails = { firstname: 'Target User', departmentName: 'Target Department' };
      mockProfileV2RevampService.connectToNetwork.mockReturnValue({
        subscribe: jest.fn().mockImplementation(({ error }) => error({}))
      });

      const openSnackbarSpy = jest.spyOn(component, 'openSnackbar' as any).mockImplementation();

      component.sendConnectionRequest();

      expect(openSnackbarSpy).toHaveBeenCalledWith('Something went wrong while sending connection request');
    });
  });

  describe('Utility Functions', () => {
    it('should copy profile link', async () => {
      Object.defineProperty(window, 'location', {
        value: { href: 'http://test.com/profile' },
        writable: true
      });

      const openSnackbarSpy = jest.spyOn(component, 'openSnackbar' as any).mockImplementation();

      await component.copyProfileLink();

      expect(navigator.clipboard.writeText).toHaveBeenCalledWith('http://test.com/profile');
      expect(openSnackbarSpy).toHaveBeenCalledWith('Profile link copied to clipboard');
    });

    it('should handle copy profile link error', async () => {
      (navigator.clipboard.writeText as jest.Mock).mockRejectedValue(new Error('Copy failed'));
      const openSnackbarSpy = jest.spyOn(component, 'openSnackbar' as any).mockImplementation();

      await component.copyProfileLink();

      expect(openSnackbarSpy).toHaveBeenCalledWith('Failed to copy profile link');
    });

    it('should check if user is mentor', () => {
      component.profileData = { roles: ['mentor'] };

      component.checkIsMentor();

      expect(component.isMentor).toBe(true);
    });

    it('should handle translate to', () => {
      const result = component.handleTranslateTo('test-key');
      expect(mockProfileV2RevampService.handleTranslateTo).toHaveBeenCalledWith('test-key');
      expect(result).toBe('Translated Text');
    });

    it('should view mentor profile', () => {
      component.viewMentorProfile();
      expect(window.open).toHaveBeenCalledWith(expect.stringContaining('/mentorship'), '_blank');
    });
  });

  describe('Approval Status', () => {
    it('should get send approval status', () => {
      const mockResponse = {
        result: {
          data: [
            { name: 'Test Org', group: 'Test Group', lastUpdatedOn: 123456 }
          ]
        }
      };
      mockProfileV2RevampService.fetchApprovalDetails.mockReturnValue({
        pipe: jest.fn().mockReturnValue({
          subscribe: jest.fn().mockImplementation((callback) => callback(mockResponse))
        })
      });

      component.getSendApprovalStatus();

      expect(component.unVerifiedObj.organization).toBe('Test Org');
      expect(component.unVerifiedObj.group).toBe('Test Group');
      expect(component.enableWTR).toBe(true);
    });

    it('should get rejected status', () => {
      const mockResponse = {
        result: {
          data: [
            { 
              name: 'Rejected Org', 
              group: 'Rejected Group', 
              comment: 'Rejection comment',
              lastUpdatedOn: 789012 
            }
          ]
        }
      };
      mockProfileV2RevampService.fetchApprovalDetails.mockReturnValue({
        pipe: jest.fn().mockReturnValue({
          subscribe: jest.fn().mockImplementation((callback) => callback(mockResponse))
        })
      });

      component.getRejectedStatus();

      expect(component.rejectedFields.name).toBe('Rejected Org');
      expect(component.rejectedFields.group).toBe('Rejected Group');
      expect(component.rejectedFields.groupRejectionComments).toBe('Rejection comment');
    });
  });

  describe('Insights Data', () => {
    it('should get insights data', () => {
      const mockResponse = {
        result: {
          response: {
            nudges: [
              { label: 'Test Nudge', growth: 'positive', progress: 15 }
            ],
            'weekly-claps': 50
          }
        }
      };
      mockProfileV2RevampService.getInsightsData.mockReturnValue({
        pipe: jest.fn().mockReturnValue({
          subscribe: jest.fn().mockImplementation((callback) => callback(mockResponse))
        })
      });

      const constructNudgeSpy = jest.spyOn(component, 'constructNudgeData').mockImplementation();
      component.orgId = 'test-org';

      component.getInsightsData();

      expect(component.insightsData).toBe(mockResponse.result.response);
      expect(constructNudgeSpy).toHaveBeenCalled();
      expect(component.insightsData.weeklyClaps).toBe(50);
    });

    it('should construct nudge data', () => {
      component.insightsData = {
        nudges: [
          { label: 'Test Nudge', growth: 'positive', progress: 15 },
          { label: 'Test Nudge 2', growth: 'negative', progress: -5 }
        ]
      };

      component.constructNudgeData();

      expect(component.insightsData.sliderData).toBeDefined();
      expect(component.insightsData.sliderData.sliderData).toHaveLength(2);
      expect(component.insightsData.sliderData.sliderData[0].title).toBe('Test Nudge');
      expect(component.insightsData.sliderData.sliderData[0].data).toBe('+15%');
      expect(component.insightsDataLoading).toBe(false);
    });
  });

  describe('Transfer Requests', () => {
    it('should handle transfer request', () => {
      component.profesionalDetails = { profileDetails: { name: 'Test' } };
      component.groupsList = ['Group1'];

      component.handleTransferRequest();

      expect(mockDialog.open).toHaveBeenCalled();
    });

    it('should handle withdraw transfer request', () => {
      component.approvalPendingFields = [{ name: 'Test' }];

      component.handleWithdrawTransferRequest();

      expect(mockDialog.open).toHaveBeenCalled();
    });
  });

  describe('Entry Filtering', () => {
    it('should filter profile routes', () => {
      const initialRoutesLength = component.profileRoutes.length;
      
      component.filterProfileRoutes('about-me');

      expect(component.profileRoutes.length).toBe(initialRoutesLength - 1);
      expect(component.profileRoutes.find(route => route.id === 'about-me')).toBeUndefined();
    });

    it('should patch entries and filter empty sections for non-current user', () => {
      component.isCurrentUser = false;
      const filterSpy = jest.spyOn(component, 'filterProfileRoutes').mockImplementation();

      const entries = {
        serviceHistory: { data: [], count: 0 },
        educationalQualifications: { data: [], count: 0 },
        achievements: { data: [], count: 0 },
        locationDetails: { data: [{ state: 'Test State' }] }
      };

      component.patchEntries(entries);

      expect(filterSpy).toHaveBeenCalledWith('service-history');
      expect(filterSpy).toHaveBeenCalledWith('educational-qualifications');
      expect(filterSpy).toHaveBeenCalledWith('achievements');
      expect(component.locationDetails.state).toBe('Test State');
    });
  });

  describe('Component Lifecycle', () => {
    it('should set selectedTabIndex on ngAfterViewInit', () => {
      component.ngAfterViewInit();
      expect(component.selectedTabIndex).toBe(0);
    });

    it('should unsubscribe on destroy', () => {
      const unsubscribeSpy = jest.spyOn(component['destroySubject$'], 'unsubscribe');
      
      component.ngOnDestroy();
      
      expect(unsubscribeSpy).toHaveBeenCalled();
    });
  });

  describe('Educational Qualifications', () => {
    it('should generate educational qualifications form body with other degree', async () => {
      const educationalQualifications = {
        degree: 'other',
        otherDegree: 'Custom Degree',
        institutionName: 'Test Institute',
        fieldOfStudy: 'Computer Science',
        startYear: '2020',
        endYear: '2024'
      };
      const oldDetails = { uuid: 'test-uuid' };
      component.userId = 'test-user';

      mockProfileV2RevampService.updateDegree.mockReturnValue(of({}));

      const result = await component.generateEducationalQualificationsFormBody(educationalQualifications, oldDetails);

      expect(result.request.educationalQualifications[0].degree).toBe('Custom Degree');
      expect(result.request.educationalQualifications[0].uuid).toBe('test-uuid');
      expect(mockProfileV2RevampService.updateDegree).toHaveBeenCalledWith(
        { degreeName: 'Custom Degree' },
        expect.objectContaining({ urlConfigPath: 'updateDegree' })
      );
    });

    it('should generate educational qualifications form body with other institute', async () => {
      const educationalQualifications = {
        degree: 'Bachelor',
        institutionName: 'other',
        otherInstituteName: 'Custom Institute',
        fieldOfStudy: 'Engineering',
        startYear: '2020',
        endYear: '2024'
      };
      component.userId = 'test-user';

      mockProfileV2RevampService.updateInstitution.mockReturnValue(of({}));

      const result = await component.generateEducationalQualificationsFormBody(educationalQualifications, {});

      expect(result.request.educationalQualifications[0].institutionName).toBe('Custom Institute');
      expect(mockProfileV2RevampService.updateInstitution).toHaveBeenCalledWith(
        { institutionName: 'Custom Institute' },
        expect.objectContaining({ urlConfigPath: 'updateInstitution' })
      );
    });
  });

  describe('Profile Entry List Dialogs', () => {
    it('should open service history list dialog', () => {
      component.userId = 'test-user';
      component.isCurrentUser = true;
      
      component.openProfileEntryListDialog('Service History');

      expect(mockDialog.open).toHaveBeenCalled();
    });

    it('should open educational qualifications list dialog', () => {
      component.userId = 'test-user';
      component.isCurrentUser = true;
      
      component.openProfileEntryListDialog('Educational qualifications');

      expect(mockDialog.open).toHaveBeenCalled();
    });

    it('should open achievements list dialog', () => {
      component.userId = 'test-user';
      component.isCurrentUser = true;
      
      component.openProfileEntryListDialog('Achievements');

      expect(mockDialog.open).toHaveBeenCalled();
    });
  });

  describe('Form Body Generation', () => {
    it('should generate basic profile form body with changes', () => {
      component.userId = 'test-user';
      component.primaryDetails = {
        firstname: 'Old Name',
        primaryEmail: 'old@email.com',
        group: 'Old Group'
      };

      const result = {
        firstname: 'New Name',
        primaryEmail: 'new@email.com',
        group: 'New Group'
      };

      const updateSpy = jest.spyOn(component, 'updateProfileDetails').mockImplementation();

      component.generateBasicProfileFormBody(result);

      expect(updateSpy).toHaveBeenCalled();
    });
  });
});
describe('ProfileViewV2Component - extended coverage', () => {
  let c: any;
  let svc: any;
  let dialog: any;
  let snackBar: any;
  let events: any;
  let commonSvc: any;
  let configSvc: any;
  let router: any;
  let netCore: any;
  let homeSvc: any;
  let route: any;
  let enrollment: any;
  let pipeImg: any;
  let datePipe: any;
  let translate: any;
  let langSubject: Subject<any>;
  let breakpointSubject: Subject<any>;
  let loadingSubject: Subject<boolean>;
  let storage: any;

  const closed = (result: any): any => ({
    afterClosed: () => of(result),
    componentInstance: { enableWithdraw: new Subject<boolean>(), enableMakeTransfer: new Subject<boolean>() }
  });
  const flush = () => new Promise(resolve => setTimeout(resolve, 0));

  beforeEach(() => {
    langSubject = new Subject<any>();
    breakpointSubject = new Subject<any>();
    loadingSubject = new Subject<boolean>();
    storage = {};
    Object.defineProperty(window, 'localStorage', {
      value: {
        getItem: jest.fn((k: string) => (k in storage ? storage[k] : null)),
        setItem: jest.fn(),
        clear: jest.fn()
      },
      writable: true
    });
    Object.defineProperty(window, 'sessionStorage', {
      value: { getItem: jest.fn(() => null), setItem: jest.fn(), clear: jest.fn() },
      writable: true
    });
    jest.spyOn(console, 'log').mockImplementation(() => undefined);
    jest.spyOn(console, 'error').mockImplementation(() => undefined);

    svc = {
      getRecommendedUsers: jest.fn(() => of({ result: { response: [{ id: 'u1' }, { id: 'a' }, { id: 'b' }, { id: 'c' }, { id: 'd' }] } })),
      getCommunities: jest.fn(() => of({ result: { data: [{ id: 1 }] } })),
      getGroups: jest.fn(() => of({ result: { response: ['G1', 'Others'] } })),
      listAchievements: jest.fn(() => of({ result: { search_results: { data: [1, 2, 3], totalCount: 3 } } })),
      getConnectionStatus: jest.fn(() => of({ result: { response: { status: 'Approved' } } })),
      updateBannerPic: jest.fn(() => of({ result: { url: 'http://x/profileBanner/abc.png' } })),
      updateProfileDetails: jest.fn(() => of({})),
      updateProfileDetailsV3: jest.fn(() => of({ ok: true })),
      fetchProfile: jest.fn(() => of({ result: { response: { profileDetails: { a: 1 }, profileCompletionPercentage: 50 } } })),
      fetchApprovalDetails: jest.fn(() => of({ result: { data: [] } })),
      getOrgSearch: jest.fn(() => of({ result: { response: { content: [{ orgName: 'Org One' }] } } })),
      updateDegree: jest.fn(() => of({})),
      updateInstitution: jest.fn(() => of({})),
      addEntriesToProfile: jest.fn(() => of({ result: { response: {} } })),
      fetchProfileEntryList: jest.fn(() => of({ result: { response: { serviceHistory: [] } } })),
      createAchievementEntry: jest.fn(() => of({})),
      updateAchievementEntry: jest.fn(() => of({})),
      updateEntriesOfProfile: jest.fn(() => of({})),
      fetchProfileEntries: jest.fn(() => of({ result: { response: {} } })),
      blockConnection: jest.fn(() => of({})),
      updateConnectionRequest: jest.fn(() => of({})),
      connectToNetwork: jest.fn(() => of({})),
      getInsightsData: jest.fn(() => of({ result: { response: { nudges: [] } } })),
      deleteAchievementEntry: jest.fn(() => of({ result: {}, responseCode: 'OK' })),
      handleTranslateTo: jest.fn((k: string) => `t:${k}`)
    };
    dialog = { open: jest.fn(() => closed(null)) };
    snackBar = { open: jest.fn() };
    events = { raiseInteractTelemetry: jest.fn() };
    commonSvc = {
      mandatoryDetails: jest.fn(),
      getNlw2026CertifiedStatus: jest.fn(() => of(true)),
      getLanguageBasedContentUrl: jest.fn(() => 'http://pdf')
    };
    configSvc = {
      userProfile: { userId: 'me', firstName: 'Me', departmentName: 'Dept' },
      unMappedUser: { id: 'me', identifier: ' ME ' },
      userRoles: new Set<string>()
    };
    router = { navigate: jest.fn() };
    netCore = {
      netCoreUserProfilePhotoUpdate: jest.fn(),
      netCoreUserNameUpdate: jest.fn(),
      netCoreUserProfilepdate: jest.fn(),
      trackEvent: jest.fn()
    };
    homeSvc = { getLearnerLeaderboardCached: jest.fn(() => of({ result: { result: [{ userId: 'me', rank: 2 }] } })) };
    route = {
      data: of({
        profile: {
          userId: 'other',
          data: {
            profileDetails: { personalDetails: { firstname: 'Ann Lee', dob: '2000-01-01T00:00' } },
            professionalDetails: [{ group: 'G', designation: 'D' }],
            rootOrgId: 'org1', badgeCount: 4, walletBalance: 7, karmaPoints: 8, certificateCount: 9, postCount: 1,
            roles: ['Mentor']
          }
        },
        entries: { data: {} }
      }),
      fragment: of(null),
      queryParamMap: new Subject<any>(),
      snapshot: { queryParamMap: { get: jest.fn(() => null) } },
      parent: {
        snapshot: {
          data: {
            pageData: {
              data: {
                nlwExperience: { banner: { title: 'T', onClick: { action: 'a' } } },
                profileConfig: {
                  banner: { defaultBannerUrl: 'banner.png' },
                  aboutMe: { enabled: true },
                  rightSection: { enabled: true, recommendedCommunities: { enabled: true } },
                  userStats: { enabled: true, walletBalance: { enabled: true, viewAllEnabled: true }, karmaPoints: { enabled: false } },
                  basicDetails: { primaryDetails: { editObjectKey: 'pd' }, otherDetails: { editObjectKey: 'od', fields: ['x'] } },
                  serviceHistory: { enabled: true, editObjectKey: 'sh' },
                  educationalQualifications: { enabled: true, editObjectKey: 'eq' },
                  achievements: { enabled: true, editObjectKey: 'ac' }
                },
                profileEditConfigs: { pd: { p: 1 }, od: { isDynamicDialog: true }, sh: { isDynamicDialog: true }, eq: {}, ac: {} },
                apiConfig: { k: 'v' }
              }
            }
          }
        }
      }
    };
    enrollment = { loading$: loadingSubject.asObservable() };
    pipeImg = { transform: jest.fn((u: string) => `img:${u}`) };
    datePipe = { transform: jest.fn(() => '01-01-2000') };
    translate = { setDefaultLang: jest.fn(), use: jest.fn() };

    c = new ProfileViewV2Component(
      dialog as any, route as any, svc as any, snackBar as any, pipeImg as any, configSvc as any,
      { observe: jest.fn(() => breakpointSubject.asObservable()) } as any, translate as any, datePipe as any,
      events as any, { languageSelectedObservable: langSubject.asObservable() } as any, commonSvc as any,
      router as any, netCore as any, homeSvc as any, enrollment as any
    );
    c.profileConfig = route.parent.snapshot.data.pageData.data.profileConfig;
    c.profileEditConfigs = route.parent.snapshot.data.pageData.data.profileEditConfigs;
    c.apiConfig = { k: 'v' };
    c.userId = 'other';
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('constructor and lifecycle', () => {
    it('applies the default language, then the stored website language', () => {
      langSubject.next(1);
      expect(translate.setDefaultLang).toHaveBeenCalledWith('hi');
      storage['websiteLanguage'] = 'fr';
      langSubject.next(1);
      expect(translate.use).toHaveBeenCalledWith('fr');
    });

    it('tracks the handset breakpoint', () => {
      const spy = jest.spyOn(c, 'setAboutMeButton').mockImplementation();
      breakpointSubject.next({ matches: true });
      expect(c.isMobile).toBe(true);
      expect(spy).toHaveBeenCalled();
    });

    it('ngAfterViewInit selects the activities tab for the current user', () => {
      jest.useFakeTimers();
      c.isCurrentUser = true;
      c.ngAfterViewInit();
      route.queryParamMap.next({ get: () => 'activities' });
      jest.runAllTimers();
      expect(c.selectedTabIndex).toBe(1);
    });

    it('ngAfterViewInit falls back to the profile tab on first emission only', () => {
      c.ngAfterViewInit();
      c.selectedTabIndex = 1;
      route.queryParamMap.next({ get: () => null });
      expect(c.selectedTabIndex).toBe(0);
      c.selectedTabIndex = 1;
      route.queryParamMap.next({ get: () => null });
      expect(c.selectedTabIndex).toBe(1);
    });

    it('onTabChange navigates only when the tab param differs', () => {
      c.onTabChange(1);
      expect(router.navigate).toHaveBeenCalledWith([], expect.objectContaining({ queryParams: { tab: 'activities' } }));
      router.navigate.mockClear();
      c.onTabChange(0);
      expect(router.navigate).not.toHaveBeenCalled();
      route.snapshot.queryParamMap.get.mockReturnValue('activities');
      c.onTabChange(1);
      expect(router.navigate).not.toHaveBeenCalled();
      c.onTabChange(0);
      expect(router.navigate).toHaveBeenCalledWith([], expect.objectContaining({ queryParams: { tab: 'profile' } }));
    });

    it('ngOnInit restores the last profile section', () => {
      jest.useFakeTimers();
      (window.sessionStorage.getItem as jest.Mock).mockReturnValue('sec');
      ['getProfileDetailsFromRoutes', 'getAchievements', 'setAchievementStats', 'getSendApprovalStatus',
        'getRejectedStatus', 'getGroupData', 'getInsightsData'].forEach(m => jest.spyOn(c, m).mockImplementation());
      const sel = jest.spyOn(c, 'selectRoute').mockImplementation();
      c.ngOnInit();
      jest.advanceTimersByTime(150);
      expect(sel).toHaveBeenCalledWith('sec');
    });

    it('ngOnDestroy completes the destroy subject', () => {
      const spy = jest.spyOn(c.destroySubject$, 'unsubscribe');
      c.ngOnDestroy();
      expect(spy).toHaveBeenCalled();
    });
  });

  describe('suggestions, groups and achievements', () => {
    it('getRecommendedUsers filters the current user and caps at three', () => {
      c.userId = 'u1';
      c.getRecommendedUsers();
      expect(c.peopleSuggestionsList).toHaveLength(3);
      expect(c.suggestionsLoading).toBe(false);
    });

    it('getRecommendedUsers reports an error', () => {
      svc.getRecommendedUsers.mockReturnValue(throwError(() => new Error('x')));
      c.getRecommendedUsers();
      expect(snackBar.open).toHaveBeenCalled();
    });

    it('getRecommendedCommunitesList loads and handles errors', () => {
      c.getRecommendedCommunitesList();
      expect(c.communitySuggestionsList).toEqual([{ id: 1 }]);
      svc.getCommunities.mockReturnValue(throwError(() => new Error('x')));
      c.getRecommendedCommunitesList();
      expect(c.communitySuggestionsLoading).toBe(false);
      expect(snackBar.open).toHaveBeenCalled();
    });

    it('getGroupData stores groups without Others and checks mandatory fragment', () => {
      const spy = jest.spyOn(c, 'checkMandatory').mockImplementation();
      c.getGroupData();
      expect(c.groupsList).toEqual(['G1']);
      expect(spy).toHaveBeenCalled();
    });

    it('getGroupData reports a failed response', () => {
      svc.getGroups.mockReturnValue(throwError(() => ({ ok: false })));
      c.getGroupData();
      expect(snackBar.open).toHaveBeenCalledWith('t:groupDataFaile', 'X', expect.anything());
    });

    it('checkMandatory opens the mandatory dialog for the fragment, otherwise resets it', () => {
      jest.useFakeTimers();
      const spy = jest.spyOn(c, 'handleEditMandatoryDetails').mockImplementation();
      c.checkMandatory();
      expect(commonSvc.mandatoryDetails).toHaveBeenCalledWith(false);
      route.fragment = of('mandatorySection');
      c.checkMandatory();
      jest.advanceTimersByTime(600);
      expect(spy).toHaveBeenCalled();
    });

    it('getAchievements stores the first two and handles errors', () => {
      c.getAchievements();
      expect(c.achievementsDetails.achievementsList).toEqual([1, 2]);
      expect(c.achievementsDetails.count).toBe(3);
      svc.listAchievements.mockReturnValue(throwError(() => new Error('x')));
      c.getAchievements();
      expect(snackBar.open).toHaveBeenCalled();
    });
  });

  describe('setAchievementStats', () => {
    it('keeps the skeleton while loading and fills stats once loaded', () => {
      storage['userEnrollmentCount'] = JSON.stringify({
        userCourseEnrolmentInfo: { karmaPoints: 5, badgeCount: 2, timeSpentOnCompletedCourses: 3700, walletBalance: 9 }
      });
      c.setAchievementStats();
      loadingSubject.next(true);
      expect(c.achievementSummaryLoading).toBe(true);
      loadingSubject.next(false);
      const byKey = (k: string) => c.achievementStats.find((s: any) => s.key === k).value;
      expect(byKey('karmaPoints')).toBe('5 KP');
      expect(byKey('badges')).toBe('2 Badges');
      expect(byKey('learningHours')).toBe('1h 1m');
      expect(byKey('rank')).toBe('2nd Rank');
    });

    it('falls back to defaults without cached data and tolerates invalid JSON', () => {
      c.setAchievementStats();
      loadingSubject.next(false);
      expect(c.achievementStats.find((s: any) => s.key === 'karmaPoints').value).toBe('0 KP');
      storage['userEnrollmentCount'] = '{bad';
      expect(() => loadingSubject.next(false)).not.toThrow();
    });

    it('leaves the placeholder when the leaderboard fails or has no rank', () => {
      homeSvc.getLearnerLeaderboardCached.mockReturnValue(throwError(() => new Error('x')));
      c.setAchievementStats();
      homeSvc.getLearnerLeaderboardCached.mockReturnValue(of({ result: { result: [] } }));
      c.setAchievementStats();
      expect(c.achievementStats.find((s: any) => s.key === 'rank').value).toBe('--');
    });

    it('toOrdinal and toHoursAndMinutes format values', () => {
      expect([1, 2, 3, 4, 11, 12, 13, 21, 22, 23, 101].map((n: number) => c.toOrdinal(n)))
        .toEqual(['1st', '2nd', '3rd', '4th', '11th', '12th', '13th', '21st', '22nd', '23rd', '101st']);
      expect(c.toHoursAndMinutes('abc')).toBe('0h 0m');
      c.setStatValue('unknown', 'x');
    });
  });

  describe('getProfileDetailsFromRoutes', () => {
    beforeEach(() => {
      route.parent.snapshot.data.pageData.data.profileConfig = c.profileConfig;
      jest.spyOn(c, 'setProfileCompletionGraph').mockImplementation();
    });

    it('populates profile data, stats and connection status for another user', () => {
      c.getProfileDetailsFromRoutes();
      expect(c.userId).toBe('other');
      expect(c.isCurrentUser).toBe(false);
      expect(c.connectionStatus).toBe('Approved');
      expect(c.orgId).toBe('org1');
      expect(c.isMentor).toBe(true);
      expect(c.defaultCoverPhotoUrl).toBe('banner.png');
      expect(c.communitySuggestionsList).toEqual([{ id: 1 }]);
      expect(c.userStats).toHaveLength(1);
      expect(c.userStats[0].viewAllEnabled).toBe(true);
      expect(c.isNlw2026Certified).toBe(true);
      expect(c.primaryDetails.firstname).toBe('Ann Lee');
      expect(c.nameInitials).toBe('AL');
    });

    it('marks the current user', () => {
      configSvc.userProfile.userId = 'other';
      c.getProfileDetailsFromRoutes();
      expect(c.isCurrentUser).toBe(true);
    });

    it('handles a missing parent route and an unknown stat identifier', () => {
      route.parent = null;
      c.userStats.push({ state: 's', totalPoints: '0', iconUrl: '', vewAllUrl: '' });
      c.getProfileDetailsFromRoutes();
      expect(c.pageData).toBeNull();
    });
  });

  describe('connection visibility', () => {
    it('hides the profile for blocked connections', () => {
      c.connectionStatus = 'Blocked Outgoing';
      c.setProfileVisibilityStatus();
      expect(c.showProfileSection).toBe(false);
      expect(c.blockedMessage).toBe('t:youBlockedThisProfile');
      c.connectionStatus = 'Blocked Incoming';
      c.setProfileVisibilityStatus();
      expect(c.blockedMessage).toBe('t:youAreNotAuthorisedToSeeThisProfile');
    });

    it('hides locked profiles unless approved', () => {
      c.profesionalDetails = { profilePreference: 1 };
      c.setProfileVisibilityStatus();
      expect(c.blockedMessage).toBe('t:thisProfileIsLocked');
      c.profesionalDetails = { profilePreference: 10 };
      c.connectionStatus = 'Connect';
      c.setProfileVisibilityStatus();
      expect(c.showProfileSection).toBe(false);
      c.connectionStatus = 'Approved';
      c.setProfileVisibilityStatus();
      expect(c.showProfileSection).toBe(true);
    });
  });

  describe('patchProfileDetails and getters', () => {
    it('maps cadre details and fires the netcore update after all init calls', () => {
      jest.spyOn(c, 'setProfileCompletionGraph').mockImplementation();
      const netSpy = jest.spyOn(c, 'netCoreUserProfileUpdateEvent').mockImplementation();
      c.profesionalDetails = {
        personalDetails: { isCadre: true, firstname: 'Solo' },
        cadreDetails: { cadreName: 'Cad' },
        profileDesignationStatus: 'VERIFIED',
        employmentDetails: { aboutme: 'hi' },
        refRootOrg: { orgName: 'Org' }
      };
      c.profileData = {};
      c.isCurrentUser = true;
      c.patchProfileDetails();
      expect(c.primaryDetails.cadreName).toBe('Cad');
      c.patchProfileDetails();
      c.designationApprovedTimeChange(5);
      c.patchProfileDetails();
      expect(netSpy).toHaveBeenCalledWith({ organisationName: 'Org', departmentName: '' });
      expect(c.nameInitials).toBe('S');
    });

    it('removes the about-me route for other users without bio', () => {
      jest.spyOn(c, 'setProfileCompletionGraph').mockImplementation();
      c.profesionalDetails = {};
      c.profileData = {};
      c.profileRoutes = [{ id: 'about-me', key: 'aboutMe', name: '', url: '', icon: '' }];
      c.patchProfileDetails();
      expect(c.profileRoutes).toHaveLength(0);
    });

    it('evaluates the display getters', () => {
      c.enableWR = true;
      c.isCurrentUser = true;
      expect(c.showWithdrawRequestBtn).toBe(true);
      c.isNotMyUser = true;
      c.isIgotOrg = true;
      expect(c.showWithdrawRequestBtn).toBe(false);
      c.designationApprovedTime = 1;
      c.rejectedFields.designationRejectionTime = 5;
      expect(c.showApprovalStatus).toBe(true);
      c.isCurrentUser = false;
      expect(c.showApprovalStatus).toBe(false);
      c.connectionStatus = 'Pending';
      expect(c.shouldShowBlockProfileButton).toBe(false);
      c.isCurrentUser = true;
      c.isMobile = false;
      expect(c.shouldShowUserStatsDesktop).toBe(true);
      expect(c.shouldShowUserStatsMobile).toBe(false);
      expect(c.shouldShowAboutMeSection).toBe(true);
      expect(c.shouldShowServiceHistorySection).toBe(true);
      expect(c.shouldShowEducationalQualificationsSection).toBe(true);
      expect(c.shouldShowAchievementsSection).toBe(true);
      c.primaryDetails = { currentOrgName: 'o', designation: 'd' };
      expect(c.hasCurrentEmploymentDetails).toBe(true);
      configSvc.userRoles.add('volunteer');
      expect(c.isVolunteerUser).toBe(true);
    });
  });

  describe('helpers', () => {
    it('getDateFromText handles ISO, dd-mm-yyyy, yyyy-mm-dd and empty values', () => {
      expect(c.getDateFromText('')).toBe('');
      expect(c.getDateFromText('2000-01-01T00:00')).toBe('2000-01-01');
      expect(c.getDateFromText('01-02-2000')).toBe('01-01-2000');
      expect(c.getDateFromText('2000-02-01')).toBe('01-01-2000');
    });

    it('setUserStats copies profile values into every stat', () => {
      c.profileData = { badgeCount: 2, walletBalance: 3, karmaPoints: 4, certificateCount: 5, postCount: 6 };
      c.setUserStats();
      expect(c.userStats.map((s: any) => s.totalPoints)).toEqual([3, 4, 5, 2, 6]);
    });

    it('patchEntries prunes empty sections for other users', () => {
      c.isCurrentUser = false;
      c.profileRoutes = ['service-history', 'educational-qualifications', 'achievements'].map(id => ({ id } as any));
      c.patchEntries({ locationDetails: { data: [{ state: 'S' }] } });
      expect(c.profileRoutes).toHaveLength(0);
      expect(c.locationDetails).toEqual({ state: 'S' });
    });

    it('setAboutMeButton measures the about-me element', () => {
      jest.useFakeTimers();
      c.aboutme = 'text';
      c.aboutMeElement = { nativeElement: { offsetHeight: 80 } };
      c.setAboutMeButton();
      jest.advanceTimersByTime(20);
      expect(c.showViewMoreBtn).toBe(true);
    });

    it('selectRoute scrolls to an element and records it', () => {
      const el = { scrollIntoView: jest.fn() };
      (document.getElementById as jest.Mock).mockReturnValue(el);
      c.selectRoute('sec');
      expect(el.scrollIntoView).toHaveBeenCalled();
      expect(c.activeRoutId).toBe('sec');
    });

    it('title case, edit config and config details helpers', () => {
      expect(c.toTitleCase('jOHN do')).toBe('John Do');
      expect(c.getEditConfig('pd')).toEqual({ p: 1 });
      expect(c.getEditConfig('zz')).toBeNull();
      expect(c.getEditConfig(undefined)).toBeNull();
      expect(c.getConfigDetails('k')).toEqual({ apiConfig: { k: 'v' }, urlConfigPath: 'k', defaultUrl: '' });
    });

    it('getErrorMessage picks duplicate email/mobile or generic messages', () => {
      const email = { request: { profileDetails: { personalDetails: { primaryEmail: 'a' } } } };
      const mobile = { request: { profileDetails: { personalDetails: { mobile: '1' } } } };
      expect(c.getErrorMessage({ error: { message: 'Email taken' } }, email)).toContain('email is already');
      expect(c.getErrorMessage({ error: { params: { errmsg: 'phone dup' } } }, mobile)).toContain('mobile number');
      expect(c.getErrorMessage({ error: { message: 'boom' } }, {})).toBe('boom');
      expect(c.getErrorMessage({}, {})).toBe('Something went wrong please try again');
    });
  });

  describe('banner and profile updates', () => {
    it('openCoverPhotoDialog saves an updated banner', () => {
      const file = new File(['x'], 'a.png');
      dialog.open.mockReturnValue(closed({ isUpdated: true, file }));
      const spy = jest.spyOn(c, 'saveBannerImage').mockImplementation();
      c.isMobile = true;
      c.openCoverPhotoDialog();
      expect(spy).toHaveBeenCalledWith(file);
    });

    it('saveBannerImage uploads and refreshes the profile', () => {
      const spy = jest.spyOn(c, 'fetchProfileDetails').mockImplementation();
      c.saveBannerImage(new File(['x'], 'a b!.png'));
      expect(pipeImg.transform).toHaveBeenCalledWith('/profileBanner/abc.png');
      expect(spy).toHaveBeenCalled();
    });

    it('saveBannerImage skips the patch when no url is returned and reports errors', () => {
      const spy = jest.spyOn(c, 'fetchProfileDetails').mockImplementation();
      svc.updateBannerPic.mockReturnValue(of(null));
      c.saveBannerImage(new File(['x'], 'a.png'));
      expect(svc.updateProfileDetails).not.toHaveBeenCalled();
      expect(spy).toHaveBeenCalled();
      svc.updateBannerPic.mockReturnValue(throwError(() => ({ error: { message: 'bad' } })));
      c.saveBannerImage(new File(['x'], 'a.png'));
      expect(snackBar.open).toHaveBeenCalledWith('bad', 'X', expect.anything());
    });

    it('saveBannerImage clears an existing banner when no file is given', () => {
      const spy = jest.spyOn(c, 'updateProfileDetails').mockImplementation();
      c.profileBannerUrl = 'old';
      c.saveBannerImage(null as any);
      expect(spy).toHaveBeenCalled();
      spy.mockClear();
      c.profileBannerUrl = '';
      c.saveBannerImage(null as any);
      expect(spy).not.toHaveBeenCalled();
    });

    it('updateProfileDetails handles approval, name, and generic updates', () => {
      jest.spyOn(c, 'fetchProfileDetails').mockImplementation();
      jest.spyOn(c, 'getSendApprovalStatus').mockImplementation();
      const nameSpy = jest.spyOn(c, 'netCoreUserProfileNameUpdateEvent').mockImplementation();
      const updSpy = jest.spyOn(c, 'netCoreUserProfileUpdateEvent').mockImplementation();
      c.updateProfileDetails({ request: { profileDetails: { professionalDetails: [{}], personalDetails: { firstname: 'N' } } } });
      expect(c.enableWR).toBe(true);
      expect(nameSpy).toHaveBeenCalledWith('N');
      c.updateProfileDetails({ request: { profileDetails: {} } });
      expect(updSpy).toHaveBeenCalled();
      expect(snackBar.open).toHaveBeenCalledWith('Updated Successfully', 'X', expect.anything());
    });

    it('updateProfileDetails reports errors', () => {
      svc.updateProfileDetailsV3.mockReturnValue(throwError(() => ({ error: { message: 'm' } })));
      c.updateProfileDetails({});
      expect(snackBar.open).toHaveBeenCalledWith('m', 'X', expect.anything());
    });

    it('fetchProfileDetails updates and reports errors', () => {
      jest.spyOn(c, 'patchProfileDetails').mockImplementation();
      c.fetchProfileDetails();
      expect(c.profileCompletionPercentage).toBe(50);
      svc.fetchProfile.mockReturnValue(throwError(() => new Error('x')));
      c.fetchProfileDetails();
      expect(snackBar.open).toHaveBeenCalled();
    });
  });

  describe('netcore events', () => {
    const enableNetcore = () => {
      configSvc.netcoreConfig = { netcoreWebConfig: { isActive: true, events: { profile_update: { isActive: true } } } };
    };

    it('does nothing when netcore is disabled', () => {
      c.netCoreUserProfilePhotoUpdateEvent('p');
      c.netCoreUserProfileNameUpdateEvent('n');
      c.netCoreUserProfileUpdateEvent({});
      expect(netCore.trackEvent).not.toHaveBeenCalled();
    });

    it('tracks photo and name updates', () => {
      enableNetcore();
      c.netCoreUserProfilePhotoUpdateEvent('p');
      expect(netCore.netCoreUserProfilePhotoUpdate).toHaveBeenCalledWith({ 'pk^userid': 'me', PROFILE_PHOTO: 'p' });
      c.netCoreUserProfileNameUpdateEvent('aNN lee');
      expect(netCore.netCoreUserNameUpdate).toHaveBeenCalledWith({ 'pk^userid': 'me', FULL_NAME: 'Ann Lee' });
      configSvc.unMappedUser.identifier = '';
      c.netCoreUserProfilePhotoUpdateEvent();
      c.netCoreUserProfileNameUpdateEvent();
    });

    it('tracks profile update fields', () => {
      enableNetcore();
      c.profesionalDetails = {
        profileDetails: { professionalDetails: { group: 'A B' }, profileDesignationStatus: { group: 'X' } },
        cadreDetails: {}, additionalProperties: {}
      };
      c.netCoreUserProfileUpdateEvent({
        organisationName: 'o', departmentName: 'd',
        request: {
          profileDetails: {
            employmentDetails: { employeeCode: 'e' },
            personalDetails: { primaryEmail: 'm', mobile: '1', domicileMedium: 'h', isCadre: true },
            professionalDetails: [{ group: 'g', designation: 'd' }]
          }
        }
      });
      const tracked = netCore.trackEvent.mock.calls[0][2];
      expect(tracked).toEqual(expect.arrayContaining(['EMPLOYEE_ID', 'EMAIL', 'MOBILE', 'MOTHER_TONGUE', 'IS_CADRE',
        'ORGANISATION', 'PARENT_DEPARTMENT', 'PROFILE_GROUP', 'PROFILE_DESIGNATION']));
      expect(netCore.netCoreUserProfilepdate).toHaveBeenCalledWith(expect.objectContaining({ PROFILE_GROUP: 'A B' }));
    });
  });

  describe('openProfileEditDialog', () => {
    it('builds Profile dialog data and updates the location (add)', () => {
      dialog.open.mockReturnValue(closed({ state: 'S', district: 'D' }));
      jest.spyOn(c, 'generateBasicProfileFormBody').mockImplementation();
      const addSpy = jest.spyOn(c, 'addProfileEntry').mockImplementation();
      c.openProfileEditDialog('Profile');
      expect(dialog.open.mock.calls[0][1].data.profileDetails).toEqual(expect.objectContaining({ state: '' }));
      expect(addSpy).toHaveBeenCalled();
    });

    it('updates an existing location entry', () => {
      dialog.open.mockReturnValue(closed({ state: 'S', district: 'D' }));
      jest.spyOn(c, 'generateBasicProfileFormBody').mockImplementation();
      const updSpy = jest.spyOn(c, 'updateProfileEntry').mockImplementation();
      c.locationDetails = { uuid: 'u', state: 'Old', district: 'D' };
      c.openProfileEditDialog('Profile');
      expect(updSpy).toHaveBeenCalled();
    });

    it('does not touch the location when unchanged', () => {
      dialog.open.mockReturnValue(closed({ state: 'S', district: 'D' }));
      jest.spyOn(c, 'generateBasicProfileFormBody').mockImplementation();
      const addSpy = jest.spyOn(c, 'addProfileEntry').mockImplementation();
      c.locationDetails = { state: 'S', district: 'D' };
      c.openProfileEditDialog('Profile');
      expect(addSpy).not.toHaveBeenCalled();
    });

    it('covers Primary Details, mandatorySection and Other Details headers', () => {
      c.openProfileEditDialog('Primary Details');
      expect(dialog.open.mock.calls[0][1].data.groupsList).toBe(c.groupsList);
      c.openProfileEditDialog('mandatorySection');
      expect(dialog.open.mock.calls[1][1].data.dialogDetails).toBeDefined();
    });

    it('uses the dynamic dialog for Other Details unless volunteer', () => {
      dialog.open.mockReturnValue(closed(null));
      c.openProfileEditDialog('Other Details');
      expect(dialog.open.mock.calls[0][0].name).toBe('DynamicEntryEditComponent');
      configSvc.userRoles.add('volunteer');
      c.openProfileEditDialog('Other Details');
      expect(dialog.open.mock.calls[1][0].name).toBe('PrfileEditV2Component');
    });
  });

  describe('generateBasicProfileFormBody', () => {
    beforeEach(() => {
      c.primaryDetails = { firstname: 'Old', dob: '2000-01-01', group: 'g', designation: 'd', isCadre: false };
      c.profesionalDetails = {};
    });

    it('does nothing for an empty result', () => {
      const spy = jest.spyOn(c, 'updateProfileDetails').mockImplementation();
      c.generateBasicProfileFormBody(null);
      expect(spy).not.toHaveBeenCalled();
    });

    it('sends changed personal details with otps', () => {
      const spy = jest.spyOn(c, 'updateProfileDetails').mockImplementation();
      c.generateBasicProfileFormBody({ firstname: 'New', primaryEmail: 'a@b.c', mobile: '99', emailOtp: '1', phoneOtp: '2', group: 'z' });
      const body = spy.mock.calls[0][0] as any;
      expect(body.request.profileDetails.personalDetails.firstname).toBe('New');
      expect(body.request.emailOtp).toBe('1');
      expect(body.request.phoneOtp).toBe('2');
      expect(body.request.profileDetails.professionalDetails[0].group).toBe('z');
    });

    it('defaults missing otps to empty strings', () => {
      const spy = jest.spyOn(c, 'updateProfileDetails').mockImplementation();
      c.generateBasicProfileFormBody({ primaryEmail: 'a@b.c', mobile: '99' });
      const body = spy.mock.calls[0][0] as any;
      expect(body.request.emailOtp).toBe('');
      expect(body.request.phoneOtp).toBe('');
    });

    it('includes cadre details for cadre users', () => {
      const spy = jest.spyOn(c, 'updateProfileDetails').mockImplementation();
      c.generateBasicProfileFormBody({ isCadre: true, cadreName: 'C' });
      const body = spy.mock.calls[0][0] as any;
      expect(body.request.profileDetails.cadreDetails.cadreName).toBe('C');
    });

    it('sends group/designation for not-verified profiles without other changes', () => {
      const spy = jest.spyOn(c, 'updateProfileDetails').mockImplementation();
      c.primaryDetails = { group: 'g', designation: 'd' };
      c.profesionalDetails = { profileDesignationStatus: 'NOT-VERIFIED' };
      c.generateBasicProfileFormBody({ group: 'g', designation: 'd' });
      c.generateBasicProfileFormBody({ group: 'g2' });
      c.generateBasicProfileFormBody({ designation: 'd2' });
      c.generateBasicProfileFormBody({});
      const sent = spy.mock.calls.map((call: any) => call[0].request.profileDetails.professionalDetails[0]);
      expect(sent).toEqual([{ group: 'g', designation: 'd' }, { group: 'g2' }, { designation: 'd2' }]);
    });

    it('stays quiet for verified profiles without changes', () => {
      const spy = jest.spyOn(c, 'updateProfileDetails').mockImplementation();
      c.generateBasicProfileFormBody({ firstname: 'Old' });
      expect(spy).not.toHaveBeenCalled();
    });
  });

  describe('approval status', () => {
    it('getSendApprovalStatus handles empty, organisation and group requests', () => {
      c.getSendApprovalStatus();
      expect(c.enableWTR).toBe(false);
      svc.fetchApprovalDetails.mockReturnValue(of({ result: { data: [{ name: 'Org', group: 'g', designation: 'd', lastUpdatedOn: 5 }] } }));
      c.getSendApprovalStatus();
      expect(c.enableWTR).toBe(true);
      expect(c.unVerifiedObj.group).toBe('g');
      svc.fetchApprovalDetails.mockReturnValue(of({ result: { data: [{ group: 'g', lastUpdatedOn: 1 }] } }));
      c.getSendApprovalStatus();
      expect(c.enableWR).toBe(true);
    });

    it('getSendApprovalStatus reports errors', () => {
      svc.fetchApprovalDetails.mockReturnValue(throwError(() => ({ ok: false })));
      c.getSendApprovalStatus();
      expect(snackBar.open).toHaveBeenCalledWith('t:approvalStatusFailed', 'X', expect.anything());
    });

    it('getRejectedStatus records the latest rejections', () => {
      svc.fetchApprovalDetails.mockReturnValue(of({
        result: { data: [{ name: 'N', group: 'g', designation: 'd', comment: 'c', lastUpdatedOn: 9 }] }
      }));
      c.getRejectedStatus();
      expect(c.rejectedFields.groupRejectionComments).toBe('c');
      expect(c.rejectedFields.designationRejectionTime).toBe(9);
      svc.fetchApprovalDetails.mockReturnValue(of({}));
      c.getRejectedStatus();
    });

    it('getRejectedStatus reports errors', () => {
      svc.fetchApprovalDetails.mockReturnValue(throwError(() => ({ ok: false })));
      c.getRejectedStatus();
      expect(snackBar.open).toHaveBeenCalledWith('t:rejectedStatusFailed', 'X', expect.anything());
    });

    it('updateWithdrawalStatus disables the withdraw request', () => {
      c.enableWR = true;
      c.updateWithdrawalStatus();
      expect(c.enableWR).toBe(false);
    });
  });

  describe('transfer and withdraw dialogs', () => {
    it('handleTransferRequest reacts to the withdraw event', () => {
      const ref = closed(null);
      dialog.open.mockReturnValue(ref);
      jest.spyOn(c, 'getSendApprovalStatus').mockImplementation();
      jest.spyOn(c, 'fetchProfileDetails').mockImplementation();
      c.handleTransferRequest();
      ref.componentInstance.enableWithdraw.next(false);
      expect(c.enableWTR).toBe(false);
      ref.componentInstance.enableWithdraw.next(true);
      expect(c.enableWTR).toBe(true);
    });

    it('handleWithdrawTransferRequest resolves org names and handles the make-transfer event', () => {
      const ref = closed(null);
      dialog.open.mockReturnValue(ref);
      c.approvalPendingFields = [{ name: 'org1' }, { group: 'g' }];
      c.unVerifiedObj.group = 'x';
      c.enableWTR = true;
      c.handleWithdrawTransferRequest();
      expect(dialog.open.mock.calls[0][1].data.approvalPendingFields[0].displayName).toBe('Org One');
      ref.componentInstance.enableMakeTransfer.next(false);
      expect(c.enableWTR).toBe(true);
      ref.componentInstance.enableMakeTransfer.next(true);
      expect(c.enableWTR).toBe(false);
      expect(c.unVerifiedObj.group).toBe('');
    });

    it('handleWithdrawTransferRequest falls back to the name on lookup failure', () => {
      dialog.open.mockReturnValue(closed(null));
      svc.getOrgSearch.mockReturnValue(throwError(() => new Error('x')));
      c.approvalPendingFields = [{ name: 'org1' }];
      c.handleWithdrawTransferRequest();
      expect(dialog.open.mock.calls[0][1].data.approvalPendingFields[0].displayName).toBe('org1');
      c.approvalPendingFields = null;
      c.handleWithdrawTransferRequest();
    });

    it('viewMentorProfile opens the mentorship page', () => {
      c.viewMentorProfile();
      expect(window.open).toHaveBeenCalledWith(expect.stringContaining('/mentorship'), '_blank');
    });
  });

  describe('entry list dialogs', () => {
    it('openProfileEntryListDialog dispatches by header', () => {
      const sh = jest.spyOn(c, 'openServiceHistoryListDialog').mockImplementation();
      const eq = jest.spyOn(c, 'openEducationalQualificationsListDialog').mockImplementation();
      const ac = jest.spyOn(c, 'openAchievementsListDialog').mockImplementation();
      c.openProfileEntryListDialog('Service History');
      c.openProfileEntryListDialog('Educational qualifications');
      c.openProfileEntryListDialog('Achievements');
      c.openProfileEntryListDialog('Other');
      expect([sh, eq, ac].map(s => s.mock.calls.length)).toEqual([1, 1, 1]);
    });

    it('list dialogs open the edit dialog with the selected entry', () => {
      const edit = jest.spyOn(c, 'openProfileEntryEditDialog').mockImplementation();
      dialog.open.mockReturnValue(closed({ id: 1 }));
      c.openServiceHistoryListDialog({});
      c.openEducationalQualificationsListDialog({});
      c.openAchievementsListDialog({});
      expect(edit).toHaveBeenCalledTimes(3);
    });

    it('achievement list dialog routes delete actions', () => {
      const del = jest.spyOn(c, 'openProfileEntryDeleteDialog').mockImplementation();
      dialog.open.mockReturnValue(closed({ action: 'delete', achievement: { id: 1 } }));
      c.openAchievementsListDialog({});
      expect(del).toHaveBeenCalledWith('Achievements', { id: 1 });
      dialog.open.mockReturnValue(closed({ action: 'delete' }));
      c.openAchievementsListDialog({});
      expect(del).toHaveBeenLastCalledWith('Achievements', {});
    });

    it('list dialogs ignore dismissed results', () => {
      const edit = jest.spyOn(c, 'openProfileEntryEditDialog').mockImplementation();
      dialog.open.mockReturnValue(closed(null));
      c.openServiceHistoryListDialog({});
      c.openEducationalQualificationsListDialog({});
      c.openAchievementsListDialog({});
      expect(edit).not.toHaveBeenCalled();
    });
  });

  describe('openProfileEntryEditDialog', () => {
    it('adds a new service history entry (default entry is synced)', async () => {
      const entry = { isDefaultEntry: true };
      dialog.open.mockReturnValue(closed({ orgName: 'o' }));
      const add = jest.spyOn(c, 'addProfileEntry').mockImplementation();
      await c.openProfileEntryEditDialog('Service History', entry);
      await flush();
      expect(add).toHaveBeenCalledWith(expect.anything(), 'Added Successfully', entry);
    });

    it('adds service history without a default entry and updates existing ones', async () => {
      dialog.open.mockReturnValue(closed({ orgName: 'o' }));
      const add = jest.spyOn(c, 'addProfileEntry').mockImplementation();
      const upd = jest.spyOn(c, 'updateProfileEntry').mockImplementation();
      await c.openProfileEntryEditDialog('Service History', { uuid: 'u' });
      await c.openProfileEntryEditDialog('Service History', {});
      await flush();
      expect(upd).toHaveBeenCalledTimes(1);
      expect(add).toHaveBeenCalledWith(expect.anything(), 'Added Successfully', null);
    });

    it('handles educational qualifications for new and existing entries', async () => {
      dialog.open.mockReturnValue(closed({ degree: 'BSc' }));
      const add = jest.spyOn(c, 'addProfileEntry').mockImplementation();
      const upd = jest.spyOn(c, 'updateProfileEntry').mockImplementation();
      await c.openProfileEntryEditDialog('Educational qualifications');
      await c.openProfileEntryEditDialog('Educational qualifications', { uuid: 'u' });
      await flush();
      expect(add).toHaveBeenCalledTimes(1);
      expect(upd).toHaveBeenCalledTimes(1);
    });

    it('handles achievements for new and existing entries', async () => {
      dialog.open.mockReturnValue(closed({ title: 't' }));
      const add = jest.spyOn(c, 'addAchievementEntry').mockImplementation();
      const upd = jest.spyOn(c, 'updateAchievementEntry').mockImplementation();
      await c.openProfileEntryEditDialog('Achievements');
      await c.openProfileEntryEditDialog('Achievements', { id: 1 });
      await flush();
      expect(add).toHaveBeenCalledTimes(1);
      expect(upd).toHaveBeenCalledTimes(1);
    });

    it('ignores dismissed dialogs', async () => {
      dialog.open.mockReturnValue(closed(null));
      const add = jest.spyOn(c, 'addProfileEntry').mockImplementation();
      await c.openProfileEntryEditDialog('Service History');
      await flush();
      expect(add).not.toHaveBeenCalled();
    });
  });

  describe('form body generators', () => {
    it('generateServiceHistoryFormBody strips display fields and keeps uuid', () => {
      const body = c.generateServiceHistoryFormBody({ showMore: 1, orgDetails: 2, period: 3, a: 1 }, { uuid: 'u' });
      expect(body.request.serviceHistory[0]).toEqual({ a: 1, uuid: 'u' });
      expect(c.generateServiceHistoryFormBody({}, null).request.serviceHistory[0].uuid).toBeUndefined();
    });

    it('generateEducationalQualificationsFormBody resolves other degree/institute', async () => {
      const body = await c.generateEducationalQualificationsFormBody({
        degree: 'Other', otherDegree: 'PhD', institutionName: 'Other', otherInstituteName: 'MIT'
      }, { uuid: 'u' });
      expect(body.request.educationalQualifications[0]).toEqual(expect.objectContaining({ degree: 'PhD', institutionName: 'MIT', uuid: 'u' }));
      expect(svc.updateDegree).toHaveBeenCalled();
      expect(svc.updateInstitution).toHaveBeenCalled();
    });

    it('generateEducationalQualificationsFormBody skips extra calls and rethrows failures', async () => {
      await c.generateEducationalQualificationsFormBody({ degree: 'BSc', institutionName: 'X' }, null);
      expect(svc.updateDegree).not.toHaveBeenCalled();
      svc.updateDegree.mockReturnValue(throwError(() => new Error('fail')));
      await expect(c.generateEducationalQualificationsFormBody({ degree: 'Other', otherDegree: 'D' }, null)).rejects.toThrow('fail');
      expect(snackBar.open).toHaveBeenCalled();
    });

    it('generateAchievementsFormBody adds the id when editing', () => {
      expect(c.generateAchievementsFormBody({ t: 1 }, { id: 5 }).request.id).toBe(5);
      expect(c.generateAchievementsFormBody({ t: 1 }, null).request.id).toBeUndefined();
    });
  });

  describe('entry persistence', () => {
    it('addProfileEntry refreshes entries or syncs the default entry', () => {
      const fetch = jest.spyOn(c, 'fetchProfileEntries').mockImplementation();
      c.addProfileEntry({});
      expect(fetch).toHaveBeenCalled();
      const entry: any = {};
      const sync = jest.spyOn(c, 'syncDefaultServiceHistoryEntry').mockImplementation();
      c.addProfileEntry({}, 'ok', entry);
      expect(sync).toHaveBeenCalled();
    });

    it('addProfileEntry resets the saving flag on errors', () => {
      svc.addEntriesToProfile.mockReturnValue(throwError(() => new Error('x')));
      const entry: any = {};
      c.addProfileEntry({}, 'ok', entry);
      expect(entry.isSaving).toBe(false);
      c.addProfileEntry({});
      expect(snackBar.open).toHaveBeenCalledTimes(2);
    });

    it('syncDefaultServiceHistoryEntry uses the created entry when it has a uuid', () => {
      const entry: any = { orgName: 'o' };
      c.syncDefaultServiceHistoryEntry(entry, { result: { response: { serviceHistory: [{ uuid: 'u', orgName: 'o' }] } } });
      expect(entry.uuid).toBe('u');
      expect(entry.isDefaultEntry).toBe(false);
    });

    it('syncDefaultServiceHistoryEntry falls back to listing persisted entries', () => {
      const entry: any = { orgName: ' Org ', designation: 'D' };
      svc.fetchProfileEntryList.mockReturnValue(of({
        result: { response: { serviceHistory: [{ uuid: 'u2', orgName: 'org', designation: 'd' }] } }
      }));
      c.syncDefaultServiceHistoryEntry(entry, {});
      expect(entry.uuid).toBe('u2');
      const other: any = { orgName: 'zzz' };
      c.syncDefaultServiceHistoryEntry(other, {});
      expect(other.uuid).toBeUndefined();
    });

    it('addAchievementEntry and updateAchievementEntry refresh achievements', () => {
      jest.useFakeTimers();
      const spy = jest.spyOn(c, 'getAchievements').mockImplementation();
      c.addAchievementEntry({});
      c.updateAchievementEntry({});
      jest.advanceTimersByTime(600);
      expect(spy).toHaveBeenCalledTimes(2);
      expect(events.raiseInteractTelemetry).toHaveBeenCalled();
    });

    it('achievement and entry writes report errors', () => {
      svc.createAchievementEntry.mockReturnValue(throwError(() => new Error('x')));
      svc.updateAchievementEntry.mockReturnValue(throwError(() => new Error('x')));
      svc.updateEntriesOfProfile.mockReturnValue(throwError(() => new Error('x')));
      svc.fetchProfileEntries.mockReturnValue(throwError(() => new Error('x')));
      c.addAchievementEntry({});
      c.updateAchievementEntry({});
      c.updateProfileEntry({});
      c.fetchProfileEntries();
      expect(snackBar.open).toHaveBeenCalledTimes(4);
    });

    it('updateProfileEntry and fetchProfileEntries refresh on success', () => {
      const patch = jest.spyOn(c, 'patchEntries').mockImplementation();
      jest.spyOn(c, 'getAchievements').mockImplementation();
      c.updateProfileEntry({});
      expect(patch).toHaveBeenCalled();
    });
  });

  describe('connections', () => {
    beforeEach(() => {
      c.primaryDetails = { firstname: 'F', departmentName: 'D' };
      jest.spyOn(c, 'getConnectionStatus').mockImplementation();
    });

    it('openConformationDialog picks the message and routes the confirmation', () => {
      const block = jest.spyOn(c, 'blockUser').mockImplementation();
      const upd = jest.spyOn(c, 'updateProfileConnection').mockImplementation();
      dialog.open.mockReturnValue(closed(true));
      ['Rejected', 'Withdrawn', 'Removed', 'Blocked', 'Other'].forEach(s => c.openConformationDialog(s));
      expect(block).toHaveBeenCalledTimes(1);
      expect(upd).toHaveBeenCalledTimes(4);
      dialog.open.mockReturnValue(closed(false));
      c.openConformationDialog('Blocked');
      expect(block).toHaveBeenCalledTimes(1);
    });

    it('blockUser succeeds, fails and skips without data', () => {
      c.blockUser();
      expect(snackBar.open).toHaveBeenCalledWith('User blocked successfully', 'X', expect.anything());
      svc.blockConnection.mockReturnValue(throwError(() => new Error('x')));
      c.blockUser();
      expect(snackBar.open).toHaveBeenLastCalledWith('Something went wrong please try again', 'X', expect.anything());
      c.primaryDetails = null;
      svc.blockConnection.mockClear();
      c.blockUser();
      expect(svc.blockConnection).not.toHaveBeenCalled();
    });

    it('updateProfileConnection covers each status', () => {
      ['Withdrawn', 'Unblocked', 'Removed', 'Other'].forEach(s => c.updateProfileConnection(s));
      expect(svc.updateConnectionRequest).toHaveBeenCalledTimes(4);
      expect(events.raiseInteractTelemetry).toHaveBeenCalledTimes(4);
      svc.updateConnectionRequest.mockReturnValue(throwError(() => new Error('x')));
      c.updateProfileConnection('Removed');
      expect(snackBar.open).toHaveBeenLastCalledWith('Something went wrong please try again', 'X', expect.anything());
      svc.updateConnectionRequest.mockReturnValue(of(null));
      c.updateProfileConnection('Removed');
    });

    it('sendConnectionRequest succeeds and fails', () => {
      c.sendConnectionRequest();
      expect(snackBar.open).toHaveBeenCalledWith('Connection request sent successfully', 'X', expect.anything());
      svc.connectToNetwork.mockReturnValue(throwError(() => new Error('x')));
      c.sendConnectionRequest();
      expect(snackBar.open).toHaveBeenLastCalledWith('Something went wrong while sending connection request', 'X', expect.anything());
    });

    it('copyProfileLink reports success and failure', async () => {
      await c.copyProfileLink();
      await flush();
      expect(snackBar.open).toHaveBeenCalledWith('Profile link copied to clipboard', 'X', expect.anything());
      (navigator.clipboard.writeText as jest.Mock).mockRejectedValueOnce(new Error('x'));
      c.copyProfileLink();
      await flush();
      expect(snackBar.open).toHaveBeenLastCalledWith('Failed to copy profile link', 'X', expect.anything());
    });
  });

  describe('insights', () => {
    it('getInsightsData builds nudges and weekly claps', () => {
      svc.getInsightsData.mockReturnValue(of({
        result: {
          response: {
            nudges: [{ label: 'a', growth: 'positive', progress: 5.4 }, { label: 'b', growth: 'negative', progress: 9 }, null],
            'weekly-claps': [1]
          }
        }
      }));
      c.getInsightsData();
      expect(c.insightsData.sliderData.sliderData).toEqual([
        { title: 'a', icon: 'arrow_upward', data: '+5%', colorData: 'color-green' },
        { title: 'b', icon: 'arrow_downward', data: '', colorData: 'color-red' }
      ]);
      expect(c.weeklyClapsData).toEqual([1]);
      expect(c.insightsDataLoading).toBe(false);
    });

    it('getInsightsData stops loading without a response or on error', () => {
      svc.getInsightsData.mockReturnValue(of({ result: {} }));
      c.getInsightsData();
      expect(c.insightsDataLoading).toBe(false);
      svc.getInsightsData.mockReturnValue(throwError(() => new Error('x')));
      c.getInsightsData();
      expect(c.insightsDataLoading).toBe(false);
    });
  });

  describe('telemetry and misc dialogs', () => {
    it('raiseTelemetry includes the subtype only when provided', () => {
      c.raiseTelemetry('u', 'id');
      expect(events.raiseInteractTelemetry.mock.calls[0][0].subType).toBeUndefined();
      c.raiseTelemetry('u', 'id', 'sub');
      expect(events.raiseInteractTelemetry.mock.calls[1][0].subType).toBe('sub');
    });

    it('raiseLearnerPassbookTelemetry and passbook redirect', () => {
      c.handleRedirectToCompetencyPassbook();
      expect(events.raiseInteractTelemetry.mock.calls[0][0].id).toBe('competency-passbook');
      expect(router.navigate).toHaveBeenCalledWith(['/page/competency-passbook/list']);
    });

    it('openProfileEntryDeleteDialog confirms and deletes achievements', () => {
      const del = jest.spyOn(c, 'deleteAchievement').mockImplementation();
      dialog.open.mockReturnValue(closed(true));
      c.openProfileEntryDeleteDialog('Achievements', { id: 3, contextData: { title: 'T' } });
      expect(del).toHaveBeenCalledWith({ request: { id: 3, contextType: 'achievements' } });
      const other = jest.spyOn(c, 'deleteProfileEntryCall').mockImplementation();
      c.openProfileEntryDeleteDialog('Other', {});
      expect(other).toHaveBeenCalled();
      del.mockClear();
      dialog.open.mockReturnValue(closed(false));
      c.openProfileEntryDeleteDialog('Achievements', { id: 3 });
      expect(del).not.toHaveBeenCalled();
    });

    it('deleteAchievement handles success, failure and errors', () => {
      jest.useFakeTimers();
      const spy = jest.spyOn(c, 'getAchievements').mockImplementation();
      c.deleteAchievement({});
      jest.advanceTimersByTime(600);
      expect(spy).toHaveBeenCalled();
      svc.deleteAchievementEntry.mockReturnValue(of({}));
      c.deleteAchievement({});
      svc.deleteAchievementEntry.mockReturnValue(throwError(() => new Error('x')));
      c.deleteAchievement({});
      expect(snackBar.open).toHaveBeenCalledTimes(3);
    });

    it('deleteProfileEntryCall handles success, failure and errors', () => {
      const fetch = jest.spyOn(c, 'fetchProfileEntries').mockImplementation();
      svc.deleteAchievementEntry.mockReturnValue(of({ result: { response: true } }));
      c.deleteProfileEntryCall({});
      expect(fetch).toHaveBeenCalled();
      svc.deleteAchievementEntry.mockReturnValue(of({}));
      c.deleteProfileEntryCall({});
      svc.deleteAchievementEntry.mockReturnValue(throwError(() => new Error('x')));
      c.deleteProfileEntryCall({});
      expect(snackBar.open).toHaveBeenCalledTimes(3);
    });

    it('handleEditMandatoryDetails opens the dialog', () => {
      dialog.open.mockReturnValue(closed(true));
      c.handleEditMandatoryDetails();
      expect(dialog.open).toHaveBeenCalled();
      dialog.open.mockReturnValue(closed(null));
      c.handleEditMandatoryDetails();
    });

    it('openNlwCertificateDialog ignores missing config', () => {
      c.nlwExperience = null;
      c.openNlwCertificateDialog();
      expect(dialog.open).not.toHaveBeenCalled();
    });

    it('openNlwCertificateDialog uses the api payload when configured', () => {
      c.nlwExperience = { banner: { pdfZoom: 'Z', onClick: { api: '/a', action: 'x', type: 'IMG', url: 'u' } } };
      c.openNlwCertificateDialog();
      const opts = dialog.open.mock.calls[0][1];
      expect(opts.data).toEqual(expect.objectContaining({ api: '/a', pdfZoom: 'Z', title: 'PM Appreciation Letter' }));
      expect(opts.width).toBe('700px');
    });

    it('openNlwCertificateDialog falls back to the language based pdf', () => {
      c.nlwExperience = { banner: { title: 'T', onClick: { action: 'x' } } };
      Object.defineProperty(window, 'innerWidth', { value: 500, configurable: true });
      c.openNlwCertificateDialog();
      expect(dialog.open.mock.calls[0][1].data.url).toBe('http://pdf');
      expect(dialog.open.mock.calls[0][1].width).toBe('90vw');
      Object.defineProperty(window, 'innerWidth', { value: 1200, configurable: true });
      c.openNlwCertificateDialog();
      expect(dialog.open.mock.calls[1][1].width).toBe('80vw');
    });
  });
});
