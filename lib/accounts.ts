import 'server-only';
import { randomInt } from 'crypto';
// Temporary password that is easy to read out and remember, e.g. "SunRose472". The person must replace it at first login.
const WORDS = ['Sun', 'Moon', 'Star', 'Rose', 'Palm', 'Dove', 'Lamp', 'Rain', 'Hill', 'Lake', 'Pearl', 'Noor', 'Nile', 'Date', 'Fig', 'Olive', 'Cloud', 'Sky', 'Wind', 'Sand', 'Gold', 'Mint', 'Leaf', 'Seed', 'Wave', 'Dawn', 'Bloom', 'Peace', 'Light', 'Honey'];
export function genPassword() {
  const w = () => WORDS[randomInt(WORDS.length)];
  return `${w()}${w()}${randomInt(100, 1000)}`;
}
