import { Component, inject, input, output, signal } from '@angular/core'
import { FormField, form, required, submit } from '@angular/forms/signals'
import { Category, CategoryInput, CategoryType } from '../../../core/categories/category.model'
import { CategoriesService } from '../../../core/categories/categories.service'

function buildModel(category: Category | null): CategoryInput {
  if (!category) return { name: '', type: 'expense' }
  return { name: category.name, type: category.type }
}

@Component({
  selector: 'app-category-form',
  imports: [FormField],
  template: `
    <div
      class="bg-ink/40 fixed inset-0 z-50 flex items-center justify-center px-4"
      (click)="cancelled.emit()">
      <div
        class="shadow-elevated border-border bg-surface w-full max-w-sm rounded-[22px] border p-7"
        (click)="$event.stopPropagation()">
        <h2 class="text-ink text-lg font-bold">{{ category() ? 'Editar categoría' : 'Nueva categoría' }}</h2>

        <form
          class="mt-6 flex flex-col gap-5"
          novalidate
          (submit)="handleSubmit($event)">
          <label class="flex flex-col gap-2">
            <span class="text-muted text-sm font-medium">Nombre</span>
            <input
              type="text"
              placeholder="Mascotas"
              [formField]="categoryForm.name"
              class="border-border bg-paper text-ink focus:border-primary focus:bg-surface w-full rounded-xl border px-4 py-3.5 text-base outline-none" />
            @if (categoryForm.name().touched() && categoryForm.name().invalid()) {
              <span class="text-negative text-sm">El nombre es obligatorio.</span>
            }
          </label>

          <div class="flex flex-col gap-2">
            <span class="text-muted text-sm font-medium">Tipo</span>
            <div class="bg-paper flex gap-2 rounded-full p-1">
              @for (option of typeOptions; track option.value) {
                <button
                  type="button"
                  (click)="setType(option.value)"
                  [class]="
                    model().type === option.value
                      ? 'bg-primary flex-1 rounded-full px-4 py-2 text-sm font-semibold text-white transition-colors duration-200'
                      : 'text-muted hover:text-ink flex-1 rounded-full px-4 py-2 text-sm font-semibold transition-colors duration-200'
                  ">
                  {{ option.label }}
                </button>
              }
            </div>
          </div>

          @if (errorMessage()) {
            <p class="bg-negative-soft text-negative rounded-lg px-3.5 py-2.5 text-sm">{{ errorMessage() }}</p>
          }

          <div class="mt-2 flex justify-end gap-3">
            <button
              type="button"
              (click)="cancelled.emit()"
              class="border-ink text-ink hover:bg-ink rounded-full border px-5 py-2.5 text-sm font-semibold transition-colors duration-300 hover:text-white">
              Cancelar
            </button>
            <button
              type="submit"
              [disabled]="isSubmitting()"
              class="bg-primary hover:bg-primary-dark rounded-full px-5 py-2.5 text-sm font-semibold text-white transition-colors duration-300 disabled:opacity-60">
              {{ isSubmitting() ? 'Guardando…' : 'Guardar' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  `
})
export class CategoryForm {
  private readonly categoriesService = inject(CategoriesService)

  readonly category = input<Category | null>(null)
  readonly saved = output<void>()
  readonly cancelled = output<void>()

  protected readonly typeOptions: { value: CategoryType; label: string }[] = [
    { value: 'expense', label: 'Gasto' },
    { value: 'income', label: 'Ingreso' }
  ]

  protected readonly model = signal<CategoryInput>(buildModel(this.category()))
  protected readonly categoryForm = form(this.model, path => {
    required(path.name, { message: 'El nombre es obligatorio' })
  })

  protected readonly errorMessage = signal<string | null>(null)
  protected readonly isSubmitting = signal(false)

  protected setType(type: CategoryType): void {
    this.model.update(current => ({ ...current, type }))
  }

  protected handleSubmit(event: Event): void {
    event.preventDefault()
    this.errorMessage.set(null)

    submit(this.categoryForm, async () => {
      this.isSubmitting.set(true)
      try {
        const existing = this.category()
        if (existing) {
          await this.categoriesService.update(existing.id, this.model())
        } else {
          await this.categoriesService.create(this.model())
        }
        this.saved.emit()
      } catch {
        this.errorMessage.set('No se pudo guardar la categoría. Puede que ya exista una igual.')
      } finally {
        this.isSubmitting.set(false)
      }
    })
  }
}
