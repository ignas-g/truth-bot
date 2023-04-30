import wtf_wikipedia from 'wtf_wikipedia';
import {promises as fs} from 'fs';
import {Document} from 'langchain/docstore';
import {BaseDocumentLoader} from 'langchain/document_loaders';

export class WikipediaLoader extends BaseDocumentLoader {
  constructor(private readonly filePathOrBlob: string | Blob) {
    super();
  }

  async parse(raw: string): Promise<string[]> {
    const obj = wtf_wikipedia(raw);
    return [obj.text()];
  }

  async load(): Promise<Document[]> {
    let text: string;
    let metadata: Record<string, unknown>;

    if (typeof this.filePathOrBlob === 'string') {
      console.log('reading file', this.filePathOrBlob);
      text = await fs.readFile(this.filePathOrBlob, 'utf8');
      metadata = {source: this.filePathOrBlob};
    } else {
      text = await this.filePathOrBlob.text();
      metadata = {blobType: this.filePathOrBlob.type, source: 'blob'};
    }

    const parsed = await this.parse(text);
    parsed.forEach((pageContent, i) => {
      if (typeof pageContent !== 'string') {
        throw new Error(`Expected string, at position ${i} got ${typeof pageContent}`);
      }
    });

    return parsed.map(
      (pageContent, i) =>
        new Document({
          metadata:
            parsed.length === 1
              ? metadata
              : {
                  ...metadata,
                  line: i + 1,
                },
          pageContent,
        })
    );
  }
}
