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
