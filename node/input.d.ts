import type { Stream } from 'stream';
import type { Blob } from 'buffer';

// FYI: `Buffer` is also an `ArrayBuffer`.
export type Input = string | Stream | Blob | Buffer;