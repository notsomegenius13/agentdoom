/**
 * Forge: Primitive Registry — single source of truth
 *
 * ALL three pipeline stages (classify, generate, assemble) derive their
 * primitive lists from this file.  Adding or removing a primitive here is
 * the only change required to propagate it through the entire pipeline.
 *
 * classifierVisible  — expose the type to the classifier (AVAILABLE_PRIMITIVES)
 * schema             — props descriptor used by the generator (PRIMITIVE_SCHEMAS)
 * hasRenderer        — assembler can render this type
 */

export interface PrimitiveEntry {
  /** Canonical kebab-case type key used throughout the pipeline */
  type: string
  /** Human-readable display name */
  displayName: string
  /**
   * Expose to the classifier's AVAILABLE_PRIMITIVES list.
   * Set true when the type has both a schema and a renderer and is
   * a good first-class choice for intent → primitive mapping.
   */
  classifierVisible: boolean
  /** Generator schema descriptor — what props this primitive accepts */
  schema: Record<string, unknown>
  /** Assembler has a renderer for this type */
  hasRenderer: boolean
}

// ---------------------------------------------------------------------------
// Registry
// ---------------------------------------------------------------------------

export const PRIMITIVE_REGISTRY: PrimitiveEntry[] = [
  // -------------------------------------------------------------------------
  // Core 12 — classifier + generator + assembler
  // -------------------------------------------------------------------------
  {
    type: 'form',
    displayName: 'Form',
    classifierVisible: true,
    hasRenderer: true,
    schema: {
      type: 'form',
      description: 'A form with labeled fields and a submit button',
      props: {
        title: 'string — form heading',
        fields: 'array of { name: string, label: string, type: "text"|"number"|"email"|"textarea"|"select"|"checkbox", placeholder?: string, options?: string[] (for select), required?: boolean }',
        submitLabel: 'string — button text',
        successMessage: 'string — shown after submit',
      },
    },
  },
  {
    type: 'table',
    displayName: 'Table',
    classifierVisible: true,
    hasRenderer: true,
    schema: {
      type: 'table',
      description: 'A data table with sortable columns and rows',
      props: {
        title: 'string — table heading',
        columns: 'array of { key: string, label: string, type?: "text"|"number"|"currency" }',
        rows: 'array of objects matching column keys — sample data',
        searchable: 'boolean — enables search/filter',
      },
    },
  },
  {
    type: 'calculator',
    displayName: 'Calculator',
    classifierVisible: true,
    hasRenderer: true,
    schema: {
      type: 'calculator',
      description: 'A calculator with labeled inputs, a formula, and a result display',
      props: {
        title: 'string — calculator heading',
        inputs: 'array of { name: string, label: string, type: "number"|"select", defaultValue?: number, min?: number, max?: number, step?: number, options?: { label: string, value: number }[] }',
        formula: 'string — JavaScript expression using input names as variables (e.g. "price * quantity * (1 + taxRate/100)")',
        resultLabel: 'string — label for the output',
        resultPrefix: 'string — prefix like "$" or ""',
        resultSuffix: 'string — suffix like "%" or " kg"',
      },
    },
  },
  {
    type: 'tracker',
    displayName: 'Tracker',
    classifierVisible: true,
    hasRenderer: true,
    schema: {
      type: 'tracker',
      description: 'A habit/goal tracker with checkable items and streaks',
      props: {
        title: 'string — tracker heading',
        items: 'array of { name: string, icon?: string (emoji), target?: number }',
        period: '"daily"|"weekly"|"monthly"',
        showStreak: 'boolean',
      },
    },
  },
  {
    type: 'generator',
    displayName: 'Generator',
    classifierVisible: true,
    hasRenderer: true,
    schema: {
      type: 'generator',
      description: 'A text/content generator with input, a generate button, and output display',
      props: {
        title: 'string — generator heading',
        inputLabel: 'string — label for the input',
        inputPlaceholder: 'string',
        buttonLabel: 'string — generate button text',
        templates: 'array of string — template patterns with {{input}} placeholder',
        outputLabel: 'string — label for the result',
      },
    },
  },
  {
    type: 'chart',
    displayName: 'Chart',
    classifierVisible: true,
    hasRenderer: true,
    schema: {
      type: 'chart',
      description: 'A simple bar or pie chart with labeled data points',
      props: {
        title: 'string — chart heading',
        chartType: '"bar"|"pie"|"line"',
        data: 'array of { label: string, value: number, color?: string }',
        xLabel: 'string — x-axis label (bar/line)',
        yLabel: 'string — y-axis label (bar/line)',
      },
    },
  },
  {
    type: 'list',
    displayName: 'List',
    classifierVisible: true,
    hasRenderer: true,
    schema: {
      type: 'list',
      description: 'An interactive list with add/remove/reorder capabilities',
      props: {
        title: 'string — list heading',
        items: 'array of string — initial items',
        addable: 'boolean — can add new items',
        removable: 'boolean — can remove items',
        reorderable: 'boolean — drag to reorder',
        placeholder: 'string — add item placeholder',
      },
    },
  },
  {
    type: 'timer',
    displayName: 'Timer',
    classifierVisible: true,
    hasRenderer: true,
    schema: {
      type: 'timer',
      description: 'A countdown/pomodoro timer with configurable durations',
      props: {
        title: 'string — timer heading',
        mode: '"countdown"|"pomodoro"|"stopwatch"',
        durations: 'array of { label: string, seconds: number } — preset durations',
        alertSound: 'boolean',
      },
    },
  },
  {
    type: 'quiz',
    displayName: 'Quiz',
    classifierVisible: true,
    hasRenderer: true,
    schema: {
      type: 'quiz',
      description: 'A quiz/trivia with questions, multiple-choice answers, and scoring',
      props: {
        title: 'string — quiz heading',
        questions: 'array of { question: string, options: string[], correct: number (0-indexed), explanation?: string }',
        showScore: 'boolean',
        shuffleQuestions: 'boolean',
      },
    },
  },
  {
    type: 'card-grid',
    displayName: 'Card Grid',
    classifierVisible: true,
    hasRenderer: true,
    schema: {
      type: 'card-grid',
      description: 'A responsive grid of cards with titles, descriptions, and optional images',
      props: {
        title: 'string — grid heading',
        cards: 'array of { title: string, description: string, icon?: string (emoji), tag?: string, link?: string }',
        columns: 'number — 2 or 3',
      },
    },
  },
  {
    type: 'checklist',
    displayName: 'Checklist',
    classifierVisible: true,
    hasRenderer: true,
    schema: {
      type: 'checklist',
      description: 'A checkable todo/checklist with categories and progress bar',
      props: {
        title: 'string — checklist heading',
        categories: 'array of { name: string, items: string[] }',
        showProgress: 'boolean',
      },
    },
  },
  {
    type: 'template',
    displayName: 'Template',
    classifierVisible: true,
    hasRenderer: true,
    schema: {
      type: 'template',
      description: 'A fill-in-the-blanks template with copy-to-clipboard output',
      props: {
        title: 'string — template heading',
        fields: 'array of { name: string, label: string, placeholder: string, type?: "text"|"textarea"|"select", options?: string[] }',
        template: 'string — template text with {{fieldName}} placeholders',
        copyButton: 'boolean',
      },
    },
  },

  // -------------------------------------------------------------------------
  // Extended 7 — assembler had renderers; generator was missing schemas
  // Now classifier-visible since they have full end-to-end support
  // -------------------------------------------------------------------------
  {
    type: 'split-calculator',
    displayName: 'Split Calculator',
    classifierVisible: true,
    hasRenderer: true,
    schema: {
      type: 'split-calculator',
      description: 'A bill/tip splitter with preset tip percentages and per-person breakdown',
      props: {
        title: 'string — heading',
        currency: 'string — currency symbol like "$" or "€"',
        defaultTipPercentages: 'array of number — preset tip % buttons (e.g. [15, 18, 20, 25])',
        maxPeople: 'number — max allowed people to split between (default 20)',
        showTipAmount: 'boolean — show tip amount row',
        showTotal: 'boolean — show total row',
        showPerPersonBreakdown: 'boolean — show per-person row',
      },
    },
  },
  {
    type: 'converter',
    displayName: 'Converter',
    classifierVisible: true,
    hasRenderer: true,
    schema: {
      type: 'converter',
      description: 'A unit converter with category tabs and swap button',
      props: {
        title: 'string — heading',
        categories: 'array of { name: string, units: array of { name: string, symbol: string, toBase: number } } — conversion categories. For Temperature use toBase: 1 (special-cased).',
        defaultCategory: 'string — name of the initially selected category',
        precision: 'number — decimal places in result (default 4)',
      },
    },
  },
  {
    type: 'poll',
    displayName: 'Poll',
    classifierVisible: true,
    hasRenderer: true,
    schema: {
      type: 'poll',
      description: 'A voting poll with options, live percentage bars, and vote count',
      props: {
        title: 'string — heading',
        question: 'string — the poll question',
        options: 'array of { label: string, votes: number } — initial vote counts (use realistic non-zero values)',
        allowMultiple: 'boolean — allow selecting multiple options',
        showResults: 'boolean — show results immediately (vs after voting)',
        showPercentages: 'boolean — show percentage labels',
      },
    },
  },
  {
    type: 'pricing-table',
    displayName: 'Pricing Table',
    classifierVisible: true,
    hasRenderer: true,
    schema: {
      type: 'pricing-table',
      description: 'A pricing table with tiered plans, feature lists, and optional annual/monthly toggle',
      props: {
        title: 'string — heading',
        subtitle: 'string — subheading (optional)',
        tiers: 'array of { name: string, price: number (monthly USD), period: string (e.g. "month"), description: string, features: string[], highlighted: boolean (marks as "popular"), ctaLabel: string }',
        showAnnualToggle: 'boolean — show monthly/annual billing toggle',
        annualDiscount: 'number — % discount for annual billing (default 20)',
      },
    },
  },
  {
    type: 'kanban-board',
    displayName: 'Kanban Board',
    classifierVisible: true,
    hasRenderer: true,
    schema: {
      type: 'kanban-board',
      description: 'A kanban board with draggable cards across status columns',
      props: {
        title: 'string — heading',
        columns: 'array of { id: string, title: string, color: string (hex), cards: array of { id: string, title: string, description?: string, priority?: "high"|"medium"|"low", tags?: string[] } }',
        allowDrag: 'boolean — enable drag-and-drop (default true)',
        showPriority: 'boolean — show priority badges on cards',
        showTags: 'boolean — show tag chips on cards',
      },
    },
  },
  {
    type: 'stats-dashboard',
    displayName: 'Stats Dashboard',
    classifierVisible: true,
    hasRenderer: true,
    schema: {
      type: 'stats-dashboard',
      description: 'A stats dashboard with KPI metric cards and optional line charts',
      props: {
        title: 'string — heading',
        stats: 'array of { label: string, value: string, change: number (positive or negative %), changeLabel?: string, icon?: string (emoji) }',
        charts: 'array of { type: "line", title: string, data: array of { label: string, value: number } } — optional trend charts',
      },
    },
  },
  {
    type: 'wizard-form',
    displayName: 'Wizard Form',
    classifierVisible: true,
    hasRenderer: true,
    schema: {
      type: 'wizard-form',
      description: 'A multi-step wizard form with step indicator and back/next navigation',
      props: {
        title: 'string — heading',
        steps: 'array of { title: string, fields: array of { name: string, label: string, type: "text"|"number"|"email"|"textarea"|"select", placeholder?: string, required?: boolean, defaultValue?: string|number, options?: string[] } }',
        submitLabel: 'string — final submit button text',
        showStepIndicator: 'boolean — show progress bars above form (default true)',
        allowBackNavigation: 'boolean — show Back button on non-first steps (default true)',
      },
    },
  },

  // -------------------------------------------------------------------------
  // Extended 4 — generator had schemas; assembler was missing renderers
  // Renderers added in assemble.ts; classifierVisible kept false (these are
  // niche/advanced types not ideal for primary intent classification).
  // -------------------------------------------------------------------------
  {
    type: 'calendar',
    displayName: 'Calendar',
    classifierVisible: false,
    hasRenderer: true,
    schema: {
      type: 'calendar',
      description: 'A month-view calendar with date selection, range picking, and highlighted events',
      props: {
        title: 'string — calendar heading',
        mode: '"single"|"range" — date selection mode',
        minDate: 'string — ISO date for minimum selectable date',
        maxDate: 'string — ISO date for maximum selectable date',
        highlightedDates: 'array of { date: string (ISO), label: string, color?: string } — events/holidays',
        firstDayOfWeek: '0|1 — 0=Sunday, 1=Monday',
        showWeekNumbers: 'boolean',
      },
    },
  },
  {
    type: 'progress-bar',
    displayName: 'Progress Bar',
    classifierVisible: false,
    hasRenderer: true,
    schema: {
      type: 'progress-bar',
      description: 'A progress bar or step indicator with animated fill and discrete steps',
      props: {
        title: 'string — heading',
        mode: '"bar"|"stepper" — continuous progress or discrete steps',
        value: 'number 0-100 — progress percentage (bar mode)',
        showPercentage: 'boolean — show % label (bar mode)',
        animated: 'boolean — animate the fill',
        striped: 'boolean — striped pattern',
        size: '"sm"|"md"|"lg"',
        steps: 'array of { label: string, description?: string } — step definitions (stepper mode)',
        currentStep: 'number — 0-indexed active step (stepper mode)',
        allowClickNavigation: 'boolean — clickable steps (stepper mode)',
      },
    },
  },
  {
    type: 'search',
    displayName: 'Search',
    classifierVisible: false,
    hasRenderer: true,
    schema: {
      type: 'search',
      description: 'A search input with autocomplete dropdown, category grouping, and keyboard navigation',
      props: {
        title: 'string — heading',
        placeholder: 'string — input placeholder',
        items: 'array of { label: string, value: string, category?: string, description?: string, icon?: string }',
        maxResults: 'number — max suggestions shown (default 10)',
        showCategories: 'boolean — group by category',
        showRecentSearches: 'boolean',
      },
    },
  },
  {
    type: 'accordion',
    displayName: 'Accordion',
    classifierVisible: false,
    hasRenderer: true,
    schema: {
      type: 'accordion',
      description: 'Collapsible sections with smooth expand/collapse animations and optional icons',
      props: {
        title: 'string — heading',
        sections: 'array of { id: string, title: string, content: string, icon?: string (emoji), disabled?: boolean, defaultOpen?: boolean }',
        allowMultiple: 'boolean — allow multiple sections open simultaneously (default true)',
        bordered: 'boolean — bordered cards vs divider style (default true)',
        compact: 'boolean — reduced padding (default false)',
      },
    },
  },

  // -------------------------------------------------------------------------
  // Advanced 5 — in both generator and assembler; no React component package.
  // classifierVisible: false (complex/special-purpose; not first-class choices
  // for the classifier's limited selection window).
  // -------------------------------------------------------------------------
  {
    type: 'realtime-collab',
    displayName: 'Realtime Collab',
    classifierVisible: false,
    hasRenderer: true,
    schema: {
      type: 'realtime-collab',
      description: 'A real-time collaborative document editor with multi-cursor presence indicators and formatting toolbar',
      props: {
        title: 'string — heading',
        placeholder: 'string — initial placeholder text for the editor',
        collaborators: 'array of { name: string, color: string (hex), avatar?: string (emoji or initial) } — simulated collaborator presence',
        showToolbar: 'boolean — show formatting toolbar (bold, italic, underline, list)',
        initialContent: 'string — pre-filled document content',
      },
    },
  },
  {
    type: 'ai-chat',
    displayName: 'AI Chat',
    classifierVisible: false,
    hasRenderer: true,
    schema: {
      type: 'ai-chat',
      description: 'An embeddable AI chat widget with streaming message responses and typing indicators',
      props: {
        title: 'string — heading',
        botName: 'string — name shown in chat header',
        botAvatar: 'string — emoji avatar for the bot',
        placeholder: 'string — input placeholder',
        welcomeMessage: 'string — first message from the bot',
        responses: 'array of { trigger: string, reply: string } — keyword-matched replies',
        defaultReply: 'string — fallback reply when no trigger matches',
      },
    },
  },
  {
    type: 'payment-form',
    displayName: 'Payment Form',
    classifierVisible: false,
    hasRenderer: true,
    schema: {
      type: 'payment-form',
      description: 'A payment form with card number, expiry, CVC, cardholder name, order summary, and secure checkout',
      props: {
        title: 'string — heading',
        currency: 'string — currency symbol like "$" or "€"',
        items: 'array of { label: string, amount: number } — line items in the order summary',
        submitLabel: 'string — pay button text (defaults to "Pay $X.XX")',
        showSummary: 'boolean — show order summary section',
        successMessage: 'string — message shown after successful payment',
      },
    },
  },
  {
    type: 'analytics-dashboard',
    displayName: 'Analytics Dashboard',
    classifierVisible: false,
    hasRenderer: true,
    schema: {
      type: 'analytics-dashboard',
      description: 'An analytics dashboard with KPI cards, a chart grid (bar/line/pie), and time range selector',
      props: {
        title: 'string — heading',
        kpis: 'array of { label: string, value: string, trend: number (positive or negative %), trendLabel?: string, icon?: string (emoji) }',
        charts: 'array of { title: string, type: "bar"|"line"|"pie", data: array of { label: string, value: number, color?: string } }',
        timeRanges: 'array of string — selectable time ranges like ["7d","30d","90d","1y"]',
        defaultRange: 'string — initially selected range',
      },
    },
  },
  {
    type: 'notification-center',
    displayName: 'Notification Center',
    classifierVisible: false,
    hasRenderer: true,
    schema: {
      type: 'notification-center',
      description: 'A notification center with bell icon badge, notification list, mark-as-read, and toast popups',
      props: {
        title: 'string — heading',
        notifications: 'array of { id: string, title: string, description: string, time: string, icon?: string (emoji), iconBg?: string (hex), read?: boolean }',
        showBell: 'boolean — show bell icon with badge count',
        showToast: 'boolean — show a demo toast popup on load',
        toastDuration: 'number — toast auto-dismiss time in ms (default 4000)',
      },
    },
  },
]

// ---------------------------------------------------------------------------
// Derived helpers — consumed by classify.ts, generate.ts, assemble.ts
// ---------------------------------------------------------------------------

/**
 * Returns the list of types exposed to the classifier (AVAILABLE_PRIMITIVES).
 */
export function getClassifierPrimitives(): string[] {
  return PRIMITIVE_REGISTRY
    .filter((e) => e.classifierVisible)
    .map((e) => e.type)
}

/**
 * Returns a Record<type, schema> for all registered primitives.
 * Used by generate.ts to build PRIMITIVE_SCHEMAS and the generation system prompt.
 */
export function getPrimitiveSchemas(): Record<string, Record<string, unknown>> {
  return Object.fromEntries(
    PRIMITIVE_REGISTRY.map((e) => [e.type, e.schema])
  )
}

/**
 * Returns the set of types the assembler can render.
 * Used by assemble.ts to validate RENDERERS coverage at startup.
 */
export function getRendererTypes(): Set<string> {
  return new Set(
    PRIMITIVE_REGISTRY.filter((e) => e.hasRenderer).map((e) => e.type)
  )
}
