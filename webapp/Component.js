sap.ui.define([
	"sap/ui/core/UIComponent",
	"sap/ui/Device",
	"softtek/Abono/model/models"
], function (UIComponent, Device, models) {
	"use strict";

	return UIComponent.extend("softtek.Abono.Component", {

		metadata: {
			manifest: "json"
		},

		createContent: function () {
			// create root view
			this.view = sap.ui.view({
				id: "app",
				viewName: "softtek.Abono.view.historico",
				type: sap.ui.core.mvc.ViewType.XML,
				viewData: {
					component: this
				}
			});
			return this.view;
		},

		init: function () {
			// call the base component's init function
			UIComponent.prototype.init.apply(this, arguments);

			// enable routing
			this.getRouter().initialize();

			// set the device model
			this.setModel(models.createDeviceModel(), "device");
		}
	});
});