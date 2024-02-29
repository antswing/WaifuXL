import axios from 'axios';

export default async function handler(req, res) {

  /*
  const response = await openai.images.generate({
    prompt: req.query.p,
    n: parseInt(req.query.n),
    size: "1024x1024",
  });*/

  const url = `https://openaitestdj-eus.openai.azure.com/openai/operations/images/${req.query.id}?api-version=2023-06-01-preview`;
  const response = await axios.get(url,
    {
      headers: {
        Accept: "application/json",
        'Api-Key': 'ab4568e91dcd44e8bdc569b949a25d6f'
      },
    }
  );

  console.log(response.data);
  res.status(200).json({ result: response.data });
}
