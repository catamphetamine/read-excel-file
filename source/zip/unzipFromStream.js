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
// The benchmark tells that `unzipper` is 2x faster than `fflate` with the default `ZipInflate` decompressor.
//
// However, when swapping `fflate`'s default `ZipInflate` decompressor with a custom "native" `zlib` one,
// `fflate` happens to be about 20% faster than `unzipper`.
//
// Still, when measuring the total time of parsing `.xlsx` files,
// the time difference becomes unmeasurable between `unzipper`
// and `fflate` with "native" `zlib` decompressor,
// as could be seen by running `npm run test:benchmark` command
// where `fflate` is slightly faster than `unzipper`.
//
// * When decompressing a `1 MB` `.xlsx` file, the decompression time is `90 ms`
//   when using `fflate` with `zlib` decompressor and `100 ms` when using `unzipper` decompressor.
// * When decompressing a `10 MB` `.xlsx` file, the decompression time is `530 ms`
//   when using `fflate` with `zlib` decompressor and `550 ms` when using `unzipper` decompressor.
// * When decompressing a `50 MB` `.xlsx` file, the decompression time is `2800 ms`
//   when using `fflate` with `zlib` decompressor and `3000 ms` when using `unzipper` decompressor.
//
// So, at the end of the day, there's no substantial difference between the two
// when it comes to parsing `.xlsx` files, and one may choose depending on personal preference.
//
// And my personal preference leans towards `unzipper` because:
//
// * I personally refactored it into `unzipper-esm` in about 5-6 hours.
//   https://github.com/ZJONSSON/node-unzipper/pull/356
//
// * It is designed as a Node.js-first module, i.e. it is designed around the concept
//   of Node.js streams "from the ground up". Meanwhile, `fflate` is a "universal" module
//   and it does not honor Node.js streams "contract", i.e. it just unzips the archive
//   in a synchronous fashion, without controlling the data throughput. This means that
//   `fflate` stores the entire unzipped file contents in RAM rather than forwarding it
//   to a next stream chunk-by-chunk, which is not a big deal, but still not that elegant.
//   The "next stream", by the way, is the XML parser which currently doesn't support
//   Node.js streams (because `saxen` doesn't account for them) but theoretically it could.
//
// * `unzipper` uses native `zlib` decompressor which `fflate` doesn't officially include
//   and it had to be hacked into it using a couple of tricks. That's also no big deal,
//   but still a slightly weird experience.
//
export { default as default } from './unzipFromStream.unzipper.js'