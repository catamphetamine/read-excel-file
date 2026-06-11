// Currently, there're two implementations:
// * `fflate` — a pure-javascript implementation that uses `fflate` package.
// * `unzipper` — a "native" Node.js module that uses Node's `zlib` which is written in C.
//
// The implementations are compared in a benchmark:
//
// ```
// npm run test:benchmark:unzipFromStream
// ```
//
// The benchmark tells that `unzipper` is 2x faster than `fflate`.
//
export { default as default } from './unzipFromStream.unzipper.js'