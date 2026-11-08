/**
 * N-gram sentence generator.
 *
 * Builds MLE n-gram counts from a list of sentences and samples new
 * sentences from them. Works in the browser (window.Generator) and in
 * Node (module.exports) so it can be tested without a page.
 */
(function (root) {
	"use strict";

	var START = "<s>", END = "</s>", SEP = "\u0001";

	function tokenize(sentence) {
		return sentence.split(/\s+/).filter(function (t) { return t !== ""; });
	}

	/**
	 * @param {string[]} sentences
	 * @param {number} order  2 = bigram, 3 = trigram, 4 = 4-gram
	 */
	function Model(sentences, order) {
		this.order = order;
		this.sentences = sentences;
		// tables[k] maps a context of k words to {next word: count}.
		this.tables = [];
		for (var k = 0; k < order; k++) this.tables.push(new Map());
		this.unigrams = 0;
		this.ngrams = 0;
		var seen = new Set();
		for (var i = 0; i < sentences.length; i++) {
			var tokens = tokenize(sentences[i]);
			if (!tokens.length) continue;
			var padded = [];
			for (var p = 0; p < order - 1; p++) padded.push(START);
			padded = padded.concat(tokens, [END]);
			for (var j = order - 1; j < padded.length; j++) {
				var word = padded[j];
				if (!seen.has(word)) { seen.add(word); this.unigrams++; }
				for (k = 1; k < order; k++) {
					var ctx = padded.slice(j - k, j).join(SEP);
					var table = this.tables[k];
					var nexts = table.get(ctx);
					if (!nexts) { nexts = new Map(); table.set(ctx, nexts); }
					if (k === order - 1 && !nexts.has(word)) this.ngrams++;
					nexts.set(word, (nexts.get(word) || 0) + 1);
				}
			}
		}
	}

	/**
	 * Picks the next word for the given history.
	 * Uses the longest context that has continuations; shorter ones only
	 * when backoff is on (with backoff off, a dead end ends the sentence).
	 */
	Model.prototype.next = function (history, opts) {
		for (var k = this.order - 1; k >= 1; k--) {
			var ctx = history.slice(history.length - k).join(SEP);
			var nexts = this.tables[k].get(ctx);
			if (nexts && nexts.size) return { word: sample(nexts, opts.temperature, opts.random), backedOff: k < this.order - 1 };
			if (!opts.backoff) break;
		}
		return { word: END, backedOff: false };
	};

	/** Samples from counts raised to 1/temperature (low = greedy, high = flat). */
	function sample(nexts, temperature, random) {
		var t = Math.max(temperature, 0.05), total = 0, weights = [], words = [];
		nexts.forEach(function (count, word) {
			var w = Math.pow(count, 1 / t);
			words.push(word); weights.push(w); total += w;
		});
		var r = random() * total;
		for (var i = 0; i < words.length; i++) {
			r -= weights[i];
			if (r <= 0) return words[i];
		}
		return words[words.length - 1];
	}

	Model.prototype.generateOne = function (opts) {
		var history = [];
		for (var p = 0; p < this.order - 1; p++) history.push(START);
		var words = [], backoffs = 0;
		while (words.length < opts.maxWords) {
			var step = this.next(history, opts);
			if (step.word === END) break;
			if (step.backedOff) backoffs++;
			words.push(step.word);
			history.push(step.word);
		}
		return { words: words, backoffs: backoffs };
	};

	/** Word sequences of length n from the source tweets, for originality checks. */
	Model.prototype.sourceRuns = function (n) {
		this._runs = this._runs || {};
		if (this._runs[n]) return this._runs[n];
		var runs = new Set();
		for (var i = 0; i < this.sentences.length; i++) {
			var tokens = tokenize(this.sentences[i].toLowerCase());
			for (var j = 0; j + n <= tokens.length; j++) runs.add(tokens.slice(j, j + n).join(" "));
		}
		return (this._runs[n] = runs);
	};

	Model.prototype.sourceSet = function () {
		if (!this._sources) {
			this._sources = new Set(this.sentences.map(function (s) { return tokenize(s.toLowerCase()).join(" "); }));
		}
		return this._sources;
	};

	/** Longest run of words copied verbatim from one source tweet (capped at limit). */
	Model.prototype.copiesRun = function (words, limit) {
		if (words.length < limit) return false;
		var runs = this.sourceRuns(limit), lower = words.map(function (w) { return w.toLowerCase(); });
		for (var j = 0; j + limit <= lower.length; j++) {
			if (runs.has(lower.slice(j, j + limit).join(" "))) return true;
		}
		return false;
	};

	function escapeRegExp(s) { return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); }

	var BLOCKED = ["http", "www.", "fuck", "shit"];

	/**
	 * Generates `candidates` sentences and returns the ones that pass every
	 * check, best first. Each result says why rejected ones failed.
	 *
	 * opts: topic, temperature, backoff, candidates, minWords, maxWords,
	 *       originality ("any" | "exact" | number of words), filter, random
	 */
	Model.prototype.generate = function (opts) {
		opts.random = opts.random || Math.random;
		var topicRe = new RegExp("(^|[^\\w])" + escapeRegExp(opts.topic.toLowerCase()) + "([^\\w]|$)");
		var accepted = [], seen = new Set();
		var rejected = { topic: 0, length: 0, copy: 0, filter: 0, duplicate: 0 };
		for (var i = 0; i < opts.candidates; i++) {
			var cand = this.generateOne(opts);
			var text = cand.words.join(" "), lower = text.toLowerCase();
			if (!topicRe.test(lower)) { rejected.topic++; continue; }
			if (cand.words.length < opts.minWords || cand.words.length >= opts.maxWords) { rejected.length++; continue; }
			if (opts.filter && BLOCKED.some(function (b) { return lower.indexOf(b) !== -1; })) { rejected.filter++; continue; }
			if (opts.originality !== "any") {
				var exact = this.sourceSet().has(lower.split(/\s+/).join(" "));
				if (exact || (typeof opts.originality === "number" && this.copiesRun(cand.words, opts.originality))) { rejected.copy++; continue; }
			}
			if (seen.has(lower)) { rejected.duplicate++; continue; }
			seen.add(lower);
			accepted.push({ text: text, words: cand.words.length, backoffs: cand.backoffs });
		}
		// Prefer sentences that needed the fewest backoffs (most use of the full context).
		accepted.sort(function (a, b) { return a.backoffs - b.backoffs; });
		return { sentences: accepted, rejected: rejected };
	};

	var api = { Model: Model, tokenize: tokenize };
	if (typeof module === "object" && module.exports) module.exports = api;
	else root.Generator = api;
})(this);
