import wtf_wikipedia from 'wtf_wikipedia';
import fs from 'fs';

const contents = fs.readFileSync('./data/Age of onset/Age of onset_2020_01_17_13_26_46.txt').toString();
const obj = wtf_wikipedia(contents);
console.log(obj.text());
