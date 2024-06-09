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

export const base94Decode = (encoded: string): Uint8Array => {
  const paddingSize = parseInt(encoded[0])
  encoded = encoded.slice(1)
  const encodedChunkSize = 11
  const chunkSize = 9
  // const binarySize = ((encoded.length / encodedChunkSize) * 9) - paddingSize
  // console.log("expected binarySize::", binarySize)

  const decodeChunk = (chunk: string) => {
    const asciiOffset = 33;

    if (chunk.length !== encodedChunkSize) {
        throw new Error(`Encoded chunk length must be ${encodedChunkSize}`);
    }

    // Convert the base94 string to a 72-bit integer
    let value = BigInt(0);
    for (let i = 0; i < chunk.length; i++) {
        const char = BigInt(chunk.charCodeAt(i) - asciiOffset);
        value = value * BigInt(94) + char;
    }

    // Convert the 72-bit integer to a 9-byte chunk
    const decoded = [];
    for (let i = chunkSize - 1; i >= 0; i--) {
        decoded[i] = Number(value & BigInt(0xff));
        value >>= BigInt(8);
    }

    return new Uint8Array(decoded);
  }

  if (encoded.length % encodedChunkSize !== 0) {
      throw new Error(`Encoded string length must be a multiple of ${encodedChunkSize}`);
  }

  const decoded: number[] = [];

  for (let i = 0; i < encoded.length; i += encodedChunkSize) {
      const chunk = encoded.slice(i, i + encodedChunkSize);
      let decodedChunk = decodeChunk(chunk);      
      if(paddingSize && i === (encoded.length - encodedChunkSize)){
        decodedChunk = decodedChunk.slice(0, 9 - paddingSize)
      }
      decoded.push(...decodedChunk);
  }

  const binaryDecoded = new Uint8Array(decoded)
  // console.log("final binarySize::", binaryDecoded.length)
  return binaryDecoded
}

export const testBase94encode = () => {

  const dataString = "hola mundo 1234 demo base94!"
  console.log("main string:", dataString)
  const encoder = new TextEncoder()
  const data = encoder.encode(dataString)
  const encoded = base94Encode(data)
  console.log("encoded:", encoded)
  const decoded = base94Decode(encoded)
  const decoder = new TextDecoder()
  const decodedString = decoder.decode(decoded)
  console.log("decoded:", decodedString)
}

export const GetWorker = () => {
  return new SharedWorker(
    new URL('~/worker/worker.ts?worker', import.meta.url), {
    type: 'module',
  })
}

const _rixits = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz+_"

export const Base64 = {
  FromNumber: (number: number) => {
      if (isNaN(Number(number)) || number === null ||
          number === Number.POSITIVE_INFINITY)
          throw "The input is not valid";
      if (number < 0)
          throw "Can't represent negative numbers now";

      var rixit; // like 'digit', only in some non-decimal radix 
      var residual = Math.floor(number);
      var result = '';
      while (true) {
          rixit = residual % 64
          // console.log("rixit : " + rixit);
          // console.log("result before : " + result);
          result = _rixits.charAt(rixit) + result;
          // console.log("result after : " + result);
          // console.log("residual before : " + residual);
          residual = Math.floor(residual / 64);
          // console.log("residual after : " + residual);

          if (residual == 0)
              break;
          }
      return result;
  },
  ToNumber: (rixits: string) => {
    let result = 0;
    // console.log("rixits : " + rixits);
    // console.log("rixits.split('') : " + rixits.split(''));
    const rixitsArray = rixits.split('');
    for (let e = 0; e < rixitsArray.length; e++) {
        // console.log("_Rixits.indexOf(" + rixits[e] + ") : " + 
            // this._Rixits.indexOf(rixits[e]));
        // console.log("result before : " + result);
        result = (result * 64) + _rixits.indexOf(rixitsArray[e]);
        // console.log("result after : " + result);
    }
    return result;
  }
}

export const TimeMToB64Encode = (time: number): string => {
  return Base64.FromNumber(Math.floor((time - 1600000000000)*0.1))
}
export const TimeMToB64Decode = (timeB64: string) => {
  const time = Base64.ToNumber(timeB64)
  return time *10 + 1600000000000
}