<?php
$cred = file_get_contents("config/cred.json");
$cred = json_decode($cred, true);

$username = $cred['username']; 
$password = $cred['password'];
$url = "fibaro.lindehoff.local";
$data = json_decode(file_get_contents('php://input'), true);

if($data && $data["action"] && $data["action"] == "saveEnergyDevices"){
	$str = '{
	"mainMeter": '.$data["mainMeter"].',
	"energyDevices": [';
	foreach ($data["data"] as $index=>$fibaroId) {
		$str .= '
		{
			"fibaroId": '.$fibaroId.',
			"mainMeter": false
		}';
		if ($index+1 < count($data["data"])) {
			$str .= ",";
		}
	}
	$str .= '
	]
}';
	file_put_contents("config/energyDevices.json", $str);
}else if($_GET['panel'] == "energy") {
	$json = file_get_contents("http://$username:$password@$url/api/energy/".$_GET['from']."/".$_GET['to']."/summary-graph/devices/power/".$_GET['deviceId']);
}elseif ($_GET['panel'] == "event") {
	$json = file_get_contents("http://$username:$password@".$url."/api/panels/event?from=".$_GET['from']."&to=".$_GET['to']."&type=time&deviceID=".$_GET['deviceId']);
}elseif($_GET['deviceType']) {
	if($_GET['deviceType'] == 'all'){
		$json = file_get_contents("http://$username:$password@".$url."/api/devices");
	}else{
		$json = file_get_contents("http://$username:$password@".$url."/api/devices?type=".$_GET['deviceType']);
	}
}

header('Content-Type: application/json');
if($json != ""){
	echo $json;
}else
	echo json_encode(array("error"=>"Unkown query"));
?>