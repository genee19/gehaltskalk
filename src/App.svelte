<script lang="ts">
  import { calculateTaxes, calculateGrossFromNet } from './lib/tax-logic';
  import type { TaxSettings } from './lib/tax-logic';

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
      `Class ${['I','II','III','IV','V','VI'][settings.taxClass - 1]}`,
      settings.hasChildren ? `${settings.childCount} Child(ren)` : 'No Children',
      settings.churchTax ? 'Church Tax' : 'No Church Tax',
      settings.state === 'west' ? 'West' : 'East',
      `${hoursPerWeek}h/week`
    ];
    return parts.join(' • ');
  });

</script>

<main class="container">
  <h1>🇩🇪 Gehaltsrechner 2026</h1>
  
  <!-- Settings Section -->
  <details class="settings-section">
    <summary class="settings-summary">
      <span class="summary-details">{settingsSummary}</span>
      <span class="toggle-icon">▼</span>
    </summary>

    <div class="settings-panel">
      <div class="setting-group">
        <label>Hours/Week: <input type="number" bind:value={hoursPerWeek} /></label>
      </div>
      <div class="setting-group">
        <label>Tax Class: 
          <select bind:value={settings.taxClass}>
            <option value={1}>I</option>
            <option value={2}>II</option>
            <option value={3}>III</option>
            <option value={4}>IV</option>
            <option value={5}>V</option>
            <option value={6}>VI</option>
          </select>
        </label>
      </div>
      <div class="setting-group">
        <label>Age: <input type="number" bind:value={settings.age} /></label>
      </div>
      <div class="setting-group">
        <label>
          <input type="checkbox" bind:checked={settings.churchTax} /> Church Tax
        </label>
      </div>
      <div class="setting-group">
        <label>
          <input type="checkbox" bind:checked={settings.hasChildren} /> Children?
        </label>
        {#if settings.hasChildren}
           <input type="number" min="0" bind:value={settings.childCount} placeholder="Count"/>
        {/if}
      </div>
       <div class="setting-group">
        <label>Region: 
          <select bind:value={settings.state}>
            <option value="west">West Germany</option>
            <option value="east">East Germany</option>
          </select>
        </label>
      </div>
       <div class="setting-group">
        <label>Health Ins: 
          <select bind:value={settings.kvType}>
            <option value="public">Public (GKV)</option>
            <option value="private">Private (PKV)</option>
          </select>
        </label>
        {#if settings.kvType === 'public'}
           <label>Add-on %: <input type="number" step="0.1" bind:value={settings.kvAddOn} /></label>
        {:else}
           <label>Monthly €: <input type="number" bind:value={settings.kvPrivateAmount} /></label>
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
          <input type="number" value={Math.round(grossYearly)} oninput={(e) => updateFromGrossYearly(+e.currentTarget.value)} />
          <span>€</span>
        </div>
      </div>
      <div class="input-group">
        <label>Monthly</label>
        <div class="input-wrapper">
          <input type="number" value={Math.round(grossMonthly)} oninput={(e) => updateFromGrossMonthly(+e.currentTarget.value)} />
          <span>€</span>
        </div>
      </div>
      <div class="input-group">
        <label>Hourly</label>
        <div class="input-wrapper">
          <input type="number" step="0.01" value={grossHourly.toFixed(2)} oninput={(e) => updateFromGrossHourly(+e.currentTarget.value)} />
          <span>€</span>
        </div>
      </div>
    </div>

    <div class="column">
      <h2>Net (Netto)</h2>
      <div class="input-group">
        <label>Yearly</label>
        <div class="input-wrapper">
          <input type="number" value={Math.round(netYearly)} oninput={(e) => updateFromNetYearly(+e.currentTarget.value)} />
          <span>€</span>
        </div>
      </div>
       <div class="input-group">
        <label>Monthly</label>
        <div class="input-wrapper">
           <input type="number" value={Math.round(netMonthly)} oninput={(e) => updateFromNetMonthly(+e.currentTarget.value)} />
           <span>€</span>
        </div>
      </div>
       <div class="input-group">
        <label>Hourly</label>
        <div class="input-wrapper">
           <input type="number" step="0.01" value={netHourly.toFixed(2)} oninput={(e) => updateFromNetHourly(+e.currentTarget.value)} />
           <span>€</span>
        </div>
      </div>
    </div>
  </div>

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

<style>
  :global(body) {
    font-family: Inter, system-ui, Avenir, Helvetica, Arial, sans-serif;
    background-color: #f9f9f9;
    color: #333;
    margin: 0;
    padding: 0;
  }
  
  .container {
    max-width: 800px;
    margin: 0 auto;
    padding: 2rem;
    background: white;
    min-height: 100vh;
    box-shadow: 0 0 20px rgba(0,0,0,0.05);
  }

  h1 {
    text-align: center;
    color: #2c3e50;
  }
  
  .settings-section {
    margin-bottom: 2rem;
    border: 1px solid #e2e8f0;
    border-radius: 12px;
    overflow: hidden;
    background: #fff;
    transition: all 0.3s ease;
  }

  .settings-section[open] {
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
  }

  .settings-summary {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1rem 1.5rem;
    background: #f8fafc;
    cursor: pointer;
    list-style: none;
    user-select: none;
  }

  .settings-summary::-webkit-details-marker {
    display: none;
  }

  .summary-details {
    font-size: 0.95rem;
    color: #475569;
    font-weight: 500;
  }

  .toggle-icon {
    font-size: 0.8rem;
    color: #94a3b8;
    transition: transform 0.3s ease;
  }

  .settings-section[open] .toggle-icon {
    transform: rotate(180deg);
  }

  .settings-panel {
    background: #fff;
    padding: 1.5rem;
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
    gap: 1.5rem;
    border-top: 1px solid #f1f5f9;
  }
  
  .setting-group {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .calculator-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 2rem;
    margin-bottom: 2rem;
  }
  
  @media (max-width: 600px) {
    .calculator-grid {
      grid-template-columns: 1fr;
    }
  }

  .column {
    background: #fff;
    padding: 1rem;
    border: 1px solid #eee;
    border-radius: 8px;
  }
  
  .column h2 {
    margin-top: 0;
    border-bottom: 2px solid #eee;
    padding-bottom: 0.5rem;
  }

  .input-group {
    margin-bottom: 1rem;
  }
  
  .input-group label {
    display: block;
    font-size: 0.9rem;
    color: #666;
    margin-bottom: 0.25rem;
  }
  
  .input-wrapper {
    display: flex;
    align-items: center;
    border: 1px solid #ccc;
    border-radius: 4px;
    padding: 0.5rem;
    background: #fff;
  }
  
  .input-wrapper:focus-within {
    border-color: #3b82f6;
    box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.1);
  }
  
  .input-wrapper input {
    border: none;
    outline: none;
    flex: 1;
    font-size: 1.1rem;
    width: 100%;
  }
  
  .input-wrapper span {
    color: #888;
    margin-left: 0.5rem;
  }

  .breakdown {
    background: #f8fafc;
    padding: 1.5rem;
    border-radius: 8px;
  }
  
  .row {
    display: flex;
    justify-content: space-between;
    padding: 0.5rem 0;
    border-bottom: 1px solid #e2e8f0;
  }
  
  .total-row {
    display: flex;
    justify-content: space-between;
    padding: 1rem 0;
    font-weight: bold;
    font-size: 1.1rem;
    border-top: 2px solid #cbd5e1;
    margin-top: 1rem;
  }
  
</style>
