// <ms-icon name="shopping_cart" size="20"> — Material Symbols Outlined (acepta también nombres Lucide antiguos)
(function () {
  var MAP = { 'truck': 'local_shipping', 'package-search': 'package_2', 'menu': 'menu', 'snowflake': 'ac_unit', 'search': 'search', 'circle-user-round': 'account_circle', 'shopping-cart': 'shopping_cart', 'layout-grid': 'grid_view', 'chevron-down': 'expand_more', 'chevron-right': 'chevron_right', 'chevron-left': 'chevron_left', 'briefcase-business': 'badge', 'arrow-right': 'arrow_forward', 'arrow-left': 'arrow_back', 'house': 'home', 'air-vent': 'mode_fan', 'cylinder': 'heat_pump', 'zap': 'electrical_services', 'gauge': 'speed', 'cable': 'cable', 'wrench': 'handyman', 'package': 'inventory_2', 'shield-check': 'verified_user', 'hand-coins': 'payments', 'badge-check': 'verified', 'x': 'close', 'sliders-horizontal': 'tune', 'list': 'view_list', 'cloud-off': 'cloud_off', 'rotate-cw': 'refresh', 'zoom-in': 'zoom_in', 'circle-check': 'check_circle', 'triangle-alert': 'warning', 'circle-x': 'cancel', 'minus': 'remove', 'plus': 'add', 'badge-percent': 'sell', 'credit-card': 'credit_card', 'lock': 'lock', 'trash-2': 'delete', 'circle-alert': 'error', 'log-out': 'logout', 'map-pin': 'location_on', 'hard-hat': 'engineering', 'building-2': 'domain', 'landmark': 'account_balance', 'smartphone': 'smartphone', 'check': 'check', 'store': 'storefront', 'layout-dashboard': 'dashboard', 'receipt-text': 'receipt_long', 'users': 'group', 'user-plus': 'person_add', 'pencil': 'edit', 'trending-up': 'trending_up', 'wallet': 'account_balance_wallet' };
  var WGHT = { '1': 200, '1.25': 300, '1.5': 350 };
  class MsIcon extends HTMLElement {
    static get observedAttributes() { return ['name', 'size', 'stroke', 'fill']; }
    connectedCallback() {
      if (!this.shadowRoot) this.attachShadow({ mode: 'open' });
      if (!this.style.display) this.style.display = 'inline-flex';
      this.style.flexShrink = '0'; this.style.lineHeight = '1';
      this.render();
    }
    attributeChangedCallback() { this.render(); }
    render() {
      if (!this.shadowRoot) return;
      var raw = this.getAttribute('name') || 'inventory_2';
      var n = MAP[raw] || raw.replace(/-/g, '_');
      var s = (this.getAttribute('size') || '20') + 'px';
      var w = WGHT[this.getAttribute('stroke')] || 400, f = this.getAttribute('fill') ? 1 : 0;
      var el = document.createElement('span');
      el.setAttribute('aria-hidden', 'true');
      el.textContent = n;
      el.style.cssText = "font-family:'Material Symbols Outlined';font-weight:normal;font-style:normal;font-size:" + s + ";width:" + s + ";height:" + s + ";line-height:1;letter-spacing:normal;text-transform:none;display:inline-block;white-space:nowrap;word-wrap:normal;direction:ltr;overflow:hidden;-webkit-font-smoothing:antialiased;font-feature-settings:'liga';font-variation-settings:'FILL' " + f + ",'wght' " + w + ",'GRAD' 0,'opsz' 24";
      this.shadowRoot.replaceChildren(el);
    }
  }
  if (!customElements.get('ms-icon')) customElements.define('ms-icon', MsIcon);
})();
