import { Component, inject, input, linkedSignal, output, signal } from '@angular/core'
import { FormField, form, min, required, submit } from '@angular/forms/signals'
import { Asset, AssetCategory, AssetInput, ASSET_CATEGORY_LABELS } from '../../../core/assets/asset.model'
import { AssetsService } from '../../../core/assets/assets.service'

const CATEGORIES = Object.keys(ASSET_CATEGORY_LABELS) as AssetCategory[]
const CURRENCIES = ['COP', 'USD', 'USDT']

function todayIso(): string {
  return new Date().toISOString().slice(0, 10)
}

function buildModel(asset: Asset | null): AssetInput {
  if (!asset) {
    return { name: '', category: 'other', currentValue: 0, currency: 'COP', lastUpdatedAt: todayIso(), notes: '' }
  }

  return {
    name: asset.name,
    category: asset.category,
    currentValue: asset.currentValue,
    currency: asset.currency,
    lastUpdatedAt: asset.lastUpdatedAt,
    notes: asset.notes ?? ''
  }
}

@Component({
  selector: 'app-asset-form',
  imports: [FormField],
  template: `
    <div
      class="bg-ink/40 fixed inset-0 z-50 flex justify-end"
      (click)="cancelled.emit()">
      <div
        class="shadow-elevated bg-surface flex h-full w-full max-w-md flex-col overflow-y-auto p-8"
        (click)="$event.stopPropagation()">
        <span class="text-primary text-[13px] font-semibold tracking-[0.22em] uppercase">{{ asset() ? 'Editar activo' : 'Nuevo activo' }}</span>
        <h1 class="text-ink mt-2 text-[26px] font-bold">{{ asset()?.name || 'Agrega un activo' }}</h1>

        <form
          class="mt-8 flex flex-1 flex-col gap-5"
          novalidate
          (submit)="handleSubmit($event)">
          <label class="flex flex-col gap-2">
            <span class="text-muted text-sm font-medium">Nombre</span>
            <input
              type="text"
              placeholder="Casa, carro, portátil…"
              [formField]="assetForm.name"
              class="border-border bg-paper text-ink focus:border-primary focus:bg-surface w-full rounded-xl border px-4 py-3.5 text-base outline-none" />
            @if (assetForm.name().touched() && assetForm.name().invalid()) {
              <span class="text-negative text-sm">El nombre es obligatorio.</span>
            }
          </label>

          <label class="flex flex-col gap-2">
            <span class="text-muted text-sm font-medium">Categoría</span>
            <select
              [formField]="assetForm.category"
              class="border-border bg-paper text-ink focus:border-primary focus:bg-surface w-full rounded-xl border px-4 py-3.5 text-base outline-none">
              @for (category of categories; track category) {
                <option [value]="category">{{ categoryLabels[category] }}</option>
              }
            </select>
          </label>

          <div class="flex gap-4">
            <label class="flex flex-1 flex-col gap-2">
              <span class="text-muted text-sm font-medium">Valor actual</span>
              <input
                type="number"
                step="1000"
                [formField]="assetForm.currentValue"
                class="border-border bg-paper text-ink focus:border-primary focus:bg-surface w-full rounded-xl border px-4 py-3.5 text-base outline-none" />
              @if (assetForm.currentValue().touched() && assetForm.currentValue().invalid()) {
                <span class="text-negative text-sm">El valor no puede ser negativo.</span>
              }
            </label>
            <label class="flex flex-col gap-2">
              <span class="text-muted text-sm font-medium">Moneda</span>
              <select
                [formField]="assetForm.currency"
                class="border-border bg-paper text-ink focus:border-primary focus:bg-surface w-full rounded-xl border px-4 py-3.5 text-base outline-none">
                @for (currency of currencies; track currency) {
                  <option [value]="currency">{{ currency }}</option>
                }
              </select>
            </label>
          </div>

          <label class="flex flex-col gap-2">
            <span class="text-muted text-sm font-medium">Última actualización</span>
            <input
              type="date"
              [formField]="assetForm.lastUpdatedAt"
              class="border-border bg-paper text-ink focus:border-primary focus:bg-surface w-full rounded-xl border px-4 py-3.5 text-base outline-none" />
            <span class="text-muted text-xs">Cuando revalúes este activo, actualiza esta fecha junto con el valor.</span>
          </label>

          <label class="flex flex-col gap-2">
            <span class="text-muted text-sm font-medium">Notas (opcional)</span>
            <input
              type="text"
              [formField]="assetForm.notes"
              class="border-border bg-paper text-ink focus:border-primary focus:bg-surface w-full rounded-xl border px-4 py-3.5 text-base outline-none" />
          </label>

          @if (errorMessage()) {
            <p class="bg-negative-soft text-negative rounded-lg px-3.5 py-2.5 text-sm">{{ errorMessage() }}</p>
          }

          <div class="mt-auto flex gap-3 pt-6">
            <button
              type="button"
              (click)="cancelled.emit()"
              class="border-ink text-ink hover:bg-ink flex-1 rounded-full border px-6 py-3.5 text-base font-semibold transition-colors duration-300 hover:text-white">
              Cancelar
            </button>
            <button
              type="submit"
              [disabled]="isSubmitting()"
              class="bg-primary hover:bg-primary-dark flex-1 rounded-full px-6 py-3.5 text-base font-semibold text-white transition-colors duration-300 disabled:opacity-60">
              {{ isSubmitting() ? 'Guardando…' : 'Guardar' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  `
})
export class AssetForm {
  private readonly assetsService = inject(AssetsService)

  readonly asset = input<Asset | null>(null)
  readonly saved = output<void>()
  readonly cancelled = output<void>()

  protected readonly categories = CATEGORIES
  protected readonly currencies = CURRENCIES
  protected readonly categoryLabels = ASSET_CATEGORY_LABELS

  protected readonly model = linkedSignal<AssetInput>(() => buildModel(this.asset()))
  protected readonly assetForm = form(this.model, path => {
    required(path.name, { message: 'El nombre es obligatorio' })
    min(path.currentValue, 0, { message: 'El valor no puede ser negativo' })
    required(path.lastUpdatedAt, { message: 'La fecha es obligatoria' })
  })

  protected readonly errorMessage = signal<string | null>(null)
  protected readonly isSubmitting = signal(false)

  protected handleSubmit(event: Event): void {
    event.preventDefault()
    this.errorMessage.set(null)

    submit(this.assetForm, async () => {
      const input = this.model()

      this.isSubmitting.set(true)
      try {
        const existing = this.asset()
        if (existing) {
          await this.assetsService.update(existing.id, input)
        } else {
          await this.assetsService.create(input)
        }
        this.saved.emit()
      } catch {
        this.errorMessage.set('No se pudo guardar el activo. Intenta de nuevo.')
      } finally {
        this.isSubmitting.set(false)
      }
    })
  }
}
