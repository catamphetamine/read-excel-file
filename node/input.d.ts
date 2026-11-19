import type { Stream } from 'node:stream';
import type { Blob } from 'node:buffer';

export type Input = string | Stream | Blob | Buffer | ArrayBuffer | ArrayBufferView;