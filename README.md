Fibaro Charts
==========
This is the first version (v0.1) of a charting tool for Fibaro's Home Center 2/Lite
This version only includes Energy charts.

Requirement
----------
It has to be installed on a webserver running PHP 5
Most of the work is being done on the client (JavaScript) but some things have to be done on a webserver.
fibaro.php is only used to get data from the HC2 and to save settings.
If Fibaro HC2 supported JSONp we could access the data without the need of a porxy web service.

Energy Charts
----------
Presents your energy consumption as a stacked column chart so you can get att great overview witch devices is consuming the most energy.
If you have a main energy meter, like Aeon HEM, it will subtract all known consumptions and add an Unknown series.
It will automatically groups the data based on the time span you are view.

Installation
----------
Installation is very easy:
* Put the files on your webserver and navigate to energy.html
* The first thing you should get is a windows asking you to fill in the information to your Fibaro HC2/Lite (your credentials will be saved to config/settings.json)
* The next thing you will see is a window asking you to select the energy devices you want to add. You can also choose a Main Meter if you have one installed.
* You are now done with the installation.
