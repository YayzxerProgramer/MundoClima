import type { CSSProperties } from 'react'

// Igual que ms-icon.js del diseño: Material Symbols Outlined, aceptando los nombres Lucide antiguos.
const MAP: Record<string, string> = {
  truck: 'local_shipping', 'package-search': 'package_2', snowflake: 'ac_unit', 'circle-user-round': 'account_circle',
  'shopping-cart': 'shopping_cart', 'layout-grid': 'grid_view', 'chevron-down': 'expand_more', 'chevron-right': 'chevron_right',
  'chevron-left': 'chevron_left', 'briefcase-business': 'badge', 'arrow-right': 'arrow_forward', 'arrow-left': 'arrow_back',
  house: 'home', 'air-vent': 'mode_fan', cylinder: 'heat_pump', zap: 'electrical_services', gauge: 'speed', wrench: 'handyman',
  package: 'inventory_2', 'shield-check': 'verified_user', 'hand-coins': 'payments', 'badge-check': 'verified', x: 'close',
  'sliders-horizontal': 'tune', list: 'view_list', 'cloud-off': 'cloud_off', 'rotate-cw': 'refresh', 'zoom-in': 'zoom_in',
  'circle-check': 'check_circle', 'triangle-alert': 'warning', 'circle-x': 'cancel', minus: 'remove', plus: 'add',
  'badge-percent': 'sell', 'credit-card': 'credit_card', 'trash-2': 'delete', 'circle-alert': 'error', 'log-out': 'logout',
  'map-pin': 'location_on', 'hard-hat': 'engineering', 'building-2': 'domain', landmark: 'account_balance', store: 'storefront',
}
const PESO: Record<string, number> = { '1': 200, '1.25': 300, '1.5': 350 }

interface Props {
  name: string
  size?: number
  stroke?: '1' | '1.25' | '1.5'
  fill?: boolean
  className?: string
  style?: CSSProperties
}

export function Icon({ name, size = 20, stroke, fill, className, style }: Props) {
  const glyph = MAP[name] ?? name.replace(/-/g, '_')
  return (
    <span
      aria-hidden="true"
      className={className}
      style={{
        fontFamily: "'Material Symbols Outlined'",
        fontWeight: 'normal',
        fontStyle: 'normal',
        fontSize: size,
        width: size,
        height: size,
        lineHeight: 1,
        letterSpacing: 'normal',
        textTransform: 'none',
        display: 'inline-block',
        flexShrink: 0,
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        direction: 'ltr',
        WebkitFontSmoothing: 'antialiased',
        fontFeatureSettings: "'liga'",
        fontVariationSettings: `'FILL' ${fill ? 1 : 0}, 'wght' ${stroke ? PESO[stroke] : 400}, 'GRAD' 0, 'opsz' 24`,
        ...style,
      }}
    >
      {glyph}
    </span>
  )
}
