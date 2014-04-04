function loadEnergyChart (from, to) {
	energyChart.showLoading("Loading data...");
	$.getJSON('/config/energyDevices.json', function(devices, textStatus) {
		if(textStatus == "success"){
			series = Enumerable.From(devices.energyDevices).Select("{name: $.name,fibaroId: $.fibaroId,  type: 'column', data: []}").ToArray();
			if(devices.mainMeter != 0){
				mainMeterSerie = series.filter(function(serie) {
					return serie.fibaroId == devices.mainMeter;
				})[0];
				if(typeof(mainMeterSerie) !== 'undefined'){
					mainMeterSerie.type = "line";
					mainMeterSerie.step = "center";
					series.push({name: 'Unknown',fibaroId: 0,  type: 'column', data: []});
				}
			}
			devicelist = Enumerable.From(devices.energyDevices).Select("$.fibaroId").ToArray();
			var range1 = moment().range(moment(from), moment(to));
			var periodInHours = (range1.end.unix()-range1.start.unix())/3600;
			if(periodInHours <= 1)
				group = 'm';
			else if(periodInHours <= 36)
				group = 'h';
			else if(periodInHours <= 24*45)
				group = 'd';
			else if(periodInHours <= 24*30*18)
				group = 'M';
			
			var range2 = moment().range(moment(from), moment(from).add(group, 1));

			var calls = [];
			range1.by(range2, function(periodStart) {
				end = moment(periodStart).add(group, 1).unix();
				if(moment().unix() <= end)
					end = moment().unix();
				calls.push(
					$.getJSON("fibaro.php?panel=energy&type=comparison-graph&from="+periodStart.unix()+"&to="+end+"&deviceId="+devicelist.toString(), function(energyDevicesData, energyDevicesDataStatus) {
						var sum = 0;
						energyChart.hideLoading();
						energyChart.showLoading("Processing data for "+periodStart.format("YYYY-MM-DD HH:ss"));
						$.each( energyDevicesData, function( energyDataIndex, energyDeviceData) {
							devicePeriodData = 0;
							diffTot = 0;
							$.each(energyDeviceData.data, function(energyDataIndex, energyData) {
								if(energyDataIndex < energyDeviceData.data.length-1){
									diff = (energyDeviceData.data[energyDataIndex+1][0]-energyDeviceData.data[energyDataIndex][0])/(range2.end-range2.start);
									diffTot += diff;
									devicePeriodData += diff*energyDeviceData.data[energyDataIndex][1];
								}

							});
							hour = ((moment(periodStart)).add(group, 1).unix()-periodStart.unix())/3600;
							if(group != "m")
								devicePeriodData *= hour;
							series.filter(function(serie) {
								return serie.fibaroId == energyDeviceData.id;
							})[0].data.push({name: energyDeviceData.id, y: devicePeriodData, x: periodStart.unix()*1000, drilldown: true});
							if(energyDeviceData.id != devices.mainMeter)
								sum -= devicePeriodData;
							else
								sum += devicePeriodData;
						});
						
						if(devices.mainMeter != 0){
							unknownSerie = series.filter(function(serie) {
								return serie.fibaroId == 0;
							})[0];
							if(typeof(unknownSerie) !== 'undefined')
								unknownSerie.data.push({name: 0, y: sum, x: periodStart.unix()*1000, drilldown: true});
						}
					})
				);
			})
			$.when.apply($,calls).then(function() {
				energyChart.hideLoading();
				energyChart.showLoading("Processing data: Final sorting");
				$.each(series, function(serieIndex, serie) {
					series[serieIndex].data = Enumerable.From(serie.data).OrderBy("$.x").ToArray();
				});
				energyChartOptions.series = series;
				energyChart = $('#energy').highcharts(energyChartOptions).highcharts();
			});
		}else
			console.log("Error getting energy devices, status: "+textStatus);
	})
}
$(function () {
	$(document).ready(function() {

		Highcharts.setOptions({
			global: {
				useUTC: true,
				timezoneOffset: (new Date()).getTimezoneOffset()
			}
		});
		energyChartOptions = ({
			title: {
				text: 'Energy'
			},
			chart: {
				type: 'column',
				//zoomType: 'x',
				spacingRight: 20,
				animation: Highcharts.svg, // don't animate in old IE
				marginRight: 10,
				events: {
					drilldown: function (e) {
						loadEnergyChart(moment(e.point.x), moment(e.point.x).add(group, 1));

					}
				}
			},
			loading :{
				labelStyle: {
					fontWeight: 'bold',
					position: 'relative',
					top: '1em',
					fontSize: '15px'
				}
			},
			xAxis: {
				type: 'datetime'
			},
			yAxis: {
				min: 0,
				title: {
					text: 'Energy'
				},
				labels: {
					formatter: function () {
						var maxElement = this.axis.max;
						if (maxElement > 2000) {
							return (this.value / 1000).toFixed(0) + " kWh";
						} else {
							return (this.value).toFixed(0)  + " Wh";
						}
					}
				},
				stackLabels: {
					enabled: true,
					style: {
						fontWeight: 'bold',
						color: (Highcharts.theme && Highcharts.theme.textColor) || 'gray'
					},
					formatter: function () {
						var maxElement = this.total;
						if (maxElement > 2000) {
							return (this.total / 1000).toFixed(2) + " kWh";
						} else {
							return (this.total).toFixed(0) + " Wh";
						}
					}
				}
			},
			tooltip: {
				formatter: function () {
					var formatValue = 0;
					if (this.y > 2000) {
						formatValue = (this.y/ 1000).toFixed(2) + " kWh";
					} else {
						formatValue = (this.y).toFixed(0)  + " Wh";
					}
					var percentage = "";
					if(!isNaN(this.percentage))
						percentage = '('+Math.round(this.percentage)+'%)';
					return '<span style="color:'+this.series.color+'">'+this.series.name+'</span>: <b>'+formatValue+'</b> '+percentage+'<br/>'
				}
			},
			plotOptions: {
				series: {
					marker: {
						enabled: false
					},
					shadow: false
				},
				column: {
					stacking: 'normal',
					borderWidth: 0
				}
			},
			series: [],
			drilldown: {
				series: []
			}
		});
		
		//Initiate the chart
		energyChart = $('#energy').highcharts(energyChartOptions).highcharts();
		
		$( "#from" ).datepicker({
			dateFormat: "yy-mm-dd",
			defaultDate: "-2m",
			changeMonth: true,
			changeYear: true,
			numberOfMonths: 2,
			onClose: function( selectedDate ) {
				$( "#to" ).datepicker( "option", "minDate", selectedDate );
			}
		}).val(moment().startOf('M').format("YYYY-MM-DD"));
		$( "#to" ).datepicker({
			dateFormat: "yy-mm-dd",
			defaultDate: "-1m",
			changeMonth: true,
			changeYear: true,
			numberOfMonths: 2,
			onClose: function( selectedDate ) {
				$( "#from" ).datepicker( "option", "maxDate", selectedDate );
			}
		}).val(moment().format("YYYY-MM-DD"));

		$( "#loadEnergyChartButton" )
		.button()
		.click(function() {
			loadEnergyChart($( "#from" ).val(), $( "#to" ).val());
		});

		$( "#chartToDay" )
		.button()
		.click(function() {
			loadEnergyChart(moment().startOf('d'), moment().startOf('d').add('d', 1));
		});
		$( "#chartThisWeek" )
		.button()
		.click(function() {
			loadEnergyChart(moment().startOf('isoWeek'), moment().startOf('isoWeek').add('w', 1));
		});
		$( "#chartThisMonth" )
		.button()
		.click(function() {
			loadEnergyChart(moment().startOf('M'), moment().startOf('M').add('M', 1));
		});
		$( "#chartThisYear" )
		.button()
		.click(function() {
			loadEnergyChart(moment().startOf('y'), moment());
		});
	});
});

//Global vars
var groups = ["y","M","h","m"];

//Default Grouping is Mounth
var group = "M";
var series = [];
var energyChartOptions = [];
var energyChart;