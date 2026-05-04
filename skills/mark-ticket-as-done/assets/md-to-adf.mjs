// Convert markdown on stdin to Atlassian Document Format (ADF) JSON on stdout.
// Output is a single ADF document as compact JSON (no trailing newline).
//
// Usage:
//   NODE_PATH="$(npm root -g)" node assets/md-to-adf.mjs < comment.md > comment.adf.json
//
// Requires `marklassian` to be installed globally:
//   npm i -g marklassian
//
// See https://github.com/jamsinclair/marklassian.

import { markdownToAdf } from 'marklassian';

let input = '';
process.stdin.setEncoding('utf8');
process.stdin.on('data', chunk => { input += chunk; });
process.stdin.on('end', () => {
  process.stdout.write(JSON.stringify(markdownToAdf(input)));
});
