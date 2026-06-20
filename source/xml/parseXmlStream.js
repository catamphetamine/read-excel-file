// Currently there're 2 XML stream parser implementations:
// * `sax` — The "classic" one. Supports Node.js streams.
// * `saxen` — The small and fast one.
//
// `sax` has been around for a long time, and is written by a well-known developer,
// but it performance is very subpar compared to `saxen`: reading a `10 MB` `.xlsx` file
// with `sax` is about `1.4` secs while with `saxen` it's about `0.3` secs,
// meaning that `saxen` is light-years ahead of `sax` in terms of performance.
//
// `sax` has an advantage of parsing XML from a Node.js stream rather than from just a `string`,
// but the weird part is that when enabled, "streaming" mode results in significantly slower parsing:
// about `3.1` secs. in "streaming" mode vs about `1.4` secs. in non-"streaming" mode.
//
// `sax` "bundled" size is `22.5 kB` (`8.1 kB` gzipped).
// `saxen` "bundled" size is `6.15 kB` (`2.7 kB` gzipped).
//
export { default as default } from './parseXmlStream.saxen.js'