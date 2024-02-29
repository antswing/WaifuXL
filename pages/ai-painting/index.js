import Head from "next/head";
import { useState } from "react";
import Layout from '@/components/layout';

import styles from "../../styles/Home.module.css";

import axios from "axios";

export default function AIPainting() {
  //const [token, setToken] = useState("abc");
  const [prompt, setPrompt] = useState("");
  const [number, setNumber] = useState(2);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  function getImages() {
    if (prompt != "") {
      setError(false);
      setLoading(true);
      axios
        .post(`/api/ai-painting/images?p=${prompt}&n=${number}`)
        .then((res) => {
          //setResults(res.data.result);
          const id = res.data.result.id;
          // Call the function with the initial id
          queryGetImages(id);
          setLoading(false);
        })
        .catch((err) => {
          setLoading(false);
          setError(true);
        });
    } else {
      setError(true);
    }
  }

  let timeoutId;
  function queryGetImages(id) {
    axios
      .get(`/api/ai-painting/getImages?id=${id}`)
      .then((res) => {
        console.log('res.data.result.status:'+res.data.result.status);
        if (res.data.result.status === "succeeded") {
          
          setLoading(false);
          clearTimeout(timeoutId); // Clear the timeout
          setResults(res.data.result.result.data);
          // Handle successful result
          // ...
        } else {
          // Retry after a delay
          setLoading(true);
          timeoutId = setTimeout(() => {
            queryGetImages(id);
          }, 3000); // Delay in milliseconds
        }
      })
      .catch((err) => {
        // Handle error
        // ...
      });
  }

    function getImagesV3() {
      //function getImagesV3() {
        if (prompt != "") {
          setError(false);
          setLoading(true);
          console.log("prompt:"+prompt);
          /*
          try {
            /*
            const {res1, res2} = await axios.all([
              axios.post(`/ai-painting/api/images-v3?prompt=${prompt}&n=${number}`), 
              axios.post(`/ai-painting/api/images-v3?prompt=${prompt}&n=${number}`)
            ]);
            const images = [...res1.data.result.data, ...res2.data.result.data];
            const res = axios.post(`/ai-painting/api/images-v3?prompt=${prompt}&n=${number}`);
            const images = [...res.data.result.data];
            setResults(images);
            setLoading(false);
            //setPosts(res.data);
          } catch (err) {
              console.log(err);
              setError(true);
          }*/
          
          const res = axios.all([
            axios.post(`/api/images-v3?p=${prompt}&n=${number}`), 
            axios.post(`/api/images-v3?p=${prompt}&n=${number}`)
          ])
          .then(axios.spread((res1, res2) => {
            // output of req.
            //console.log('data1', data1, 'data2', data2)
            const images = [...res1.data.result.data, ...res2.data.result.data];
            setResults(images);
            setLoading(false);
          }))
          .catch((err) => {
            setLoading(false);
            setError(true);
          });
        } else {
          setError(true);
        }
      }


  const [type, setType] = useState("Png");

  function download(url) {
    axios
      .post(`/api/ai-painting/download`, { url: url, type: type })
      .then((res) => {
        const link = document.createElement("a");
        link.href = res.data.result;
        link.download = `${prompt}.${type.toLowerCase()}`;
        link.click();
      })
      .catch((err) => {
        console.log(err);
      });
  }

  return (
    <Layout>
    <div className={styles.container}>
      <Head>
        <title>Create Images With DALL-E App</title>
      </Head>

      <main className={styles.main}>
        <h1 className={styles.title}>
          Create images with <span className={styles.titleColor}>DALL-E</span>
        </h1>
        <p className={styles.description}>
          <input
            id="prompt"
            type="text"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Prompt"
          />
          {"  "}
          <button onClick={()=>getImagesV3()}>Generate Images</button>
        </p>
        <small>
          Download as:{" "}
          <select
            id="type"
            value={type}
            onChange={(e) => setType(e.target.value)}
          >
            <option value="png">Png</option>
            <option value="jpg">Jpg</option>
            <option value="webp">Webp</option>
          </select>
          {" "}
          Click the image below and save.
        </small>
        <br />
        {error ? ( <div className={styles.error}>Something went wrong. Try again.</div> ) : ( <></> )}
        {loading && <p>Loading...</p>}
        <div className={styles.grid}>
          {results.map((result) => {
            return (
              <div className={styles.card}>
                <img
                  crossorigin="anonymous"
                  className={styles.imgPreview}
                  src={result.url}
                  onClick={() => download(result.url)}
                />
              </div>
            );
          })}
        </div>
      </main>
    </div>
    </Layout>
  );
}
