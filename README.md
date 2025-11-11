# compression-stream-polyfill

CompressionStream and DecompressionStream polyfill with standards-compliant implementation.

```bash
bun add compression-stream-polyfill
```

## Usage

Import at your app's entry point:

```ts
import "compression-stream-polyfill"
```

Any library using the Compression Streams API will work as in the latest Node.js.

## API

### CompressionStream

```ts
new CompressionStream(format: "gzip" | "deflate" | "deflate-raw")
```

Returns an object with `readable` and `writable` properties for compressing data. Throws `TypeError` for invalid format.

### DecompressionStream

```ts
new DecompressionStream(format: "gzip" | "deflate" | "deflate-raw")
```

Returns an object with `readable` and `writable` properties for decompressing data. Throws `TypeError` for invalid format.

## Documentation

-   [Compression Streams API - MDN](https://developer.mozilla.org/en-US/docs/Web/API/Compression_Streams_API)
-   [CompressionStream - MDN](https://developer.mozilla.org/en-US/docs/Web/API/CompressionStream)
-   [DecompressionStream - MDN](https://developer.mozilla.org/en-US/docs/Web/API/DecompressionStream)

## Note

This package is created for [Bun](https://bun.com) runtime. If you are using Node.js or any browser you don't need to use this polyfill as they are already [supported](https://developer.mozilla.org/en-US/docs/Web/API/Compression_Streams_API#browser_compatibility).

## License

MIT
