# Decorium web release runbook

**Owner:** release operator  
**Applies to:** release-manifest and CI gate introduced by PROD-006

## Purpose

This runbook gives a reproducible procedure for identifying a web bundle, validating a candidate release and returning to a previously verified artifact. It is intentionally limited to operational build metadata; it does not request player data or alter gameplay state.

## Candidate release procedure

| Step | Operator action | Expected evidence |
|---|---|---|
| 1 | Open or create a pull request. | Release gate starts automatically. |
| 2 | Confirm `npm ci`, tests, build, manifest validation and production audit succeed. | All CI steps are green. |
| 3 | Open the retained artifact `decorium-web-release`. | Artifact contains `index.html`, runtime JSON and `release-manifest.json`. |
| 4 | Inspect `release-manifest.json`. | Schema v1, SemVer version, 40-character SHA, channel and build timestamp. |
| 5 | Browser-smoke `index.html` in the target hosting environment. | HUD shows `v<version> · <channel> · <short SHA>` and first level loads. |
| 6 | Promote the exact verified `dist` artifact through the configured host. | Runtime HUD revision matches artifact manifest revision. |

## Diagnosing a report

Ask for the compact HUD version string or a copy of the non-sensitive release manifest. Resolve the short revision against the repository and inspect the corresponding CI artifact. Do not ask for localStorage, profile export, room state or browser device identifiers solely to identify the release.

## Rollback procedure

If a newly deployed release causes a production regression, identify the last green `decorium-web-release` artifact within its 14-day retention period. Verify its `release-manifest.json` with `node scripts/verify-release-artifact.mjs <artifact>/release-manifest.json`, deploy that exact `dist` content, then browser-smoke the first level and compare the HUD revision against the restored manifest.

## Exit criteria

A release or rollback is operationally complete when its CI run is green, its retained artifact validates against `BuildInfo v1`, and runtime exposes the same compact version/channel/revision identity without blocking game bootstrap.
