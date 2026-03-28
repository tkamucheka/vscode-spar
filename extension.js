'use strict';

const vscode = require('vscode');

/**
 * @param {import('vscode').ExtensionContext} context
 */
function activate(context) {
  console.log('[SPAR Assembly] Extension activated');

  const tokenTypes = [
    'keyword',
    'type',
    'variable',
    'number',
    'string',
    'comment',
    'operator'
  ];
  const legend = new vscode.SemanticTokensLegend(tokenTypes, []);

  const provider = {
    provideDocumentSemanticTokens(document) {
      const builder = new vscode.SemanticTokensBuilder(legend);

      const keywordRe = /\b(?:LOADM|LOADV|LOADCOLV|LOADROWV|STOREM|STOREV|STOREROWV|STORECOLV|ADD|SUB|MULT|REDUCE|TRANSPOSE|RELU|SIGMOID|TANH|SOFTMAX|FOR|TO|STEP|END)\b/gi;
      const typeRe = /\b(?:matrix|vector)\b/gi;
      const regRe = /\b[Rr][0-9]+\b/g;
      const numRe = /\b[+-]?\d+(?:\.\d*)?(?:[eE][+-]?\d+)?\b/g;
      const strRe = /"([^"\\]|\\.)*"/g;
      const commentRe = /;.*/g;
      const opRe = /=/g;
      const identRe = /\b[%A-Za-z_][A-Za-z0-9_%]*\b/g;

      /**
       * @param {{start:number,end:number}[]} ranges
       * @param {number} start
       * @param {number} end
       * @returns {boolean}
       */
      const overlaps = (ranges, start, end) => {
        for (const r of ranges) {
          if (start < r.end && end > r.start)
            return true;
        }
        return false;
      };

      for (let lineNo = 0; lineNo < document.lineCount; ++lineNo) {
        const line = document.lineAt(lineNo).text;
        const commentStart = line.indexOf(';');
        const codePart = commentStart >= 0 ? line.slice(0, commentStart) : line;
        /** @type {{start:number,len:number,type:number}[]} */
        const lineTokens = [];
        /** @type {{start:number,end:number}[]} */
        const occupied = [];

        /**
         * Add matches from regex as semantic tokens, skipping overlaps.
         * @param {RegExp} re
         * @param {number} tokenType
         */
        const addMatches = (re, tokenType) => {
          for (const m of codePart.matchAll(re)) {
            const start = m.index;
            const end = start + m[0].length;
            if (overlaps(occupied, start, end))
              continue;
            lineTokens.push({ start, len: m[0].length, type: tokenType });
            occupied.push({ start, end });
          }
        };

        // Precedence: strings > keywords/types/registers/numbers/operators > identifiers.
        addMatches(strRe, 4);
        addMatches(keywordRe, 0);
        addMatches(typeRe, 1);
        addMatches(regRe, 2);
        addMatches(numRe, 3);
        addMatches(opRe, 6);
        addMatches(identRe, 2);

        if (commentStart >= 0) {
          const commentText = line.slice(commentStart);
          const commentMatch = commentText.match(commentRe);
          if (commentMatch)
            lineTokens.push(
                { start: commentStart, len: commentMatch[0].length, type: 5 });
        }

        lineTokens.sort((a, b) => a.start - b.start || b.len - a.len);
        for (const t of lineTokens)
          builder.push(lineNo, t.start, t.len, t.type, 0);
      }

      return builder.build();
    }
  };

  context.subscriptions.push(
      vscode.languages.registerDocumentSemanticTokensProvider(
          { language: 'spar' }, provider, legend));
}

function deactivate() {}

module.exports = {
  activate,
  deactivate
};
