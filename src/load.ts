import {DirectoryLoader} from 'langchain/document_loaders/fs/directory';
import {WikipediaLoader} from './wikipedia-loader';
import {OpenAIEmbeddings} from 'langchain/embeddings';
import {RecursiveCharacterTextSplitter} from 'langchain/text_splitter';
import {ConversationalRetrievalQAChain} from 'langchain/chains';
import {Chroma} from 'langchain/vectorstores';
import {OpenAI} from 'langchain/llms/openai';

const loader = new DirectoryLoader('./data/United_Nations/topics/', {
  '.txt': path => new WikipediaLoader(path),
});

const run = async () => {
  const docs = await loader.load();
  console.log('docs');
  /*const headers = {
    Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
    'Content-Type': 'application/json',
  };
  debugger;

  */

  const textSplitter = new RecursiveCharacterTextSplitter({chunkSize: 1000});
  const docs2 = await textSplitter.createDocuments(docs.map(doc => doc.pageContent));
  console.log('docs2');
  /* Create the vectorstore */

  const vectorStore = await Chroma.fromDocuments(docs2, new OpenAIEmbeddings(), {
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
  //
  // const client = new PineconeClient();
  // await client.init({
  //   apiKey: process.env.PINECONE_API_KEY,
  //   environment: process.env.PINECONE_ENVIRONMENT,
  // });
  // const pineconeIndex = client.Index('news-index');
  //
  // await PineconeStore.fromDocuments(docs, new OpenAIEmbeddings(), {
  //   pineconeIndex,
  // });
};

void run().then(() => {});
