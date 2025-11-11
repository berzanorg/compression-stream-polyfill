import { test, expect } from "bun:test"
import "./index"
import zlib from "node:zlib"

async function compress(
    text: string,
    format: "gzip" | "deflate" | "deflate-raw",
) {
    const input = new ReadableStream({
        start(c) {
            c.enqueue(new TextEncoder().encode(text))
            c.close()
        },
    })

    const compressed = input.pipeThrough(new CompressionStream(format))
    const reader = compressed.getReader()
    const chunks: Uint8Array[] = []

    while (true) {
        const { done, value } = await reader.read()
        if (done) break
        chunks.push(value)
    }

    const total = chunks.reduce((sum, c) => sum + c.length, 0)
    const result = new Uint8Array(total)
    let pos = 0
    for (const chunk of chunks) {
        result.set(chunk, pos)
        pos += chunk.length
    }
    return result
}

async function decompress(
    data: Uint8Array,
    format: "gzip" | "deflate" | "deflate-raw",
) {
    const input = new ReadableStream({
        start(c) {
            c.enqueue(data)
            c.close()
        },
    })

    const decompressed = input.pipeThrough(new DecompressionStream(format))
    const reader = decompressed.getReader()
    const chunks: Uint8Array[] = []

    while (true) {
        const { done, value } = await reader.read()
        if (done) break
        chunks.push(value)
    }

    const total = chunks.reduce((sum, c) => sum + c.length, 0)
    const result = new Uint8Array(total)
    let pos = 0
    for (const chunk of chunks) {
        result.set(chunk, pos)
        pos += chunk.length
    }
    return result
}

test("works globally", () => {
    expect(globalThis.CompressionStream).toBeDefined()
})

test("creates gzip stream", () => {
    const cs = new CompressionStream("gzip")
    expect(cs.readable).toBeInstanceOf(ReadableStream)
    expect(cs.writable).toBeInstanceOf(WritableStream)
})

test("creates deflate stream", () => {
    const cs = new CompressionStream("deflate")
    expect(cs.readable).toBeInstanceOf(ReadableStream)
    expect(cs.writable).toBeInstanceOf(WritableStream)
})

test("creates deflate-raw stream", () => {
    const cs = new CompressionStream("deflate-raw")
    expect(cs.readable).toBeInstanceOf(ReadableStream)
    expect(cs.writable).toBeInstanceOf(WritableStream)
})

test("throws on invalid format", () => {
    expect(() => new CompressionStream("bad" as any)).toThrow(TypeError)
    expect(() => new CompressionStream(123 as any)).toThrow(TypeError)
})

test("compresses with gzip", async () => {
    const text = "Hello, World!"
    const compressed = await compress(text, "gzip")
    const decompressed = Bun.gunzipSync(compressed)
    expect(new TextDecoder().decode(decompressed)).toBe(text)
})

test("compresses with deflate", async () => {
    const text = "Hello, World!"
    const compressed = await compress(text, "deflate")
    const decompressed = await new Promise<Buffer>((resolve, reject) => {
        zlib.inflate(compressed, (err, result) =>
            err ? reject(err) : resolve(result),
        )
    })
    expect(decompressed.toString()).toBe(text)
})

test("compresses with deflate-raw", async () => {
    const text = "Hello, World!"
    const compressed = await compress(text, "deflate-raw")
    const decompressed = await new Promise<Buffer>((resolve, reject) => {
        zlib.inflateRaw(compressed, (err, result) =>
            err ? reject(err) : resolve(result),
        )
    })
    expect(decompressed.toString()).toBe(text)
})

test("compresses empty string", async () => {
    const compressed = await compress("", "gzip")
    const decompressed = Bun.gunzipSync(compressed)
    expect(new TextDecoder().decode(decompressed)).toBe("")
})

test("compresses large text", async () => {
    const text = "x".repeat(10000)
    const compressed = await compress(text, "gzip")
    expect(compressed.length).toBeLessThan(text.length)
    const decompressed = Bun.gunzipSync(compressed)
    expect(new TextDecoder().decode(decompressed)).toBe(text)
})

test("compresses unicode", async () => {
    const text = "你好 🌍"
    const compressed = await compress(text, "gzip")
    const decompressed = Bun.gunzipSync(compressed)
    expect(new TextDecoder().decode(decompressed)).toBe(text)
})

test("works with pipeThrough", async () => {
    const input = new ReadableStream({
        start(c) {
            c.enqueue(new TextEncoder().encode("test"))
            c.close()
        },
    })
    const compressed = input.pipeThrough(new CompressionStream("gzip"))
    expect(compressed).toBeInstanceOf(ReadableStream)
})

test("handles multiple writes", async () => {
    const cs = new CompressionStream("gzip")
    const writer = cs.writable.getWriter()

    await writer.write(new TextEncoder().encode("Hello"))
    await writer.write(new TextEncoder().encode(" World"))
    await writer.close()

    const reader = cs.readable.getReader()
    const chunks: Uint8Array[] = []
    while (true) {
        const { done, value } = await reader.read()
        if (done) break
        chunks.push(value)
    }

    const total = chunks.reduce((sum, c) => sum + c.length, 0)
    const result = new Uint8Array(total)
    let pos = 0
    for (const chunk of chunks) {
        result.set(chunk, pos)
        pos += chunk.length
    }

    const decompressed = Bun.gunzipSync(result)
    expect(new TextDecoder().decode(decompressed)).toBe("Hello World")
})

// DecompressionStream tests

test("DecompressionStream works globally", () => {
    expect(globalThis.DecompressionStream).toBeDefined()
})

test("creates gzip decompression stream", () => {
    const ds = new DecompressionStream("gzip")
    expect(ds.readable).toBeInstanceOf(ReadableStream)
    expect(ds.writable).toBeInstanceOf(WritableStream)
})

test("creates deflate decompression stream", () => {
    const ds = new DecompressionStream("deflate")
    expect(ds.readable).toBeInstanceOf(ReadableStream)
    expect(ds.writable).toBeInstanceOf(WritableStream)
})

test("creates deflate-raw decompression stream", () => {
    const ds = new DecompressionStream("deflate-raw")
    expect(ds.readable).toBeInstanceOf(ReadableStream)
    expect(ds.writable).toBeInstanceOf(WritableStream)
})

test("DecompressionStream throws on invalid format", () => {
    expect(() => new DecompressionStream("bad" as any)).toThrow(TypeError)
    expect(() => new DecompressionStream(123 as any)).toThrow(TypeError)
})

test("decompresses gzip data", async () => {
    const text = "Hello, World!"
    const compressed = Bun.gzipSync(new TextEncoder().encode(text))
    const decompressed = await decompress(compressed, "gzip")
    expect(new TextDecoder().decode(decompressed)).toBe(text)
})

test("decompresses deflate data", async () => {
    const text = "Hello, World!"
    const compressed = await new Promise<Buffer>((resolve, reject) => {
        zlib.deflate(new TextEncoder().encode(text), (err, result) =>
            err ? reject(err) : resolve(result),
        )
    })
    const decompressed = await decompress(compressed, "deflate")
    expect(new TextDecoder().decode(decompressed)).toBe(text)
})

test("decompresses deflate-raw data", async () => {
    const text = "Hello, World!"
    const compressed = await new Promise<Buffer>((resolve, reject) => {
        zlib.deflateRaw(new TextEncoder().encode(text), (err, result) =>
            err ? reject(err) : resolve(result),
        )
    })
    const decompressed = await decompress(compressed, "deflate-raw")
    expect(new TextDecoder().decode(decompressed)).toBe(text)
})

test("round-trip: compress then decompress with gzip", async () => {
    const text = "Round trip test!"
    const compressed = await compress(text, "gzip")
    const decompressed = await decompress(compressed, "gzip")
    expect(new TextDecoder().decode(decompressed)).toBe(text)
})

test("round-trip: compress then decompress with deflate", async () => {
    const text = "Round trip test!"
    const compressed = await compress(text, "deflate")
    const decompressed = await decompress(compressed, "deflate")
    expect(new TextDecoder().decode(decompressed)).toBe(text)
})

test("round-trip: compress then decompress with deflate-raw", async () => {
    const text = "Round trip test!"
    const compressed = await compress(text, "deflate-raw")
    const decompressed = await decompress(compressed, "deflate-raw")
    expect(new TextDecoder().decode(decompressed)).toBe(text)
})

test("decompresses empty gzip data", async () => {
    const compressed = Bun.gzipSync(new Uint8Array())
    const decompressed = await decompress(compressed, "gzip")
    expect(new TextDecoder().decode(decompressed)).toBe("")
})

test("decompresses large gzip data", async () => {
    const text = "x".repeat(10000)
    const compressed = Bun.gzipSync(new TextEncoder().encode(text))
    const decompressed = await decompress(compressed, "gzip")
    expect(new TextDecoder().decode(decompressed)).toBe(text)
})

test("decompresses unicode data", async () => {
    const text = "你好 🌍"
    const compressed = await compress(text, "gzip")
    const decompressed = await decompress(compressed, "gzip")
    expect(new TextDecoder().decode(decompressed)).toBe(text)
})

test("DecompressionStream works with pipeThrough", async () => {
    const compressed = Bun.gzipSync(new TextEncoder().encode("test"))
    const input = new ReadableStream({
        start(c) {
            c.enqueue(compressed)
            c.close()
        },
    })
    const decompressed = input.pipeThrough(new DecompressionStream("gzip"))
    expect(decompressed).toBeInstanceOf(ReadableStream)
})

test("DecompressionStream handles multiple writes", async () => {
    const text = "Hello World"
    const compressed = Bun.gzipSync(new TextEncoder().encode(text))

    const ds = new DecompressionStream("gzip")
    const writer = ds.writable.getWriter()

    const chunkSize = Math.ceil(compressed.length / 2)
    await writer.write(compressed.slice(0, chunkSize))
    await writer.write(compressed.slice(chunkSize))
    await writer.close()

    const reader = ds.readable.getReader()
    const chunks: Uint8Array[] = []
    while (true) {
        const { done, value } = await reader.read()
        if (done) break
        chunks.push(value)
    }

    const total = chunks.reduce((sum, c) => sum + c.length, 0)
    const result = new Uint8Array(total)
    let pos = 0
    for (const chunk of chunks) {
        result.set(chunk, pos)
        pos += chunk.length
    }

    expect(new TextDecoder().decode(result)).toBe(text)
})
