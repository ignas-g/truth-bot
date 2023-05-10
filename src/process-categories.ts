import * as dotenv from 'dotenv';
import * as fs from 'fs';
import readline from 'readline';

import axios from 'axios';

dotenv.config();
async function parseCsv(csvText: string, categories: string[]): Promise<{category: string; result: string}[]> {
  console.log('Parsing CSV', csvText, categories);
  return new Promise<{category: string; result: string}[]>((resolve, reject) => {
    try {
      const results: {category: string; result: string}[] = [];
      const lines = csvText.trim().toLowerCase().split('\n');

      // Check if the first line is a header
      const possibleHeader = lines[0].split(',');
      const hasHeader = possibleHeader.some(column => ['yes', 'no', 'maybe'].includes(column.trim())) === false;

      if (hasHeader) {
        // Remove the header row
        lines.shift();
      }

      lines.forEach((line, index) => {
        const columns = line.split(',');

        let category: string | undefined = undefined;
        let result: string | undefined = undefined;
        if (columns.length > 0) {
          category = index < categories.length ? categories[index] : undefined;
          result = columns[0]?.trim();
          if (!['yes', 'no', 'maybe'].includes(result as string)) {
            if (columns.length > 1) {
              result = columns[1]?.trim();
            }
          }
        }

        if (category !== undefined && result !== undefined) {
          results.push({category: category?.trim() as string, result: result?.trim() as string});
        }
      });

      resolve(results);
    } catch (error) {
      reject(error);
    }
  });
}
async function sleep(ms: number): Promise<void> {
  return new Promise<void>(resolve => setTimeout(resolve, ms));
}

async function checkCategoryFactualInfo(count: number, categories: string[]): Promise<[string[], string[], string[]]> {
  let retry = true;
  let numRetries = 0;
  while (retry) {
    try {
      console.log('Checking categories', count);
      const prompt = `Respond only with either: "Yes", "Maybe" or "No" and do not elaborate. Only output data in a csv table with 2 columns "Input Number" and "Result" header. 
Here is a sample response between equal lines:\n
===================\n
No\n
No\n
Maybe\n
===================\n
Estimate if in the Wikipedia following categories contain factual information with dates between 2020 and 2023:
${categories.map((c, i) => `${i + 1}.${c}`).join('\n')}`;
      const request = {
        messages: [
          {
            content: prompt,
            role: 'user',
          },
        ],
        model: 'gpt-3.5-turbo',
      };

      const apiKey = process.env.OPENAI_API_KEY;
      const apiEndpoint = 'https://api.openai.com/v1/chat/completions';

      const response = await axios.post(apiEndpoint, request, {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
      });

      const evaluation = response.data.choices[0].message.content.trim();

      const answer = evaluation;

      if (!answer) {
        throw new Error('No answer found');
      }

      const parsedResults = await parseCsv(answer, categories);
      const filteredCategories = parsedResults
        .filter((result: any) => ['yes', 'maybe'].includes(result.result.toLowerCase()))
        .map((result: any) => result.category);

      const rejectedCategories = categories.filter((category: string) => !filteredCategories.includes(category));
      retry = false;
      return [filteredCategories, categories, rejectedCategories];
    } catch (error) {
      console.log('Error:', (error as any)?.message, '. Retrying in 30 seconds...');
      await sleep(30000);
      if (numRetries > 5) {
        console.error('Too many retries. Exiting...');
        break;
      }
      numRetries++;
    }
  }
  // should never reach here - fixing a typescript compilation error
  throw new Error('Failed to get results');
}

async function checkCategoriesInBatches(processedCategoriesPath: string, categories: string[]): Promise<string[]> {
  const batchSize = 50;
  const filteredCategories: string[] = [];

  for (let i = 0; i < categories.length; i += batchSize) {
    const batch = categories.slice(i, i + batchSize);
    const [batchResults, checkedCategories, rejectedCategories] = await checkCategoryFactualInfo(i, batch);
    console.log('Got results', batchResults.join(', '));
    console.log('Rejected', rejectedCategories.join(', '));

    filteredCategories.push(...batchResults);

    // Append checked categories to processed_categories.txt
    fs.appendFileSync(processedCategoriesPath, checkedCategories.join('\n') + '\n');

    // Update categories.json
    const currentCategories = JSON.parse(fs.readFileSync('categories.json', 'utf-8'));
    const updatedCategories = [...currentCategories, ...batchResults];
    fs.writeFileSync('categories.json', JSON.stringify(updatedCategories, null, 2));
  }

  return filteredCategories;
}

async function getExistingCategories(filePath: string, processedCategories: Set<string>): Promise<string[]> {
  return new Promise<string[]>((resolve, reject) => {
    const existingCategories: string[] = [];
    const readStream = fs.createReadStream(filePath, 'utf-8');
    const rl = readline.createInterface({input: readStream});

    rl.on('line', line => {
      const trimmedLine = line.trim();
      if (trimmedLine !== '' && !processedCategories.has(trimmedLine)) {
        existingCategories.push(trimmedLine);
      }
    });

    rl.on('close', () => {
      resolve(existingCategories);
    });

    rl.on('error', error => {
      reject(error);
    });
  });
}

(async () => {
  const filePath = 'all_categories.txt';
  const processedCategoriesPath = 'processed_categories.txt';

  let processedCategories: Set<string> = new Set();

  try {
    const processedCategoriesArray = fs
      .readFileSync(processedCategoriesPath, 'utf-8')
      .split('\n')
      .filter(line => line.trim() !== '');
    processedCategories = new Set(processedCategoriesArray);
  } catch (error) {
    console.log('No processed categories file found');
  }
  const existingCategories = await getExistingCategories(filePath, processedCategories);

  const relevantCategories: string[] = [];

  if (!fs.existsSync('categories.json')) {
    fs.writeFileSync('categories.json', JSON.stringify([], null, 2));
  }

  const checked = await checkCategoriesInBatches(processedCategoriesPath, existingCategories);

  // save checked categories to processed_categories.txt
  fs.appendFileSync(processedCategoriesPath, existingCategories.join('\n') + '\n');

  // save as json to categories.json
  fs.writeFileSync('categories.json', JSON.stringify(checked, null, 2));

  console.log(relevantCategories);
})();
