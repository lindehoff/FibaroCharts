<?php

//Getting posted data
$data = json_decode(file_get_contents('php://input'), true);

if (!file_exists('config')) {
    mkdir('config', 0777, true);
}

if(!file_exists("config/energyDevices.json")){
	$str = '{
	"mainMeter": 0,
	"energyDevices": [ ]'. PHP_EOL . '}';
	file_put_contents("config/energyDevices.json", $str);
}

if($data && $data["action"] && $data["action"] == "saveSettings"){
	//Saving settings
	$str = '{
	"hc2Url": "'.$data["hc2Url"].'",
	"username": "'.$data["username"].'",
	"password": "'.$data["password"].'"';
	$str .=  '
}';
	file_put_contents("config/settings.json", $str);
	$json = json_encode(array("settings"=>"Saved"));
}else{
	//Getting settings
	$settings = file_get_contents("config/settings.json");
	$settings = json_decode($settings, true);
	$username = $settings['username']; 
	$password = $settings['password'];
	$url = $settings['hc2Url']; 

	if($data && $data["action"] && $data["action"] == "saveEnergyDevices"){
		//Saving energy Devices
		$str = '{
	"mainMeter": '.$data["mainMeter"].',
	"energyDevices": [';
		foreach ($data["ids"] as $index=>$fibaroId) {
			$str .= '
		{
			"name": "'.$data["names"][$index] .'",
			"fibaroId": '.$fibaroId.'
		}';
			if ($index+1 < count($data["ids"])) {
				$str .= ",";
			}
		}
		$str .= PHP_EOL.'	]'. PHP_EOL;
		$str .=  '}';
		file_put_contents("config/energyDevices.json", $str);
		$json = json_encode(array("EnergyDevices"=>"Saved"));
	}else if(array_key_exists('panel', $_GET) && $_GET['panel'] == "energy") {
		//Getting energy data
		$json = file_get_contents("http://$username:$password@$url/api/energy/".$_GET['from']."/".$_GET['to']."/".$_GET['type']."/devices/power/".$_GET['deviceId']);
	}else if(array_key_exists('panel', $_GET) && $_GET['panel'] == "event") {
		//Getting event Data
		$json = file_get_contents("http://$username:$password@".$url."/api/panels/event?from=".$_GET['from']."&to=".$_GET['to']."&type=time&deviceID=".$_GET['deviceId']);
	}elseif($_GET['deviceType']) {
		//Getting device Info
		if($_GET['deviceType'] == 'all'){
			// Getting all devices
			$json = file_get_contents("http://$username:$password@".$url."/api/devices");
		}else if(is_numeric($_GET['deviceType'])){
			// Getting devices of at specific type
			$json = file_get_contents("http://$username:$password@".$url."/api/devices?id=".$_GET['deviceType']);
		}else{
			// Getting devices of at specific type
			$json = file_get_contents("http://$username:$password@".$url."/api/devices?type=".$_GET['deviceType']);
		}
	}
}

// Output as JSON
header('Content-Type: application/json');
if($json != ""){
	echo $json;
}else
	echo json_encode(array("error"=>"Unkown query"));
?>