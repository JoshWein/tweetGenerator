#!/usr/bin/env python3
"""Rebuild the tweet corpus that used to live in MySQL on OpenShift.

The original app loaded the Sentiment140 training set (1.6 million tweets)
and kept only tweets without retweets, links or @mentions, which left about
605,000 tweets. This script does the same and writes one tweet per line to
data/tweets.txt.gz, which the /api/sentences function searches.

Usage: python3 scripts/build_corpus.py [path-to-training-csv-or-zip]
With no argument it downloads the dataset from Stanford.
"""
import csv
import gzip
import html
import io
import os
import sys
import urllib.request
import zipfile

URL = "https://cs.stanford.edu/people/alecmgo/trainingandtestdata.zip"
CSV_NAME = "training.1600000.processed.noemoticon.csv"
OUT = os.path.join(os.path.dirname(__file__), "..", "data", "tweets.txt.gz")


def open_csv(src):
    if src is None:
        print("Downloading", URL, flush=True)
        with urllib.request.urlopen(URL, timeout=600) as r:
            src = io.BytesIO(r.read())
    if isinstance(src, io.BytesIO) or str(src).endswith(".zip"):
        z = zipfile.ZipFile(src)
        name = next(n for n in z.namelist() if n.endswith(CSV_NAME))
        return io.TextIOWrapper(z.open(name), encoding="latin-1", newline="")
    return open(src, encoding="latin-1", newline="")


def keep(text):
    # Same rules as the original uploadToDB.php, plus any link at all
    # (the 2009 tweets use http://, not https://t.co).
    return not ("RT " in text or "http" in text or "www." in text or "@" in text)


def clean(text):
    text = html.unescape(text).replace('"', "")
    return " ".join(text.split())


def main():
    src = sys.argv[1] if len(sys.argv) > 1 else None
    seen = set()
    tweets = []
    total = 0
    with open_csv(src) as f:
        for row in csv.reader(f):
            total += 1
            text = clean(row[-1])
            if len(text) < 2 or not keep(text):
                continue
            key = text.lower()
            if key in seen:
                continue
            seen.add(key)
            tweets.append(text)
    os.makedirs(os.path.dirname(OUT), exist_ok=True)
    # mtime=0 keeps the output byte-identical between runs.
    with open(OUT, "wb") as raw, gzip.GzipFile(fileobj=raw, mode="wb", compresslevel=9, mtime=0) as gz:
        gz.write(("\n".join(tweets) + "\n").encode("utf-8"))
    print(f"Read {total} tweets, kept {len(tweets)}, wrote {os.path.getsize(OUT)} bytes to {OUT}")

if __name__ == "__main__":
    main()
