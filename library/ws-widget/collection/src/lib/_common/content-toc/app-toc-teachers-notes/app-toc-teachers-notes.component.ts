import { Component, OnInit } from '@angular/core'

@Component({
  selector: 'ws-widget-app-toc-teachers-notes',
  templateUrl: './app-toc-teachers-notes.component.html',
  styleUrls: ['./app-toc-teachers-notes.component.scss'],
})

export class AppTocTeachersNotesComponent implements OnInit {

  teacherNotes: any = [
    {
      title: "W3schools PDF 1",
      url: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf"
    },
    {
      title: "Antennahouse PDF 2",
      url: "https://www.antennahouse.com/hubfs/xsl-fo-sample/pdf/basic-link-1.pdf"
    },
    {
      title: "Adobe PDF sample file",
      url: "https://www.adobe.com/support/products/enterprise/knowledgecenter/media/c4611_sample_explain.pdf"
    }
  ]
  constructor(
  ) {

    
  }

  ngOnInit() {}

  downloadPDF(object: any) {
    console.log("Object", object)
    const link = document.createElement('a')
    link.href = object.url
    link.download = `${object.title}.pdf`
    link.click()
  }

}