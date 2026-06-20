// `unzipFromStream` function reads `.zip` archive data from a Node.js stream.
//
// Even though it receives a Node.js stream as an input, it doesn't return the results
// as a Node.js output stream (with `objectMode: true` setting). The reason is that
// the result of this function is then passed to the XML parser which currently
// doesn't support consuming a Node.js stream and instead consumes the entire XML document
// as a single string. This means that implementing streaming output in this function
// wouldn't result in any performance improvements, so currently it simply returns
// a "map" of all files in the input `.zip` archive, and that seems to be enough.
//
// Currently, there're two decompressor implementations:
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
// However, when swapping `fflate`'s default `ZipInflate` decompressor with a custom
// "native" `zlib` one, `fflate` happens to be about 20% faster than `unzipper`.
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
//   and it does not implement Node.js streams "contract", i.e. it just unzips the archive
//   as fast as it can consume it from the input stream, without throttling the data throughput
//   in cases when the input data flows faster than `fflate` can process it. This means that
//   in the "worst case" scenario when `fflate`'s decompressor is unable to keep up with the
//   data influx, it would "buffer" the entire `.zip` archive in RAM until it's processed.
//   And while this is no big deal by any means, it's still not as elegant as adhering to
//   Node.js streaming protocol.
//
// * `unzipper` uses native `zlib` decompressor which `fflate` doesn't officially include
//   and it had to be hacked into it using a couple of tricks. That's also no big deal,
//   but still a slightly weird experience.
//
// * Rumors are circulating that `fflate`'s "streaming" `Zip`/`Unzip` classes have a few
//   implementation issues when compared to non-"streaming" `zipSync`/`unzipSync`/`zip`/`unzip` functions.
//   Some people even suggested in the comments that `Zip`/`Unzip` classes are not really production-ready
//   when compared to `zipSync`/`unzipSync`/`zip`/`unzip` functions.
//   https://github.com/101arrowz/fflate/issues/282
//
export { default as default } from './unzipFromStream.unzipper.js'