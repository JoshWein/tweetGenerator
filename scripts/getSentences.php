<?php
include_once 'configFileFunctions.php';

class GetSentences {
	function __construct() {}

	/**
	*	Returns a list of sentences containing the given topic
	*	@param	$topic	Topic to get sentences for
	*/
	function getSentences($topic) {
		if(!isset($topic) || $topic == "")
			return null;
		try {
			$configValues = getConfigValues("../info/info.txt");
			$conn = getConnection("", "", "", "");
			// Get list of sentence IDs for that topic
			$sql = "SELECT sentences FROM " . $configValues["table1"] . " WHERE topics = (:topic)";
			$stmt = $conn->prepare($sql);
			$stmt->bindParam(":topic", $topic);
			$stmt->execute();
			$results = $stmt->fetch();
			if($results == false) 
				return array(array("error"));
			// Get matching sentences for all of the IDs.
			$sql = "SELECT sentences FROM " . $configValues["table2"] . " WHERE id IN (" . implode(',', $results) . ")";
			$stmt = $conn->prepare($sql);
			$stmt->execute();
			$results = $stmt->fetchAll(PDO::FETCH_NUM);
			// Return list of sentences
			return $results;
		} catch(Exception $e) {
			return "Error: " . $e->getMessage();
		}
	}
}
// echo "running\n";
$obj = new GetSentences();
$response = $obj->getSentences($_GET['topic']);
echo(json_encode($response));
?>