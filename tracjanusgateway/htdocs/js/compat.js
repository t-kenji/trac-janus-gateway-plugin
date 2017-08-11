if (String.prototype.format === undefined) {
	String.prototype.format = function(arg) {
		var rep_fn = undefined;
		if (typeof arg == "object") {
			rep_fn = function(m, k) { return arg[k]; }
		} else {
			var args = arguments;
			rep_fn = function(m, k) { return args[parseInt(k)]; }
		}
		return this.replace(/\{(\w+)\}/g, rep_fn);
	}
}

bootbox = {
	alert: function(message, callback) {
		"use strict";
		$.alert({
			content: message,
			buttons: {
				OK: function() {
					if (callback && $.isFunction(callback)) {
						callback.call(this);
					}
				}
			},
			title: false,
			useBootstrap: false
		});
	},
	dialog: function(options) {
		"use strict";
		$.confirm({
			title: options.title,
			content: options.message,
			closeIcon: options.closeButton,
			buttons: options.buttons,
			onEscape: options.onClose
		});
	},
	hideAll: function() {
	}
};
