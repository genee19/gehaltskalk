<script lang="ts">
  interface Props {
    value: number;
    onchange?: (value: number) => void;
    placeholder?: string;
    disabled?: boolean;
  }

  let { value = $bindable(0), onchange, placeholder = "0.00", disabled = false }: Props = $props();

  let displayValue = $state("");
  let inputEl: HTMLInputElement;
  let editValue = $state(0);
  let hasFocus = $state(false);

  $effect(() => {
    if (!hasFocus) {
      displayValue = formatForDisplay(value);
      editValue = value;
    }
  });

  function formatForDisplay(val: number): string {
    return val.toFixed(2);
  }

  function parseDisplay(str: string): number {
    const cleaned = str.replace(",", ".");
    const num = parseFloat(cleaned);
    return isNaN(num) ? 0 : num;
  }

  function handleKeyDown(e: KeyboardEvent) {
    if (disabled) return;

    const key = e.key;

    if (key === "Backspace") {
      e.preventDefault();
      let cents = Math.round(editValue * 100);
      cents = Math.floor(cents / 10);
      editValue = cents / 100;
      displayValue = formatForDisplay(editValue);
      onchange?.(editValue);
      return;
    }

    if (key === "Enter") {
      inputEl?.blur();
      return;
    }

    if (key === "Escape") {
      hasFocus = false;
      editValue = value;
      displayValue = formatForDisplay(value);
      inputEl?.blur();
      return;
    }

    if (!/^[0-9]$/.test(key)) {
      return;
    }

    e.preventDefault();
    const digit = parseInt(key);
    let cents = Math.round(editValue * 100);
    cents = cents * 10 + digit;
    editValue = cents / 100;
    displayValue = formatForDisplay(editValue);
    onchange?.(editValue);
  }

  function handleInput(e: Event) {
    const target = e.target as HTMLInputElement;
    let val = parseDisplay(target.value);
    value = val;
    editValue = val;
    onchange?.(val);
  }

  function handleFocus() {
    hasFocus = true;
    editValue = value;
    displayValue = formatForDisplay(value);
  }

  function handleBlur() {
    hasFocus = false;
    displayValue = formatForDisplay(value);
  }
</script>

<input
  bind:this={inputEl}
  type="text"
  inputmode="decimal"
  bind:value={displayValue}
  {placeholder}
  {disabled}
  onkeydown={handleKeyDown}
  oninput={handleInput}
  onfocus={handleFocus}
  onblur={handleBlur}
/>
