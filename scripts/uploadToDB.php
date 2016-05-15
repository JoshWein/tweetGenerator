<?php
include_once 'configFileFunctions.php';


class UploadToDB {

	function __construct() {}

	// Script for uploading all of the tweets to the database
	function upload(){
		$configValues = getConfigValues("../configs/config.txt");
		try {
			$conn = getConnection($configValues["connectionURL"], $configValues["db"], $configValues["username"], $configValues["password"]);
			$tweetsFile = fopen("../data/onemiltweetsnew.txt", "r") or die("Could not open config file");
			if ($tweetsFile) {
				$count = 0;
			    while (($line = fgets($tweetsFile)) !== false) {
			    	// 	skipped certain kinds of tweets
			    	if (strpos($line, 'RT ') !== false || strpos($line, 'https://t') !== false || strpos($line, '@') !== false) {
			    	} else {
			    		$line = str_replace('"',"",$line);
			    		// START sentence insert
				        $sql = "INSERT INTO " . $configValues["table2"]. " (sentences) VALUES (:line)";
						$stmt = $conn->prepare($sql);
						$stmt->bindParam(":line", $line);
						$stmt->execute();
						// END sentence insert
						// Get id of sentence we just added so we can map the words to the sentence in a different table
						$sql = "SELECT LAST_INSERT_ID()";
						$stmt = $conn->prepare($sql);
						$stmt->execute();
						$sentenceID = $stmt->fetch()[0];
						// Split on whitespace to get list of words
						$words = preg_split("/[^\w]*([\s]+[^\w]*|$)/", $line, -1, PREG_SPLIT_NO_EMPTY);
			    		foreach($words as $word) {
			    			if(strlen($word) < 70) {
				    			$sql = "INSERT INTO " . $configValues["table1"] . " (topics, sentences) VALUES(:word, " . $sentenceID . ") ON DUPLICATE KEY UPDATE sentences=concat(sentences, ', " . $sentenceID . "')";			
				    			$stmt = $conn->prepare($sql);
				    			$stmt->bindParam(":word", $word);
								$stmt->execute();
							}
			    		}
			    		// Keep count in the console to track progress
			    		$count++;
			    		if($count % 1000 == 0) 
			    			echo $count . " ";
			    		if($count % 10000 == 0)
			    			echo "\n";
		    		}
			    }
			    fclose($tweetsFile);
			} else {
			    // error opening the file.
			} 			
		} catch (Exception $e) {
			echo "Error: " . $e->getMessage();
		}
		echo "\n=====Done====\n";
	}

}

$obj = new UploadToDB();
// Run script
// $obj->upload();
?>