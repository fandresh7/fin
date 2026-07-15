import { Component, computed, inject, signal } from '@angular/core'
import { DecimalPipe } from '@angular/common'
import { Asset, AssetCategory, ASSET_CATEGORY_LABELS } from '../../core/assets/asset.model'
import { AssetsService } from '../../core/assets/assets.service'
import { ConfirmDialog } from '../../shared/components/confirm-dialog/confirm-dialog'
import { NavIcon, NavIconName } from '../../shared/components/nav-icon/nav-icon'
import { AssetForm } from './asset-form/asset-form'

const CATEGORY_ICONS: Record<AssetCategory, NavIconName> = {
  real_estate: 'home',
  vehicle: 'car',
  electronics: 'device',
  valuable: 'gem',
  other: 'tag'
}

interface CurrencyTotal {
  currency: string
  total: number
}

@Component({
  selector: 'app-patrimonio-page',
  imports: [AssetForm, ConfirmDialog, NavIcon, DecimalPipe],
  templateUrl: './patrimonio-page.html'
})
export class PatrimonioPage {
  protected readonly assetsService = inject(AssetsService)

  protected readonly categoryLabels = ASSET_CATEGORY_LABELS
  protected readonly categoryIcons = CATEGORY_ICONS

  protected readonly totalsByCurrency = computed<CurrencyTotal[]>(() => {
    const totals = new Map<string, number>()
    for (const asset of this.assetsService.assets()) {
      totals.set(asset.currency, (totals.get(asset.currency) ?? 0) + asset.currentValue)
    }
    return [...totals.entries()].map(([currency, total]) => ({ currency, total })).sort((a, b) => b.total - a.total)
  })

  protected readonly isFormOpen = signal(false)
  protected readonly editingAsset = signal<Asset | null>(null)
  protected readonly deletingAsset = signal<Asset | null>(null)
  protected readonly isDeleting = signal(false)

  constructor() {
    this.assetsService.load()
  }

  protected openCreateForm(): void {
    this.editingAsset.set(null)
    this.isFormOpen.set(true)
  }

  protected openEditForm(asset: Asset): void {
    this.editingAsset.set(asset)
    this.isFormOpen.set(true)
  }

  protected closeForm(): void {
    this.isFormOpen.set(false)
    this.editingAsset.set(null)
  }

  protected async handleDeleteConfirmed(): Promise<void> {
    const asset = this.deletingAsset()
    if (!asset) return

    this.isDeleting.set(true)
    try {
      await this.assetsService.remove(asset.id)
      this.deletingAsset.set(null)
    } finally {
      this.isDeleting.set(false)
    }
  }
}
