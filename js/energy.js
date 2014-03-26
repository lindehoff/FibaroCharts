$(function () {
	$(document).ready(function() {
		$.getJSON('/config/energyDevices.json', function(json, textStatus) {
			if(textStatus == "success"){
				$.each( json.energyDevices, function( energyDeviceIndex, energyDevice ) {
						console.log(energyDevice.fibaroId);
				 });
			}else
				console.log("Error getting energy devices, status: "+textStatus);
		});
	});
});