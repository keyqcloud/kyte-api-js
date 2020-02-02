function Kyte(url, accessKey) {
	this.url = url;
	this.access_key = accessKey;
}

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
	    url: obj.url+'sign/',
	    data: {
	        'kyte-time': d.toUTCString(),
	        'kyte-domain': location.origin,
	        'kyte-access-key': obj.access_key
	    },
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

/* Send Form Data to Backend
 *
 * Use sign() to obtain authorization to transact and
 * send serialized form data accompanied with signature data
 *
 */
Kyte.prototype.sendForm = function(object, call, form_serialized_data, callback, error = null) {
	var obj = this;

	this.sign(function(retval, time) {
		$.ajax({
	    	method: "POST",
	    	crossDomain: true,
	    	dataType: "json",
	    	url: obj.url,
	    	data: form_serialized_data + '&object=' + object + '&call=' + call + '&kyte-signature=' + retval.signature + '&kyte-time=' + time.toUTCString() + '&kyte-access-key=' + obj.access_key,
	    	success: function(response){
		        if (typeof callback === "function") {
		      		callback(response);
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
	});
};

/* Send Non-Form Data to Backend
 *
 * Use sign() to obtain authorization to transact and
 * send data accompanied with signature data
 *
 */
Kyte.prototype.sendData = function(object, call, data, callback, error = null) {
	var obj = this;

	this.sign(function(retval, time) {
		data['object'] = object;
		data['call'] = call;
		data['kyte-signature'] = retval.signature;
		data['kyte-time'] = time.toUTCString();
		data['kyte-access-key'] = obj.access_key;

		$.ajax({
			method: "POST",
			crossDomain: true,
			dataType: "json",
			url: obj.url,
			data: data,
			success: function(response) {
		        if (typeof callback === "function") {
		      		callback(response);
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
	});
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

/* 
 * Request backend to create new session
 *
 * like all api requests, first obtain a transaction
 * authorization from sign() then pass email and password.
 * If user is valid then create cookie with token; otherwise
 * redirect users to login page.
 * 
 */
Kyte.prototype.sessionCreate = function(email, password, error = null) {
	var obj = this;

	this.sign(function(retval, time) {
		$.ajax({
	        method: "POST",
	        crossDomain: true,
	        dataType: "json",
	        url: obj.url+'session/',
	        data: {
	        	'request': 'new',
	        	'kyte-signature': retval.signature,
	        	'kyte-time': time.toUTCString(),
	        	'kyte-access-key': obj.access_key,
	        	'email': email,
	        	'password': password
	        },
	        success: function(response){
				obj.setCookie('kyte-token', response.token, 60);
				location.replace(response.scope+'/requests');
	        },
	        error: function(response) {
	        	obj.setCookie('kyte-token', '', -1);
				if (typeof error === "function") {
		      		error(response.responseJSON.error);
		      	} else {
		      		console.log(response.responseJSON.error);
			        alert(response.responseJSON.error);
			    }
			    location.replace('/');
	        }
	    });
	},
	function(response) {
    	obj.setCookie('kyte-token', '', -1);
    	if (typeof error === "function") {
      		error(response.responseJSON.error);
      	} else {
      		console.log(response.responseJSON.error);
	        alert(response.responseJSON.error);
	    }
	    location.replace('/');
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
Kyte.prototype.sessionValidate = function(error = null) {
	var obj = this;

	this.sign(function(retval, time) {
		$.ajax({
	        method: "POST",
	        crossDomain: true,
	        dataType: "json",
	        url: obj.url+'session/',
	        data: {
	        	'request': 'validate',
	        	'kyte-signature': retval.signature,
	        	'kyte-time': time.toUTCString(),
	        	'kyte-access-key': obj.access_key,
	        	'kyte-token': obj.getCookie('kyte-token')
	        },
	        success: function(response){
				obj.setCookie('kyte-token', response.token, 60);
				if (location.origin != response.scope) {
					location.replace(response.scope+'/requests');
				}
	        },
	        error: function(response) {
	        	obj.setCookie('kyte-token', '', -1);
		    	if (typeof error === "function") {
		      		error(response.responseJSON.error);
		      	} else {
		      		console.log(response.responseJSON.error);
			        alert(response.responseJSON.error);
			    }
			    location.replace('/');
	        }
	    });
	},
	function(response) {
    	obj.setCookie('kyte-token', '', -1);
    	if (typeof error === "function") {
      		error(response.responseJSON.error);
      	} else {
      		console.log(response.responseJSON.error);
	        alert(response.responseJSON.error);
	    }
	    location.replace('/');
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

/**************************************/
/*                                    */
/* HELPER CODE NOT PART OF KYTE CLASS */
/*                                    */
/**************************************/
/*
 * When multiple modal windows are open,
 * allow others to scroll even when top modal is closed.
 */
$('body').on('hidden.bs.modal', function () {
	if($('.modal.show').length > 0)
	{
	    $('body').addClass('modal-open');
	}
});
