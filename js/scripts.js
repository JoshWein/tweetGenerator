var topic;
/**
*	Starting routine for generating a random sentence
*/
function start() {
	switchView();
	topic = $("#topicText").val();	
	if(isValidTopic(topic)) {
		updateStatus("Getting sentences...");
		$.ajax({
			url: "scripts/getSentences.php",
			type: "GET",
			data: {
				topic: topic
			}, success:function(data) {
				var sentences = jQuery.parseJSON(data);	
				if(sentences[0][0] != "error") {
					updateStatus("Received " + sentences.length + " sentences.");
					parseSentences(sentences);					
				} else {
					updateStatus("No sentences found, try another topic.");
				}
			}
		});
	} else {
		console.log("Invalid entry");
	}
}

/**
*	Parses all of the sentences, removing empty tokens and appending sentence tags to the ends of each sentence
*	@param	{String[]}	sentences	Nested array of sentences
*/
function parseSentences(sentences) {
	updateStatus("Parsing sentences...");
	for(var i = 0; i < sentences.length; i++) {
		var sentence = sentences[i][0].split(" ");
		sentences[i][0] = "<s> ";
		for(var j = 0; j < sentence.length; j++) {
			if(sentence[j].trim() != "")
				sentences[i][0] = sentences[i][0].concat(sentence[j].trim() + " ");		
		}
		sentences[i][0] = sentences[i][0].concat("</s>");
	}
	createLanguageModels(sentences);
}

/**
*	@param	{String[]}	sentences	Nested array of sentences
*/
function createLanguageModels(sentences) {
	updateStatus("Generating language models...");
	var unigramLanguageModel = 	{ },
		bigramLanguageModel	 =	{ };
	for(var i = 0; i < sentences.length; i++) {
		var sentence = sentences[i][0].split(" ");
		var j;
		for(j = 0; j < sentence.length - 1; j++) {
			var firstToken = sentence[j];
			if(firstToken != "") {
				if(isNaN(unigramLanguageModel[firstToken])) {
					unigramLanguageModel[firstToken] = 1;
				} else {
					unigramLanguageModel[firstToken] = unigramLanguageModel[firstToken] + 1;
				}	
				if(sentence[j+1] != "") {
					var key = firstToken + " " + sentence[j + 1];
					// console.log(key);
					if(key != " ") {
						if(isNaN(bigramLanguageModel[key])) {
							bigramLanguageModel[key] = 1;
						} else {
							bigramLanguageModel[key] = bigramLanguageModel[key] + 1;
						}	
					}
				}
			}
		}
		if(isNaN(unigramLanguageModel[sentence[j]])) {
			unigramLanguageModel[sentence[j]] = 1;
		} else {
			unigramLanguageModel[sentence[j]] = unigramLanguageModel[sentence[j]] + 1;
		}	
	}
	keysSorted = Object.keys(unigramLanguageModel).sort(function(a,b){return unigramLanguageModel[a]-unigramLanguageModel[b]});
	console.log(keysSorted); 
	console.log(unigramLanguageModel);
	console.log(bigramLanguageModel);
	updateStatus("Generated " + Object.keys(unigramLanguageModel).length + " unique unigrams");
	updateStatus("Generated " + Object.keys(bigramLanguageModel).length + " unique bigrams");
	generateProbabilities(unigramLanguageModel, bigramLanguageModel);
}

/**
*	Generates MLE probabilities for bigrams to use in sentence generation
*	@param	{Map<String, Integer>}	unigrams	Map of unigrams to counts
*	@param	{Map<String, Integer>}	bigrams		Map of bigrams to counts
*/
function generateProbabilities(unigrams, bigrams) {
	var probabilities = {};
	var bigramKeys =  Object.keys(bigrams);
	for(var i = 0; i < bigramKeys.length; i++) {
		// count(bigram) / count(unigram)
		probabilities[bigramKeys[i]] = (bigrams[bigramKeys[i]] / unigrams[bigramKeys[i].split(" ")[0]]);
	}
	console.log(probabilities);
	generateSentence(bigrams, probabilities)
}

/**
*	@param	{Map<String, Integer>}	bigrams		Map of bigrams to counts
*	@param	{Map<String, Double>}	probabilities
*/
function generateSentence(bigrams, probabilities) {
	updateStatus("Generating sentence...");
	var list = Object.keys(bigrams);
	console.log(list);
	var sentence = "", safetyCounter;
	while(!sentence.toUpperCase().includes(topic.toUpperCase()) || !sentence.includes("</s>")) {
		sentence = "";
		safetyCounter = 0;
		var choices = getTagList("<s>", list);
		// console.log(choices);		
		while(!sentence.includes("</s>")) {
			sentence += chooseTag(choices, probabilities);
			// Update choices using the last word in the sentence as a tag
			var lastWord = sentence.split(" ").splice(-1)[0];
			choices = getTagList(lastWord, list);
			// Infinite loop protection
			if(safetyCounter > 25) {
				break;
			}
			safetyCounter++;
		}
		console.log(sentence);
	}
	sentence = sentence.replace("</s>", "");
	showSentence(sentence);
}

/**
*	Gets all n grams with a matching first gram
*	@param	{String}				tag		String to match
*	@param	{String[]} 	list	List of strings
*/
function getTagList(tag, list) {
	// console.log("Matching for " + tag.trim());
	var choices = [];
	for(var i = 0; i < list.length; i++) {
		if(list[i].split(' ')[0].trim() === tag.trim()) {
			choices.push(list[i]);
		}
	}
	return choices;
}

/**
*
*/
function chooseTag(choices, probabilities) {
	var randomness = .000005;
	var choiceMap = {}, i, j, table = [];
	for(var i = 0; i < choices.length; i++) {
		if(probabilities[choices[i]] > randomness) {
			choiceMap[choices[i]] = probabilities[choices[i]];
		} else {
			console.log(choices[i]);
			console.log(probabilities[choices[i]]);
		}
	}
	// Rejection Sampling 	
	for (i in choiceMap) {
		for (j = 0; j < (choiceMap[i] * 10); j++) {
		  table.push(i);
		}
	}
	var choice = table[Math.floor(Math.random() * table.length)];
	return choice.replace(choice.split(' ')[0], "");
}

/**
*	Checks input for validity
*	@param		{String}	topic	User entered text
*	@returns	{Integer}	1 on success 0 on error
*/
function isValidTopic(topic) {
	// Only accept single words
	if(topic.split(" ").length > 1) {
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
	var str = "status" + currentStatus++;
	console.log("Status: " + text + " " + str);	
	$("#status" + currentStatus).html(text);
	$("#status" + currentStatus).delay(currentStatus * 550).fadeIn(2700);
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

function showSentence(sentence) {
	$("#buttons").hide();
	$("#sentenceSection").show();
	$("#sentence").html(sentence);
	$("#sentence").delay(currentStatus * 800).fadeIn(3000, function() {
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
	$("#sentence").html("");
	$("#sentence").hide();
	for(var i = 0; i < 8; i++) {
		$("#status" + i).hide();
		$("#status" + i).html("");
	}
	currentStatus = 0;
	$("#buttons").hide();
}
