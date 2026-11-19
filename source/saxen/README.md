# saxen

This code was copy-pasted from `saxen` [repository](https://github.com/nikku/saxen) on Jul 16th, 2026 (version `11.2.0`) because starting from version `11.x` `saxen` dropped CommonJS export for [no reason](https://github.com/nikku/saxen/commit/3303b7a247fada680ae85bf46acd0296242189fc).

It looks like on some rare occasions some people still [require](https://gitlab.com/catamphetamine/read-excel-file/-/work_items/115) CommonJS exports for some legacy corporate projects.

Additionally, `saxen` code would have to be copy-pasted anyway for compatibility with [worker-f](https://www.npmjs.com/package/worker-f) because `Parser` is not a "self-contained" function. For that, the code in `parser.js` had to be wrapped into a single wrapper function.
