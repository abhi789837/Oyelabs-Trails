import type { Config } from "tailwindcss";
import animate from "tailwindcss-animate";

// Every color is a CSS variable holding space-separated RGB channels (see src/index.css),
// so opacity modifiers like `bg-summit/15` work and dark mode only swaps the variables.
const token = (name: string) => `rgb(var(--${name}) / <alpha-value>)`;

const accent = (name: string) => ({
  DEFAULT: token(name),
  strong: token(`${name}-strong`),
  foreground: token(`${name}-foreground`),
});

export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    container: {
      center: true,
      padding: "1rem",
    },
    fontFamily: {
      // Sora is the brand face: headings, the wordmark, anything that speaks as Oyelearn.
      brand: ["Sora", "ui-sans-serif", "system-ui", "sans-serif"],
      display: ["Sora", "ui-sans-serif", "system-ui", "sans-serif"],
      // Body stays IBM Plex Sans: it reads better at paragraph length than Sora does.
      sans: ['"IBM Plex Sans"', "ui-sans-serif", "system-ui", "sans-serif"],
      mono: ['"IBM Plex Mono"', "ui-monospace", "SFMono-Regular", "Menlo", "monospace"],
    },
    // The brief's type scale: 12/14/16/18/24/32/48.
    fontSize: {
      xs: ["0.75rem", { lineHeight: "1.125rem" }],
      sm: ["0.875rem", { lineHeight: "1.375rem" }],
      base: ["1rem", { lineHeight: "1.625rem" }],
      lg: ["1.125rem", { lineHeight: "1.75rem" }],
      xl: ["1.5rem", { lineHeight: "2rem", letterSpacing: "-0.01em" }],
      "2xl": ["2rem", { lineHeight: "2.5rem", letterSpacing: "-0.02em" }],
      "3xl": ["3rem", { lineHeight: "3.25rem", letterSpacing: "-0.03em" }],
    },
    extend: {
      colors: {
        paper: token("paper"),
        ink: token("ink"),
        background: token("background"),
        foreground: token("foreground"),
        surface: {
          DEFAULT: token("surface"),
          sunken: token("surface-sunken"),
        },
        editor: {
          DEFAULT: token("editor"),
          gutter: token("editor-gutter"),
          foreground: token("editor-foreground"),
        },
        brand: {
          50: token("brand-50"),
          100: token("brand-100"),
          200: token("brand-200"),
          300: token("brand-300"),
          400: token("brand-400"),
          500: token("brand-500"),
          600: token("brand-600"),
          700: token("brand-700"),
          800: token("brand-800"),
          900: token("brand-900"),
          950: token("brand-950"),
        },
        trailmark: accent("trailmark"),
        summit: accent("summit"),
        ridge: accent("ridge"),
        glacier: accent("glacier"),
        basalt: accent("basalt"),
        canyon: accent("canyon"),
        alpenglow: accent("alpenglow"),
        lichen: accent("lichen"),
        // shadcn/ui semantic names. `primary` and `ring` are the Oyelabs blue; the trail accents
        // below stay what they are, because they identify tracks and progress states rather than
        // the brand. `success` is the summit green, `warning` the trailmark amber, so a passed or
        // flagged answer reads the same as a completed or in-progress waypoint.
        border: token("border"),
        input: token("input"),
        ring: token("ring"),
        primary: {
          DEFAULT: token("primary"),
          strong: token("primary-strong"),
          foreground: token("primary-foreground"),
        },
        success: accent("summit"),
        warning: accent("trailmark"),
        secondary: { DEFAULT: token("surface-sunken"), foreground: token("foreground") },
        muted: { DEFAULT: token("surface-sunken"), foreground: token("muted-foreground") },
        accent: { DEFAULT: token("surface-sunken"), foreground: token("foreground") },
        destructive: { DEFAULT: token("destructive"), foreground: token("paper") },
        card: { DEFAULT: token("surface"), foreground: token("foreground") },
        popover: { DEFAULT: token("popover"), foreground: token("popover-foreground") },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      maxWidth: {
        prose: "68ch",
      },
      keyframes: {
        "waypoint-pulse": {
          "0%": { transform: "scale(1)", opacity: "0.55" },
          "100%": { transform: "scale(2.1)", opacity: "0" },
        },
      },
      animation: {
        "waypoint-pulse": "waypoint-pulse 2.4s cubic-bezier(0.2, 0.6, 0.3, 1) infinite",
      },
    },
  },
  plugins: [animate],
} satisfies Config;
