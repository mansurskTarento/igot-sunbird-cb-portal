import { NgModule } from '@angular/core'
import { Routes, RouterModule } from '@angular/router'
import { KarmayogiSaptahComponent } from './karmayogi-saptah/karmayogi-saptah.component'
import { NationalLearningWeekFormService } from './services/national-learning-week-form.service'
import { NationalLearningConfigService } from './services/national-learning-config.service'
import { SadhanaSaptahComponent } from './sadhana-saptah/sadhana-saptah.component'

const routes: Routes = [
    {
        path: 'karmayogi-saptah',
        component: KarmayogiSaptahComponent,
        data: {
            module: 'National Learning Week',
            pageId: 'app/learn/nlw/karmayogi-saptah',
            pageKey: 'karmayogi-saptah'
        },
        resolve: {
            formData: NationalLearningWeekFormService,
            configData: NationalLearningConfigService,
        },
    },
    {
        path: 'sadhana-saptah',
        component: SadhanaSaptahComponent,
        data: {
            module: 'National Learning Week',
            pageId: 'app/learn/nlw/sadhana-saptah',
            pageKey: 'sadhana-saptah',
        },
        resolve: {
            formData: NationalLearningWeekFormService
        },
    }
]

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule],
})
export class NationalLearningWeekRoutingModule { }
