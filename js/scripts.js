/**
*	Starting routine for generating a random sentence
*/
function start() {
	var topic = $("#topicText").val();	
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
	var choices = getTagList("<s>", list);
	console.log(choices);
	var sentence = "";
	var safetyCounter = 0;
	while(!sentence.includes("</s>")) {
		sentence += chooseTag(choices, probabilities);
		// Update choices using the last word in the sentence as a tag
		var lastWord = sentence.split(" ").splice(-1)[0];
		console.log(lastWord);
		choices = getTagList(lastWord, list);
		console.log(choices);
		// Infinite loop protection
		if(safetyCounter > 20) {
			break;
		}
		safetyCounter++;
	}
	console.log(sentence);
}

/**
*	Gets all n grams with a matching first gram
*	@param	{String}				tag		String to match
*	@param	{String[]} 	list	List of strings
*/
function getTagList(tag, list) {
	console.log("Matching for " + tag.trim());
	console.log(list);
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
	return choices[0].replace(choices[0].split(' ')[0], "");
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
function updateStatus(text) {
	console.log("Status: " + text);
	$("#status").fadeOut(200, function () {
		document.getElementById("status").innerHTML = text;
		$("#status").fadeIn(200);
	});	
}
// Submits word on enter key press
$("#topicText").bind('keyup', function(event) {
	if(event.keyCode == 13){ 
		start();
	}
});
