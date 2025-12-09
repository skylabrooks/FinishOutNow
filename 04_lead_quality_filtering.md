# 04_lead_quality_filtering.md

Concise rules for defining high‑quality, actionable, recent leads.

## 1. Config Defaults
- `min_declared_value` (e.g., 10k)
- `recent_days_default` (30)
- `min_lead_score_high_quality` (60)
- `supported_project_types` + `supported_land_use_categories`
- DFW region polygon

## 2. Quality Flags
Set at normalization:
- geocoded
- value_above_threshold
- type_supported
- land_use_supported
- business_verified
- within_region

Then derive:
- `is_actionable` = all flags true + stage allowed
- `is_recent` = event_date within stage limits
- `high_quality_candidate` = actionable + score ≥ threshold

## 3. High‑Quality View
`lead_high_quality` contains only actionable + recent + sufficiently scored leads.
APIs default to reading from this view.

## 4. Feedback Loop
- Capture irrelevant/high‑value feedback.
- Periodic analysis adjusts thresholds and scoring.

## 5. Checklist for New Sources
- Map fields → canonical schema.
- Apply quality flags.
- Ensure only high‑quality leads enter high‑quality view.
- Add tests for edge cases.

