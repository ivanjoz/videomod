export const base94Encode = (data: Uint8Array): string => {
  const chunkSize = 9;
  const encodedChunkSize = 11;

  const encodeChunk = (chunk: Uint8Array): string => {
    const base = BigInt(94);
    const asciiOffset = 33;
  
    // Convert the 9-byte chunk to a 72-bit integer
    let value = BigInt(0);
    for (let i = 0; i < chunk.length; i++) {
        value = (value << BigInt(8)) | BigInt(chunk[i]);
    }
  
    // Base94 encode the integer
    let encoded: number[] = [];
    for (let i = 0; i < encodedChunkSize; i++) {
        let remainder = value % base;
        encoded.push(Number(remainder) + asciiOffset);
        value = value / base;
    }
  
    // Reverse the array because we construct it in reverse order
    encoded.reverse();
  
    // Convert to string
    return String.fromCharCode(...encoded);
  }

  let encoded = '';
  let paddingSize = 0;

  // Process data in chunks of 9 bytes
  for (let i = 0; i < data.length; i += chunkSize) {
      let chunk = data.slice(i, i + chunkSize);

      // Pad the remaining bytes with zeros to make a full chunk
      if (chunk.length < chunkSize) {
          paddingSize = chunkSize - chunk.length;
          let padded = new Uint8Array(chunkSize);
          padded.set(chunk);
          chunk = padded;
      }

      encoded += encodeChunk(chunk);
  }
  return String(paddingSize) + encoded;
}

export const Base94Decode = (encoded: string): Uint8Array => {
  const paddingSize = parseInt(encoded[0]);
  encoded = encoded.slice(1);
  const encodedChunkSize = 11;
  const chunkSize = 9;

  const decodeChunk = (chunk: string) => {
    const asciiOffset = 33;

    if (chunk.length !== encodedChunkSize) {
        throw new Error(`Encoded chunk length must be ${encodedChunkSize}`);
    }

    // Convert the base94 string to a 72-bit integer
    let value = BigInt(0);
    for (let i = 0; i < chunk.length; i++) {
        let char = BigInt(chunk.charCodeAt(i) - asciiOffset);
        value = value * BigInt(94) + char;
    }

    // Convert the 72-bit integer to a 9-byte chunk
    let decoded = [];
    for (let i = chunkSize - 1; i >= 0; i--) {
        decoded[i] = Number(value & BigInt(0xff));
        value >>= BigInt(8);
    }

    return new Uint8Array(decoded);
  }

  if (encoded.length % encodedChunkSize !== 0) {
      throw new Error(`Encoded string length must be a multiple of ${encodedChunkSize}`);
  }

  let decoded = [];

  for (let i = 0; i < encoded.length; i += encodedChunkSize) {
      let chunk = encoded.slice(i, i + encodedChunkSize);
      let decodedChunk = decodeChunk(chunk);
      decoded.push(...decodedChunk);
  }

  return new Uint8Array(decoded);
}

export const testBase94encode = () => {

  const dataString = "hola mundo 1234 demo base94!"
  console.log("main string:", dataString)
  const encoder = new TextEncoder()
  const data = encoder.encode(dataString)
  const encoded = base94Encode(data)
  console.log("encoded:", encoded)
  const decoded = Base94Decode(encoded)
  const decoder = new TextDecoder()
  const decodedString = decoder.decode(decoded)
  console.log("decoded:", decodedString)
}