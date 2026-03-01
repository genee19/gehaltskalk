<script lang="ts">
  import { calculateTaxes, calculateGrossFromNet } from './lib/tax-logic';
  import type { TaxSettings } from './lib/tax-logic';
  import FinancialInput from './lib/FinancialInput.svelte';

  // State: Settings
  let settings = $state<TaxSettings>({
    taxClass: 1,
    churchTax: false,
    kvType: 'public',
    kvAddOn: 2.9, // 2026 average Zusatzbeitrag
    kvPrivateAmount: 0,
    hasChildren: false,
    childCount: 0,
    state: 'west',
    age: 30
  });

  let hoursPerWeek = $state(40);

  // Source of Truth
  let grossYearly = $state(50000);

  // Derived Values
  let grossMonthly = $derived(grossYearly / 12);
  let grossHourly = $derived(grossYearly / 52 / hoursPerWeek);

  let result = $derived(calculateTaxes(grossYearly, settings));
  
  let netYearly = $derived(result.netYearly);
  let netMonthly = $derived(result.netYearly / 12);
  let netHourly = $derived(result.netYearly / 52 / hoursPerWeek);

  // Update Handlers
  function updateFromGrossYearly(val: number) {
    grossYearly = val;
  }
  
  function updateFromGrossMonthly(val: number) {
    grossYearly = val * 12;
  }
  
  function updateFromGrossHourly(val: number) {
    grossYearly = val * 52 * hoursPerWeek;
  }

  function updateFromNetYearly(val: number) {
    grossYearly = calculateGrossFromNet(val, settings);
  }

  function updateFromNetMonthly(val: number) {
    grossYearly = calculateGrossFromNet(val * 12, settings);
  }

  function updateFromNetHourly(val: number) {
    const targetNetYearly = val * 52 * hoursPerWeek;
    grossYearly = calculateGrossFromNet(targetNetYearly, settings);
  }

  // UI Helpers
  let settingsSummary = $derived.by(() => {
    const parts = [
      `${hoursPerWeek}h/week`,
      `Class ${['I','II','III','IV','V','VI'][settings.taxClass - 1]}`,
      `Age ${settings.age}`,
      settings.hasChildren ? `${settings.childCount} Child(ren)` : 'No Children',
      settings.state === 'west' ? 'West' : 'East',
      settings.churchTax ? 'Church Tax' : 'No Church Tax'
    ];
    return parts.join(' • ');
  });

</script>

<main class="container">
  <h1>🇩🇪 Gehalts&shy;rechner 2026</h1>
  
  <!-- Settings Section -->
  <details class="settings-section">
    <summary class="settings-summary">
      <span class="summary-details">{settingsSummary}</span>
      <span class="toggle-icon">▼</span>
    </summary>

    <div class="settings-panel">
      <div class="setting-item">
        <label for="hours-week">Hours/Week</label>
        <input id="hours-week" type="number" bind:value={hoursPerWeek} />
      </div>
      <div class="setting-item">
        <label for="tax-class">Tax Class</label>
        <select id="tax-class" bind:value={settings.taxClass}>
          <option value={1}>I</option>
          <option value={2}>II</option>
          <option value={3}>III</option>
          <option value={4}>IV</option>
          <option value={5}>V</option>
          <option value={6}>VI</option>
        </select>
      </div>
      <div class="setting-item">
        <label for="age">Age</label>
        <input id="age" type="number" bind:value={settings.age} />
      </div>
      <div class="setting-item checkbox-item">
        <input id="has-children" type="checkbox" bind:checked={settings.hasChildren} />
        <label for="has-children">Children</label>
        {#if settings.hasChildren}
          <input type="number" min="0" bind:value={settings.childCount} placeholder="Count" class="child-count"/>
        {/if}
      </div>
      <div class="setting-item">
        <label for="region">Region</label>
        <select id="region" bind:value={settings.state}>
          <option value="west">West Germany</option>
          <option value="east">East Germany</option>
        </select>
      </div>
      <div class="setting-item checkbox-item">
        <input id="church-tax" type="checkbox" bind:checked={settings.churchTax} />
        <label for="church-tax">Church Tax</label>
      </div>
      <div class="setting-item">
        <label for="health-ins">Health Insurance</label>
        <select id="health-ins" bind:value={settings.kvType}>
          <option value="public">Public (GKV)</option>
          <option value="private">Private (PKV)</option>
        </select>
      </div>
      <div class="setting-item">
        {#if settings.kvType === 'public'}
          <label for="kv-addon">Add-on %</label>
          <input id="kv-addon" type="number" step="0.1" bind:value={settings.kvAddOn} />
        {:else}
          <label for="kv-private">Monthly €</label>
          <input id="kv-private" type="number" bind:value={settings.kvPrivateAmount} />
        {/if}
      </div>
    </div>
  </details>

  <!-- Calculator Grid -->
  <div class="calculator-grid">
    <div class="column">
      <h2>Gross (Brutto)</h2>
      <div class="input-group">
        <label>Yearly</label>
        <div class="input-wrapper">
          <FinancialInput bind:value={grossYearly} onchange={updateFromGrossYearly} />
          <span>€</span>
        </div>
      </div>
      <div class="input-group">
        <label>Monthly</label>
        <div class="input-wrapper">
          <FinancialInput value={grossMonthly} onchange={updateFromGrossMonthly} />
          <span>€</span>
        </div>
      </div>
      <div class="input-group">
        <label>Hourly</label>
        <div class="input-wrapper">
          <FinancialInput value={grossHourly} onchange={updateFromGrossHourly} />
          <span>€</span>
        </div>
      </div>
    </div>

    <div class="column">
      <h2>Net (Netto)</h2>
      <div class="input-group">
        <label>Yearly</label>
        <div class="input-wrapper">
          <FinancialInput value={netYearly} onchange={updateFromNetYearly} />
          <span>€</span>
        </div>
      </div>
       <div class="input-group">
        <label>Monthly</label>
        <div class="input-wrapper">
          <FinancialInput value={netMonthly} onchange={updateFromNetMonthly} />
          <span>€</span>
        </div>
      </div>
       <div class="input-group">
        <label>Hourly</label>
        <div class="input-wrapper">
          <FinancialInput value={netHourly} onchange={updateFromNetHourly} />
          <span>€</span>
        </div>
      </div>
    </div>
  </div>

  <a href="https://buymeacoffee.com/genee19" target="_blank" class="donate-btn">
    🧾 Buy me a coffee
  </a>

  <p class="disclaimer">The numbers shown are an estimation and may not be taken as financial advice.</p>

  <!-- Breakdown -->
  <div class="breakdown">
    <h3>Tax Breakdown (Yearly)</h3>
    <div class="row">
      <span>Lohnsteuer:</span> <span>{result.taxes.lohnsteuer.toFixed(2)} €</span>
    </div>
    <div class="row">
      <span>Soli:</span> <span>{result.taxes.soli.toFixed(2)} €</span>
    </div>
    <div class="row">
      <span>Church Tax:</span> <span>{result.taxes.church.toFixed(2)} €</span>
    </div>
    
    <h3>Social Security (Employee)</h3>
    <div class="row">
      <span>Pension (RV):</span> <span>{result.social.rv.toFixed(2)} €</span>
    </div>
    <div class="row">
      <span>Unemployment (AV):</span> <span>{result.social.av.toFixed(2)} €</span>
    </div>
    <div class="row">
      <span>Health (KV):</span> <span>{result.social.kv.toFixed(2)} €</span>
    </div>
    <div class="row">
      <span>Care (PV):</span> <span>{result.social.pv.toFixed(2)} €</span>
    </div>
    
    <div class="total-row">
      <span>Total Deductions:</span> <span>{(result.taxes.total + result.social.total).toFixed(2)} €</span>
    </div>
  </div>

</main>

<footer class="copyright">
  <p>© 2026 Evgenii Efimochkin. No cookies, no analytics, no tracking, no data collected.</p>
</footer>
