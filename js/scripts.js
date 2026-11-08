var topic, sentenceCache = {};

var ORDER_NAMES = { 2: "bigram", 3: "trigram", 4: "4-gram" };

/** Reads the controls into generator options. */
function readOptions() {
	var originality = $("#originality").val();
	var minWords = clampInt($("#minWords").val(), 1, 60, 4);
	var maxWords = clampInt($("#maxWords").val(), 2, 80, 30);
	if (maxWords <= minWords) maxWords = minWords + 1;
	return {
		order: clampInt($("#order").val(), 2, 4, 3),
		temperature: clampInt($("#temperature").val(), 10, 200, 100) / 100,
		backoff: $("#backoff").is(":checked"),
		candidates: clampInt($("#candidates").val(), 1, 500, 100),
		minWords: minWords,
		maxWords: maxWords,
		originality: originality === "any" || originality === "exact" ? originality : parseInt(originality, 10),
		filter: $("#filter").is(":checked"),
		showAlternates: $("#showAlternates").is(":checked")
	};
}

function clampInt(value, min, max, fallback) {
	var n = parseInt(value, 10);
	if (isNaN(n)) return fallback;
	return Math.min(max, Math.max(min, n));
}

/**
*	Starting routine for generating a random sentence
*/
function start() {
	topic = $("#topicText").val().trim();
	if(!isValidTopic(topic)) {
		console.log("Invalid entry");
		return;
	}
	switchView();
	var key = topic.toLowerCase();
	if (sentenceCache[key]) {
		updateStatus("Using " + sentenceCache[key].length + " tweets about \"" + topic + "\"...");
		generate(sentenceCache[key]);
		return;
	}
	updateStatus("Getting sentences...");
	$.ajax({
		url: "api/sentences",
		type: "GET",
		dataType: "json",
		data: {
			topic: topic
		}, success:function(sentences) {
			if(sentences.length && sentences[0][0] != "error") {
				var flat = sentences.map(function (s) { return s[0]; });
				sentenceCache[key] = flat;
				updateStatus("Received " + flat.length + " sentences...");
				generate(flat);
			} else {
				fail("No sentences found, try another topic.");
			}
		}, error:function() {
			fail("Couldn't reach the tweet database, try again.");
		}
	});
}

function fail(message) {
	updateStatus(message);
	$("#statusSection").delay(5000).fadeOut(200, newTopic);
}

/**
*	Builds the language model and generates candidate sentences.
*	@param	{String[]}	sentences	Tweets containing the topic
*/
function generate(sentences) {
	var opts = readOptions();
	updateStatus("Generating " + ORDER_NAMES[opts.order] + " language model...");
	// Let the status paint before the (short) synchronous work.
	setTimeout(function () {
		var model = new Generator.Model(sentences, opts.order);
		updateStatus("Learned " + model.unigrams + " unique words and " + model.ngrams + " unique " + ORDER_NAMES[opts.order] + "s");
		updateStatus("Generating " + opts.candidates + " candidate sentence" + (opts.candidates == 1 ? "" : "s") + "...");
		opts.topic = topic;
		var result = model.generate(opts);
		var stats = summarize(opts, result);
		if (!result.sentences.length) {
			updateStatus("None of the candidates passed: " + stats + ". Try more candidates, more randomness, or a looser originality setting.");
			$("#statusSection").delay(8000).fadeOut(200, newTopic);
			return;
		}
		showSentence(result.sentences, opts, stats);
	}, 50);
}

function summarize(opts, result) {
	var r = result.rejected, parts = [result.sentences.length + " of " + opts.candidates + " candidates passed"];
	if (r.topic) parts.push(r.topic + " missed the topic");
	if (r.length) parts.push(r.length + (r.length == 1 ? " was" : " were") + " too short or long");
	if (r.copy) parts.push(r.copy + " copied a real tweet");
	if (r.filter) parts.push(r.filter + (r.filter == 1 ? " was" : " were") + " filtered");
	if (r.duplicate) parts.push(r.duplicate + (r.duplicate == 1 ? " was a duplicate" : " were duplicates"));
	return parts.join(", ");
}

/**
*	Checks input for validity
*	@param		{String}	topic	User entered text
*	@returns	{Integer}	1 on success 0 on error
*/
function isValidTopic(topic) {
	// Only accept single words
	if(/\s/.test(topic)) {
		$("#err").stop().show();
		$("#err").html("Only one word topics allowed");
		$("#err").delay(1000).fadeOut(1000);
		return 0;
	}
	// Only accept non-empty words and words shorter than 50 characters
	if(topic.length < 1 || topic.length >= 50) {
		return 0;
	}
	return 1;
}

/**
*	Updates status text on web page with fading animations
*	@param	{String}	text	Text to change to
*/
var currentStatus = 0;
function updateStatus(text) {
	console.log("Status: " + text);
	var el = $("#status" + Math.min(currentStatus, 7));
	currentStatus++;
	el.text(text);
	el.stop(true, true).delay(currentStatus * 150).fadeIn(600);
}

// Submits word on enter key press
$("#topicText").bind('keyup', function(event) {
	if(event.keyCode == 13){
		start();
	}
});

function switchView() {
	$("#inputForm").fadeOut(100);
	$("#statusSection").fadeIn(100);
}

function showSentence(sentences, opts, stats) {
	$("#buttons").hide();
	$("#sentenceSection").show();
	$("#sentence").text(sentences[0].text);
	var list = $("#alternates").empty().hide();
	if (opts.showAlternates && sentences.length > 1) {
		sentences.slice(1, 6).forEach(function (s) { list.append($("<li>").text(s.text)); });
	}
	$("#stats").text(stats + ".");
	$("#sentence").delay(currentStatus * 200).fadeIn(800, function() {
		if (list.children().length) list.fadeIn(400);
		$("#buttons").show();
	});
}

function regenerate() {
	reset();
	start();
}

function newTopic() {
	reset();
	$("#inputForm").show();
}

function reset() {
	$("#statusSection").hide();
	$("#sentence").text("").hide();
	$("#alternates").empty().hide();
	$("#stats").text("");
	for(var i = 0; i < 8; i++) {
		$("#status" + i).stop(true, true).hide().text("");
	}
	currentStatus = 0;
	$("#buttons").hide();
}
