# Changelog

Decorium использует [Semantic Versioning](https://semver.org/). Этот файл содержит пользовательски и операционно значимые изменения; подробное engineering evidence находится в [Documentation hub](docs/README.md) и Git history.

## [Unreleased]

### Added

- `ClientBrief V3` стал active runtime policy для трёх shipped orders: versioned `demand-weighted-coverage` policy отделяет partial client-priority satisfaction от hard functional scenario completion criteria; retired V2 catalog/schema removed from active runtime.
- Three-channel evaluation: **50% style**, **20% client priorities**, **30% ergonomics**, with once-only `75% / 25%` target-fit/composition blend, V3 `capped-square-root-footprint` style influence policy and Explanation V2.
- Item `catalog V4` and schema V4: every one of 34 shipped items now declares semantic role and `SpatialBehavior`; only authored floor obstacles enter generic occupancy and clearance.

### Changed

- Product canon уточнён: Decorium развивается как мультистилевая client-brief-driven игра; Scandinavian является shipped profile, а не global style.
- Документация консолидирована в active guides для продукта, architecture, content authoring и operations; historical MVP/slice materials remain traceability evidence rather than current policy.
- Корневой README приведён к active V4/V3 baseline и ведёт в единый documentation hub; data lifecycle guide separates active runtime files from retained historical versions.

## [1.0.0] — 2026-08-15

### Added

- Versioned local player profile V3, persisted settings, campaign progress и authored level selection.
- Кампания из трёх уровней с deterministic progression и refresh unlock state после completion.
- Style, composition и spatial ergonomics evaluation с data-driven feedback, stars и score aggregation 70% / 30%.
- Passage zones, minimum clearance и functional layout scoring: dining seats, sofa-to-TV orientation и coffee table in front of sofa.
- Item catalog V3 с semantic `InteractionProfile`; explicit `tv-001` view target и dedicated television visual profile.
- Touch/keyboard intent parity, undo, reduced motion, UI scale и quality tier settings.
- BuildInfo V1, generated release manifest, CI release gate и release runbook.

### Fixed

- Completion workflow uses canonical `levelId`.
- Campaign availability refreshes immediately after successful completion.
- Valid functional furniture pairs are excluded from generic clearance penalty without suppressing unrelated spatial violations.

### Verification

- Full test suite, production build и production dependency audit are required release gates.
