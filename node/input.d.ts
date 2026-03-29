import { Stream } from 'stream';
import { Blob } from 'buffer';

// FYI: `Buffer` is also an `ArrayBuffer`.
export type Input = string | Stream | Blob | Buffer;