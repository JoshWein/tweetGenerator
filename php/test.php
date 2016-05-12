<?php

require_once('TwitterAPIExchange.php');

/** Set access tokens here - see: https://dev.twitter.com/apps/ **/
$settings = array(
    'oauth_access_token' => "54059140-fikrd4OZ2H0ob1sqcde72ax3Bh2cXJO3pJdeoO7TM",
    'oauth_access_token_secret' => "FXjlhEKnC09d8Bx9ExVDjUPBNqUuve7sWpcsB9cvYsAZi",
    'consumer_key' => "U2KMRvPi2QJ4TfL8Z4eXKXjLp",
    'consumer_secret' => "APXEbhrOsbvrOz9rxx7iOUh03TAQ8F8vqnZcGqC5i91SeivhGt"
);

/** URL for REST request, see: https://dev.twitter.com/docs/api/1.1/ **/
// $url = 'https://api.twitter.com/1.1/search/tweets.json';
$url = 'https://api.twitter.com/1.1/application/rate_limit_status.json';

/** Note: Set the GET field BEFORE calling buildOauth(); **/
$q = 'q=food';
$lang = '&lang=en';
$count = '&count=100';
$result_type = '&resultType=mixed';
$getfield = '?' . $q . $lang .  $count . $result_type;
$getfield = '?';
$requestMethod = 'GET';

/** Compile the request **/
$twitter = new TwitterAPIExchange($settings);
$twitter->setGetfield($getfield)
    ->buildOauth($url, $requestMethod);

$response = "";
$count = 0;
$result = $twitter->performRequest();
var_dump(json_decode($result));
/** Perform the request **/
// for($i = 0; $i < 10; $i++) {
// 	$result = $twitter->performRequest();
// 	$result = json_decode($result);

// 	// Save good tweets
// 	foreach ($result->statuses as $tweet) {
// 		$text = $tweet->text;
// 		if (strpos($text, 'RT ') !== false || strpos($text, 'https://t') !== false || strpos($text, '@') !== false) {    	
// 		} else {
// 			if (strpos(strtolower($text), ' food ') !== false) {
// 				$response .= $tweet->text . "\n\n";	
// 				$count++;	
// 			}
// 		}	
// 	}
// }
// echo "done " . $count . "\n" . $response . "\n";
?>