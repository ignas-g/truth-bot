import {PineconeClient} from '@pinecone-database/pinecone';
import {VectorDBQAChain} from 'langchain/chains';
import {OpenAIEmbeddings} from 'langchain/embeddings/openai';
import {OpenAI} from 'langchain/llms/openai';
import {PineconeStore} from 'langchain/vectorstores/pinecone';

const client = new PineconeClient();
await client.init({
  apiKey: process.env.PINECONE_API_KEY,
  environment: process.env.PINECONE_ENVIRONMENT,
});

const pineconeIndex = client.Index('news-index');

const vectorStore = await PineconeStore.fromExistingIndex(new OpenAIEmbeddings(), {pineconeIndex});

/* Search the vector DB independently with meta filters */
const results = await vectorStore.similaritySearch('pinecone', 1, {
  foo: 'bar',
});
console.log(results);
/*
[
  Document {
    pageContent: 'pinecone is a vector db',
    metadata: { foo: 'bar' }
  }
]
*/

/* Use as part of a chain (currently no metadata filters) */
const model = new OpenAI({openAIApiKey: process.env.OPENAI_API_KEY, temperature: 0});

const chain = VectorDBQAChain.fromLLM(model, vectorStore, {
  k: 1,
  returnSourceDocuments: true,
});
const response = await chain.call({query: 'Give me a summary of most up to date news'});
console.log(response);
