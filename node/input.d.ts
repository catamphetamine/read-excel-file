import type { Stream } from 'node:stream';
import type { Blob } from 'node:buffer';

// FYI: `Buffer` is also an `ArrayBuffer`.
export type Input = string | Stream | Blob | Buffer;