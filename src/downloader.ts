import {promises as fs} from 'fs';
import {join} from 'path';
import fetch from 'node-fetch';
interface CategoryMember {
  title: string;
}

interface CategoryMembersResponse {
  query: {
    categorymembers: CategoryMember[];
  };
}

async function getPagesInCategory(category: string): Promise<string[]> {
  const baseUrl = 'https://en.wikipedia.org/w/api.php';
  const params = new URLSearchParams({
    action: 'query',
    cmlimit: 'max',
    cmtitle: `Category:${category}`,
    format: 'json',
    formatversion: '2',
    list: 'categorymembers',
  });

  const url = `${baseUrl}?${params.toString()}`;

  let data: CategoryMembersResponse | null = null;
  const maxAttempts = 5;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const response = await fetch(url);
      data = (await response.json()) as CategoryMembersResponse;
      break;
    } catch (error) {
      console.log(`Attempt ${attempt} failed: ${(error as any)?.message}`);
      if (attempt < maxAttempts) {
        await sleep(1000); // Wait for 1 second before retrying
      } else {
        console.log(`All ${maxAttempts} attempts failed. Giving up.`);
        return [];
      }
    }
  }

  const titles: string[] = [];

  if (data?.query?.categorymembers) {
    data.query.categorymembers.forEach(page => {
      titles.push(page.title);
    });
  }

  return titles;
}

interface Revision {
  comment: string;
  content: string;
  timestamp: string;
  user: string;
}

interface Page {
  revisions: Revision[];
  title: string;
}

interface PagesResponse {
  query: {
    pages: Page[];
  };
}

async function getWikipediaUpdates(title: string, fromOriginal: string, category: string): Promise<void> {
  const pageTitle = title.replace(/[\/:*?"<>|]/g, '_');
  const categoryDir = join(__dirname, '..', 'data', category);

  try {
    await fs.access(categoryDir);
  } catch {
    await fs.mkdir(categoryDir);
  }

  const topicsDir = join(categoryDir, 'topics');

  try {
    await fs.access(topicsDir);
  } catch {
    await fs.mkdir(topicsDir);
  }

  const fileNamePattern = `${pageTitle}_*.txt`;
  const files = (await fs.readdir(topicsDir)).filter(file => file.match(fileNamePattern));
  const latestFileTimestamp = files
    .map(file => file.split('_').pop()?.split('.').shift() || '')
    .sort()
    .pop();

  const fromDate = latestFileTimestamp
    ? latestFileTimestamp.replace(/[_]/g, ':').replace('_', 'T') + 'Z'
    : new Date(fromOriginal).toISOString();

  const toDate = new Date().toISOString();

  const baseUrl = 'https://en.wikipedia.org/w/api.php';
  const params = new URLSearchParams({
    action: 'query',
    format: 'json',
    formatversion: '2',
    prop: 'revisions',
    rvdir: 'newer',
    rvend: toDate,
    rvlimit: 'max',
    rvprop: 'timestamp|user|comment|content',
    rvstart: fromDate,
    titles: title,
  });

  const url = `${baseUrl}?${params.toString()}`;

  let data: PagesResponse | null = null;
  const maxAttempts = 5;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const response = await fetch(url);
      data = (await response.json()) as PagesResponse;
      break;
    } catch (error) {
      console.log(`Attempt ${attempt} failed: ${(error as any)?.message}`);
      if (attempt < maxAttempts) {
        await sleep(1000); // Wait for 1 second before retrying
      } else {
        console.log(`All ${maxAttempts} attempts failed. Giving up.`);
        return;
      }
    }
  }

  if (data?.query?.pages) {
    const pages = data.query.pages;
    for (const page of pages) {
      try {
        if (!page.revisions) {
          console.log(`No updates found for ${page.title}`);
          continue;
        }

        const latestRevision = page.revisions[0];

        if (latestRevision) {
          const timestamp = latestRevision.timestamp.replace(/[:\-]/g, '_').replace('T', '_').replace('Z', '');
          const fileName = `${pageTitle}_${timestamp}.txt`;
          const filePath = join(topicsDir, fileName);

          const updates = `Title: ${page.title}\nTimestamp: ${latestRevision.timestamp}\nUser: ${latestRevision.user}\nComment: ${latestRevision.comment}\nContent: ${latestRevision.content}\n`;

          if (latestFileTimestamp) {
            const oldTimestamp = latestFileTimestamp.replace(/[_]/g, ':').replace('_', 'T') + 'Z';
            if (new Date(latestRevision.timestamp).getTime() > new Date(oldTimestamp).getTime()) {
              const oldFileName = `${pageTitle}_${latestFileTimestamp}.txt`;
              const oldFilePath = join(topicsDir, oldFileName);
              await fs.unlink(oldFilePath);
              console.log(`Deleted old file: ${oldFilePath}`);
            } else {
              console.log(`No newer updates found.`);
              return;
            }
          }

          await fs.writeFile(filePath, updates, 'utf8');
          console.log(`Created file: ${filePath}`);
        }
      } catch (error) {
        console.error(error);
      }
    }
  } else {
    console.log('No updates found.');
  }
}

const fromDate = '2020-01-01T00:00:00Z';
const factRelatedCategories: string[] = [
  'Fact_checking_websites',
  'Historical_events',
  'Science_and_technology',
  'Geography',
  'Politics',
  'Economics',
  'Health',
  'Culture',
  'Sports',
  'Education',
  'Environment',
  'Astronomy',
  'Biology',
  'Chemistry',
  'Physics',
  'Mathematics',
  'History_of_science',
  'History_of_technology',
  'Inventions',
  'Discoveries',
  'Awards',
  'Nobel_laureates',
  'Guinness_World_Records',
  'Mythology',
  'Urban_legends',
  'Conspiracy_theories',
  'Hoaxes',
  'Famous_experiments',

  // Additional categories related to current events
  'Current_events',
  'Breaking_news',
  'International_relations',
  'Diplomacy',
  'Elections',
  'Political_parties',
  'Protests',
  'Natural_disasters',
  'Climate_change',
  'Terrorism',
  'War',
  'Crime',
  'Human_rights',
  'Social_issues',
  'Epidemics',
  'Pandemics',
  'COVID-19_pandemic',
  'International_organizations',
  'United_Nations',
  'World_Health_Organization',
  'World_Trade_Organization',
  'World_Bank',
  'European_Union',
  'G20',
  'G7',
  'BRICS',
  'ASEAN',
];

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

const requestDelay = 500; // Delay between requests in milliseconds

(async () => {
  console.log('start');
  for (const category of factRelatedCategories) {
    console.log(`Fetching pages in category: ${category}`);
    const pageTitles = await getPagesInCategory(category);
    console.log(`Found ${pageTitles.length} pages in category: ${category}`);

    for (const pageTitle of pageTitles) {
      console.log(`Fetching updates for: ${pageTitle}`);
      await sleep(1000);
      await getWikipediaUpdates(pageTitle, fromDate, category);
      console.log('--------------------------------------');
      await sleep(requestDelay);
    }
  }
})();
