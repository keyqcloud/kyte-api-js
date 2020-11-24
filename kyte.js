function Kyte(url, accessKey, identifier, account_number, adminRoleID = 1) {
	this.url = url;
	this.access_key = accessKey;
	this.identifier = identifier;
	this.account_number = account_number;
	this.txToken;
	this.sessionToken;
	this.adminRole = adminRoleID;
}

Kyte.prototype.init = function() {
	this.txToken = (this.getCookie('txToken') ? this.getCookie('txToken') : 0);
	this.sessionToken = (this.getCookie('sessionToken') ? this.getCookie('sessionToken') : 0);
};

/* API Version
 *
 * Use sign() to obtain authorization to transact and
 * send serialized form data accompanied with signature data
 *
 */
Kyte.prototype.version = function(callback, error = null) {
	var obj = this;

	$.ajax({
		method: "GET",
		crossDomain: true,
		dataType: "json",
		url: obj.url,
		success: function(response){
			if (typeof callback === "function") {
				  callback(response.engine_version, response.framework_version);
			  } else {
				  console.log("Engine: "+response.engine_version+"; Framework: "+response.framework_version);
			  }
		},
		error: function(response) {
			if (typeof error === "function") {
				  error(response.responseJSON.error);
			  } else {
				  console.log(response.responseJSON.error);
				alert(response.responseJSON.error);
			}
		}
	});
};

/* API Signature Request
 *
 * Pass identifying information and public key to backend
 * requesting an authorization signature to transact
 *
 */
Kyte.prototype.sign = function(callback, error = null) {
	var d = new Date();
	var obj = this;

	$.ajax({
	    method: "POST",
	    crossDomain: true,
	    dataType: "json",
		url: obj.url,
		data: 'key='+obj.access_key+'&identifier='+obj.identifier+'&token='+obj.txToken+'&time='+d.toUTCString(),
	    success: function(response){
	      	if (typeof callback === "function") {
	      		callback(response, d);
	      	} else {
	      		console.log(response);
	      	}
	    },
	    error: function(response) {
	      	if (typeof error === "function") {
	      		error(response);
	      	} else {
	      		console.log(response);
		        alert(response);
		    }
	    }
    });
};

/* Send Data to Backend by Specified Method
 *
 * Use sign() to obtain authorization to transact and
 * send data accompanied with signature data
 *
 */
Kyte.prototype.sendData = function(method, model, field = null, value = null, data = null, formdata = null, callback, error = null) {
	var obj = this;
	var token = (obj.getCookie('kyte-token') ? obj.getCookie('kyte-token') : '1');

	this.sign(
		function(retval, time) {
		// /{signature}/{identity}/{model}/{field}/{value}
		let identity = encodeURIComponent(btoa(obj.access_key+'%'+obj.sessionToken+'%'+time.toUTCString()+'%'+obj.account_number));
		var apiURL = obj.url+'/'+retval.signature+'/'+identity+'/'+model;
		if (field) {
			apiURL += '/'+field;
		}
		if (value) {
			apiURL += '/'+value;
		}

		var encdata = '';

		if (data) {
			encdata += $.param(data);
		}

		if (formdata) {
			if (encdata) encdata += '&';
			encdata += formdata;
		}

		$.ajax({
			method: method,
			crossDomain: true,
			dataType: "json",
			url: apiURL,
			data: encdata,
			success: function(response) {
				obj.txToken = response.token;
				obj.sessionToken = response.session;
				if (!response.token && !response.session) {
					obj.setCookie('txToken', '', -1);
					obj.setCookie('sessionToken', '', -1);
					obj.setCookie('sessionPermission', '', -1);
				} else {
					obj.setCookie('txToken', obj.txToken, 60);
					obj.setCookie('sessionToken', obj.sessionToken, 60);
					obj.setCookie('sessionPermission', response.sessionPermission, 60);
				}

		        if (typeof callback === "function") {
		      		callback(response);
		      	} else {
		      		console.log(response);
		      	}
			},
			error: function(response) {
				obj.txToken = response.token;
				obj.sessionToken = response.session;
				if (!response.token && !response.session) {
					obj.setCookie('txToken', '', -1);
					obj.setCookie('sessionToken', '', -1);
					obj.setCookie('sessionPermission', '', -1);
				} else {
					obj.setCookie('txToken', obj.txToken, 60);
					obj.setCookie('sessionToken', obj.sessionToken, 60);
					obj.setCookie('sessionPermission', response.sessionPermission, 60);
				}

		      	if (typeof error === "function") {
		      		error(response.responseJSON.error);
		      	} else {
		      		console.log(response.responseJSON.error);
			        alert(response.responseJSON.error);
			    }
			}
	    });
	},
	function(response) {
		if (typeof error === "function") {
			error(response);
		} else {
			console.log(response);
			alert(response);
		}
	});
};

/* Post
 *
 * Use sign() to obtain authorization to transact and
 * send data accompanied with signature data
 *
 */
Kyte.prototype.post = function(model, data = null, formdata = null, callback, error = null) {
	this.sendData('POST', model, null, null, data, formdata, callback, error);
};

/* Put
 *
 * Use sign() to obtain authorization to transact and
 * send data accompanied with signature data
 *
 */
Kyte.prototype.put = function(model, field = null, value = null, data = null, formdata = null, callback, error = null) {
	this.sendData('PUT', model, field, value, data, formdata, callback, error);
};

/* Get
 *
 * Use sign() to obtain authorization to transact and
 * send data accompanied with signature data
 *
 */
Kyte.prototype.get = function(model, field = null, value = null, callback, error = null) {
	this.sendData('GET', model, field, value, null, null, callback, error);
};

/* Delete
 *
 * Use sign() to obtain authorization to transact and
 * send data accompanied with signature data
 *
 */
Kyte.prototype.delete = function(model, field = null, value = null, callback, error = null) {
	this.sendData('DELETE', model, field, value, null, null, callback, error);
};

/* 
 * Set browser cookie
 */
Kyte.prototype.setCookie = function (cname, cvalue, minutes) {
	var d = new Date();
	d.setTime(d.getTime() + (minutes*60*1000));
	var expires = "expires="+ d.toUTCString();
	document.cookie = cname + "=" + cvalue + ";" + expires + ";path=/;" + (location.protocol === 'https:' ? 'secure;' : '');
};

/* 
 * Get browser cookie
 */
Kyte.prototype.getCookie = function (cname) {
	var name = cname + "=";
	var ca = document.cookie.split(';');
	for(var i = 0; i < ca.length; i++) {
		var c = ca[i];
		while (c.charAt(0) == ' ') {
			c = c.substring(1);
		}
		if (c.indexOf(name) == 0) {
			return c.substring(name.length, c.length);
		}
	}
	return "";
};

/* 
 * Get params from URL
 */
Kyte.prototype.getUrlParameter = function(sParam) {
    var sPageURL = window.location.search.substring(1),
        sURLVariables = sPageURL.split('&'),
        sParameterName,
        i;

    for (i = 0; i < sURLVariables.length; i++) {
        sParameterName = sURLVariables[i].split('=');

        if (sParameterName[0] === sParam) {
            return sParameterName[1] === undefined ? true : decodeURIComponent(sParameterName[1]);
        }
    }
};

Kyte.prototype.initSpinner = function(selector) {
	selector.append('<div id="pageLoaderModal" class="modal white" data-backdrop="static" data-keyboard="false" tabindex="-1"><div class="modal-dialog modal-sm h-100 d-flex"><div class="mx-auto align-self-center" style="width: 48px"><div class="spinner-wrapper text-center fa-6x"><span class="fas fa-sync fa-spin"></span></div></div></div></div>');
};
Kyte.prototype.startSpinner = function() {
	$('#pageLoaderModal').modal();
}
Kyte.prototype.stopSpinner = function() {
	$('#pageLoaderModal').modal('hide');
}

/* 
 * Request backend to create new session
 *
 * like all api requests, first obtain a transaction
 * authorization from sign() then pass email and password.
 * If user is valid then create cookie with token; otherwise
 * redirect users to login page.
 * 
 */
Kyte.prototype.sessionCreate = function(identity, callback, error = null, sessionController = 'Session') {
	var obj = this;
	this.post(sessionController, identity, null,
	function(response) {
		obj.txToken = response.data.txToken;
		obj.sessionToken = response.data.sessionToken;
		obj.setCookie('txToken', obj.txToken, 60);
		obj.setCookie('sessionToken', obj.sessionToken, 60);
		obj.setCookie('sessionPermission', response.data.User.role, 60);
		if (typeof callback === "function") {
			callback(response);
		} else {
			console.log(response);
		}
	},
	function(response) {
		obj.setCookie('txToken', '', -1);
		obj.setCookie('sessionToken', '', -1);
		obj.setCookie('sessionPermission', '', -1);
		if (typeof error === "function") {
			error(response);
		} else {
			console.log(response);
			alert(response);
		}
	});
};

Kyte.prototype.addLogoutHandler = function(selector) {
	selector.click(function () {
		k.sessionDestroy(function () {
			location.href = "/";
		});
	});
}

Kyte.prototype.isSession = function() {
	if (!this.sessionToken && !this.txToken) {
		this.setCookie('txToken', '', -1);
		this.setCookie('sessionToken', '', -1);
		this.setCookie('sessionPermission', '', -1);
	}
	return (this.getCookie('sessionToken') ? true : false);
}

Kyte.prototype.isAdmin = function() {
	return this.getCookie("sessionPermission") == this.adminRole;
}

/* 
 * Request backend to destroy session
 *
 * like all api requests, first obtain a transaction
 * authorization from sign() then pass session token from cookie.
 * If session token is valid then log user out.
 * 
 */
Kyte.prototype.sessionDestroy = function(error = null) {
	var obj = this;
	this.delete('Session', null, null,
	function(response) {
		obj.setCookie('txToken', '', -1);
		obj.setCookie('sessionToken', '', -1);
		obj.setCookie('sessionPermission', '', -1);
		if (typeof error === "function") {
			error(response);
		} else {
			console.log(response);
			alert(response);
		}
	},
	function(response) {
		obj.setCookie('txToken', '', -1);
		obj.setCookie('sessionToken', '', -1);
		obj.setCookie('sessionPermission', '', -1);
		if (typeof error === "function") {
			error(response);
		} else {
			console.log(response);
			alert(response);
		}
	});
}

Kyte.prototype.makeid = function(length) {
	var result           = '';
	var characters       = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
	var charactersLength = characters.length;
	for ( var i = 0; i < length; i++ ) {
	   result += characters.charAt(Math.floor(Math.random() * charactersLength));
	}
	return result;
 };

Kyte.prototype.alert = function(title, message, type = 'success', time = 1000, callback = null) {
	let id = this.makeid(5);
	$('body').append('<div class="kyte-alert" id="'+id+'"><div class="kyte-alert-body kyte-alert-'+type+'"><h3 class="kyte-alert-header">'+title+'</h3><p>'+message+'<div class="text-center"><button class="btn btn-primary kyte-alert-close d-none">OK</button></div></p></div></div>');
	if (time > 0) {
		setTimeout(function() {
			$('#'+id).fadeOut('fast');
			$('#'+id).addClass('d-none');
			if (typeof callback === "function") {
				callback();
			}
		}, time);
	} else {
		$('#'+id+' .kyte-alert-close').removeClass('d-none');
		$('#'+id+' .kyte-alert-close').click(function() {
			$('#'+id).fadeOut('fast');
			$('#'+id).addClass('d-none');
			if (typeof callback === "function") {
				callback();
			}
		});
	}
};

Kyte.prototype.confirm = function(title, message, type = 'success', callback = null, cancel = null) {
	let id = this.makeid(5);
	$('body').append('<div class="kyte-alert" id="'+id+'"><div class="kyte-alert-body kyte-alert-'+type+'"><h3 class="kyte-alert-header">'+title+'</h3><p>'+message+'<div class="text-center"><button class="btn btn-primary kyte-alert-confirm">Yes</button> <button class="btn btn-secondary kyte-alert-cancel">No</button></div></p></div></div>');
	
	$('#'+id+' .kyte-alert-confirm').click(function() {
		$('#'+id).fadeOut('fast');
		$('#'+id).addClass('d-none');
		if (typeof callback === "function") {
			callback();
		}
	});

	$('#'+id+' .kyte-alert-cancel').click(function() {
		$('#'+id).fadeOut('fast');
		$('#'+id).addClass('d-none');
		if (typeof cancel === "function") {
			cancel();
		}
	});
};

/* 
 * Check password minimums and update UI
 */
Kyte.prototype.validatePassword = function(obj) {
	var pswd = obj.val();

	// check password length
    if ( pswd.length < 6 ) {
		obj.removeClass('is-valid').addClass('is-invalid');
		$('ul li.validate-length i').removeClass('fa-circle');
		$('ul li.validate-length i').removeClass('fa-check-circle').addClass('fa-times-circle');
		$('ul li.validate-length i').removeClass('text-success').addClass('text-danger');
		return false;
	} else {
		obj.removeClass('is-invalid').addClass('is-valid');
		$('ul li.validate-length i').removeClass('fa-circle');
		$('ul li.validate-length i').removeClass('fa-times-circle').addClass('fa-check-circle');
		$('ul li.validate-length i').removeClass('text-danger').addClass('text-success');
	}

	//validate letter
	if ( pswd.match(/[A-z]/) ) {
		obj.removeClass('is-invalid').addClass('is-valid');
		$('ul li.validate-small i').removeClass('fa-circle');
		$('ul li.validate-small i').removeClass('fa-times-circle').addClass('fa-check-circle');
		$('ul li.validate-small i').removeClass('text-danger').addClass('text-success');
	} else {
		obj.removeClass('is-valid').addClass('is-invalid');
		$('ul li.validate-small i').removeClass('fa-circle');
		$('ul li.validate-small i').removeClass('fa-check-circle').addClass('fa-times-circle');
		$('ul li.validate-small i').removeClass('text-success').addClass('text-danger');
		return false;
	}

	//validate capital letter
	if ( pswd.match(/[A-Z]/) ) {
		obj.removeClass('is-invalid').addClass('is-valid');
		$('ul li.validate-large i').removeClass('fa-circle');
		$('ul li.validate-large i').removeClass('fa-times-circle').addClass('fa-check-circle');
		$('ul li.validate-large i').removeClass('text-danger').addClass('text-success');
	} else {
		obj.removeClass('is-valid').addClass('is-invalid');
		$('ul li.validate-large i').removeClass('fa-circle');
		$('ul li.validate-large i').removeClass('fa-check-circle').addClass('fa-times-circle');
		$('ul li.validate-large i').removeClass('text-success').addClass('text-danger');
		return false;
	}

	//validate number
	if ( pswd.match(/\d/) ) {
		obj.removeClass('is-invalid').addClass('is-valid');
		$('ul li.validate-number i').removeClass('fa-circle');
		$('ul li.validate-number i').removeClass('fa-times-circle').addClass('fa-check-circle');
		$('ul li.validate-number i').removeClass('text-danger').addClass('text-success');
	} else {
		obj.removeClass('is-valid').addClass('is-invalid');
		$('ul li.validate-number i').removeClass('fa-circle');
		$('ul li.validate-number i').removeClass('fa-check-circle').addClass('fa-times-circle');
		$('ul li.validate-number i').removeClass('text-success').addClass('text-danger');
		return false;
	}

	// symbol
	if (pswd.match(/[@$!%*#?&]/)) {
		obj.removeClass('is-invalid').addClass('is-valid');
		$('ul li.validate-symbol i').removeClass('fa-circle');
		$('ul li.validate-symbol i').removeClass('fa-times-circle').addClass('fa-check-circle');
		$('ul li.validate-symbol i').removeClass('text-danger').addClass('text-success');
	} else {
		obj.removeClass('is-valid').addClass('is-invalid');
		$('ul li.validate-symbol i').removeClass('fa-circle');
		$('ul li.validate-symbol i').removeClass('fa-check-circle').addClass('fa-times-circle');
		$('ul li.validate-symbol i').removeClass('text-success').addClass('text-danger');
		return false;
	}

	return true;
}

Kyte.prototype.validateForm = function(form) {
	let valid = true;
	form.find('input').each(function(){
		if ($(this).prop('required') && !$(this).val()) {
			valid = false;
		}
	});
	return valid;
}

/*
 * Class Definition for Kyte Table
 *
 * api : Kyte object
 * selector : id tag
 * model : json array defining model { 'name' : <model name>, 'field' : <null/field name>, 'value' : <null/field value> }
 * def : json array with table definition 
 * 		Definition:
 * 		- targets (required)
 * 		- data (required)
 * 		- label (required)
 * 		- visible (optional) true/false
 * 		- sortable (optional) true/false
 * 		- render (optional) function (data, type, row, meta) {}
 * order : array of order [[0, 'asc'], [1,'asc']]
 * rowCallBack : optional function(row, data, index) {}
 * initComplete : optional function() {}
 */
function KyteTable(api, selector, model, columnDefs, searching = true, order = [], rowCallBack = null, initComplete = null, lang = "https://cdn.datatables.net/plug-ins/9dcbecd42ad/i18n/English.json") {
	this.api = api;
	this.model = model;

	this.loaded = false;
	this.table = null;

	this.selector = selector;
	this.lang = lang;
	this.searching = searching;

	this.columnDefs = columnDefs;
	this.order = order;
	this.rowCallBack = rowCallBack;
	this.initComplete = initComplete;
};

KyteTable.prototype.init = function() {
	let self = this;
	if (!this.loaded) {
		this.api.get(this.model.name, this.model.field, this.model.value, function (response) {
			let content = '<thead><tr>';
			let i = 0;
			self.columnDefs.forEach(function (item) {
				content += '<th class="'+item.data.replace(/\./g, '_')+'">'+item.label+'</th>';
				delete self.columnDefs[i]['label'];
				i++;
			});
			content += '</tr></thead><tbody></tbody>';
			self.selector.append(content);
			self.table = self.selector.DataTable({
				searching: self.searching,
				responsive: true,
				language: { "url": self.lang },
				data: response.data,
				columnDefs: self.columnDefs,
				order: self.order,
				rowCallback: self.rowCallBack,
				initComplete: self.initComplete
			});
			self.loaded = true;
		}, function() {
			alert("Unable to load data");
		});
	}
};

/*
 * Class Definition for Kyte Form
 *
 * api : Kyte object
 * selector : id tag
 * hidden : json array of hidden elements (do not include id as it will clash)
 * 
 * {
 * 	'name' : '<field_name>',
 * 	'value' : '<null/value>'
 * }
 * 
 * elements : json array defining form elements
 * 
 * [
 * 	[x-> direction],
 * 	[x-> direction],
 * 	[x-> direction], ...etc...
 * ]
 * 
 * {
 * 	'field' : '<model_attribute>',
 * 	'type' : '<text/password/select/textarea>',
 * 	'label' : '<label>',
 * 	'required' : true/false,
 * 
 * 	### if field type is select, the following is required to set options
 * 	## For using ajax data source:
 * 	'options' : {
 *	 	'ajax' : true,
 * 		'data_model_name' : '<model_name>',
 * 		'data_model_field' : <null/field_name>,
 * 		'data_model_value' : <null/value>,
 * 		'data_model_attribute' : <attribute_name>
 * 	}
 * 
 * 	## For using predefined values:
 * 	'ajax' : false,
 * 	'options' : {
 *	 	'ajax' : true,
 *		'data' : {
 *	 		'<option_value_1>' : '<option_name_1>',
 * 			'<option_value_2>' : '<option_name_2>',
 * 			'<option_value_3>' : '<option_name_3>',...etc....
 *		}
 * 	}
 * }
 * 
 * successCallBack : optional function() {}
 * failureCallBack : option function() {}
 */
function KyteForm(api, selector, modelName, hiddenFields, elements, title = 'Form', modal = false, modalButton = null,  successCallBack = null, failureCallBack = null) {
	this.api = api;
	this.model = modelName;
	this.modal = modal;
	this.title = title;
	this.hiddenFields = hiddenFields;
	this.elements = elements;
	this.id;

	this.success = successCallBack;
	this.fail = failureCallBack;

	this.loaded = false;

	this.selector = selector;
}

// #### TODO: Hidden fields, edit feature to update id, etc...
// ### Consider how to integrate modal/form edit with Data Table
KyteForm.prototype.init = function() {
	if (!this.loaded) {
		this.id = this.makeID(8);
		let content = '';

		// if modal, then create modal tags
		if (this.modal) {
			// add click listener to modal button
			this.modalButton.click(function() {
				$('#modal_'+this.model+'_'+this.id).modal('show');
			});

			content += '\
<div class="modal fade" id="modal_'+this.model+'_'+this.id+'" tabindex="-1" role="dialog" aria-labelledby="modal_'+this.model+'_'+this.id+'" aria-hidden="true">\
	<div class="modal-dialog modal-lg" role="document">\
		<div class="modal-content">\
			<div class="modal-header text-center">\
				<h4 class="modal-title w-100 font-weight-bold">'+this.title+'</h4>\
				<button type="button" class="close" data-dismiss="modal" aria-label="Close"><span aria-hidden="true">&times;</span></button>\
			</div>\
			<div class="modal-body mx-3">';
		}

		// form content
		content += '\
				<div id="'+this.model+'_'+this.id+'_'+field.name+'modal-preloader">\
					<div class="modal-preloader_status">\
						<div class="modal-preloader_spinner">\
							<div class="d-flex justify-content-center">\
								<div class="spinner-border" role="status"></div>\
							</div>\
						</div>\
					</div>\
				</div>\
				<form novalidate="novalidate" class="needs-validation" id="form_'+this.model+'_'+this.id+'">\
					<div class="error-msg text-danger"></div>';

		// append hidden fields
		if (this.hiddenFields) {
			this.hiddenFields.forEach(function(field) {
				content += '\
					<input type="hidden" id="form_'+this.model+'_'+this.id+'_'+field.name+'" name="'+field.name+'" value="'+field.value+'">';
			});
		}
		
				// iterate through form definition
		this.elements.forEach(function (row) {
			content += '\
					<div class="row">';
			row.forEach(function (column) {
				content += '\
						<div class="col-sm">\
							<div class="form">\
								<label for="form_'+this.model+'_'+this.id+'_'+column.field+'">'+column.label+'</label>';

				if (column.type == 'option') {
					content += '\
								<select class="custom-select" id="form_'+this.model+'_'+this.id+'_'+column.field+'" class="form-control" name="'+column.field+'"';
					content += column.required ? 'required="required"' : '';
					content += '>';
					// if not ajax, then populate with data - ajax will populate after appending html
					if (!column.option.ajax) {
						for (var key in column.option.data) {
							if (column.option.data.hasOwnProperty(key)) {
								content += '\
									<option value="'+key+'">'+value+'</option>';
							}
						}
					}
					// close select
					content += '\
								</select>';
				} else if (column.type == 'textarea') {
					content += '\
								<textarea id="form_'+this.model+'_'+this.id+'_'+column.field+'" name="'+column.field+'"';
					content += column.required ? 'required="required"' : '';
					content += '></textarea>';
				} else {
					content += '\
								<input type="'+column.type+'" id="form_'+this.model+'_'+this.id+'_'+column.field+'" class="form-control" name="'+column.field+'"';
					content += column.required ? 'required="required"' : '';
					content += '>';
				}

				content += '\
							</div>\
						</div>';
			});
			content += '\
					</div>';
		});

		// end form
		content += '\
				</form>';

		// if modal, then close modal tags
		if (this.modal) {
			content += '\
			</div>\
		</div>\
	</div>\
</div>';
		}
		this.selector.append(content);

		this.reloadAjax();

		// add submit listener
		$("#form_'+this.model+'_'+this.id").submit(function(e) {
			var form = $(this);
			e.preventDefault();

			// validate and make sure required fields are filled
			var valid = true;
			form.find('input').each(function () { if ($(this).prop('required') && !$(this).val()) { valid = false; } });
			
			// if valid, prep to send data
			if (valid) {
				// open model
				$('#'+this.model+'_'+this.id+'_'+field.name+'modal-preloader').modal('show');
				// if an ID is set, then update entry
				if (form.data('idx')) {
					k.put(this.modelName, 'id', form.data('idx'), null, form.serialize(),
						function (response) {
							$('#'+this.model+'_'+this.id+'_'+field.name+'modal-preloader').modal('hide');
							if (typeof this.success === "function") {
								this.success(response)
							}
							if (this.modal) {
								$('#modal_'+this.model+'_'+this.id).modal('hide');
							}
						},
						function (response) {
							$('#'+this.model+'_'+this.id+'_'+field.name+'modal-preloader').modal('hide');
							$("#form_'+this.model+'_'+this.id .error-msg").html(response);
							if (typeof this.success === "function") {
								this.fail(response)
							}
						}
					);
				}
				// else, create new entry
				else {
					k.post(this.modelName, null, form.serialize(),
						function (response) {
							$('#'+this.model+'_'+this.id+'_'+field.name+'modal-preloader').modal('hide');
							if (typeof this.success === "function") {
								this.success(response)
							}
							if (this.modal) {
								$('#modal_'+this.model+'_'+this.id).modal('hide');
							}
						},
						function (response) {
							$('#'+this.model+'_'+this.id+'_'+field.name+'modal-preloader').modal('hide');
							$("#form_'+this.model+'_'+this.id .error-msg").html(response);
							if (typeof this.success === "function") {
								this.fail(response)
							}
						}
					);
				}
			}
		});

		this.loaded = true;
	}
};
KyteForm.prototype.reloadAjax = function() {
	// if ajax, then populate data
	this.elements.forEach(function (row) {
		row.forEach(function (column) {
			if (column.type == 'option') {
				$("#form_"+this.model+"_"+this.id+'_'+column.field).html('');
				this.api.get(column.option.data_model_name, column.option.data_model_field, column.option.data_model_value, function (response) {
					$.each(response.data, function(index, value){
						$("#form_"+self.model+"_"+self.id+'_'+column.field).append('<option value="'+value.id+'">'+value[column.option.data_model_attribute]+'</option>');
					});
				}, function() {
					alert("Unable to load data");
				});
			}
		});
	});
}
KyteForm.prototype.makeID = function(length) {
	var result           = '';
	var characters       = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
	var charactersLength = characters.length;
	for ( var i = 0; i < length; i++ ) {
		result += characters.charAt(Math.floor(Math.random() * charactersLength));
	}
	return result;
};

// Kyte.prototype.createNavBar = function(selector) {

// };

// Kyte.prototype.createSideBar = function(selector) {

// };
