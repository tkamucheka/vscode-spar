'use strict';

// Client for spar-asm-lsp-server, the SPAR assembly language server built
// with the SPAR toolchain. It provides diagnostics and quick fixes, hover, go
// to definition, references, rename, completion, signature help, the
// outline, folding, formatting, semantic highlighting and include links.
// Without the server, the grammar and the lexical semantic token provider in
// extension.js still highlight the file.

const os = require('os');
const path = require('path');
const vscode = require('vscode');
const { LanguageClient, State } = require('vscode-languageclient/node');

/** @type {LanguageClient | undefined} */
let client;

/** Called with whether the server is running whenever that changes. */
let onRunningChanged = (/** @type {boolean} */ _running) => {};

/**
 * Resolve the configured server path: expand `~` and `${workspaceFolder}`,
 * and resolve a relative path containing a separator against the first
 * workspace folder. A bare name is left for PATH lookup.
 * @param {string} configured
 * @returns {string}
 */
function resolveServerPath(configured) {
  const folder = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
  let resolved = configured.replace(/^~(?=$|[\\/])/, os.homedir());
  if (folder)
    resolved = resolved.replace(/\$\{workspaceFolder\}/g, folder);
  if (folder && !path.isAbsolute(resolved) && /[\\/]/.test(resolved))
    resolved = path.resolve(folder, resolved);
  return resolved;
}

/**
 * Start the language server if it is enabled.
 * @returns {Promise<void>}
 */
async function startClient() {
  const config = vscode.workspace.getConfiguration('spar.server');
  if (!config.get('enabled', true))
    return;

  const command = resolveServerPath(
      config.get('path', 'spar-asm-lsp-server'));
  /** @type {import('vscode-languageclient/node').ServerOptions} */
  const serverOptions = { command, args: config.get('args', []) };
  /** @type {import('vscode-languageclient/node').LanguageClientOptions} */
  const clientOptions = {
    // The server resolves includes against the document's directory, so it
    // only accepts documents saved to disk.
    documentSelector: [{ scheme: 'file', language: 'spar' }],
  };

  // The client id `spar` makes `spar.trace.server` control protocol tracing.
  client = new LanguageClient(
      'spar', 'SPAR Language Server', serverOptions, clientOptions);
  client.onDidChangeState(
      (event) => onRunningChanged(event.newState === State.Running));
  try {
    await client.start();
  } catch (error) {
    const failed = client;
    client = undefined;
    await failed.dispose().catch(() => {});
    const choice = await vscode.window.showWarningMessage(
        `SPAR language server could not start ('${command}'): ` +
            `${error instanceof Error ? error.message : error}. ` +
            'Highlighting and snippets still work.',
        'Open Settings');
    if (choice === 'Open Settings')
      await vscode.commands.executeCommand(
          'workbench.action.openSettings', 'spar.server');
  }
}

/**
 * @returns {Promise<void>}
 */
async function stopClient() {
  if (!client)
    return;
  const running = client;
  client = undefined;
  await running.stop().catch(() => {});
}

/**
 * @param {import('vscode').ExtensionContext} context
 * @param {(running: boolean) => void} [runningChanged] Told whether the
 *     server is running whenever that changes.
 */
function activateLanguageServer(context, runningChanged) {
  if (runningChanged)
    onRunningChanged = runningChanged;
  context.subscriptions.push(
      vscode.commands.registerCommand('spar.restartServer', async () => {
        await stopClient();
        await startClient();
      }),
      vscode.workspace.onDidChangeConfiguration(async (event) => {
        if (!event.affectsConfiguration('spar.server'))
          return;
        await stopClient();
        await startClient();
      }),
      { dispose: () => { void stopClient(); } });
  return startClient();
}

module.exports = {
  activateLanguageServer,
  deactivateLanguageServer: stopClient,
  resolveServerPath,
};
