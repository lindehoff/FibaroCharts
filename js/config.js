function getEnergyDevices (energyDevicesTag, mainEnergyMeterTag) {
	$.when(
		$.getJSON('fibaro.php?deviceType=all'), $.getJSON('http://fibarochart.lindehoff.local/config/energyDevices.json')
	).then(function(devices, selectedDevices) {
		$(energyDevicesTag).empty();
		//$(mainEnergyMeterTag).empty();
		energyDevices = Enumerable.From(devices[0]).Where("$.properties.showEnergy == '1'").Select("{name: $.name, roomId: $.roomID, fibaroId:$.id}").ToArray();
		energyDevices.forEach(function(energyDevice, index) { 
			selected = Enumerable.From(selectedDevices[0].energyDevices).Where("$.fibaroId == "+energyDevice.fibaroId).ToArray();			
			if(selected.length > 0)
				selected = ", ui-selected";
			else
				selected = "";
			
			$(energyDevicesTag).append('<li class="ui-widget-content'+selected+'" data-fibaroid="'+energyDevice.fibaroId+'">'+energyDevice.name+'</li>');
			if(selectedDevices[0]['mainMeter'] == energyDevice.fibaroId)
				$(mainEnergyMeterTag).append('<option value="'+energyDevice.fibaroId+'" Selected>'+energyDevice.name+'</option>');
			else
				$(mainEnergyMeterTag).append('<option value="'+energyDevice.fibaroId+'">'+energyDevice.name+'</option>');
		});
		$(energyDevicesTag).bind("mousedown", function(e) {
		  e.metaKey = true;
		}).selectable();
	});
}

function getSelected(listTag){
	var ids = $(listTag+' .ui-selected').map(function() {
    return $(this).data('fibaroid');
	});
	return ids.toArray();
}

function saveEnergyDevices (energyDevicesTag, mainEnergyMeterTag) {
	ids = getSelected(energyDevicesTag);
	mainMeter = $( mainEnergyMeterTag+" option:selected").val()
	$.post( "fibaro.php", JSON.stringify({ action: "saveEnergyDevices", data: ids, mainMeter: mainMeter}), function(json, textStatus) {
		if(textStatus == "success"){
			getEnergyDevices("#energyDevices");
		}else
			console.log("Error saving energy devices, status: "+textStatus);
	});
}

$(function () {
	$(document).ready(function() {
		getEnergyDevices("#energyDevices","#mainMeter");
		$("#saveEnergyDevices")
		.button()
		.click(function( event ) {
			saveEnergyDevices("#energyDevices");
		});

		$( "#energyConfig" ).dialog({
			autoOpen: false,
			height: 300,
			width: 350,
			modal: true,
			buttons: {
				"Save":  function() {
					saveEnergyDevices("#energyDevices", "#mainMeter");
					$( this ).dialog( "close" );
				},
				Cancel: function() {
					$( this ).dialog( "close" );
				}
			}
		});
		$( "#showConfigEnergyDevices" )
		.button()
		.click(function() {
			$( "#energyConfig" ).dialog( "open" );
		});
	});
});