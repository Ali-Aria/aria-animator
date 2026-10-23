# Remotion active color presets

Status: `ACTIVE`

This is the active color specification for the Remotion code-motion-explainer skill. It adapts
the three Lieflat Charts presets from the canonical [`color-presets.js`](https://github.com/larashero3-dotcom/lieflat-charts/blob/main/color-presets.js)
source. The preset names, hex values, opacity values, ramps, category arrays, and dark variants
below include the authored adjustments recorded in this document and take precedence over upstream
values. Do not invent replacement hex values when one of these roles applies.

The legacy Morandi snapshot is stored separately in `references/morandi-legacy.md`. It is archived
and must not be loaded or selected for new work.

## Theme contract

The default style is minimal 2D on the selected preset's own tinted paper (`BG`). Each preset's
tint is part of its character — porcelain's warm cream, graphite's cool paper — so `canvas`
defaults to the preset `BG`, not pure white. Set `canvas` to `#FFFFFF` only when the delivery
platform or an explicit production request requires it. Either way, preserve the selected
preset's existing ink, data, accent and semantic roles; a background choice never authorizes a
new custom data palette. Explicit production-specific palette or background requests take
priority.


Choose one preset for the complete video or one group of sibling compositions. Keep the existing
scalar theme fields so current Remotion components remain compatible, and add the palette metadata
and arrays when a composition needs multiple series, an ordinal ramp, a heat scale, or a dark card.

```ts
type PaletteName = 'porcelain' | 'palm' | 'wire' | 'graphite';
type PaletteLogic = 'ordinal' | 'categorical' | 'mono+accent';

type Theme = {
  paletteName: PaletteName;
  paletteLogic: PaletteLogic;
  canvas: string;
  surface: string;
  surfaceElevated: string;
  ink: string;
  mutedInk: string;
  line: string;
  primary: string;
  secondary: string;
  accent: string;
  warm: string;
  success: string;
  warning: string;
  danger: string;
  series: string[];
  ramp: string[];
  categories: string[];
  heat: string[];
  dark?: {
    surface: string;
    series: string[];
    highlight: string;
    line: string;
  };
};
```

Map the Lieflat roles to the existing Remotion theme fields as follows:

```text
canvas          = BG
surface         = rgba(TXT, .06)
surfaceElevated = HALO
ink             = TXT
mutedInk        = MUT
line            = GRID
primary         = DATA
secondary       = DATA2
accent          = HERO
warm            = FAINTDATA
success         = DATA
warning         = DATA2
danger          = HERO
series          = SER
ramp            = RAMP
categories      = CAT4 or CAT3
heat            = HEAT
```

`success`, `warning`, and `danger` stay inside the selected palette. They are never the only
semantic clue: pair them with a label, icon, geometry, direction, or visible state change. The
`surface` value is the selected `TXT` color at 6% opacity; `surfaceElevated` uses the preset's
`HALO` value. Keep `white: #FFFFFF` only as a neutral compatibility token when an existing
component requires it.

`secondary` is a data-role token, not a secondary-text token. If its contrast against the current
background is below the text threshold, use `mutedInk` or `ink` for words and labels; keep
`secondary`, `warm`, `FAINTDATA`, and light ramp values on shapes, fills, strokes, or other
non-text evidence.

## Shared color behavior

- One video or sibling delivery uses exactly one of `porcelain`, `palm`, `wire`, or `graphite`.
  Every authored preset must define the same role structure shown in its section and pass the QC
  contrast checks below; one-off brand palettes are supplied per production, not added here.
  Intrinsic source/UI/reference colors remain evidence exceptions and do not change the selected
  authored preset.
- Colors must connect to a real semantic dimension. Position, length, area, labels, and motion
  must still carry meaning when color is removed.
- In authored motion graphics, `HERO` is one focal element per beat or chart. Do not use it as a
  general decoration or as a second equal category.
- All four palettes use the shared subject, connector and detail stroke widths in
  [Visual design](code-motion-design.md#统一轮廓线宽). Check visible widths after local scaling, camera
  scaling and preview downscaling. Do not apply the legacy `strokeScale: 1.8` multiplier.
  Colored structural strokes keep `opacityFloor: .85`; `dot heat` is the opacity exception because
  its density is the data.
- Use the darker text family for readable labels. Pale ramp colors are fills or low-emphasis
  shapes, not small text.
- For dark cards, use the preset's `dark` block. Do not synthesize a neon or gradient variant.

Typography is independent of palette. New videos use LXGW WenKai with real Medium 500 for titles,
labels and captions, and optional Regular 400 for secondary long explanations. Follow
[Font integration](fonts.md#主要字体与字重) for font files, registration and synthesis settings.

## Porcelain · 青瓷蓝

Logic: `ordinal`. Keep the hue stable and let lightness express an ordered value. Use for a single
series, progress, time series, ranking, heat, or other ordered data. Four ordinal levels are clean;
more than four categories should not be assigned distinct blue levels.

```text
BG        #F7F2EB
TXT       #081F5C
MUT       rgba(8,31,92,.60)
LAB       rgba(8,31,92,.72)
FAINT     rgba(8,31,92,.32)
FLOOR     rgba(8,31,92,.24)
QUIET     rgba(8,31,92,.15)
TRACK     rgba(8,31,92,.12)
GRID      rgba(8,31,92,.16)
DATA      #334EAC
DATA2     #7096D1
HERO      #081F5C
HERODK    #7096D1
FAINTDATA #BAD6EB
BEAD      #7096D1
HALO      rgba(247,242,235,.92)

CAT4      #081F5C / #334EAC / #7096D1 / #BAD6EB
CAT3      #334EAC / #7096D1 / #BAD6EB
HEAT      #334EAC / #7096D1 / #BAD6EB
SER       #334EAC / #081F5C / #7096D1 / #BAD6EB / #D0E3FF /
          rgba(51,78,172,.4)
RAMP      #BAD6EB / #7096D1 / #334EAC / #081F5C
DRAMP4    #D0E3FF / #BAD6EB / rgba(247,242,235,.26)
RAMPDK    rgba(247,242,235,.26) / rgba(247,242,235,.42) /
          rgba(247,242,235,.60) / rgba(247,242,235,.84) / #7096D1
```

`RAMP` is intentionally four steps: `#D0E3FF` is only 1.16:1 away from `#BAD6EB`, so it stays
in `SER` as a minor series tone and never acts as a ramp level. For two-sided comparisons
(before/after, us/them) do not invent a warm hue: run the focal series in the blue ladder and
the reference side in the `TXT` ink family, separated by label, position, or geometry.

Dark variant:

```text
CARDBG    #081F5C
DK8       #EDEFF1 / #D5DBE2 / #BCC7D7 / #9EB3CD /
          #809EC6 / #6C93C7 / #4D82C6 / #3472C2
HL        #EDEFF1
LABEL     #9EB3CD       SUB        #809EC6
SRCROW    #3E5A8F       RULE       #1B3159
LINK_SAME #32517B       LINK_CROSS #263E5E
LINK_HEAVY #3B6091      LINK_FAINT #213650
```

## Palm · 椰林绿

Logic: `categorical`. Use hue and saturation to separate a small number of unordered categories.
The palette is low-saturation green/yellow; `HERO` is amber and means “the one to notice,” not a
peer category. Four categories are clean, five or six are marginal, and more than six should use a
different representation or the neutral fallback behavior.

```text
BG        #F0EFEB
TXT       #58402E
MUT       rgba(88,64,46,.60)
LAB       rgba(88,64,46,.72)
FAINT     rgba(88,64,46,.32)
FLOOR     rgba(88,64,46,.24)
QUIET     rgba(88,64,46,.15)
TRACK     rgba(88,64,46,.12)
GRID      rgba(88,64,46,.16)
DATA      #43593B
DATA2     #58402E
HERO      #B07D0F
HERODK    #F2D17E
FAINTDATA #ACAD79
BEAD      #77835A
HALO      rgba(240,239,235,.92)

CAT4      #43593B / #77835A / #ACAD79 / #F2D17E
CAT3      #43593B / #929960 / #F2D17E
CAT3L     #43593B / #77835A / #ACAD79
HEAT      #43593B / #929960 / #F2D17E
SER       #43593B / #77835A / #F2D17E /
          #ACAD79 / #58402E
RAMP      #E5D89A / #ACAD79 / #77835A / #43593B
SEG3      #43593B / #77835A / #ACAD79
ZONE3     #ACAD79 / #929960 / #43593B
RAMPDK    rgba(240,239,235,.26) / rgba(240,239,235,.42) /
          rgba(240,239,235,.60) / rgba(240,239,235,.84) / #F2D17E
DRAMP4    #F2D17E / #ACAD79 / rgba(240,239,235,.55) /
          rgba(240,239,235,.26)
```

Dark variant:

```text
CARDBG    #28311F
DK8       #F0EFE9 / #DDDBC9 / #C8CAA8 / #AFB885 /
          #92A763 / #7EA056 / #658D49 / #4F7D3E
HL        #F2D17E
LABEL     #ACAD79       SUB        #92A763
SRCROW    #5A6B47       RULE       #38452C
LINK_SAME #405333       LINK_CROSS #334329
LINK_HEAVY #4C6340      LINK_FAINT #2C3823
```

Do not use `#B07D0F` and the olive tones as two equal categories. Their roles are deliberately
different: amber jumps forward and olive recedes. The amber was deepened from `#D4A017` on
2026-10-23 because the original value measured only 2.38:1 on white, below the 3:1 boundary
threshold; `#B07D0F` measures about 3.6:1 and may also carry large text. The old six-step
`RAMP6` was retired the same day: adjacent olive steps measured 1.30–1.58:1 apart and blur
together in compressed video, so `RAMP` is now a four-step ladder with wider gaps. `#5A7049`
and `#929960` remain valid inside dark-card internals and `CAT3`/`HEAT`, where their neighbors
are far enough away.

## Wire · 编辑部红

Logic: `mono+accent`. Black and gray carry the complete data ladder; the fluorescent orange-red
`HERO` marks exactly one peak, result, NET, or other focal element. The palette has room for a gray
ladder, but only one orange focal point.

```text
BG        #F0F0EE
TXT       #1F1E1C
MUT       rgba(31,30,28,.60)
LAB       rgba(31,30,28,.72)
FAINT     rgba(31,30,28,.32)
FLOOR     rgba(31,30,28,.24)
QUIET     rgba(31,30,28,.15)
TRACK     rgba(31,30,28,.12)
GRID      rgba(31,30,28,.16)
DATA      #22211F
DATA2     #8F8E86
HERO      #F5572F
HERODK    #F5572F
FAINTDATA #C0BFB7
BEAD      #8F8E86
HALO      rgba(240,240,238,.92)

CAT4      #F5572F / #22211F / #8F8E86 / #C0BFB7
CAT3      #F5572F / #22211F / #8F8E86
CAT3L     #F5572F / #22211F / #6E6D66
HEAT      #F5572F / #6E6D66 / #C0BFB7
SER       #22211F / #8F8E86 / #C0BFB7 / rgba(34,33,31,.52) /
          #DBDAD3 / rgba(34,33,31,.3)
RAMP      #DBDAD3 / #C0BFB7 / #8F8E86 / #22211F / #F5572F
DRAMP4    #F5572F / #C0BFB7 / #8F8E86 / rgba(240,240,238,.26)
RAMPDK    rgba(240,240,238,.26) / rgba(240,240,238,.42) /
          rgba(240,240,238,.60) / rgba(240,240,238,.84) / #F5572F
```

Dark variant (added 2026-10-23):

```text
CARDBG    #1F1E1C
DK8       #ECEBE7 / #D8D7CF / #C9C8C0 / #B3B2AA /
          #9C9B93 / #85847D / #6E6D66 / #585753
HL        #ECEBE7
LABEL     #C9C8C0       SUB        #9C9B93
SRCROW    #4A4944       RULE       #3A3935
LINK_SAME #45443F       LINK_CROSS #353431
LINK_HEAVY #504F4A      LINK_FAINT #2E2D2A
```

The dark card keeps the same orange `#F5572F` as the single focal state — it measures about
5.0:1 on `CARDBG`, stronger than on the light background. Do not invent a second dark gradient
or a second accent.

## Graphite · 石墨青

Logic: `mono+accent`. Added 2026-10-17 as an authored preset for AI and tech-news explainers,
tool tutorials, product updates, comparisons, and conclusion-led pieces. It is not adapted from the
Lieflat canonical source. Ink and slate carry text, structure and paired comparisons; the deep teal
`HERO` marks the one conclusion, change, or fixed state per beat. Steel blue `DATA` separates a
two-item comparison without adding a warm color.

```text
BG        #F4F6F7
TXT       #15202B
MUT       rgba(21,32,43,.60)
LAB       rgba(21,32,43,.72)
FAINT     rgba(21,32,43,.32)
FLOOR     rgba(21,32,43,.24)
QUIET     rgba(21,32,43,.15)
TRACK     rgba(21,32,43,.12)
GRID      rgba(21,32,43,.16)
DATA      #2B5A7A
DATA2     #7A8B99
HERO      #0B8563
HERODK    #2FC79E
FAINTDATA #BFD9E0
BEAD      #7A8B99
HALO      rgba(244,246,247,.92)

CAT4      #0B8563 / #2B5A7A / #7A8B99 / #BFD9E0
CAT3      #0B8563 / #2B5A7A / #7A8B99
CAT3L     #2B5A7A / #7A8B99 / #BFD9E0
HEAT      #2B5A7A / #7A9DB5 / #BFD9E0
SER       #2B5A7A / #15202B / #7A8B99 / #BFD9E0 / #C9DDE4 /
          rgba(43,90,122,.4)
RAMP      #DCE7EC / #BFD9E0 / #7A8B99 / #2B5A7A / #15202B
DRAMP4    #BFD9E0 / #7A8B99 / rgba(244,246,247,.26)
RAMPDK    rgba(244,246,247,.26) / rgba(244,246,247,.42) /
          rgba(244,246,247,.60) / rgba(244,246,247,.84) / #2FC79E
```

Dark variant:

```text
CARDBG    #15202B
DK8       #EEF2F4 / #D6DFE5 / #BCCBD4 / #9DB1BE /
          #7F97A6 / #6A8294 / #557284 / #46657A
HL        #EEF2F4
LABEL     #9DB1BE       SUB        #7F97A6
SRCROW    #3E5566       RULE       #22313D
LINK_SAME #2E4A5C       LINK_CROSS #263D4D
LINK_HEAVY #36607A      LINK_FAINT #1F3340
```

Contrast on white (`#FFFFFF`), computed by script (WCAG relative luminance): `TXT` about
16.5:1; `DATA` about 7.4:1; `HERO` `#0B8563` about 4.6:1; `DATA2` about 3.5:1.
On the default preset paper (`#F4F6F7`), `HERO` is about 4.26:1, below the 4.5:1 body-text
threshold, so use it for large text and shapes and use `ink` for body text. `DATA2` is for large
text and shapes only; `FAINTDATA` is for shapes only. On `CARDBG`, `HERODK` is about 7.7:1
and `HL` is about 14.6:1.

Do not place `HERO` and `DATA` as two equal categories. Use `DATA2` and `SER` for peers; reserve
`HERO` for the single focal element. `HERO` was shifted from `#0B7A6E` to the greener `#0B8563`
on 2026-10-23: the original teal measured only 1.41:1 against `DATA` and read as the same cool
family in fast motion, and the old `HEAT` mixed teal into the blue-gray ladder, so `HEAT` is now
a pure `DATA` lightness ramp and teal hues belong to `HERO` alone. Keep `HERO` and `DATA` from
touching as adjacent same-size fills in one beat; separate them with ink outlines or spacing.

## Selection and fallback

1. Select by the spoken content, data shape, and tone:
   - ordered data, time series, progress, ranking, or a single metric → `porcelain`;
   - up to four unordered categories → `palm`;
   - restrained black/gray composition with one controlled visual focus → `wire`;
   - AI and tech news, tool tutorials, product updates, comparisons, or conclusion-led
      explainers → `graphite`;
    - semantic fit is unclear → `porcelain`.
2. The fallback is visual only. When porcelain is used for an ambiguous or high-cardinality case,
   do not imply a false ordering with `ramp`; use labels, position, length, area, or repeated data
   tones to carry the distinction.
3. The word “Morandi” is a legacy reference, not an active selection keyword. Do not load or copy
  `morandi-legacy.md` in the active workflow.

## Exceptions and QC

Real UI colors, source evidence, user-provided assets, and neon/reference-reconstruction colors may
remain unchanged when changing them would make the evidence inaccurate. Mark those colors as
`source`, `ui`, or `reference` exceptions. All authored backgrounds, geometry, labels, and data
states should use the selected preset roles.

Check body text at `4.5:1`, large text at `3:1`, and key boundaries or interactive states at
`3:1` against their adjacent color. The light colors in the ramps are intentionally shape-oriented;
do not use them as small text merely because they are in the theme.
