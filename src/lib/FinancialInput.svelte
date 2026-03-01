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
    // Normalize various locale number formats to a standard "1234.56" string before parsing.
    let value = str.trim().replace(/\s+/g, "");

    const hasComma = value.includes(",");
    const hasDot = value.includes(".");

    if (hasComma && hasDot) {
      // If both separators are present, assume the last one is the decimal separator
      // and the other is a thousands/grouping separator.
      const lastComma = value.lastIndexOf(",");
      const lastDot = value.lastIndexOf(".");
      const decimalSep = lastComma > lastDot ? "," : ".";
      const groupSep = decimalSep === "," ? "." : ",";

      // Remove all grouping separators
      const groupSepRegex = new RegExp("\\" + groupSep, "g");
      value = value.replace(groupSepRegex, "");

      // Normalize decimal separator to "."
      if (decimalSep !== ".") {
        const decimalRegex = new RegExp("\\" + decimalSep, "g");
        value = value.replace(decimalRegex, ".");
      }
    } else if (hasComma && !hasDot) {
      // Only commas: treat as decimal separator and normalize to "."
      value = value.replace(/,/g, ".");
    } else {
      // Only dots or no separators: already suitable for parseFloat
    }

    const num = parseFloat(value);
    return isNaN(num) ? 0 : num;
  }

  function handleKeyDown(e: KeyboardEvent) {
    if (disabled) return;

    // Handle selection: if text is selected, replace with new input
    if (inputEl && inputEl.selectionStart !== null && inputEl.selectionEnd !== null) {
      const hasSelection = inputEl.selectionStart !== inputEl.selectionEnd;
      if (hasSelection) {
        // If there's any selection, start fresh from 0.00
        editValue = 0;
        displayValue = "0.00";
      }
    }

    // Allow modifier-based keystrokes (Ctrl+P, Ctrl+A, etc.)
    if (e.ctrlKey || e.metaKey || e.altKey) {
      return;
    }

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
      e.preventDefault();
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

  function handleMouseDown(e: MouseEvent) {
    // Select all on mouse down - will be applied after focus
    requestAnimationFrame(() => {
      if (inputEl) {
        inputEl.select();
      }
    });
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
  value={displayValue}
  {placeholder}
  {disabled}
  onkeydown={handleKeyDown}
  oninput={handleInput}
  onfocus={handleFocus}
  onblur={handleBlur}
  onmousedown={handleMouseDown}
/>
