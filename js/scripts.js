/**
*	Main routine for generating a random sentence
*/
function generateSentence() {
	var topic = $("#topicText").val();	
	if(isValidTopic(topic)) {
		console.log("Getting sentences for: " + topic);
		$.ajax({
			url: "scripts/getSentences.php"
		});
		$.ajax({
			url: "../scripts/getSentences.php"
		});
	} else {
		console.log("Invalid entry");
	}
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