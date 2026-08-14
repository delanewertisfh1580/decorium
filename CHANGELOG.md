# Changelog

Decorium использует [Semantic Versioning](https://semver.org/). Этот файл содержит пользовательски и операционно значимые изменения; подробное engineering evidence находится в [Documentation hub](docs/README.md) и Git history.

## [Unreleased]

### Changed

- Документация консолидирована в active guides для продукта, architecture, content authoring и operations; исторические MVP/slice материалы перенесены в `docs/history/`.
- Корневой README теперь является concise запускным entry point и ведёт в единый documentation hub.

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
