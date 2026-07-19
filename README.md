# pi-rtk-strict

A fork of [pi-rtk](https://github.com/mcowger/pi-rtk) with strict executable-only command matchers. Same upstream techniques, but the build/test filters no longer fire on substring matches inside command arguments.

## What this fixes

The original `isBuildCommand` and `isTestCommand` functions match against the **entire command string**, not just the executable token. So:

- `echo "make a sandwich" && ls` → treated as a build
- `find . -name "*test*"` → treated as a test run
- `gh issue comment 2 --body "Build successful"` → literally shows `✓ Build successful (0 units compiled)` as the bash result
- Any `curl … | grep test | head` → `📋 Test Results: ✅ 0 passed`

The LLM then acts on the false summary. From upstream issue #2: *"It also confuses the LLM because it goes 'echo test1'. Hmm bash is fucked let me try writing a 100 line python script."*

This fork replaces those matchers with executable-only checks: strip leading env assignments, take the first whitespace-delimited token (or first N tokens for multi-word commands like `cargo build`), and only match against that.

It also stops collapsing successful output. `filterBuildOutput` and `aggregateTestOutput` now return `null` on clean runs so the raw output is preserved — useful for verifying link lines, generated files, and resolved config.

## Changes

### `techniques/build.ts`

- `isBuildCommand`: substring match → executable-token match (single + multi-word commands)
- `filterBuildOutput`: returns `null` instead of `✓ Build successful (N units compiled)` on clean builds

### `techniques/test-output.ts`

- `isTestCommand`: word-boundary regex on full command → executable-token match
- `aggregateTestOutput`: returns `null` instead of summary on all-pass runs

## Install

```bash
pi install npm:pi-rtk-strict
```

Or in `~/.pi/agent/settings.json`:

```json
{
  "packages": [
    "npm:pi-rtk-strict"
  ]
}
```

## Config

Drop-in replacement — same config format as upstream. With strict matchers, the previously-dangerous filters become safe to enable:

```json
{
  "enabled": true,
  "logSavings": true,
  "showUpdateEvery": 10,
  "techniques": {
    "ansiStripping": true,
    "truncation": { "enabled": true, "maxChars": 30000 },
    "sourceCodeFiltering": { "enabled": false, "level": "minimal" },
    "smartTruncation": { "enabled": true, "maxLines": 400 },
    "testOutputAggregation": true,
    "buildOutputFiltering": true,
    "gitCompaction": true,
    "searchResultGrouping": true,
    "linterAggregation": true
  }
}
```

(Note: `sourceCodeFiltering` still recommended off — it strips comments from `read` results and breaks `edit` exact-text matching. Same as upstream.)

## Acknowledgments

All credit to [Matt Cowger](https://github.com/mcowger) for the original extension. This fork exists only because the upstream matcher bug caused the LLM to act on false summaries in interactive sessions, and the upstream repo was archived before the issue could be addressed.

If upstream becomes active again, the changes here are small enough to merge upstream — see the [issue thread](https://github.com/mcowger/pi-rtk/issues/2) for context.

## License

MIT — same as upstream.
