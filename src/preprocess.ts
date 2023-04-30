import wtf_wikipedia from 'wtf_wikipedia';
import fs from 'fs';

function findDatesInWikipediaArticle(articleContent: string): string[] {
  const dateRegex =
    /(?:January|February|March|April|May|June|July|August|September|October|November|December)\s(?:\d{1,2},\s)?(?:20\d{2})|(?:20\d{2})-(?:0[1-9]|1[0-2])-(?:0[1-9]|[12][0-9]|3[01])|(?:access-date\s?=\s?(?:\d{1,2}\s(?:January|February|March|April|May|June|July|August|September|October|November|December)\s(?:20\d{2})|(?:(?:0[1-9]|1[0-2])-(?:0[1-9]|[12][0-9]|3[01])-20\d{2})))|(?:\((?:\d{1,2}\s(?:January|February|March|April|May|June|July|August|September|October|November|December)\s(?:20\d{2}))\s?to\s?(?:\d{1,2}\s(?:January|February|March|April|May|June|July|August|September|October|November|December)\s(?:20\d{2}))\)/g;

  const matches = articleContent.match(dateRegex);
  if (matches) {
    return matches;
  }
  return [];
}

async function loadArticleCheckAndPreprocess(fn: string) {
  const contents = fs.readFileSync(fn);
  const obj = wtf_wikipedia(contents.toString());
  const text = obj.text();
  const dates = findDatesInWikipediaArticle(text);
  if (dates.length <= 0) {
    return;
  }

  return [obj.text()];
}
