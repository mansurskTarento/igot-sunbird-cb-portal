import { Component, Input, OnInit } from '@angular/core'
import { MatDialog } from '@angular/material/dialog'
import { MatLegacySnackBar } from '@angular/material/legacy-snack-bar'
import { Router } from '@angular/router'
import { ConfigurationsService } from '@sunbird-cb/utils-v2'
import { AppTocService } from '@ws/app/src/lib/routes/app-toc/services/app-toc.service'
import { environment } from 'src/environments/environment'
import { AssignmentViewerComponent } from '../app-toc-assignment-viewer/app-toc-assignment-viewer.component'
import { ConfirmationDialogComponent } from '@sunbird-cb/consumption'
import { MatLegacyDialog } from '@angular/material/legacy-dialog'
import * as _ from 'lodash'

@Component({
  selector: 'ws-widget-app-batch-assignments',
  templateUrl: './app-toc-batch-assignments.component.html',
  styleUrls: ['./app-toc-batch-assignments.component.scss'],
})

export class AppTocBatchAssignmentsComponent implements OnInit {

  @Input() content: any
  @Input() batchId: any
  assignments: any[] = []
  allowType: string[] = ['.pdf', '.doc', '.docx']
  fileExtention: any
  resourceFileAdded: any
  isLoading: boolean = false
  selectedAssignment: any


  constructor(public router: Router,
    private snackBar: MatLegacySnackBar,
    public tocSvc: AppTocService,
    public configSvc: ConfigurationsService,
    private dialog: MatDialog,
    private dialogLegacy: MatLegacyDialog,
  ) { }

  ngOnInit() {
    this.fetchAssignments()
  }

  fetchAssignments() {
    const payload: any = {
      query: '',
      filters: {
        "additionalProperties.batchId": this.batchId,
      },
    }
    this.tocSvc.searchAssignments(payload).subscribe((response: any) => {
      let assignments = _.get(response, 'result.response.content', [])
      console.log('this.assignmentsList', this.assignments)
      this.assignments = assignments.map((assignment: any) => ({
        ...assignment,
        expand: false,
        downloading: false,
      }))
    }, error => {
      console.error('Error fetching assignments', error)
    })
  }

  handleViewFeedback(assignment: any) {
    assignment.expand = true
  }

  downloadFile(assignment: any) {
    assignment.downloading = true
    this.downloadFileWithFetch(assignment)
  }

  downloadFileDirectly(assignment: any) {
    if (assignment.additionalProperties.assignmentUrl) {
      window.open(assignment.additionalProperties.assignmentUrl, '_blank')
      assignment.downloading = false
    }
  }

  async downloadFileWithFetch(assignment: any) {
    if (!assignment.additionalProperties.assignmentUrl) return
    try {
      const response = await fetch(assignment.additionalProperties.assignmentUrl)
      if (!response.ok) {
        throw new Error('Network response was not ok')
      }
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = this.extractFilenameFromUrl(assignment.additionalProperties.assignmentUrl) || `${assignment.title}.pdf`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
      assignment.downloading = false
    } catch (error) {
      console.error('Download failed:', error)
      this.downloadFileDirectly(assignment)
    }
  }


  triggerFileUpload(assignment: any) {
    if (assignment.answerURL) {
      this.selectedAssignment = assignment
      this.submitAssignment(assignment)
    } else {
      const fileInput = document.getElementById('sResourceFile') as HTMLInputElement;
      if (fileInput) {
        fileInput.click();
      }
    }

  }

  submitAssignment(assessment: any) {
    console.log('Submit assignment clicked', assessment)
    const dialgoData = {
      description: 'You have already uploaded an assignment. Choose an option below to either keep your current submission or upload a new file.',
      type: 'warning',
      buttonsPositionClass: 'justify-center items-center',
      buttons: [
        {
          classes: 'btn-out-line',
          text: 'Re-upload',
          response: 0
        },
        {
          classes: 'succes-button',
          text: 'Keep Submission',
          response: 1
        }
      ]
    }
    const dialogRef = this.dialogLegacy.open(ConfirmationDialogComponent, {
      data: dialgoData,
      disableClose: true,
      width: '400px',
      maxWidth: '90vw'
    })

    dialogRef.afterClosed().subscribe((result: any) => {
      if (result === 1) {
        this.viewAssignments(assessment.answerURL)
      } else if (result === 0) {
        const fileInput = document.getElementById('sResourceFile') as HTMLInputElement;
        if (fileInput) {
          fileInput.click()
        }
      }
    })
  }

  fileInputEmit(fileInput: FileList | null, assignment: any): void {
    if (!fileInput || fileInput.length === 0) {
      return
    }
    const file = fileInput[0]
    if (this.checkFileType(file)) {
      this.createResource(file, assignment)
    }
  }

  getRandomNumber() {
    let randomNumber = ''
    // tslint:disable-next-line: no-increment-decrement
    for (let i = 0; i < 16; i++) {
      randomNumber += Math.floor(Math.random() * 10)
    }
    return randomNumber
  }

  getMimeType() {
    if (this.fileExtention === '.pdf') {
      return 'application/pdf'
    } else if (this.fileExtention === '.doc' || this.fileExtention === '.docx') {
      return 'application/msword'
    } else if (this.fileExtention === '.mp4') {
      return 'video/mp4'
    } else if (this.fileExtention === '.mp3') {
      return 'audio/mpeg'
    } else {
      return 'application/octet-stream'
    }
  }

  constructPayload() {
    let requestBody: any
    if (this.configSvc.userProfile) {
      requestBody = {
        request: {
          content: {
            code: this.getRandomNumber(),
            contentType: 'Resource',
            createdBy: this.configSvc.userProfile.userId,
            createdFor: [this.configSvc.userProfile.rootOrgId ? this.configSvc.userProfile.rootOrgId : ''],
            creator: this.configSvc.userProfile.userName ? this.configSvc.userProfile.userName : '',
            // description: '',
            duration: '90',
            framework: 'igot',
            mimeType: this.getMimeType(),
            name: this.selectedAssignment.title,
            organisation: [this.configSvc.userProfile.departmentName ? this.configSvc.userProfile.departmentName : ''],
            isExternal: false,
            primaryCategory: 'Learning Resource',
            license: 'CC BY 4.0',
            ownershipType: ['createdFor'],
            purpose: '',
            visibility: 'Default',
            language: ["English"],
            resourceCategory: 'Learning Resource',
            resourceType: ''
          },
        }
      }
      return requestBody
    }
  }



  async createResource(file: File, assignment: any): Promise<void> {
    this.resourceFileAdded = file
    this.selectedAssignment = assignment
    let requestBody = this.constructPayload()
    this.isLoading = true
    const createRes: any = await this.tocSvc.createContentV2(requestBody).toPromise().catch(async (_error: any) => {
      this.openSnackbar('File Type Should be Correct')
    })
    if (createRes) {
      let resData: any = await this.tocSvc.readContentV2(createRes).toPromise().catch((_error: any) => { })
      if (resData && resData.identifier) {
        await this.uploadResourceFile(createRes, resData)
      }
    } else {
      this.isLoading = false
    }
  }

  async uploadResourceFile(identifier: string, resData: any) {
    const formdata = new FormData()
    formdata.append('content', this.resourceFileAdded, this.resourceFileAdded.name)
    const uploadImgRes: any = await this.tocSvc.upload(
      formdata,
      {
        contentId: identifier,
        contentType:
          this.resourceFileAdded.type === 'application/pdf'
            ? '/artifacts'
            : this.resourceFileAdded.type === 'application/vnd.ekstep.html-archive'
              ? '/web-hosted'
              : '/assets',
      },
      this.resourceFileAdded.type === 'application/vnd.ekstep.html-archive',
    ).toPromise().catch((_error: any) => {
    })
    if (uploadImgRes && uploadImgRes.params && uploadImgRes.params.status.toLowerCase() === 'successful') {
      const requestPayload: any = {
        request: {
          content: {
            artifactUrl: this.generateUrl(uploadImgRes.result.artifactUrl),
            downloadUrl: this.generateUrl(uploadImgRes.result.artifactUrl),
            size: this.resourceFileAdded.size,
            versionKey: resData.versionKey,
          },
        },
      }
      await this.updateResourceContent(identifier, requestPayload)
    } else {
      this.isLoading = false
    }
  }

  async updateResourceContent(identifier: string, requestPayload: any) {
    const updateRes = await this.tocSvc.updateContentWithFewFields(requestPayload, identifier).toPromise().catch((_error: any) => { })
    if (updateRes && updateRes.params && updateRes.params.status === 'successful') {
      this.openSnackbar('File uploaded successfully')
      this.viewAssignments(requestPayload.request.content.artifactUrl)
      this.resourceFileAdded = ''
      this.isLoading = false
    } else {
      this.isLoading = false
      this.openSnackbar('File update failed.')
    }
  }

  viewAssignments(downlaodUrl: any) {
    const dialogRef = this.dialog.open(AssignmentViewerComponent, {
      width: '40%',
      disableClose: true,
      panelClass: 'dialog_sidenav',
      data: {
        assessment: this.selectedAssignment,
        url: downlaodUrl
      }
    })
    dialogRef.afterClosed().subscribe(result => {
      console.log(result)
    })
  }

  generateUrl(oldUrl: string) {
    const chunk = oldUrl ? oldUrl.split('/') : []
    const newChunk = environment.azureHost.split('/')
    const newLink = []
    for (let i = 0; i < chunk.length; i += 1) {
      if (i === 2) {
        newLink.push(newChunk[i])
      } else if (i === 3) {
        newLink.push(environment.azureBucket)
      } else {
        newLink.push(chunk[i])
      }
    }
    const newUrl = newLink.join('/')
    return newUrl
  }


  checkFileType(file: File) {
    let flag = false
    if (file && file.size) {
      const fileInMB = Math.floor(file.size / (1024 * 1024))
      if (fileInMB > 1024) {
        return false
      }
    }
    if (file && this.allowType && this.allowType.length > 0) {
      this.allowType.forEach((ele: any) => {
        if (file.name.toLowerCase().endsWith(ele)) {
          flag = true
        }
      })
    }
    if (!flag) {
      this.openSnackbar('Invalid file type uploaded. Please upload supporting format only.')
    }
    this.fileExtention = file.name.toLowerCase().substring(file.name.lastIndexOf('.'))
    if (file) {
      if (['.doc', '.docx', '.pdf'].includes(this.fileExtention)) {
        flag = true
      } else {
        flag = false
      }
      if (!flag) {
        this.openSnackbar('Invalid file type uploaded. Please upload PDF or Doc format only.')
      }
    }
    return flag
  }

  private openSnackbar(primaryMsg: string, duration: number = 5000) {
    this.snackBar.open(primaryMsg, 'X', {
      duration,
    })
  }
  private extractFilenameFromUrl(url: string): string {
    try {
      const urlParts = url.split('/')
      const filename = urlParts[urlParts.length - 1]
      return filename.includes('.') ? filename : ''
    } catch (error) {
      return ''
    }
  }
}
