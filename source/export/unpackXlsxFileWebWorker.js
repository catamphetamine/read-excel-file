// Even though this code is meant to be run in a web worker,
// it still uses the "async" unzipper because it unzips the files
// inside a `.zip` archive in parallel rather than sequentially,
// which is going to be faster on huge `.xlsx` files.
export { default as default } from './unpackXlsxFileBrowser.js'