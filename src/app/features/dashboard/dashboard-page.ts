import { Component, computed, inject } from '@angular/core'
import { DecimalPipe } from '@angular/common'
import { RouterLink } from '@angular/router'
import { AccountsService } from '../../core/accounts/accounts.service'
import { AssetsService } from '../../core/assets/assets.service'
import { AuthService } from '../../core/auth/auth.service'
import { Budget } from '../../core/budgets/budget.model'
import { BudgetsService } from '../../core/budgets/budgets.service'
import { CategoriesService } from '../../core/categories/categories.service'
import { TransactionsService } from '../../core/transactions/transactions.service'

interface CurrencyTotal {
  currency: string
  total: number
}

const RECENT_TRANSACTIONS_LIMIT = 6

function todayIso(): string {
  return new Date().toISOString().slice(0, 10)
}

function sumByCurrency(entries: { currency: string; amount: number }[]): CurrencyTotal[] {
  const totals = new Map<string, number>()
  for (const entry of entries) {
    totals.set(entry.currency, (totals.get(entry.currency) ?? 0) + entry.amount)
  }

  return [...totals.entries()]
    .filter(([, total]) => total !== 0)
    .map(([currency, total]) => ({ currency, total }))
    .sort((a, b) => b.total - a.total)
}

@Component({
  selector: 'app-dashboard-page',
  imports: [RouterLink, DecimalPipe],
  templateUrl: './dashboard-page.html'
})
export class DashboardPage {
  protected readonly auth = inject(AuthService)
  protected readonly accountsService = inject(AccountsService)
  protected readonly assetsService = inject(AssetsService)
  protected readonly budgetsService = inject(BudgetsService)
  protected readonly categoriesService = inject(CategoriesService)
  protected readonly transactionsService = inject(TransactionsService)

  protected readonly displayName = computed(() => this.auth.displayName() || this.auth.user()?.email)

  // Crypto exchange accounts have no fiat currency (their value lives in crypto_holdings, not
  // a single balance), so they're excluded here the same way Cuentas excludes them from balances.
  protected readonly balanceByCurrency = computed<CurrencyTotal[]>(() =>
    sumByCurrency(
      this.accountsService
        .accounts()
        .filter(account => account.currency)
        .map(account => ({ currency: account.currency as string, amount: account.balance }))
    )
  )

  protected readonly patrimonioByCurrency = computed<CurrencyTotal[]>(() => sumByCurrency(this.assetsService.assets().map(asset => ({ currency: asset.currency, amount: asset.currentValue }))))

  protected readonly currentBudgets = computed<Budget[]>(() => {
    const today = todayIso()
    return this.budgetsService
      .budgets()
      .filter(budget => budget.periodStart <= today && today <= budget.periodEnd)
      .sort((a, b) => b.spentAmount / b.amount - a.spentAmount / a.amount)
  })

  protected readonly recentTransactions = computed(() => this.transactionsService.transactions().slice(0, RECENT_TRANSACTIONS_LIMIT))

  protected readonly accountNameById = computed(() => new Map(this.accountsService.accounts().map(account => [account.id, account.name])))
  protected readonly categoryNameById = computed(() => new Map(this.categoriesService.categories().map(category => [category.id, category.name])))

  constructor() {
    this.accountsService.load()
    this.assetsService.load()
    this.budgetsService.load()
    this.categoriesService.load()
    this.transactionsService.load()
  }

  protected accountName(id: string): string {
    return this.accountNameById().get(id) ?? '—'
  }

  protected categoryName(id: string | null): string | null {
    if (!id) return null
    return this.categoryNameById().get(id) ?? null
  }

  protected progressPercent(budget: Budget): number {
    if (budget.amount <= 0) return 0
    return Math.min(100, Math.round((budget.spentAmount / budget.amount) * 100))
  }
}
