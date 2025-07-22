import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core'
import { NsContent, IWidgetsPlayerMediaData, NsDiscussionForum } from '@sunbird-cb/collection'
import { NsWidgetResolver } from '@sunbird-cb/resolver'
import { ActivatedRoute } from '@angular/router'
import { ConfigurationsService } from '@sunbird-cb/utils-v2'
// import { MatSelectChange } from '@angular/material/select'

 interface ILanguageQueryParams {
    selectedMLCourse?: string
    selectedMLCourseCode?: string
  }

@Component({
  selector: 'viewer-youtube-container',
  templateUrl: './youtube.component.html',
  styleUrls: ['./youtube.component.scss'],
})
export class YoutubeComponent implements OnInit {
  @Input() isScreenSizeSmall = false
  @Input() isFetchingDataComplete = false
  @Input() forPreview = false
  @Input() youtubeData: NsContent.IContent | null = null
  @Input() widgetResolverYoutubeData: NsWidgetResolver.IRenderConfigWithTypedData<
    IWidgetsPlayerMediaData
  > | null = null
  @Input() discussionForumWidget: NsWidgetResolver.IRenderConfigWithTypedData<
    NsDiscussionForum.IDiscussionForumInput
  > | null = null
  @Input() isScreenSizeLtMedium = false
  @Input() isPreviewMode = false
  @Input() languageList: any = []
  selectedLanguage: any = null
  isTypeOfCollection = false
  isRestricted = false
  isMobile = false
    //  selectedLang: any = null
  //   languages = [
  //    { name: 'Hindi', localName: 'हिन्दी', code: 'hi' },
  //   { name: 'Tamil', localName: 'தமிழ்', code: 'ta' },
  //   { name: 'Telugu', localName: 'తెలుగు', code: 'te' },
  //   { name: 'Bengali', localName: 'বাংলা', code: 'bn' },
  //   { name: 'Marathi', localName: 'मराठी', code: 'mr' },
  //   { name: 'Gujarati', localName: 'ગુજરાતી', code: 'gu' },
  //   { name: 'Kannada', localName: 'ಕನ್ನಡ', code: 'kn' },
  //   { name: 'Malayalam', localName: 'മലയാളം', code: 'ml' },
  //   { name: 'Punjabi', localName: 'ਪੰਜਾਬੀ', code: 'pa' },
  //   { name: '', localName: 'English', code: 'en' },
  //   { name: 'Odia', localName: 'ଓଡ଼ିଆ', code: 'or' },
  //   { name: 'Assamese', localName: 'অসমীয়া', code: 'as' },
  //   { name: 'Konkani', localName: 'कोंकणी', code: 'kok' },
  //   { name: 'Sanskrit', localName: 'संस्कृतम्', code: 'sa' },
  //   { name: 'Maithili', localName: 'मैथिली', code: 'mai' }
  // ]
  // firstLang: any
  // remainingLang: any
  // selectedLanguage = 'en'
   dropdownOpen = false
   @Output() languageSelected = new EventEmitter<any>()
  constructor(private activatedRoute: ActivatedRoute, private configSvc: ConfigurationsService,
    // private dialog: MatDialog,
  ) { }

  ngOnInit() {
    if (window.innerWidth <= 1200) {
      this.isMobile = true
    } else {
      this.isMobile = false
    }
    if (this.configSvc.restrictedFeatures) {
      this.isRestricted =
        !this.configSvc.restrictedFeatures.has('disscussionForum')
    }
    this.isTypeOfCollection = this.activatedRoute.snapshot.queryParams.collectionType ? true : false

    this.getSelectedLanguage()
  }
  get getData() {
    return this.widgetResolverYoutubeData
  }

   toggleDropdown() {
    this.dropdownOpen = !this.dropdownOpen;
  }

    getSelectedLanguage() {
      console.log('getSelectedLanguage called')
  this.activatedRoute.queryParams.subscribe((params: ILanguageQueryParams) => {
    console.log('Query Params:', params) // Log all params
    if (params) {
      this.selectedLanguage =  {
        'name': params.selectedMLCourse?.toLowerCase() ,
        'id': params.selectedMLCourseCode?.toLowerCase(),
        'status': 'live'
      } 
  
    } else {
    //   let recentLang = this.enrolledCourseData?.recent_language
    //  let langObj = this.languageList?.filter((lang: any) => { lang?.name?.toLowerCase() === recentLang })
    //  this.selectedLanguage = langObj
    //  console.log(langObj, 'langObj')
    }
    console.log(this.selectedLanguage, 'selectedLang from query params on youtube component') // Log selected language
  })
}



//   onLanguageChange(event: MatSelectChange) {
//   console.log('Selected:', event.value);
// }

 onLanguageChange(lang: any) {
   this.languageSelected.emit(lang)
    this.selectedLanguage = lang
  }

}
