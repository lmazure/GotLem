# GotLem Architecture

GotLem is a TypeScript-based CLI tool designed for modularity and minimal dependencies.

## Component Overview

### 1. Configuration Loader (`src/config.ts`)
Uses [js-yaml](https://github.com/nodeca/js-yaml) to parse and validate the user-provided configuration. It ensures the environment and rules are correctly defined before any analysis starts.

### 2. GitLab API Client (`src/gitlab.ts`)
A REST-based client using [axios](https://axios-http.com/) that handles communication with GitLab.
- **Pagination**: Automatically handles GitLab's cursor-based pagination for large projects/groups.
- **Scope**: Fetches issues from projects and epics from groups.
- **Recursion**: For groups, it recursively fetches all descendant epics and all issues from subgroups/contained projects.
- **Milestones**: Resolves active milestones at both project and group levels. It efficiently handles and caches milestones for projects discovered during recursive group searches.

### 3. Rule Engine (`src/rules.ts`)
The core logic of the tool, built on top of [Handlebars](https://handlebarsjs.com/).
- **Perimeter Evaluation**: Compiles the `perimeter` field of a rule and executes it in a context containing the GitLab item and active milestones.
- **Custom Helpers**: Implements domain-specific helpers like `hasNoMilestone` and `getCurrentMilestone`.
- **Error Handling**: Captures evaluation errors (e.g., ambiguous milestones) and reflects them in the report.

### 4. HTML Report Generator (`src/report.ts`)
Generates a self-contained, interactive HTML file.
- **Modern UI**: Uses vanilla CSS for a clean, responsive layout.
- **Direct Interaction**: Contains embedded JavaScript that uses the browser's `fetch` API to post comments directly to GitLab. This bypasses the need for a backend proxy and keeps secrets (PAT) in the user's browser.

### 5. Main Orchestration (`src/index.ts`)
The entry point that coordinates the workflow:
- Parses command-line arguments.
- Orchestrates the fetch-evaluate-generate cycle.
- Automatically opens the generated report in the default browser using the [open](https://github.com/sindresorhus/open) package.

## Development Principles

### Fail-Fast Philosophy
GotLem follows a strict "fail-fast" philosophy to ensure predictability and avoid hidden bugs:
- **No Defensive Programming**: Do not provide default values for parameters that are expected to be defined. If a required input is missing or ambiguous, the tool must throw an error or exit immediately.
- **Strict Validation**: All external inputs (CLI arguments, YAML configuration) are validated upfront.

### Automated Testing
- **Mandatory Coverage**: Every new feature or fix must be covered by automated tests.
- **Test Suite**: Tests are located in the `tests/` directory and use the built-in Node.js test runner.

## Technical Stack
- **Language**: TypeScript
- **Runtime**: Node.js (Targeting latest LTS)
- **Dependencies**: `axios`, `handlebars`, `js-yaml`, `open`
- **Testing**: Node.js built-in test runner (`node:test`, `node:assert`)
