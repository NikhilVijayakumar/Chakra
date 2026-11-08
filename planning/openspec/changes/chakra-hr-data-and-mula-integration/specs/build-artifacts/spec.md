# Capability: build-artifacts


## ADDED Requirements

### Requirement: Release artifacts
One command, `python scripts/build.py`, SHALL build the release artifacts for the current machine: the CLI folder `Chakra-CLI/` containing the executable, its runtime files, `chakra.cmd` (or `chakra.sh`), a `config/.env` created once and a `build.json`; the npm package tarball; and, on Windows, the per-user installer `Chakra-CLI-Setup-<version>.exe`. The layout and rules are recorded in [Build artifacts](../../../../../../knowledge/concepts/build-artifacts.md).

#### Scenario: Release build
- **WHEN** the release build runs on Windows
- **THEN** the output folder contains `Chakra-CLI/`, `Chakra-CLI-Setup-<version>.exe` and `nikhilvijayakumar-chakra-ui-<version>.tgz`

#### Scenario: Built CLI answers
- **WHEN** `<out>/Chakra-CLI/chakra.cmd meta version` runs
- **THEN** it reports the built version with `apiVersion` 2

#### Scenario: Installer upgrade
- **GIVEN** a CLI installed by the installer
- **WHEN** a newer installer runs and the CLI is used again
- **THEN** its settings and cache under `%APPDATA%\chakra` are unchanged

### Requirement: Development build
`python scripts/build.py --dev` SHALL build the CLI folder and the library into `frontend/dist-lib` in place, and write `run-ui.cmd` (or `run-ui.sh`) that starts the reference app, without producing an installer or tarball.

#### Scenario: Dev build
- **WHEN** the dev build runs
- **THEN** the output folder contains `Chakra-CLI/` and the launcher, `frontend/dist-lib` is current, and no installer or `.tgz` is written

### Requirement: Configurable outputs
Build output locations SHALL come from `--out`, then `CHAKRA_BUILD_DIR` or its per-part variants, then `CHAKRA_DEV_DIR` for the dev build, then `./dist`, and SHALL NOT be hardcoded to one machine's paths.

#### Scenario: No configuration
- **GIVEN** no build variables are set and no `--out` is given
- **WHEN** the build runs
- **THEN** it writes into `dist/` at the repository root
