import { CommonModule } from '@angular/common'
import { NgModule } from '@angular/core'
import { EditorSharedModule } from '../../../shared/shared.module'
import { FileUploadComponent } from './components/file-upload/file-upload.component'
import { UploadComponent } from './components/upload/upload.component'
import { UploadRoutingModule } from './upload-routing.module'
import { ProfanityPopUpComponent } from './components/profanity-popup/profanity-popup'
import { ProfanityService } from './services/profanity.service'
import { MatProgressBarModule } from '@angular/material/progress-bar'
import { SharedModule } from '../../../../../../modules/shared/shared.module'
import { AuthViewerModule } from '../../../../../../modules/viewer/viewer.module'

@NgModule({
    declarations: [UploadComponent, FileUploadComponent, ProfanityPopUpComponent],
    exports: [FileUploadComponent, ProfanityPopUpComponent],
    imports: [CommonModule, SharedModule, EditorSharedModule, UploadRoutingModule, AuthViewerModule, MatProgressBarModule],
    providers: [ProfanityService],
})
export class UploadModule { }
