import axios from 'axios';

export default async function handler(req, res) {
  /*
  const openai = new OpenAI({
    apiKey: req.query.t,
  });*/

  /*
  const response = await openai.images.generate({
    prompt: req.query.p,
    n: parseInt(req.query.n),
    size: "1024x1024",
  });*/

  const url = 'https://openaitestdj.openai.azure.com/openai/deployments/Dalle3/images/generations?api-version=2024-02-15-preview';
  const response = await axios.post(url,
    {
      prompt: req.query.p,
      n: 1,
      size: "1024x1024",
    },
    {
      headers: {
        Accept: "application/json",
        'Api-Key': 'c6121c9d7fca4ff1b0a825ff54c787c4'
      }
    }
  );

  console.log(response.data);
  res.status(200).json({ result: response.data });
}
