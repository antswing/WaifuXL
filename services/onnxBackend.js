const ort = require('onnxruntime-web');

// Cached session state
var superSession = null;

function sleep (time) {
  return new Promise((resolve) => setTimeout(resolve, time));
}

export async function initializeONNX() {
    ort.env.wasm.numThreads = navigator.hardwareConcurrency / 2;
    ort.env.wasm.simd       = true;
    ort.env.wasm.proxy      = true;

    console.log("(Re)initializing session");
    superSession = await ort.InferenceSession.create("./superRes.onnx", ['wasm']);

    // Needed because WASM workers are created async, wait for them
    // to be ready
    await sleep(1000);
}

function prepareImage(imageArray) {
    const height = imageArray.shape[2];
    const width = imageArray.shape[3];
    const tensor = new ort.Tensor('uint8', imageArray.data, [1,3,height,width]);
    return { input: tensor };
}

export async function runModel(imageArray, setLoading) {
    if (imageArray === undefined) {
        return undefined;
    }
    setLoading(true);

    const feeds = prepareImage(imageArray);

    let session = null;
    session = superSession;

    console.log("Running session");
    console.time('run')
    let results = undefined;
    try {
        results = await session.run(feeds);
        setLoading(false);
    } catch (e) {
        setLoading(false);
        console.log("Failed to run model");
        console.log(e)
    }    
    console.timeEnd('run')
    console.log("Session done");
    return results.output;
}