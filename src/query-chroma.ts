import {Chroma} from 'langchain/vectorstores';
import {OpenAIEmbeddings} from 'langchain/embeddings';
import {OpenAI} from 'langchain/llms/openai';
import {ConversationalRetrievalQAChain} from 'langchain/chains';

const queryChroma = async () => {
  const emb = new OpenAIEmbeddings();

  const vectorStore = await Chroma.fromExistingCollection(emb, {
    collectionName: 'wikipedia',
    url: 'http://3.238.70.241:8000',
  });

  console.log('docs3');
  const model = new OpenAI({openAIApiKey: process.env.OPENAI_API_KEY, temperature: 0});
  /* Create the chain */
  console.log('docs4');
  const chain = ConversationalRetrievalQAChain.fromLLM(model, vectorStore.asRetriever());
  console.log('docs5');
  /* Ask it a question */
  const question = 'Factcheck this: United Nations declared July 7th as Swahili Language Day in 2022';
  console.log('docs6');
  const res = await chain.call({chat_history: [], question});
  console.log('docs6');
  console.log(res);
  /* Ask it a follow up question */
  const chatHistory = question + res.text;
  const followUpRes = await chain.call({
    chat_history: chatHistory,
    question: 'Was that nice?',
  });
  console.log(followUpRes);
};

void queryChroma().then(() => console.log('done'));
