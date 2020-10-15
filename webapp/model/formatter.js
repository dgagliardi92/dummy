sap.ui.define([], function () {
	"use strict";
	return {
		periodo: function (periodo) {
			
			periodo = String(periodo).substring(4, 6) + "." + String(periodo).substring(0, 4);
			return periodo;
		}
	};
});