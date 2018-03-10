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
	_dlgs: [],
	alert: function(message, callback) {
		"use strict";
		var dlg = $.alert({
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
		this._dlgs.push(dlg);
		return dlg;
	},
	dialog: function(options) {
		"use strict";
		var dlg = $.confirm({
			title: options.title,
			content: options.message,
			closeIcon: options.closeButton,
			buttons: options.buttons,
			onEscape: options.onClose,
			useBootstrap: false
		});
		this._dlgs.push(dlg);
		return dlg;
	},
	hideAll: function() {
		for (let dlg of this._dlgs) {
			dlg.close();
		}
		this._dlgs.length = 0;
	}
};
