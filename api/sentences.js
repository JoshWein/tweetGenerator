// Returns tweets from the corpus that contain the requested topic word.
// Replaces scripts/getSentences.php and the MySQL database it used.
// Response shape is unchanged: [["tweet"], ["tweet"], ...] or [["error"]].
const fs = require("fs");
const path = require("path");
const zlib = require("zlib");

// The browser builds a bigram model from these, so keep the payload sane.
const MAX_SENTENCES = 2500;

let tweets = null;
let lowered = null;

function load() {
  if (tweets) return;
  const file = path.join(process.cwd(), "data", "tweets.txt.gz");
  const text = zlib.gunzipSync(fs.readFileSync(file)).toString("utf8");
  tweets = text.split("\n").filter(Boolean);
  lowered = tweets.map((t) => t.toLowerCase());
}

function escapeRegExp(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function find(topic) {
  load();
  const needle = topic.toLowerCase();
  // Whole-word match, like the topic table the PHP upload script built.
  const word = new RegExp("(^|[^\\w])" + escapeRegExp(needle) + "([^\\w]|$)");
  const matches = [];
  for (let i = 0; i < lowered.length; i++) {
    const t = lowered[i];
    if (t.includes(needle) && word.test(t)) matches.push(tweets[i]);
  }
  // Random sample when a topic is very common.
  for (let i = matches.length - 1; i > 0 && matches.length > MAX_SENTENCES; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [matches[i], matches[j]] = [matches[j], matches[i]];
  }
  return matches.slice(0, MAX_SENTENCES);
}

module.exports = (req, res) => {
  const url = new URL(req.url, "http://localhost");
  const topic = (url.searchParams.get("topic") || "").trim();
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  if (!topic || /\s/.test(topic) || topic.length >= 50) {
    res.statusCode = 400;
    res.end(JSON.stringify([["error"]]));
    return;
  }
  const found = find(topic);
  // Same topic, same tweets: let the CDN cache it for a day.
  res.setHeader("Cache-Control", "public, s-maxage=86400, max-age=3600");
  res.end(JSON.stringify(found.length ? found.map((t) => [t]) : [["error"]]));
};

module.exports.find = find;
