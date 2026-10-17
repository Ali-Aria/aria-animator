# Legacy Morandi preset

Status: `ARCHIVED / ROLLBACK ONLY`

This file is a verbatim snapshot of the former default palette from `SKILL.md`. It is retained for
temporary rollback or historical comparison only. It must not be loaded by the normal production
workflow, selected by keyword matching, or used to fill missing colors in a new theme.

```text
canvas: #F2EFEA                 warm paper background
surface: #E3DED6               panels and cards
surfaceElevated: #F8F5F0       foreground surfaces
ink: #3F4545                   primary text and key lines
mutedInk: #78807D              secondary text
line: #C9C3BB                  borders and guides
primary: #87999A              dusty blue, main process
secondary: #A5B0A2            sage green, supporting state
accent: #B58F88               dusty rose, emphasis and handoffs
warm: #C3AA90                 muted sand, comparison or context
success: #8F9F91              low-saturation semantic state
warning: #B7A180              low-saturation semantic state
danger: #B17E78               low-saturation semantic state
```

Restore this palette only after an explicit user request to roll back to the legacy Morandi
system. A rollback must be treated as a separate deliberate theme choice, not as an automatic
fallback.
