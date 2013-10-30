/*This script is governed by the license agreement located in the script directory. 
  By installing and using this script the end user acknowledges that they have accepted and 
  agree with all terms and conditions contained in the license agreement. All code remains the
  exclusive property of Online One Pty and the end user agrees that they will not attempt to
  copy, distribute, or reverse engineer this script, in whole or in part.
 */

/* Script Name: Chefs Toolbox PDF
Author: Online One Pty Ltd
Date: 28 June 2010
Version: 1
*/

function suitelet(request, response){

	if ( request.getMethod() == 'GET') {
		
    	//Create form
    	var form = nlapiCreateForm('Create PDFs');
    	
		var js_from_date = form.addField('custpage_from_date', 'date', 'Date From', null, null);
		var js_to_date = form.addField('custpage_to_date', 'date', 'Date To', null, null);
		var js_order_type = form.addField('custpage_order_type', 'select', 'Order Type', 'customlistsales_order_type', null);
		var js_so_number = form.addField('custpage_so_number', 'text', 'J6 SO number', null, null);
		var js_country = form.addField('custpage_country', 'select', 'Country');
		var js_value = form.addField('custpage_so_value', 'select', 'Order Value');
		js_country.addSelectOption('AU', 'Australia');
		js_country.addSelectOption('NZ', 'New Zealand');
		js_value.addSelectOption('less300', '<300$');
		js_value.addSelectOption('more300', '>=300$');
	
		var js_label_message = form.addField('custpage_label_message', 'select', 'Bag Label Message', 'customlist_bag_label_message', null);
		js_label_message.setDefaultValue('1');
		
		var js_email = form.addField('custpage_email', 'email', 'Email To:', null, null);
		var js_backorders = form.addField('custpage_backorders', 'checkbox', 'Backorders Only', null, null);
		var js_user_email = nlapiGetContext().getEmail();
		
		js_email.setDefaultValue(js_user_email);

        form.addSubmitButton('Print Orders');
        response.writePage(form);
   }
   else {
   	
		var params = request.getAllParameters();
        var js_from_date = params['custpage_from_date'];
		var js_to_date = params['custpage_to_date'];
		var js_order_type = params['custpage_order_type'];
		var js_email = params['custpage_email'];
		var js_message = params['custpage_label_message'];
		var js_so_number = params['custpage_so_number'];
		var js_include_backorders = params['custpage_backorders'];
		var js_country = params['custpage_country'];
		var js_value = params['custpage_so_value'];
		
		var ssparams = new Array();
		ssparams['custscript_from_date1'] = js_from_date;
		ssparams['custscript_to_date1'] = js_to_date;
		ssparams['custscript_order_type1'] = js_order_type;
		ssparams['custscript_email1'] = js_email;
		ssparams['custscript_message1'] = js_message;
		ssparams['custscript_so_id1'] = js_so_number;
		ssparams['custscript_include_backorders1'] = js_include_backorders;
		ssparams['custscript_country1'] = js_country;
		ssparams['custscript_js_value1'] = js_value;
		
//		response.write(js_from_date + ',' + js_to_date+ ',' + js_order_type
//				+ ',' + js_email
//				+ ',' + js_message
//				+ ',' + js_so_number
//				+ ',' + js_include_backorders
//				+ ',' + js_country
//				+ ',' + js_value);
		
		var status = nlapiScheduleScript('customscript_create_pdf_ss_new', null, ssparams);
		response.sendRedirect('TASKLINK', 'LIST_TRAN_SALESORD');
	}	
}

function scheduled_script(){

	//set the email address.
	var js_from_date = nlapiGetContext().getSetting('SCRIPT', 'custscript_from_date1');
	var js_to_date = nlapiGetContext().getSetting('SCRIPT', 'custscript_to_date1');
	var js_order_type = nlapiGetContext().getSetting('SCRIPT', 'custscript_order_type1');
	var js_email = nlapiGetContext().getSetting('SCRIPT', 'custscript_email1');
	var js_so_id = nlapiGetContext().getSetting('SCRIPT', 'custscript_so_id1');
	var js_message = nlapiGetContext().getSetting('SCRIPT', 'custscript_message1');
	var js_include_backorders = nlapiGetContext().getSetting('SCRIPT', 'custscript_include_backorders1');
	var js_country = nlapiGetContext().getSetting('SCRIPT', 'custscript_country1');
	var js_value = nlapiGetContext().getSetting('SCRIPT', 'custscript_js_value1');
	var soIds = new Array(); // bag label integration code
	nlapiLogExecution('debug', 'js_from_date', js_from_date);
	nlapiLogExecution('debug', 'js_to_date', js_to_date);
	nlapiLogExecution('debug', 'js_order_type', js_order_type);
	nlapiLogExecution('debug', 'js_email', js_email);
	nlapiLogExecution('debug', 'js_so_id', js_so_id);
	nlapiLogExecution('debug', 'js_message', js_message);
	nlapiLogExecution('debug', 'js_country', js_country);
	nlapiLogExecution('debug', 'js_value', js_value);
	
	var footer_message = nlapiLookupField('customlist_bag_label_message', js_message, 'name');
	//var footer_message = 'test';
	//var js_email = "lez@onlineone.com.au";
	//nlapiLogExecution('error', 'from date', js_from_date);
	//nlapiLogExecution('error', 'from date', js_to_date);
	
	//set the logo
	var js_logo = 'https://system.netsuite.com/core/media/media.nl?id=5&c=830812&h=1842bf40c9143dcbbc2c';
	var js_final_pdf = "";
	var js_email_body= '';
	var filters = new Array();
	var columns = new Array();
	
	if(js_include_backorders=='T'){
		filters[0] = new nlobjSearchFilter('custbody_print_status', null, 'anyof', ['2']);
	}
	else{
		filters[0] = new nlobjSearchFilter('custbody_print_status', null, 'noneof', ['3','2']);
	}
	filters[filters.length] = new nlobjSearchFilter('mainline', null, 'is', 'T');
	filters[filters.length] = new nlobjSearchFilter('subsidiary', null, 'noneof', ['2']);
	if (js_from_date != null && js_to_date != null) {
			filters[filters.length] = new nlobjSearchFilter('trandate', null, 'within', js_from_date, js_to_date);
			//filters[0] = new nlobjSearchFilter('custbody_print_status', null, 'noneof', ['3','2']);
	}
	if (js_so_id != null) {
		filters[filters.length] = new nlobjSearchFilter('tranid', null, 'is', js_so_id);
	}	
	
	columns[columns.length] = new nlobjSearchColumn('name');
	columns[columns.length] = new nlobjSearchColumn('trandate');
	columns[columns.length] = new nlobjSearchColumn('entity');
	columns[columns.length] = new nlobjSearchColumn('firstname', 'customer');
	columns[columns.length] = new nlobjSearchColumn('lastname', 'customer');
	columns[columns.length] = new nlobjSearchColumn('shipaddressee');
	columns[columns.length] = new nlobjSearchColumn('shipcity');
	columns[columns.length] = new nlobjSearchColumn('shipaddress1');
	columns[columns.length] = new nlobjSearchColumn('shipstate');
	columns[columns.length] = new nlobjSearchColumn('shipzip');
	columns[columns.length] = new nlobjSearchColumn('tranid');
	columns[columns.length] = new nlobjSearchColumn('custbodyphone_number');
	columns[columns.length] = new nlobjSearchColumn('custbody_print_status');
	columns[columns.length] = new nlobjSearchColumn('custbodyhost_shipping_address');
	columns[columns.length] = new nlobjSearchColumn('custbodyhost');
	columns[columns.length] = new nlobjSearchColumn('custbodyorder_type');
	columns[columns.length] = new nlobjSearchColumn('subsidiary');
	columns[columns.length] = new nlobjSearchColumn('message');
	
	if (js_order_type < 1) {
		columns[columns.length - 1].setSort();
		//nlapiLogExecution('debug', 'enter');
	}
	else {
		filters[filters.length] = new nlobjSearchFilter('custbodyorder_type', null, 'anyof', js_order_type);
	}
	
	//New filters added //Rfranco
	if (js_country=='NZ') {
		filters[filters.length] = new nlobjSearchFilter('shipcountry', null, 'anyof', 'NZ');
		if (js_value=='less300') {
			filters[filters.length] = new nlobjSearchFilter('totalamount', null, 'lessthan', 300);
		}
		else {
			filters[filters.length] = new nlobjSearchFilter('totalamount', null, 'greaterthanorequalto', 300);
		}
	}
	else {
		filters[filters.length] = new nlobjSearchFilter('shipcountry', null, 'anyof', 'AU');
	}
	
	//search all sales orders. (need to clarify criteria)
	var search_results = nlapiSearchRecord('salesorder', null, filters, columns);
	
	if (search_results != null) {
		nlapiLogExecution('error', 'length', search_results.length);
		for (var i = 0; search_results != null && i < search_results.length; i++) {
			var js_label_count = 0;
			var js_printed = 3;
			var js_outstanding_items = true;
			var js_valid_customer = true;
			if (nlapiGetContext().getRemainingUsage() > 150 && i < 50) {
				//if (i < 1) {	
				var js_bag_label = '';
				var js_big_pdf = '';
				var js_total_weight = 0;
				var js_sales_order = search_results[i];
				var js_type = js_sales_order.getRecordType();
				var js_id = js_sales_order.getId();
				var js_inv_no = js_sales_order.getValue('tranid');
				var orderTypeValue = js_sales_order.getValue('custbodyorder_type'); // bag label integration code
				var js_date = js_sales_order.getValue('trandate');
				var js_name = js_sales_order.getValue('firstname', 'customer') + " " + js_sales_order.getValue('lastname', 'customer');
				//var js_name='test name';
				var js_consultant_id = js_sales_order.getText('entity');
				var js_shipaddressee = js_sales_order.getValue('shipaddressee');
				var js_shipcity = js_sales_order.getValue('shipcity');
				var js_shipaddress1 = js_sales_order.getValue('shipaddress1');
				var js_shipaddress2 = js_sales_order.getValue('shipaddress2');
				var js_shipstate = js_sales_order.getValue('shipstate');
				var js_shipzip = js_sales_order.getValue('shipzip');
				var js_phone = js_sales_order.getValue('custbodyphone_number');
				var js_order_type = js_sales_order.getValue('custbodyorder_type');
				//var js_host_address = js_sales_order.getValue('custbodyhost_shipping_address');
				var js_host_id = js_sales_order.getValue('custbodyhost');
				var js_subsidiary = js_sales_order.getValue('subsidiary');
				// bag label integration code start
				if (orderTypeValue == '1')
					soIds.push(js_id);
				// bag label integration code end
					
				try{
					var message = nlapiEscapeXML(js_sales_order.getValue('message'));
				}
				catch(e){
					var message = '';
				}
				
				switch (js_subsidiary) {
					case (js_subsidiary = '1'): //Subsidiary= AUS
						var js_destination = 'AU';
						break
					case (js_subsidiary = '3'): //Subsidiary= NZ
						var js_destination = 'NZ';
						break
					default:
						break
				}	

				//var js_inv_no = '1';
				nlapiLogExecution('error', 'processing Sales Order', js_type + " " + js_id)
				nlapiLogExecution('error', 'processing Sales Order', js_type + " " + js_inv_no)
				//for each salesorder, create a packing slip header
					
				var currentRecord = nlapiLoadRecord(js_type, js_id);
				var line_count = currentRecord.getLineItemCount('item');
				var js_picked = "______";
				var js_item_array = [];
				var js_array_length = 0;
				if (js_include_backorders == 'T') {
					var js_print_this_order = false;
					for (x = 1; x <= line_count; x++) {
						var js_temp_committed = currentRecord.getLineItemValue('item', 'quantitycommitted', x);
						var js_temp_item_id = currentRecord.getLineItemValue('item', 'item', x);
						if (js_temp_item_id != '300' && js_temp_item_id != '281' && js_temp_item_id != '247' && js_temp_item_id != '282') {
							js_temp_committed = parseInt(js_temp_committed);
							if (js_temp_committed > 0 && js_temp_committed != null && js_temp_committed != '') {
								var js_print_this_order = true;
								break;
							}
						}
					}
				}
				if ((js_print_this_order == true && js_include_backorders == 'T') || js_include_backorders != 'T') {
					js_big_pdf += create_slip_header("packing", js_consultant_id, js_inv_no, js_date, js_logo, js_name, js_shipaddressee, js_shipcity, js_shipaddress1, js_shipaddress2, js_shipstate, js_shipzip, js_printed);
					
					//then go through the line items for that sales order.
					for (x = 1; x <= line_count; x++) {
					
						var item_id = currentRecord.getLineItemValue('item', 'item', x);
						var js_item_type = currentRecord.getLineItemValue('item', 'itemtype', x);
						var this_item = parseInt(item_id);
						nlapiLogExecution('error', 'this_item', this_item);	
		
						var js_desc = nlapiEscapeXML(currentRecord.getLineItemValue('item', 'description', x));
						//var js_customer = js_desc;
						var js_consultant = js_name;
						var js_host = js_shipaddressee;
						var js_ord = currentRecord.getLineItemValue('item', 'quantity', x);
						var js_to_pick = currentRecord.getLineItemValue('item', 'quantitycommitted', x);
						var js_prod = currentRecord.getLineItemValue('item', 'custcolitem_number', x);
						var js_bin = currentRecord.getLineItemValue('item', 'custcolbin_number', x);
						var js_back_ordered = currentRecord.getLineItemValue('item', 'quantitybackordered', x);
						var js_weight = currentRecord.getLineItemValue('item', 'custcolitem_weight', x);
						var js_fulfilled = currentRecord.getLineItemValue('item', 'quantityfulfilled', x);
						
						if (js_back_ordered!='0' && js_back_ordered!=0 && js_back_ordered!=null) {
							var js_printed = 2;
						}
						
						//nlapiLogExecution('debug', js_fulfilled, js_prod);
						//nlapiLogExecution('debug', js_ord, js_prod);
						//If a customer has something outstanding				
						if (js_valid_customer == true) {
							//if (true) {
							if (js_item_type == 'Kit' && js_outstanding_items == true && js_fulfilled != js_ord) {
								var js_kit_record = nlapiLoadRecord('kititem', item_id);
								var js_kit_item_count = js_kit_record.getLineItemCount('member');
								
								js_big_pdf += create_packing_slip_line("", js_desc, "", "", "", ""); //first param js_prod
								if (js_current_bag_line_count == 6) {
									js_bag_label += bag_label_footer(footer_message);
									js_bag_label += bag_label_header(js_customer, js_consultant, js_host, js_inv_no, js_phone);
									js_current_bag_line_count = 0;
								}
								
								js_bag_label += bag_label_line("", js_desc, "", "");
								js_current_bag_line_count++;
								js_total_weight += (parseFloat(js_weight) * parseFloat(js_to_pick));
								
								for (y = 1; y <= js_kit_item_count; y++) {
								
									var js_kit_item_id = js_kit_record.getLineItemValue('member', 'item', y);
									var js_kit_item_desc = nlapiEscapeXML(js_kit_record.getLineItemValue('member', 'memberdescr', y));
									var js_kit_item_quant = js_kit_record.getLineItemValue('member', 'quantity', y);
									//var js_kit_item_weight = js_kit_record.getLineItemValue('member', 'weight', y);
									var js_kit_this_item = parseInt(js_kit_item_id);
									
									var fields = ['custitem2', 'custitem3'];
									var columns = nlapiLookupField('item', js_kit_item_id, fields);
									var js_kit_item_prod = columns.custitem2;
									var js_kit_item_bin = columns.custitem3;
									var js_kit_item_ord = js_ord * js_kit_item_quant;
									var js_kit_item_to_pick = js_to_pick * js_kit_item_quant;
									var js_kit_item_back_ordered = js_back_ordered * js_kit_item_quant;
									
									
									switch (js_kit_item_id) {
										case (js_kit_item_id = '277'):
											break
										case (js_kit_item_id = '205'):
											break
										case (js_kit_item_id = '206'):
											break
										case (js_kit_item_id = '207'):
											break
										case (js_kit_item_id = '208'):
											break
										case (js_kit_item_id = '209'):
											break
										case (js_kit_item_id = '210'):
											break
										case (js_kit_item_id = '211'):
											break
										case (js_kit_item_id = '212'):
											break
										case (js_kit_item_id = '213'):
											break
										case (js_kit_item_id = '214'):
											break
										case (js_kit_item_id = '215'):
											break
										case (js_kit_item_id = '216'):
											break
										case (js_kit_item_id = '217'):
											break
										case (js_kit_item_id = '218'):
											break
										case (js_kit_item_id = '300'):
											break
										case (js_kit_item_id = '315'):
											break
                                        case (js_kit_item_id = '648'): // overage
											break;
										default:
											
											js_big_pdf += create_packing_slip_line(js_kit_item_prod, "- " + js_kit_item_desc, js_kit_item_ord, js_kit_item_to_pick, js_picked, js_kit_item_back_ordered);
											if (js_current_bag_line_count == 6) {
												js_bag_label += bag_label_footer(footer_message);
												js_bag_label += bag_label_header(js_customer, js_consultant, js_host, js_inv_no, js_phone);
												js_current_bag_line_count = 0;
											}
											js_bag_label += bag_label_line(js_kit_item_prod, "- " + js_kit_item_desc, js_kit_item_back_ordered, js_kit_item_to_pick);
											
											js_current_bag_line_count++;
											//stores/adds up the quantities into objects for the PICKING PDF Page
											if (js_item_array[js_kit_this_item] == undefined) {
												
												js_item_array[js_kit_this_item] = new my_item(js_kit_item_id, js_kit_item_bin, js_kit_item_prod, js_kit_item_desc, parseInt(js_kit_item_ord), parseInt(js_kit_item_to_pick), parseInt(js_kit_item_back_ordered));
												js_array_length++;
												nlapiLogExecution('error', 'quant', js_kit_this_item + " = " + js_item_array[js_kit_this_item].ordered);					
											}
											else {
												js_item_array[js_kit_this_item].pick += parseInt(js_kit_item_to_pick);
												js_item_array[js_kit_this_item].ordered += parseInt(js_kit_item_ord);
												js_item_array[js_kit_this_item].backordered += parseInt(js_kit_item_back_ordered);
												
												nlapiLogExecution('error', 'quant', js_kit_this_item + " = " + js_item_array[js_kit_this_item].ordered);
											
											}
											break
									}
								}
								
							//nlapiLogExecution('debug', 'count', js_kit_item_count);
							}
							else {
							
								//nlapiLogExecution('debug', 'item id'+i,item_id );
								switch (item_id) {
									case (item_id = '281'): //Description
										var js_current_bag_line_count = 0;
										js_outstanding_items = false;
										var js_customer = js_desc;
										//creates a new line for the packing slip for description line item
										for (var z = x + 1; z != 0; z++) {
											var temp_item_id = currentRecord.getLineItemValue('item', 'item', z);
											if (temp_item_id != '203') {
												if (temp_item_id == '247' || temp_item_id == '289') {
													break
												}
												else {
													var js_temp_ord = currentRecord.getLineItemValue('item', 'quantity', z);
													var js_temp_fulfilled = currentRecord.getLineItemValue('item', 'quantityfulfilled', z);
													var js_temp_backordered = currentRecord.getLineItemValue('item', 'quantitybackordered', z);
													if (js_temp_fulfilled != js_temp_ord) {
														js_outstanding_items = true;
														break
													}
												}
											}
										}
										if (js_outstanding_items == true) {
											js_label_count++;
											js_big_pdf += create_packing_slip_line("", "<strong>" + js_desc + "</strong>", "", "", "", "");
											js_bag_label += bag_label_header(js_customer, js_consultant, js_host, js_inv_no, js_phone);
										}
										break
									case (item_id = '282'): //Sub total
										//creates a new blank line for the packing slip for description line item
										if (js_outstanding_items == true) {
											js_big_pdf += "<tr><td></td><td></td><td></td><td></td><td></td><td></td></tr>";
										}
										break
									case (item_id = '247'): //Freight
										if (js_outstanding_items == true) {
											js_bag_label += bag_label_footer(footer_message, js_label_count);
										}
										break
									case (item_id = '277'):
										break
									case (item_id = '289'):
										if (js_outstanding_items == true) {
											js_bag_label += bag_label_footer(footer_message, js_label_count);
										}
										break
									case (item_id = '203'):
										break
										
									case (item_id = '205'):
										break
									case (item_id = '206'):
										break
									case (item_id = '207'):
										break
									case (item_id = '208'):
										break
									case (item_id = '209'):
										break
									case (item_id = '210'):
										break
									case (item_id = '211'):
										break
									case (item_id = '212'):
										break
									case (item_id = '213'):
										break
									case (item_id = '214'):
										break
									case (item_id = '215'):
										break
									case (item_id = '216'):
										break
									case (item_id = '217'):
										break
									case (item_id = '218'):
										break
									case (item_id = '300'):
										break
									case (item_id = '315'):
										break
                                    case (item_id = '648'): // overage
										break;
									default:
										//creates a new line for the packing slip for any other line item
										if (js_fulfilled != js_ord && js_outstanding_items == true) {
											js_big_pdf += create_packing_slip_line(js_prod, js_desc, js_ord, js_to_pick, js_picked, js_back_ordered);
											if (js_current_bag_line_count == 6) {
												js_bag_label += bag_label_footer(footer_message);
												js_bag_label += bag_label_header(js_customer, js_consultant, js_host, js_inv_no, js_phone);
												js_current_bag_line_count = 0;
											}
											js_bag_label += bag_label_line(js_prod, js_desc, js_back_ordered, js_to_pick);
											js_current_bag_line_count++;
											js_total_weight += (parseFloat(js_weight) * parseFloat(js_to_pick));
											
											//stores/adds up the quantities into objects for the PICKING PDF Page
											if (js_item_array[this_item] == undefined) {
												js_item_array[this_item] = new my_item(item_id, js_bin, js_prod, js_desc, parseInt(js_ord), parseInt(js_to_pick), parseInt(js_back_ordered));
												js_array_length++;
											//nlapiLogExecution('error', 'quant', this_item + " = " + js_item_array[this_item].ordered);					
											}
											else {
												js_item_array[this_item].ordered += parseInt(js_ord);
												js_item_array[this_item].backordered += parseInt(js_back_ordered);
												js_item_array[this_item].pick += parseInt(js_to_pick);
												
											//nlapiLogExecution('error', 'quant', this_item + " = " + js_item_array[this_item].ordered);
											}
										}
										break
								}
							}
						}
					}
					//close off the Packing PDF Table	
					js_big_pdf += "</tbody></table><hr/>";
					//Create the packing footer table
					js_big_pdf += create_slip_footer("packing");
					//create page break to separate packing and picking page
					
					//create header for Picking PDF Page
					var js_slip_pdf = "";
					js_slip_pdf += create_slip_header("picking", js_consultant_id, js_inv_no, js_date, js_logo, js_name, js_shipaddressee, js_shipcity, js_shipaddress1, js_shipaddress2, js_shipstate, js_shipzip, js_printed);
					var item;
					//nlapiLogExecution('error', 'array length', js_array_length);
					js_item_array.sort(sortByBin);
					//nlapiLogExecution('error', 'array length', js_item_array.length);
					//Scroll through my objects that i created earlier and create them for the Picking PDF Page
					
					nlapiLogExecution('error', 'length', js_array_length)
					for (item in js_item_array) {
						//nlapiLogExecution('error', item,js_item_array[item].bin );
						try{
							js_slip_pdf += "<tr><td style=\"border-style:solid; border-color:black; border-width:1px;\" align=\"left\">" + js_item_array[item].bin + "</td>" +
							"<td style=\"border-style:solid; border-color:black; border-width:1px;\" align=\"left\">" +
							js_item_array[item].prod +
							"</td>" +
							"<td style=\"border-style:solid; border-color:black; border-width:1px;\" align=\"left\">" +
							js_item_array[item].desc +
							"</td>" +
							"<td style=\"border-style:solid; border-color:black; border-width:1px;\" align=\"right\">" +
							js_item_array[item].ordered +
							"</td>" +
							"<td style=\"border-style:solid; border-color:black; border-width:1px;\" align=\"right\">" +
							js_item_array[item].backordered +
							"</td>";
							if (js_item_array[item].pick > 1) {
								js_slip_pdf += "<td style=\"border-style:solid; border-color:black; border-width:1px;\" align=\"right\"><strong>" + js_item_array[item].pick + "</strong></td>";
							}
							else {
								js_slip_pdf += "<td style=\"border-style:solid; border-color:black; border-width:1px;\" align=\"right\">" + js_item_array[item].pick + "</td>";
							}
							js_slip_pdf += "<td style=\"border-style:solid; border-color:black; border-width:1px;\" ></td></tr>";
						}
						catch(e){
							
						}
					//nlapiLogExecution('error', item,js_item_array[item].item_id );
					}
					//Close off Table	
					js_slip_pdf += "</tbody></table>";
					//Create Footer
					js_slip_pdf += create_slip_footer("picking", js_total_weight, js_destination, message, js_order_type);
					//Create Page Break
					js_slip_pdf += "<div style=\"page-break-before: always\"></div>";
					//Add Bag Labels to File
					//nlapiLogExecution('debug','bag label', js_bag_label);
					//js_big_pdf += js_bag_label;
					//js_big_pdf = js_slip_pdf+ js_big_pdf;
					
					if (js_order_type == '1') {
						var js_temp_pdf = '';
						//js_big_pdf += "<div style=\"page-break-before: always\"></div>";
						//js_temp_pdf += js_slip_pdf + js_big_pdf + js_bag_label;
						//js_temp_pdf += js_slip_pdf + js_bag_label;
						
						if (i != search_results.length - 1) {
							//js_temp_pdf += "<div style=\"page-break-before: always\"></div>";
						}
						if(js_include_backorders=='T'){
							js_big_pdf += "<div style=\"page-break-before: always\"></div>";
							js_temp_pdf += js_slip_pdf + js_big_pdf;
						}
						else{
							js_temp_pdf += js_slip_pdf;
						}
					}
					else {
						var js_temp_pdf = '';
						if (i != search_results.length - 1) {
							js_big_pdf += "<div style=\"page-break-before: always\"></div>";
						}
						//js_temp_pdf += js_slip_pdf + js_big_pdf;
						js_temp_pdf += js_slip_pdf;
					}
					
					var js_working = testSingleSO(js_temp_pdf, js_email, js_id, js_inv_no);
					if (js_working == true) {
						nlapiLogExecution('error', js_id, 'added');
						js_email_body += "Included in this PDF: Salesorder: #" + js_inv_no + "\n";
						js_final_pdf += js_temp_pdf;
						nlapiSubmitField('salesorder', js_id, 'custbody_print_status', js_printed);
						nlapiSubmitField('salesorder', js_id, 'custbody_frrc_netdespatch', 'T');
						nlapiLogExecution('audit', 'updated NetDespatch for (' + js_id+ ')');
						
					}
					else {
						nlapiLogExecution('error', js_id, 'not added');
						nlapiSubmitField('salesorder', js_id, 'custbody_print_status', '');
					}
					
				//sendPDF(js_final_pdf, js_email, js_id, js_printed);
				//end loops
				}
				
				// Send Invoice PDF TODO: Check if placed in the right bracket
				if (js_value!='less300') {
					// check if SO has related invoices
					nlapiLogExecution('ERROR', 'js_id', js_id);
					if (js_id!=null) {
						var res = nlapiSearchRecord('invoice', null, [new nlobjSearchFilter('createdfrom', null, 'is', js_id),
						                                              new nlobjSearchFilter('mainline', null, 'is', 'T')]);
						if (res!=null) {
							var invArr = [];
							for (var z=0; z<res.length; z++) {
								nlapiLogExecution('AUDIT', 'res[0].getId()', res[z].getId());
								nlapiLogExecution('AUDIT', 'js_email', js_email);
								//var invoiceId = res[z].getId();
								invArr.push(res[z].getId());
							}
							createInvoicePDF(invArr, js_email);
						}
					}
				}

			}
			else {
				try {
					sendPDF(js_final_pdf, js_email, js_id, js_email_body);
					nlapiLogExecution('audit', 'PDF Sent', 'Sent');
					
				} 
				catch (e) {
					nlapiSendEmail('228562', 'devtest@onlineone.com.au', 'Unable to send PDF', e, null, null, null, null);
				//nlapiSendEmail('228562', 'sandra.rheinbay@chefstoolbox.com', 'Printed Sales Order PDF', 'Please Find attached the printed sales orders\n \n', null, null, null, file);
				}
				// bag label integration code start
				if (StringUtils.isEmpty(js_include_backorders)){
					
					var soIdsToString = soIds.toString();
					var params = new Array();
					params['custscript_salesorder_ids'] = soIdsToString;
					params['custscript_email_address'] = js_email;
					var status = nlapiScheduleScript('customscript_combine_bag_labels', 'customdeploy_combine_bag_labels', params);
					if ( status == 'QUEUED' )
			    		return;
				}
				// bag label integration code end
				var ssparams = new Array();
				ssparams['custscript_from_date'] = js_from_date;
				ssparams['custscript_to_date'] = js_to_date;
				ssparams['custscript_order_type'] = js_order_type;
				ssparams['custscript_email'] = js_email;
				ssparams['custscript_message'] = js_message;
				ssparams['custscript_include_backorders'] = js_include_backorders;
				var status = nlapiScheduleScript(nlapiGetContext().getScriptId(), nlapiGetContext().getDeploymentId(), ssparams);
				if (status == 'QUEUED') {
					return
				}
			}
		}
		try {
			sendPDF(js_final_pdf, js_email, js_id, js_email_body);
			nlapiLogExecution('audit', 'PDF Sent', 'Sent');
		} 
		catch (e) {
			nlapiSendEmail('228562', 'devtest@onlineone.com.au', 'Unable to send PDF', e, null, null, null, null);
		}
		// bag label integration code start
		if (StringUtils.isEmpty(js_include_backorders)){
			var soIdsToString = soIds.toString();
			
			var params = new Array();
			params['custscript_salesorder_ids'] = soIdsToString;
			params['custscript_email_address'] = js_email;
			var status = nlapiScheduleScript('customscript_combine_bag_labels', 'customdeploy_combine_bag_labels', params);
			if ( status == 'QUEUED' )
	    		return;
		}
		// bag label integration code end
	}
	else{
		//nlapiSendEmail('228562', 'lez@onlineone.com.au', 'Sales Order PDF Message', 'Sorry, your search criteria returned no sales orders.\n \n', null, null, null, null);
		nlapiSendEmail('228562', js_email, 'Sales Order PDF Message', 'Sorry, your search criteria returned no sales orders.\n \n', null, null, null, null);
	}
}

function createInvoicePDF(invArr, js_email) {
	if (invArr.length==0) return;
	nlapiLogExecution('AUDIT', 'invArr', JSON.stringify(invArr));
	var filesArr = [];
	for (var i=0; i<invArr.length; i++) {
		var file = nlapiPrintRecord('TRANSACTION', invArr[i], 'PDF', null);
		filesArr.push(file);
	}
	nlapiLogExecution('AUDIT', 'filesArr', filesArr.length);
	nlapiSendEmail('228562', js_email, 'Invoice PDF', 'Please see attached transaction-', null, null, null, filesArr);
	nlapiLogExecution('audit', 'invoice PDF Sent', 'Sent');
}

function sendPDF(js_final_pdf, js_email, js_id, js_email_body){
	//create the PDF headerstuff and styles and create the pdf	
	var xml = "<?xml version=\"1.0\"?>\n<!DOCTYPE pdf PUBLIC \"-//big.faceless.org//report\" \"report-1.1.dtd\">\n";
	xml += "<pdf><head><style>";
	xml += "td {padding:3px; font-size:9;} p {font-size:9;} th {padding:5px; font-size:9; font-weight:bold;} .break {page-break-before: always;}";
	xml +=  ".myWidth1 {width: 160px;} .myWidth2 {width: 200px;} .myWidth3 {width: 300px;} .myWidth4 {width: 350px;}";
	xml += ".border {border:thin solid black;} .au{font-size:11;}";
	xml += "</style>";
	//xml += "<macrolist><macro id=\"myfooter\"><p align=\"center\"> Page <pagenumber/> of <totalpages/></p></macro></macrolist>";
	xml += "</head><body>";
	//xml += "<body footer=\"myfooter\" footer-height=\"20mm\">\n<h1>"+js_cat_heading+"</h1>\n";
	xml += js_final_pdf;
	xml += "</body>\n</pdf>";
	try {
		var file = nlapiXMLToPDF(xml);
		file.setName('Sales Order.pdf');
		nlapiSendEmail('228562', js_email, 'Printed Sales Order PDF', 'Please Find attached the printed sales orders\n \n' + js_email_body, null, null, null, file);
		//nlapiSendEmail('228562', 'lez@onlineone.com.au', 'Printed Sales Order PDF '+ js_id , 'Please Find attached the printed sales orders\n \n'+ js_email_body, null, null, null, file);
		//nlapiSubmitField('salesorder', js_id, 'custbody_print_status', js_printed);
	}
	catch(e){
		nlapiSendEmail('228562', 'sandy@onlineone.com.au', 'Error Message', e, 'test@onlineone.com.au', null, null, null);
		var testfile = nlapiCreateFile('test.txt', 'PLAINTEXT', xml);
		nlapiSendEmail('228562', 'sandy@onlineone.com.au', 'Test Info', xml, 'test@onlineone.com.au', null, null, testfile);
		nlapiSendEmail('228562', 'sandy@onlineone.com.au', 'ERROR Printed Sales Order PDF', js_id +'\n', 'test@onlineone.com.au', null, null, null);
		//nlapiSubmitField('salesorder', js_id, 'custbody_print_status', '');
	}
	//response.write(js_big_pdf);
	
}

//function that creates the Picking and Packing Headers
function create_slip_header(type, js_consultant_id, js_inv_no, js_date, js_logo, js_name, js_shipaddressee, js_shipcity, js_shipaddress1, js_shipaddress2, js_shipstate, js_shipzip, js_printed){
	var pdf_string="";
	if (type == "packing") {
		pdf_string += "<table><tr><td><img width =\"302px\" height =\"75px\" src=\"" + nlapiEscapeXML(js_logo) + "\" /></td><td class=\"myWidth2\" align =\"right\">Packing Slip Detail</td></tr></table>";
		pdf_string += "<table align =\"center\">";
		pdf_string += "<tr><td><strong>The Chefs Toolbox Pty Ltd<br/>PO Box 6191<br/>Alexandria NSW 2015</strong></td></tr>";
		pdf_string += "</table>";
	}
	if (type == "picking") {
		if(js_printed == 2){
			pdf_string += "<table><tr><td><img width =\"302\" height =\"75px\" src=\"" + nlapiEscapeXML(js_logo) + "\" /></td><td class=\"myWidth2\" align =\"right\">Picking Summary<br/><strong>Back Ordered</strong></td></tr></table>";
		}
		else{
			pdf_string += "<table><tr><td><img width =\"302\" height =\"75px\" src=\"" + nlapiEscapeXML(js_logo) + "\" /></td><td class=\"myWidth2\" align =\"right\">Picking Summary</td></tr></table>";

		}
	}
	pdf_string += "<table>";
	pdf_string += "<thead><tr>";
	pdf_string += "<th align=\"left\" class=\"myWidth2\">Consultant:</th>";
	pdf_string += "<th align=\"left\" class=\"myWidth2\">Delivery:</th>";
	pdf_string += "</tr></thead>";
	
	pdf_string += "<tbody><tr>";
	pdf_string += "<td valign=\"top\" class=\"myWidth2\">"+js_name+"</td>";
	if(js_shipaddress2!=''){
		pdf_string += "<td class=\"myWidth2\">"+js_shipaddressee+"<br/>"+js_shipaddress1+ "<br/>"+ js_shipaddress2 + "<br/>"+js_shipcity+"<br/>"+js_shipstate+" "+js_shipzip+"</td>";
	}
	else{
		pdf_string += "<td class=\"myWidth2\">"+js_shipaddressee+"<br/>"+js_shipaddress1 + "<br/>"+js_shipcity+"<br/>"+js_shipstate+" "+js_shipzip+"</td>";		
	}
	pdf_string += "</tr></tbody>";
	pdf_string += "</table>";
	
	pdf_string += "<table>";
	pdf_string += "<thead><tr>";
	pdf_string += "<th class=\"border\" align=\"left\">Consultant ID</th>";
	pdf_string += "<th></th>";
	pdf_string += "<th class=\"border\" align=\"left\">INV NO.</th>";
	pdf_string += "<th class=\"border\" align=\"left\">DATE</th>";
	pdf_string += "</tr></thead>";
	
	pdf_string += "<tbody><tr>";
	pdf_string += "<td style=\"border-style:solid; border-color:black; border-width:1px;\" class=\"border myWidth2\">"+js_consultant_id+"</td>";
	pdf_string += "<td class=\"myWidth4\"></td>";
	pdf_string += "<td style=\"border-style:solid; border-color:black; border-width:1px;\" class=\"border myWidth2\">"+js_inv_no+"</td>";
	pdf_string += "<td style=\"border-style:solid; border-color:black; border-width:1px;\" class=\"border myWidth2\">"+js_date+"</td>";
	pdf_string += "</tr></tbody></table>";
	
	pdf_string += "<br/>";
		pdf_string += "<table>";
		pdf_string += "<thead><tr class=\"border\">";
		if (type == "picking") {
			pdf_string += "<th class=\"myWidth1\" align=\"left\">BIN</th>";
		}
		pdf_string += "<th class=\"myWidth2\" align=\"left\">PRODUCT NO.</th>";
		pdf_string += "<th class=\"myWidth4\" align=\"left\">DESCRIPTION</th>";
		pdf_string += "<th class=\"myWidth1\" align=\"right\">QTY<br/>ORDERED</th>";
		pdf_string += "<th class=\"myWidth1\" align=\"right\">QTY<br/>B/ORD</th>";
		pdf_string += "<th class=\"myWidth1\" align=\"right\">QTY<br/>TO PICK</th>";
		pdf_string += "<th class=\"myWidth1\" align=\"right\">PICKED</th>";
		pdf_string += "</tr></thead>";
		pdf_string += "<tbody>";

	return pdf_string;	
}

//function that creates the Packing Line Items
function create_packing_slip_line(js_prod, js_desc, js_ord, js_to_pick, js_picked, js_back_ordered){
	
	var pdf_string="";
	
	pdf_string += "<tr>";
	pdf_string += "<td align=\"left\">"+js_prod+"</td>";
	pdf_string += "<td align=\"left\">"+js_desc+"</td>";
	pdf_string += "<td align=\"right\">"+js_ord+"</td>";
	pdf_string += "<td align=\"right\">"+js_back_ordered+"</td>";
	pdf_string += "<td align=\"right\">"+js_to_pick+"</td>";
	pdf_string += "<td align=\"right\">"+js_picked+"</td>";
	pdf_string += "</tr>";
		
	return pdf_string;	

}
//function that creates the Packing/Picking Footer
function create_slip_footer(type, js_weight, js_destination, message, orderType){
	
	var pdf_string="";
	if (type == "packing") {
		pdf_string += "<table><tr><td class=\"border myWidth1\">Checked by</td><td class=\"border myWidth1\"></td></tr>";
		pdf_string += "<tr><td class=\"border\">No. of cartons</td><td class=\"border\"></td></tr>";
		pdf_string += "<tr><td class=\"border\">Date Sent</td><td class=\"border\"></td></tr>";
		pdf_string += "</table>";
		return pdf_string;
	}	
	if (type == "picking") {
		pdf_string += "<br/><table align= \"right\"><tbody><tr><td class=\"border myWidth1\">Picked by:</td><td class=\"border myWidth1\"></td></tr>";
		pdf_string += "<tr><td class=\"border\">Packed by:</td><td class=\"border\"></td></tr>";
		pdf_string += "<tr><td class=\"border\"><strong>No. of cartons</strong></td><td class=\"border\"></td></tr>";
		pdf_string += "<tr><td class=\"border\">Gross Weight:</td><td class=\"border\">"+Math.round(js_weight*100)/100+"</td></tr>";
		pdf_string += "<tr><td class=\"border\">Date Sent:</td><td class=\"border\"></td></tr>";
		pdf_string += "</tbody></table>";
		if(orderType=='5'){
			pdf_string += "Comment: "+message+"<br/><br/>";
		}
		else{
			pdf_string += "Comment: <br/><br/>";
		}
		pdf_string += "Destination: <br/>";
		pdf_string += "<table height=\"100px\"><tr><td align= \"center\" valign=\"middle\" class=\"border myWidth2 au\">"+js_destination+"</td></tr></table>";
		return pdf_string;
	}	
}
//function that creates my object for the picking line items
function my_item(item_id, bin, prod, desc, ordered, pick, backordered)
{
	this.item_id=item_id;
	this.bin=bin;
	this.desc=desc;
	this.ordered=parseInt(ordered);
	this.pick=parseInt(pick);
	this.prod=prod;
	this.backordered=parseInt(backordered);
}

function sortByBin(a, b){
	//var x = a.bin;
	//var y = b.bin;
	//return ((x < y) ? -1 : ((x > y) ? 1 : 0));
	return parseInt(a.bin) - parseInt(b.bin);
}

//function that creates the Bag Label Header
function bag_label_header(js_customer, js_consultant, js_host, js_order, js_phone){
	
	var pdf_string="";
	
	pdf_string += "<div height=\"230px\"><table>"+
	"<tr>"+
	"<td class=\"myWidth1\" align=\"left\"><strong>Customer:</strong></td>"+
	"<td class=\"myWidth1\" align=\"left\">"+js_customer+"</td>"+
	"<td class=\"myWidth1\" align=\"left\"><strong>Consultant:</strong></td>"+
	"<td class=\"myWidth1\" align=\"left\">"+js_consultant+": "+js_phone+"</td>"+
	"</tr>"+
	"<tr>"+
	"<td class=\"myWidth1\" align=\"left\"><strong>Host:</strong></td>"+
	"<td class=\"myWidth1\" align=\"left\">"+js_host+"</td>"+
	"<td class=\"myWidth1\" align=\"left\"><strong>Order Ref:</strong></td>"+
	"<td class=\"myWidth1\" align=\"left\">"+js_order+"</td>"+
	"</tr>"+
	"</table><br/>"+
	
	"<table><tr>"+
	"<td class=\"myWidth1\" align=\"left\"></td>"+
	"<td class=\"myWidth4\" align=\"left\"></td>"+
	"<td class=\"myWidth1\" align=\"right\">B/O</td>"+
	"<td class=\"myWidth1\" align=\"right\">QTY</td>"+
	"</tr>";
	
	return pdf_string;	
}

function bag_label_line(js_item_id, js_desc, js_bo, js_ord){
	
	var pdf_string="";
	pdf_string+="<tr>"+
	"<td align=\"left\">"+js_item_id+"</td>"+
	"<td align=\"left\">"+js_desc+"</td>"+
	"<td align=\"right\">"+js_bo+"</td>"+
	"<td align=\"right\">"+js_ord+"</td>"+
	"</tr>";
	
	return pdf_string;	
}

function bag_label_footer(message, js_label_count){
	
	var pdf_string="";

	pdf_string += "</table></div><p align=\"center\">" + message + "</p><hr/>";

	return pdf_string;	
}

function testSingleSO(js_final_pdf, js_email, js_id, js_inv_no){
	//create the PDF headerstuff and styles and create the pdf	
	var xml = "<?xml version=\"1.0\"?>\n<!DOCTYPE pdf PUBLIC \"-//big.faceless.org//report\" \"report-1.1.dtd\">\n";
	xml += "<pdf><head><style>";
	xml += "td {padding:3px; font-size:9;} p {font-size:9;} th {padding:5px; font-size:9; font-weight:bold;} .break {page-break-before: always;}";
	xml +=  ".myWidth1 {width: 160px;} .myWidth2 {width: 200px;} .myWidth3 {width: 300px;} .myWidth4 {width: 350px;}";
	xml += ".border {border:thin solid black;} .au{font-size:11;}";
	xml += "</style>";
	//xml += "<macrolist><macro id=\"myfooter\"><p align=\"center\"> Page <pagenumber/> of <totalpages/></p></macro></macrolist>";
	xml += "</head><body>";
	//xml += "<body footer=\"myfooter\" footer-height=\"20mm\">\n<h1>"+js_cat_heading+"</h1>\n";
	xml += js_final_pdf;
	xml += "</body>\n</pdf>";
	try {
		var file = nlapiXMLToPDF(xml);
		return true;
	}
	catch(e){
		nlapiSendEmail('228562', 'sandy@onlineone.com.au', 'Error Message', e, 'test@onlineone.com.au', null, null, null);
		var testfile = nlapiCreateFile('test.txt', 'PLAINTEXT', xml);
		nlapiSendEmail('228562', 'sandy@onlineone.com.au', 'Test Info', xml, 'test@onlineone.com.au', null, null, testfile);
		nlapiSendEmail('228562', 'sandra.rheinbay@chefstoolbox.com', 'Unable to printed Sales Order', 'We encountered and error trying to add the salesorder to the PDF with id: #'+js_inv_no +'\n This is most likely due to the sales order items being in the incorrect format.', 'sandy@onlineone.com.au', null, null, null);
		return false;
	}
	//response.write(js_big_pdf);
}
