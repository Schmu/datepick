﻿/* http://keith-wood.name/datepick.html
   Date picker for jQuery v4.1.0.
   Written by Keith Wood (kbwood{at}iinet.com.au) February 2010.
   Dual licensed under the GPL (http://dev.jquery.com/browser/trunk/jquery/GPL-LICENSE.txt) and
   MIT (http://dev.jquery.com/browser/trunk/jquery/MIT-LICENSE.txt) licenses.
   Please attribute the author if you use it. */

(function($) { // Hide scope, no $ conflict

/* Datepicker manager. */
function Datepicker() {
	this._defaults = {
		pickerClass: '', // CSS class to add to this instance of the datepicker
		showOnFocus: true, // True for popup on focus, false for not
		showTrigger: null, // Element to be cloned for a trigger, null for none
		showAnim: 'show', // Name of jQuery animation for popup, '' for no animation
		showOptions: {}, // Options for enhanced animations
		showSpeed: 'normal', // Duration of display/closure
		popupContainer: null, // The element to which a popup calendar is added, null for body
		alignment: 'bottom', // Alignment of popup - with nominated corner of input:
			// 'top' or 'bottom' aligns depending on language direction,
			// 'topLeft', 'topRight', 'bottomLeft', 'bottomRight'
		fixedWeeks: false, // True to always show 6 weeks, false to only show as many as are needed
		firstDay: 0, // First day of the week, 0 = Sunday, 1 = Monday, ...
		calculateWeek: this.iso8601Week, // Calculate week of the year from a date, null for ISO8601
		monthsToShow: 1, // How many months to show, cols or [rows, cols]
		monthsOffset: 0, // How many months to offset the primary month by;
			// may be a function that takes the date and returns the offset
		monthsToStep: 1, // How many months to move when prev/next clicked
		monthsToJump: 12, // How many months to move when large prev/next clicked
		useMouseWheel: true, // True to use mousewheel if available, false to never use it
		changeMonth: true, // True to change month/year via drop-down, false for navigation only
		yearRange: 'c-10:c+10', // Range of years to show in drop-down: 'any' for direct text entry
			// or 'start:end', where start/end are '+-nn' for relative to today
			// or 'c+-nn' for relative to the currently selected date
			// or 'nnnn' for an absolute year
		shortYearCutoff: '+10', // Cutoff for two-digit year in the current century
		showOtherMonths: false, // True to show dates from other months, false to not show them
		selectOtherMonths: false, // True to allow selection of dates from other months too
		defaultDate: null, // Date to show if no other selected
		selectDefaultDate: false, // True to pre-select the default date if no other is chosen
		minDate: null, // The minimum selectable date
		maxDate: null, // The maximum selectable date
		dateFormat: 'mm/dd/yyyy', // Format for dates
		autoSize: false, // True to size the input field according to the date format
		rangeSelect: false, // Allows for selecting a date range on one date picker
		rangeSeparator: ' - ', // Text between two dates in a range
		multiSelect: 0, // Maximum number of selectable dates, zero for single select
		multiSeparator: ',', // Text between multiple dates
		onDate: null, // Callback as a date is added to the datepicker
		onShow: null, // Callback just before a datepicker is shown
		onChangeMonthYear: null, // Callback when a new month/year is selected
		onSelect: null, // Callback when a date is selected
		onClose: null, // Callback when a datepicker is closed
		altField: null, // Alternate field to update in synch with the datepicker
		altFormat: null, // Date format for alternate field, defaults to dateFormat
		constrainInput: true, // True to constrain typed input to dateFormat allowed characters
		commandsAsDateFormat: false, // True to apply formatDate to the command texts
		commands: this.commands // Command actions that may be added to a layout by name
	};
	this.regional = [];
	this.regional[''] = { // US/English
		monthNames: ['January', 'February', 'March', 'April', 'May', 'June',
		'July', 'August', 'September', 'October', 'November', 'December'],
		monthNamesShort: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
		dayNames: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
		dayNamesShort: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
		dayNamesMin: ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'],
		dateFormat: 'mm/dd/yyyy', // See options on formatDate
		firstDay: 0, // The first day of the week, Sun = 0, Mon = 1, ...
		renderer: this.defaultRenderer, // The rendering templates
		prevText: '&lt;Prev', // Text for the previous month command
		prevStatus: 'Show the previous month', // Status text for the previous month command
		prevJumpText: '&lt;&lt;', // Text for the previous year command
		prevJumpStatus: 'Show the previous year', // Status text for the previous year command
		nextText: 'Next&gt;', // Text for the next month command
		nextStatus: 'Show the next month', // Status text for the next month command
		nextJumpText: '&gt;&gt;', // Text for the next year command
		nextJumpStatus: 'Show the next year', // Status text for the next year command
		currentText: 'Current', // Text for the current month command
		currentStatus: 'Show the current month', // Status text for the current month command
		todayText: 'Today', // Text for the today's month command
		todayStatus: 'Show today\'s month', // Status text for the today's month command
		clearText: 'Clear', // Text for the clear command
		clearStatus: 'Clear all the dates', // Status text for the clear command
		closeText: 'Close', // Text for the close command
		closeStatus: 'Close the datepicker', // Status text for the close command
		yearStatus: 'Change the year', // Status text for year selection
		monthStatus: 'Change the month', // Status text for month selection
		weekText: 'Wk', // Text for week of the year column header
		weekStatus: 'Week of the year', // Status text for week of the year column header
		dayStatus: 'Select DD, M d, yyyy', // Status text for selectable days
		defaultStatus: 'Select a date', // Status text shown by default
		isRTL: false // True if language is right-to-left
	};
	$.extend(this._defaults, this.regional['']);
	this._disabled = [];
}

$.extend(Datepicker.prototype, {
	/* Class name added to elements to indicate already configured with datepicker. */
	markerClassName: 'hasDatepick',
	/* Name of the data property for instance settings. */
	propertyName: 'datepick',

	_popupClass: 'datepick-popup', // Marker for popup division
	_triggerClass: 'datepick-trigger', // Marker for trigger element
	_disableClass: 'datepick-disable', // Marker for disabled element
	_monthYearClass: 'datepick-month-year', // Marker for month/year inputs
	_curMonthClass: 'datepick-month-', // Marker for current month/year
	_anyYearClass: 'datepick-any-year', // Marker for year direct input
	_curDoWClass: 'datepick-dow-', // Marker for day of week

	commands: { // Command actions that may be added to a layout by name
		// name: { // The command name, use '{button:name}' or '{link:name}' in layouts
		//		text: '', // The field in the regional settings for the displayed text
		//		status: '', // The field in the regional settings for the status text
		//      // The keystroke to trigger the action
		//		keystroke: {keyCode: nn, ctrlKey: boolean, altKey: boolean, shiftKey: boolean},
		//		enabled: fn, // The function that indicates the command is enabled
		//		date: fn, // The function to get the date associated with this action
		//		action: fn} // The function that implements the action
		prev: {text: 'prevText', status: 'prevStatus', // Previous month
			keystroke: {keyCode: 33}, // Page up
			enabled: function(inst) {
				var minDate = inst.curMinDate();
				return (!minDate || plugin.add(plugin.day(
					plugin._applyMonthsOffset(plugin.add(plugin.newDate(inst.drawDate),
					1 - inst.options.monthsToStep, 'm'), inst), 1), -1, 'd').
					getTime() >= minDate.getTime()); },
			date: function(inst) {
				return plugin.day(plugin._applyMonthsOffset(plugin.add(
					plugin.newDate(inst.drawDate), -inst.options.monthsToStep, 'm'), inst), 1); },
			action: function(inst) {
				plugin._changeMonthPlugin(this, -inst.options.monthsToStep); }
		},
		prevJump: {text: 'prevJumpText', status: 'prevJumpStatus', // Previous year
			keystroke: {keyCode: 33, ctrlKey: true}, // Ctrl + Page up
			enabled: function(inst) {
				var minDate = inst.curMinDate();
				return (!minDate || plugin.add(plugin.day(
					plugin._applyMonthsOffset(plugin.add(plugin.newDate(inst.drawDate),
					1 - inst.options.monthsToJump, 'm'), inst), 1), -1, 'd').
					getTime() >= minDate.getTime()); },
			date: function(inst) {
				return plugin.day(plugin._applyMonthsOffset(plugin.add(
					plugin.newDate(inst.drawDate), -inst.options.monthsToJump, 'm'), inst), 1); },
			action: function(inst) {
				plugin._changeMonthPlugin(this, -inst.options.monthsToJump); }
		},
		next: {text: 'nextText', status: 'nextStatus', // Next month
			keystroke: {keyCode: 34}, // Page down
			enabled: function(inst) {
				var maxDate = inst.get('maxDate');
				return (!maxDate || plugin.day(plugin._applyMonthsOffset(plugin.add(
					plugin.newDate(inst.drawDate), inst.options.monthsToStep, 'm'), inst), 1).
					getTime() <= maxDate.getTime()); },
			date: function(inst) {
				return plugin.day(plugin._applyMonthsOffset(plugin.add(
					plugin.newDate(inst.drawDate), inst.options.monthsToStep, 'm'), inst), 1); },
			action: function(inst) {
				plugin._changeMonthPlugin(this, inst.options.monthsToStep); }
		},
		nextJump: {text: 'nextJumpText', status: 'nextJumpStatus', // Next year
			keystroke: {keyCode: 34, ctrlKey: true}, // Ctrl + Page down
			enabled: function(inst) {
				var maxDate = inst.get('maxDate');
				return (!maxDate || plugin.day(plugin._applyMonthsOffset(plugin.add(
					plugin.newDate(inst.drawDate), inst.options.monthsToJump, 'm'), inst), 1).
					getTime() <= maxDate.getTime()); },
			date: function(inst) {
				return plugin.day(plugin._applyMonthsOffset(plugin.add(
					plugin.newDate(inst.drawDate), inst.options.monthsToJump, 'm'), inst), 1); },
			action: function(inst) {
				plugin._changeMonthPlugin(this, inst.options.monthsToJump); }
		},
		current: {text: 'currentText', status: 'currentStatus', // Current month
			keystroke: {keyCode: 36, ctrlKey: true}, // Ctrl + Home
			enabled: function(inst) {
				var minDate = inst.curMinDate();
				var maxDate = inst.get('maxDate');
				var curDate = inst.selectedDates[0] || plugin.today();
				return (!minDate || curDate.getTime() >= minDate.getTime()) &&
					(!maxDate || curDate.getTime() <= maxDate.getTime()); },
			date: function(inst) {
				return inst.selectedDates[0] || plugin.today(); },
			action: function(inst) {
				var curDate = inst.selectedDates[0] || plugin.today();
				plugin._showMonthPlugin(this, curDate.getFullYear(), curDate.getMonth() + 1); }
		},
		today: {text: 'todayText', status: 'todayStatus', // Today's month
			keystroke: {keyCode: 36, ctrlKey: true}, // Ctrl + Home
			enabled: function(inst) {
				var minDate = inst.curMinDate();
				var maxDate = inst.get('maxDate');
				return (!minDate || plugin.today().getTime() >= minDate.getTime()) &&
					(!maxDate || plugin.today().getTime() <= maxDate.getTime()); },
			date: function(inst) { return plugin.today(); },
			action: function(inst) { plugin._showMonthPlugin(this); }
		},
		clear: {text: 'clearText', status: 'clearStatus', // Clear the datepicker
			keystroke: {keyCode: 35, ctrlKey: true}, // Ctrl + End
			enabled: function(inst) { return true; },
			date: function(inst) { return null; },
			action: function(inst) { plugin._clearPlugin(this); }
		},
		close: {text: 'closeText', status: 'closeStatus', // Close the datepicker
			keystroke: {keyCode: 27}, // Escape
			enabled: function(inst) { return true; },
			date: function(inst) { return null; },
			action: function(inst) { plugin._hidePlugin(this); }
		},
		prevWeek: {text: 'prevWeekText', status: 'prevWeekStatus', // Previous week
			keystroke: {keyCode: 38, ctrlKey: true}, // Ctrl + Up
			enabled: function(inst) {
				var minDate = inst.curMinDate();
				return (!minDate || plugin.add(plugin.newDate(inst.drawDate), -7, 'd').
					getTime() >= minDate.getTime()); },
			date: function(inst) { return plugin.add(plugin.newDate(inst.drawDate), -7, 'd'); },
			action: function(inst) { plugin._changeDayPlugin(this, -7); }
		},
		prevDay: {text: 'prevDayText', status: 'prevDayStatus', // Previous day
			keystroke: {keyCode: 37, ctrlKey: true}, // Ctrl + Left
			enabled: function(inst) {
				var minDate = inst.curMinDate();
				return (!minDate || plugin.add(plugin.newDate(inst.drawDate), -1, 'd').
					getTime() >= minDate.getTime()); },
			date: function(inst) { return plugin.add(plugin.newDate(inst.drawDate), -1, 'd'); },
			action: function(inst) { plugin._changeDayPlugin(this, -1); }
		},
		nextDay: {text: 'nextDayText', status: 'nextDayStatus', // Next day
			keystroke: {keyCode: 39, ctrlKey: true}, // Ctrl + Right
			enabled: function(inst) {
				var maxDate = inst.get('maxDate');
				return (!maxDate || plugin.add(plugin.newDate(inst.drawDate), 1, 'd').
					getTime() <= maxDate.getTime()); },
			date: function(inst) { return plugin.add(plugin.newDate(inst.drawDate), 1, 'd'); },
			action: function(inst) { plugin._changeDayPlugin(this, 1); }
		},
		nextWeek: {text: 'nextWeekText', status: 'nextWeekStatus', // Next week
			keystroke: {keyCode: 40, ctrlKey: true}, // Ctrl + Down
			enabled: function(inst) {
				var maxDate = inst.get('maxDate');
				return (!maxDate || plugin.add(plugin.newDate(inst.drawDate), 7, 'd').
					getTime() <= maxDate.getTime()); },
			date: function(inst) { return plugin.add(plugin.newDate(inst.drawDate), 7, 'd'); },
			action: function(inst) { plugin._changeDayPlugin(this, 7); }
		}
	},

	/* Default template for generating a datepicker. */
	defaultRenderer: {
		// Anywhere: '{l10n:name}' to insert localised value for name,
		// '{link:name}' to insert a link trigger for command name,
		// '{button:name}' to insert a button trigger for command name,
		// '{popup:start}...{popup:end}' to mark a section for inclusion in a popup datepicker only,
		// '{inline:start}...{inline:end}' to mark a section for inclusion in an inline datepicker only
		// Overall structure: '{months}' to insert calendar months
		picker: '<div class="datepick">' +
		'<div class="datepick-nav">{link:prev}{link:today}{link:next}</div>{months}' +
		'{popup:start}<div class="datepick-ctrl">{link:clear}{link:close}</div>{popup:end}' +
		'<div class="datepick-clear-fix"></div></div>',
		// One row of months: '{months}' to insert calendar months
		monthRow: '<div class="datepick-month-row">{months}</div>',
		// A single month: '{monthHeader:dateFormat}' to insert the month header -
		// dateFormat is optional and defaults to 'MM yyyy',
		// '{weekHeader}' to insert a week header, '{weeks}' to insert the month's weeks
		month: '<div class="datepick-month"><div class="datepick-month-header">{monthHeader}</div>' +
		'<table><thead>{weekHeader}</thead><tbody>{weeks}</tbody></table></div>',
		// A week header: '{days}' to insert individual day names
		weekHeader: '<tr>{days}</tr>',
		// Individual day header: '{day}' to insert day name
		dayHeader: '<th>{day}</th>',
		// One week of the month: '{days}' to insert the week's days, '{weekOfYear}' to insert week of year
		week: '<tr>{days}</tr>',
		// An individual day: '{day}' to insert day value
		day: '<td>{day}</td>',
		// jQuery selector, relative to picker, for a single month
		monthSelector: '.datepick-month',
		// jQuery selector, relative to picker, for individual days
		daySelector: 'td',
		// Class for right-to-left (RTL) languages
		rtlClass: 'datepick-rtl',
		// Class for multi-month datepickers
		multiClass: 'datepick-multi',
		// Class for selectable dates
		defaultClass: '',
		// Class for currently selected dates
		selectedClass: 'datepick-selected',
		// Class for highlighted dates
		highlightedClass: 'datepick-highlight',
		// Class for today
		todayClass: 'datepick-today',
		// Class for days from other months
		otherMonthClass: 'datepick-other-month',
		// Class for days on weekends
		weekendClass: 'datepick-weekend',
		// Class prefix for commands
		commandClass: 'datepick-cmd',
		// Extra class(es) for commands that are buttons
		commandButtonClass: '',
		// Extra class(es) for commands that are links
		commandLinkClass: '',
		// Class for disabled commands
		disabledClass: 'datepick-disabled'
	},

	/* Override the default settings for all datepicker instances.
	   @param  options  (object) the new settings to use as defaults
	   @return  (Datepicker) this object */
	setDefaults: function(options) {
		$.extend(this._defaults, options || {});
		return this;
	},

	_ticksTo1970: (((1970 - 1) * 365 + Math.floor(1970 / 4) - Math.floor(1970 / 100) +
		Math.floor(1970 / 400)) * 24 * 60 * 60 * 10000000),
	_msPerDay: 24 * 60 * 60 * 1000,

	ATOM: 'yyyy-mm-dd', // RFC 3339/ISO 8601
	COOKIE: 'D, dd M yyyy',
	FULL: 'DD, MM d, yyyy',
	ISO_8601: 'yyyy-mm-dd',
	JULIAN: 'J',
	RFC_822: 'D, d M yy',
	RFC_850: 'DD, dd-M-yy',
	RFC_1036: 'D, d M yy',
	RFC_1123: 'D, d M yyyy',
	RFC_2822: 'D, d M yyyy',
	RSS: 'D, d M yy', // RFC 822
	TICKS: '!',
	TIMESTAMP: '@',
	W3C: 'yyyy-mm-dd', // ISO 8601

	/* Format a date object into a string value.
	   The format can be combinations of the following:
	   d  - day of month (no leading zero)
	   dd - day of month (two digit)
	   o  - day of year (no leading zeros)
	   oo - day of year (three digit)
	   D  - day name short
	   DD - day name long
	   w  - week of year (no leading zero)
	   ww - week of year (two digit)
	   m  - month of year (no leading zero)
	   mm - month of year (two digit)
	   M  - month name short
	   MM - month name long
	   yy - year (two digit)
	   yyyy - year (four digit)
	   @  - Unix timestamp (s since 01/01/1970)
	   !  - Windows ticks (100ns since 01/01/0001)
	   '...' - literal text
	   '' - single quote
	   @param  format    (string) the desired format of the date (optional, default datepicker format)
	   @param  date      (Date) the date value to format
	   @param  settings  (object) attributes include:
	                     dayNamesShort    (string[]) abbreviated names of the days from Sunday (optional)
	                     dayNames         (string[]) names of the days from Sunday (optional)
	                     monthNamesShort  (string[]) abbreviated names of the months (optional)
	                     monthNames       (string[]) names of the months (optional)
						 calculateWeek    (function) function that determines week of the year (optional)
	   @return  (string) the date in the above format */
	formatDate: function(format, date, settings) {
		if (typeof format != 'string') {
			settings = date;
			date = format;
			format = '';
		}
		if (!date) {
			return '';
		}
		format = format || this._defaults.dateFormat;
		settings = settings || {};
		var dayNamesShort = settings.dayNamesShort || this._defaults.dayNamesShort;
		var dayNames = settings.dayNames || this._defaults.dayNames;
		var monthNamesShort = settings.monthNamesShort || this._defaults.monthNamesShort;
		var monthNames = settings.monthNames || this._defaults.monthNames;
		var calculateWeek = settings.calculateWeek || this._defaults.calculateWeek;
		// Check whether a format character is doubled
		var doubled = function(match, step) {
			var matches = 1;
			while (iFormat + matches < format.length && format.charAt(iFormat + matches) == match) {
				matches++;
			}
			iFormat += matches - 1;
			return Math.floor(matches / (step || 1)) > 1;
		};
		// Format a number, with leading zeroes if necessary
		var formatNumber = function(match, value, len, step) {
			var num = '' + value;
			if (doubled(match, step)) {
				while (num.length < len) {
					num = '0' + num;
				}
			}
			return num;
		};
		// Format a name, short or long as requested
		var formatName = function(match, value, shortNames, longNames) {
			return (doubled(match) ? longNames[value] : shortNames[value]);
		};
		var output = '';
		var literal = false;
		for (var iFormat = 0; iFormat < format.length; iFormat++) {
			if (literal) {
				if (format.charAt(iFormat) == "'" && !doubled("'")) {
					literal = false;
				}
				else {
					output += format.charAt(iFormat);
				}
			}
			else {
				switch (format.charAt(iFormat)) {
					case 'd': output += formatNumber('d', date.getDate(), 2); break;
					case 'D': output += formatName('D', date.getDay(),
						dayNamesShort, dayNames); break;
					case 'o': output += formatNumber('o', this.dayOfYear(date), 3); break;
					case 'w': output += formatNumber('w', calculateWeek(date), 2); break;
					case 'm': output += formatNumber('m', date.getMonth() + 1, 2); break;
					case 'M': output += formatName('M', date.getMonth(),
						monthNamesShort, monthNames); break;
					case 'y':
						output += (doubled('y', 2) ? date.getFullYear() :
							(date.getFullYear() % 100 < 10 ? '0' : '') + date.getFullYear() % 100);
						break;
					case '@': output += Math.floor(date.getTime() / 1000); break;
					case '!': output += date.getTime() * 10000 + this._ticksTo1970; break;
					case "'":
						if (doubled("'")) {
							output += "'";
						}
						else {
							literal = true;
						}
						break;
					default:
						output += format.charAt(iFormat);
				}
			}
		}
		return output;
	},

	/* Parse a string value into a date object.
	   See formatDate for the possible formats, plus:
	   * - ignore rest of string
	   @param  format    (string) the expected format of the date ('' for default datepicker format)
	   @param  value     (string) the date in the above format
	   @param  settings  (object) attributes include:
	                     shortYearCutoff  (number) the cutoff year for determining the century (optional)
	                     dayNamesShort    (string[]) abbreviated names of the days from Sunday (optional)
	                     dayNames         (string[]) names of the days from Sunday (optional)
	                     monthNamesShort  (string[]) abbreviated names of the months (optional)
	                     monthNames       (string[]) names of the months (optional)
	   @return  (Date) the extracted date value or null if value is blank
	   @throws  errors if the format and/or value are missing,
	            if the value doesn't match the format,
	            or if the date is invalid */
	//MARCS adjusted
	doParseDate: function(format, value, settings) {
	// console.log('doParseDate()');
		if (value == null) {
			throw 'Invalid arguments';
		}
		value = (typeof value == 'object' ? value.toString() : value + '');
		if (value == '') {
			return null;
		}
		format = format || this._defaults.dateFormat;
		settings = settings || {};
		var shortYearCutoff = settings.shortYearCutoff || this._defaults.shortYearCutoff;
		shortYearCutoff = (typeof shortYearCutoff != 'string' ? shortYearCutoff :
			this.today().getFullYear() % 100 + parseInt(shortYearCutoff, 10));
		var dayNamesShort = settings.dayNamesShort || this._defaults.dayNamesShort;
		var dayNames = settings.dayNames || this._defaults.dayNames;
		var monthNamesShort = settings.monthNamesShort || this._defaults.monthNamesShort;
		var monthNames = settings.monthNames || this._defaults.monthNames;
		var year = -1;
		var month = -1;
		var day = -1;
		var doy = -1;
		var shortYear = false;
		var literal = false;
		// Check whether a format character is doubled
		var doubled = function(match, step) {
			var matches = 1;
			while (iFormat + matches < format.length && format.charAt(iFormat + matches) == match) {
				matches++;
			}
			iFormat += matches - 1;
			return Math.floor(matches / (step || 1)) > 1;
		};
		// Extract a number from the string value
		var getNumber = function(match, step) {
			var isDoubled = doubled(match, step);
			var size = [2, 3, isDoubled ? 4 : 2, 11, 20]['oy@!'.indexOf(match) + 1];
			var digits = new RegExp('^-?\\d{1,' + size + '}');
			var num = value.substring(iValue).match(digits);
			if (!num) {
				throw 'Missing number at position {0}'.replace(/\{0\}/, iValue);
			}
			iValue += num[0].length;
			return parseInt(num[0], 10);
		};
		// Extract a name from the string value and convert to an index
		var getName = function(match, shortNames, longNames, step) {
			var names = (doubled(match, step) ? longNames : shortNames);
			for (var i = 0; i < names.length; i++) {
				if (value.substr(iValue, names[i].length).toLowerCase() == names[i].toLowerCase()) {
					iValue += names[i].length;
					return i + 1;
				}
			}
			throw 'Unknown name at position {0}'.replace(/\{0\}/, iValue);
		};
		// Confirm that a literal character matches the string value
		var checkLiteral = function() {
			if (value.charAt(iValue) != format.charAt(iFormat)) {
				throw 'Unexpected literal at position {0}'.replace(/\{0\}/, iValue);
			}
			iValue++;
		};
		var iValue = 0;
		for (var iFormat = 0; iFormat < format.length; iFormat++) {
			if (literal) {
				if (format.charAt(iFormat) == "'" && !doubled("'")) {
					literal = false;
				}
				else {
					checkLiteral();
				}
			}
			else {
				switch (format.charAt(iFormat)) {
					case 'd': day = getNumber('d'); break;
					case 'D': getName('D', dayNamesShort, dayNames); break;
					case 'o': doy = getNumber('o'); break;
					case 'w': getNumber('w'); break;
					case 'm': month = getNumber('m'); break;
					case 'M': month = getName('M', monthNamesShort, monthNames); break;
					case 'y':
						var iSave = iFormat;
						shortYear = !doubled('y', 2);
						iFormat = iSave;
						year = getNumber('y', 2);
						break;
					case '@':
						var date = this._normaliseDate(new Date(getNumber('@') * 1000));
						year = date.getFullYear();
						month = date.getMonth() + 1;
						day = date.getDate();
						break;
					case '!':
						var date = this._normaliseDate(
							new Date((getNumber('!') - this._ticksTo1970) / 10000));
						year = date.getFullYear();
						month = date.getMonth() + 1;
						day = date.getDate();
						break;
					case '*': iValue = value.length; break;
					case "'":
						if (doubled("'")) {
							checkLiteral();
						}
						else {
							literal = true;
						}
						break;
					default: checkLiteral();
				}
			}
		}
		if (iValue < value.length) {
			throw 'Additional text found at end';
		}
		if (year == -1) {
			year = this.today().getFullYear();
		}
		else if (year < 100 && shortYear) {
			year += (shortYearCutoff == -1 ? 1900 : this.today().getFullYear() -
				this.today().getFullYear() % 100 - (year <= shortYearCutoff ? 0 : 100));
		}
		if (doy > -1) {
			month = 1;
			day = doy;
			for (var dim = this.daysInMonth(year, month); day > dim;
					dim = this.daysInMonth(year, month)) {
				month++;
				day -= dim;
			}
		}
		var date = this.newDate(year, month, day);
		if (date.getFullYear() != year || date.getMonth() + 1 != month || date.getDate() != day) {
			throw 'Invalid date';
		}
		return date;
	},

	//MARCS adjusted
	//overrides origin parseDate function
	parseDate: function(format, value, settings) {
	// console.log('parseDate(): format: ');
	// console.log(format);
	// console.log('parseDate: value: ' + value);
	// console.log('parseDate: settings: ' + settings);

      var date;

      function testParse(format, value, settings) {
         if ( !date ) {
           try {
              // console.log('testParse with...');
              // console.log(format);
              // console.log(value);
              // console.log(settings);

              date = plugin.doParseDate(format, value, settings);
              // console.log('NO_ERROR: ' + date);
           } catch (Error) {
              //do nothing
              // console.log('ERROOOOR');
           }
         }else{
            // console.log('date already set:' + date);
         }
      }

      if(format){
         for(var n = 0, stop = format.length; n < stop; n++){
            // console.log('loop parse...format: ' + format[n]);
            testParse(format[n], value, settings);
         }
      }else if(settings){
         for(var n = 0, stop = settings.length; n < stop; n++){
            // console.log('loop parse...settings: ' + settings[n]);
            testParse(format, value, settings[n]);
         }
      }

      // console.log('parseDate Return: date: ');
      // console.log(date);

      return date;
	},

	/* A date may be specified as an exact value or a relative one.
	   @param  dateSpec     (Date or number or string) the date as an object or string
	                        in the given format or an offset - numeric days from today,
	                        or string amounts and periods, e.g. '+1m +2w'
	   @param  defaultDate  (Date) the date to use if no other supplied, may be null
	   @param  currentDate  (Date) the current date as a possible basis for relative dates,
	                        if null today is used (optional)
	   @param  dateFormat   (string) the expected date format - see formatDate above (optional)
	   @param  settings     (object) attributes include:
	                        shortYearCutoff  (number) the cutoff year for determining the century (optional)
	                        dayNamesShort    (string[7]) abbreviated names of the days from Sunday (optional)
	                        dayNames         (string[7]) names of the days from Sunday (optional)
	                        monthNamesShort  (string[12]) abbreviated names of the months (optional)
	                        monthNames       (string[12]) names of the months (optional)
	   @return  (Date) the decoded date */
	determineDate: function(dateSpec, defaultDate, currentDate, dateFormat, settings) {
		if (currentDate && typeof currentDate != 'object') {
			settings = dateFormat;
			dateFormat = currentDate;
			currentDate = null;
		}
		if (typeof dateFormat != 'string') {
			settings = dateFormat;
			dateFormat = '';
		}
		var offsetString = function(offset) {
			try {
				return plugin.parseDate(dateFormat, offset, settings);
			}
			catch (e) {
				// Ignore
			}
			offset = offset.toLowerCase();
			var date = (offset.match(/^c/) && currentDate ? plugin.newDate(currentDate) : null) ||
				plugin.today();
			var pattern = /([+-]?[0-9]+)\s*(d|w|m|y)?/g;
			var matches = null;
			while (matches = pattern.exec(offset)) {
				date = plugin.add(date, parseInt(matches[1], 10), matches[2] || 'd');
			}
			return date;
		};
		defaultDate = (defaultDate ? plugin.newDate(defaultDate) : null);
		dateSpec = (dateSpec == null ? defaultDate :
			(typeof dateSpec == 'string' ? offsetString(dateSpec) : (typeof dateSpec == 'number' ?
			(isNaN(dateSpec) || dateSpec == Infinity || dateSpec == -Infinity ? defaultDate :
			plugin.add(plugin.today(), dateSpec, 'd')) : plugin.newDate(dateSpec))));
		return dateSpec;
	},

	/* Find the number of days in a given month.
	   @param  year   (Date) the date to get days for or
	                  (number) the full year
	   @param  month  (number) the month (1 to 12)
	   @return  (number) the number of days in this month */
	daysInMonth: function(year, month) {
		month = (year.getFullYear ? year.getMonth() + 1 : month);
		year = (year.getFullYear ? year.getFullYear() : year);
		return this.newDate(year, month + 1, 0).getDate();
	},

	/* Calculate the day of the year for a date.
	   @param  year   (Date) the date to get the day-of-year for or
	                  (number) the full year
	   @param  month  (number) the month (1-12)
	   @param  day    (number) the day
	   @return  (number) the day of the year */
	dayOfYear: function(year, month, day) {
		var date = (year.getFullYear ? year : this.newDate(year, month, day));
		var newYear = this.newDate(date.getFullYear(), 1, 1);
		return Math.floor((date.getTime() - newYear.getTime()) / this._msPerDay) + 1;
	},

	/* Set as calculateWeek to determine the week of the year based on the ISO 8601 definition.
	   @param  year   (Date) the date to get the week for or
	                  (number) the full year
	   @param  month  (number) the month (1-12)
	   @param  day    (number) the day
	   @return  (number) the number of the week within the year that contains this date */
	iso8601Week: function(year, month, day) {
		var checkDate = (year.getFullYear ?
			new Date(year.getTime()) : this.newDate(year, month, day));
		// Find Thursday of this week starting on Monday
		checkDate.setDate(checkDate.getDate() + 4 - (checkDate.getDay() || 7));
		var time = checkDate.getTime();
		checkDate.setMonth(0, 1); // Compare with Jan 1
		return Math.floor(Math.round((time - checkDate) / 86400000) / 7) + 1;
	},

	/* Return today's date.
	   @return  (Date) today */
	today: function() {
		return this._normaliseDate(new Date());
	},

	/* Return a new date.
	   @param  year   (Date) the date to clone or
					  (number) the year
	   @param  month  (number) the month (1-12)
	   @param  day    (number) the day
	   @return  (Date) the date */
	newDate: function(year, month, day) {
		return (!year ? null : (year.getFullYear ? this._normaliseDate(new Date(year.getTime())) :
			new Date(year, month - 1, day, 12)));
	},

	/* Standardise a date into a common format - time portion is 12 noon.
	   @param  date  (Date) the date to standardise
	   @return  (Date) the normalised date */
	_normaliseDate: function(date) {
		if (date) {
			date.setHours(12, 0, 0, 0);
		}
		return date;
	},

	/* Set the year for a date.
	   @param  date  (Date) the original date
	   @param  year  (number) the new year
	   @return  the updated date */
	year: function(date, year) {
		date.setFullYear(year);
		return this._normaliseDate(date);
	},

	/* Set the month for a date.
	   @param  date   (Date) the original date
	   @param  month  (number) the new month (1-12)
	   @return  the updated date */
	month: function(date, month) {
		date.setMonth(month - 1);
		return this._normaliseDate(date);
	},

	/* Set the day for a date.
	   @param  date  (Date) the original date
	   @param  day   (number) the new day of the month
	   @return  the updated date */
	day: function(date, day) {
		date.setDate(day);
		return this._normaliseDate(date);
	},

	/* Add a number of periods to a date.
	   @param  date    (Date) the original date
	   @param  amount  (number) the number of periods
	   @param  period  (string) the type of period d/w/m/y
	   @return  the updated date */
	add: function(date, amount, period) {
		if (period == 'd' || period == 'w') {
			this._normaliseDate(date);
			date.setDate(date.getDate() + amount * (period == 'w' ? 7 : 1));
		}
		else {
			var year = date.getFullYear() + (period == 'y' ? amount : 0);
			var month = date.getMonth() + (period == 'm' ? amount : 0);
			date.setTime(plugin.newDate(year, month + 1,
				Math.min(date.getDate(), this.daysInMonth(year, month + 1))).getTime());
		}
		return date;
	},

	/* Apply the months offset value to a date.
	   @param  date  (Date) the original date
	   @param  inst  (object) the current instance settings
	   @return  (Date) the updated date */
	_applyMonthsOffset: function(date, inst) {
		var monthsOffset = inst.options.monthsOffset;
		if ($.isFunction(monthsOffset)) {
			monthsOffset = monthsOffset.apply(inst.target[0], [date]);
		}
		return plugin.add(date, -monthsOffset, 'm');
	},

	/* Attach the datepicker functionality to an input field.
	   @param  target   (element) the control to affect
	   @param  options  (object) the custom options for this instance */
	_attachPlugin: function(target, options) {
		target = $(target);
		if (target.hasClass(this.markerClassName)) {
			return;
		}
		var inlineSettings = ($.fn.metadata ? target.metadata() : {});
		var inst = {options: $.extend({}, this._defaults, inlineSettings, options),
			target: target, selectedDates: [], drawDate: null, pickingRange: false,
			inline: ($.inArray(target[0].nodeName.toLowerCase(), ['div', 'span']) > -1),
			get: function(name) { // Get a setting value, computing if necessary
				if ($.inArray(name, ['defaultDate', 'minDate', 'maxDate']) > -1) { // Decode date settings
					return plugin.determineDate(this.options[name], null,
						this.selectedDates[0], this.options.dateFormat, inst.getConfig());
				}
				return this.options[name];
			},
			curMinDate: function() {
				return (this.pickingRange ? this.selectedDates[0] : this.get('minDate'));
			},
			getConfig: function() {
				return {dayNamesShort: this.options.dayNamesShort, dayNames: this.options.dayNames,
					monthNamesShort: this.options.monthNamesShort, monthNames: this.options.monthNames,
					calculateWeek: this.options.calculateWeek,
					shortYearCutoff: this.options.shortYearCutoff};
			}
		};
		target.addClass(this.markerClassName).data(this.propertyName, inst);
		if (inst.inline) {
			inst.drawDate = plugin._checkMinMax(plugin.newDate(inst.selectedDates[0] ||
				inst.get('defaultDate') || plugin.today()), inst);
			inst.prevDate = plugin.newDate(inst.drawDate);
			this._update(target[0]);
			if ($.fn.mousewheel) {
				target.mousewheel(this._doMouseWheel);
			}
		}
		else {
			this._attachments(target, inst);
			target.bind('keydown.' + this.propertyName, this._keyDown).
				bind('keypress.' + this.propertyName, this._keyPress).
				bind('keyup.' + this.propertyName, this._keyUp);
			if (target.attr('disabled')) {
				this._disablePlugin(target[0]);
			}
		}
	},

	/* Retrieve or reconfigure the settings for a control.
	   @param  target   (element) the control to affect
	   @param  options  (object) the new options for this instance or
	                    (string) an individual property name
	   @param  value    (any) the individual property value (omit if options
	                    is an object or to retrieve the value of a setting)
	   @return  (any) if retrieving a value */
	_optionPlugin: function(target, options, value) {
		target = $(target);
		var inst = target.data(this.propertyName);
		if (!options || (typeof options == 'string' && value == null)) { // Get option
			var name = options;
			options = (inst || {}).options;
			return (options && name ? options[name] : options);
		}

		if (!target.hasClass(this.markerClassName)) {
			return;
		}
		options = options || {};
		if (typeof options == 'string') {
			var name = options;
			options = {};
			options[name] = value;
		}
		if (options.calendar && options.calendar != inst.options.calendar) {
			var discardDate = function(name) {
				return (typeof inst.options[name] == 'object' ? null : inst.options[name]);
			};
			options = $.extend({defaultDate: discardDate('defaultDate'),
				minDate: discardDate('minDate'), maxDate: discardDate('maxDate')}, options);
			inst.selectedDates = [];
			inst.drawDate = null;
		}
		var dates = inst.selectedDates;
		$.extend(inst.options, options);
		this._setDatePlugin(target[0], dates, null, false, true);
		inst.pickingRange = false;
		inst.drawDate = plugin.newDate(this._checkMinMax(
			(inst.options.defaultDate ? inst.get('defaultDate') : inst.drawDate) ||
			inst.get('defaultDate') || plugin.today(), inst));
		if (!inst.inline) {
			this._attachments(target, inst);
		}
		if (inst.inline || inst.div) {
			this._update(target[0]);
		}
	},

	/* Attach events and trigger, if necessary.
	   @param  target  (jQuery) the control to affect
	   @param  inst    (object) the current instance settings */
	_attachments: function(target, inst) {
		target.unbind('focus.' + this.propertyName);
		if (inst.options.showOnFocus) {
			target.bind('focus.' + this.propertyName, this._showPlugin);
		}
		if (inst.trigger) {
			inst.trigger.remove();
		}
		var trigger = inst.options.showTrigger;
		inst.trigger = (!trigger ? $([]) :
			$(trigger).clone().removeAttr('id').addClass(this._triggerClass)
				[inst.options.isRTL ? 'insertBefore' : 'insertAfter'](target).
				click(function() {
					if (!plugin._isDisabledPlugin(target[0])) {
						plugin[plugin.curInst == inst ? '_hidePlugin' : '_showPlugin'](target[0]);
					}
				}));
		this._autoSize(target, inst);
		var dates = this._extractDates(inst, target.val());
		if (dates) {
			this._setDatePlugin(target[0], dates, null, true);
		}
		var defaultDate = inst.get('defaultDate');
		if (inst.options.selectDefaultDate && defaultDate && inst.selectedDates.length == 0) {
			this._setDatePlugin(target[0], plugin.newDate(defaultDate || plugin.today()));
		}
	},

	/* Apply the maximum length for the date format.
	   @param  inst  (object) the current instance settings */
	_autoSize: function(target, inst) {
		if (inst.options.autoSize && !inst.inline) {
			var date = plugin.newDate(2009, 10, 20); // Ensure double digits
			var dateFormat = inst.options.dateFormat;
			//MARCS ADJUSTED
			if(typeof dateFormat == 'string'){
				if (dateFormat.match(/[DM]/)) {
					var findMax = function(names) {
						var max = 0;
						var maxI = 0;
						for (var i = 0; i < names.length; i++) {
							if (names[i].length > max) {
								max = names[i].length;
								maxI = i;
							}
						}
						return maxI;
					};
					date.setMonth(findMax(inst.options[dateFormat.match(/MM/) ? // Longest month
						'monthNames' : 'monthNamesShort']));
					date.setDate(findMax(inst.options[dateFormat.match(/DD/) ? // Longest day
						'dayNames' : 'dayNamesShort']) + 20 - date.getDay());
				}
				inst.target.attr('size', plugin.formatDate(dateFormat, date, inst.getConfig()).length);
			} else {
				// when default date can be chosen then change here back
				// var maxDf = 0;
				var idxDf = 0;
				// for(var df = 0; df < dateFormat.length; df++){
				// 	if(dateFormat[df].length > maxDf){
				// 		maxDf = dateFormat[df].length;
				// 		idxDf = df;
				// 	}
				// }
				if (dateFormat[idxDf].match(/[DM]/)) {
					var findMax = function(names) {
						var max = 0;
						var maxI = 0;
						for (var i = 0; i < names.length; i++) {
							if (names[i].length > max) {
								max = names[i].length;
								maxI = i;
							}
						}
						return maxI;
					};
					date.setMonth(findMax(inst.options[dateFormat[idxDf].match(/MM/) ? // Longest month
						'monthNames' : 'monthNamesShort']));
					date.setDate(findMax(inst.options[dateFormat[idxDf].match(/DD/) ? // Longest day
						'dayNames' : 'dayNamesShort']) + 20 - date.getDay());
				}
				inst.target.attr('size', plugin.formatDate(dateFormat[idxDf], date, inst.getConfig()).length);
			}
		}
	},

	/* Remove the datepicker functionality from a control.
	   @param  target  (element) the control to affect */
	_destroyPlugin: function(target) {
		target = $(target);
		if (!target.hasClass(this.markerClassName)) {
			return;
		}
		var inst = target.data(this.propertyName);
		if (inst.trigger) {
			inst.trigger.remove();
		}
		target.removeClass(this.markerClassName).removeData(this.propertyName).
			empty().unbind('.' + this.propertyName);
		if (inst.inline && $.fn.mousewheel) {
			target.unmousewheel();
		}
		if (!inst.inline && inst.options.autoSize) {
			target.removeAttr('size');
		}
	},

	/* Apply multiple event functions.
	   Usage, for example: onShow: multipleEvents(fn1, fn2, ...)
	   @param  fns  (function...) the functions to apply */
	multipleEvents: function(fns) {
		var funcs = arguments;
		return function(args) {
			for (var i = 0; i < funcs.length; i++) {
				funcs[i].apply(this, arguments);
			}
		};
	},

	/* Enable the control.
	   @param  target  (element) the control to affect */
	_enablePlugin: function(target) {
		target = $(target);
		if (!target.hasClass(this.markerClassName)) {
			return;
		}
		var inst = target.data(this.propertyName);
		if (inst.inline) {
			target.children('.' + this._disableClass).remove().end().
				find('button,select').removeAttr('disabled').end().
				find('a').attr('href', 'javascript:void(0)');
		}
		else {
			target.prop('disabled', false);
			inst.trigger.filter('button.' + this._triggerClass).
				removeAttr('disabled').end().
				filter('img.' + this._triggerClass).
				css({opacity: '1.0', cursor: ''});
		}
		this._disabled = $.map(this._disabled,
			function(value) { return (value == target[0] ? null : value); }); // Delete entry
	},

	/* Disable the control.
	   @param  target  (element) the control to affect */
	_disablePlugin: function(target) {
		target = $(target);
		if (!target.hasClass(this.markerClassName)) {
			return;
		}
		var inst = target.data(this.propertyName);
		if (inst.inline) {
			var inline = target.children(':last');
			var offset = inline.offset();
			var relOffset = {left: 0, top: 0};
			inline.parents().each(function() {
				if ($(this).css('position') == 'relative') {
					relOffset = $(this).offset();
					return false;
				}
			});
			var zIndex = target.css('zIndex');
			zIndex = (zIndex == 'auto' ? 0 : parseInt(zIndex, 10)) + 1;
			target.prepend('<div class="' + this._disableClass + '" style="' +
				'width: ' + inline.outerWidth() + 'px; height: ' + inline.outerHeight() +
				'px; left: ' + (offset.left - relOffset.left) + 'px; top: ' +
				(offset.top - relOffset.top) + 'px; z-index: ' + zIndex + '"></div>').
				find('button,select').attr('disabled', 'disabled').end().
				find('a').removeAttr('href');
		}
		else {
			target.prop('disabled', true);
			inst.trigger.filter('button.' + this._triggerClass).
				attr('disabled', 'disabled').end().
				filter('img.' + this._triggerClass).
				css({opacity: '0.5', cursor: 'default'});
		}
		this._disabled = $.map(this._disabled,
			function(value) { return (value == target[0] ? null : value); }); // Delete entry
		this._disabled.push(target[0]);
	},

	/* Is the first field in a jQuery collection disabled as a datepicker?
	   @param  target  (element) the control to examine
	   @return  (boolean) true if disabled, false if enabled */
	_isDisabledPlugin: function(target) {
		return (target && $.inArray(target, this._disabled) > -1);
	},

	/* Show a popup datepicker.
	   @param  target  (event) a focus event or
	                   (element) the control to use */
	_showPlugin: function(target) {
		target = $(target.target || target);
		var inst = target.data(plugin.propertyName);
		if (plugin.curInst == inst) {
			return;
		}
		if (plugin.curInst) {
			plugin._hidePlugin(plugin.curInst, true);
		}
		if (inst) {
			// Retrieve existing date(s)
			inst.lastVal = null;
			inst.selectedDates = plugin._extractDates(inst, target.val());
			inst.pickingRange = false;
			inst.drawDate = plugin._checkMinMax(plugin.newDate(inst.selectedDates[0] ||
				inst.get('defaultDate') || plugin.today()), inst);
			inst.prevDate = plugin.newDate(inst.drawDate);
			plugin.curInst = inst;
			// Generate content
			plugin._update(target[0], true);
			// Adjust position before showing
			var offset = plugin._checkOffset(inst);
			inst.div.css({left: offset.left, top: offset.top});
			// And display
			var showAnim = inst.options.showAnim;
			var showSpeed = inst.options.showSpeed;
			showSpeed = (showSpeed == 'normal' && $.ui && $.ui.version >= '1.8' ?
				'_default' : showSpeed);
			if ($.effects && $.effects[showAnim]) {
				var data = inst.div.data(); // Update old effects data
				for (var key in data) {
					if (key.match(/^ec\.storage\./)) {
						data[key] = inst._mainDiv.css(key.replace(/ec\.storage\./, ''));
					}
				}
				inst.div.data(data).show(showAnim, inst.options.showOptions, showSpeed);
			}
			else {
				inst.div[showAnim || 'show']((showAnim ? showSpeed : ''));
			}
		}
	},

	/* Extract possible dates from a string.
	   @param  inst  (object) the current instance settings
	   @param  text  (string) the text to extract from
	   @return  (CDate[]) the extracted dates */
	_extractDates: function(inst, datesText) {
		if (datesText == inst.lastVal) {
			return;
		}
		inst.lastVal = datesText;
		datesText = datesText.split(inst.options.multiSelect ? inst.options.multiSeparator :
			(inst.options.rangeSelect ? inst.options.rangeSeparator : '\x00'));
		var dates = [];
		for (var i = 0; i < datesText.length; i++) {
			try {
				var date = plugin.parseDate(inst.options.dateFormat, datesText[i], inst.getConfig());
				if (date) {
					var found = false;
					for (var j = 0; j < dates.length; j++) {
						if (dates[j].getTime() == date.getTime()) {
							found = true;
							break;
						}
					}
					if (!found) {
						dates.push(date);
					}
				}
			}
			catch (e) {
				// Ignore
			}
		}
		dates.splice(inst.options.multiSelect || (inst.options.rangeSelect ? 2 : 1), dates.length);
		if (inst.options.rangeSelect && dates.length == 1) {
			dates[1] = dates[0];
		}
		return dates;
	},

	/* Update the datepicker display.
	   @param  target  (event) a focus event or
	                   (element) the control to use
	   @param  hidden  (boolean) true to initially hide the datepicker */
	_update: function(target, hidden) {
		target = $(target.target || target);
		var inst = target.data(plugin.propertyName);
		if (inst) {
			if (inst.inline || plugin.curInst == inst) {
				if ($.isFunction(inst.options.onChangeMonthYear) && (!inst.prevDate ||
						inst.prevDate.getFullYear() != inst.drawDate.getFullYear() ||
						inst.prevDate.getMonth() != inst.drawDate.getMonth())) {
					inst.options.onChangeMonthYear.apply(target[0],
						[inst.drawDate.getFullYear(), inst.drawDate.getMonth() + 1]);
				}
			}
			if (inst.inline) {
				target.html(this._generateContent(target[0], inst));
			}
			else if (plugin.curInst == inst) {
				if (!inst.div) {
					inst.div = $('<div></div>').addClass(this._popupClass).
						css({display: (hidden ? 'none' : 'static'), position: 'absolute',
							left: target.offset().left,
							top: target.offset().top + target.outerHeight()}).
						appendTo($(inst.options.popupContainer || 'body'));
					if ($.fn.mousewheel) {
						inst.div.mousewheel(this._doMouseWheel);
					}
				}
				inst.div.html(this._generateContent(target[0], inst));
				//MARCS adjusted: fix "double" click necessary in datepicker with inputfield onblur
				//target.focus();
			}
		}
	},

	/* Update the input field and any alternate field with the current dates.
	   @param  target  (element) the control to use
	   @param  keyUp   (boolean, internal) true if coming from keyUp processing */
	_updateInput: function(target, keyUp) {
		var inst = $.data(target, this.propertyName);
		if (inst) {
			var value = '';
			var altValue = '';
			var sep = (inst.options.multiSelect ? inst.options.multiSeparator :
				inst.options.rangeSeparator);
			var altFormat = inst.options.altFormat || inst.options.dateFormat;

			//MARCS adjusted
			if(typeof inst.options.dateFormat  == 'string'){
				// console.log('_updateInput: IS_STRING');
				for (var i = 0; i < inst.selectedDates.length; i++) {
					value += (keyUp ? '' : (i > 0 ? sep : '') + plugin.formatDate(
						inst.options.dateFormat, inst.selectedDates[i], inst.getConfig()));
					altValue += (i > 0 ? sep : '') + plugin.formatDate(
						altFormat, inst.selectedDates[i], inst.getConfig());
				}
			} else {
				// console.log('_updateInput: IS_ARRAY');
				for (var i = 0; i < inst.selectedDates.length; i++) {
					value += (keyUp ? '' : (i > 0 ? sep : '') + plugin.formatDate(
						inst.options.dateFormat[0], inst.selectedDates[i], inst.getConfig()));
					altValue += (i > 0 ? sep : '') + plugin.formatDate(
						altFormat, inst.selectedDates[i], inst.getConfig());
				}
			}
			if (!inst.inline && !keyUp) {
				$(target).val(value);
			}
			$(inst.options.altField).val(altValue);
			if ($.isFunction(inst.options.onSelect) && !keyUp && !inst.inSelect) {
				inst.inSelect = true; // Prevent endless loops
				inst.options.onSelect.apply(target, [inst.selectedDates]);
				inst.inSelect = false;
			}
		}
	},

	/* Retrieve the size of left and top borders for an element.
	   @param  elem  (jQuery) the element of interest
	   @return  (number[2]) the left and top borders */
	_getBorders: function(elem) {
		var convert = function(value) {
			return {thin: 1, medium: 3, thick: 5}[value] || value;
		};
		return [parseFloat(convert(elem.css('border-left-width'))),
			parseFloat(convert(elem.css('border-top-width')))];
	},

	/* Check positioning to remain on the screen.
	   @param  inst  (object) the current instance settings
	   @return  (object) the updated offset for the datepicker */
	_checkOffset: function(inst) {
		var base = (inst.target.is(':hidden') && inst.trigger ? inst.trigger : inst.target);
		var offset = base.offset();
		var browserWidth = $(window).width();
		var browserHeight = $(window).height();
		if (browserWidth == 0) {
			return offset;
		}
		var isFixed = false;
		$(inst.target).parents().each(function() {
			isFixed |= $(this).css('position') == 'fixed';
			return !isFixed;
		});
		var scrollX = document.documentElement.scrollLeft || document.body.scrollLeft;
		var scrollY = document.documentElement.scrollTop || document.body.scrollTop;
		var above = offset.top - (isFixed ? scrollY : 0) - inst.div.outerHeight();
		var below = offset.top - (isFixed ? scrollY : 0) + base.outerHeight();
		var alignL = offset.left - (isFixed ? scrollX : 0);
		var alignR = offset.left - (isFixed ? scrollX : 0) + base.outerWidth() - inst.div.outerWidth();
		var tooWide = (offset.left - scrollX + inst.div.outerWidth()) > browserWidth;
		var tooHigh = (offset.top - scrollY + inst.target.outerHeight() +
			inst.div.outerHeight()) > browserHeight;
		inst.div.css('position', isFixed ? 'fixed' : 'absolute');
		var alignment = inst.options.alignment;
		if (alignment == 'topLeft') {
			offset = {left: alignL, top: above};
		}
		else if (alignment == 'topRight') {
			offset = {left: alignR, top: above};
		}
		else if (alignment == 'bottomLeft') {
			offset = {left: alignL, top: below};
		}
		else if (alignment == 'bottomRight') {
			offset = {left: alignR, top: below};
		}
		else if (alignment == 'top') {
			offset = {left: (inst.options.isRTL || tooWide ? alignR : alignL), top: above};
		}
		else { // bottom
			offset = {left: (inst.options.isRTL || tooWide ? alignR : alignL),
				top: (tooHigh ? above : below)};
		}
		offset.left = Math.max((isFixed ? 0 : scrollX), offset.left);
		offset.top = Math.max((isFixed ? 0 : scrollY), offset.top);
		return offset;
	},

	/* Close date picker if clicked elsewhere.
	   @param  event  (MouseEvent) the mouse click to check */
	_checkExternalClick: function(event) {
		if (!plugin.curInst) {
			return;
		}
		var target = $(event.target);
		if (!target.parents().andSelf().hasClass(plugin._popupClass) &&
				!target.hasClass(plugin.markerClassName) &&
				!target.parents().andSelf().hasClass(plugin._triggerClass)) {
			plugin._hidePlugin(plugin.curInst);
		}
	},

	/* Hide a popup datepicker.
	   @param  target     (element) the control to use or
	                      (object) the current instance settings
	   @param  immediate  (boolean) true to close immediately without animation */
	_hidePlugin: function(target, immediate) {
		if (!target) {
			return;
		}
		var inst = $.data(target, this.propertyName) || target;
		if (inst && inst == plugin.curInst) {
			var showAnim = (immediate ? '' : inst.options.showAnim);
			var showSpeed = inst.options.showSpeed;
			showSpeed = (showSpeed == 'normal' && $.ui && $.ui.version >= '1.8' ?
				'_default' : showSpeed);
			var postProcess = function() {
				if (!inst.div) {
					return;
				}
				inst.div.remove();
				inst.div = null;
				plugin.curInst = null;
				if ($.isFunction(inst.options.onClose)) {
					inst.options.onClose.apply(target, [inst.selectedDates]);
				}
			};
			inst.div.stop();
			if ($.effects && $.effects[showAnim]) {
				inst.div.hide(showAnim, inst.options.showOptions, showSpeed, postProcess);
			}
			else {
				var hideAnim = (showAnim == 'slideDown' ? 'slideUp' :
					(showAnim == 'fadeIn' ? 'fadeOut' : 'hide'));
				inst.div[hideAnim]((showAnim ? showSpeed : ''), postProcess);
			}
			if (!showAnim) {
				postProcess();
			}
		}
	},

	/* Handle keystrokes in the datepicker.
	   @param  event  (KeyEvent) the keystroke
	   @return  (boolean) true if not handled, false if handled */
	_keyDown: function(event) {
		var target = event.target;
		var inst = $.data(target, plugin.propertyName);
		var handled = false;
		if (inst.div) {
			if (event.keyCode == 9) { // Tab - close
				plugin._hidePlugin(target);
			}
			else if (event.keyCode == 13) { // Enter - select
				plugin._selectDatePlugin(target,
					$('a.' + inst.options.renderer.highlightedClass, inst.div)[0]);
				handled = true;
			}
			else { // Command keystrokes
				var commands = inst.options.commands;
				for (var name in commands) {
					var command = commands[name];
					if (command.keystroke.keyCode == event.keyCode &&
							!!command.keystroke.ctrlKey == !!(event.ctrlKey || event.metaKey) &&
							!!command.keystroke.altKey == event.altKey &&
							!!command.keystroke.shiftKey == event.shiftKey) {
						plugin._performActionPlugin(target, name);
						handled = true;
						break;
					}
				}
			}
		}
		else { // Show on 'current' keystroke
			var command = inst.options.commands.current;
			if (command.keystroke.keyCode == event.keyCode &&
					!!command.keystroke.ctrlKey == !!(event.ctrlKey || event.metaKey) &&
					!!command.keystroke.altKey == event.altKey &&
					!!command.keystroke.shiftKey == event.shiftKey) {
				plugin._showPlugin(target);
				handled = true;
			}
		}
		inst.ctrlKey = ((event.keyCode < 48 && event.keyCode != 32) ||
			event.ctrlKey || event.metaKey);
		if (handled) {
			event.preventDefault();
			event.stopPropagation();
		}
		return !handled;
	},

	/* Filter keystrokes in the datepicker.
	   @param  event  (KeyEvent) the keystroke
	   @return  (boolean) true if allowed, false if not allowed */
	_keyPress: function(event) {
		var inst = $.data(event.target, plugin.propertyName);
		if (inst && inst.options.constrainInput) {
			var ch = String.fromCharCode(event.keyCode || event.charCode);
			var allowedChars = plugin._allowedChars(inst);
			return (event.metaKey || inst.ctrlKey || ch < ' ' ||
				!allowedChars || allowedChars.indexOf(ch) > -1);
		}
		return true;
	},

	/* Determine the set of characters allowed by the date format.
	   @param  inst  (object) the current instance settings
	   @return  (string) the set of allowed characters, or null if anything allowed */
	_allowedChars: function(inst) {
		var allowedChars = (inst.options.multiSelect ? inst.options.multiSeparator :
			(inst.options.rangeSelect ? inst.options.rangeSeparator : ''));
		var literal = false;
		var hasNum = false;
		var dateFormat = inst.options.dateFormat;

		//MARCS adjusted
		if(typeof dateFormat  == 'string'){
			// console.log('_allowedChars IS_STRING');
			for (var i = 0; i < dateFormat.length; i++) {
				var ch = dateFormat.charAt(i);
				if (literal) {
					if (ch == "'" && dateFormat.charAt(i + 1) != "'") {
						literal = false;
					}
					else {
						allowedChars += ch;
					}
				}
				else {
					switch (ch) {
						case 'd': case 'm': case 'o': case 'w':
							allowedChars += (hasNum ? '' : '0123456789'); hasNum = true; break;
						case 'y': case '@': case '!':
							allowedChars += (hasNum ? '' : '0123456789') + '-'; hasNum = true; break;
						case 'J':
							allowedChars += (hasNum ? '' : '0123456789') + '-.'; hasNum = true; break;
						case 'D': case 'M': case 'Y':
							return null; // Accept anything
						case "'":
							if (dateFormat.charAt(i + 1) == "'") {
								allowedChars += "'";
							}
							else {
								literal = true;
							}
							break;
						default:
							allowedChars += ch;
					}
				}
			}
		} else {
			// console.log('_allowedChars IS_ARRAY');
			for (var fi = 0; fi < dateFormat.length; fi++) {
				for (var i = 0; i < dateFormat[fi].length; i++) {
					var ch = dateFormat[fi].charAt(i);
					if (literal) {
						if (ch == "'" && dateFormat[fi].charAt(i + 1) != "'") {
							literal = false;
						}
						else {
							allowedChars += ch;
						}
					}
					else {
						switch (ch) {
							case 'd': case 'm': case 'o': case 'w':
								allowedChars += (hasNum ? '' : '0123456789'); hasNum = true; break;
							case 'y': case '@': case '!':
								allowedChars += (hasNum ? '' : '0123456789') + '-'; hasNum = true; break;
							case 'J':
								allowedChars += (hasNum ? '' : '0123456789') + '-.'; hasNum = true; break;
							case 'D': case 'M': case 'Y':
								return null; // Accept anything
							case "'":
								if (dateFormat[fi].charAt(i + 1) == "'") {
									allowedChars += "'";
								}
								else {
									literal = true;
								}
								break;
							default:
								allowedChars += ch;
						}
					}
				}
			}
		}
		//console.log('_allowedChars: ' + allowedChars);
		return allowedChars;
	},

	/* Synchronise datepicker with the field.
	   @param  event  (KeyEvent) the keystroke
	   @return  (boolean) true if allowed, false if not allowed */
	_keyUp: function(event) {
		var target = event.target;
		var inst = $.data(target, plugin.propertyName);
		if (inst && !inst.ctrlKey && inst.lastVal != inst.target.val()) {
			try {
				var dates = plugin._extractDates(inst, inst.target.val());
				if (dates.length > 0) {
					plugin._setDatePlugin(target, dates, null, true);
				}
			}
			catch (event) {
				// Ignore
			}
		}
		return true;
	},

	/* Increment/decrement month/year on mouse wheel activity.
	   @param  event  (event) the mouse wheel event
	   @param  delta  (number) the amount of change */
	_doMouseWheel: function(event, delta) {
		var target = (plugin.curInst && plugin.curInst.target[0]) ||
			$(event.target).closest('.' + plugin.markerClassName)[0];
		if (plugin._isDisabledPlugin(target)) {
			return;
		}
		var inst = $.data(target, plugin.propertyName);
		if (inst.options.useMouseWheel) {
			delta = (delta < 0 ? -1 : +1);
			plugin._changeMonthPlugin(target,
				-inst.options[event.ctrlKey ? 'monthsToJump' : 'monthsToStep'] * delta);
		}
		event.preventDefault();
	},

	/* Clear an input and close a popup datepicker.
	   @param  target  (element) the control to use */
	_clearPlugin: function(target) {
		var inst = $.data(target, this.propertyName);
		if (inst) {
			inst.selectedDates = [];
			this._hidePlugin(target);
			var defaultDate = inst.get('defaultDate');
			if (inst.options.selectDefaultDate && defaultDate) {
				this._setDatePlugin(target, plugin.newDate(defaultDate || plugin.today()));
			}
			else {
				this._updateInput(target);
			}
		}
	},

	/* Retrieve the selected date(s) for a datepicker.
	   @param  target  (element) the control to examine
	   @return  (CDate[]) the selected date(s) */
	_getDatePlugin: function(target) {
		var inst = $.data(target, this.propertyName);
		return (inst ? inst.selectedDates : []);
	},

	/* Set the selected date(s) for a datepicker.
	   @param  target   (element) the control to examine
	   @param  dates    (CDate or number or string or [] of these) the selected date(s)
	   @param  endDate  (CDate or number or string) the ending date for a range (optional)
	   @param  keyUp    (boolean, internal) true if coming from keyUp processing
	   @param  setOpt   (boolean, internal) true if coming from option processing */
	_setDatePlugin: function(target, dates, endDate, keyUp, setOpt) {
		var inst = $.data(target, this.propertyName);
		if (inst) {
			if (!$.isArray(dates)) {
				dates = [dates];
				if (endDate) {
					dates.push(endDate);
				}
			}
			var minDate = inst.get('minDate');
			var maxDate = inst.get('maxDate');
			var curDate = inst.selectedDates[0];
			inst.selectedDates = [];
			for (var i = 0; i < dates.length; i++) {
				var date = plugin.determineDate(
					dates[i], null, curDate, inst.options.dateFormat, inst.getConfig());
				if (date) {
					if ((!minDate || date.getTime() >= minDate.getTime()) &&
							(!maxDate || date.getTime() <= maxDate.getTime())) {
						var found = false;
						for (var j = 0; j < inst.selectedDates.length; j++) {
							if (inst.selectedDates[j].getTime() == date.getTime()) {
								found = true;
								break;
							}
						}
						if (!found) {
							inst.selectedDates.push(date);
						}
					}
				}
			}
			inst.selectedDates.splice(inst.options.multiSelect ||
				(inst.options.rangeSelect ? 2 : 1), inst.selectedDates.length);
			if (inst.options.rangeSelect) {
				switch (inst.selectedDates.length) {
					case 1: inst.selectedDates[1] = inst.selectedDates[0]; break;
					case 2: inst.selectedDates[1] =
						(inst.selectedDates[0].getTime() > inst.selectedDates[1].getTime() ?
						inst.selectedDates[0] : inst.selectedDates[1]); break;
				}
				inst.pickingRange = false;
			}
			inst.prevDate = (inst.drawDate ? plugin.newDate(inst.drawDate) : null);
			inst.drawDate = this._checkMinMax(plugin.newDate(inst.selectedDates[0] ||
				inst.get('defaultDate') || plugin.today()), inst);
			if (!setOpt) {
				this._update(target);
				this._updateInput(target, keyUp);
			}
		}
	},

	/* Determine whether a date is selectable for this datepicker.
	   @param  target  (element) the control to check
	   @param  date    (Date or string or number) the date to check
	   @return  (boolean) true if selectable, false if not */
	_isSelectablePlugin: function(target, date) {
		var inst = $.data(target, this.propertyName);
		if (!inst) {
			return false;
		}
		date = plugin.determineDate(date, inst.selectedDates[0] || this.today(), null,
			inst.options.dateFormat, inst.getConfig());
		return this._isSelectable(target, date, inst.options.onDate,
			inst.get('minDate'), inst.get('maxDate'));
	},

	/* Internally determine whether a date is selectable for this datepicker.
	   @param  target   (element) the control to check
	   @param  date     (Date) the date to check
	   @param  onDate   (function or boolean) any onDate callback or callback.selectable
	   @param  mindate  (Date) the minimum allowed date
	   @param  maxdate  (Date) the maximum allowed date
	   @return  (boolean) true if selectable, false if not */
	_isSelectable: function(target, date, onDate, minDate, maxDate) {
		var dateInfo = (typeof onDate == 'boolean' ? {selectable: onDate} :
			(!$.isFunction(onDate) ? {} : onDate.apply(target, [date, true])));
		return (dateInfo.selectable != false) &&
			(!minDate || date.getTime() >= minDate.getTime()) &&
			(!maxDate || date.getTime() <= maxDate.getTime());
	},

	/* Perform a named action for a datepicker.
	   @param  target  (element) the control to affect
	   @param  action  (string) the name of the action */
	_performActionPlugin: function(target, action) {
		var inst = $.data(target, this.propertyName);
		if (inst && !this._isDisabledPlugin(target)) {
			var commands = inst.options.commands;
			if (commands[action] && commands[action].enabled.apply(target, [inst])) {
				commands[action].action.apply(target, [inst]);
			}
		}
	},

	/* Set the currently shown month, defaulting to today's.
	   @param  target  (element) the control to affect
	   @param  year    (number) the year to show (optional)
	   @param  month   (number) the month to show (1-12) (optional)
	   @param  day     (number) the day to show (optional) */
	_showMonthPlugin: function(target, year, month, day) {
		var inst = $.data(target, this.propertyName);
		if (inst && (day != null ||
				(inst.drawDate.getFullYear() != year || inst.drawDate.getMonth() + 1 != month))) {
			inst.prevDate = plugin.newDate(inst.drawDate);
			var show = this._checkMinMax((year != null ?
				plugin.newDate(year, month, 1) : plugin.today()), inst);
			inst.drawDate = plugin.newDate(show.getFullYear(), show.getMonth() + 1,
				(day != null ? day : Math.min(inst.drawDate.getDate(),
				plugin.daysInMonth(show.getFullYear(), show.getMonth() + 1))));
			this._update(target);
		}
	},

	/* Adjust the currently shown month.
	   @param  target  (element) the control to affect
	   @param  offset  (number) the number of months to change by */
	_changeMonthPlugin: function(target, offset) {
		var inst = $.data(target, this.propertyName);
		if (inst) {
			var date = plugin.add(plugin.newDate(inst.drawDate), offset, 'm');
			this._showMonthPlugin(target, date.getFullYear(), date.getMonth() + 1);
		}
	},

	/* Adjust the currently shown day.
	   @param  target  (element) the control to affect
	   @param  offset  (number) the number of days to change by */
	_changeDayPlugin: function(target, offset) {
		var inst = $.data(target, this.propertyName);
		if (inst) {
			var date = plugin.add(plugin.newDate(inst.drawDate), offset, 'd');
			this._showMonthPlugin(target, date.getFullYear(), date.getMonth() + 1, date.getDate());
		}
	},

	/* Restrict a date to the minimum/maximum specified.
	   @param  date  (CDate) the date to check
	   @param  inst  (object) the current instance settings */
	_checkMinMax: function(date, inst) {
		var minDate = inst.get('minDate');
		var maxDate = inst.get('maxDate');
		date = (minDate && date.getTime() < minDate.getTime() ? plugin.newDate(minDate) : date);
		date = (maxDate && date.getTime() > maxDate.getTime() ? plugin.newDate(maxDate) : date);
		return date;
	},

	/* Retrieve the date associated with an entry in the datepicker.
	   @param  target  (element) the control to examine
	   @param  elem    (element) the selected datepicker element
	   @return  (CDate) the corresponding date, or null */
	_retrieveDatePlugin: function(target, elem) {
		var inst = $.data(target, this.propertyName);
		return (!inst ? null : this._normaliseDate(
			new Date(parseInt(elem.className.replace(/^.*dp(-?\d+).*$/, '$1'), 10))));
	},

	/* Select a date for this datepicker.
	   @param  target  (element) the control to examine
	   @param  elem    (element) the selected datepicker element */
	_selectDatePlugin: function(target, elem) {
		var inst = $.data(target, this.propertyName);
		if (inst && !this._isDisabledPlugin(target)) {
			var date = this._retrieveDatePlugin(target, elem);
			if (inst.options.multiSelect) {
				var found = false;
				for (var i = 0; i < inst.selectedDates.length; i++) {
					if (date.getTime() == inst.selectedDates[i].getTime()) {
						inst.selectedDates.splice(i, 1);
						found = true;
						break;
					}
				}
				if (!found && inst.selectedDates.length < inst.options.multiSelect) {
					inst.selectedDates.push(date);
				}
			}
			else if (inst.options.rangeSelect) {
				if (inst.pickingRange) {
					inst.selectedDates[1] = date;
				}
				else {
					inst.selectedDates = [date, date];
				}
				inst.pickingRange = !inst.pickingRange;
			}
			else {
				inst.selectedDates = [date];
			}
			inst.prevDate = plugin.newDate(date);
			this._updateInput(target);
			if (inst.inline || inst.pickingRange || inst.selectedDates.length <
					(inst.options.multiSelect || (inst.options.rangeSelect ? 2 : 1))) {
				this._update(target);
			}
			else {
				this._hidePlugin(target);
			}
		}
	},

	/* Generate the datepicker content for this control.
	   @param  target  (element) the control to affect
	   @param  inst    (object) the current instance settings
	   @return  (jQuery) the datepicker content */
	_generateContent: function(target, inst) {
		var monthsToShow = inst.options.monthsToShow;
		monthsToShow = ($.isArray(monthsToShow) ? monthsToShow : [1, monthsToShow]);
		inst.drawDate = this._checkMinMax(
			inst.drawDate || inst.get('defaultDate') || plugin.today(), inst);
		var drawDate = plugin._applyMonthsOffset(plugin.newDate(inst.drawDate), inst);
		// Generate months
		var monthRows = '';
		for (var row = 0; row < monthsToShow[0]; row++) {
			var months = '';
			for (var col = 0; col < monthsToShow[1]; col++) {
				months += this._generateMonth(target, inst, drawDate.getFullYear(),
					drawDate.getMonth() + 1, inst.options.renderer, (row == 0 && col == 0));
				plugin.add(drawDate, 1, 'm');
			}
			monthRows += this._prepare(inst.options.renderer.monthRow, inst).replace(/\{months\}/, months);
		}
		var picker = this._prepare(inst.options.renderer.picker, inst).replace(/\{months\}/, monthRows).
			replace(/\{weekHeader\}/g, this._generateDayHeaders(inst, inst.options.renderer));
		// Add commands
		var addCommand = function(type, open, close, name, classes) {
			if (picker.indexOf('{' + type + ':' + name + '}') == -1) {
				return;
			}
			var command = inst.options.commands[name];
			var date = (inst.options.commandsAsDateFormat ? command.date.apply(target, [inst]) : null);
			picker = picker.replace(new RegExp('\\{' + type + ':' + name + '\\}', 'g'),
				'<' + open +
				(command.status ? ' title="' + inst.options[command.status] + '"' : '') +
				' class="' + inst.options.renderer.commandClass + ' ' +
				inst.options.renderer.commandClass + '-' + name + ' ' + classes +
				(command.enabled(inst) ? '' : ' ' + inst.options.renderer.disabledClass) + '">' +
				(date ? plugin.formatDate(inst.options[command.text], date, inst.getConfig()) :
				inst.options[command.text]) + '</' + close + '>');
		};
		for (var name in inst.options.commands) {
			addCommand('button', 'button type="button"', 'button', name,
				inst.options.renderer.commandButtonClass);
			addCommand('link', 'a href="javascript:void(0)"', 'a', name,
				inst.options.renderer.commandLinkClass);
		}
		picker = $(picker);
		if (monthsToShow[1] > 1) {
			var count = 0;
			$(inst.options.renderer.monthSelector, picker).each(function() {
				var nth = ++count % monthsToShow[1];
				$(this).addClass(nth == 1 ? 'first' : (nth == 0 ? 'last' : ''));
			});
		}
		// Add datepicker behaviour
		var self = this;
		picker.find(inst.options.renderer.daySelector + ' a').hover(
				function() { $(this).addClass(inst.options.renderer.highlightedClass); },
				function() {
					(inst.inline ? $(this).parents('.' + self.markerClassName) : inst.div).
						find(inst.options.renderer.daySelector + ' a').
						removeClass(inst.options.renderer.highlightedClass);
				}).
			click(function() {
				self._selectDatePlugin(target, this);
			}).end().
			find('select.' + this._monthYearClass + ':not(.' + this._anyYearClass + ')').
			change(function() {
				var monthYear = $(this).val().split('/');
				self._showMonthPlugin(target, parseInt(monthYear[1], 10), parseInt(monthYear[0], 10));
			}).end().
			find('select.' + this._anyYearClass).click(function() {
				$(this).css('visibility', 'hidden').
					next('input').css({left: this.offsetLeft, top: this.offsetTop,
					width: this.offsetWidth, height: this.offsetHeight}).show().focus();
			}).end().
			find('input.' + self._monthYearClass).change(function() {
				try {
					var year = parseInt($(this).val(), 10);
					year = (isNaN(year) ? inst.drawDate.getFullYear() : year);
					self._showMonthPlugin(target, year, inst.drawDate.getMonth() + 1, inst.drawDate.getDate());
				}
				catch (e) {
					alert(e);
				}
			}).keydown(function(event) {
				if (event.keyCode == 13) { // Enter
					$(event.target).change();
				}
				else if (event.keyCode == 27) { // Escape
					$(event.target).hide().prev('select').css('visibility', 'visible');
					inst.target.focus();
				}
			});
		// Add command behaviour
		picker.find('.' + inst.options.renderer.commandClass).click(function() {
				if (!$(this).hasClass(inst.options.renderer.disabledClass)) {
					var action = this.className.replace(
						new RegExp('^.*' + inst.options.renderer.commandClass + '-([^ ]+).*$'), '$1');
					plugin._performActionPlugin(target, action);
				}
			});
		// Add classes
		if (inst.options.isRTL) {
			picker.addClass(inst.options.renderer.rtlClass);
		}
		if (monthsToShow[0] * monthsToShow[1] > 1) {
			picker.addClass(inst.options.renderer.multiClass);
		}
		if (inst.options.pickerClass) {
			picker.addClass(inst.options.pickerClass);
		}
		// Resize
		$('body').append(picker);
		var width = 0;
		picker.find(inst.options.renderer.monthSelector).each(function() {
			width += $(this).outerWidth();
		});
		picker.width(width / monthsToShow[0]);
		// Pre-show customisation
		if ($.isFunction(inst.options.onShow)) {
			inst.options.onShow.apply(target, [picker, inst]);
		}
		return picker;
	},

	/* Generate the content for a single month.
	   @param  target    (element) the control to affect
	   @param  inst      (object) the current instance settings
	   @param  year      (number) the year to generate
	   @param  month     (number) the month to generate
	   @param  renderer  (object) the rendering templates
	   @param  first     (boolean) true if first of multiple months
	   @return  (string) the month content */
	_generateMonth: function(target, inst, year, month, renderer, first) {
		var daysInMonth = plugin.daysInMonth(year, month);
		var monthsToShow = inst.options.monthsToShow;
		monthsToShow = ($.isArray(monthsToShow) ? monthsToShow : [1, monthsToShow]);
		var fixedWeeks = inst.options.fixedWeeks || (monthsToShow[0] * monthsToShow[1] > 1);
		var firstDay = inst.options.firstDay;
		var leadDays = (plugin.newDate(year, month, 1).getDay() - firstDay + 7) % 7;
		var numWeeks = (fixedWeeks ? 6 : Math.ceil((leadDays + daysInMonth) / 7));
		var selectOtherMonths = inst.options.selectOtherMonths && inst.options.showOtherMonths;
		var minDate = (inst.pickingRange ? inst.selectedDates[0] : inst.get('minDate'));
		var maxDate = inst.get('maxDate');
		var showWeeks = renderer.week.indexOf('{weekOfYear}') > -1;
		var today = plugin.today();
		var drawDate = plugin.newDate(year, month, 1);
		plugin.add(drawDate, -leadDays - (fixedWeeks && (drawDate.getDay() == firstDay) ? 7 : 0), 'd');
		var ts = drawDate.getTime();
		// Generate weeks
		var weeks = '';
		for (var week = 0; week < numWeeks; week++) {
			var weekOfYear = (!showWeeks ? '' : '<span class="dp' + ts + '">' +
				($.isFunction(inst.options.calculateWeek) ? inst.options.calculateWeek(drawDate) : 0) + '</span>');
			var days = '';
			for (var day = 0; day < 7; day++) {
				var selected = false;
				if (inst.options.rangeSelect && inst.selectedDates.length > 0) {
					selected = (drawDate.getTime() >= inst.selectedDates[0] &&
						drawDate.getTime() <= inst.selectedDates[1]);
				}
				else {
					for (var i = 0; i < inst.selectedDates.length; i++) {
						if (inst.selectedDates[i].getTime() == drawDate.getTime()) {
							selected = true;
							break;
						}
					}
				}
				var dateInfo = (!$.isFunction(inst.options.onDate) ? {} :
					inst.options.onDate.apply(target, [drawDate, drawDate.getMonth() + 1 == month]));
				var selectable = (selectOtherMonths || drawDate.getMonth() + 1 == month) &&
					this._isSelectable(target, drawDate, dateInfo.selectable, minDate, maxDate);
				days += this._prepare(renderer.day, inst).replace(/\{day\}/g,
					(selectable ? '<a href="javascript:void(0)"' : '<span') +
					' class="dp' + ts + ' ' + (dateInfo.dateClass || '') +
					(selected && (selectOtherMonths || drawDate.getMonth() + 1 == month) ?
					' ' + renderer.selectedClass : '') +
					(selectable ? ' ' + renderer.defaultClass : '') +
					((drawDate.getDay() || 7) < 6 ? '' : ' ' + renderer.weekendClass) +
					(drawDate.getMonth() + 1 == month ? '' : ' ' + renderer.otherMonthClass) +
					(drawDate.getTime() == today.getTime() && (drawDate.getMonth() + 1) == month ?
					' ' + renderer.todayClass : '') +
					(drawDate.getTime() == inst.drawDate.getTime() && (drawDate.getMonth() + 1) == month ?
					' ' + renderer.highlightedClass : '') + '"' +
					(dateInfo.title || (inst.options.dayStatus && selectable) ? ' title="' +
					(dateInfo.title || plugin.formatDate(
					inst.options.dayStatus, drawDate, inst.getConfig())) + '"' : '') + '>' +
					(inst.options.showOtherMonths || (drawDate.getMonth() + 1) == month ?
					dateInfo.content || drawDate.getDate() : '&nbsp;') +
					(selectable ? '</a>' : '</span>'));
				plugin.add(drawDate, 1, 'd');
				ts = drawDate.getTime();
			}
			weeks += this._prepare(renderer.week, inst).replace(/\{days\}/g, days).
				replace(/\{weekOfYear\}/g, weekOfYear);
		}
		var monthHeader = this._prepare(renderer.month, inst).match(/\{monthHeader(:[^\}]+)?\}/);
		monthHeader = (monthHeader[0].length <= 13 ? 'MM yyyy' :
			monthHeader[0].substring(13, monthHeader[0].length - 1));
		monthHeader = (first ? this._generateMonthSelection(
			inst, year, month, minDate, maxDate, monthHeader, renderer) :
			plugin.formatDate(monthHeader, plugin.newDate(year, month, 1), inst.getConfig()));
		var weekHeader = this._prepare(renderer.weekHeader, inst).
			replace(/\{days\}/g, this._generateDayHeaders(inst, renderer));
		return this._prepare(renderer.month, inst).replace(/\{monthHeader(:[^\}]+)?\}/g, monthHeader).
			replace(/\{weekHeader\}/g, weekHeader).replace(/\{weeks\}/g, weeks);
	},

	/* Generate the HTML for the day headers.
	   @param  inst      (object) the current instance settings
	   @param  renderer  (object) the rendering templates
	   @return  (string) a week's worth of day headers */
	_generateDayHeaders: function(inst, renderer) {
		var header = '';
		for (var day = 0; day < 7; day++) {
			var dow = (day + inst.options.firstDay) % 7;
			header += this._prepare(renderer.dayHeader, inst).replace(/\{day\}/g,
				'<span class="' + this._curDoWClass + dow + '" title="' +
				inst.options.dayNames[dow] + '">' + inst.options.dayNamesMin[dow] + '</span>');
		}
		return header;
	},

	/* Generate selection controls for month.
	   @param  inst         (object) the current instance settings
	   @param  year         (number) the year to generate
	   @param  month        (number) the month to generate
	   @param  minDate      (CDate) the minimum date allowed
	   @param  maxDate      (CDate) the maximum date allowed
	   @param  monthHeader  (string) the month/year format
	   @return  (string) the month selection content */
	_generateMonthSelection: function(inst, year, month, minDate, maxDate, monthHeader) {
		if (!inst.options.changeMonth) {
			return plugin.formatDate(
				monthHeader, plugin.newDate(year, month, 1), inst.getConfig());
		}
		// Months
		var monthNames = inst.options['monthNames' + (monthHeader.match(/mm/i) ? '' : 'Short')];
		var html = monthHeader.replace(/m+/i, '\\x2E').replace(/y+/i, '\\x2F');
		var selector = '<select class="' + this._monthYearClass +
			'" title="' + inst.options.monthStatus + '">';
		for (var m = 1; m <= 12; m++) {
			if ((!minDate || plugin.newDate(year, m, plugin.daysInMonth(year, m)).
					getTime() >= minDate.getTime()) &&
					(!maxDate || plugin.newDate(year, m, 1).getTime() <= maxDate.getTime())) {
				selector += '<option value="' + m + '/' + year + '"' +
					(month == m ? ' selected="selected"' : '') + '>' +
					monthNames[m - 1] + '</option>';
			}
		}
		selector += '</select>';
		html = html.replace(/\\x2E/, selector);
		// Years
		var yearRange = inst.options.yearRange;
		if (yearRange == 'any') {
			selector = '<select class="' + this._monthYearClass + ' ' + this._anyYearClass +
				'" title="' + inst.options.yearStatus + '">' +
				'<option>' + year + '</option></select>' +
				'<input class="' + this._monthYearClass + ' ' + this._curMonthClass +
				month + '" value="' + year + '">';
		}
		else {
			yearRange = yearRange.split(':');
			var todayYear = plugin.today().getFullYear();
			var start = (yearRange[0].match('c[+-].*') ? year + parseInt(yearRange[0].substring(1), 10) :
				((yearRange[0].match('[+-].*') ? todayYear : 0) + parseInt(yearRange[0], 10)));
			var end = (yearRange[1].match('c[+-].*') ? year + parseInt(yearRange[1].substring(1), 10) :
				((yearRange[1].match('[+-].*') ? todayYear : 0) + parseInt(yearRange[1], 10)));
			selector = '<select class="' + this._monthYearClass +
				'" title="' + inst.options.yearStatus + '">';
			start = plugin.add(plugin.newDate(start + 1, 1, 1), -1, 'd');
			end = plugin.newDate(end, 1, 1);
			var addYear = function(y) {
				if (y != 0) {
					selector += '<option value="' + month + '/' + y + '"' +
						(year == y ? ' selected="selected"' : '') + '>' + y + '</option>';
				}
			};
			if (start.getTime() < end.getTime()) {
				start = (minDate && minDate.getTime() > start.getTime() ? minDate : start).getFullYear();
				end = (maxDate && maxDate.getTime() < end.getTime() ? maxDate : end).getFullYear();
				for (var y = start; y <= end; y++) {
					addYear(y);
				}
			}
			else {
				start = (maxDate && maxDate.getTime() < start.getTime() ? maxDate : start).getFullYear();
				end = (minDate && minDate.getTime() > end.getTime() ? minDate : end).getFullYear();
				for (var y = start; y >= end; y--) {
					addYear(y);
				}
			}
			selector += '</select>';
		}
		html = html.replace(/\\x2F/, selector);
		return html;
	},

	/* Prepare a render template for use.
	   Exclude popup/inline sections that are not applicable.
	   Localise text of the form: {l10n:name}.
	   @param  text  (string) the text to localise
	   @param  inst  (object) the current instance settings
	   @return  (string) the localised text */
	_prepare: function(text, inst) {
		var replaceSection = function(type, retain) {
			while (true) {
				var start = text.indexOf('{' + type + ':start}');
				if (start == -1) {
					return;
				}
				var end = text.substring(start).indexOf('{' + type + ':end}');
				if (end > -1) {
					text = text.substring(0, start) +
						(retain ? text.substr(start + type.length + 8, end - type.length - 8) : '') +
						text.substring(start + end + type.length + 6);
				}
			}
		};
		replaceSection('inline', inst.inline);
		replaceSection('popup', !inst.inline);
		var pattern = /\{l10n:([^\}]+)\}/;
		var matches = null;
		while (matches = pattern.exec(text)) {
			text = text.replace(matches[0], inst.options[matches[1]]);
		}
		return text;
	}
});

// The list of commands that return values and don't permit chaining
var getters = ['getDate', 'isDisabled', 'isSelectable', 'retrieveDate'];

/* Determine whether a command is a getter and doesn't permit chaining.
   @param  command    (string, optional) the command to run
   @param  otherArgs  ([], optional) any other arguments for the command
   @return  true if the command is a getter, false if not */
function isNotChained(command, otherArgs) {
	if (command == 'option' && (otherArgs.length == 0 ||
			(otherArgs.length == 1 && typeof otherArgs[0] == 'string'))) {
		return true;
	}
	return $.inArray(command, getters) > -1;
}

/* Attach the datepicker functionality to a jQuery selection.
   @param  options  (object) the new settings to use for these instances (optional) or
                    (string) the command to run (optional)
   @return  (jQuery) for chaining further calls or
            (any) getter value */
$.fn.datepick = function(options) {
	var otherArgs = Array.prototype.slice.call(arguments, 1);
	if (isNotChained(options, otherArgs)) {
		return plugin['_' + options + 'Plugin'].apply(plugin, [this[0]].concat(otherArgs));
	}
	return this.each(function() {
		if (typeof options == 'string') {
			if (!plugin['_' + options + 'Plugin']) {
				throw 'Unknown command: ' + options;
			}
			plugin['_' + options + 'Plugin'].apply(plugin, [this].concat(otherArgs));
		}
		else {
			plugin._attachPlugin(this, options || {});
		}
	});
};

/* Initialise the datepicker functionality. */
var plugin = $.datepick = new Datepicker(); // Singleton instance

$(function() {
	$(document).mousedown(plugin._checkExternalClick).
		resize(function() { plugin._hidePlugin(plugin.curInst); });
});

})(jQuery);





﻿/* http://keith-wood.name/datepick.html
   Datepicker extensions for jQuery v4.1.0.
   Written by Keith Wood (kbwood{at}iinet.com.au) August 2009.
   Dual licensed under the GPL (http://dev.jquery.com/browser/trunk/jquery/GPL-LICENSE.txt) and 
   MIT (http://dev.jquery.com/browser/trunk/jquery/MIT-LICENSE.txt) licenses. 
   Please attribute the author if you use it. */

(function($) { // Hide scope, no $ conflict

var themeRollerRenderer = {
	picker: '<div{popup:start} id="ui-datepicker-div"{popup:end} class="ui-datepicker ui-widget ' +
	'ui-widget-content ui-helper-clearfix ui-corner-all{inline:start} ui-datepicker-inline{inline:end}">' +
	'<div class="ui-datepicker-header ui-widget-header ui-helper-clearfix ui-corner-all">' +
	'{link:prev}{link:today}{link:next}</div>{months}' +
	'{popup:start}<div class="ui-datepicker-header ui-widget-header ui-helper-clearfix ' +
	'ui-corner-all">{button:clear}{button:close}</div>{popup:end}' +
	'<div class="ui-helper-clearfix"></div></div>',
	monthRow: '<div class="ui-datepicker-row-break">{months}</div>',
	month: '<div class="ui-datepicker-group">' +
	'<div class="ui-datepicker-header ui-widget-header ui-helper-clearfix ui-corner-all">{monthHeader:MM yyyy}</div>' +
	'<table class="ui-datepicker-calendar"><thead>{weekHeader}</thead><tbody>{weeks}</tbody></table></div>',
	weekHeader: '<tr>{days}</tr>',
	dayHeader: '<th>{day}</th>',
	week: '<tr>{days}</tr>',
	day: '<td>{day}</td>',
	monthSelector: '.ui-datepicker-group',
	daySelector: 'td',
	rtlClass: 'ui-datepicker-rtl',
	multiClass: 'ui-datepicker-multi',
	defaultClass: 'ui-state-default',
	selectedClass: 'ui-state-active',
	highlightedClass: 'ui-state-hover',
	todayClass: 'ui-state-highlight',
	otherMonthClass: 'ui-datepicker-other-month',
	weekendClass: 'ui-datepicker-week-end',
	commandClass: 'ui-datepicker-cmd',
	commandButtonClass: 'ui-state-default ui-corner-all',
	commandLinkClass: '',
	disabledClass: 'ui-datepicker-disabled'
};

$.extend($.datepick, {

	// Template for generating a datepicker showing week of year.
	weekOfYearRenderer: $.extend({}, $.datepick.defaultRenderer, {
		weekHeader: '<tr><th class="datepick-week">' +
		'<span title="{l10n:weekStatus}">{l10n:weekText}</span></th>{days}</tr>',
		week: '<tr><td class="datepick-week">{weekOfYear}</td>{days}</tr>'
	}),

	// ThemeRoller template for generating a datepicker.
	themeRollerRenderer: themeRollerRenderer,

	// ThemeRoller template for generating a datepicker showing week of year.
	themeRollerWeekOfYearRenderer: $.extend({}, themeRollerRenderer, {
		weekHeader: '<tr><th class="ui-state-hover"><span>{l10n:weekText}</span></th>{days}</tr>',
		week: '<tr><td class="ui-state-hover">{weekOfYear}</td>{days}</tr>'
	}),

	/* Don't allow weekends to be selected.
	   Usage: onDate: $.datepick.noWeekends.
	   @param  date  (Date) the current date
	   @return  (object) information about this date */
	noWeekends: function(date) {
		return {selectable: (date.getDay() || 7) < 6};
	},

	/* Change the first day of the week by clicking on the day header.
	   Usage: onShow: $.datepick.changeFirstDay.
	   @param  picker  (jQuery) the completed datepicker division
	   @param  inst    (object) the current instance settings */
	changeFirstDay: function(picker, inst) {
		var target = $(this);
		picker.find('th span').each(function() {
			var parent = $(this).parent();
			if (parent.is('.datepick-week') || parent.is('.ui-state-hover')) {
				return;
			}
			$('<a href="javascript:void(0)" class="' + this.className +
					'" title="Change first day of the week">' + $(this).text() + '</a>').
				click(function() {
					var dow = parseInt(this.className.replace(/^.*datepick-dow-(\d+).*$/, '$1'), 10);
					target.datepick('option', {firstDay: dow});
				}).
				replaceAll(this);
		});
	},

	/* Add a callback when hovering over dates.
	   Usage: onShow: $.datepick.hoverCallback(handleHover).
	   @param  onHover  (function) the callback when hovering,
	                    it receives the current date and a flag indicating selectability
	                    as parameters on entry, and no parameters on exit,
	                    this refers to the target input or division */
	hoverCallback: function(onHover) {
		return function(picker, inst) {
			if ($.isFunction(onHover)) {
				var target = this;
				picker.find(inst.options.renderer.daySelector + ' a, ' +
						inst.options.renderer.daySelector + ' span').
					hover(function() {
						onHover.apply(target, [$(target).datepick('retrieveDate', this),
							this.nodeName.toLowerCase() == 'a']);
					},
					function() { onHover.apply(target, []); });
			}
		};
	},

	/* Highlight the entire week when hovering over it.
	   Usage: onShow: $.datepick.highlightWeek.
	   @param  picker  (jQuery) the completed datepicker division
	   @param  inst    (object) the current instance settings */
	highlightWeek: function(picker, inst) {
		var target = this;
		var renderer = inst.options.renderer;
		picker.find(renderer.daySelector + ' a, ' + renderer.daySelector + ' span').
			hover(function() {
				$(this).parents('tr').find(renderer.daySelector + ' *').
					addClass(renderer.highlightedClass);
			},
			function() {
				$(this).parents('tr').find(renderer.daySelector + ' *').
					removeClass(renderer.highlightedClass);
			});
	},

	/* Show a status bar with messages.
	   Usage: onShow: $.datepick.showStatus.
	   @param  picker  (jQuery) the completed datepicker division
	   @param  inst    (object) the current instance settings */
	showStatus: function(picker, inst) {
		var isTR = (inst.options.renderer.selectedClass == themeRollerRenderer.selectedClass);
		var defaultStatus = inst.options.defaultStatus || '&nbsp;';
		var status = $('<div class="' + (!isTR ? 'datepick-status' :
			'ui-datepicker-status ui-widget-header ui-helper-clearfix ui-corner-all') + '">' +
			defaultStatus + '</div>').
			insertAfter(picker.find('.datepick-month-row:last,.ui-datepicker-row-break:last'));
		picker.find('*[title]').each(function() {
				var title = $(this).attr('title');
				$(this).removeAttr('title').hover(
					function() { status.text(title || defaultStatus); },
					function() { status.text(defaultStatus); });
			});
	},

	/* Allow easier navigation by month/year.
	   Usage: onShow: $.datepick.monthNavigation.
	   @param  picker  (jQuery) the completed datepicker division
	   @param  inst    (object) the current instance settings */
	monthNavigation: function(picker, inst) {
		var target = $(this);
		var isTR = (inst.options.renderer.selectedClass == themeRollerRenderer.selectedClass);
		var minDate = inst.curMinDate();
		var maxDate = inst.get('maxDate');
		var month = inst.drawDate.getMonth();
		var year = inst.drawDate.getFullYear();
		var html = '<div class="' + (!isTR ? 'datepick-month-nav' : 'ui-datepicker-month-nav') + '"' +
			' style="display: none;">';
		for (var i = 0; i < inst.options.monthNames.length; i++) {
			var inRange = ((!minDate || new Date(year, i + 1, 0).getTime() >= minDate.getTime()) &&
				(!maxDate || new Date(year, i, 1).getTime() <= maxDate.getTime()));
			html += '<div>' +
				(inRange ? '<a href="#" class="dp' + new Date(year, i, 1).getTime() + '"' : '<span') +
				' title="' + inst.options.monthNames[i] + '">' + inst.options.monthNamesShort[i] +
				(inRange ? '</a>' : '</span>') + '</div>';
		}
		for (var i = -6; i <= 6; i++) {
			if (i == 0) {
				continue;
			}
			var inRange =
				((!minDate || new Date(year + i, 12 - 1, 31).getTime() >= minDate.getTime()) &&
				(!maxDate || new Date(year + i, 1 - 1, 1).getTime() <= maxDate.getTime()));
			html += '<div>' + (inRange ? '<a href="#" class="dp' +
				new Date(year + i, month, 1).getTime() + '"' : '<span') +
				' title="' + (year + i) + '">' + (year + i) +
				(inRange ? '</a>' : '</span>') + '</div>';
		}
		html += '</div>';
		html = $(html).insertAfter(picker.find('div.datepick-nav,div.ui-datepicker-header:first'));
		html.find('a').click(function() {
				var date = target.datepick('retrieveDate', this);
				target.datepick('showMonth', date.getFullYear(), date.getMonth() + 1);
				return false;
			});
		picker.find('div.datepick-month-header,div.ui-datepicker-month-header').click(function() {
			html.slideToggle();
		}).css('cursor', 'pointer');
	},

	/* Select an entire week when clicking on a week number.
	   Use in conjunction with weekOfYearRenderer or themeRollerWeekOfYearRenderer.
	   Usage: onShow: $.datepick.selectWeek.
	   @param  picker  (jQuery) the completed datepicker division
	   @param  inst    (object) the current instance settings */
	selectWeek: function(picker, inst) {
		var target = $(this);
		picker.find('td.datepick-week span,td.ui-state-hover span').each(function() {
			$('<a href="javascript:void(0)" class="' +
					this.className + '" title="Select the entire week">' +
					$(this).text() + '</a>').
				click(function() {
					var date = target.datepick('retrieveDate', this);
					var dates = [date];
					for (var i = 1; i < 7; i++) {
						dates.push(date = $.datepick.add($.datepick.newDate(date), 1, 'd'));
					}
					if (inst.options.rangeSelect) {
						dates.splice(1, dates.length - 2);
					}
					target.datepick('setDate', dates).datepick('hide');
				}).
				replaceAll(this);
		});
	},

	/* Select an entire month when clicking on the week header.
	   Use in conjunction with weekOfYearRenderer or themeRollerWeekOfYearRenderer.
	   Usage: onShow: $.datepick.selectMonth.
	   @param  picker  (jQuery) the completed datepicker division
	   @param  inst    (object) the current instance settings */
	selectMonth: function(picker, inst) {
		var target = $(this);
		picker.find('th.datepick-week span,th.ui-state-hover span').each(function() {
			$('<a href="javascript:void(0)" title="Select the entire month">' +
					$(this).text() + '</a>').
				click(function() {
					var date = target.datepick('retrieveDate', $(this).parents('table').
						find('td:not(.datepick-week):not(.ui-state-hover) ' +
							'*:not(.datepick-other-month):not(.ui-datepicker-other-month)')[0]);
					var dates = [date];
					var dim = $.datepick.daysInMonth(date);
					for (var i = 1; i < dim; i++) {
						dates.push(date = $.datepick.add($.datepick.newDate(date), 1, 'd'));
					}
					if (inst.options.rangeSelect) {
						dates.splice(1, dates.length - 2);
					}
					target.datepick('setDate', dates).datepick('hide');
				}).
				replaceAll(this);
		});
	},

	/* Select a month only instead of a single day.
	   Usage: onShow: $.datepick.monthOnly.
	   @param  picker  (jQuery) the completed datepicker division
	   @param  inst    (object) the current instance settings */
	monthOnly: function(picker, inst) {
		var target = $(this);
		var selectMonth = $('<div style="text-align: center;"><button type="button">Select</button></div>').
			insertAfter(picker.find('.datepick-month-row:last,.ui-datepicker-row-break:last')).
			children().click(function() {
				var monthYear = picker.find('.datepick-month-year:first').val().split('/');
				target.datepick('setDate', $.datepick.newDate(
					parseInt(monthYear[1], 10), parseInt(monthYear[0], 10), 1)).
					datepick('hide');
			});
		picker.find('.datepick-month-row table,.ui-datepicker-row-break table').remove();
	}
});

})(jQuery);





﻿/* http://keith-wood.name/datepick.html
   Datepicker localisations for jQuery 4.1.0. */
/* http://keith-wood.name/datepick.html
   Afrikaans localisation for jQuery Datepicker.
   Written by Renier Pretorius and Ruediger Thiede. */
(function($) {
	$.datepick.regional['af'] = {
		monthNames: ['Januarie','Februarie','Maart','April','Mei','Junie',
		'Julie','Augustus','September','Oktober','November','Desember'],
		monthNamesShort: ['Jan', 'Feb', 'Mrt', 'Apr', 'Mei', 'Jun',
		'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Des'],
		dayNames: ['Sondag', 'Maandag', 'Dinsdag', 'Woensdag', 'Donderdag', 'Vrydag', 'Saterdag'],
		dayNamesShort: ['Son', 'Maan', 'Dins', 'Woens', 'Don', 'Vry', 'Sat'],
		dayNamesMin: ['So','Ma','Di','Wo','Do','Vr','Sa'],
		dateFormat: 'dd/mm/yyyy', firstDay: 1,
		renderer: $.datepick.defaultRenderer,
		prevText: 'Vorige', prevStatus: 'Vertoon vorige maand',
		prevJumpText: '&#x3c;&#x3c;', prevJumpStatus: 'Vertoon vorige jaar',
		nextText: 'Volgende', nextStatus: 'Vertoon volgende maand',
		nextJumpText: '&#x3e;&#x3e;', nextJumpStatus: 'Vertoon volgende jaar',
		currentText: 'Vandag', currentStatus: 'Vertoon huidige maand',
		todayText: 'Vandag', todayStatus: 'Vertoon huidige maand',
		clearText: 'Vee uit', clearStatus: 'Verwyder die huidige datum',
		closeText: 'Klaar', closeStatus: 'Sluit sonder verandering',
		yearStatus: 'Vertoon \'n ander jaar', monthStatus: 'Vertoon \'n ander maand',
		weekText: 'Wk', weekStatus: 'Week van die jaar',
		dayStatus: 'Kies DD, M d', defaultStatus: 'Kies \'n datum',
		isRTL: false
	};
	$.datepick.setDefaults($.datepick.regional['af']);
})(jQuery);
﻿/* http://keith-wood.name/datepick.html
   Amharic (አማርኛ) localisation for jQuery datepicker.
   Leyu Sisay. */
(function($) {
	$.datepick.regional['am'] = {
		monthNames: ['ጃንዋሪ','ፈብርዋሪ','ማርች','አፕሪል','ሜይ','ጁን',
		'ጁላይ','ኦገስት','ሴፕቴምበር','ኦክቶበር','ኖቬምበር','ዲሴምበር'],
		monthNamesShort: ['ጃንዋ', 'ፈብር', 'ማርች', 'አፕሪ', 'ሜይ', 'ጁን',
		'ጁላይ', 'ኦገስ', 'ሴፕቴ', 'ኦክቶ', 'ኖቬም', 'ዲሴም'],
		dayNames: ['ሰንዴይ', 'መንዴይ', 'ትዩስዴይ', 'ዌንስዴይ', 'ተርሰዴይ', 'ፍራይዴይ', 'ሳተርዴይ'],
		dayNamesShort: ['ሰንዴ', 'መንዴ', 'ትዩስ', 'ዌንስ', 'ተርሰ', 'ፍራይ', 'ሳተር'],
		dayNamesMin: ['ሰን', 'መን', 'ትዩ', 'ዌን', 'ተር', 'ፍራ', 'ሳተ'],
		dateFormat: 'dd/mm/yyyy', firstDay: 1,
		renderer: $.datepick.defaultRenderer,
		prevText: 'ያለፈ', prevStatus: 'ያለፈውን ወር አሳይ',
		prevJumpText: '&#x3c;&#x3c;', prevJumpStatus: 'ያለፈውን ዓመት አሳይ',
		nextText: 'ቀጣይ', nextStatus: 'ቀጣዩን ወር አሳይ',
		nextJumpText: '&#x3e;&#x3e;', nextJumpStatus: 'ቀጣዩን ዓመት አሳይ',
		currentText: 'አሁን', currentStatus: 'የአሁኑን ወር አሳይ',
		todayText: 'ዛሬ', todayStatus: 'የዛሬን ወር አሳይ',
		clearText: 'አጥፋ', clearStatus: 'የተመረጠውን ቀን አጥፋ',
		closeText: 'ዝጋ', closeStatus: 'የቀን መምረጫውን ዝጋ',
		yearStatus: 'ዓመቱን ቀይር', monthStatus: 'ወሩን ቀይር',
		weekText: 'ሳም', weekStatus: 'የዓመቱ ሳምንት ',
		dayStatus: 'DD, M d, yyyy ምረጥ', defaultStatus: 'ቀን ምረጥ',
		isRTL: false
	};
	$.datepick.setDefaults($.datepick.regional['am']);
})(jQuery);
﻿/* http://keith-wood.name/datepick.html
   Algerian (and Tunisian) Arabic localisation for jQuery Datepicker.
   Mohamed Cherif BOUCHELAGHEM -- cherifbouchelaghem@yahoo.fr */
(function($) {
	$.datepick.regional['ar-DZ'] = {
		monthNames: ['جانفي', 'فيفري', 'مارس', 'أفريل', 'ماي', 'جوان',
		'جويلية', 'أوت', 'سبتمبر','أكتوبر', 'نوفمبر', 'ديسمبر'],
		monthNamesShort: ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'],
		dayNames: ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'],
		dayNamesShort: ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'],
		dayNamesMin: ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'],
		dateFormat: 'dd/mm/yyyy', firstDay: 6,
		renderer: $.datepick.defaultRenderer,
		prevText: '&#x3c;السابق', prevStatus: 'عرض الشهر السابق',
		prevJumpText: '&#x3c;&#x3c;', prevJumpStatus: '',
		nextText: 'التالي&#x3e;', nextStatus: 'عرض الشهر القادم',
		nextJumpText: '&#x3e;&#x3e;', nextJumpStatus: '',
		currentText: 'اليوم', currentStatus: 'عرض الشهر الحالي',
		todayText: 'اليوم', todayStatus: 'عرض الشهر الحالي',
		clearText: 'مسح', clearStatus: 'امسح التاريخ الحالي',
		closeText: 'إغلاق', closeStatus: 'إغلاق بدون حفظ',
		yearStatus: 'عرض سنة آخرى', monthStatus: 'عرض شهر آخر',
		weekText: 'أسبوع', weekStatus: 'أسبوع السنة',
		dayStatus: 'اختر D, M d', defaultStatus: 'اختر يوم',
		isRTL: true
	};
	$.datepick.setDefaults($.datepick.regional['ar-DZ']);
})(jQuery);
﻿/* http://keith-wood.name/datepick.html
   Arabic localisation for jQuery Datepicker.
   Mahmoud Khaled -- mahmoud.khaled@badrit.com
   NOTE: monthNames are the new months names */
(function($) {
	$.datepick.regional['ar-EG'] = {
		monthNames: ['يناير', 'فبراير', 'مارس', 'إبريل', 'مايو', 'يونية',
		'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'],
		monthNamesShort: ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'],
		dayNames:  ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'],
		dayNamesShort: ['أحد', 'اثنين', 'ثلاثاء', 'أربعاء', 'خميس', 'جمعة', 'سبت'],
		dayNamesMin: ['أحد', 'اثنين', 'ثلاثاء', 'أربعاء', 'خميس', 'جمعة', 'سبت'],
		dateFormat: 'dd/mm/yyyy', firstDay: 6,
		renderer: $.datepick.defaultRenderer,
		prevText: '&#x3c;السابق', prevStatus: 'عرض الشهر السابق',
		prevJumpText: '&#x3c;&#x3c;', prevJumpStatus: '',
		nextText: 'التالي&#x3e;', nextStatus: 'عرض الشهر القادم',
		nextJumpText: '&#x3e;&#x3e;', nextJumpStatus: '',
		currentText: 'اليوم', currentStatus: 'عرض الشهر الحالي',
		todayText: 'اليوم', todayStatus: 'عرض الشهر الحالي',
		clearText: 'مسح', clearStatus: 'امسح التاريخ الحالي',
		closeText: 'إغلاق', closeStatus: 'إغلاق بدون حفظ',
		yearStatus: 'عرض سنة آخرى', monthStatus: 'عرض شهر آخر',
		weekText: 'أسبوع', weekStatus: 'أسبوع السنة',
		dayStatus: 'اختر D, M d', defaultStatus: 'اختر يوم',
		isRTL: true
	};
	$.datepick.setDefaults($.datepick.regional['ar-EG']);
})(jQuery);
﻿/* http://keith-wood.name/datepick.html
   Arabic localisation for jQuery Datepicker.
   Khaled Al Horani -- koko.dw@gmail.com
   خالد الحوراني -- koko.dw@gmail.com
   NOTE: monthNames are the original months names and they are the Arabic names, not the new months name فبراير - يناير and there isn't any Arabic roots for these months */
(function($) {
	$.datepick.regional['ar'] = {
		monthNames: ['كانون الثاني', 'شباط', 'آذار', 'نيسان', 'آذار', 'حزيران',
		'تموز', 'آب', 'أيلول', 'تشرين الأول', 'تشرين الثاني', 'كانون الأول'],
		monthNamesShort: ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'],
		dayNames: ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'],
		dayNamesShort: ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'],
		dayNamesMin: ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'],
		dateFormat: 'dd/mm/yyyy', firstDay: 6,
		renderer: $.datepick.defaultRenderer,
		prevText: '&#x3c;السابق', prevStatus: 'عرض الشهر السابق',
		prevJumpText: '&#x3c;&#x3c;', prevJumpStatus: '',
		nextText: 'التالي&#x3e;', nextStatus: 'عرض الشهر القادم',
		nextJumpText: '&#x3e;&#x3e;', nextJumpStatus: '',
		currentText: 'اليوم', currentStatus: 'عرض الشهر الحالي',
		todayText: 'اليوم', todayStatus: 'عرض الشهر الحالي',
		clearText: 'مسح', clearStatus: 'امسح التاريخ الحالي',
		closeText: 'إغلاق', closeStatus: 'إغلاق بدون حفظ',
		yearStatus: 'عرض سنة آخرى', monthStatus: 'عرض شهر آخر',
		weekText: 'أسبوع', weekStatus: 'أسبوع السنة',
		dayStatus: 'اختر D, M d', defaultStatus: 'اختر يوم',
		isRTL: true
	};
	$.datepick.setDefaults($.datepick.regional['ar']);
})(jQuery);
﻿/* http://keith-wood.name/datepick.html
   Azerbaijani localisation for jQuery Datepicker.
   Written by Jamil Najafov (necefov33@gmail.com). */
(function($) {
	$.datepick.regional['az'] = {
		monthNames: ['Yanvar','Fevral','Mart','Aprel','May','İyun',
		'İyul','Avqust','Sentyabr','Oktyabr','Noyabr','Dekabr'],
		monthNamesShort: ['Yan','Fev','Mar','Apr','May','İyun',
		'İyul','Avq','Sen','Okt','Noy','Dek'],
		dayNames: ['Bazar','Bazar ertəsi','Çərşənbə axşamı','Çərşənbə','Cümə axşamı','Cümə','Şənbə'],
		dayNamesShort: ['B','Be','Ça','Ç','Ca','C','Ş'],
		dayNamesMin: ['B','B','Ç','С','Ç','C','Ş'],
		dateFormat: 'dd.mm.yyyy', firstDay: 1,
		renderer: $.datepick.defaultRenderer,
		prevText: '&#x3c;Geri',  prevStatus: 'Əvvəlki ay',
		prevJumpText: '&#x3c;&#x3c;', prevJumpStatus: 'Əvvəlki il',
		nextText: 'İrəli&#x3e;', nextStatus: 'Sonrakı ay',
		nextJumpText: '&#x3e;&#x3e;', nextJumpStatus: 'Sonrakı il',
		currentText: 'Bugün', currentStatus: 'İndiki ay',
		todayText: 'Bugün', todayStatus: 'İndiki ay',
		clearText: 'Təmizlə', clearStatus: 'Tarixi sil',
		closeText: 'Bağla', closeStatus: 'Təqvimi bağla',
		yearStatus: 'Başqa il', monthStatus: 'Başqa ay',
		weekText: 'Hf', weekStatus: 'Həftələr',
		dayStatus: 'D, M d seçin', defaultStatus: 'Bir tarix seçin',
		isRTL: false
	};
	$.datepick.setDefaults($.datepick.regional['az']);
})(jQuery);﻿/* http://keith-wood.name/datepick.html
   Bulgarian localisation for jQuery Datepicker.
   Written by Stoyan Kyosev (http://svest.org). */
(function($) {
	$.datepick.regional['bg'] = {
		monthNames: ['Януари','Февруари','Март','Април','Май','Юни',
		'Юли','Август','Септември','Октомври','Ноември','Декември'],
		monthNamesShort: ['Яну','Фев','Мар','Апр','Май','Юни',
		'Юли','Авг','Сеп','Окт','Нов','Дек'],
		dayNames: ['Неделя','Понеделник','Вторник','Сряда','Четвъртък','Петък','Събота'],
		dayNamesShort: ['Нед','Пон','Вто','Сря','Чет','Пет','Съб'],
		dayNamesMin: ['Не','По','Вт','Ср','Че','Пе','Съ'],
		dateFormat: 'dd.mm.yyyy', firstDay: 1,
		renderer: $.datepick.defaultRenderer,
		prevText: '&#x3c;назад', prevStatus: 'покажи последния месец',
		prevJumpText: '&#x3c;&#x3c;', prevJumpStatus: '',
		nextText: 'напред&#x3e;', nextStatus: 'покажи следващия месец',
		nextJumpText: '&#x3e;&#x3e;', nextJumpStatus: '',
		currentText: 'днес', currentStatus: '',
		todayText: 'днес', todayStatus: '',
		clearText: 'изчисти', clearStatus: 'изчисти актуалната дата',
		closeText: 'затвори', closeStatus: 'затвори без промени',
		yearStatus: 'покажи друга година', monthStatus: 'покажи друг месец',
		weekText: 'Wk', weekStatus: 'седмица от месеца',
		dayStatus: 'Избери D, M d', defaultStatus: 'Избери дата',
		isRTL: false
	};
	$.datepick.setDefaults($.datepick.regional['bg']);
})(jQuery);
﻿/* http://keith-wood.name/datepick.html
   Bosnian localisation for jQuery Datepicker.
   Written by Kenan Konjo. */
(function($) {
	$.datepick.regional['bs'] = {
		monthNames: ['Januar','Februar','Mart','April','Maj','Juni',
		'Juli','August','Septembar','Oktobar','Novembar','Decembar'],
		monthNamesShort: ['Jan','Feb','Mar','Apr','Maj','Jun',
		'Jul','Aug','Sep','Okt','Nov','Dec'],
		dayNames: ['Nedelja','Ponedeljak','Utorak','Srijeda','Četvrtak','Petak','Subota'],
		dayNamesShort: ['Ned','Pon','Uto','Sri','Čet','Pet','Sub'],
		dayNamesMin: ['Ne','Po','Ut','Sr','Če','Pe','Su'],
		dateFormat: 'dd.mm.yyyy', firstDay: 1,
		renderer: $.datepick.defaultRenderer,
		prevText: '&#x3c;', prevStatus: '',
		prevJumpText: '&#x3c;&#x3c;', prevJumpStatus: '',
		nextText: '&#x3e;', nextStatus: '',
		nextJumpText: '&#x3e;&#x3e;', nextJumpStatus: '',
		currentText: 'Danas', currentStatus: '',
		todayText: 'Danas', todayStatus: '',
		clearText: 'X', clearStatus: '',
		closeText: 'Zatvori', closeStatus: '',
		yearStatus: '', monthStatus: '',
		weekText: 'Wk', weekStatus: '',
		dayStatus: 'DD d MM', defaultStatus: '',
		isRTL: false
	};
	$.datepick.setDefaults($.datepick.regional['bs']);
})(jQuery);
/* http://keith-wood.name/datepick.html
   Catalan localisation for jQuery Datepicker.
   Writers: (joan.leon@gmail.com). */
(function($) {
	$.datepick.regional['ca'] = {
		monthNames: ['Gener','Febrer','Mar&ccedil;','Abril','Maig','Juny',
		'Juliol','Agost','Setembre','Octubre','Novembre','Desembre'],
		monthNamesShort: ['Gen','Feb','Mar','Abr','Mai','Jun',
		'Jul','Ago','Set','Oct','Nov','Des'],
		dayNames: ['Diumenge','Dilluns','Dimarts','Dimecres','Dijous','Divendres','Dissabte'],
		dayNamesShort: ['Dug','Dln','Dmt','Dmc','Djs','Dvn','Dsb'],
		dayNamesMin: ['Dg','Dl','Dt','Dc','Dj','Dv','Ds'],
		dateFormat: 'dd/mm/yyyy', firstDay: 1,
		renderer: $.datepick.defaultRenderer,
		prevText: '&#x3c;Ant', prevStatus: '',
		prevJumpText: '&#x3c;&#x3c;', prevJumpStatus: '',
		nextText: 'Seg&#x3e;', nextStatus: '',
		nextJumpText: '&#x3e;&#x3e;', nextJumpStatus: '',
		currentText: 'Avui', currentStatus: '',
		todayText: 'Avui', todayStatus: '',
		clearText: 'Netejar', clearStatus: '',
		closeText: 'Tancar', closeStatus: '',
		yearStatus: '', monthStatus: '',
		weekText: 'Sm', weekStatus: '',
		dayStatus: 'D, M d', defaultStatus: '',
		isRTL: false
	};
	$.datepick.setDefaults($.datepick.regional['ca']);
})(jQuery);
﻿/* http://keith-wood.name/datepick.html
   Czech localisation for jQuery Datepicker.
   Written by Tomas Muller (tomas@tomas-muller.net). */
(function($) {
	$.datepick.regional['cs'] = {
		monthNames: ['leden','únor','březen','duben','květen','červen',
		'červenec','srpen','září','říjen','listopad','prosinec'],
		monthNamesShort: ['led','úno','bře','dub','kvě','čer',
		'čvc','srp','zář','říj','lis','pro'],
		dayNames: ['neděle', 'pondělí', 'úterý', 'středa', 'čtvrtek', 'pátek', 'sobota'],
		dayNamesShort: ['ne', 'po', 'út', 'st', 'čt', 'pá', 'so'],
		dayNamesMin: ['ne','po','út','st','čt','pá','so'],
		dateFormat: 'dd.mm.yyyy', firstDay: 1,
		renderer: $.datepick.defaultRenderer,
		prevText: '&#x3c;Dříve', prevStatus: 'Přejít na předchozí měsí',
		prevJumpText: '&#x3c;&#x3c;', prevJumpStatus: '',
		nextText: 'Později&#x3e;', nextStatus: 'Přejít na další měsíc',
		nextJumpText: '&#x3e;&#x3e;', nextJumpStatus: '',
		currentText: 'Nyní', currentStatus: 'Přejde na aktuální měsíc',
		todayText: 'Nyní', todayStatus: 'Přejde na aktuální měsíc',
		clearText: 'Vymazat', clearStatus: 'Vymaže zadané datum',
		closeText: 'Zavřít',  closeStatus: 'Zavře kalendář beze změny',
		yearStatus: 'Přejít na jiný rok', monthStatus: 'Přejít na jiný měsíc',
		weekText: 'Týd', weekStatus: 'Týden v roce',
		dayStatus: '\'Vyber\' DD, M d', defaultStatus: 'Vyberte datum',
		isRTL: false
	};
	$.datepick.setDefaults($.datepick.regional['cs']);
})(jQuery);
﻿/* http://keith-wood.name/datepick.html
   Danish localisation for jQuery Datepicker.
   Written by Jan Christensen ( deletestuff@gmail.com). */
(function($) {
    $.datepick.regional['da'] = {
        monthNames: ['Januar','Februar','Marts','April','Maj','Juni',
        'Juli','August','September','Oktober','November','December'],
        monthNamesShort: ['Jan','Feb','Mar','Apr','Maj','Jun',
        'Jul','Aug','Sep','Okt','Nov','Dec'],
		dayNames: ['Søndag','Mandag','Tirsdag','Onsdag','Torsdag','Fredag','Lørdag'],
		dayNamesShort: ['Søn','Man','Tir','Ons','Tor','Fre','Lør'],
		dayNamesMin: ['Sø','Ma','Ti','On','To','Fr','Lø'],
        dateFormat: 'dd-mm-yyyy', firstDay: 0,
		renderer: $.datepick.defaultRenderer,
        prevText: '&#x3c;Forrige', prevStatus: 'Vis forrige måned',
		prevJumpText: '&#x3c;&#x3c;', prevJumpStatus: '',
		nextText: 'Næste&#x3e;', nextStatus: 'Vis næste måned',
		nextJumpText: '&#x3e;&#x3e;', nextJumpStatus: '',
		currentText: 'Idag', currentStatus: 'Vis aktuel måned',
		todayText: 'Idag', todayStatus: 'Vis aktuel måned',
		clearText: 'Nulstil', clearStatus: 'Nulstil den aktuelle dato',
		closeText: 'Luk', closeStatus: 'Luk uden ændringer',
		yearStatus: 'Vis et andet år', monthStatus: 'Vis en anden måned',
		weekText: 'Uge', weekStatus: 'Årets uge',
		dayStatus: 'Vælg D, M d', defaultStatus: 'Vælg en dato',
		isRTL: false
	};
    $.datepick.setDefaults($.datepick.regional['da']);
})(jQuery);
﻿/* http://keith-wood.name/datepick.html
   Swiss-German localisation for jQuery Datepicker.
   Written by Douglas Jose & Juerg Meier. */
(function($) {
	$.datepick.regional['de-CH'] = {
		monthNames: ['Januar','Februar','März','April','Mai','Juni',
		'Juli','August','September','Oktober','November','Dezember'],
		monthNamesShort: ['Jan','Feb','Mär','Apr','Mai','Jun',
		'Jul','Aug','Sep','Okt','Nov','Dez'],
		dayNames: ['Sonntag','Montag','Dienstag','Mittwoch','Donnerstag','Freitag','Samstag'],
		dayNamesShort: ['So','Mo','Di','Mi','Do','Fr','Sa'],
		dayNamesMin: ['So','Mo','Di','Mi','Do','Fr','Sa'],
		dateFormat: ['dd.mm.yy', 'd.m.', 'd.m', 'd.mm.', 'd.mm', 'dd.mm.', 'dd.mm','d.m.yy', 'dd.mm.yyyy'], firstDay: 1,
		renderer: $.datepick.defaultRenderer,
		prevText: '&#x3c;zurück', prevStatus: 'letzten Monat zeigen',
		prevJumpText: '&#x3c;&#x3c;', prevJumpStatus: '',
		nextText: 'nächster&#x3e;', nextStatus: 'nächsten Monat zeigen',
		nextJumpText: '&#x3e;&#x3e;', nextJumpStatus: '',
		currentText: 'heute', currentStatus: '',
		todayText: 'heute', todayStatus: '',
		clearText: 'löschen', clearStatus: 'aktuelles Datum löschen',
		closeText: 'schliessen', closeStatus: 'ohne Änderungen schliessen',
		yearStatus: 'anderes Jahr anzeigen', monthStatus: 'anderen Monat anzeigen',
		weekText: 'Wo', weekStatus: 'Woche des Monats',
		dayStatus: 'Wähle D, M d', defaultStatus: 'Wähle ein Datum',
		isRTL: false
	};
	$.datepick.setDefaults($.datepick.regional['de-CH']);
})(jQuery);
﻿/* http://keith-wood.name/datepick.html
   German localisation for jQuery Datepicker.
   Written by Milian Wolff (mail@milianw.de). */
(function($) {
	$.datepick.regional['de'] = {
		monthNames: ['Januar','Februar','März','April','Mai','Juni',
		'Juli','August','September','Oktober','November','Dezember'],
		monthNamesShort: ['Jan','Feb','Mär','Apr','Mai','Jun',
		'Jul','Aug','Sep','Okt','Nov','Dez'],
		dayNames: ['Sonntag','Montag','Dienstag','Mittwoch','Donnerstag','Freitag','Samstag'],
		dayNamesShort: ['So','Mo','Di','Mi','Do','Fr','Sa'],
		dayNamesMin: ['So','Mo','Di','Mi','Do','Fr','Sa'],
		dateFormat: ['dd.mm.yy', 'd.m.', 'd.m', 'd.mm.', 'd.mm', 'dd.mm.', 'dd.mm','d.m.yy', 'dd.mm.yyyy'], firstDay: 1,
		renderer: $.datepick.defaultRenderer,
		prevText: '&#x3c;zurück', prevStatus: 'letzten Monat zeigen',
		prevJumpText: '&#x3c;&#x3c;', prevJumpStatus: '',
		nextText: 'Vor&#x3e;', nextStatus: 'nächsten Monat zeigen',
		nextJumpText: '&#x3e;&#x3e;', nextJumpStatus: '',
		currentText: 'heute', currentStatus: '',
		todayText: 'heute', todayStatus: '',
		clearText: 'löschen', clearStatus: 'aktuelles Datum löschen',
		closeText: 'schließen', closeStatus: 'ohne Änderungen schließen',
		yearStatus: 'anderes Jahr anzeigen', monthStatus: 'anderen Monat anzeigen',
		weekText: 'Wo', weekStatus: 'Woche des Monats',
		dayStatus: 'Wähle D, M d', defaultStatus: 'Wähle ein Datum',
		isRTL: false
	};
	$.datepick.setDefaults($.datepick.regional['de']);
})(jQuery);
﻿/* http://keith-wood.name/datepick.html
   Greek localisation for jQuery Datepicker.
   Written by Alex Cicovic (http://www.alexcicovic.com) */
(function($) {
	$.datepick.regional['el'] = {
		monthNames: ['Ιανουάριος','Φεβρουάριος','Μάρτιος','Απρίλιος','Μάιος','Ιούνιος',
		'Ιούλιος','Αύγουστος','Σεπτέμβριος','Οκτώβριος','Νοέμβριος','Δεκέμβριος'],
		monthNamesShort: ['Ιαν','Φεβ','Μαρ','Απρ','Μαι','Ιουν',
		'Ιουλ','Αυγ','Σεπ','Οκτ','Νοε','Δεκ'],
		dayNames: ['Κυριακή','Δευτέρα','Τρίτη','Τετάρτη','Πέμπτη','Παρασκευή','Σάββατο'],
		dayNamesShort: ['Κυρ','Δευ','Τρι','Τετ','Πεμ','Παρ','Σαβ'],
		dayNamesMin: ['Κυ','Δε','Τρ','Τε','Πε','Πα','Σα'],
		dateFormat: 'dd/mm/yyyy', firstDay: 1,
		renderer: $.datepick.defaultRenderer,
		prevText: 'Προηγούμενος', prevStatus: 'Επισκόπηση προηγούμενου μήνα',
		prevJumpText: '&#x3c;&#x3c;', prevJumpStatus: '',
		nextText: 'Επόμενος', nextStatus: 'Επισκόπηση επόμενου μήνα',
		nextJumpText: '&#x3e;&#x3e;', nextJumpStatus: '',
		currentText: 'Τρέχων Μήνας', currentStatus: 'Επισκόπηση τρέχοντος μήνα',
		todayText: 'Τρέχων Μήνας', todayStatus: 'Επισκόπηση τρέχοντος μήνα',
		clearText: 'Σβήσιμο', clearStatus: 'Σβήσιμο της επιλεγμένης ημερομηνίας',
		closeText: 'Κλείσιμο', closeStatus: 'Κλείσιμο χωρίς αλλαγή',
		yearStatus: 'Επισκόπηση άλλου έτους', monthStatus: 'Επισκόπηση άλλου μήνα',
		weekText: 'Εβδ', weekStatus: '',
		dayStatus: 'Επιλογή DD d MM', defaultStatus: 'Επιλέξτε μια ημερομηνία',
		isRTL: false
	};
	$.datepick.setDefaults($.datepick.regional['el']);
})(jQuery);
﻿/* http://keith-wood.name/datepick.html
   English/Australia localisation for jQuery Datepicker.
   Based on en-GB. */
(function($) {
	$.datepick.regional['en-AU'] = {
		monthNames: ['January','February','March','April','May','June',
		'July','August','September','October','November','December'],
		monthNamesShort: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
		'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
		dayNames: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
		dayNamesShort: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
		dayNamesMin: ['Su','Mo','Tu','We','Th','Fr','Sa'],
		dateFormat: ['dd/mm/yy', 'd/m', 'd/mm', 'dd/mm', 'd/m/yy', 'dd/mm/yyyy'], firstDay: 1,
		renderer: $.datepick.defaultRenderer,
		prevText: 'Prev', prevStatus: 'Show the previous month',
		prevJumpText: '&#x3c;&#x3c;', prevJumpStatus: 'Show the previous year',
		nextText: 'Next', nextStatus: 'Show the next month',
		nextJumpText: '&#x3e;&#x3e;', nextJumpStatus: 'Show the next year',
		currentText: 'Current', currentStatus: 'Show the current month',
		todayText: 'Today', todayStatus: 'Show today\'s month',
		clearText: 'Clear', clearStatus: 'Erase the current date',
		closeText: 'Done', closeStatus: 'Close without change',
		yearStatus: 'Show a different year', monthStatus: 'Show a different month',
		weekText: 'Wk', weekStatus: 'Week of the year',
		dayStatus: 'Select DD, M d', defaultStatus: 'Select a date',
		isRTL: false
	};
	$.datepick.setDefaults($.datepick.regional['en-AU']);
})(jQuery);
﻿/* http://keith-wood.name/datepick.html
   English UK localisation for jQuery Datepicker.
   Written by Stuart. */
(function($) {
	$.datepick.regional['en-GB'] = {
		monthNames: ['January','February','March','April','May','June',
		'July','August','September','October','November','December'],
		monthNamesShort: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
		'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
		dayNames: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
		dayNamesShort: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
		dayNamesMin: ['Su','Mo','Tu','We','Th','Fr','Sa'],
		dateFormat: ['dd/mm/yy', 'd/m', 'd/mm', 'dd/mm', 'd/m/yy', 'dd/mm/yyyy'], firstDay: 1,
		renderer: $.datepick.defaultRenderer,
		prevText: 'Prev', prevStatus: 'Show the previous month',
		prevJumpText: '&#x3c;&#x3c;', prevJumpStatus: 'Show the previous year',
		nextText: 'Next', nextStatus: 'Show the next month',
		nextJumpText: '&#x3e;&#x3e;', nextJumpStatus: 'Show the next year',
		currentText: 'Current', currentStatus: 'Show the current month',
		todayText: 'Today', todayStatus: 'Show today\'s month',
		clearText: 'Clear', clearStatus: 'Erase the current date',
		closeText: 'Done', closeStatus: 'Close without change',
		yearStatus: 'Show a different year', monthStatus: 'Show a different month',
		weekText: 'Wk', weekStatus: 'Week of the year',
		dayStatus: 'Select DD, M d', defaultStatus: 'Select a date',
		isRTL: false
	};
	$.datepick.setDefaults($.datepick.regional['en-GB']);
})(jQuery);
﻿/* http://keith-wood.name/datepick.html
   English/New Zealand localisation for jQuery Datepicker.
   Based on en-GB. */
(function($) {
	$.datepick.regional['en-NZ'] = {
		monthNames: ['January','February','March','April','May','June',
		'July','August','September','October','November','December'],
		monthNamesShort: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
		'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
		dayNames: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
		dayNamesShort: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
		dayNamesMin: ['Su','Mo','Tu','We','Th','Fr','Sa'],
		dateFormat: ['dd/mm/yy', 'd/m', 'd/mm', 'dd/mm', 'd/m/yy', 'dd/mm/yyyy'], firstDay: 1,
		renderer: $.datepick.defaultRenderer,
		prevText: 'Prev', prevStatus: 'Show the previous month',
		prevJumpText: '&#x3c;&#x3c;', prevJumpStatus: 'Show the previous year',
		nextText: 'Next', nextStatus: 'Show the next month',
		nextJumpText: '&#x3e;&#x3e;', nextJumpStatus: 'Show the next year',
		currentText: 'Current', currentStatus: 'Show the current month',
		todayText: 'Today', todayStatus: 'Show today\'s month',
		clearText: 'Clear', clearStatus: 'Erase the current date',
		closeText: 'Done', closeStatus: 'Close without change',
		yearStatus: 'Show a different year', monthStatus: 'Show a different month',
		weekText: 'Wk', weekStatus: 'Week of the year',
		dayStatus: 'Select DD, M d', defaultStatus: 'Select a date',
		isRTL: false
	};
	$.datepick.setDefaults($.datepick.regional['en-NZ']);
})(jQuery);
/* http://keith-wood.name/datepick.html
   English US localisation for jQuery Datepicker.
   Written by MARCS. */
(function($) {
	$.datepick.regional['en'] = {
		monthNames: ['January','February','March','April','May','June',
		'July','August','September','October','November','December'],
		monthNamesShort: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
		'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
		dayNames: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
		dayNamesShort: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
		dayNamesMin: ['Su','Mo','Tu','We','Th','Fr','Sa'],
		dateFormat: ['dd/mm/yy', 'd/m', 'd/mm', 'dd/mm', 'd/m/yy', 'dd/mm/yyyy'], firstDay: 1,
		renderer: $.datepick.defaultRenderer,
		prevText: 'Prev', prevStatus: 'Show the previous month',
		prevJumpText: '&#x3c;&#x3c;', prevJumpStatus: 'Show the previous year',
		nextText: 'Next', nextStatus: 'Show the next month',
		nextJumpText: '&#x3e;&#x3e;', nextJumpStatus: 'Show the next year',
		currentText: 'Current', currentStatus: 'Show the current month',
		todayText: 'Today', todayStatus: 'Show today\'s month',
		clearText: 'Clear', clearStatus: 'Erase the current date',
		closeText: 'Done', closeStatus: 'Close without change',
		yearStatus: 'Show a different year', monthStatus: 'Show a different month',
		weekText: 'Wk', weekStatus: 'Week of the year',
		dayStatus: 'Select DD, M d', defaultStatus: 'Select a date',
		isRTL: false
	};
	$.datepick.setDefaults($.datepick.regional['en-GB']);
})(jQuery);
/* http://keith-wood.name/datepick.html
   Esperanto localisation for jQuery Datepicker.
   Written by Olivier M. (olivierweb@ifrance.com). */
(function($) {
	$.datepick.regional['eo'] = {
		monthNames: ['Januaro','Februaro','Marto','Aprilo','Majo','Junio',
		'Julio','Aŭgusto','Septembro','Oktobro','Novembro','Decembro'],
		monthNamesShort: ['Jan','Feb','Mar','Apr','Maj','Jun',
		'Jul','Aŭg','Sep','Okt','Nov','Dec'],
		dayNames: ['Dimanĉo','Lundo','Mardo','Merkredo','Ĵaŭdo','Vendredo','Sabato'],
		dayNamesShort: ['Dim','Lun','Mar','Mer','Ĵaŭ','Ven','Sab'],
		dayNamesMin: ['Di','Lu','Ma','Me','Ĵa','Ve','Sa'],
		dateFormat: 'dd/mm/yyyy', firstDay: 0,
		renderer: $.datepick.defaultRenderer,
		prevText: '&lt;Anta', prevStatus: 'Vidi la antaŭan monaton',
		prevJumpText: '&#x3c;&#x3c;', prevJumpStatus: '',
		nextText: 'Sekv&gt;', nextStatus: 'Vidi la sekvan monaton',
		nextJumpText: '&#x3e;&#x3e;', nextJumpStatus: '',
		currentText: 'Nuna', currentStatus: 'Vidi la nunan monaton',
		todayText: 'Nuna', todayStatus: 'Vidi la nunan monaton',
		clearText: 'Vakigi', clearStatus: '',
		closeText: 'Fermi', closeStatus: 'Fermi sen modifi',
		yearStatus: 'Vidi alian jaron', monthStatus: 'Vidi alian monaton',
		weekText: 'Sb', weekStatus: '',
		dayStatus: 'Elekti DD, MM d', defaultStatus: 'Elekti la daton',
		isRTL: false
	};
	$.datepick.setDefaults($.datepick.regional['eo']);
})(jQuery);
﻿/* http://keith-wood.name/datepick.html
   Spanish/Argentina localisation for jQuery Datepicker.
   Written by Esteban Acosta Villafane (esteban.acosta@globant.com) of Globant (http://www.globant.com). */
(function($) {
	$.datepick.regional['es-AR'] = {
		monthNames: ['Enero','Febrero','Marzo','Abril','Mayo','Junio',
		'Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'],
		monthNamesShort: ['Ene','Feb','Mar','Abr','May','Jun',
		'Jul','Ago','Sep','Oct','Nov','Dic'],
		dayNames: ['Domingo','Lunes','Martes','Miércoles','Jueves','Viernes','Sábado'],
		dayNamesShort: ['Dom','Lun','Mar','Mié','Juv','Vie','Sáb'],
		dayNamesMin: ['Do','Lu','Ma','Mi','Ju','Vi','Sá'],
		dateFormat: 'dd/mm/yyyy', firstDay: 0,
		renderer: $.datepick.defaultRenderer,
		prevText: '&#x3c;Ant', prevStatus: '',
		prevJumpText: '&#x3c;&#x3c;', prevJumpStatus: '',
		nextText: 'Sig&#x3e;', nextStatus: '',
		nextJumpText: '&#x3e;&#x3e;', nextJumpStatus: '',
		currentText: 'Hoy', currentStatus: '',
		todayText: 'Hoy', todayStatus: '',
		clearText: 'Limpiar', clearStatus: '',
		closeText: 'Cerrar', closeStatus: '',
		yearStatus: '', monthStatus: '',
		weekText: 'Sm', weekStatus: '',
		dayStatus: 'D, M d', defaultStatus: '',
		isRTL: false
	};
	$.datepick.setDefaults($.datepick.regional['es-AR']);
})(jQuery);
﻿/* http://keith-wood.name/datepick.html
   Spanish/Perú localisation for jQuery Datepicker.
   Written by Fischer Tirado (fishdev@globant.com) of ASIX (http://www.asixonline.com). */
(function($) {
	$.datepick.regional['es-PE'] = {
		monthNames: ['Enero','Febrero','Marzo','Abril','Mayo','Junio',
		'Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'],
		monthNamesShort: ['Ene','Feb','Mar','Abr','May','Jun',
		'Jul','Ago','Sep','Oct','Nov','Dic'],
		dayNames: ['Domingo','Lunes','Martes','Miércoles','Jueves','Viernes','Sábado'],
		dayNamesShort: ['Dom','Lun','Mar','Mié','Jue','Vie','Sab'],
		dayNamesMin: ['Do','Lu','Ma','Mi','Ju','Vi','Sa'],
		dateFormat: 'dd/mm/yyyy', firstDay: 0,
		renderer: $.datepick.defaultRenderer,
		prevText: '&#x3c;Ant', prevStatus: '',
		prevJumpText: '&#x3c;&#x3c;', prevJumpStatus: '',
		nextText: 'Sig&#x3e;', nextStatus: '',
		nextJumpText: '&#x3e;&#x3e;', nextJumpStatus: '',
		currentText: 'Hoy', currentStatus: '',
		todayText: 'Hoy', todayStatus: '',
		clearText: 'Limpiar', clearStatus: '',
		closeText: 'Cerrar', closeStatus: '',
		yearStatus: '', monthStatus: '',
		weekText: 'Sm', weekStatus: '',
		dayStatus: 'DD d, MM yyyy', defaultStatus: '',
		isRTL: false
	};
	$.datepick.setDefaults($.datepick.regional['es-PE']);
})(jQuery);
﻿/* http://keith-wood.name/datepick.html
   Spanish localisation for jQuery Datepicker.
   Traducido por Vester (xvester@gmail.com). */
(function($) {
	$.datepick.regional['es'] = {
		monthNames: ['Enero','Febrero','Marzo','Abril','Mayo','Junio',
		'Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'],
		monthNamesShort: ['Ene','Feb','Mar','Abr','May','Jun',
		'Jul','Ago','Sep','Oct','Nov','Dic'],
		dayNames: ['Domingo','Lunes','Martes','Miércoles','Jueves','Viernes','Sábado'],
		dayNamesShort: ['Dom','Lun','Mar','Mié','Juv','Vie','Sáb'],
		dayNamesMin: ['Do','Lu','Ma','Mi','Ju','Vi','Sá'],
		dateFormat: 'dd/mm/yyyy', firstDay: 1,
		renderer: $.datepick.defaultRenderer,
		prevText: '&#x3c;Ant', prevStatus: '',
		prevJumpText: '&#x3c;&#x3c;', prevJumpStatus: '',
		nextText: 'Sig&#x3e;', nextStatus: '',
		nextJumpText: '&#x3e;&#x3e;', nextJumpStatus: '',
		currentText: 'Hoy', currentStatus: '',
		todayText: 'Hoy', todayStatus: '',
		clearText: 'Limpiar', clearStatus: '',
		closeText: 'Cerrar', closeStatus: '',
		yearStatus: '', monthStatus: '',
		weekText: 'Sm', weekStatus: '',
		dayStatus: 'D, M d', defaultStatus: '',
		isRTL: false
	};
	$.datepick.setDefaults($.datepick.regional['es']);
})(jQuery);
﻿/* http://keith-wood.name/datepick.html
   Estonian localisation for jQuery Datepicker.
   Written by Mart Sõmermaa (mrts.pydev at gmail com). */
(function($) {
	$.datepick.regional['et'] = {
		monthNames: ['Jaanuar','Veebruar','Märts','Aprill','Mai','Juuni',
			'Juuli','August','September','Oktoober','November','Detsember'],
		monthNamesShort: ['Jaan', 'Veebr', 'Märts', 'Apr', 'Mai', 'Juuni',
			'Juuli', 'Aug', 'Sept', 'Okt', 'Nov', 'Dets'],
		dayNames: ['Pühapäev', 'Esmaspäev', 'Teisipäev', 'Kolmapäev', 'Neljapäev', 'Reede', 'Laupäev'],
		dayNamesShort: ['Pühap', 'Esmasp', 'Teisip', 'Kolmap', 'Neljap', 'Reede', 'Laup'],
		dayNamesMin: ['P','E','T','K','N','R','L'],
		dateFormat: 'dd.mm.yyyy', firstDay: 1,
		renderer: $.datepick.defaultRenderer,
		prevText: 'Eelnev', prevStatus: '',
		prevJumpText: '&#x3c;&#x3c;', prevJumpStatus: '',
		nextText: 'Järgnev', nextStatus: '',
		nextJumpText: '&#x3e;&#x3e;', nextJumpStatus: '',
		currentText: 'Täna', currentStatus: '',
		todayText: 'Täna', todayStatus: '',
		clearText: '', clearStatus: '',
		closeText: 'Sulge', closeStatus: '',
		yearStatus: '', monthStatus: '',
		weekText: 'Sm', weekStatus: '',
		dayStatus: '', defaultStatus: '',
		isRTL: false
	};
	$.datepick.setDefaults($.datepick.regional['et']);
})(jQuery);
﻿/* http://keith-wood.name/datepick.html
   Basque localisation for jQuery Datepicker.
   Karrikas-ek itzulia (karrikas@karrikas.com) */
(function($){
	$.datepick.regional['eu'] = {
		monthNames: ['Urtarrila','Otsaila','Martxoa','Apirila','Maiatza','Ekaina',
		'Uztaila','Abuztua','Iraila','Urria','Azaroa','Abendua'],
		monthNamesShort: ['Urt','Ots','Mar','Api','Mai','Eka',
		'Uzt','Abu','Ira','Urr','Aza','Abe'],
		dayNames: ['Igandea','Astelehena','Asteartea','Asteazkena','Osteguna','Ostirala','Larunbata'],
		dayNamesShort: ['Iga','Ast','Ast','Ast','Ost','Ost','Lar'],
		dayNamesMin: ['Ig','As','As','As','Os','Os','La'],
		dateFormat: 'yyyy/mm/dd', firstDay: 1,
		renderer: $.datepick.defaultRenderer,
		prevText: '&#x3c;Aur', prevStatus: '',
		prevJumpText: '&#x3c;&#x3c;', prevJumpStatus: '',
		nextText: 'Hur&#x3e;', nextStatus: '',
		nextJumpText: '&#x3e;&#x3e;', nextJumpStatus: '',
		currentText: 'Gaur', currentStatus: '',
		todayText: 'Gaur', todayStatus: '',
		clearText: 'X', clearStatus: '',
		closeText: 'Egina', closeStatus: '',
		yearStatus: '', monthStatus: '',
		weekText: 'Wk', weekStatus: '',
		dayStatus: 'DD d MM', defaultStatus: '',
		isRTL: false
	};
	$.datepick.setDefaults($.datepick.regional['eu']);
})(jQuery);
﻿/* http://keith-wood.name/datepick.html
   Persian (Farsi) localisation for jQuery Datepicker.
   Javad Mowlanezhad -- jmowla@gmail.com */
(function($) {
	$.datepick.regional['fa'] = {
		monthNames: ['فروردين','ارديبهشت','خرداد','تير','مرداد','شهريور',
		'مهر','آبان','آذر','دي','بهمن','اسفند'],
		monthNamesShort: ['1','2','3','4','5','6',
		'7','8','9','10','11','12'],
		dayNames: ['يکشنبه','دوشنبه','سه‌شنبه','چهارشنبه','پنجشنبه','جمعه','شنبه'],
		dayNamesShort: ['ي','د','س','چ','پ','ج', 'ش'],
		dayNamesMin: ['ي','د','س','چ','پ','ج', 'ش'],
		dateFormat: 'yyyy/mm/dd', firstDay: 6,
		renderer: $.datepick.defaultRenderer,
		prevText: '&#x3c;قبلي', prevStatus: 'نمايش ماه قبل',
		prevJumpText: '&#x3c;&#x3c;', prevJumpStatus: '',
		nextText: 'بعدي&#x3e;', nextStatus: 'نمايش ماه بعد',
		nextJumpText: '&#x3e;&#x3e;', nextJumpStatus: '',
		currentText: 'امروز', currentStatus: 'نمايش ماه جاري',
		todayText: 'امروز', todayStatus: 'نمايش ماه جاري',
		clearText: 'حذف تاريخ', clearStatus: 'پاک کردن تاريخ جاري',
		closeText: 'بستن', closeStatus: 'بستن بدون اعمال تغييرات',
		yearStatus: 'نمايش سال متفاوت', monthStatus: 'نمايش ماه متفاوت',
		weekText: 'هف', weekStatus: 'هفتهِ سال',
		dayStatus: 'انتخاب D, M d', defaultStatus: 'انتخاب تاريخ',
		isRTL: true
	};
	$.datepick.setDefaults($.datepick.regional['fa']);
})(jQuery);
/* http://keith-wood.name/datepick.html
   Finnish localisation for jQuery Datepicker.
   Written by Harri Kilpiö (harrikilpio@gmail.com). */
(function($) {
    $.datepick.regional['fi'] = {
        monthNames: ['Tammikuu','Helmikuu','Maaliskuu','Huhtikuu','Toukokuu','Kes&auml;kuu',
        'Hein&auml;kuu','Elokuu','Syyskuu','Lokakuu','Marraskuu','Joulukuu'],
        monthNamesShort: ['Tammi','Helmi','Maalis','Huhti','Touko','Kes&auml;',
        'Hein&auml;','Elo','Syys','Loka','Marras','Joulu'],
		dayNamesShort: ['Su','Ma','Ti','Ke','To','Pe','Su'],
		dayNames: ['Sunnuntai','Maanantai','Tiistai','Keskiviikko','Torstai','Perjantai','Lauantai'],
		dayNamesMin: ['Su','Ma','Ti','Ke','To','Pe','La'],
        dateFormat: 'dd.mm.yyyy', firstDay: 1,
		renderer: $.datepick.defaultRenderer,
		prevText: '&laquo;Edellinen', prevStatus: '',
		prevJumpText: '&#x3c;&#x3c;', prevJumpStatus: '',
		nextText: 'Seuraava&raquo;', nextStatus: '',
		nextJumpText: '&#x3e;&#x3e;', nextJumpStatus: '',
		currentText: 'T&auml;n&auml;&auml;n', currentStatus: '',
		todayText: 'T&auml;n&auml;&auml;n', todayStatus: '',
		clearText: 'Tyhjenn&auml;', clearStatus: '',
		closeText: 'Sulje', closeStatus: '',
		yearStatus: '', monthStatus: '',
		weekText: 'Vk', weekStatus: '',
		dayStatus: 'D, M d', defaultStatus: '',
		isRTL: false
	};
    $.datepick.setDefaults($.datepick.regional['fi']);
})(jQuery);
﻿/* http://keith-wood.name/datepick.html
   Faroese localisation for jQuery Datepicker.
   Written by Sverri Mohr Olsen, sverrimo@gmail.com */
(function($) {
	$.datepick.regional['fo'] = {
		monthNames: ['Januar','Februar','Mars','Apríl','Mei','Juni',
		'Juli','August','September','Oktober','November','Desember'],
		monthNamesShort: ['Jan','Feb','Mar','Apr','Mei','Jun',
		'Jul','Aug','Sep','Okt','Nov','Des'],
		dayNames: ['Sunnudagur','Mánadagur','Týsdagur','Mikudagur','Hósdagur','Fríggjadagur','Leyardagur'],
		dayNamesShort: ['Sun','Mán','Týs','Mik','Hós','Frí','Ley'],
		dayNamesMin: ['Su','Má','Tý','Mi','Hó','Fr','Le'],
		dateFormat: 'dd-mm-yyyy', firstDay: 0,
		renderer: $.datepick.defaultRenderer,
		prevText: '&#x3c;Sísta', prevStatus: 'Vís sísta mánaðan',
		prevJumpText: '&#x3c;&#x3c;', prevJumpStatus: 'Vís sísta árið',
		nextText: 'Næsta&#x3e;', nextStatus: 'Vís næsta mánaðan',
		nextJumpText: '&#x3e;&#x3e;', nextJumpStatus: 'Vís næsta árið',
		currentText: 'Í dag', currentStatus: 'Vís mánaðan fyri í dag',
		todayText: 'Í dag', todayStatus: 'Vís mánaðan fyri í dag',
		clearText: 'Strika', clearStatus: 'Strika allir mánaðarnar',
		closeText: 'Goym', closeStatus: 'Goym hetta vindeyðga',
		yearStatus: 'Broyt árið', monthStatus: 'Broyt mánaðan',
		weekText: 'Vk', weekStatus: 'Vika av árinum',
		dayStatus: 'Vel DD, M d, yyyy', defaultStatus: 'Vel ein dato',
		isRTL: false
	};
	$.datepick.setDefaults($.datepick.regional['fo']);
})(jQuery);
﻿/* http://keith-wood.name/datepick.html
   Swiss French localisation for jQuery Datepicker.
   Written by Martin Voelkle (martin.voelkle@e-tc.ch). */
(function($) {
	$.datepick.regional['fr-CH'] = {
		monthNames: ['Janvier','Février','Mars','Avril','Mai','Juin',
		'Juillet','Août','Septembre','Octobre','Novembre','Décembre'],
		monthNamesShort: ['Jan','Fév','Mar','Avr','Mai','Jun',
		'Jul','Aoû','Sep','Oct','Nov','Déc'],
		dayNames: ['Dimanche','Lundi','Mardi','Mercredi','Jeudi','Vendredi','Samedi'],
		dayNamesShort: ['Dim','Lun','Mar','Mer','Jeu','Ven','Sam'],
		dayNamesMin: ['Di','Lu','Ma','Me','Je','Ve','Sa'],
		dateFormat: 'dd.mm.yyyy', firstDay: 1,
		renderer: $.datepick.defaultRenderer,
		prevText: '&#x3c;Préc', prevStatus: 'Voir le mois précédent',
		prevJumpText: '&#x3c;&#x3c;', prevJumpStatus: '',
		nextText: 'Suiv&#x3e;', nextStatus: 'Voir le mois suivant',
		nextJumpText: '&#x3e;&#x3e;', nextJumpStatus: '',
		currentText: 'Courant', currentStatus: 'Voir le mois courant',
		todayText: 'Aujourd\'hui', todayStatus: 'Voir aujourd\'hui',
		clearText: 'Effacer', clearStatus: 'Effacer la date sélectionnée',
		closeText: 'Fermer', closeStatus: 'Fermer sans modifier',
		yearStatus: 'Voir une autre année', monthStatus: 'Voir un autre mois',
		weekText: 'Sm', weekStatus: '',
		dayStatus: '\'Choisir\' le DD d MM', defaultStatus: 'Choisir la date',
		isRTL: false
	};
	$.datepick.setDefaults($.datepick.regional['fr-CH']);
})(jQuery);
﻿/* http://keith-wood.name/datepick.html
   French localisation for jQuery Datepicker.
   Stéphane Nahmani (sholby@sholby.net). */
(function($) {
	$.datepick.regional['fr'] = {
		monthNames: ['Janvier','Février','Mars','Avril','Mai','Juin',
		'Juillet','Août','Septembre','Octobre','Novembre','Décembre'],
		monthNamesShort: ['Jan','Fév','Mar','Avr','Mai','Jun',
		'Jul','Aoû','Sep','Oct','Nov','Déc'],
		dayNames: ['Dimanche','Lundi','Mardi','Mercredi','Jeudi','Vendredi','Samedi'],
		dayNamesShort: ['Dim','Lun','Mar','Mer','Jeu','Ven','Sam'],
		dayNamesMin: ['Di','Lu','Ma','Me','Je','Ve','Sa'],
		dateFormat: 'dd/mm/yyyy', firstDay: 1,
		renderer: $.datepick.defaultRenderer,
		prevText: '&#x3c;Préc', prevStatus: 'Voir le mois précédent',
		prevJumpText: '&#x3c;&#x3c;', prevJumpStatus: 'Voir l\'année précédent',
		nextText: 'Suiv&#x3e;', nextStatus: 'Voir le mois suivant',
		nextJumpText: '&#x3e;&#x3e;', nextJumpStatus: 'Voir l\'année suivant',
		currentText: 'Courant', currentStatus: 'Voir le mois courant',
		todayText: 'Aujourd\'hui', todayStatus: 'Voir aujourd\'hui',
		clearText: 'Effacer', clearStatus: 'Effacer la date sélectionnée',
		closeText: 'Fermer', closeStatus: 'Fermer sans modifier',
		yearStatus: 'Voir une autre année', monthStatus: 'Voir un autre mois',
		weekText: 'Sm', weekStatus: 'Semaine de l\'année',
		dayStatus: '\'Choisir\' le DD d MM', defaultStatus: 'Choisir la date',
		isRTL: false
	};
	$.datepick.setDefaults($.datepick.regional['fr']);
})(jQuery);
﻿/* http://keith-wood.name/datepick.html
   Galician localisation for jQuery Datepicker.
   Traducido por Manuel (McNuel@gmx.net). */
(function($) {
	$.datepick.regional['gl'] = {
		monthNames: ['Xaneiro','Febreiro','Marzo','Abril','Maio','Xuño',
		'Xullo','Agosto','Setembro','Outubro','Novembro','Decembro'],
		monthNamesShort: ['Xan','Feb','Mar','Abr','Mai','Xuñ',
		'Xul','Ago','Set','Out','Nov','Dec'],
		dayNames: ['Domingo','Luns','Martes','Mércores','Xoves','Venres','Sábado'],
		dayNamesShort: ['Dom','Lun','Mar','Mér','Xov','Ven','Sáb'],
		dayNamesMin: ['Do','Lu','Ma','Me','Xo','Ve','Sá'],
		dateFormat: 'dd/mm/yyyy', firstDay: 1,
		renderer: $.datepick.defaultRenderer,
		prevText: '&#x3c;Ant', prevStatus: 'Amosar mes anterior',
		prevJumpText: '&#x3c;&#x3c;', prevJumpStatus: 'Amosar ano anterior',
		nextText: 'Seg&#x3e;', nextStatus: 'Amosar mes seguinte',
		nextJumpText: '&#x3e;&#x3e;', nextJumpStatus: 'Amosar ano seguinte',
		currentText: 'Hoxe', currentStatus: 'Amosar mes actual',
		todayText: 'Hoxe', todayStatus: 'Amosar mes actual',
		clearText: 'Limpar', clearStatus: 'Borrar data actual',
		closeText: 'Pechar', closeStatus: 'Pechar sen gardar',
		yearStatus: 'Amosar outro ano', monthStatus: 'Amosar outro mes',
		weekText: 'Sm', weekStatus: 'Semana do ano',
		dayStatus: 'D, M d', defaultStatus: 'Selecciona Data',
		isRTL: false
	};
	$.datepick.setDefaults($.datepick.regional['gl']);
})(jQuery);
﻿/* http://keith-wood.name/datepick.html
   Gujarati (ગુજરાતી) localisation for jQuery Datepicker.
   Naymesh Mistry (naymesh@yahoo.com). */
(function($) {
	$.datepick.regional['gu'] = {
		monthNames: ['જાન્યુઆરી','ફેબ્રુઆરી','માર્ચ','એપ્રિલ','મે','જૂન',
		'જુલાઈ','ઑગસ્ટ','સપ્ટેમ્બર','ઑક્ટોબર','નવેમ્બર','ડિસેમ્બર'],
		monthNamesShort: ['જાન્યુ','ફેબ્રુ','માર્ચ','એપ્રિલ','મે','જૂન',
		'જુલાઈ','ઑગસ્ટ','સપ્ટે','ઑક્ટો','નવે','ડિસે'],
		dayNames: ['રવિવાર','સોમવાર','મંગળવાર','બુધવાર','ગુરુવાર','શુક્રવાર','શનિવાર'],
		dayNamesShort: ['રવિ','સોમ','મંગળ','બુધ','ગુરુ','શુક્ર','શનિ'],
		dayNamesMin: ['ર','સો','મં','બુ','ગુ','શુ','શ'],
		dateFormat: 'dd-M-yyyy', firstDay: 1,
		renderer: $.datepick.defaultRenderer,
		prevText: '&#x3c;પાછળ', prevStatus: 'પાછલો મહિનો બતાવો',
		prevJumpText: '&#x3c;&#x3c;', prevJumpStatus: 'પાછળ',
		nextText: 'આગળ&#x3e;', nextStatus: 'આગલો મહિનો બતાવો',
		nextJumpText: '&#x3e;&#x3e;', nextJumpStatus: 'આગળ',
		currentText: 'આજે', currentStatus: 'આજનો દિવસ બતાવો',
		todayText: 'આજે', todayStatus: 'આજનો દિવસ',
		clearText: 'ભૂંસો', clearStatus: 'હાલ પસંદ કરેલી તારીખ ભૂંસો',
		closeText: 'બંધ કરો', closeStatus: 'તારીખ પસંદ કર્યા વગર બંધ કરો',
		yearStatus: 'જુદુ વર્ષ બતાવો', monthStatus: 'જુદો મહિનો બતાવો',
		weekText: 'અઠવાડિયું', weekStatus: 'અઠવાડિયું',
		dayStatus: 'અઠવાડિયાનો પહેલો દિવસ પસંદ કરો', defaultStatus: 'તારીખ પસંદ કરો',
		isRTL: false
	};
	$.datepick.setDefaults($.datepick.regional['gu']);
})(jQuery);
﻿/* http://keith-wood.name/datepick.html
   Hebrew localisation for jQuery Datepicker.
   Written by Amir Hardon (ahardon at gmail dot com). */
(function($) {
	$.datepick.regional['he'] = {
		monthNames: ['ינואר','פברואר','מרץ','אפריל','מאי','יוני',
		'יולי','אוגוסט','ספטמבר','אוקטובר','נובמבר','דצמבר'],
		monthNamesShort: ['1','2','3','4','5','6',
		'7','8','9','10','11','12'],
		dayNames: ['ראשון','שני','שלישי','רביעי','חמישי','שישי','שבת'],
		dayNamesShort: ['א\'','ב\'','ג\'','ד\'','ה\'','ו\'','שבת'],
		dayNamesMin: ['א\'','ב\'','ג\'','ד\'','ה\'','ו\'','שבת'],
		dateFormat: 'dd/mm/yyyy', firstDay: 0,
		renderer: $.datepick.defaultRenderer,
		prevText: '&#x3c;הקודם', prevStatus: '',
		prevJumpText: '&#x3c;&#x3c;', prevJumpStatus: '',
		nextText: 'הבא&#x3e;', nextStatus: '',
		nextJumpText: '&#x3e;&#x3e;', nextJumpStatus: '',
		currentText: 'היום', currentStatus: '',
		todayText: 'היום', todayStatus: '',
		clearText: 'נקה', clearStatus: '',
		closeText: 'סגור', closeStatus: '',
		yearStatus: '', monthStatus: '',
		weekText: 'Wk', weekStatus: '',
		dayStatus: 'DD, M d', defaultStatus: '',
		isRTL: true
	};
	$.datepick.setDefaults($.datepick.regional['he']);
})(jQuery);
﻿/* http://keith-wood.name/datepick.html
   Hindi INDIA localisation for jQuery Datepicker.
   Written by Pawan Kumar Singh. */
(function($) {
	$.datepick.regional['hi-IN'] = {
		monthNames: ['जनवरी',' फरवरी', 'मार्च', 'अप्रैल', 'मई', 'जून','जुलाई', 'अगस्त', 'सितम्बर', 'अक्टूबर', 'नवम्बर', 'दिसम्बर'],
		monthNamesShort: ['जन', 'फर', 'मार्च','अप्रै', 'मई', 'जून','जुलाई', 'अग', 'सित', 'अक्टू', 'नव', 'दिस'],
		dayNames: ['रविवार', 'सोमवार', 'मंगलवार', 'बुधवार', 'गुरुवार', 'शुक्रवार', 'शनिवार'],
		dayNamesShort: ['रवि', 'सोम', 'मंगल', 'बुध', 'गुरु', 'शुक्र', 'शनि'],
		dayNamesMin: ['र','सो','मं','बु','गु','शु','श'],
		dateFormat: 'dd/mm/yyyy', firstDay: 1,
		renderer: $.datepick.defaultRenderer,
		prevText: 'पिछला', prevStatus: 'पिछला महीना देखें',
		prevJumpText: '&#x3c;&#x3c;', prevJumpStatus: 'पिछला वर्ष देखें',
		nextText: 'अगला', nextStatus: 'अगला महीना देखें',
		nextJumpText: '&#x3e;&#x3e;', nextJumpStatus: 'अगला वर्ष देखें',
		currentText: 'वर्तमान', currentStatus: 'वर्तमान महीना देखें',
		todayText: 'आज', todayStatus: 'वर्तमान दिन देखें',
		clearText: 'साफ', clearStatus: 'वर्तमान दिनांक मिटाए',
		closeText: 'समाप्त', closeStatus: 'बदलाव के बिना बंद',
		yearStatus: 'एक अलग वर्ष का चयन करें', monthStatus: 'एक अलग महीने का चयन करें',
		weekText: 'Wk', weekStatus: 'वर्ष का सप्ताह',
		dayStatus: 'चुने DD, M d', defaultStatus: 'एक तिथि का चयन करें',
		isRTL: false
	};
	$.datepick.setDefaults($.datepick.regional['hi-IN']);
})(jQuery);
/* http://keith-wood.name/datepick.html
   English Hindi localisation for jQuery Datepicker.
   Written by Tirumal Rao of designphilic.com. */
(function($) {
	$.datepick.regional['hi'] = {
		monthNames: ['जनवरी','फरवरी','मार्च','अप्रैल','मई','जून',
		'जुलाई','अगस्त','सितंबर','अक्टूबर','नवंबर','दिसंबर'],
		monthNamesShort: ['जन', 'फ़र.', 'मार्च', 'अप्रैल', 'मई', 'जून',
		'जुलाई','अगस्त','सितंबर','अक्टूबर','नवंबर','दिसंबर'],
		dayNames: ['रविवार', 'सोमवार', 'मंगलवार', 'बुधवार', 'बृहस्पतिवार', 'शुक्रवार', 'शनिवार'],
		dayNamesShort: ['रवि', 'सोम', 'मंगल', 'बुध', 'बृहस्पत', 'शुक्र', 'शनि'],
		dayNamesMin: ['रवि', 'सोम', 'मंगल', 'बुध', 'बृहस्पत', 'शुक्र', 'शनि'],
		dateFormat: 'dd/mm/yyyy', firstDay: 1,
		renderer: $.datepick.defaultRenderer,
		prevText: 'पिछला', prevStatus: 'पिछले महीने',
		prevJumpText: '&#x3c;&#x3c;', prevJumpStatus: 'पिछले वर्ष',
		nextText: 'अगला', nextStatus: 'अगले महीने',
		nextJumpText: '&#x3e;&#x3e;', nextJumpStatus: 'अगले साल',
		currentText: 'वर्तमान', currentStatus: 'चालू माह',
		todayText: 'आज', todayStatus: 'आजका महीना',
		clearText: 'साफ़', clearStatus: 'वर्तमान दिनांक मिटा',
		closeText: 'ठीक है', closeStatus: 'बदलाव के बिना बंद',
		yearStatus: 'एक अलग वर्ष दिखाएँ', monthStatus: 'दिखाएँ किसी अन्य महीने के',
		weekText: 'Wk', weekStatus: 'Week of the year',
		dayStatus: 'चयन DD, M d', defaultStatus: 'एक तिथि का चयन करें',
		isRTL: false
	};
	$.datepick.setDefaults($.datepick.regional['hi']);
})(jQuery);/* http://keith-wood.name/datepick.html
   Croatian localisation for jQuery Datepicker.
   Written by Vjekoslav Nesek. */
(function($) {
	$.datepick.regional['hr'] = {
		monthNames: ['Siječanj','Veljača','Ožujak','Travanj','Svibanj','Lipanj',
		'Srpanj','Kolovoz','Rujan','Listopad','Studeni','Prosinac'],
		monthNamesShort: ['Sij','Velj','Ožu','Tra','Svi','Lip',
		'Srp','Kol','Ruj','Lis','Stu','Pro'],
		dayNames: ['Nedjelja','Ponedjeljak','Utorak','Srijeda','Četvrtak','Petak','Subota'],
		dayNamesShort: ['Ned','Pon','Uto','Sri','Čet','Pet','Sub'],
		dayNamesMin: ['Ne','Po','Ut','Sr','Če','Pe','Su'],
		dateFormat: 'dd.mm.yyyy.', firstDay: 1,
		renderer: $.datepick.defaultRenderer,
		prevText: '&#x3c;', prevStatus: 'Prikaži prethodni mjesec',
		prevJumpText: '&#x3c;&#x3c;', prevJumpStatus: '',
		nextText: '&#x3e;', nextStatus: 'Prikaži slijedeći mjesec',
		nextJumpText: '&#x3e;&#x3e;', nextJumpStatus: '',
		currentText: 'Danas', currentStatus: 'Današnji datum',
		todayText: 'Danas', todayStatus: 'Današnji datum',
		clearText: 'izbriši', clearStatus: 'Izbriši trenutni datum',
		closeText: 'Zatvori', closeStatus: 'Zatvori kalendar',
		yearStatus: 'Prikaži godine', monthStatus: 'Prikaži mjesece',
		weekText: 'Tje', weekStatus: 'Tjedan',
		dayStatus: '\'Datum\' D, M d', defaultStatus: 'Odaberi datum',
		isRTL: false
	};
	$.datepick.setDefaults($.datepick.regional['hr']);
})(jQuery);
/* http://keith-wood.name/datepick.html
   Hungarian localisation for jQuery Datepicker.
   Written by Istvan Karaszi (jquery@spam.raszi.hu). */
(function($) {
	$.datepick.regional['hu'] = {
		monthNames: ['Január', 'Február', 'Március', 'Április', 'Május', 'Június',
		'Július', 'Augusztus', 'Szeptember', 'Október', 'November', 'December'],
		monthNamesShort: ['Jan', 'Feb', 'Már', 'Ápr', 'Máj', 'Jún',
		'Júl', 'Aug', 'Szep', 'Okt', 'Nov', 'Dec'],
		dayNames: ['Vasárnap', 'Hétfö', 'Kedd', 'Szerda', 'Csütörtök', 'Péntek', 'Szombat'],
		dayNamesShort: ['Vas', 'Hét', 'Ked', 'Sze', 'Csü', 'Pén', 'Szo'],
		dayNamesMin: ['V', 'H', 'K', 'Sze', 'Cs', 'P', 'Szo'],
		dateFormat: 'yyyy-mm-dd', firstDay: 1,
		renderer: $.datepick.defaultRenderer,
		prevText: '&laquo;&nbsp;vissza', prevStatus: '',
		prevJumpText: '&#x3c;&#x3c;', prevJumpStatus: '',
		nextText: 'előre&nbsp;&raquo;', nextStatus: '',
		nextJumpText: '&#x3e;&#x3e;', nextJumpStatus: '',
		currentText: 'ma', currentStatus: '',
		todayText: 'ma', todayStatus: '',
		clearText: 'törlés', clearStatus: '',
		closeText: 'bezárás', closeStatus: '',
		yearStatus: '', monthStatus: '',
		weekText: 'Hé', weekStatus: '',
		dayStatus: 'D, M d', defaultStatus: '',
		isRTL: false
	};
	$.datepick.setDefaults($.datepick.regional['hu']);
})(jQuery);
/* http://keith-wood.name/datepick.html
   Armenian localisation for jQuery Datepicker.
   Written by Levon Zakaryan (levon.zakaryan@gmail.com)*/
(function($) {
	$.datepick.regional['hy'] = {
		monthNames: ['Հունվար','Փետրվար','Մարտ','Ապրիլ','Մայիս','Հունիս',
		'Հուլիս','Օգոստոս','Սեպտեմբեր','Հոկտեմբեր','Նոյեմբեր','Դեկտեմբեր'],
		monthNamesShort: ['Հունվ','Փետր','Մարտ','Ապր','Մայիս','Հունիս',
		'Հուլ','Օգս','Սեպ','Հոկ','Նոյ','Դեկ'],
		dayNames: ['կիրակի','եկուշաբթի','երեքշաբթի','չորեքշաբթի','հինգշաբթի','ուրբաթ','շաբաթ'],
		dayNamesShort: ['կիր','երկ','երք','չրք','հնգ','ուրբ','շբթ'],
		dayNamesMin: ['կիր','երկ','երք','չրք','հնգ','ուրբ','շբթ'],
		dateFormat: 'dd.mm.yyyy', firstDay: 1,
		renderer: $.datepick.defaultRenderer,
		prevText: '&#x3c;Նախ.',  prevStatus: '',
		prevJumpText: '&#x3c;&#x3c;', prevJumpStatus: '',
		nextText: 'Հաջ.&#x3e;', nextStatus: '',
		nextJumpText: '&#x3e;&#x3e;', nextJumpStatus: '',
		currentText: 'Այսօր', currentStatus: '',
		todayText: 'Այսօր', todayStatus: '',
		clearText: 'Մաքրել', clearStatus: '',
		closeText: 'Փակել', closeStatus: '',
		yearStatus: '', monthStatus: '',
		weekText: 'ՇԲՏ', weekStatus: '',
		dayStatus: 'D, M d', defaultStatus: '',
		isRTL: false
	};
	$.datepick.setDefaults($.datepick.regional['hy']);
})(jQuery);
/* http://keith-wood.name/datepick.html
   Indonesian localisation for jQuery Datepicker.
   Written by Deden Fathurahman (dedenf@gmail.com). */
(function($) {
	$.datepick.regional['id'] = {
		monthNames: ['Januari','Februari','Maret','April','Mei','Juni',
		'Juli','Agustus','September','Oktober','Nopember','Desember'],
		monthNamesShort: ['Jan','Feb','Mar','Apr','Mei','Jun',
		'Jul','Agus','Sep','Okt','Nop','Des'],
		dayNames: ['Minggu','Senin','Selasa','Rabu','Kamis','Jumat','Sabtu'],
		dayNamesShort: ['Min','Sen','Sel','Rab','kam','Jum','Sab'],
		dayNamesMin: ['Mg','Sn','Sl','Rb','Km','jm','Sb'],
		dateFormat: 'dd/mm/yyyy', firstDay: 0,
		renderer: $.datepick.defaultRenderer,
		prevText: '&#x3c;mundur', prevStatus: 'Tampilkan bulan sebelumnya',
		prevJumpText: '&#x3c;&#x3c;', prevJumpStatus: '',
		nextText: 'maju&#x3e;', nextStatus: 'Tampilkan bulan berikutnya',
		nextJumpText: '&#x3e;&#x3e;', nextJumpStatus: '',
		currentText: 'hari ini', currentStatus: 'Tampilkan bulan sekarang',
		todayText: 'hari ini', todayStatus: 'Tampilkan bulan sekarang',
		clearText: 'kosongkan', clearStatus: 'bersihkan tanggal yang sekarang',
		closeText: 'Tutup', closeStatus: 'Tutup tanpa mengubah',
		yearStatus: 'Tampilkan tahun yang berbeda', monthStatus: 'Tampilkan bulan yang berbeda',
		weekText: 'Mg', weekStatus: 'Minggu dalam tahun',
		dayStatus: 'pilih le DD, MM d', defaultStatus: 'Pilih Tanggal',
		isRTL: false
	};
	$.datepick.setDefaults($.datepick.regional['id']);
})(jQuery);
/* http://keith-wood.name/datepick.html
   Icelandic localisation for jQuery Datepicker.
   Written by Haukur H. Thorsson (haukur@eskill.is). */
(function($) {
	$.datepick.regional['is'] = {
		monthNames: ['Jan&uacute;ar','Febr&uacute;ar','Mars','Apr&iacute;l','Ma&iacute','J&uacute;n&iacute;',
		'J&uacute;l&iacute;','&Aacute;g&uacute;st','September','Okt&oacute;ber','N&oacute;vember','Desember'],
		monthNamesShort: ['Jan','Feb','Mar','Apr','Ma&iacute;','J&uacute;n',
		'J&uacute;l','&Aacute;g&uacute;','Sep','Okt','N&oacute;v','Des'],
		dayNames: ['Sunnudagur','M&aacute;nudagur','&THORN;ri&eth;judagur','Mi&eth;vikudagur','Fimmtudagur','F&ouml;studagur','Laugardagur'],
		dayNamesShort: ['Sun','M&aacute;n','&THORN;ri','Mi&eth;','Fim','F&ouml;s','Lau'],
		dayNamesMin: ['Su','M&aacute;','&THORN;r','Mi','Fi','F&ouml;','La'],
		dateFormat: 'dd/mm/yyyy', firstDay: 0,
		renderer: $.datepick.defaultRenderer,
		prevText: '&#x3c; Fyrri', prevStatus: '',
		prevJumpText: '&#x3c;&#x3c;', prevJumpStatus: '',
		nextText: 'N&aelig;sti &#x3e;', nextStatus: '',
		nextJumpText: '&#x3e;&#x3e;', nextJumpStatus: '',
		currentText: '&Iacute; dag', currentStatus: '',
		todayText: '&Iacute; dag', todayStatus: '',
		clearText: 'Hreinsa', clearStatus: '',
		closeText: 'Loka', closeStatus: '',
		yearStatus: '', monthStatus: '',
		weekText: 'Vika', weekStatus: '',
		dayStatus: 'D, M d', defaultStatus: '',
		isRTL: false
	};
	$.datepick.setDefaults($.datepick.regional['is']);
})(jQuery);
﻿/* http://keith-wood.name/datepick.html
   Italian localisation for jQuery Datepicker.
   Written by Apaella (apaella@gmail.com). */
(function($) {
	$.datepick.regional['it'] = {
		monthNames: ['Gennaio','Febbraio','Marzo','Aprile','Maggio','Giugno',
		'Luglio','Agosto','Settembre','Ottobre','Novembre','Dicembre'],
		monthNamesShort: ['Gen','Feb','Mar','Apr','Mag','Giu',
		'Lug','Ago','Set','Ott','Nov','Dic'],
		dayNames: ['Domenica','Lunedì','Martedì','Mercoledì','Giovedì','Venerdì','Sabato'],
		dayNamesShort: ['Dom','Lun','Mar','Mer','Gio','Ven','Sab'],
		dayNamesMin: ['Do','Lu','Ma','Me','Gi','Ve','Sa'],
		dateFormat: 'dd/mm/yyyy', firstDay: 1,
		renderer: $.datepick.defaultRenderer,
		prevText: '&#x3c;Prec', prevStatus: 'Mese precedente',
		prevJumpText: '&#x3c;&#x3c;', prevJumpStatus: 'Mostra l\'anno precedente',
		nextText: 'Succ&#x3e;', nextStatus: 'Mese successivo',
		nextJumpText: '&#x3e;&#x3e;', nextJumpStatus: 'Mostra l\'anno successivo',
		currentText: 'Oggi', currentStatus: 'Mese corrente',
		todayText: 'Oggi', todayStatus: 'Mese corrente',
		clearText: 'Svuota', clearStatus: 'Annulla',
		closeText: 'Chiudi', closeStatus: 'Chiudere senza modificare',
		yearStatus: 'Seleziona un altro anno', monthStatus: 'Seleziona un altro mese',
		weekText: 'Sm', weekStatus: 'Settimana dell\'anno',
		dayStatus: '\'Seleziona\' D, M d', defaultStatus: 'Scegliere una data',
		isRTL: false
	};
	$.datepick.setDefaults($.datepick.regional['it']);
})(jQuery);
﻿/* http://keith-wood.name/datepick.html
   Japanese localisation for jQuery Datepicker.
   Written by Kentaro SATO (kentaro@ranvis.com). */
(function($) {
	$.datepick.regional['ja'] = {
		monthNames: ['1月','2月','3月','4月','5月','6月',
		'7月','8月','9月','10月','11月','12月'],
		monthNamesShort: ['1月','2月','3月','4月','5月','6月',
		'7月','8月','9月','10月','11月','12月'],
		dayNames: ['日曜日','月曜日','火曜日','水曜日','木曜日','金曜日','土曜日'],
		dayNamesShort: ['日','月','火','水','木','金','土'],
		dayNamesMin: ['日','月','火','水','木','金','土'],
		dateFormat: 'yyyy/mm/dd', firstDay: 0,
		renderer: $.extend({}, $.datepick.defaultRenderer,
			{month: $.datepick.defaultRenderer.month.
				replace(/monthHeader/, 'monthHeader:yyyy年 MM')}),
		prevText: '&#x3c;前', prevStatus: '前月を表示します',
		prevJumpText: '&#x3c;&#x3c;', prevJumpStatus: '前年を表示します',
		nextText: '次&#x3e;', nextStatus: '翌月を表示します',
		nextJumpText: '&#x3e;&#x3e;', nextJumpStatus: '翌年を表示します',
		currentText: '今日', currentStatus: '今月を表示します',
		todayText: '今日', todayStatus: '今月を表示します',
		clearText: 'クリア', clearStatus: '日付をクリアします',
		closeText: '閉じる', closeStatus: '変更せずに閉じます',
		yearStatus: '表示する年を変更します', monthStatus: '表示する月を変更します',
		weekText: '週', weekStatus: '暦週で第何週目かを表します',
		dayStatus: 'Md日(D)', defaultStatus: '日付を選択します',
		isRTL: false
	};
	$.datepick.setDefaults($.datepick.regional['ja']);
})(jQuery);
﻿/* http://keith-wood.name/datepick.html
   Georgian localisation for jQuery Datepicker.
   Andrei Gorbushkin. */
(function($) {
	$.datepick.regional['ka'] = {
		monthNames: ['იანვარი','თებერვალი','მარტი','აპრილი','მაისი','ივნისი',
		'ივლისი','აგვისტო','სექტემბერი','ოქტომბერი','ნოემბერი','დეკემბერი'],
		monthNamesShort: ['იან', 'თებ', 'მარ', 'აპრ', 'მაისი', 'ივნ',
		'ივლ', 'აგვ', 'სექ', 'ოქტ', 'ნოე', 'დეკ'],
		dayNames: ['კვირა', 'ორშაბათი', 'სამშაბათი', 'ოთხშაბათი', 'ხუთშაბათი', 'პარასკევი', 'შაბათი'],
		dayNamesShort: ['კვ', 'ორშ', 'სამ', 'ოთხ', 'ხუთ', 'პარ', 'შაბ'],
		dayNamesMin: ['კვ','ორ','სმ','ოთ', 'ხშ', 'პრ','შბ'],
		dateFormat: 'dd/mm/yyyy', firstDay: 1,
		renderer: $.datepick.defaultRenderer,
		prevText: '<უკან', prevStatus: 'წინა თვე',
		prevJumpText: '&#x3c;&#x3c;', prevJumpStatus: 'წინა წელი',
		nextText: 'წინ>', nextStatus: 'შემდეგი თვე',
		nextJumpText: '&#x3e;&#x3e;', nextJumpStatus: 'შემდეგი წელი',
		currentText: 'მიმდინარე', currentStatus: 'მიმდინარე თვე',
		todayText: 'დღეს', todayStatus: 'მიმდინარე დღე',
		clearText: 'გასუფთავება', clearStatus: 'მიმდინარე თარიღის წაშლა',
		closeText: 'არის', closeStatus: 'დახურვა უცვლილებოდ',
		yearStatus: 'სხვა წელი', monthStatus: 'სხვა თვე',
		weekText: 'კვ', weekStatus: 'წლის კვირა',
		dayStatus: 'აირჩიეთ DD, M d', defaultStatus: 'აიღჩიეთ თარიღი',
		isRTL: false
	};
	$.datepick.setDefaults($.datepick.regional['ka']);
})(jQuery);
﻿/* http://keith-wood.name/datepick.html
   Khmer initialisation for jQuery Datepicker.
   Written by Sovichet Tep (sovichet.tep@gmail.com). */
(function($){
	$.datepick.regional['km'] = {
		monthNames: ['ខែ​មករា','ខែ​កុម្ភៈ','ខែ​មិនា','ខែ​មេសា','ខែ​ឧសភា','ខែ​មិថុនា',
		'ខែ​កក្កដា','ខែ​សីហា','ខែ​កញ្ញា','ខែ​តុលា','ខែ​វិច្ឆិកា','ខែ​ធ្នូ'],
		monthNamesShort: ['មក', 'កុ', 'មិនា', 'មេ', 'ឧស', 'មិថុ',
		'កក្ក', 'សី', 'កញ្ញា', 'តុលា', 'វិច្ឆិ', 'ធ្នូ'],
		dayNames: ['ថ្ងៃ​អាទិត្យ', 'ថ្ងៃ​ចន្ទ', 'ថ្ងៃ​អង្គារ', 'ថ្ងៃ​ពុធ', 'ថ្ងៃ​ព្រហស្បត្តិ៍', 'ថ្ងៃ​សុក្រ', 'ថ្ងៃ​សៅរ៍'],
		dayNamesShort: ['អា', 'ចន្ទ', 'អង្គ', 'ពុធ', 'ព្រហ', 'សុ', 'សៅរ៍'],
		dayNamesMin: ['អា','ច','អ','ពុ','ព្រ','សុ','ស'],
		dateFormat: 'dd/mm/yyyy', firstDay: 1,
		renderer: $.datepick.defaultRenderer,
		prevText: 'ថយ​ក្រោយ', prevStatus: '',
		prevJumpText: '&#x3c;&#x3c;', prevJumpStatus: '',
		nextText: 'ទៅ​មុខ', nextStatus: '',
		nextJumpText: '&#x3e;&#x3e;', nextJumpStatus: '',
		currentText: 'ថ្ងៃ​នេះ', currentStatus: '',
		todayText: 'ថ្ងៃ​នេះ', todayStatus: '',
		clearText: 'X', clearStatus: '',
		closeText: 'រួច​រាល់', closeStatus: '',
		yearStatus: '', monthStatus: '',
		weekText: 'Wk', weekStatus: '',
		dayStatus: 'DD d MM', defaultStatus: '',
		isRTL: false
	};
	$.datepick.setDefaults($.datepick.regional['km']);
});
﻿/* http://keith-wood.name/datepick.html
   Korean localisation for jQuery Datepicker.
   Written by DaeKwon Kang (ncrash.dk@gmail.com), Edited by Genie. */
(function($) {
	$.datepick.regional['ko'] = {
		monthNames: ['1월','2월','3월','4월','5월','6월',
		'7월','8월','9월','10월','11월','12월'],
		monthNamesShort: ['1월','2월','3월','4월','5월','6월',
		'7월','8월','9월','10월','11월','12월'],
		dayNames: ['일요일','월요일','화요일','수요일','목요일','금요일','토요일'],
		dayNamesShort: ['일','월','화','수','목','금','토'],
		dayNamesMin: ['일','월','화','수','목','금','토'],
		dateFormat: 'yyyy-mm-dd', firstDay: 0,
		renderer: $.extend({}, $.datepick.defaultRenderer,
			{month: $.datepick.defaultRenderer.month.
				replace(/monthHeader/, 'monthHeader:yyyy년 MM')}),
		prevText: '이전달', prevStatus: '이전달을 표시합니다',
		prevJumpText: '&#x3c;&#x3c;', prevJumpStatus: '이전 연도를 표시합니다',
		nextText: '다음달', nextStatus: '다음달을 표시합니다',
		nextJumpText: '&#x3e;&#x3e;', nextJumpStatus: '다음 연도를 표시합니다',
		currentText: '현재', currentStatus: '입력한 달을 표시합니다',
		todayText: '오늘', todayStatus: '이번달을 표시합니다',
		clearText: '지우기', clearStatus: '입력한 날짜를 지웁니다',
		closeText: '닫기', closeStatus: '',
		yearStatus: '표시할 연도를 변경합니다', monthStatus: '표시할 월을 변경합니다',
		weekText: 'Wk', weekStatus: '해당 연도의 주차',
		dayStatus: 'M d일 (D)', defaultStatus: '날짜를 선택하세요',
		isRTL: false
	};
	$.datepick.setDefaults($.datepick.regional['ko']);
})(jQuery);
/* http://keith-wood.name/datepick.html
   Lithuanian localisation for jQuery Datepicker.
   Written by Arturas Paleicikas <arturas@avalon.lt> */
(function($) {
	$.datepick.regional['lt'] = {
		monthNames: ['Sausis','Vasaris','Kovas','Balandis','Gegužė','Birželis',
		'Liepa','Rugpjūtis','Rugsėjis','Spalis','Lapkritis','Gruodis'],
		monthNamesShort: ['Sau','Vas','Kov','Bal','Geg','Bir',
		'Lie','Rugp','Rugs','Spa','Lap','Gru'],
		dayNames: ['sekmadienis','pirmadienis','antradienis','trečiadienis','ketvirtadienis','penktadienis','šeštadienis'],
		dayNamesShort: ['sek','pir','ant','tre','ket','pen','šeš'],
		dayNamesMin: ['Se','Pr','An','Tr','Ke','Pe','Še'],
		dateFormat: 'yyyy-mm-dd', firstDay: 1,
		renderer: $.datepick.defaultRenderer,
		prevText: '&#x3c;Atgal',  prevStatus: '',
		prevJumpText: '&#x3c;&#x3c;', prevJumpStatus: '',
		nextText: 'Pirmyn&#x3e;', nextStatus: '',
		nextJumpText: '&#x3e;&#x3e;', nextJumpStatus: '',
		currentText: 'Šiandien', currentStatus: '',
		todayText: 'Šiandien', todayStatus: '',
		clearText: 'Išvalyti', clearStatus: '',
		closeText: 'Uždaryti', closeStatus: '',
		yearStatus: '', monthStatus: '',
		weekText: 'Wk', weekStatus: '',
		dayStatus: 'D, M d', defaultStatus: '',
		isRTL: false
	};
	$.datepick.setDefaults($.datepick.regional['lt']);
})(jQuery);
/* http://keith-wood.name/datepick.html
   Latvian localisation for jQuery Datepicker.
   Written by Arturas Paleicikas <arturas.paleicikas@metasite.net> */
(function($) {
	$.datepick.regional['lv'] = {
		monthNames: ['Janvāris','Februāris','Marts','Aprīlis','Maijs','Jūnijs',
		'Jūlijs','Augusts','Septembris','Oktobris','Novembris','Decembris'],
		monthNamesShort: ['Jan','Feb','Mar','Apr','Mai','Jūn',
		'Jūl','Aug','Sep','Okt','Nov','Dec'],
		dayNames: ['svētdiena','pirmdiena','otrdiena','trešdiena','ceturtdiena','piektdiena','sestdiena'],
		dayNamesShort: ['svt','prm','otr','tre','ctr','pkt','sst'],
		dayNamesMin: ['Sv','Pr','Ot','Tr','Ct','Pk','Ss'],
		dateFormat: 'dd-mm-yyyy', firstDay: 1,
		renderer: $.datepick.defaultRenderer,
		prevText: 'Iepr',  prevStatus: '',
		prevJumpText: '&#x3c;&#x3c;', prevJumpStatus: '',
		nextText: 'Nāka', nextStatus: '',
		nextJumpText: '&#x3e;&#x3e;', nextJumpStatus: '',
		currentText: 'Šodien', currentStatus: '',
		todayText: 'Šodien', todayStatus: '',
		clearText: 'Notīrīt', clearStatus: '',
		closeText: 'Aizvērt', closeStatus: '',
		yearStatus: '', monthStatus: '',
		weekText: 'Nav', weekStatus: '',
		dayStatus: 'D, M d', defaultStatus: '',
		isRTL: false
	};
	$.datepick.setDefaults($.datepick.regional['lv']);
})(jQuery);
﻿/* http://keith-wood.name/datepick.html
   Montenegrin localisation for jQuery Datepicker.
   By Miloš Milošević - fleka d.o.o. */
(function($) {
	$.datepick.regional['me-ME'] = {
		monthNames: ['Januar','Februar','Mart','April','Maj','Jun',
		'Jul','Avgust','Septembar','Oktobar','Novembar','Decembar'],
		monthNamesShort: ['Jan', 'Feb', 'Mar', 'Apr', 'Maj', 'Jun',
		'Jul', 'Avg', 'Sep', 'Okt', 'Nov', 'Dec'],
		dayNames: ['Neđelja', 'Poneđeljak', 'Utorak', 'Srijeda', 'Četvrtak', 'Petak', 'Subota'],
		dayNamesShort: ['Neđ', 'Pon', 'Uto', 'Sri', 'Čet', 'Pet', 'Sub'],
		dayNamesMin: ['Ne','Po','Ut','Sr','Če','Pe','Su'],
		dateFormat: 'dd/mm/yyyy', firstDay: 1,
		renderer: $.datepick.defaultRenderer,
		prevText: '&#x3c;', prevStatus: 'Prikaži prethodni mjesec',
		prevJumpText: '&#x3c;&#x3c;', prevJumpStatus: 'Prikaži prethodnu godinu',
		nextText: '&#x3e;', nextStatus: 'Prikaži sljedeći mjesec',
		nextJumpText: '&#x3e;&#x3e;', nextJumpStatus: 'Prikaži sljedeću godinu',
		currentText: 'Danas', currentStatus: 'Tekući mjesec',
		todayText: 'Danas', todayStatus: 'Tekući mjesec',
		clearText: 'Obriši', clearStatus: 'Obriši trenutni datum',
		closeText: 'Zatvori', closeStatus: 'Zatvori kalendar',
		yearStatus: 'Prikaži godine', monthStatus: 'Prikaži mjesece',
		weekText: 'Sed', weekStatus: 'Sedmica',
		dayStatus: '\'Datum\' DD, M d', defaultStatus: 'Odaberi datum',
		isRTL: false
	};
	$.datepick.setDefaults($.datepick.regional['me-ME']);
})(jQuery);
﻿/* http://keith-wood.name/datepick.html
   Montenegrin localisation for jQuery Datepicker.
   By Miloš Milošević - fleka d.o.o. */
(function($) {
	$.datepick.regional['me'] = {
		monthNames: ['Јануар','Фебруар','Март','Април','Мај','Јун',
		'Јул','Август','Септембар','Октобар','Новембар','Децембар'],
		monthNamesShort: ['Јан', 'Феб', 'Мар', 'Апр', 'Мај', 'Јун',
		'Јул', 'Авг', 'Сеп', 'Окт', 'Нов', 'Дец'],
		dayNames: ['Неђеља', 'Понеђељак', 'Уторак', 'Сриједа', 'Четвртак', 'Петак', 'Субота'],
		dayNamesShort: ['Неђ', 'Пон', 'Уто', 'Сри', 'Чет', 'Пет', 'Суб'],
		dayNamesMin: ['Не','По','Ут','Ср','Че','Пе','Су'],
		dateFormat: 'dd/mm/yyyy', firstDay: 1,
		renderer: $.datepick.defaultRenderer,
		prevText: '&#x3c;', prevStatus: 'Прикажи претходни мјесец',
		prevJumpText: '&#x3c;&#x3c;', prevJumpStatus: 'Прикажи претходну годину',
		nextText: '&#x3e;', nextStatus: 'Прикажи сљедећи мјесец',
		nextJumpText: '&#x3e;&#x3e;', nextJumpStatus: 'Прикажи сљедећу годину',
		currentText: 'Данас', currentStatus: 'Текући мјесец',
		todayText: 'Данас', todayStatus: 'Текући мјесец',
		clearText: 'Обриши', clearStatus: 'Обриши тренутни датум',
		closeText: 'Затвори', closeStatus: 'Затвори календар',
		yearStatus: 'Прикажи године', monthStatus: 'Прикажи мјесеце',
		weekText: 'Сед', weekStatus: 'Седмица',
		dayStatus: '\'Датум\' DD d MM', defaultStatus: 'Одабери датум',
		isRTL: false
	};
	$.datepick.setDefaults($.datepick.regional['me']);
})(jQuery);
﻿/* http://keith-wood.name/datepick.html
   Македонски MK localisation for jQuery Datepicker.
   Written by Hajan Selmani
   email: hajan [at] live [dot] com
   url: http://weblogs.asp.net/hajan | http://codeasp.net/blogs/hajan | http://mkdot.net/blogs/hajan */
(function($) {
	$.datepick.regional['mk'] = {
		monthNames: ['Јануари','Февруари','Март','Април','Мај','Јуни',
		'Јули','Август','Септември','Октомври','Ноември','Декември'],
		monthNamesShort: ['Јан', 'Фев', 'Мар', 'Апр', 'Мај', 'Јун',
		'Јул', 'Авг', 'Сеп', 'Окт', 'Нов', 'Дек'],
		dayNames: ['Недела', 'Понеделник', 'Вторник', 'Среда', 'Четврток', 'Петок', 'Сабота'],
		dayNamesShort: ['Нед', 'Пон', 'Вто', 'Сре', 'Чет', 'Пет', 'Саб'],
		dayNamesMin: ['Не','По','Вт','Ср','Че','Пе','Са'],
		dateFormat: 'dd/mm/yyyy', firstDay: 1,
		renderer: $.datepick.defaultRenderer,
		prevText: 'Претх.', prevStatus: 'Прикажи го претходниот месец',
		prevJumpText: '&#x3c;&#x3c;', prevJumpStatus: 'Прикажи ја претходната година',
		nextText: 'Следен', nextStatus: 'Прикажи го следниот месец',
		nextJumpText: '&#x3e;&#x3e;', nextJumpStatus: 'Прикажи ја следната година',
		currentText: 'Тековен', currentStatus: 'Прикажи го тековниот месец',
		todayText: 'Денес', todayStatus: 'Прикажи го денешниот месец',
		clearText: 'Бриши', clearStatus: 'Избриши го тековниот датум',
		closeText: 'Затвори', closeStatus: 'Затвори без промени',
		yearStatus: 'Избери друга година', monthStatus: 'Избери друг месец',
		weekText: 'Нед', weekStatus: 'Недела во годината',
		dayStatus: 'Избери DD, M d', defaultStatus: 'Избери датум',
		isRTL: false
	};
	$.datepick.setDefaults($.datepick.regional['mk']);
})(jQuery);﻿/* http://keith-wood.name/datepick.html
   Malayalam localisation for jQuery Datepicker.
   Saji Nediyanchath (saji89@gmail.com). */
(function($) {
	$.datepick.regional['ml'] = {
		monthNames: ['ജനുവരി','ഫെബ്രുവരി','മാര്‍ച്ച്','ഏപ്രില്‍','മേയ്','ജൂണ്‍',
		'ജൂലൈ','ആഗസ്റ്റ്','സെപ്റ്റംബര്‍','ഒക്ടോബര്‍','നവംബര്‍','ഡിസംബര്‍'],
		monthNamesShort: ['ജനു', 'ഫെബ്', 'മാര്‍', 'ഏപ്രി', 'മേയ്', 'ജൂണ്‍',
		'ജൂലാ', 'ആഗ', 'സെപ്', 'ഒക്ടോ', 'നവം', 'ഡിസ'],
		dayNames: ['ഞായര്‍', 'തിങ്കള്‍', 'ചൊവ്വ', 'ബുധന്‍', 'വ്യാഴം', 'വെള്ളി', 'ശനി'],
		dayNamesShort: ['ഞായ', 'തിങ്ക', 'ചൊവ്വ', 'ബുധ', 'വ്യാഴം', 'വെള്ളി', 'ശനി'],
		dayNamesMin: ['ഞാ','തി','ചൊ','ബു','വ്യാ','വെ','ശ'],
		dateFormat: 'dd/mm/yyyy', firstDay: 1,
		renderer: $.datepick.defaultRenderer,
		prevText: 'മുന്നത്തെ', prevStatus: '',
		prevJumpText: '&#x3c;&#x3c;', prevJumpStatus: '',
		nextText: 'അടുത്തത് ', nextStatus: '',
		nextJumpText: '&#x3e;&#x3e;', nextJumpStatus: '',
		currentText: 'ഇന്ന്', currentStatus: '',
		todayText: 'ഇന്ന്', todayStatus: '',
		clearText: 'X', clearStatus: '',
		closeText: 'ശരി', closeStatus: '',
		yearStatus: '', monthStatus: '',
		weekText: 'ആ', weekStatus: '',
		dayStatus: 'DD d MM', defaultStatus: '',
		isRTL: false
	};
	$.datepick.setDefaults($.datepick.regional['ml']);
})(jQuery);
/* http://keith-wood.name/datepick.html
   Malaysian localisation for jQuery Datepicker.
   Written by Mohd Nawawi Mohamad Jamili (nawawi@ronggeng.net). */
(function($) {
	$.datepick.regional['ms'] = {
		monthNames: ['Januari','Februari','Mac','April','Mei','Jun',
		'Julai','Ogos','September','Oktober','November','Disember'],
		monthNamesShort: ['Jan','Feb','Mac','Apr','Mei','Jun',
		'Jul','Ogo','Sep','Okt','Nov','Dis'],
		dayNames: ['Ahad','Isnin','Selasa','Rabu','Khamis','Jumaat','Sabtu'],
		dayNamesShort: ['Aha','Isn','Sel','Rab','Kha','Jum','Sab'],
		dayNamesMin: ['Ah','Is','Se','Ra','Kh','Ju','Sa'],
		dateFormat: 'dd/mm/yyyy', firstDay: 0,
		renderer: $.datepick.defaultRenderer,
		prevText: '&#x3c;Sebelum', prevStatus: 'Tunjukkan bulan lepas',
		prevJumpText: '&#x3c;&#x3c;', prevJumpStatus: 'Tunjukkan tahun lepas',
		nextText: 'Selepas&#x3e;', nextStatus: 'Tunjukkan bulan depan',
		nextJumpText: '&#x3e;&#x3e;', nextJumpStatus: 'Tunjukkan tahun depan',
		currentText: 'hari ini', currentStatus: 'Tunjukkan bulan terkini',
		todayText: 'hari ini', todayStatus: 'Tunjukkan bulan terkini',
		clearText: 'Padam', clearStatus: 'Padamkan tarikh terkini',
		closeText: 'Tutup', closeStatus: 'Tutup tanpa perubahan',
		yearStatus: 'Tunjukkan tahun yang lain', monthStatus: 'Tunjukkan bulan yang lain',
		weekText: 'Mg', weekStatus: 'Minggu bagi tahun ini',
		dayStatus: 'DD, d MM', defaultStatus: 'Sila pilih tarikh',
		isRTL: false
	};
	$.datepick.setDefaults($.datepick.regional['ms']);
})(jQuery);
﻿/* http://keith-wood.name/datepick.html
   Maltese localisation for jQuery Datepicker.
   Written by Chritian Sciberras (uuf6429@gmail.com). */
(function($) {
	$.datepick.regional['mt'] = {
		monthNames: ['Jannar','Frar','Marzu','April','Mejju','Ġunju',
		'Lulju','Awissu','Settembru','Ottubru','Novembru','Diċembru'],
		monthNamesShort: ['Jan', 'Fra', 'Mar', 'Apr', 'Mej', 'Ġun',
		'Lul', 'Awi', 'Set', 'Ott', 'Nov', 'Diċ'],
		dayNames: ['Il-Ħadd', 'It-Tnejn', 'It-Tlieta', 'L-Erbgħa', 'Il-Ħamis', 'Il-Ġimgħa', 'Is-Sibt'],
		dayNamesShort: ['Ħad', 'Tne', 'Tli', 'Erb', 'Ħam', 'Ġim', 'Sib'],
		dayNamesMin: ['Ħ','T','T','E','Ħ','Ġ','S'],
		dateFormat: 'dd/mm/yyyy', firstDay: 1,
 		renderer: $.datepick.defaultRenderer,
		prevText: 'Ta Qabel', prevStatus: 'Ix-xahar ta qabel',
 		prevJumpText: '&#x3c;&#x3c;', prevJumpStatus: 'Is-sena ta qabel',
 		nextText: 'Li Jmiss', nextStatus: 'Ix-xahar li jmiss',
 		nextJumpText: '&#x3e;&#x3e;', nextJumpStatus: 'Is-sena li jmiss',
 		currentText: 'Illum', currentStatus: 'Ix-xahar ta llum',
 		todayText: 'Illum', todayStatus: 'Uri ix-xahar ta llum',
 		clearText: 'Ħassar', clearStatus: 'Ħassar id-data',
 		closeText: 'Lest', closeStatus: 'Għalaq mingħajr tibdiliet',
 		yearStatus: 'Uri sena differenti', monthStatus: 'Uri xahar differenti',
		weekText: 'Ġm', weekStatus: 'Il-Ġimgħa fis-sena',
		dayStatus: 'Għazel DD, M d', defaultStatus: 'Għazel data',
		isRTL: false
	};
	$.datepick.setDefaults($.datepick.regional['mt']);
})(jQuery);
﻿/* http://keith-wood.name/datepick.html
   Dutch/Belgium localisation for jQuery Datepicker.
   Written by Mathias Bynens <http://mathiasbynens.be/> */
(function($) {
	$.datepick.regional['nl-BE'] = {
		monthNames: ['januari', 'februari', 'maart', 'april', 'mei', 'juni',
		'juli', 'augustus', 'september', 'oktober', 'november', 'december'],
		monthNamesShort: ['jan', 'feb', 'maa', 'apr', 'mei', 'jun',
		'jul', 'aug', 'sep', 'okt', 'nov', 'dec'],
		dayNames: ['zondag', 'maandag', 'dinsdag', 'woensdag', 'donderdag', 'vrijdag', 'zaterdag'],
		dayNamesShort: ['zon', 'maa', 'din', 'woe', 'don', 'vri', 'zat'],
		dayNamesMin: ['zo', 'ma', 'di', 'wo', 'do', 'vr', 'za'],
		dateFormat: 'dd/mm/yyyy', firstDay: 1,
		renderer: $.datepick.defaultRenderer,
		prevText: '←', prevStatus: 'Bekijk de vorige maand',
		prevJumpText: '«', nextJumpStatus: 'Bekijk het vorige jaar',
		nextText: '→', nextStatus: 'Bekijk de volgende maand',
		nextJumpText: '»', nextJumpStatus: 'Bekijk het volgende jaar',
		currentText: 'Vandaag', currentStatus: 'Bekijk de huidige maand',
		todayText: 'Vandaag', todayStatus: 'Bekijk de huidige maand',
		clearText: 'Wissen', clearStatus: 'Wis de huidige datum',
		closeText: 'Sluiten', closeStatus: 'Sluit zonder verandering',
		yearStatus: 'Bekijk een ander jaar', monthStatus: 'Bekijk een andere maand',
		weekText: 'Wk', weekStatus: 'Week van het jaar',
		dayStatus: 'dd/mm/yyyy', defaultStatus: 'Kies een datum',
		isRTL: false
	};
	$.datepick.setDefaults($.datepick.regional['nl-BE']);
})(jQuery);
﻿/* http://keith-wood.name/datepick.html
   Dutch localisation for jQuery Datepicker.
   Written by Mathias Bynens <http://mathiasbynens.be/> */
(function($) {
	$.datepick.regional['nl'] = {
		monthNames: ['januari', 'februari', 'maart', 'april', 'mei', 'juni',
		'juli', 'augustus', 'september', 'oktober', 'november', 'december'],
		monthNamesShort: ['jan', 'feb', 'maa', 'apr', 'mei', 'jun',
		'jul', 'aug', 'sep', 'okt', 'nov', 'dec'],
		dayNames: ['zondag', 'maandag', 'dinsdag', 'woensdag', 'donderdag', 'vrijdag', 'zaterdag'],
		dayNamesShort: ['zon', 'maa', 'din', 'woe', 'don', 'vri', 'zat'],
		dayNamesMin: ['zo', 'ma', 'di', 'wo', 'do', 'vr', 'za'],
		dateFormat: 'dd-mm-yyyy', firstDay: 1,
		renderer: $.datepick.defaultRenderer,
		prevText: '←', prevStatus: 'Bekijk de vorige maand',
		prevJumpText: '«', nextJumpStatus: 'Bekijk het vorige jaar',
		nextText: '→', nextStatus: 'Bekijk de volgende maand',
		nextJumpText: '»', nextJumpStatus: 'Bekijk het volgende jaar',
		currentText: 'Vandaag', currentStatus: 'Bekijk de huidige maand',
		todayText: 'Vandaag', todayStatus: 'Bekijk de huidige maand',
		clearText: 'Wissen', clearStatus: 'Wis de huidige datum',
		closeText: 'Sluiten', closeStatus: 'Sluit zonder verandering',
		yearStatus: 'Bekijk een ander jaar', monthStatus: 'Bekijk een andere maand',
		weekText: 'Wk', weekStatus: 'Week van het jaar',
		dayStatus: 'dd-mm-yyyy', defaultStatus: 'Kies een datum',
		isRTL: false
	};
	$.datepick.setDefaults($.datepick.regional['nl']);
})(jQuery);
/* http://keith-wood.name/datepick.html
   Norwegian localisation for jQuery Datepicker.
   Written by Naimdjon Takhirov (naimdjon@gmail.com). */
(function($) {
	$.datepick.regional['no'] = {
		monthNames: ['Januar','Februar','Mars','April','Mai','Juni',
		'Juli','August','September','Oktober','November','Desember'],
		monthNamesShort: ['Jan','Feb','Mar','Apr','Mai','Jun',
		'Jul','Aug','Sep','Okt','Nov','Des'],
		dayNamesShort: ['Søn','Man','Tir','Ons','Tor','Fre','Lør'],
		dayNames: ['Søndag','Mandag','Tirsdag','Onsdag','Torsdag','Fredag','Lørdag'],
		dayNamesMin: ['Sø','Ma','Ti','On','To','Fr','Lø'],
		dateFormat: 'dd.mm.yyyy', firstDay: 1,
		renderer: $.datepick.defaultRenderer,
		prevText: '&laquo;Forrige',  prevStatus: '',
		prevJumpText: '&#x3c;&#x3c;', prevJumpStatus: '',
		nextText: 'Neste&raquo;', nextStatus: '',
		nextJumpText: '&#x3e;&#x3e;', nextJumpStatus: '',
		currentText: 'I dag', currentStatus: '',
		todayText: 'I dag', todayStatus: '',
		clearText: 'Tøm', clearStatus: '',
		closeText: 'Lukk', closeStatus: '',
		yearStatus: '', monthStatus: '',
		weekText: 'Uke', weekStatus: '',
		dayStatus: 'D, M d', defaultStatus: '',
		isRTL: false
	};
	$.datepick.setDefaults($.datepick.regional['no']);
})(jQuery);
/* http://keith-wood.name/datepick.html
   Polish localisation for jQuery Datepicker.
   Written by Jacek Wysocki (jacek.wysocki@gmail.com). */
(function($) {
	$.datepick.regional['pl'] = {
		monthNames: ['Styczeń','Luty','Marzec','Kwiecień','Maj','Czerwiec',
		'Lipiec','Sierpień','Wrzesień','Październik','Listopad','Grudzień'],
		monthNamesShort: ['Sty','Lu','Mar','Kw','Maj','Cze',
		'Lip','Sie','Wrz','Pa','Lis','Gru'],
		dayNames: ['Niedziela','Poniedzialek','Wtorek','Środa','Czwartek','Piątek','Sobota'],
		dayNamesShort: ['Nie','Pn','Wt','Śr','Czw','Pt','So'],
		dayNamesMin: ['N','Pn','Wt','Śr','Cz','Pt','So'],
		dateFormat: 'yyyy-mm-dd', firstDay: 1,
		renderer: $.datepick.defaultRenderer,
		prevText: '&#x3c;Poprzedni', prevStatus: 'Pokaż poprzedni miesiąc',
		prevJumpText: '&#x3c;&#x3c;', prevJumpStatus: '',
		nextText: 'Następny&#x3e;', nextStatus: 'Pokaż następny miesiąc',
		nextJumpText: '&#x3e;&#x3e;', nextJumpStatus: '',
		currentText: 'Dziś', currentStatus: 'Pokaż aktualny miesiąc',
		todayText: 'Dziś', todayStatus: 'Pokaż aktualny miesiąc',
		clearText: 'Wyczyść', clearStatus: 'Wyczyść obecną datę',
		closeText: 'Zamknij', closeStatus: 'Zamknij bez zapisywania',
		yearStatus: 'Pokaż inny rok', monthStatus: 'Pokaż inny miesiąc',
		weekText: 'Tydz', weekStatus: 'Tydzień roku',
		dayStatus: '\'Wybierz\' D, M d', defaultStatus: 'Wybierz datę',
		isRTL: false
	};
	$.datepick.setDefaults($.datepick.regional['pl']);
})(jQuery);
﻿/* http://keith-wood.name/datepick.html
   Brazilian Portuguese localisation for jQuery Datepicker.
   Written by Leonildo Costa Silva (leocsilva@gmail.com). */
(function($) {
	$.datepick.regional['pt-BR'] = {
		monthNames: ['Janeiro','Fevereiro','Março','Abril','Maio','Junho',
		'Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'],
		monthNamesShort: ['Jan','Fev','Mar','Abr','Mai','Jun',
		'Jul','Ago','Set','Out','Nov','Dez'],
		dayNames: ['Domingo','Segunda-feira','Terça-feira','Quarta-feira','Quinta-feira','Sexta-feira','Sábado'],
		dayNamesShort: ['Dom','Seg','Ter','Qua','Qui','Sex','Sáb'],
		dayNamesMin: ['D','S','T','Q','Q','S','S'],
		dateFormat: 'dd/mm/yyyy', firstDay: 0,
		renderer: $.datepick.defaultRenderer,
		prevText: '&lt;Anterior', prevStatus: 'Mostra o mês anterior',
		prevJumpText: '&lt;&lt;', prevJumpStatus: 'Mostra o ano anterior',
		nextText: 'Próximo&gt;', nextStatus: 'Mostra o próximo mês',
		nextJumpText: '&gt;&gt;', nextJumpStatus: 'Mostra o próximo ano',
		currentText: 'Atual', currentStatus: 'Mostra o mês atual',
		todayText: 'Hoje', todayStatus: 'Vai para hoje',
		clearText: 'Limpar', clearStatus: 'Limpar data',
		closeText: 'Fechar', closeStatus: 'Fechar o calendário',
		yearStatus: 'Selecionar ano', monthStatus: 'Selecionar mês',
		weekText: 's', weekStatus: 'Semana do ano',
		dayStatus: 'DD, d \'de\' M \'de\' yyyy', defaultStatus: 'Selecione um dia',
		isRTL: false
	};
	$.datepick.setDefaults($.datepick.regional['pt-BR']);
})(jQuery);
﻿/* http://keith-wood.name/datepick.html
   Portuguese Portuguese localisation for jQuery Datepicker.
   Written by Telmo Martinho (telmomartinho@gmail.com). */
(function($) {
	$.datepick.regional['pt'] = {
		monthNames: ['Janeiro','Fevereiro','Março','Abril','Maio','Junho',
		'Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'],
		monthNamesShort: ['Jan','Fev','Mar','Abr','Mai','Jun',
		'Jul','Ago','Set','Out','Nov','Dez'],
		dayNames: ['Domingo','Segunda-feira','Terça-feira','Quarta-feira','Quinta-feira','Sexta-feira','Sábado'],
		dayNamesShort: ['Dom','Seg','Ter','Qua','Qui','Sex','Sáb'],
		dayNamesMin: ['D','S','T','Q','Q','S','S'],
		dateFormat: 'dd/mm/yyyy', firstDay: 0,
		renderer: $.datepick.defaultRenderer,
		prevText: '&lt;Anterior', prevStatus: 'Mês anterior',
		prevJumpText: '&lt;&lt;', prevJumpStatus: 'Ano anterior',
		nextText: 'Próximo&gt;', nextStatus: 'Próximo mês',
		nextJumpText: '&gt;&gt;', nextJumpStatus: 'Próximo ano',
		currentText: 'Atual', currentStatus: 'Mês atual',
		todayText: 'Hoje', todayStatus: 'Hoje',
		clearText: 'Limpar', clearStatus: 'Limpar data',
		closeText: 'Fechar', closeStatus: 'Fechar o calendário',
		yearStatus: 'Selecionar ano', monthStatus: 'Selecionar mês',
		weekText: 's', weekStatus: 'Semana do ano',
		dayStatus: 'DD, d \'de\' M \'de\' yyyy', defaultStatus: 'Selecione um dia',
		isRTL: false
	};
	$.datepick.setDefaults($.datepick.regional['pt']);
})(jQuery);﻿/* http://keith-wood.name/datepick.html
   Romansh localisation for jQuery Datepicker.
   Yvonne Gienal (yvonne.gienal@educa.ch). */
(function($) {
	$.datepick.regional['rm'] = {
		monthNames: ['Schaner','Favrer','Mars','Avrigl','Matg','Zercladur',
		'Fanadur','Avust','Settember','October','November','December'],
		monthNamesShort: ['Scha','Fev','Mar','Avr','Matg','Zer',
		'Fan','Avu','Sett','Oct','Nov','Dec'],
		dayNames: ['Dumengia','Glindesdi','Mardi','Mesemna','Gievgia','Venderdi','Sonda'],
		dayNamesShort: ['Dum','Gli','Mar','Mes','Gie','Ven','Som'],
		dayNamesMin: ['Du','Gl','Ma','Me','Gi','Ve','So'],
		dateFormat: 'dd/mm/yyyy', firstDay: 1,
		renderer: $.datepick.defaultRenderer,
		prevText: '&#x3c;Suandant', prevStatus: '',
		prevJumpText: '&#x3c;&#x3c;', prevJumpStatus: '',
		nextText: 'Precedent&#x3e;', nextStatus: '',
		nextJumpText: '&#x3e;&#x3e;', nextJumpStatus: '',
		currentText: 'Actual', currentStatus: '',
		todayText: 'Actual', todayStatus: '',
		clearText: 'X', clearStatus: '',
		closeText: 'Serrar', closeStatus: '',
		yearStatus: '', monthStatus: '',
		weekText: 'emna', weekStatus: '',
		dayStatus: 'DD d MM', defaultStatus: '',
		isRTL: false
	};
	$.datepick.setDefaults($.datepick.regional['rm']);
})(jQuery);
﻿/* http://keith-wood.name/datepick.html
   Romanian localisation for jQuery Datepicker.
   Written by Edmond L. (ll_edmond@walla.com) and Ionut G. Stan (ionut.g.stan@gmail.com). */
(function($) {
	$.datepick.regional['ro'] = {
		monthNames: ['Ianuarie','Februarie','Martie','Aprilie','Mai','Iunie',
		'Iulie','August','Septembrie','Octombrie','Noiembrie','Decembrie'],
		monthNamesShort: ['Ian', 'Feb', 'Mar', 'Apr', 'Mai', 'Iun',
		'Iul', 'Aug', 'Sep', 'Oct', 'Noi', 'Dec'],
		dayNames: ['Duminică', 'Luni', 'Marti', 'Miercuri', 'Joi', 'Vineri', 'Sâmbătă'],
		dayNamesShort: ['Dum', 'Lun', 'Mar', 'Mie', 'Joi', 'Vin', 'Sâm'],
		dayNamesMin: ['Du','Lu','Ma','Mi','Jo','Vi','Sâ'],
		dateFormat: 'dd.mm.yyyy', firstDay: 1,
		renderer: $.datepick.defaultRenderer,
		prevText: '&laquo;Precedentă', prevStatus: 'Arată luna precedenta',
		prevJumpText: '&laquo;&laquo;', prevJumpStatus: '',
		nextText: 'Urmatoare&raquo;', nextStatus: 'Arată luna urmatoare',
		nextJumpText: '&raquo;&raquo;', nextJumpStatus: '',
		currentText: 'Azi', currentStatus: 'Arată luna curenta',
		todayText: 'Azi', todayStatus: 'Arată luna curenta',
		clearText: 'Curat', clearStatus: 'Sterge data curenta',
		closeText: 'Închide', closeStatus: 'Închide fara schimbare',
		yearStatus: 'Arată un an diferit', monthStatus: 'Arată o luna diferita',
		weekText: 'Săpt', weekStatus: 'Săptamana anului',
		dayStatus: 'Selectează D, M d', defaultStatus: 'Selectează o data',
		isRTL: false
	};
	$.datepick.setDefaults($.datepick.regional['ro']);
})(jQuery);
/* http://keith-wood.name/datepick.html
   Russian localisation for jQuery Datepicker.
   Written by Andrew Stromnov (stromnov@gmail.com). */
(function($) {
	$.datepick.regional['ru'] = {
		monthNames: ['Январь','Февраль','Март','Апрель','Май','Июнь',
		'Июль','Август','Сентябрь','Октябрь','Ноябрь','Декабрь'],
		monthNamesShort: ['Янв','Фев','Мар','Апр','Май','Июн',
		'Июл','Авг','Сен','Окт','Ноя','Дек'],
		dayNames: ['воскресенье','понедельник','вторник','среда','четверг','пятница','суббота'],
		dayNamesShort: ['вск','пнд','втр','срд','чтв','птн','сбт'],
		dayNamesMin: ['Вс','Пн','Вт','Ср','Чт','Пт','Сб'],
		dateFormat: 'dd.mm.yyyy', firstDay: 1,
		renderer: $.datepick.defaultRenderer,
		prevText: '&#x3c;Пред',  prevStatus: '',
		prevJumpText: '&#x3c;&#x3c;', prevJumpStatus: '',
		nextText: 'След&#x3e;', nextStatus: '',
		nextJumpText: '&#x3e;&#x3e;', nextJumpStatus: '',
		currentText: 'Сегодня', currentStatus: '',
		todayText: 'Сегодня', todayStatus: '',
		clearText: 'Очистить', clearStatus: '',
		closeText: 'Закрыть', closeStatus: '',
		yearStatus: '', monthStatus: '',
		weekText: 'Не', weekStatus: '',
		dayStatus: 'D, M d', defaultStatus: '',
		isRTL: false
	};
	$.datepick.setDefaults($.datepick.regional['ru']);
})(jQuery);
/* http://keith-wood.name/datepick.html
   Slovak localisation for jQuery Datepicker.
   Written by Vojtech Rinik (vojto@hmm.sk). */
(function($) {
	$.datepick.regional['sk'] = {
		monthNames: ['Január','Február','Marec','Apríl','Máj','Jún',
		'Júl','August','September','Október','November','December'],
		monthNamesShort: ['Jan','Feb','Mar','Apr','Máj','Jún',
		'Júl','Aug','Sep','Okt','Nov','Dec'],
		dayNames: ['Nedel\'a','Pondelok','Utorok','Streda','Štvrtok','Piatok','Sobota'],
		dayNamesShort: ['Ned','Pon','Uto','Str','Štv','Pia','Sob'],
		dayNamesMin: ['Ne','Po','Ut','St','Št','Pia','So'],
		dateFormat: 'dd.mm.yyyy', firstDay: 0,
		renderer: $.datepick.defaultRenderer,
		prevText: '&#x3c;Predchádzajúci',  prevStatus: '',
		prevJumpText: '&#x3c;&#x3c;', prevJumpStatus: '',
		nextText: 'Nasledujúci&#x3e;', nextStatus: '',
		nextJumpText: '&#x3e;&#x3e;', nextJumpStatus: '',
		currentText: 'Dnes', currentStatus: '',
		todayText: 'Dnes', todayStatus: '',
		clearText: 'Zmazať', clearStatus: '',
		closeText: 'Zavrieť', closeStatus: '',
		yearStatus: '', monthStatus: '',
		weekText: 'Ty', weekStatus: '',
		dayStatus: 'D, M d', defaultStatus: '',
		isRTL: false
	};
	$.datepick.setDefaults($.datepick.regional['sk']);
})(jQuery);
/* http://keith-wood.name/datepick.html
   Slovenian localisation for jQuery Datepicker.
   Written by Jaka Jancar (jaka@kubje.org). */
/* c = &#x10D;, s = &#x161; z = &#x17E; C = &#x10C; S = &#x160; Z = &#x17D; */
(function($) {
	$.datepick.regional['sl'] = {
		monthNames: ['Januar','Februar','Marec','April','Maj','Junij',
		'Julij','Avgust','September','Oktober','November','December'],
		monthNamesShort: ['Jan','Feb','Mar','Apr','Maj','Jun',
		'Jul','Avg','Sep','Okt','Nov','Dec'],
		dayNames: ['Nedelja','Ponedeljek','Torek','Sreda','&#x10C;etrtek','Petek','Sobota'],
		dayNamesShort: ['Ned','Pon','Tor','Sre','&#x10C;et','Pet','Sob'],
		dayNamesMin: ['Ne','Po','To','Sr','&#x10C;e','Pe','So'],
		dateFormat: 'dd.mm.yyyy', firstDay: 1,
		renderer: $.datepick.defaultRenderer,
		prevText: '&lt;Prej&#x161;nji', prevStatus: 'Prika&#x17E;i prej&#x161;nji mesec',
		prevJumpText: '&#x3c;&#x3c;', prevJumpStatus: '',
		nextText: 'Naslednji&gt;', nextStatus: 'Prika&#x17E;i naslednji mesec',
		nextJumpText: '&#x3e;&#x3e;', nextJumpStatus: '',
		currentText: 'Trenutni', currentStatus: 'Prika&#x17E;i trenutni mesec',
		todayText: 'Trenutni', todayStatus: 'Prika&#x17E;i trenutni mesec',
		clearText: 'Izbri&#x161;i', clearStatus: 'Izbri&#x161;i trenutni datum',
		closeText: 'Zapri', closeStatus: 'Zapri brez spreminjanja',
		yearStatus: 'Prika&#x17E;i drugo leto', monthStatus: 'Prika&#x17E;i drug mesec',
		weekText: 'Teden', weekStatus: 'Teden v letu',
		dayStatus: 'Izberi DD, d MM yy', defaultStatus: 'Izbira datuma',
		isRTL: false
	};
	$.datepick.setDefaults($.datepick.regional['sl']);
})(jQuery);
﻿/* http://keith-wood.name/datepick.html
   Albanian localisation for jQuery Datepicker.
   Written by Flakron Bytyqi (flakron@gmail.com). */
(function($) {
	$.datepick.regional['sq'] = {
		monthNames: ['Janar','Shkurt','Mars','Prill','Maj','Qershor',
		'Korrik','Gusht','Shtator','Tetor','Nëntor','Dhjetor'],
		monthNamesShort: ['Jan','Shk','Mar','Pri','Maj','Qer',
		'Kor','Gus','Sht','Tet','Nën','Dhj'],
		dayNames: ['E Diel','E Hënë','E Martë','E Mërkurë','E Enjte','E Premte','E Shtune'],
		dayNamesShort: ['Di','Hë','Ma','Më','En','Pr','Sh'],
		dayNamesMin: ['Di','Hë','Ma','Më','En','Pr','Sh'],
		dateFormat: 'dd.mm.yyyy', firstDay: 1,
		renderer: $.datepick.defaultRenderer,
		prevText: '&#x3c;mbrapa', prevStatus: 'trego muajin e fundit',
		prevJumpText: '&#x3c;&#x3c;', prevJumpStatus: '',
		nextText: 'Përpara&#x3e;', nextStatus: 'trego muajin tjetër',
		nextJumpText: '&#x3e;&#x3e;', nextJumpStatus: '',
		currentText: 'sot', currentStatus: '',
		todayText: 'sot', todayStatus: '',
		clearText: 'fshije', clearStatus: 'fshije datën aktuale',
		closeText: 'mbylle', closeStatus: 'mbylle pa ndryshime',
		yearStatus: 'trego tjetër vit', monthStatus: 'trego muajin tjetër',
		weekText: 'Ja', weekStatus: 'Java e muajit',
		dayStatus: '\'Zgjedh\' D, M d', defaultStatus: 'Zgjedhe një datë',
		isRTL: false
	};
	$.datepick.setDefaults($.datepick.regional['sq']);
})(jQuery);
﻿/* http://keith-wood.name/datepick.html
   Serbian localisation for jQuery Datepicker.
   Written by Dejan Dimić. */
(function($){
	$.datepick.regional['sr-SR'] = {
		monthNames: ['Januar','Februar','Mart','April','Maj','Jun',
		'Jul','Avgust','Septembar','Oktobar','Novembar','Decembar'],
		monthNamesShort: ['Jan','Feb','Mar','Apr','Maj','Jun',
		'Jul','Avg','Sep','Okt','Nov','Dec'],
		dayNames: ['Nedelja','Ponedeljak','Utorak','Sreda','Četvrtak','Petak','Subota'],
		dayNamesShort: ['Ned','Pon','Uto','Sre','Čet','Pet','Sub'],
		dayNamesMin: ['Ne','Po','Ut','Sr','Če','Pe','Su'],
		dateFormat: 'dd/mm/yyyy', firstDay: 1,
		renderer: $.datepick.defaultRenderer,
		prevText: '&#x3c;', prevStatus: 'Prikaži prethodni mesec',
		prevJumpText: '&#x3c;&#x3c;', prevJumpStatus: 'Prikaži prethodnu godinu',
		nextText: '&#x3e;', nextStatus: 'Prikaži sledeći mesec',
		nextJumpText: '&#x3e;&#x3e;', nextJumpStatus: 'Prikaži sledeću godinu',
		currentText: 'Danas', currentStatus: 'Tekući mesec',
		todayText: 'Danas', todayStatus: 'Tekući mesec',
		clearText: 'Obriši', clearStatus: 'Obriši trenutni datum',
		closeText: 'Zatvori', closeStatus: 'Zatvori kalendar',
		yearStatus: 'Prikaži godine', monthStatus: 'Prikaži mesece',
		weekText: 'Sed', weekStatus: 'Sedmica',
		dayStatus: '\'Datum\' D, M d', defaultStatus: 'Odaberi datum',
		isRTL: false
	};
	$.datepick.setDefaults($.datepick.regional['sr-SR']);
})(jQuery);
﻿/* http://keith-wood.name/datepick.html
   Serbian localisation for jQuery Datepicker.
   Written by Dejan Dimić. */
(function($) {
	$.datepick.regional['sr'] = {
		monthNames: ['Јануар','Фебруар','Март','Април','Мај','Јун',
		'Јул','Август','Септембар','Октобар','Новембар','Децембар'],
		monthNamesShort: ['Јан','Феб','Мар','Апр','Мај','Јун',
		'Јул','Авг','Сеп','Окт','Нов','Дец'],
		dayNames: ['Недеља','Понедељак','Уторак','Среда','Четвртак','Петак','Субота'],
		dayNamesShort: ['Нед','Пон','Уто','Сре','Чет','Пет','Суб'],
		dayNamesMin: ['Не','По','Ут','Ср','Че','Пе','Су'],
		dateFormat: 'dd/mm/yyyy', firstDay: 1,
		renderer: $.datepick.defaultRenderer,
		prevText: '&#x3c;', prevStatus: 'Прикажи претходни месец',
		prevJumpText: '&#x3c;&#x3c;', prevJumpStatus: 'Прикажи претходну годину',
		nextText: '&#x3e;', nextStatus: 'Прикажи следећи месец',
		nextJumpText: '&#x3e;&#x3e;', nextJumpStatus: 'Прикажи следећу годину',
		currentText: 'Данас', currentStatus: 'Текући месец',
		todayText: 'Данас', todayStatus: 'Текући месец',
		clearText: 'Обриши', clearStatus: 'Обриши тренутни датум',
		closeText: 'Затвори', closeStatus: 'Затвори календар',
		yearStatus: 'Прикажи године', monthStatus: 'Прикажи месеце',
		weekText: 'Сед', weekStatus: 'Седмица',
		dayStatus: '\'Датум\' DD d MM', defaultStatus: 'Одабери датум',
		isRTL: false
	};
	$.datepick.setDefaults($.datepick.regional['sr']);
})(jQuery);
﻿/* http://keith-wood.name/datepick.html
   Swedish localisation for jQuery Datepicker.
   Written by Anders Ekdahl (anders@nomadiz.se). */
(function($) {
    $.datepick.regional['sv'] = {
        monthNames: ['Januari','Februari','Mars','April','Maj','Juni',
        'Juli','Augusti','September','Oktober','November','December'],
        monthNamesShort: ['Jan','Feb','Mar','Apr','Maj','Jun',
        'Jul','Aug','Sep','Okt','Nov','Dec'],
		dayNames: ['Söndag','Måndag','Tisdag','Onsdag','Torsdag','Fredag','Lördag'],
		dayNamesShort: ['Sön','Mån','Tis','Ons','Tor','Fre','Lör'],
		dayNamesMin: ['Sö','Må','Ti','On','To','Fr','Lö'],
        dateFormat: 'yyyy-mm-dd', firstDay: 1,
		renderer: $.datepick.defaultRenderer,
        prevText: '&laquo;Förra',  prevStatus: '',
		prevJumpText: '&#x3c;&#x3c;', prevJumpStatus: '',
		nextText: 'Nästa&raquo;', nextStatus: '',
		nextJumpText: '&#x3e;&#x3e;', nextJumpStatus: '',
		currentText: 'Idag', currentStatus: '',
		todayText: 'Idag', todayStatus: '',
		clearText: 'Rensa', clearStatus: '',
		closeText: 'Stäng', closeStatus: '',
		yearStatus: '', monthStatus: '',
		weekText: 'Ve', weekStatus: '',
		dayStatus: 'D, M d', defaultStatus: '',
		isRTL: false
	};
    $.datepick.setDefaults($.datepick.regional['sv']);
})(jQuery);
﻿/* http://keith-wood.name/datepick.html
   Tamil localisation for jQuery Datepicker.
   Written by S A Sureshkumar (saskumar@live.com). */
(function($) {
	$.datepick.regional['ta'] = {
		monthNames: ['தை','மாசி','பங்குனி','சித்திரை','வைகாசி','ஆனி',
		'ஆடி','ஆவணி','புரட்டாசி','ஐப்பசி','கார்த்திகை','மார்கழி'],
		monthNamesShort: ['தை','மாசி','பங்','சித்','வைகா','ஆனி',
		'ஆடி','ஆவ','புர','ஐப்','கார்','மார்'],
		dayNames: ['ஞாயிற்றுக்கிழமை','திங்கட்கிழமை','செவ்வாய்க்கிழமை','புதன்கிழமை','வியாழக்கிழமை','வெள்ளிக்கிழமை','சனிக்கிழமை'],
		dayNamesShort: ['ஞாயிறு','திங்கள்','செவ்வாய்','புதன்','வியாழன்','வெள்ளி','சனி'],
		dayNamesMin: ['ஞா','தி','செ','பு','வி','வெ','ச'],
		dateFormat: 'dd/mm/yyyy', firstDay: 1,
		renderer: $.datepick.defaultRenderer,
		prevText: 'முன்னையது',  prevStatus: '',
		prevJumpText: '&#x3c;&#x3c;', prevJumpStatus: '',
		nextText: 'அடுத்தது', nextStatus: '',
		nextJumpText: '&#x3e;&#x3e;', nextJumpStatus: '',
		currentText: 'இன்று', currentStatus: '',
		todayText: 'இன்று', todayStatus: '',
		clearText: 'அழி', clearStatus: '',
		closeText: 'மூடு', closeStatus: '',
		yearStatus: '', monthStatus: '',
		weekText: 'Wk', weekStatus: '',
		dayStatus: 'D, M d', defaultStatus: '',
		isRTL: false
	};
	$.datepick.setDefaults($.datepick.regional['ta']);
})(jQuery);
﻿/* http://keith-wood.name/datepick.html
   Thai localisation for jQuery Datepicker.
   Written by pipo (pipo@sixhead.com). */
(function($) {
	$.datepick.regional['th'] = {
		monthNames: ['มกราคม','กุมภาพันธ์','มีนาคม','เมษายน','พฤษภาคม','มิถุนายน',
		'กรกฎาคม','สิงหาคม','กันยายน','ตุลาคม','พฤศจิกายน','ธันวาคม'],
		monthNamesShort: ['ม.ค.','ก.พ.','มี.ค.','เม.ย.','พ.ค.','มิ.ย.',
		'ก.ค.','ส.ค.','ก.ย.','ต.ค.','พ.ย.','ธ.ค.'],
		dayNames: ['อาทิตย์','จันทร์','อังคาร','พุธ','พฤหัสบดี','ศุกร์','เสาร์'],
		dayNamesShort: ['อา.','จ.','อ.','พ.','พฤ.','ศ.','ส.'],
		dayNamesMin: ['อา.','จ.','อ.','พ.','พฤ.','ศ.','ส.'],
		dateFormat: 'dd/mm/yyyy', firstDay: 0,
		renderer: $.datepick.defaultRenderer,
		prevText: '&laquo;&nbsp;ย้อน', prevStatus: '',
		prevJumpText: '&#x3c;&#x3c;', prevJumpStatus: '',
		nextText: 'ถัดไป&nbsp;&raquo;', nextStatus: '',
		nextJumpText: '&#x3e;&#x3e;', nextJumpStatus: '',
		currentText: 'วันนี้', currentStatus: '',
		todayText: 'วันนี้', todayStatus: '',
		clearText: 'ลบ', clearStatus: '',
		closeText: 'ปิด', closeStatus: '',
		yearStatus: '', monthStatus: '',
		weekText: 'Wk', weekStatus: '',
		dayStatus: 'D, M d', defaultStatus: '',
		isRTL: false
	};
	$.datepick.setDefaults($.datepick.regional['th']);
})(jQuery);
/* http://keith-wood.name/datepick.html
   Turkish localisation for jQuery Datepicker.
   Written by Izzet Emre Erkan (kara@karalamalar.net). */
(function($) {
	$.datepick.regional['tr'] = {
		monthNames: ['Ocak','Şubat','Mart','Nisan','Mayıs','Haziran',
		'Temmuz','Ağustos','Eylül','Ekim','Kasım','Aralık'],
		monthNamesShort: ['Oca','Şub','Mar','Nis','May','Haz',
		'Tem','Ağu','Eyl','Eki','Kas','Ara'],
		dayNames: ['Pazar','Pazartesi','Salı','Çarşamba','Perşembe','Cuma','Cumartesi'],
		dayNamesShort: ['Pz','Pt','Sa','Ça','Pe','Cu','Ct'],
		dayNamesMin: ['Pz','Pt','Sa','Ça','Pe','Cu','Ct'],
		dateFormat: 'dd.mm.yyyy', firstDay: 1,
		renderer: $.datepick.defaultRenderer,
		prevText: '&#x3c;geri', prevStatus: 'önceki ayı göster',
		prevJumpText: '&#x3c;&#x3c;', prevJumpStatus: '',
		nextText: 'ileri&#x3e', nextStatus: 'sonraki ayı göster',
		nextJumpText: '&#x3e;&#x3e;', nextJumpStatus: '',
		currentText: 'bugün', currentStatus: '',
		todayText: 'bugün', todayStatus: '',
		clearText: 'temizle', clearStatus: 'geçerli tarihi temizler',
		closeText: 'kapat', closeStatus: 'sadece göstergeyi kapat',
		yearStatus: 'başka yıl', monthStatus: 'başka ay',
		weekText: 'Hf', weekStatus: 'Ayın haftaları',
		dayStatus: 'D, M d seçiniz', defaultStatus: 'Bir tarih seçiniz',
		isRTL: false
	};
	$.datepick.setDefaults($.datepick.regional['tr']);
})(jQuery);
/* http://keith-wood.name/datepick.html
   Ukrainian localisation for jQuery Datepicker.
   Written by Maxim Drogobitskiy (maxdao@gmail.com). */
(function($) {
	$.datepick.regional['uk'] = {
		monthNames: ['Січень','Лютий','Березень','Квітень','Травень','Червень',
		'Липень','Серпень','Вересень','Жовтень','Листопад','Грудень'],
		monthNamesShort: ['Січ','Лют','Бер','Кві','Тра','Чер',
		'Лип','Сер','Вер','Жов','Лис','Гру'],
		dayNames: ['неділя','понеділок','вівторок','середа','четвер','п\'ятниця','субота'],
		dayNamesShort: ['нед','пнд','вів','срд','чтв','птн','сбт'],
		dayNamesMin: ['Нд','Пн','Вт','Ср','Чт','Пт','Сб'],
		dateFormat: 'dd/mm/yyyy', firstDay: 1,
		renderer: $.datepick.defaultRenderer,
		prevText: '&#x3c;',  prevStatus: '',
		prevJumpText: '&#x3c;&#x3c;', prevJumpStatus: '',
		nextText: '&#x3e;', nextStatus: '',
		nextJumpText: '&#x3e;&#x3e;', nextJumpStatus: '',
		currentText: 'Сьогодні', currentStatus: '',
		todayText: 'Сьогодні', todayStatus: '',
		clearText: 'Очистити', clearStatus: '',
		closeText: 'Закрити', closeStatus: '',
		yearStatus: '', monthStatus: '',
		weekText: 'Не', weekStatus: '',
		dayStatus: 'D, M d', defaultStatus: '',
		isRTL: false
	};
	$.datepick.setDefaults($.datepick.regional['uk']);
})(jQuery);
﻿/* http://keith-wood.name/datepick.html
   Urdu localisation for jQuery Datepicker.
   Mansoor Munib -- mansoormunib@gmail.com <http://www.mansoor.co.nr/mansoor.html>
   Thanks to Habib Ahmed, ObaidUllah Anwar. */
(function($) {
	$.datepick.regional['ur'] = {
		monthNames: ['جنوری','فروری','مارچ','اپریل','مئی','جون',
		'جولائی','اگست','ستمبر','اکتوبر','نومبر','دسمبر'],
		monthNamesShort: ['1','2','3','4','5','6',
		'7','8','9','10','11','12'],
		dayNames: ['اتوار','پير','منگل','بدھ','جمعرات','جمعہ','ہفتہ'],
		dayNamesShort: ['اتوار','پير','منگل','بدھ','جمعرات','جمعہ','ہفتہ'],
		dayNamesMin: ['اتوار','پير','منگل','بدھ','جمعرات','جمعہ','ہفتہ'],
		dateFormat: 'dd/mm/yyyy', firstDay: 0,
		renderer: $.datepick.defaultRenderer,
		prevText: '&#x3c;گذشتہ', prevStatus: 'ماه گذشتہ',
		prevJumpText: '&#x3c;&#x3c;', prevJumpStatus: 'برس گذشتہ',
		nextText: 'آئندہ&#x3e;', nextStatus: 'ماه آئندہ',
		nextJumpText: '&#x3e;&#x3e;', nextJumpStatus: 'برس آئندہ',
		currentText: 'رواں', currentStatus: 'ماه رواں',
		todayText: 'آج', todayStatus: 'آج',
		clearText: 'حذف تاريخ', clearStatus: 'کریں حذف تاریخ',
		closeText: 'کریں بند', closeStatus: 'کیلئے کرنے بند',
		yearStatus: 'برس تبدیلی', monthStatus: 'ماه تبدیلی',
		weekText: 'ہفتہ', weekStatus: 'ہفتہ',
		dayStatus: 'انتخاب D, M d', defaultStatus: 'کریں منتخب تاريخ',
		isRTL: true
	};
	$.datepick.setDefaults($.datepick.regional['ur']);
})(jQuery);
﻿/* http://keith-wood.name/datepick.html
   Vietnamese localisation for jQuery Datepicker.
   Translated by Le Thanh Huy (lthanhhuy@cit.ctu.edu.vn). */
(function($) {
	$.datepick.regional['vi'] = {
		monthNames: ['Tháng Một', 'Tháng Hai', 'Tháng Ba', 'Tháng Tư', 'Tháng Năm', 'Tháng Sáu',
		'Tháng Bảy', 'Tháng Tám', 'Tháng Chín', 'Tháng Mười', 'Tháng Mười Một', 'Tháng Mười Hai'],
		monthNamesShort: ['Tháng 1', 'Tháng 2', 'Tháng 3', 'Tháng 4', 'Tháng 5', 'Tháng 6',
		'Tháng 7', 'Tháng 8', 'Tháng 9', 'Tháng 10', 'Tháng 11', 'Tháng 12'],
		dayNames: ['Chủ Nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'],
		dayNamesShort: ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'],
		dayNamesMin: ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'],
		dateFormat: 'dd/mm/yyyy', firstDay: 0,
		renderer: $.datepick.defaultRenderer,
		prevText: '&#x3c;Trước', prevStatus: 'Tháng trước',
		prevJumpText: '&#x3c;&#x3c;', prevJumpStatus: 'Năm trước',
		nextText: 'Tiếp&#x3e;', nextStatus: 'Tháng sau',
		nextJumpText: '&#x3e;&#x3e;', nextJumpStatus: 'Năm sau',
		currentText: 'Hôm nay', currentStatus: 'Tháng hiện tại',
		todayText: 'Hôm nay', todayStatus: 'Tháng hiện tại',
		clearText: 'Xóa', clearStatus: 'Xóa ngày hiện tại',
		closeText: 'Đóng', closeStatus: 'Đóng và không lưu lại thay đổi',
		yearStatus: 'Năm khác', monthStatus: 'Tháng khác',
		weekText: 'Tu', weekStatus: 'Tuần trong năm',
		dayStatus: 'Đang chọn DD, \'ngày\' d M', defaultStatus: 'Chọn ngày',
		isRTL: false
	};
	$.datepick.setDefaults($.datepick.regional['vi']);
})(jQuery);
/* http://keith-wood.name/datepick.html
   Simplified Chinese localisation for jQuery Datepicker.
   Written by Cloudream (cloudream@gmail.com). */
(function($) {
	$.datepick.regional['zh-CN'] = {
		monthNames: ['一月','二月','三月','四月','五月','六月',
		'七月','八月','九月','十月','十一月','十二月'],
		monthNamesShort: ['一','二','三','四','五','六',
		'七','八','九','十','十一','十二'],
		dayNames: ['星期日','星期一','星期二','星期三','星期四','星期五','星期六'],
		dayNamesShort: ['周日','周一','周二','周三','周四','周五','周六'],
		dayNamesMin: ['日','一','二','三','四','五','六'],
		dateFormat: 'yyyy-mm-dd', firstDay: 1,
		renderer: $.extend({}, $.datepick.defaultRenderer,
			{month: $.datepick.defaultRenderer.month.
				replace(/monthHeader/, 'monthHeader:MM yyyy年')}),
		prevText: '&#x3c;上月', prevStatus: '显示上月',
		prevJumpText: '&#x3c;&#x3c;', prevJumpStatus: '显示上一年',
		nextText: '下月&#x3e;', nextStatus: '显示下月',
		nextJumpText: '&#x3e;&#x3e;', nextJumpStatus: '显示下一年',
		currentText: '今天', currentStatus: '显示本月',
		todayText: '今天', todayStatus: '显示本月',
		clearText: '清除', clearStatus: '清除已选日期',
		closeText: '关闭', closeStatus: '不改变当前选择',
		yearStatus: '选择年份', monthStatus: '选择月份',
		weekText: '周', weekStatus: '年内周次',
		dayStatus: '选择 m月 d日, DD', defaultStatus: '请选择日期',
		isRTL: false
	};
	$.datepick.setDefaults($.datepick.regional['zh-CN']);
})(jQuery);
﻿/* http://keith-wood.name/datepick.html
   Hong Kong Chinese localisation for jQuery Datepicker.
   Written by SCCY (samuelcychan@gmail.com). */
(function($) {
	$.datepick.regional['zh-HK'] = {
		monthNames: ['一月','二月','三月','四月','五月','六月',
		'七月','八月','九月','十月','十一月','十二月'],
		monthNamesShort: ['一','二','三','四','五','六',
		'七','八','九','十','十一','十二'],
		dayNames: ['星期日','星期一','星期二','星期三','星期四','星期五','星期六'],
		dayNamesShort: ['周日','周一','周二','周三','周四','周五','周六'],
		dayNamesMin: ['日','一','二','三','四','五','六'],
		dateFormat: 'dd-mm-yyyy', firstDay: 0,
		renderer: $.extend({}, $.datepick.defaultRenderer,
			{month: $.datepick.defaultRenderer.month.
				replace(/monthHeader/, 'monthHeader:yyyy年 MM')}),
		prevText: '&#x3c;上月', prevStatus: '顯示上月',
		prevJumpText: '&#x3c;&#x3c;', prevJumpStatus: '顯示上一年',
		nextText: '下月&#x3e;', nextStatus: '顯示下月',
		nextJumpText: '&#x3e;&#x3e;', nextJumpStatus: '顯示下一年',
		currentText: '今天', currentStatus: '顯示本月',
		todayText: '今天', todayStatus: '顯示本月',
		clearText: '清除', clearStatus: '清除已選日期',
		closeText: '關閉', closeStatus: '不改變目前的選擇',
		yearStatus: '選擇年份', monthStatus: '選擇月份',
		weekText: '周', weekStatus: '年內周次',
		dayStatus: '選擇 m月 d日, DD', defaultStatus: '請選擇日期',
		isRTL: false
	};
	$.datepick.setDefaults($.datepick.regional['zh-HK']);
})(jQuery);
﻿/* http://keith-wood.name/datepick.html
   Traditional Chinese localisation for jQuery Datepicker.
   Written by Ressol (ressol@gmail.com). */
(function($) {
	$.datepick.regional['zh-TW'] = {
		monthNames: ['一月','二月','三月','四月','五月','六月',
		'七月','八月','九月','十月','十一月','十二月'],
		monthNamesShort: ['一','二','三','四','五','六',
		'七','八','九','十','十一','十二'],
		dayNames: ['星期日','星期一','星期二','星期三','星期四','星期五','星期六'],
		dayNamesShort: ['周日','周一','周二','周三','周四','周五','周六'],
		dayNamesMin: ['日','一','二','三','四','五','六'],
		dateFormat: 'yyyy/mm/dd', firstDay: 1,
		renderer: $.extend({}, $.datepick.defaultRenderer,
			{month: $.datepick.defaultRenderer.month.
				replace(/monthHeader/, 'monthHeader:MM yyyy年')}),
		prevText: '&#x3c;上月', prevStatus: '顯示上月',
		prevJumpText: '&#x3c;&#x3c;', prevJumpStatus: '顯示上一年',
		nextText: '下月&#x3e;', nextStatus: '顯示下月',
		nextJumpText: '&#x3e;&#x3e;', nextJumpStatus: '顯示下一年',
		currentText: '今天', currentStatus: '顯示本月',
		todayText: '今天', todayStatus: '顯示本月',
		clearText: '清除', clearStatus: '清除已選日期',
		closeText: '關閉', closeStatus: '不改變目前的選擇',
		yearStatus: '選擇年份', monthStatus: '選擇月份',
		weekText: '周', weekStatus: '年內周次',
		dayStatus: '選擇 m月 d日, DD', defaultStatus: '請選擇日期',
		isRTL: false
	};
	$.datepick.setDefaults($.datepick.regional['zh-TW']);
})(jQuery);
