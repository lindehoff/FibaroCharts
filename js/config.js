function getEnergyDevices (energyDevicesTag, mainEnergyMeterTag) {
	$.when(
		$.getJSON('fibaro.php?deviceType=all'), $.getJSON('config/energyDevices.json').error(function(jqxhr, textStatus) {
			console.log(jqxhr.status);
		})
	).then(function(devices, selectedDevices) {
		if(selectedDevices[0].energyDevices.length == 0){
			$( "#energyConfig" ).dialog( "open" );
		}else
			initLiveEnergy();//loadEnergyChart(moment().startOf('d'), moment().startOf('d').add('d', 1));
		$(energyDevicesTag).empty();
		
		energyDevices = Enumerable.From(devices[0]).Where("$.properties.showEnergy == '1'").Select("{name: $.name, roomId: $.roomID, fibaroId:$.id}").ToArray();
		energyDevices.forEach(function(energyDevice, index) { 
			selected = Enumerable.From(selectedDevices[0].energyDevices).Where("$.fibaroId == "+energyDevice.fibaroId).ToArray();			
			if(selected.length > 0)
				selected = ", ui-selected";
			else
				selected = "";
			
			$(energyDevicesTag).append('<li class="ui-widget-content'+selected+'" data-fibaroid="'+energyDevice.fibaroId+'" data-name="'+energyDevice.name+'">'+energyDevice.name+'</li>');
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

function getSelected(listTag, data){
	var ids = $(listTag+' .ui-selected').map(function() {
			return $(this).data(data);
	});
	return ids.toArray();
}

function saveEnergyDevices (energyDevicesTag, mainEnergyMeterTag) {
	ids = getSelected(energyDevicesTag, 'fibaroid');
	names = getSelected(energyDevicesTag, 'name');
	mainMeter = $( mainEnergyMeterTag+" option:selected").val()
	$.post( "fibaro.php", JSON.stringify({ action: "saveEnergyDevices", ids: ids, mainMeter: mainMeter, names: names}), function(json, textStatus) {
		if(textStatus == "success"){
			getEnergyDevices("#energyDevices");
		}else
			console.log("Error saving energy devices, status: "+textStatus);
	});
}

function saveSettings () {
	var r = $.Deferred();
	hc2Url = $("#hc2Url").val();
	username = $("#username").val();
	password = $("#password").val();
	$.post( "fibaro.php", JSON.stringify({ action: "saveSettings", hc2Url: hc2Url, username: username, password: password}))
	.complete(function(jqXHR, textStatus) {
		if(textStatus == "success"){
			getEnergyDevices("#energyDevices","#mainMeter");
		}else
			console.log("Error saving settings, status: "+textStatus);
		r.resolve();
	});
	return r;
}

function testHC2Connection(){
	var r = $.Deferred();
	$.getJSON('fibaro.php?deviceType=1')
	.complete(function(jqXHR, textStatus) {
		if(textStatus == "success")
			r.resolve(true);
		else
			r.resolve(false);
	});
	return r;
}
$(function () {
	$(document).ready(function() {
		$( "#settingsConfig" ).dialog({
			autoOpen: false,
			height: 300,
			width: 350,
			modal: true,
			buttons: {
				"Save":  function() {
					saveSettings().done(function (){
						testHC2Connection().done(function (connectionStatus){
							if(connectionStatus){
								$(  "#settingsConfig" ).dialog( "close" );	
							}else{
								console.log("Fail")
							}
						});
					});
				}
			}
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

		$("#saveEnergyDevices")
		.button()
		.click(function( event ) {
			saveEnergyDevices("#energyDevices");
		});

		$( "#showConfigEnergyDevices" )
		.button()
		.click(function() {
			$( "#energyConfig" ).dialog( "open" );
		});

		// Test conection
		testHC2Connection().done(function (connectionStatus){
			if(connectionStatus){
				getEnergyDevices("#energyDevices","#mainMeter");
			}else{
				$( "#settingsConfig" ).dialog( "open" );
			}
		});
	});
});