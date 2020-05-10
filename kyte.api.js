function Kyte(url, accessKey, identifier) {
	this.url = url;
	this.access_key = accessKey;
	this.identifier = identifier;
	this.txToken;
	this.sessionToken;
}

Kyte.prototype.init = function() {
	this.txToken = (obj.getCookie('txToken') ? obj.getCookie('txToken') : '0');
	this.sessionToken = (obj.getCookie('sessionToken') ? obj.getCookie('sessionToken') : '0');
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
				  callback(response.version);
			  } else {
				  console.log(response.version);
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
	      		error(response.responseJSON.error);
	      	} else {
	      		console.log(response.responseJSON.error);
		        alert(response.responseJSON.error);
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
		let identity = encodeURIComponent(btoa(obj.access_key+'%'+obj.sessionToken+'%'+time.toUTCString()));
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
				obj.setCookie('txToken', obj.txToken, 60);
				obj.setCookie('sessionToken', obj.sessionToken, 60);

		        if (typeof callback === "function") {
		      		callback(response);
		      	} else {
		      		console.log(response);
		      	}
			},
			error: function(response) {
				obj.txToken = response.token;
				obj.sessionToken = response.session;
				obj.setCookie('txToken', obj.txToken, 60);
				obj.setCookie('sessionToken', obj.sessionToken, 60);

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
	document.cookie = cname + "=" + cvalue + ";" + expires + ";path=/";
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

Kyte.prototype.initSpinner = function() {
	$('body').append('<div id="pageLoaderModal" class="modal hide" data-backdrop="static" data-keyboard="false" tabindex="-1"><div class="modal-dialog modal-sm"><div class="modal-content" style="width: 48px"><div class="spinner-wrapper text-center"><span class="fa fa-spinner fa-spin fa-3x"></span></div></div></div></div>');
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
Kyte.prototype.sessionCreate = function(email, password, callback, error = null) {
	var obj = this;
	this.post('Session', { 'email' : email, 'password' : password }, null,
	function(response) {
		obj.txToken = response.data.txToken;
		obj.sessionToken = response.data.sessionToken;
		obj.setCookie('txToken', obj.txToken, 60);
		obj.setCookie('sessionToken', obj.sessionToken, 60);
		if (typeof callback === "function") {
			callback(response);
		} else {
			console.log(response);
		}
	},
	function(response) {
		obj.setCookie('txToken', '', -1);
		obj.setCookie('sessionToken', '', -1);
		if (typeof error === "function") {
			error(response);
		} else {
			console.log(response);
			alert(response);
		}
	});
};

/* 
 * Request backend to validate session
 *
 * like all api requests, first obtain a transaction
 * authorization from sign() then pass session token from cookie.
 * If session token is valid then update expiration; otherwise
 * redirect users to login page.
 * 
 */
Kyte.prototype.sessionValidate = function(callback = null, error = null) {
	var obj = this;
	
	obj.initSpinner();
	obj.startSpinner();
	
	this.get('Session', null, null,
	function(response) {
		obj.txToken = response.data.txToken;
		obj.sessionToken = response.data.sessionToken;
		obj.setCookie('txToken', obj.txToken, 60);
		obj.setCookie('sessionToken', obj.sessionToken, 60);
		obj.stopSpinner();
		if (typeof callback === "function") {
			callback(response);
		} else {
			console.log(response);
		}
	},
	function(response) {
		obj.setCookie('txToken', '', -1);
		obj.setCookie('sessionToken', '', -1);
		obj.stopSpinner();
		if (typeof error === "function") {
			error(response);
		} else {
			console.log(response);
			alert(response);
		}
	});
};

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
