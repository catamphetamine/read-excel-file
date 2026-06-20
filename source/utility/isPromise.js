export default function isPromise(anything) {
  return typeof anything === 'object' && typeof anything.then === 'function'
}

// export default function isPromise<Value>(anything: unknown): anything is Promise<Value> {
//   return (
//     typeof anything === 'object' &&
//     typeof (anything as Promise<unknown>).then === 'function'
//   )
// }
