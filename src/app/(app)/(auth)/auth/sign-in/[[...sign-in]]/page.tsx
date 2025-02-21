import { SignIn } from "@clerk/nextjs";

export default function AuthPage() {
  return (
    <SignIn
      appearance={{
        elements: {
          card: {
            backgroundColor: "var(--card)",
            color: "var(--card-foreground)",
            boxShadow:
              "var(--tw-inset-shadow), var(--tw-inset-ring-shadow), var(--tw-ring-offset-shadow), var(--tw-ring-shadow), var(--tw-shadow)",
            borderRadius: "var(--radius-xl)",
            borderStyle: "var(--tw-border-style)",
            borderWidth: "1px",
            borderColor: "var(--border)",
          },
          cardBox: {
            boxShadow:
              "var(--tw-inset-shadow), var(--tw-inset-ring-shadow), var(--tw-ring-offset-shadow), var(--tw-ring-shadow), var(--tw-shadow)",
            borderWidth: "0px",
          },
          dividerLine: "!bg-border",
          dividerText: "!text-foreground",
          formButtonPrimary:
            "inline-flex items-center justify-center gap-2 whitespace-nowrap !rounded-md text-sm font-medium !transition-[color,box-shadow] disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 [&_svg]:shrink-0 ring-ring/10 dark:ring-ring/20 dark:outline-ring/40 outline-ring/50 focus-visible:ring-4 focus-visible:outline-1 aria-invalid:focus-visible:ring-0 !dark:hover:bg-primary/90 !bg-primary !text-primary-foreground !shadow-sm h-9 px-4 py-2 has-[>svg]:px-3",
          formFieldInput:
            "flex h-9 w-full min-w-0 rounded-md border !border !border-input !bg-transparent px-3 py-1 text-base !shadow-xs !ring-ring/10 outline-ring/50 !transition-[color,box-shadow] selection:bg-primary selection:text-primary-foreground placeholder:text-muted-foreground focus-visible:ring-4 focus-visible:outline-1 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive/60 aria-invalid:ring-destructive/20 aria-invalid:outline-destructive/60 aria-invalid:focus-visible:ring-[3px] aria-invalid:focus-visible:outline-none md:text-sm dark:ring-ring/20 dark:outline-ring/40 dark:aria-invalid:border-destructive dark:aria-invalid:ring-destructive/50 dark:aria-invalid:outline-destructive dark:aria-invalid:focus-visible:ring-4 !hover:shadow-none !text-foreground",
          formFieldInputShowPasswordButton: {
            color: "var(--muted-foreground)",
            "&:hover": {
              color: "var(--muted-foreground)",
              opacity: 0.8,
            },
          },
          formFieldLabel: {
            color: "var(--foreground)",
            fontSize: "var(--text-sm)",
            lineHeight: "var(--tw-leading, var(--text-sm--line-height))",
            fontWeight: "var(--font-weight-medium)",
            WebkitUserSelect: "none",
            userSelect: "none",
          },
          footer: "sr-only",
          headerTitle: {
            color: "var(--card-foreground)",
            lineHeight: 1,
            fontWeight: "var(--font-weight-semibold)",
            letterSpacing: "letter-spacing: var(--tracking-tight)",
          },
          socialButtonsBlockButton: {
            "--accent": "unset !important",
            "--accent-foreground": "unset !important",
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "calc(var(--spacing) * 2)",
            whiteSpace: "nowrap",
            borderRadius: "calc(var(--radius) - 2px)",
            borderStyle: "var(--tw-border-style)",
            borderWidth: "1px !important",
            borderColor: "var(--input)",
            boxShadow:
              "var(--tw-inset-shadow), var(--tw-inset-ring-shadow), var(--tw-ring-offset-shadow), var(--tw-ring-shadow), var(--tw-shadow) !important",
            backgroundColor: "var(--background)",
            "&:hover": {
              backgroundColor: "var(--accent) !important",
              color: "var(--accent-foreground) !important",
            },
            color: "var(--foreground)",
            fontSize: "text-sm",
            fontWeight: "var(--font-weight-medium)",
            transitionProperty: "color,box-shadow",
            transitionTimingFunction:
              "var(--tw-ease, var(--default-transition-timing-function)",
            transitionDuration:
              "var(--tw-duration, var(--default-transition-duration)",
            "&:disabled": {
              pointerEvents: "none",
              opacity: "0.5",
            },
            svg: "pointer-events-none",
            svgNotClassSize: "size-4",
            svgShrink: "shrink-0",
            "--tw-ring-color":
              "color-mix(in oklab, var(--ring) 10%, transparent)",
            outlineColor: "color-mix(in oklab, var(--ring) 50%, transparent)",
            "&:focus-visible": {
              "--tw-ring-shadow":
                "var(--tw-ring-inset,) 0 0 0 calc(4px + var(--tw-ring-offset-width)) var(--tw-ring-color, currentColor)",
              boxShadow:
                "var(--tw-inset-shadow), var(--tw-inset-ring-shadow), var(--tw-ring-offset-shadow), var(--tw-ring-shadow), var(--tw-shadow)",
              outlineStyle: "var(--tw-outline-style)",
              outlineWidth: "1px",
            },
            "&:where(.dark *)": {
              "--tw-ring-color":
                "color-mix(in oklab, var(--ring) 20%, transparent)",
              outlineColor: "color-mix(in oklab, var(--ring) 40%, transparent)",
            },
            height: "calc(var(--spacing) * 9) !important",
            paddingBlock: "calc(var(--spacing) * 2) !important",
            paddingInline: "calc(var(--spacing) * 4) !important",
            "&:has(>svg)": {
              paddingInline: "calc(var(--spacing) * 3) !important",
            },
          },
        },
      }}
    />
  );
}
