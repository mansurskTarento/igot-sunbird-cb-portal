import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core'
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog'
import { MatButtonModule } from '@angular/material/button'
import { MatCheckboxModule } from '@angular/material/checkbox'
import { MatIconModule } from '@angular/material/icon'
import { MatRadioModule } from '@angular/material/radio'
import { TranslateModule } from '@ngx-translate/core'
import { FilterConfig, FilterOption, SelectedFilters } from '@sunbird-cb/consumption'

export interface IPlansFilterMobileData {
  filterConfig: FilterConfig[]
  selectedFilters: SelectedFilters
}

/**
 * Mobile filter sheet: a rail of sections on the left, the active section's options on the
 * right, and Close / Apply at the bottom.
 *
 * Deliberately not FilterByComponent. That component emits on every tick of a checkbox,
 * which is right for a desktop panel sitting beside live results but wrong here — the mobile
 * design stages selections and commits them only on "Apply Filter". Sharing the FilterConfig
 * shape means both surfaces are still fed by one config built in the page component.
 */
@Component({
  selector: 'ws-app-plans-filter-mobile',
  templateUrl: './plans-filter-mobile.component.html',
  styleUrls: ['./plans-filter-mobile.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [MatButtonModule, MatCheckboxModule, MatIconModule, MatRadioModule, TranslateModule],
})
export class PlansFilterMobileComponent {
  private readonly dialogRef = inject(MatDialogRef<PlansFilterMobileComponent, SelectedFilters | undefined>)
  private readonly data = inject<IPlansFilterMobileData>(MAT_DIALOG_DATA)

  readonly sections = signal<FilterConfig[]>(this.data?.filterConfig ?? [])
  readonly activeKey = signal<string>(this.data?.filterConfig?.[0]?.key ?? '')

  /** Staged selections — a fresh copy, so dismissing the sheet changes nothing upstream. */
  readonly staged = signal<SelectedFilters>(
    Object.entries(this.data?.selectedFilters ?? {}).reduce<SelectedFilters>((acc, [key, values]) => {
      acc[key] = [...(values ?? [])]
      return acc
    },                                                                       {}))

  readonly activeSection = computed<FilterConfig | undefined>(() =>
    this.sections().find(section => section.key === this.activeKey()))

  readonly selectedCount = computed(() =>
    Object.values(this.staged()).reduce((total, values) => total + (values?.length ?? 0), 0))

  isSelected(sectionKey: string, option: FilterOption): boolean {
    return (this.staged()[sectionKey] ?? []).includes(option.name)
  }

  selectSection(key: string): void {
    this.activeKey.set(key)
  }

  onRadioChange(sectionKey: string, option: FilterOption): void {
    this.staged.update(current => ({ ...current, [sectionKey]: [option.name] }))
  }

  onCheckboxChange(sectionKey: string, option: FilterOption, checked: boolean): void {
    this.staged.update(current => {
      const values = new Set(current[sectionKey] ?? [])
      if (checked) {
        values.add(option.name)
      } else {
        values.delete(option.name)
      }
      const next = { ...current }
      if (values.size) {
        next[sectionKey] = Array.from(values)
      } else {
        delete next[sectionKey]
      }
      return next
    })
  }

  clearAll(): void {
    this.staged.set({})
  }

  apply(): void {
    this.dialogRef.close(this.staged())
  }

  close(): void {
    this.dialogRef.close(undefined)
  }
}
