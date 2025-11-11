/**
 * CompressionStream and DecompressionStream polyfill for Bun
 * @license MIT
 */

import { Readable, Writable } from "node:stream"
import zlib from "node:zlib"

/// Reference: https://compression.spec.whatwg.org/#supported-formats
type CompressionFormat = "deflate" | "deflate-raw" | "gzip"

const COMPRESSION_FORMATS: Record<CompressionFormat, () => any> = {
    deflate: zlib.createDeflate,
    "deflate-raw": zlib.createDeflateRaw,
    gzip: zlib.createGzip,
}

const DECOMPRESSION_FORMATS: Record<CompressionFormat, () => any> = {
    deflate: zlib.createInflate,
    "deflate-raw": zlib.createInflateRaw,
    gzip: zlib.createGunzip,
}

function isValidFormat(format: unknown): format is CompressionFormat {
    return typeof format === "string" && format in COMPRESSION_FORMATS
}

class CompressionStreamPolyfill {
    public readonly readable: ReadableStream<Uint8Array>
    public readonly writable: WritableStream<Uint8Array>

    constructor(format: CompressionFormat) {
        if (!isValidFormat(format)) {
            throw new TypeError(
                `Invalid compression format '${String(format)}'. ` +
                    `Use: deflate, deflate-raw, or gzip`,
            )
        }

        const transform = COMPRESSION_FORMATS[format]()
        this.readable = Readable.toWeb(transform) as ReadableStream<Uint8Array>
        this.writable = Writable.toWeb(transform) as WritableStream<Uint8Array>
    }
}

class DecompressionStreamPolyfill {
    public readonly readable: ReadableStream<Uint8Array>
    public readonly writable: WritableStream<Uint8Array>

    constructor(format: CompressionFormat) {
        if (!isValidFormat(format)) {
            throw new TypeError(
                `Invalid compression format '${String(format)}'. ` +
                    `Use: deflate, deflate-raw, or gzip`,
            )
        }

        const transform = DECOMPRESSION_FORMATS[format]()
        this.readable = Readable.toWeb(transform) as ReadableStream<Uint8Array>
        this.writable = Writable.toWeb(transform) as WritableStream<Uint8Array>
    }
}

if (typeof globalThis.CompressionStream === "undefined") {
    Object.defineProperty(globalThis, "CompressionStream", {
        value: CompressionStreamPolyfill,
        writable: true,
        enumerable: false,
        configurable: true,
    })
}

if (typeof globalThis.DecompressionStream === "undefined") {
    Object.defineProperty(globalThis, "DecompressionStream", {
        value: DecompressionStreamPolyfill,
        writable: true,
        enumerable: false,
        configurable: true,
    })
}
