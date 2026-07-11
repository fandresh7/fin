import { Component } from '@angular/core'

@Component({
  selector: 'app-design-system-page',
  templateUrl: './design-system-page.html'
})
export class DesignSystemPage {
  protected readonly colorGroups = [
    {
      title: 'Marca',
      swatches: [
        { name: 'Índigo medianoche', token: '--color-primary', hex: '#2E4B8F', on: 'light' },
        { name: 'Índigo oscuro', token: '--color-primary-dark', hex: '#223A72', on: 'light' },
        { name: 'Tinta', token: '--color-ink', hex: '#10182B', on: 'light' }
      ]
    },
    {
      title: 'Semánticos',
      swatches: [
        { name: 'Positivo', token: '--color-positive', hex: '#2E9E6B', on: 'light' },
        { name: 'Negativo', token: '--color-negative', hex: '#E0576B', on: 'light' },
        { name: 'Acento', token: '--color-accent', hex: '#C7D93E', on: 'dark' }
      ]
    },
    {
      title: 'Neutros',
      swatches: [
        { name: 'Fondo', token: '--color-paper', hex: '#F6F7FB', on: 'light' },
        { name: 'Superficie', token: '--color-surface', hex: '#FFFFFF', on: 'light' },
        { name: 'Borde', token: '--color-border', hex: '#E6E9F2', on: 'light' },
        { name: 'Texto tenue', token: '--color-muted', hex: '#6B7190', on: 'light' }
      ]
    }
  ]

  protected readonly typeScale = [
    { label: 'Display · 700', class: 'text-[52px] font-bold leading-none', sample: 'Tus finanzas, claras' },
    { label: 'Título · 700', class: 'text-[34px] font-bold leading-tight', sample: 'Resumen del mes' },
    { label: 'Subtítulo · 600', class: 'text-[22px] font-semibold leading-snug', sample: 'Gastos por categoría' },
    { label: 'Cuerpo · 400', class: 'text-lg font-normal leading-relaxed', sample: 'Registra tus movimientos y entiende hacia dónde va tu dinero cada mes.' },
    { label: 'Etiqueta · 500', class: 'text-sm font-medium tracking-wide text-muted uppercase', sample: 'Ingresos · Gastos · Ahorro' }
  ]

  protected readonly metrics = [
    { value: '$4,280', label: 'Ingresos este mes', tone: 'positive' },
    { value: '$2,915', label: 'Gastos este mes', tone: 'negative' },
    { value: '$1,365', label: 'Ahorro neto', tone: 'primary' }
  ]
}
