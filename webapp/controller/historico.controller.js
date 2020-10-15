sap.ui.define([
	"sap/ui/core/mvc/Controller",
	"sap/ui/model/json/JSONModel",
	'sap/ui/model/Filter',
	'sap/ui/model/FilterOperator',
	'softtek/Abono/model/formatter',
	'sap/ui/core/util/Export',
	'sap/ui/core/util/ExportTypeCSV'
], function (Controller, JSONModel, Filter, FilterOperator, formatter, Export, ExportTypeCSV) {
	"use strict";

	return Controller.extend("softtek.Abono.controller.historico", {
		formatter: formatter,
		onInit: function () {

			this.vReload = false;
			//To set it
			var data = {"abonoReal" : "init"};
			var oGlobalModel = new sap.ui.model.json.JSONModel(data);
			this.getView().setModel(oGlobalModel,"GlobalModel");
			//sap.ui.getCore().setModel(oGlobalModel, "GlobalModel");

		},

		onBeforeRendering: function (oEvent) {

			this.initFilterView();

			if (!this.getSolicitante()) {
				this.applyFilters();
			}

		},

		getSolicitante: function () {

			var action = this.oView.oPreprocessorInfo.componentId;

			if (String(action).includes("SM")) {

				if (!this._oSolicitante) {

					this._oSolicitante = sap.ui.xmlfragment("SoliciDialogFragment", "softtek.Abono.view.solicitantes", this);
					this.getView().addDependent(this._oSolicitante, "solicitantes");

					this.setField("Periodo", "0");
					this.applyFilters();

				}

				this._oSolicitante.open();
				return true;
			}
		},

		/*onConfirmSolic: function () {
			var oValor = sap.ui.core.Fragment.byId("SoliciDialogFragment", "Solicitante").getSelectedKey();
			if (oValor !== "") {
				this._cargarFiltros = true;
				this.setField("Periodo", "3");
				this.applyFilters();
				this._oViewSettingsDialog.close();
			}
		},*/

		onNavBack: function () {
			var oHistory = History.getInstance();
			var sPreviousHash = oHistory.getPreviousHash();

			if (sPreviousHash !== undefined) {
				window.history.go(-1);
			} else {
				var oRouter = sap.ui.core.UIComponent.getRouterFor(this);
				oRouter.navTo("overview", true);
			}

		},

		applyFilters: function () {

			var aFilters = [];
			this.cargarFiltroPeriodo(aFilters, "Periodo");

			this.cargarSolicitante(aFilters, "Solicitante");

			var oTable = this.getView().byId("Table");
			var oBinding = oTable.getBinding("items");
			oBinding.filter(aFilters);
			this.getView().setBusy(true);
		},

		cargarSolicitante: function (Filtros, Campo) {
			if (this._Solic !== undefined) {
			/*if (sap.ui.core.Fragment.byId("SoliciDialogFragment", Campo) !== undefined) {*/
				var oValor = this._Solic;
				/*var oValor = sap.ui.core.Fragment.byId("SoliciDialogFragment", Campo).getSelectedKey();*/
				if (oValor !== "")
					Filtros.push(new Filter(Campo, FilterOperator.EQ, oValor));
			}
		},

		cargarFiltroPeriodo: function (Filtros, Campo) {
			var oValor = sap.ui.core.Fragment.byId("FilterDialogFragment", Campo).getSelectedKey();

			var añoAct = new Date().getFullYear();
			var mesAct = new Date().getMonth();
			
			var lastday = new Date(añoAct, mesAct +1 , 0);

			var monthCalc = new Date();
			monthCalc.setMonth( monthCalc.getMonth() + 1 - oValor + 1 );
			
			var FecDesde = new Date(monthCalc.getFullYear(), monthCalc.getMonth() - 1, 1);
			
			var FecHasta = new Date(añoAct, lastday.getMonth()  , lastday.getDate());
			

			Filtros.push(new Filter("fechaFiltro", FilterOperator.BT, FecDesde, FecHasta));
		},

		cargarFiltroPeriodoEspecifico: function (Filtros, Periodo) {

			var añoAct = String(Periodo).substring(3, 7);
			var mesAct = String(Periodo).substring(0, 2) - 1;

			var lastday = new Date(añoAct, mesAct + 1, 0);

			var FecHasta = new Date(añoAct, mesAct, lastday.getDate());
			var FecDesde = new Date(añoAct, mesAct, 1);

			Filtros.push(new Filter("fechaFiltro", FilterOperator.BT, FecDesde, FecHasta));
		},

		cargarFiltroPeriodoSap: function (Filtros, Campo) {
			var oValor = sap.ui.core.Fragment.byId("FilterDialogFragment", Campo).getSelectedKey();

			var añoAct = new Date().getFullYear();
			var mesAct = new Date().getMonth() + 1 + 1; // Por tema abap le sumo uno mas

			var monthCalc = new Date();
			monthCalc.setMonth(monthCalc.getMonth() + 1 - oValor + 1 ); 

			var FecDesde = String(monthCalc.getMonth()).concat(monthCalc.getFullYear());
			var FecHasta = String(mesAct).concat(añoAct);

			Filtros.push(new Filter("Periodo", FilterOperator.BT, FecDesde, FecHasta));

		},

		cargarFiltro: function (Filtros, Campo) {
			var oValor = sap.ui.core.Fragment.byId("FilterDialogFragment", Campo).getSelectedKey();
			if (oValor !== "")
				Filtros.push(new Filter(Campo, FilterOperator.EQ, oValor));
		},

		handleMessagePopoverPress: function (oEvent) {

			if (!this.oMP) {
				this.createMessagePopover();
			}
			this.oMP.toggle(oEvent.getSource());

		},
		
		handleSearch: function (oEvent) {
			var sValue = oEvent.getParameter("value");
			var oFilter = [];
			oFilter.push(new Filter("descripcion", sap.ui.model.FilterOperator.Contains, sValue));
			oFilter.push(new Filter("codigo", sap.ui.model.FilterOperator.Contains, sValue));
			var oBinding = oEvent.getSource().getBinding("items");
			oBinding.filter(oFilter);
		},
		handleConfirm: function (oEvent) {
			var aContexts = oEvent.getParameter("selectedContexts");

			if (aContexts && aContexts.length) {
				var vari = aContexts.map(function (oContext) {
					return oContext.getObject().codigo;
				});
				this._Solic = vari[0];
				
				this._cargarFiltros = true;
				this.setField("Periodo", "3");
				this.applyFilters();
				this._oViewSettingsDialog.close();

			}

		},

		handleClose: function (oEvent) {
			var oCrossAppNavigator = sap.ushell.Container.getService("CrossApplicationNavigation");
			oCrossAppNavigator.toExternal({
				target: {
					semanticObject: "#"
				}
			});
		},

		createMessagePopover: function () {

			var that = this;
			this.oMP = new sap.m.MessagePopover({
				activeTitlePress: function (oEvent) {
					var oItem = oEvent.getParameter("item"),
						oPage = that.oView.byId("messageHandlingPage"),
						oMessage = oItem.getBindingContext("message").getObject(),
						oControl = sap.ui.getCore().byId(oMessage.getControlId());

					if (oControl && oControl.getDomRef()) {
						oPage.scrollToElement(oControl.getDomRef(), 200, [0, -100]);
						setTimeout(function () {
							oControl.focus();
						}, 300);
					}
				},
				items: {
					path: "message>/",
					template: new sap.m.MessageItem({
						title: "{message>message}",
						subtitle: "{message>additionalText}",
						groupName: {
							parts: [{
								path: 'message>controlId'
							}],
							formatter: this.getGroupName
						},
						activeTitle: {
							parts: [{
								path: 'message>controlId'
							}],
							formatter: this.isPositionable
						},
						type: "{message>type}",
						description: "{message>message}"
					})
				}
			});

			this.oMP._oMessageView.setGroupItems(true);
			this.getView().byId("messageBtn").addDependent(this.oMP);

		},

		initFilterView: function () {
			if (!this._oViewSettingsDialog) {
				this._oViewSettingsDialog = sap.ui.xmlfragment("FilterDialogFragment", "softtek.Abono.view.filtros", this);
				this.getView().addDependent(this._oViewSettingsDialog);
				this._oFiltros = {
					Periodo: []
				};
				this.cargarPeriodo();
				this._oViewSettingsDialog.setModel(new sap.ui.model.json.JSONModel(this._oFiltros), "Filtros");
			}
		},

		onConfirm: function () {
			this._cargarFiltros = true;
			this.applyFilters();
			this._oViewSettingsDialog.close();

		},

		onClose: function () {
			this._oViewSettingsDialog.close();
		},

		cargarPeriodo: function () {

			this._oFiltros.Periodo = [{
				key: 3,
				value: "3 Meses"
			}, {
				key: 6,
				value: "6 Meses"
			}, {
				key: 12,
				value: "12 Meses"
			}];

			sap.ui.core.Fragment.byId("FilterDialogFragment", "Periodo").setSelectedKey(3);

		},

		cargarAbono: function () {

			if (!this.vReload)
				this.dibujarBar();
			else
				this.vReload = !this.vReload;

		},

		OKAbonoSet: function (oData, oPeriodo) {

			var Abonos = new sap.ui.model.json.JSONModel(oData.results);

			var oModel = this.getView().byId("barTickets").getModel();
			var oModelNuevo = {};
			oModelNuevo.HistoricoReal = oModel.getProperty("/Historico");
			for (var x = 0; x < oModelNuevo.HistoricoReal.length; x++) {
				var pos = this.arrayObjectIndexOf(Abonos.getProperty("/"), "0" + oModelNuevo.HistoricoReal[x].Periodo, "Periodo");
				if (pos >= 0) {
					oModelNuevo.HistoricoReal[x].h1 = Abonos.getProperty("/")[pos].AbonoReal;
					var restante = oModelNuevo.HistoricoReal[x].h3 - Abonos.getProperty("/")[pos].AbonoReal;
					if (restante > 0) {
						oModelNuevo.HistoricoReal[x].h2 = restante;
						oModelNuevo.HistoricoReal[x].h3 = oModelNuevo.HistoricoReal[x].h3 - restante;
					}
				}
			}

			this.getView().byId("barTickets").setModel(new sap.ui.model.json.JSONModel(oModelNuevo));
			this.getView().setBusy(false);
			
			var GlobalModel = this.getView().getModel("GlobalModel");
			if( oModel.getProperty("/Historico").length > 0){
				this.getView().byId("myText").setText( this.getView().byId("myText").getText() + " - Abono Contratado: " + Abonos.getProperty("/")[oModel.getProperty("/Historico").length].Abono);
			}
			//GlobalModel.setProperty("/abonoReal", "Click en el período para más detalle. - Abono Contratado: " + Abonos.getProperty("/")[oModel.getProperty("/Historico").length].Abono);

		},
		arrayObjectIndexOf: function (myArray, searchTerm, property) {
			for (var i = 0, len = myArray.length; i < len; i++) {
				if (myArray[i][property] === searchTerm) return i;
			}
			return -1;
		},

		dibujarBar: function () {

			var oModel = this.getView().byId("Table").getBinding("items").getModel();
			var listadoTickets = this.getView().byId("Table").getBinding("items").aKeys;

			var oDatos = {
				Historico: [],
				iHistorico: []
			};

			var oModel = this.getView().byId("Table").getBinding("items").getModel("Tickets");
			var listadoTickets = this.getView().byId("Table").getBinding("items").aKeys;

			//var oPeriodo = sap.ui.core.Fragment.byId("FilterDialogFragment", "Periodo").getSelectedKey();

			var aFilters = [];
			this.cargarFiltroPeriodoSap(aFilters, "Periodo");
			this.cargarSolicitante(aFilters, "Solicitante");

			var oModelAbono = this.getOwnerComponent().getModel("Abono");

			//Busco el abono del cliente
			oModelAbono.read("/AbonoSet", {
				filters: aFilters,
				success: jQuery.proxy(function (oData, Response) {
					this.OKAbonoSet(oData);
				}, this),
				error: function (oEventError) {
					var error = 1;

				}
			});

			if (listadoTickets instanceof Array) {

				listadoTickets.forEach(jQuery.proxy(function (element) {
					var oTicket = oModel.getProperty("/".concat([element], "/"));
					if (oTicket.periodo !== undefined) {
						var index = oDatos.iHistorico.indexOf(oTicket.periodo);
						if (index < 0) {

							oDatos.iHistorico.push(oTicket.periodo);

							oDatos.Historico.push({
								id: String(oTicket.periodo).substring(4, 6) + "." + String(oTicket.periodo).substring(0, 4),
								h1: 0,
								h2: 0,
								h3: oTicket.hsPeriodo,
								Periodo: oTicket.periodo
							});

						} else {

							oDatos.Historico[index].h3 = parseFloat(oDatos.Historico[index].h3) + parseFloat(oTicket.hsPeriodo);
						}
					}
				}), this);
			}

			this.getView().byId("barTickets").setModel(new sap.ui.model.json.JSONModel(oDatos));
		},

		clearFilter: function () {
			this.setField("Periodo", "3");
			this.applyFilters();
		},

		onSelect: function (oEvent) {
			this._refreshAll = true;

			var Mes = oEvent.getParameter("data")[0].data.Mes;

			var aFilters = [];

			this.cargarFiltroPeriodoEspecifico(aFilters, Mes);

			this.cargarSolicitante(aFilters, "Solicitante");

			var oTable = this.getView().byId("Table");
			var oBinding = oTable.getBinding("items");
			oBinding.filter(aFilters);

			this.vReload = true;

			this.byId("excelIcon").setVisible(true);

			this.byId("Cont1").switchChart(this.byId("Cont1").getContent("1")[1]);

		},

		download: sap.m.Table.prototype.exportData || function () {

			var oModel = this.getOwnerComponent().getModel("Tickets");
			var listadoTickets = Object.getOwnPropertyNames(oModel.getProperty("/"));

			if (listadoTickets instanceof Array) {
				var oDatos = {
					Tickets: []
				};

				listadoTickets.forEach(jQuery.proxy(function (element) {
					var oTicket = oModel.getProperty("/".concat([element], "/"));
					oDatos.Tickets.push({
						Ticket: oTicket.ticket,
						Descripcion: oTicket.descripcion,
						Periodo: oTicket.periodo,
						HsPeriodo: oTicket.hsPeriodo,
						HsTotal: oTicket.hsTotal,
						Modulo: oTicket.modulo,
						Categoria: oTicket.categoria

					});
				}));
				var datos = new JSONModel(oDatos);
			}

			var oExport = new Export({
				exportType: new ExportTypeCSV({
					fileExtension: "csv",
					separatorChar: ";"
				}),

				models: datos,

				rows: {
					path: "/Tickets"
				},

				columns: [{
					name: "Ticket",
					template: {
						content: "{Ticket}"
					}
				}, {
					name: "Descripcion",
					template: {
						content: "{Descripcion}"
					}
				}, {
					name: "Periodo",
					template: {
						content: "{Periodo}"
					}
				}, {
					name: "HsPeriodo",
					template: {
						content: "{HsPeriodo}"
					}
				}, {
					name: "AHsTotal",
					template: {
						content: "{HsTotal}"
					}
				}, {
					name: "Modulo",
					template: {
						content: "{Modulo}"
					}
				}, {
					name: "Categoria",
					template: {
						content: "{Categoria}"
					}
				}]
			});
			oExport.saveFile("Tickets").catch(function (oError) {}).then(function () {});
		},

		navToTicket: function (oEvent) {

			var oItem = oEvent.getParameter("listItem") || oEvent.getSource();
			var path = oItem.getBindingContext("Tickets").getPath();
			var oTable = this.getView().byId("Table");
			var oBinding = oTable.getBinding("items");
			var ticket = oBinding.getModel().getProperty(path).ticket;
			if (sap.ushell && sap.ushell.Container && sap.ushell.Container.getService) {
				var oCrossAppNavigator = sap.ushell.Container.getService("CrossApplicationNavigation");
				/*var SO = this.byId("SO").getValue();
				var action = this.byId("action").getValue();*/
				oCrossAppNavigator.toExternal({
					target: {
						semanticObject: "ZLISTADOTICKETS",
						action: "display&/TicketsSet/" + ticket
					}
				});

			}

		},

		setField: function (Campo, Valor) {
			sap.ui.core.Fragment.byId("FilterDialogFragment", Campo).setSelectedKey(Valor);
		},

		filtrar: function () {

			this._oViewSettingsDialog.open();

		},
		cambio: function (oEvent) {
			if ((oEvent.getParameter("selectedItemId") === "app--barTickets" ) ) {
				this.byId("excelIcon").setVisible(false);
				/*this.byId("toolbar").setVisible(true);*/
				this.getView().byId("myText").setVisible(true);					
			} else {
				this.byId("excelIcon").setVisible(true);
				/*this.byId("toolbar").setVisible(false);*/
				//To get it
				this.getView().byId("myText").setVisible(false);
			}
		}

	});
});