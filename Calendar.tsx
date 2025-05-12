"use client"

import * as React from "react"
import { DayPicker } from "react-day-picker"
import styles from "./Calendar.module.css"

export type CalendarProps = React.ComponentProps<typeof DayPicker> & {
  mode: "single" | "range";
  modifiersClassNames?: Record<string, string>;
  modifiers?: Record<string, any>;
}

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  modifiersClassNames,
  modifiers,
  ...props
}: CalendarProps) {
  // Create a mapping of modifier names to their corresponding CSS module classes
  const modifierStyles = React.useMemo(() => {
    // Start with any explicitly provided modifierClassNames
    const styles_map: Record<string, string> = { ...modifiersClassNames };
    
    // Only process modifiers if they exist
    if (modifiers) {
      // Log the modifiers for debugging
      console.log('[Calendar] Processing modifiers:', Object.keys(modifiers));
      
      // For each modifier key, check if there's a matching CSS class in our styles
      Object.keys(modifiers).forEach(key => {
        // Only add to the map if we don't already have an explicit override
        // and if the style exists in our CSS module
        if (!styles_map[key] && styles[key]) {
          console.log(`[Calendar] Found CSS class for modifier: ${key}`);
          styles_map[key] = styles[key];
        } else if (!styles[key]) {
          console.log(`[Calendar] No CSS class found for modifier: ${key}`);
        }
      });
    }
    
    return styles_map;
  }, [modifiers, modifiersClassNames]);

  // Create the base classNames object with our styles
  const baseClassNames = React.useMemo(() => ({
    root: `${styles.calendar} ${className || ""}`,
    chevron: styles.chevron,
    weekdays: styles.weekdays,
    weekday: styles.weekday,
    week: styles.week,
    today: styles.today,
    selected: styles.selected,
    range_middle: styles.range_middle,
    range_end: styles.range_end,
    outside: styles.outside,
    nav: styles.nav,
    months: styles.months,
    month: styles.month,
    month_grid: styles.month_grid,
    month_caption: styles.month_caption,
    hidden: styles.hidden,
    footer: styles.footer,
    disabled: styles.disabled,
    day: styles.day,
    day_button: styles.day_button,
    cell: styles.cell,
    caption_label: styles.caption_label,
    button_previous: styles.button_previous,
    button_next: styles.button_next,
    ...classNames,
  }), [className, classNames]);

  // Debug log for modifiers and their values
  React.useEffect(() => {
    if (modifiers) {
      console.log('[Calendar] Applied modifiers:', modifiers);
      console.log('[Calendar] Mapped modifier styles:', modifierStyles);
    }
  }, [modifiers, modifierStyles]);

  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      classNames={baseClassNames}
      modifiersClassNames={modifierStyles}
      modifiers={modifiers}
      {...props}
    />
  )
}
Calendar.displayName = "Calendar"

export { Calendar }