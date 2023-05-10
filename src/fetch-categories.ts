import fetch from 'node-fetch';
import * as dotenv from 'dotenv';
import * as fs from 'fs';

dotenv.config();

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function fetchCategories(filePath: string, lastCategory: string | null, count: number): Promise<string[]> {
  let continueParam: string | null = lastCategory;
  let allCategories: string[] = [];

  while (true) {
    console.log('Fetching categories', count);
    const baseUrl = 'https://en.wikipedia.org/w/api.php';
    const params = new URLSearchParams({
      aclimit: '500',
      // Set the max limit for categories per query
      acprop: '',

      action: 'query',

      format: 'json',
      list: 'allcategories',
      ...(continueParam && {accontinue: continueParam}),
    });

    const url = `${baseUrl}?${params.toString()}`;
    const response = await fetch(url);
    const data = await response.json();

    const categories = data?.query?.allcategories.map((category: any) => category['*']) || [];

    // Save fetched categories to the file
    let existingCategories: string[] = [];

    try {
      existingCategories = fs
        .readFileSync(filePath, 'utf-8')
        .split('\n')
        .filter(line => line.trim() !== '');
    } catch (error) {
      console.log('No existing categories file found');
    }
    const newCategories = categories.filter((category: string) => !existingCategories.includes(category));
    fs.appendFileSync(filePath, newCategories.join('\n') + '\n');
    console.log('Got new categories', newCategories.length);

    allCategories = allCategories.concat(newCategories);
    count += categories.length;

    if (data?.continue?.accontinue) {
      continueParam = data.continue.accontinue;
      await sleep(2000);
    } else {
      break;
    }
  }

  return allCategories;
}

(async () => {
  let err = true;
  while (err) {
    try {
      const allCategoriesPath = 'all_categories.txt';
      let lastCategory: string | null = null;

      let count = 0;
      if (fs.existsSync(allCategoriesPath)) {
        const content = fs.readFileSync(allCategoriesPath, 'utf-8').trim();
        const lines = content.split('\n');
        count = lines.length;
        lastCategory = lines[lines.length - 1];
      }

      const categories = await fetchCategories(allCategoriesPath, lastCategory, count);

      console.log(
        'Relevant categories containing factual information with dates between 2020 and 2023:',
        categories.length
      );
      err = false;
    } catch (error) {
      await sleep(3000);
      console.log('Error', error);
    }
    console.log('All done!');
  }
})();
