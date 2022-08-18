import ndarray from 'ndarray'
import ops from 'ndarray-ops'
import { getPixelDataFromURI } from './imageUtilities'
import { runSuperRes, runTagger } from './onnxBackend'
import { doGif } from './gifUtilities'

// Global parameters
const chunkSize = 512
const pad = 32

export function buildNdarrayFromImageOutput(data, height, width) {
  const inputArray = ndarray(data.data, data.dims || data.shape)
  const dataTensor = ndarray(new Uint8Array(width * height * 4).fill(255), [height, width, 4])
  ops.assign(dataTensor.pick(null, null, 0), inputArray.pick(0, 0, null, null))
  ops.assign(dataTensor.pick(null, null, 1), inputArray.pick(0, 1, null, null))
  ops.assign(dataTensor.pick(null, null, 2), inputArray.pick(0, 2, null, null))
  return dataTensor.data
}

export async function loadTags() {
  const tags = await fetch('./tags.json')
  const tagsJson = await tags.json()
  const tagsArray = tagsJson.map((tag) => tag[1])
  return tagsArray
}

// find indices of top k values in ndarray
export function topK(ndarray, k, startIndex, stopIndex) {
  const values = ndarray.data.slice(startIndex, stopIndex)
  const indices = [...Array(values.length).keys()]
  indices.sort((a, b) => values[b] - values[a])

  // zip indices and values into an array of tuples
  const tuples = indices.map((i) => [i + startIndex, values[i]])
  return tuples.slice(0, k)
}

export async function getTopTags(data) {
  const tags = await loadTags()
  const flattened = ndarray(data.data, data.dims)

  const topDesc = topK(flattened, 2000, 0, 2000).map((i) => [tags[i[0]], i[1]])
  const topChars = topK(flattened, 2000, 2000, 4000).map((i) => [tags[i[0]], i[1]])
  const rating = topK(flattened, 3, 4000, 4003).map((i) => [tags[i[0]], i[1]])

  return { topDesc, topChars, rating }
}

export function buildNdarrayFromImage(imageData) {
  const { data, width, height } = imageData
  const dataTensor = ndarray(new Uint8Array(data), [height, width, 4])
  const dataProcessedTensor = ndarray(new Uint8Array(width * height * 3), [1, 3, height, width])
  ops.assign(dataProcessedTensor.pick(0, 0, null, null), dataTensor.pick(null, null, 0))
  ops.assign(dataProcessedTensor.pick(0, 1, null, null), dataTensor.pick(null, null, 1))
  ops.assign(dataProcessedTensor.pick(0, 2, null, null), dataTensor.pick(null, null, 2))
  return dataProcessedTensor
}

export function buildImageFromND(nd, height, width) {
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const context = canvas.getContext('2d')
  var data = context.createImageData(width, height)
  data.data.set(nd)
  context.putImageData(data, 0, 0)
  return canvas.toDataURL()
}

/**
 * Upscales image pixel data using the super resolution model. The image is split
 *   into chunks of size chunkSize to avoid running out of memory on the WASM side.
 *
 * @param {ndarray} inputData Image data as pixels in a ndarray
 * @param {Number} repeatUpscale How many times to repeat the super resolution
 * @returns Upscaled image as URI
 */
export async function upscale(inputData, repeatUpscale = 1) {
  let inArr = buildNdarrayFromImage(inputData)
  for (let s = 0; s < repeatUpscale; s += 1) {
    let inImgH = inArr.shape[2]
    let inImgW = inArr.shape[3]
    let outImgH = inImgH * 2
    let outImgW = inImgW * 2
    const nChunksH = Math.ceil(inImgH / chunkSize)
    const nChunksW = Math.ceil(inImgW / chunkSize)
    const chunkH = Math.floor(inImgH / nChunksH)
    const chunkW = Math.floor(inImgW / nChunksW)

    console.debug(`Upscaling ${inImgH}x${inImgW} -> ${outImgH}x${outImgW}`)
    console.debug(`Chunk size: ${chunkH}x${chunkW}`)
    console.debug(`Number of chunks: ${nChunksH}x${nChunksW}`)

    // Split the image in chunks and run super resolution on each chunk
    // Time execution
    console.time('Upscaling')
    let outArr = ndarray(new Uint8Array(3 * outImgH * outImgW), [1, 3, outImgH, outImgW])
    for (let i = 0; i < nChunksH; i += 1) {
      for (let j = 0; j < nChunksW; j += 1) {
        const x = j * chunkW
        const y = i * chunkH

        // Compute chunk bounds including padding
        const yStart = Math.max(0, y - pad)
        const inH = yStart + chunkH + pad * 2 > inImgH ? inImgH - yStart : chunkH + pad * 2
        const outH = 2 * (Math.min(inImgH, y + chunkH) - y)
        const xStart = Math.max(0, x - pad)
        const inW = xStart + chunkW + pad * 2 > inImgW ? inImgW - xStart : chunkW + pad * 2
        const outW = 2 * (Math.min(inImgW, x + chunkW) - x)

        // Create sliced and copy
        console.debug(`Chunk ${i}x${j}  (${xStart}, ${yStart})  (${inW}, ${inH}) -> (${outW}, ${outH})`)
        const inSlice = inArr.lo(0, 0, yStart, xStart).hi(1, 3, inH, inW)
        const subArr = ndarray(new Uint8Array(inH * inW * 3), inSlice.shape)
        ops.assign(subArr, inSlice)

        // Run the super resolution model on the chunk, copy the result into the combined array
        const chunkData = await runSuperRes(subArr)
        const chunkArr = ndarray(chunkData.data, chunkData.dims)
        const chunkSlice = chunkArr.lo(0, 0, (y - yStart) * 2, (x - xStart) * 2).hi(1, 3, outH, outW)
        const outSlice = outArr.lo(0, 0, y * 2, x * 2).hi(1, 3, outH, outW)
        ops.assign(outSlice, chunkSlice)
      }
    }
    inArr = outArr

    if (s == repeatUpscale - 1) {
      console.timeEnd('Upscaling')
      // Reshape network output into a normal image
      const outImg = buildNdarrayFromImageOutput(outArr, outImgH, outImgW)
      const outURI = buildImageFromND(outImg, outImgH, outImgW)
      return outURI
    }
  }
}

export async function upScaleFromURI(setLoading, setExtension, setTags, uri, upscaleFactor) {
  setLoading(true)
  let resultURI = null
  let repeatUpscale = Math.log2(upscaleFactor)
  if (uri.slice(0, 14) == 'data:image/gif') {
    setExtension('gif')
    //is gif
    let currentURI = uri
    for (let s = 0; s < repeatUpscale; s += 1) {
      currentURI = await doGif(currentURI, setTags, repeatUpscale)
    }

    resultURI = currentURI
  } else {
    //is image
    setExtension('png')
    const pixelData = await getPixelDataFromURI(uri)

    const tagInput = buildNdarrayFromImage(pixelData)
    const tagOutput = await runTagger(tagInput)
    const tags = await getTopTags(tagOutput)
    setTags(tags)

    resultURI = await upscale(pixelData, repeatUpscale)
  }
  setLoading(false)
  return resultURI
}

export async function upScaleGifFrameFromURI(frameData, height, width) {
  return new Promise(async (resolve, reject) => {
    const inputData = await getPixelDataFromURI(buildImageFromND(frameData, height, width))
    const outputImage = await upscale(inputData)
    resolve(outputImage)
  })
}
