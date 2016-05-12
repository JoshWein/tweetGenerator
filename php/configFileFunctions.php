<?php

/*
*	Creates a connection with the database.
*/
function getConnection($connectionURL, $db, $username, $password) {	
	try {
		$conn = new PDO("mysql:host=$connectionURL;port=3307;dbname=$db", $username, $password);
		$conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
		$conn->setAttribute(PDO::ATTR_EMULATE_PREPARES, 1);
	}	catch (PDOException $e) {		
		$result = array();			
		array_push($result, array('result' => 'failure'));
		array_push($result, "Error: " . $e->getMessage());
		echo json_encode($result);		
	}
	return $conn;
}

/*
*	Gets the values from the config.txt file.
*	@param configLocation 	Contains location of the file containing configuration details.
*/
function getConfigValues($configLocation) {	
	if(!isset($configLocation)){
		die;
	} 
	if(!file_exists($configLocation)) {
		$result = array();			
		array_push($result, array('result' => 'failure'));
		echo json_encode($result);		
		return;
	}
	$configFile = fopen($configLocation, "r") or die("Could not open config file");
	$configValues = array(
		"connectionURL" => trim(fgets($configFile)),
		"username" => trim(fgets($configFile)),
		"password" => trim(fgets($configFile)),
		"db" => trim(fgets($configFile)),
		"table1" => trim(fgets($configFile)),
		"table2" => trim(fgets($configFile)),
		);
	fclose($configFile);
	return $configValues;
}
?>