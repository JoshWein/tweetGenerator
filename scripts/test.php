<?php

require_once('TwitterAPIExchange.php');

/** Set access tokens here - see: https://dev.twitter.com/apps/ **/
$settings = array(
    'oauth_access_token' => "OAUTH",
    'oauth_access_token_secret' => "OAUTH_SECRET",
    'consumer_key' => "CONS_KEY",
    'consumer_secret' => "CONS_SECRET"
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