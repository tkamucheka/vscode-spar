# SPAR VS Code Extension (Local)

This folder contains a local VS Code extension for SPAR assembly syntax support.

## Features
1. Language registration for `.spar` files.
2. TextMate scopes for comments, strings, opcodes, types, registers, labels, numbers, and operators.
3. Semantic token provider for robust runtime highlighting.
4. Snippets for common SPAR constructs.
5. Golden sample for manual highlight checks: `test/golden_highlighting.spar`.

## Local Development
1. Open `utils/vscode-spar` in VS Code.
2. Press `F5` to start an Extension Development Host.
3. Open a `.spar` file in the Extension Host.

## Local Validation
```bash
cd utils/vscode-spar
npm run check
```

## Package as VSIX (Local Install)
```bash
cd utils/vscode-spar
npm run package:vsix
```

Install the generated `.vsix` locally:
```bash
code --install-extension ./spar-assembly-*.vsix
```

## Troubleshooting
1. If highlighting does not update, restart the Extension Host and reload the window.
2. Confirm language mode is `SPAR`.
3. Use `Developer: Inspect Editor Tokens and Scopes` to inspect active scopes.
