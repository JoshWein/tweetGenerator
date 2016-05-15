<?php

define('DB_HOST', getenv('OPENSHIFT_MYSQL_DB_HOST'));
define('DB_PORT', getenv('OPENSHIFT_MYSQL_DB_PORT'));
define('DB_USER', getenv('OPENSHIFT_MYSQL_DB_USERNAME'));
define('DB_PASS', getenv('OPENSHIFT_MYSQL_DB_PASSWORD'));
define('DB_NAME', getenv('OPENSHIFT_GEAR_NAME'));
/*
*	Creates a connection with the database.
*/
function getConnection($connectionURL, $db, $username, $password) {	
	try {
		$dsn = 'mysql:dbname='.DB_NAME.';host='.DB_HOST.';port='.DB_PORT . ';dbname=data';
		$conn = new PDO($dsn, DB_USER, DB_PASS, DB_USER, DB_PASS);
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
		array_push($result, array('message' => 'file not found'));
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