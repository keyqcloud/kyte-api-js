class Kyte {
	constructor(url, accessKey, identifier, account_number, applicationId = null) {
		this.url = url;
		this.access_key = accessKey;
		this.identifier = identifier;
		this.account_number = account_number;
		this.applicationId = applicationId;
		// store non-handoff api keys
		this.initial_access_key = accessKey;
		this.initial_identifier = identifier;
		this.initial_account_number = account_number;

		this.txToken;
		this.sessionToken;
		this.dateFormat = 'mm/dd/yy';
	}
	init() {
		this.access_key = (this.getCookie('kyte_pub') ? this.getCookie('kyte_pub') : this.access_key);
		this.identifier = (this.getCookie('kyte_iden') ? this.getCookie('kyte_iden') : this.identifier);
		this.account_number = (this.getCookie('kyte_num') ? this.getCookie('kyte_num') : this.account_number);

		// get txToken and session tokens from cookie if they exist (i.e. user session exists)
		this.txToken = (this.getCookie('txToken') ? this.getCookie('txToken') : 0);
		this.sessionToken = (this.getCookie('sessionToken') ? this.getCookie('sessionToken') : 0);
	}
	/* API Version
	 *
	 * Use sign() to obtain authorization to transact and
	 * send serialized form data accompanied with signature data
	 *
	 */
	version(callback, error = null) {
		var obj = this;

		$.ajax({
			method: "GET",
			crossDomain: true,
			dataType: "json",
			url: obj.url,
			success: function (response) {
				if (typeof callback === "function") {
					callback(response.engine_version, response.framework_version);
				} else {
					console.log("Engine: " + response.engine_version + "; Framework: " + response.framework_version);
				}
			},
			error: function (response) {
				if (typeof error === "function") {
					error(response.responseJSON.error);
				} else {
					console.log(response.responseJSON.error);
					alert(response.responseJSON.error);
				}
			}
		});
	}
	/* API Signature Request
	 *
	 * Pass identifying information and public key to backend
	 * requesting an authorization signature to transact
	 *
	 */
	sign(callback, error = null) {
		var d = new Date();
		var obj = this;

		$.ajax({
			method: "POST",
			crossDomain: true,
			dataType: "json",
			url: obj.url,
			data: 'key=' + obj.access_key + '&identifier=' + obj.identifier + '&token=' + obj.txToken + '&time=' + d.toUTCString(),
			success: function (response) {
				if (typeof callback === "function") {
					callback(response, d);
				} else {
					console.log(response);
				}
			},
			error: function (response) {
				if (typeof error === "function") {
					error(response);
				} else {
					console.log(response);
					alert(response);
				}
			}
		});
	}
	/* Send Data to Backend by Specified Method
	 *
	 * Use sign() to obtain authorization to transact and
	 * send data accompanied with signature data
	 *
	 */
	sendData(method, model, field = null, value = null, data = null, formdata = null, headers = [], callback, error = null) {
		var obj = this;
		var token = (obj.getCookie('kyte-token') ? obj.getCookie('kyte-token') : '1');

		this.sign(
			function (retval, time) {
				// /{model}/{field}/{value}
				let identity = encodeURIComponent(btoa(obj.access_key + '%' + obj.sessionToken + '%' + time.toUTCString() + '%' + obj.account_number));
				var apiURL = obj.url + '/' + model;
				if (field) {
					apiURL += '/' + field;
				}
				if (value) {
					apiURL += '/' + value;
				}

				var encdata = '';

				if (data) {
					encdata += $.param(data);
				}

				if (formdata) {
					if (encdata)
						encdata += '&';
					encdata += formdata;
				}

				$.ajax({
					method: method,
					crossDomain: true,
					dataType: "json",
					url: apiURL,
					beforeSend: function (xhr) {
						// set signature that was obtained from the signing request
						xhr.setRequestHeader('x-kyte-signature', retval.signature);
						// set identity string
						xhr.setRequestHeader('x-kyte-identity', identity);
						// if application ID is supplied, pass those - this is for provisioned containers
						if (obj.applicationId) {
							xhr.setRequestHeader('x-kyte-appid', obj.applicationId);
						}
						// if custom headers are specified, add them
						if (headers.length > 0) {
							for (const header of headers) {
								xhr.setRequestHeader(header.name, header.value);
							}
						}
					},
					data: encdata,
					success: function (response) {
						if (response.syntax_error) {
							//
							obj.syntaxErrorBanner(response.syntax_error);
						}
						obj.txToken = response.token;
						obj.sessionToken = response.session;
						if (response.kyte_pub && response.kyte_iden && response.kyte_num) {
							obj.access_key = response.kyte_pub;
							obj.identifier = response.kyte_iden;
							obj.account_number = response.kyte_num;
							obj.setCookie('kyte_pub', obj.access_key, 60);
							obj.setCookie('kyte_iden', obj.identifier, 60);
							obj.setCookie('kyte_num', obj.account_number, 60);
						} else {
							// destroy api handoff cookies
							obj.setCookie('kyte_pub', '', -1);
							obj.setCookie('kyte_num', '', -1);
							obj.setCookie('kyte_iden', '', -1);
							// reset to defaults
							obj.access_key = obj.initial_access_key;
							obj.identifier = obj.initial_identifier;
							obj.account_number = obj.initial_account_number;
						}
						if (!response.token && !response.session) {
							obj.setCookie('txToken', '', -1);
							obj.setCookie('sessionToken', '', -1);
							obj.setCookie('accountIdx', '', -1);
							obj.setCookie('roleIdx', '', -1);
							obj.setCookie('roleName', '', -1);
							// destroy api handoff cookies
							obj.setCookie('kyte_pub', '', -1);
							obj.setCookie('kyte_num', '', -1);
							obj.setCookie('kyte_iden', '', -1);
							// reset to defaults
							obj.access_key = obj.initial_access_key;
							obj.identifier = obj.initial_identifier;
							obj.account_number = obj.initial_account_number;
						} else {
							obj.setCookie('txToken', obj.txToken, 60);
							obj.setCookie('sessionToken', obj.sessionToken, 60);
							obj.setCookie('accountIdx', response.account_id, 60);
							obj.setCookie('roleIdx', response.role ? response.role.id : 0, 60);
							obj.setCookie('roleName', response.role ? response.role.name : null, 60);
						}

						if (typeof callback === "function") {
							callback(response);
						} else {
							console.log(response);
						}
					},
					error: function (response) {
						if (response.syntax_error) {
							//
							obj.syntaxErrorBanner(response.syntax_error);
						}

						if (response.status == 403) {
							obj.setCookie('txToken', '', -1);
							obj.setCookie('sessionToken', '', -1);
							obj.setCookie('accountIdx', '', -1);
							obj.setCookie('roleIdx', '', -1);
							obj.setCookie('roleName', '', -1);
						} else {
							if (response.responseJSON == null) {
								obj.setCookie('txToken', '', -1);
								obj.setCookie('sessionToken', '', -1);
								obj.setCookie('accountIdx', '', -1);
								obj.setCookie('roleIdx', '', -1);
								obj.setCookie('roleName', '', -1);
							} else {
								obj.txToken = response.responseJSON.token;
								obj.sessionToken = response.responseJSON.session;
								if (response.kyte_pub && response.kyte_iden && response.kyte_num) {
									obj.access_key = response.kyte_pub;
									obj.identifier = response.kyte_iden;
									obj.account_number = response.kyte_num;
									obj.setCookie('kyte_pub', obj.access_key, 60);
									obj.setCookie('kyte_iden', obj.identifier, 60);
									obj.setCookie('kyte_num', obj.account_number, 60);
								} else {
									// destroy api handoff cookies
									obj.setCookie('kyte_pub', '', -1);
									obj.setCookie('kyte_num', '', -1);
									obj.setCookie('kyte_iden', '', -1);
									// reset to defaults
									obj.access_key = obj.initial_access_key;
									obj.identifier = obj.initial_identifier;
									obj.account_number = obj.initial_account_number;
								}
								if (!response.responseJSON.token && !response.responseJSON.session) {
									obj.setCookie('txToken', '', -1);
									obj.setCookie('sessionToken', '', -1);
									obj.setCookie('accountIdx', '', -1);
									obj.setCookie('roleIdx', '', -1);
									obj.setCookie('roleName', '', -1);
									// destroy api handoff cookies
									obj.setCookie('kyte_pub', '', -1);
									obj.setCookie('kyte_num', '', -1);
									obj.setCookie('kyte_iden', '', -1);
									// reset to defaults
									obj.access_key = obj.initial_access_key;
									obj.identifier = obj.initial_identifier;
									obj.account_number = obj.initial_account_number;
								} else {
									obj.setCookie('txToken', obj.txToken, 60);
									obj.setCookie('sessionToken', obj.sessionToken, 60);
									obj.setCookie('accountIdx', response.account_id, 60);
									obj.setCookie('roleIdx', response.role ? response.role.id : 0, 60);
									obj.setCookie('roleName', response.role ? response.role.name : null, 60);
								}
							}
						}

						if (response.responseJSON == null) {
							console.log(response);
						} else {
							if (typeof error === "function") {
								error(response.responseJSON.error);
							} else {
								console.log(response.responseJSON.error);
							}
						}
					}
				});
			},
			function (response) {
				if (response.responseJSON == null) {
					console.log(response);
				} else {
					if (typeof error === "function") {
						error(response);
					} else {
						console.log(response);
					}
				}
			});
	}
	/* Post
	 *
	 * Use sign() to obtain authorization to transact and
	 * send data accompanied with signature data
	 *
	 */
	post(model, data = null, formdata = null, headers = [], callback, error = null) {
		this.sendData('POST', model, null, null, data, formdata, headers, callback, error);
	}
	/* Put
	 *
	 * Use sign() to obtain authorization to transact and
	 * send data accompanied with signature data
	 *
	 */
	put(model, field = null, value = null, data = null, formdata = null, headers = [], callback, error = null) {
		this.sendData('PUT', model, field, value, data, formdata, headers, callback, error);
	}
	/* Get
	 *
	 * Use sign() to obtain authorization to transact and
	 * send data accompanied with signature data
	 *
	 */
	get(model, field = null, value = null, headers = [], callback, error = null) {
		this.sendData('GET', model, field, value, null, null, headers, callback, error);
	}
	/* Delete
	 *
	 * Use sign() to obtain authorization to transact and
	 * send data accompanied with signature data
	 *
	 */
	delete(model, field = null, value = null, headers = [], callback, error = null) {
		this.sendData('DELETE', model, field, value, null, null, headers, callback, error);
	}
	/*
	 * Set browser cookie
	 */
	setCookie(cname, cvalue, minutes) {
		var d = new Date();
		d.setTime(d.getTime() + (minutes * 60 * 1000));
		var expires = "expires=" + d.toUTCString();
		document.cookie = cname + "=" + cvalue + ";" + expires + ";path=/;" + (location.protocol === 'https:' ? 'secure;' : '');
	}
	/*
	 * Get browser cookie
	 */
	getCookie(cname) {
		var name = cname + "=";
		var ca = document.cookie.split(';');
		for (var i = 0; i < ca.length; i++) {
			var c = ca[i];
			while (c.charAt(0) == ' ') {
				c = c.substring(1);
			}
			if (c.indexOf(name) == 0) {
				return c.substring(name.length, c.length);
			}
		}
		return "";
	}
	getUrlHash() {
		return location.hash;
	}
	/*
	 * Get params from URL
	 */
	getUrlParameter(sParam) {
		var sPageURL = window.location.search.substring(1), sURLVariables = sPageURL.split('&'), sParameterName, i;

		for (i = 0; i < sURLVariables.length; i++) {
			sParameterName = sURLVariables[i].split('=');

			if (sParameterName[0] === sParam) {
				return sParameterName[1] === undefined ? false : decodeURIComponent(sParameterName[1]);
			}
		}

		return false;
	}
	getPageRequest() {
		let encoded = this.getUrlParameter('request');
		if (encoded) {
			let decoded = decodeURIComponent(atob(encoded));
			let obj = JSON.parse(decoded);

			return obj;
		}
		
		return null;
	}
	setPageRequest(model, value) {
		let obj = {'model': model, 'value':value};
		let encoded = encodeURIComponent(btoa(JSON.stringify(obj)));

		return encoded;
	}
	initSpinner(selector) {
		selector.append('<div id="pageLoaderModal" class="modal" style="background: white; opacity: 0.6;" data-backdrop="static" data-keyboard="false" tabindex="-1"><div class="modal-dialog modal-sm h-100 d-flex"><div class="mx-auto align-self-center" style="width: 48px"><div class="spinner-wrapper text-center fa-6x"><span class="fas fa-sync fa-spin"></span></div></div></div></div>');
	}
	startSpinner() {
		$('#pageLoaderModal').modal();
	}
	stopSpinner() {
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
	sessionCreate(identity, callback, error = null, sessionController = 'Session') {
		var obj = this;
		this.post(sessionController, identity, null, [],
			function (response) {
				obj.txToken = response.token;
				obj.sessionToken = response.session;
				obj.setCookie('txToken', obj.txToken, 60);
				obj.setCookie('sessionToken', obj.sessionToken, 60);
				obj.setCookie('accountIdx', response.account_id, 60);
				obj.setCookie('roleIdx', response.role ? response.role.id : 0, 60);
				obj.setCookie('roleName', response.role ? response.role.name : null, 60);
				// set api handoff cookies
				obj.access_key = response.kyte_pub;
				obj.identifier = response.kyte_iden;
				obj.account_number = response.kyte_num;
				obj.setCookie('kyte_pub', obj.access_key, 60);
				obj.setCookie('kyte_iden', obj.identifier, 60);
				obj.setCookie('kyte_num', obj.account_number, 60);

				if (typeof callback === "function") {
					callback(response);
				} else {
					console.log(response);
				}
			},
			function (response) {
				// destroy session cookies
				obj.setCookie('txToken', '', -1);
				obj.setCookie('sessionToken', '', -1);
				obj.setCookie('accountIdx', '', -1);
				obj.setCookie('roleIdx', '', -1);
				obj.setCookie('roleName', '', -1);
				// destroy api handoff cookies
				obj.setCookie('kyte_pub', '', -1);
				obj.setCookie('kyte_num', '', -1);
				obj.setCookie('kyte_iden', '', -1);
				// reset to defaults
				obj.access_key = obj.initial_access_key;
				obj.identifier = obj.initial_identifier;
				obj.account_number = obj.initial_account_number;
				if (typeof error === "function") {
					error(response);
				} else {
					console.log(response);
					alert(response);
				}
			});
	}
	addLogoutHandler(selector) {
		self = this;
        $('body').on('click', selector, function() {
            console.log("LOG ME THE FUCK OUT");
            self.sessionDestroy(function () {
                location.href = "/";
            });
        });
	}
	checkSession() {
		if (this.sessionToken == 0 || this.sessionToken == '0') {
			this.setCookie('sessionToken', '', -1);
			// destroy api handoff cookies
			this.setCookie('kyte_pub', '', -1);
			this.setCookie('kyte_num', '', -1);
			this.setCookie('kyte_iden', '', -1);
			// reset to defaults
			this.access_key = this.initial_access_key;
			this.identifier = this.initial_identifier;
			this.account_number = this.initial_account_number;
		}
		if (this.txToken == 0 || this.txToken == '0') {
			this.setCookie('txToken', '', -1);
			// destroy api handoff cookies
			this.setCookie('kyte_pub', '', -1);
			this.setCookie('kyte_num', '', -1);
			this.setCookie('kyte_iden', '', -1);
			// reset to defaults
			this.access_key = this.initial_access_key;
			this.identifier = this.initial_identifier;
			this.account_number = this.initial_account_number;
		}
		if (!this.sessionToken || !this.txToken) {
			this.setCookie('txToken', '', -1);
			this.setCookie('sessionToken', '', -1);
			// destroy api handoff cookies
			this.setCookie('kyte_pub', '', -1);
			this.setCookie('kyte_num', '', -1);
			this.setCookie('kyte_iden', '', -1);
			// reset to defaults
			this.access_key = this.initial_access_key;
			this.identifier = this.initial_identifier;
			this.account_number = this.initial_account_number;
		}
		return (this.getCookie('sessionToken') ? true : false);
	}
	isSession() {
		let api = this;
		let timer = setInterval(function () {
			let session = api.checkSession();
			// Check if cookie is present, 
			if (!session) {
				window.location.href="/";
			}
		}, 30000);

		return  this.checkSession();
	}
	/*
	 * Request backend to destroy session
	 *
	 * like all api requests, first obtain a transaction
	 * authorization from sign() then pass session token from cookie.
	 * If session token is valid then log user out.
	 *
	 */
	sessionDestroy(error = null) {
		var obj = this;
		this.delete('Session', null, null, [],
			function (response) {
				obj.setCookie('txToken', '', -1);
				obj.setCookie('sessionToken', '', -1);
				obj.setCookie('accountIdx', '', -1);
				obj.setCookie('roleIdx', '', -1);
				obj.setCookie('roleName', '', -1);
				// destroy api handoff cookies
				obj.setCookie('kyte_pub', '', -1);
				obj.setCookie('kyte_num', '', -1);
				obj.setCookie('kyte_iden', '', -1);
				// reset to defaults
				obj.access_key = obj.initial_access_key;
				obj.identifier = obj.initial_identifier;
				obj.account_number = obj.initial_account_number;
				if (typeof error === "function") {
					error(response);
				} else {
					console.log(response);
					alert(response);
				}
			},
			function (response) {
				obj.setCookie('txToken', '', -1);
				obj.setCookie('sessionToken', '', -1);
				obj.setCookie('accountIdx', '', -1);
				obj.setCookie('roleIdx', '', -1);
				obj.setCookie('roleName', '', -1);
				// destroy api handoff cookies
				obj.setCookie('kyte_pub', '', -1);
				obj.setCookie('kyte_num', '', -1);
				obj.setCookie('kyte_iden', '', -1);
				// reset to defaults
				obj.access_key = obj.initial_access_key;
				obj.identifier = obj.initial_identifier;
				obj.account_number = obj.initial_account_number;
				if (typeof error === "function") {
					error(response);
				} else {
					console.log(response);
					alert(response);
				}
			});
	}
	makeid(length) {
		var result = '';
		var characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
		var charactersLength = characters.length;
		for (var i = 0; i < length; i++) {
			result += characters.charAt(Math.floor(Math.random() * charactersLength));
		}
		return result;
	}
	alert(title, message, callback = null) {
		let id = this.makeid(5);
		$('<div></div>').appendTo('body').html('<div><h6>' + message + '</h6></div>')
			.dialog({
				modal: true,
				title: title,
				zIndex: 10000,
				autoOpen: true,
				width: 'auto',
				resizeable: false,
				buttons: {
					OK: function () {
						if (typeof callback === "function") {
							callback();
						}
						$(this).dialog('close');
					}
				},
				close: function (e, ui) {
					$(this).remove();
				}
			});
	}
	confirm(title, message, callback = null, cancel = null) {
		let id = this.makeid(5);
		$('<div></div>').appendTo('body').html('<div><h6>' + message + '</h6></div>')
			.dialog({
				modal: true,
				title: title,
				zIndex: 10000,
				autoOpen: true,
				width: 'auto',
				resizeable: false,
				buttons: {
					Yes: function () {
						if (typeof callback === "function") {
							callback();
						}
						$(this).dialog('close');
					},
					No: function () {
						if (typeof cancel === "function") {
							cancel();
						}
						$(this).dialog('close');
					}
				},
				close: function (e, ui) {
					$(this).remove();
				}
			});
	}

	validateForm(form) {
		let valid = true;
		form.find('input').each(function () {
			if ($(this).prop('required') && !$(this).val()) {
				valid = false;
			}
		});
		return valid;
	}

	syntaxErrorBanner(filepath) {
		$("body").prepend('<div class="card text-white bg-danger m-3"><div class="card-header">Syntax Error</div><div class="card-body"><p class="card-text">'+filepath+'</p></div></div>');
	}
}

class KyteNav {
	constructor(selector, nav_struct, logo = null, title = null, active = null, link = "/app/") {
		this.selector = selector;
		this.nav_struct = nav_struct;
		this.logo = logo;
		this.title = title;
		this.active = active;
		this.link = link;
	}

	// create nav bar
	create() {
		let html = '\
		<div class="container-fluid">\
			<a href="'+this.link+'" class="navbar-brand">' + (this.logo ? '<img src="'+this.logo+'" style="height: 45px;" class="me-2 rounded">' : '') + (this.title ? this.title : '') + '</a>\
			<button data-bs-toggle="collapse" class="navbar-toggler" type="button" data-bs-target="#navcol-1" aria-controls="#navcol-1" aria-expanded="false" aria-label="Toggle navigation">\
				<span class="navbar-toggler-icon"></span>\
			</button>\
			<div class="collapse navbar-collapse" id="navcol-1">';
	
		let i = 0;
		this.nav_struct.forEach(menu => {
			html += i == 0 ? '<ul class="navbar-nav mx-auto">' : '<ul class="navbar-nav">';
			i++;
			menu.forEach(item => {
				if (item.dropdown) {
					html += '<li class="nav-item dropdown">';
					html += '<a class="nav-link dropdown-toggle '+ item.class +'" href="#" id="navbarDropdownMenuLink" role="button" data-bs-toggle="dropdown" aria-expanded="false">'+ (item.faicon ? '<i class="'+ item.faicon +' me-2"></i>' : '') + '<span>'+ item.label +'</span></a>';
					html += '<ul class="dropdown-menu dropdown-menu-end" aria-labelledby="navbarDropdownMenuLink">';
	
					// iterate through dropdown items
					item.items.forEach( sub => {
						html += '<li><a class="dropdown-item '+ sub.class +'" '+ (sub.logout ? 'id="logout" ' : '') + (sub.href ? 'href="'+ sub.href +'"' : 'href="#"') + '>'+ (sub.faicon ? '<i class="'+ sub.faicon +' me-2"></i>' : '') + '<span>'+ sub.label +'</span></a></li>';
					});
	
					html += '</ul>';
					html += '</li>';
				} else {
					html += '<li class="nav-item"><a '+ (item.logout ? 'id="logout" ' : '') +'class="nav-link'+(item.label == this.active ? ' active' : '')+' '+ item.class +'" '+ (item.href ? 'href="'+ item.href+'"' : 'href="#"') + '>'+ (item.faicon ? '<i class="'+ item.faicon +' me-2"></i>' : '') + '<span>'+ item.label +'</span></a></li>';
				}
			});
			html += '</ul>';
		});
	
		html += '\
			</div>\
		</div>';
	
		$(this.selector).html(html);
	}
}

class KyteSidenav {
	constructor(selector, nav_struct, default_page_selector) {
		this.selector = selector;
		this.nav_struct = nav_struct;
		this.default_page_selector = default_page_selector;
	}

	// create sub nav
	create() {
		if ($(this.selector).length) {
			let html = '<ul class="nav nav-pills flex-column mb-auto" id="sidebar-nav">';
			this.nav_struct.forEach(item => {
				if ($(item.selector).length || item.href) {
					html += '<li class="nav-item">';
					html += '<a id="'+item.selector.replace('#', '')+'-nav-link" href="'+(item.href ? item.href : item.selector)+'" class="nav-link text-dark me-2"><i class="'+ item.faicon +' me-2"></i><span>'+item.label+'</span></a>';
					html += '</li>';
				}
			});
			html += '</ul>';
			$(this.selector).html(html);
		}
	}
	
	bind(onclick = null) {
		let self = this;
		// get current hash
		let hash = location.hash;
		hash = hash == "" ? this.default_page_selector : hash;
		$(hash).removeClass('d-none');
		$(hash+'-nav-link').addClass('active');
	
		this.nav_struct.forEach(item => {
			$(item.selector+"-nav-link").click(function(e) {
				history.pushState({}, '', this.href);
	
				e.preventDefault();
				e.stopPropagation();
	
				$(item.selector+'-nav-link').addClass('active');
				$(item.selector).removeClass('d-none');
	
				if (typeof onclick === "function") {
					onclick(item);
				}
	
				// hide others
				self.nav_struct.forEach(o => {
					if (o.selector == item.selector) return;
					$(o.selector+'-nav-link').removeClass('active');
					$(o.selector).addClass('d-none');
				});
			});
		});
	}
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
class KyteTable {
	constructor(api, selector, model, columnDefs, searching = true, order = [], actionEdit = false, actionDelete = false, actionView = false, viewTarget = null, rowCallBack = null, initComplete = null, lang = "https://cdn.datatables.net/plug-ins/9dcbecd42ad/i18n/English.json") {
		this.api = api;
		this.model = model;

		this.loaded = false;
		this.table = null;

		this.selector = selector;
		this.lang = lang;
		this.searching = searching;

		this.columnDefs = columnDefs;
		this.order = order;

		this.actionEdit = actionEdit;
		this.editForm = null;
		this.actionDelete = actionDelete;
		this.actionView = actionView;
		this.viewTarget = viewTarget;
		this.rowCallBack = rowCallBack;
		this.initComplete = initComplete;

		this.processing = true;
		this.serverside = true;

		// array of object with following structure
		// [
		// 	{
		// 		'className':'myCustomAction',
		// 		'label':'Click Me!',
		//		'faicon': 'fas fa-edit', // optional
		// 		'callback': function(data, model) {
		// 			// my call back function goes here
		// 			// idx = data['id']
		// 		}
		// 	}
		// ]
		this.customAction = null;
		// same format as customAction.
		// Result will be a button instead of a dropdown
		this.customActionButton = null;

		// hooks
		this.deleteDisplayHook = null;
		this.editDisplayHook = null;

		this.page_idx = 1;

		this.pageLength = 50;
	}
	init() {
		let self = this;
		if (!this.loaded) {
			// this.api.get(this.model.name, this.model.field, this.model.value, [], function (response) {
				let content = '<thead><tr>';
				let i = 0;
				self.columnDefs.forEach(function (item) {
					content += '<th class="' + item.data.replace(/\./g, '_') + '">' + item.label + '</th>';
					delete self.columnDefs[i]['label'];
					i++;
				});
				if (self.actionEdit || self.actionDelete || (self.customAction && self.customAction.length > 0) || (self.customActionButton && self.customActionButton.length > 0)) {
					// add column for actions
					content += '<th></th>';
					// calculate new target

					// delete button listener
					if (self.actionDelete) {
						self.selector.on('click', '.delete', function (e) {
							e.preventDefault();
							let row = self.table.row($(this).parents('tr'));
							let data = row.data();
							self.api.confirm('Delete', 'Are you sure you wish to delete?', function () {
								self.api.delete(self.model.name, 'id', data['id'], [], function () {
									row.remove().draw();
								}, function () {
									alert('Unable to delete. Please try again later.');
								});
							});
						});
					}

					// custom action listener and callback
					if (self.customAction && self.customAction.length > 0){
						// iterate through each custom action
						self.customAction.forEach(a => {
							self.selector.on('click', '.'+a.className, function(e) {
								e.preventDefault();
								let row = self.table.row($(this).parents('tr'));
								let data = row.data();
								a.callback(data, self.model.name);
							});
						});
					}
					if (self.customActionButton && self.customActionButton.length > 0){
						// iterate through each custom action
						self.customActionButton.forEach(a => {
							self.selector.on('click', '.'+a.className, function(e) {
								e.preventDefault();
								let row = self.table.row($(this).parents('tr'));
								let data = row.data();
								a.callback(data, self.model.name);
							});
						});
					}
					
					let targetIdx = self.columnDefs.length;
					self.columnDefs.push({
						"targets": targetIdx,
						"sortable": false,
						"data": "",
						"className": "text-right row-actions",
						render: function (data, type, row, meta) {
							let returnString = "";
							//
							// Button custom actions
							//
							if (self.customActionButton && self.customActionButton.length > 0){
								// iterate through each custom action
								self.customActionButton.forEach(a => {
									if (a.className && a.label && typeof a.callback === "function") {
										returnString += '<a class="me-3 '+a.className+' btn btn-small btn-outline-primary" href="#">'+(a.faicon ? '<i class="'+a.faicon+'"></i> ' : '')+a.label+'</a>';
									}
								});
							}

							//
							// Dropdown custom actions
							//
							let dropdownIdx = self.api.makeid(8);
							if (self.actionEdit || self.actionDelete || (self.customAction && self.customAction.length > 0)) {
								// html for dropdown menu items
								let actionHTML = ''

								returnString += '<div class="dropdown d-inline-block"><button class="btn btn-outline-secondary dropdown-toggle" type="button" id="dataTableDropdown'+dropdownIdx+'" data-bs-toggle="dropdown" aria-expanded="false"></button><ul class="dropdown-menu" aria-labelledby="dataTableDropdown'+dropdownIdx+'">';
								
								// TODO MAKE CUSTOM ACTION BUTTON
								// if (typeof self.customAction === "function") {
								// 	returnString += self.customAction(data, type, row, meta);
								// }
								if (self.actionEdit) {
									let html = '<li><a class="dropdown-item edit" href="#"><i class="fas fa-edit"></i> Edit</a></li>';
									if (typeof self.editDisplayHook === "function") {
										html = self.editDisplayHook(row, self.model.name, html);
									}
									actionHTML += html;
								}
								if (self.actionDelete) {
									let html = '<li><a class="dropdown-item delete" href="#"><i class="fas fa-trash-alt"></i> Delete</a></li>';
									if (typeof self.deleteDisplayHook === "function") {
										html = self.deleteDisplayHook(row, self.model.name, html);
									}
									actionHTML += html;
								}
								if (self.customAction && self.customAction.length > 0){
									actionHTML += '<li><hr class="dropdown-divider"></li>';
									// iterate through each custom action
									self.customAction.forEach(a => {
										if (a.className && a.label && typeof a.callback === "function") {
											actionHTML += '<li><a class="dropdown-item '+a.className+'" href="#">'+(a.faicon ? '<i class="'+a.faicon+'"></i> ' : '')+a.label+'</a></li>';
										}
									});
								}

								// add dropdown menu items
								returnString += actionHTML;
								// close dropdown tags
								returnString += '</ul></div>';
							}
							return returnString;
						}
					});
				}
				if (self.actionView) {
					self.selector.on('click', 'tbody tr', function (e) {
						e.preventDefault();
						let row = self.table.row(this);
						let data = row.data();
						if (self.viewTarget) {
							let obj = { 'model': self.model.name, 'idx': data[self.actionView] };
							let encoded = encodeURIComponent(btoa(JSON.stringify(obj)));
							location.href = self.viewTarget + "?request=" + encoded;
						}
					});
					self.selector.on('click', 'tbody td.row-actions', function (e) {
						e.stopPropagation();
					});
				}
				content += '</tr></thead><tbody></tbody>';
				self.selector.append(content);
				self.table = self.selector.DataTable({
					// searching: self.searching,
					processing: self.processing,
					serverSide: self.serverside,
					responsive: true,
					language: { "url": self.lang },
					// data: response.data,
					columnDefs: self.columnDefs,
					order: self.order,
					pageLength: self.pageLength,
					ajax: function(data, callback, settings) {
						let fields = [];
						self.columnDefs.forEach( o => {
							fields.push(o.data);
						});
						
						let headers = [];
						if (self.serverside && self.processing) {
							headers.push({'name':'x-kyte-draw','value':data.draw});
							headers.push({'name':'x-kyte-page-size','value':data.length});
							headers.push({'name':'x-kyte-page-idx','value':Math.ceil((data.start+1)/data.length)});
							headers.push({'name':'x-kyte-page-search-value','value':data.search.value ? btoa(encodeURIComponent(data.search.value)) : ""});
							headers.push({'name':'x-kyte-page-search-fields','value':fields.join().replace(/,\s*$/, "")});

							if (data.order.length > 0) {
								let column = fields[data.order[0].column];
								let dir = data.order[0].dir;

								headers.push({'name':'x-kyte-page-order-col','value':column ? column : ""});
								headers.push({'name':'x-kyte-page-order-dir','value':dir ? dir : ""});
							}
						}

						self.api.get(self.model.name, self.model.field, self.model.value, headers, function (response) {
							let data = {
								draw: parseInt(response.draw),
								recordsTotal: parseInt(response.total_count),
								recordsFiltered: parseInt(response.total_filtered),
								data: response.data
							};
							callback(data);
						}, function () {
							alert("Unable to load data");
						});
					},
					rowCallback: self.rowCallBack,
					initComplete: self.initComplete
				});
				self.loaded = true;
				// initialize hand pointer if frow is clickable
				if (self.actionView) {
					self.selector.find('tbody').addClass('row-pointer-hand');
					$('<style>tbody.row-pointer-hand tr { cursor: pointer } tbody td {vertical-align: middle !important;}</style>').appendTo('body');
				}
		}
	}
	bindEdit(editForm) {
		var self = this;
		self.editForm = editForm;
		if (this.actionEdit) {
			// bind listener
			this.selector.on('click', '.edit', function (e) {
				e.preventDefault();
				self.editForm.selectedRow = self.table.row($(this).parents('tr'));
				let data = self.editForm.selectedRow.data();
				self.editForm.setID(data['id']);
				self.editForm.showModal();
			});
		}
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
 * 	'placeholder' : '<placeholder>',
 * 	'required' : true/false,
 * 
 * For dates:
 * 'date': true/false,
 * 
 * 	### if field type is select, the following is required to set options
 * 	## For using ajax data source:
 * 	'option' : {
 *	 	'ajax' : true,
 * 		'data_model_name' : '<model_name>',
 * 		'data_model_field' : <null/field_name>,
 * 		'data_model_value' : <null/value>,
 * 		'data_model_attribute' : <attribute_name>
 * 	}
 * 
 * 	## For using predefined values:
 * 	'option' : {
 *	 	'ajax' : false,
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
class KyteForm {
	constructor(api, selector, modelName, hiddenFields, elements, title = 'Form', table = null, modal = false, modalButton = null, successCallBack = null, failureCallBack = null) {
		this.api = api;
		this.model = modelName;
		this.modal = modal;
		this.modalButton = modalButton;
		this.KyteTable = table;
		this.title = title;
		this.hiddenFields = hiddenFields;
		this.elements = elements;
		this.id;
		this.submitButton = 'Submit';

		// file upload
		this.fileUploadField = null;

		this.itemized = false;
		this.externalChildData = false;

		this.success = successCallBack;
		this.fail = failureCallBack;

		this.loaded = false;

		this.selector = selector;

		this.selectedRow = null;

		this.editOnlyMode = false;
	}
	init() {
		if (!this.loaded) {
			this.id = this.makeID(8);
			let content = '';
			let obj = this;

			// if modal, then create modal tags
			if (this.modal) {
				// add click listener to modal button
				if (this.modalButton) {
					this.modalButton.on('click', function (e) {
						e.stopPropagation();
						e.preventDefault();
						$('#modal_' + obj.model + '_' + obj.id).modal('show');
					});
				}

				content += '\
<div class="modal fade" id="modal_' + this.model + '_' + this.id + '" tabindex="-1" role="dialog" aria-labelledby="modal_' + this.model + '_' + this.id + '" aria-hidden="true">\
	<div class="modal-dialog modal-lg" role="document">\
		<div class="modal-content">\
			<div class="modal-header text-center">\
				<h4 class="modal-title w-100 font-weight-bold">' + this.title + '</h4>\
				<button type="button" class="close" data-bs-dismiss="modal" aria-label="Close"><span aria-hidden="true">&times;</span></button>\
			</div>\
			<div class="modal-body mx-3">';
			}

			// form content
			content += '\
				<div id="' + this.model + '_' + this.id + '_modal-loader" class="modal" style="background: white; opacity: 0.6;" data-backdrop="static" data-keyboard="false" tabindex="-1">\
					<div class="modal-dialog modal-sm h-100 d-flex">\
						<div class="mx-auto align-self-center" style="width: 48px">\
							<div class="spinner-wrapper text-center fa-6x"><span class="fas fa-sync fa-spin"></span></div>\
						</div>\
					</div>\
				</div>\
				<form novalidate="novalidate" class="needs-validation" id="form_' + this.model + '_' + this.id + '">\
					<div class="error-msg text-danger"></div>';

			// append hidden fields
			if (this.hiddenFields) {
				this.hiddenFields.forEach(function (field) {
					content += '\
					<input type="hidden" id="form_' + obj.model + '_' + obj.id + '_' + field.name + '" name="' + field.name + '" value="' + field.value + '">';
				});
			}

			// iterate through form definition
			this.elements.forEach(function (row) {
				content += '\
					<div class="row">';
				row.forEach(function (column) {
					content += '\
						<div class="col-sm">\
							<div class="form-group">';

					// if label option is provided
					if (column.label) {
						content += '\
								<label for="form_' + obj.model + '_' + obj.id + '_' + column.field + '">' + column.label + '</label>';
					}

					if (column.type == 'select') {
						content += '\
								<select id="form_' + obj.model + '_' + obj.id + '_' + column.field + '" class="form-select" name="' + column.field + '"';
						content += column.required ? 'required="required"' : '';
						content += '>';
						if (column.placeholder) {
							content += '\
									<option selected="selected" disabled>' + column.placeholder + '</option>';
						}
						// if not ajax, then populate with data - ajax will populate after appending html
						if (!column.option.ajax) {
							for (var key in column.option.data) {
								if (column.option.data.hasOwnProperty(key)) {
									content += '\
									<option value="' + key + '">' + column.option.data[key] + '</option>';
								}
							}
						}
						// close select
						content += '\
								</select>';
					} else if (column.type == 'textarea') {
						content += '\
								<textarea style="width:100%" id="form_' + obj.model + '_' + obj.id + '_' + column.field + '" name="' + column.field + '"';
						content += column.required ? 'required="required"' : '';
						if (column.placeholder) {
							content += ' placeholder="' + column.placeholder + '"';
						}
						content += '></textarea>';
					} else if (column.type == 'file') {
						content += '\
								<input type="file" id="form_' + obj.model + '_' + obj.id + '_' + column.field + '" name="' + column.field + '" class="form-control" data-max-file-size="2M" accept="image/*;capture=camera"' + (column.required ? ' required="required"' : '') + ' />';
						obj.fileUploadField = 'form_' + obj.model + '_' + obj.id + '_' + column.field;
					} else {
						content += '\
								<input type="' + column.type + '" id="form_' + obj.model + '_' + obj.id + '_' + column.field + '" class="form-control' + (column.date ? ' form-datepicker' : '') + '" name="' + column.field + '"';
						content += column.required ? 'required="required"' : '';
						if (column.placeholder) {
							content += ' placeholder="' + column.placeholder + '"';
						}
						if (column.value) {
							content += ' value="' + column.value + '"';
						}
						content += (column.readonly ? 'readonly ' : '') + '>';
					}

					// add event listeners
					if (typeof column.click === "function") {
						$('body').on('click', '#form_' + obj.model + '_' + obj.id + '_' + column.field, function(e) {
							column.click(e);
						});
					}

					if (typeof column.change === "function") {
						$('body').on('change', '#form_' + obj.model + '_' + obj.id + '_' + column.field, function(e) {
							column.change(e);
						});
					}

					content += '\
							</div>\
						</div>';
				});
				content += '\
					</div>';
			});

			// if itemized is specified, populate with template information
			if (this.itemized) {
				content += '\
					<hr>\
					<h6>' + this.itemized.title + '</h6><div class="row">';

				// add column headers
				this.itemized.fields.forEach(function (field) {
					content += '<div class="col">' + field.label + '</div>';
				});

				content += '<div class="col"></div></div><div id="itemized_' + this.model + '_' + this.id + '"></div>\
					<div class="row my-4"><div class="col text-right"><a href="#" class="itemized-add-item btn btn-small btn-outline-secondary">Add</a></div></div>\
					<hr>';
			}

			content += '<div class="row my-4"><div class="col text-center"><input type="submit" name="submit" value="' + obj.submitButton + '" class="btn btn-primary btn-medium d-sm-inline-block"></div></div>';

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

			// bind submit listener
			$('#form_' + this.model + '_' + this.id).submit(function (e) {
				var form = $(this);
				e.preventDefault();

				// validate and make sure required fields are filled
				var valid = true;
				form.find('input').each(function () { if ($(this).prop('required') && !$(this).val()) { valid = false; $(this).addClass('is-invalid'); $(this).removeClass('is-valid'); } else { $(this).addClass('is-valid'); $(this).removeClass('is-invalid'); } });
				form.find('textarea').each(function () { if ($(this).prop('required') && !$(this).val()) { valid = false; $(this).addClass('is-invalid'); $(this).removeClass('is-valid'); } else { $(this).addClass('is-valid'); $(this).removeClass('is-invalid'); } });

				// if valid, prep to send data
				if (valid) {
					// open model
					$('#' + obj.model + '_' + obj.id + '_modal-loader').modal('show');
					// if an ID is set, then update entry
					let idx = obj.editOnlyMode ? obj.editOnlyMode : form.data('idx');
					if (idx > 0) {
						obj.api.put(obj.model, 'id', idx, null, form.serialize(), [],
							function (response) {
								$('#' + obj.model + '_' + obj.id + '_modal-loader').modal('hide');

								// run call back function if any
								if (typeof obj.success === "function") {
									obj.success(response);
								}

								if (obj.KyteTable) {
									obj.selectedRow.data(response.data[0]).draw();
								}

								// reset form
								$('#form_' + obj.model + '_' + obj.id).trigger("reset");

								// close modal if form is a modal dialog
								obj.hideModal();
							},
							function (response) {
								$('#' + obj.model + '_' + obj.id + '_modal-loader').modal('hide');
								$('#form_' + obj.model + '_' + obj.id + ' .error-msg').html(response);
								if (typeof obj.success === "function") {
									obj.fail(response);
								}
							}
						);
					}

					// else, create new entry
					else {
						// if file get file name and add that to form
						if (obj.fileUploadField) {
							let f = document.getElementById(obj.fileUploadField).files[0];
							if (f) {
								form.append('<input id="filename" type="hidden" name="filename" value="' + f.name +'" />');
							}
						}
						obj.api.post(obj.model, null, form.serialize(), [],
							function (response) {
								if (obj.KyteTable) {
									response.data.forEach(function (item) {
										// update data table
										obj.KyteTable.table.row.add(item).draw();
									});
								}

								// if there's a file upload process it
								if (obj.fileUploadField && response.data[0].s3endpoint) {
									// clear up form incase it's reused
									$("#filename").remove();

									// the expected return fields from the response are:
									// - key
									// - policy
									// - credential
									// - date
									// - siganture
									// - s3endpoint

									// get id of newly creatd entry
									let fileIdx = response.data[0].id;
									// get file input
									let file = document.getElementById(obj.fileUploadField).files[0];
									// create upload form to submit directly to s3
									let uploadForm = new FormData();
									// configure upload form
									uploadForm.append('acl', 'private');
									uploadForm.append('key', response.data[0].key);
									uploadForm.append('policy', response.data[0].policy);
									uploadForm.append('x-amz-algorithm', 'AWS4-HMAC-SHA256');
									uploadForm.append('x-amz-credential', response.data[0].credential);
									uploadForm.append('x-amz-date', response.data[0].date);
									uploadForm.append('x-amz-signature', response.data[0].signature);
									uploadForm.append('file', file);

									$.ajax({
										url: response.data[0].s3endpoint,
										type: 'post',
										data: uploadForm,
										dataType: 'json',
										cache: false,
										contentType: false,
										processData: false,
										success: function(data) {
											// run call back function if any
											if (typeof obj.success === "function") { obj.success(response); }
											// close modal if form is a modal dialog
											$('#' + obj.model + '_' + obj.id + '_modal-loader').modal('hide');
											// reset form
											$('#form_' + obj.model + '_' + obj.id).trigger("reset");
											// dismiss modal
											obj.hideModal();
										},
										error: function(error) {
											$('#' + obj.model + '_' + obj.id + '_modal-loader').modal('hide');
											$('#form_' + obj.model + '_' + obj.id + ' .error-msg').html(error);
											if (typeof obj.fail === "function") {
												obj.fail(error);
											}
											k.delete(obj.model, 'id', fileIdx, []);
										}
									});

								} else {
									// run call back function if any
									if (typeof obj.success === "function") { obj.success(response); }

									// reset form
									$('#form_' + obj.model + '_' + obj.id).trigger("reset");

									// close modal if form is a modal dialog
									$('#' + obj.model + '_' + obj.id + '_modal-loader').modal('hide');
									obj.hideModal();
								}
							},
							function (response) {
								$('#' + obj.model + '_' + obj.id + '_modal-loader').modal('hide');
								$('#form_' + obj.model + '_' + obj.id + ' .error-msg').html(response);
								if (typeof obj.fail === "function") {
									obj.fail(response);
								}
							}
						);
					}
				}
			});

			// initializer for modal
			if (this.modal) {
				// bind modal hide listener - reset form
				$('#modal_' + this.model + '_' + this.id).on('hidden.bs.modal', function (e) {
					if (e.target.id == 'modal_' + obj.model + '_' + obj.id) {
						var form = $('#form_' + obj.model + '_' + obj.id);
						form.data('idx', '');
						form.data('row', '');
						form.find('.error-msg').html('');
						form.find('input').each(function () {
							$(this).removeClass('is-invalid');
							$(this).removeClass('is-valid');
						});
						form.find('input[type="text"').each(function () {
							$(this).val('');
						});
						form.find('input[type="email"').each(function () {
							$(this).val('');
						});
						form.find('input[type="password"').each(function () {
							$(this).val('');
						});
						form.find('input[type="tel"').each(function () {
							$(this).val('');
						});
						form.find('input[type="checkbox"').each(function () {
							$(this).prop('checked', false);
						});
						form.find('input[type="radio"').each(function () {
							$(this).prop('checked', false);
						});
						form.find('select').each(function () {
							$(this).prop('selectedIndex', 0);
						});
						form.find('textarea').each(function () {
							$(this).val('');
						});
						if (obj.itemized) {
							$('#itemized_' + obj.model + '_' + obj.id).html('');
						}
						$('#form_' + obj.model + '_' + obj.id).trigger("reset");
					}
				});

				$('#modal_' + this.model + '_' + this.id).on('shown.bs.modal', function (e) {
					if (e.target.id == 'modal_' + obj.model + '_' + obj.id) {
						var form = $('#form_' + obj.model + '_' + obj.id);
						let idx = obj.editOnlyMode ? obj.editOnlyMode : form.data('idx');
						// check if idx is set and retrieve information
						if (idx) {
							$('#' + obj.model + '_' + obj.id + '_modal-loader').modal('show');

							obj.loadFormData(idx, function () {
								$('#' + obj.model + '_' + obj.id + '_modal-loader').modal('hide');
							}, function () {
								$('#' + obj.model + '_' + obj.id + '_modal-loader').modal('hide');
								obj.hideModal();
								alert('Unable to load form. Please try again later');
							});
						}
					}
				});
			}

			if (this.itemized) {
				// bind listener for itemized
				$('#form_' + this.model + '_' + this.id).on('click', '.itemized-add-item', function (e) {
					var uniqueId = obj.makeID(8); // ID used to track newly created selects to populate if Ajax is set to true

					e.preventDefault(); // prevent default link behaviour

					let itemizedHTML = '<div class="row itemized-row my-3">'; // init html string

					obj.itemized.fields.forEach(function (field) {
						itemizedHTML += '<div class="col"><div class="form-group">';
						if (field.type == 'select') {
							itemizedHTML += '<select id="' + field.option.data_model_name + '_' + field.option.data_model_value + '_' + uniqueId + '" id="itemized_' + obj.model + '_' + obj.id + '_' + field.name + '" class="form-select" name="' + field.name + '"';
							itemizedHTML += field.required ? 'required="required"' : '';
							itemizedHTML += '>';
							// if not ajax, then populate with data - ajax will populate after appending html
							if (!field.option.ajax) {
								for (var key in field.option.data) {
									if (field.option.data.hasOwnProperty(key)) {
										itemizedHTML += '<option value="' + key + '">' + field.option.data[key] + '</option>';
									}
								}
							}
							// close select
							itemizedHTML += '</select>';
						} else if (field.type == 'textarea') {
							itemizedHTML += '<textarea style="width:100%" id="itemized_' + obj.model + '_' + obj.id + '_' + field.name + '" name="' + field.name + '"';
							itemizedHTML += field.required ? 'required="required"' : '';
							if (field.placeholder) {
								itemizedHTML += ' placeholder="' + field.placeholder + '"';
							}
							itemizedHTML += '></textarea>';
						} else {
							itemizedHTML += '<input type="' + field.type + '" id="itemized_' + obj.model + '_' + obj.id + '_' + field.name + '" class="form-control' + (field.date ? ' form-datepicker' : '') + '" name="' + field.name + '"';
							itemizedHTML += field.required ? 'required="required"' : '';
							if (field.placeholder) {
								itemizedHTML += ' placeholder="' + field.placeholder + '"';
							}
							itemizedHTML += (field.readonly ? 'readonly ' : '') + '>';
						}
						itemizedHTML += '</div></div>';
					});
					itemizedHTML += '<div class="col-2 text-right"><a href="#" class="itemized-delete-item btn btn-small btn-outline-danger">remove</a></div></div>';
					// append fields
					$('#itemized_' + obj.model + '_' + obj.id).append(itemizedHTML);

					// run ajax for any selects
					obj.itemized.fields.forEach(function (field) {
						if (field.type == 'select') {
							if (field.option.ajax) {
								obj.api.get(field.option.data_model_name, field.option.data_model_field, field.option.data_model_value, [], function (response) {
									response.data.forEach(function (item) {
										let label = '';
										field.option.data_model_attributes.forEach(function (attribute) {
											if (item[attribute]) {
												label += item[attribute] + ' ';
											} else {
												// attempt to split by dot notation
												let c = attribute.split('.');
												if (c.length >= 2) {
													label += item[c[0]][c[1]] + ' ';
												} else {
													label += attribute + ' ';
												}
											}
										});
										$('#' + field.option.data_model_name + '_' + field.option.data_model_value + '_' + uniqueId).append('<option value="' + item['id'] + '">' + label + '</option>');
									});
								});
							}
						}
					});
				});

				$('#form_' + this.model + '_' + this.id).on('click', '.itemized-delete-item', function (e) {
					e.preventDefault();
					$(this).closest('.itemized-row').remove();
				});
			}

			this.loaded = true;
		}
	}
	showModal() {
		if (this.modal) {
			$('#modal_' + this.model + '_' + this.id).modal('show');
		}
	}
	hideModal() {
		if (this.modal) {
			$('#modal_' + this.model + '_' + this.id).modal('hide');
		}
	}
	loadFormData(idx, success = null, fail = null) {
		var obj = this;

		// Check if model has external data and set variable accordinly
		var externalData = (obj.externalChildData ? [{'name':'x-kyte-get-externaltables', 'value':'true'}] : [])

		obj.api.get(obj.model, 'id', idx, externalData, function (response) {
    
			// populate form
			// do not populate hidden fields as return data is object....
			// if (obj.hiddenFields) {
			// 	obj.hiddenFields.forEach(function(field) {
			// 		$('#form_'+obj.model+'_'+obj.id+'_'+field.name).val(response.data[0][field.name]);
			// 	});
			// }
			// next form visible elements
			obj.elements.forEach(function (row) {
				row.forEach(function (column) {
					if (typeof response.data[0][column.field] === 'object' && response.data[0][column.field] !== null) {
						$('#form_' + obj.model + '_' + obj.id + '_' + column.field).val(response.data[0][column.field].id).change();
					} else {
						if (column.type === 'date') {
							// get date and change slashes to dashes
							var dt = (response.data[0][column.field]).replace(/\//g, '-')
							$('#form_' + obj.model + '_' + obj.id + '_' + column.field).val(dt)
						} else {
							$('#form_' + obj.model + '_' + obj.id + '_' + column.field).val(response.data[0][column.field])
						}
						$('#form_' + obj.model + '_' + obj.id + '_' + column.field).change();
					}
				});
			});

			// if itemized is specified, populate with itemized information
			if (obj.itemized) {
				var lineItems = response.data[0].ExternalTables.LineItem
				var i = 0;
				lineItems.forEach(function(item) {
					var uniqueId = obj.makeID(8); // ID used to track newly created selects to populate if Ajax is set to true

					let itemizedHTML = '<div class="row itemized-row my-3">'; // init html string

					obj.itemized.fields.forEach(function (field) {
						var fieldVal = item[field.name] === undefined ? '' : item[field.name]
						itemizedHTML += '<div class="col"><div class="form-group">';
						if (field.type == 'select') {
							itemizedHTML += '<select id="itemized_' + obj.model + '_' + obj.id + '_' + field.name + '[' + i + ']" class="form-select" name="' + field.name + '" value="' + fieldVal + '"';
							itemizedHTML += field.required ? 'required="required"' : '';
							itemizedHTML += '>';
							// if not ajax, then populate with data - ajax will populate after appending html
							if (!field.option.ajax) {
								for (var key in field.option.data) {
									if (field.option.data.hasOwnProperty(key)) {
										itemizedHTML += '<option value="' + key + '">' + field.option.data[key] + '</option>';
									}
								}
							}
							// close select
							itemizedHTML += '</select>';
						} else if (field.type == 'textarea') {
							itemizedHTML += '<textarea style="width:100%" id="itemized_' + obj.model + '_' + obj.id + '_' + field.name + '[' + i + ']" name="' + field.name  + '" value="' + fieldVal + '"';
							itemizedHTML += field.required ? 'required="required"' : '';
							if (field.placeholder) {
								itemizedHTML += ' placeholder="' + field.placeholder + '"';
							}
							itemizedHTML += '></textarea>';
						} else {
							// Check for date and replace slashes with dashes
							fieldVal = field.date ? fieldVal.replace(/\//g, '-') : fieldVal
							itemizedHTML += '<input type="' + field.type + '" id="itemized_' + obj.model + '_' + obj.id + '_' + field.name + '[' + i + ']" class="form-control' + (field.date ? ' form-datepicker' : '') + '" name="' + field.name  + '" value="' + fieldVal + '"';
							itemizedHTML += field.required ? 'required="required"' : '';
							if (field.placeholder) {
								itemizedHTML += ' placeholder="' + field.placeholder + '"';
							}
							itemizedHTML += (field.readonly ? 'readonly ' : '') + '>';
						}
						itemizedHTML += '</div></div>';
					});
					itemizedHTML += '<div class="col-2 text-right"><a href="#" class="itemized-delete-item btn btn-small btn-outline-danger">remove</a></div></div>';
					// append fields
					$('#itemized_' + obj.model + '_' + obj.id).append(itemizedHTML);

					// run ajax for any selects
					obj.itemized.fields.forEach(function (field) {
						if (field.type == 'select') {
							if (field.option.ajax) {
								obj.api.get(field.option.data_model_name, field.option.data_model_field, field.option.data_model_value, [], function (response) {
									response.data.forEach(function (item) {
										let label = '';
										field.option.data_model_attributes.forEach(function (attribute) {
											if (item[attribute]) {
												label += item[attribute] + ' ';
											} else {
												// attempt to split by dot notation
												let c = attribute.split('.');
												if (c.length >= 2) {
													label += item[c[0]][c[1]] + ' ';
												} else {
													label += attribute + ' ';
												}
											}
										});
										$('#' + field.option.data_model_name + '_' + field.option.data_model_value + '_' + uniqueId).append('<option value="' + item[field.option.data_model_value] + '">' + label + '</option>');
									});
								});
							}
						}
					});

					// increment itemized row counter
					i++
				})
			}

			if (typeof success === "function") {
				success();
			}
		}, function () {
			if (typeof success === "function") {
				success();
			}
		});
	}
	reloadAjax() {
		let obj = this;
		// if ajax, then populate data
		this.elements.forEach(function (row) {
			row.forEach(function (column) {
				if (column.type == 'select') {
					if (column.option.ajax) {
						$("#form_" + obj.model + "_" + obj.id + '_' + column.field).html('');
						if (column.placeholder) {
							$("#form_" + obj.model + "_" + obj.id + '_' + column.field).append('<option selected="selected" disabled>' + column.placeholder + '</option>');
						}
						obj.api.get(column.option.data_model_name, column.option.data_model_field, column.option.data_model_value, [], function (response) {
							response.data.forEach(function (item) {
								let label = '';
								column.option.data_model_attributes.forEach(function (attribute) {
									if (item[attribute]) {
										label += item[attribute] + ' ';
									} else {
										// attempt to split by dot notation
										let c = attribute.split('.');
										if (c.length >= 2) {
											label += item[c[0]][c[1]] + ' ';
										} else {
											label += attribute + ' ';
										}
									}
								});
								$("#form_" + obj.model + "_" + obj.id + '_' + column.field).append('<option value="' + item['id'] + '"' + (item[column.option.data_model_default_field] == column.option.data_model_default_value ? 'selected="selected"' : '')  + '>' + label + '</option>');
							});
						}, function () {
							alert("Unable to load data");
						});
					}
				}
			});
		});
	}
	setID(idx) {
		$('#form_' + this.model + '_' + this.id).data('idx', idx);
	}
	getID() {
		return $('#form_' + this.model + '_' + this.id).data('idx');
	}
	makeID(length) {
		var result = '';
		var characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
		var charactersLength = characters.length;
		for (var i = 0; i < length; i++) {
			result += characters.charAt(Math.floor(Math.random() * charactersLength));
		}
		return result;
	}
}

class KytePasswordRequirement {
	constructor(api, selector, passwordField, confirmField) {
		this.api = api;
		this.selector = selector;
		this.passwordField = passwordField;
		this.confirmField = confirmField;
		this.minLength = 8;
		this.lengthText = "Minimum length of "+this.minLength;
		this.lowerCaseText = "At least one lower case letter";
		this.upperCaseText = "At least one upper case letter";
		this.numberText = "At least one number";
		this.symbolText = "At least one symbol";
		// password requirements
		this.reqLength = true;
		this.reqLowerCase = true;
		this.reqUpperCase = true;
		this.reqNumber = true;
		this.reqSymbol = true;
		//
		this.valid = false;
	}

	init() {
		let obj = this;
		this.selector.html('');
		let passreqhtml = '<ul class="fa-ul">';
		if (this.reqLength) {
			passreqhtml += '<li class="validate-length"><i class="fa-li far fa-circle"></i> '+this.lengthText+'</li>';
		}
		if (this.reqLowerCase) {
			passreqhtml += '<li class="validate-small"><i class="fa-li far fa-circle"></i> '+this.lowerCaseText+'</li>';
		}
		if (this.reqUpperCase) {
			passreqhtml += '<li class="validate-large"><i class="fa-li far fa-circle"></i> '+this.upperCaseText+'</li>';
		}
		if (this.reqNumber) {
			passreqhtml += '<li class="validate-number"><i class="fa-li far fa-circle"></i> '+this.numberText+'</li>';
		}
		if (this.reqSymbol) {
			passreqhtml += '<li class="validate-symbol"><i class="fa-li far fa-circle"></i> '+this.symbolText+'</li>';
		}
		passreqhtml += '</ul>'
		this.selector.append(passreqhtml);

		this.passwordField.on('keyup', function() {
			this.valid = obj.validatePassword();
		});
	}

	/*
	 * Check password minimums and update UI
	 */
	validatePassword() {
		var pswd = this.passwordField.val();
		let result = true;

		if (!pswd) {
			this.passwordField.removeClass('is-valid').addClass('is-invalid');
			$('ul li.validate-length i').removeClass('fa-circle');
			$('ul li.validate-length i').removeClass('fa-check-circle').addClass('fa-times-circle');
			$('ul li.validate-length i').removeClass('text-success').addClass('text-danger');

			$('ul li.validate-small i').removeClass('fa-circle');
			$('ul li.validate-small i').removeClass('fa-check-circle').addClass('fa-times-circle');
			$('ul li.validate-small i').removeClass('text-success').addClass('text-danger');

			$('ul li.validate-large i').removeClass('fa-circle');
			$('ul li.validate-large i').removeClass('fa-check-circle').addClass('fa-times-circle');
			$('ul li.validate-large i').removeClass('text-success').addClass('text-danger');

			$('ul li.validate-number i').removeClass('fa-circle');
			$('ul li.validate-number i').removeClass('fa-check-circle').addClass('fa-times-circle');
			$('ul li.validate-number i').removeClass('text-success').addClass('text-danger');

			$('ul li.validate-symbol i').removeClass('fa-circle');
			$('ul li.validate-symbol i').removeClass('fa-check-circle').addClass('fa-times-circle');
			$('ul li.validate-symbol i').removeClass('text-success').addClass('text-danger');
			result = false;
		}

		// check password length
		if (this.reqLength) {
			if (pswd.length < 8) {
				this.passwordField.removeClass('is-valid').addClass('is-invalid');
				$('ul li.validate-length i').removeClass('fa-circle');
				$('ul li.validate-length i').removeClass('fa-check-circle').addClass('fa-times-circle');
				$('ul li.validate-length i').removeClass('text-success').addClass('text-danger');
				result = false;
			} else {
				this.passwordField.removeClass('is-invalid').addClass('is-valid');
				$('ul li.validate-length i').removeClass('fa-circle');
				$('ul li.validate-length i').removeClass('fa-times-circle').addClass('fa-check-circle');
				$('ul li.validate-length i').removeClass('text-danger').addClass('text-success');
			}
		}

		//validate lower letter
		if (this.reqLowerCase) {
			if (pswd.match(/[a-z]/)) {
				this.passwordField.removeClass('is-invalid').addClass('is-valid');
				$('ul li.validate-small i').removeClass('fa-circle');
				$('ul li.validate-small i').removeClass('fa-times-circle').addClass('fa-check-circle');
				$('ul li.validate-small i').removeClass('text-danger').addClass('text-success');
			} else {
				this.passwordField.removeClass('is-valid').addClass('is-invalid');
				$('ul li.validate-small i').removeClass('fa-circle');
				$('ul li.validate-small i').removeClass('fa-check-circle').addClass('fa-times-circle');
				$('ul li.validate-small i').removeClass('text-success').addClass('text-danger');
				result = false;
			}
		}

		//validate capital letter
		if (this.reqUpperCase) {
			if (pswd.match(/[A-Z]/)) {
				this.passwordField.removeClass('is-invalid').addClass('is-valid');
				$('ul li.validate-large i').removeClass('fa-circle');
				$('ul li.validate-large i').removeClass('fa-times-circle').addClass('fa-check-circle');
				$('ul li.validate-large i').removeClass('text-danger').addClass('text-success');
			} else {
				this.passwordField.removeClass('is-valid').addClass('is-invalid');
				$('ul li.validate-large i').removeClass('fa-circle');
				$('ul li.validate-large i').removeClass('fa-check-circle').addClass('fa-times-circle');
				$('ul li.validate-large i').removeClass('text-success').addClass('text-danger');
				result = false;
			}
		}

		//validate number
		if (this.reqNumber) {
			if (pswd.match(/\d/)) {
				this.passwordField.removeClass('is-invalid').addClass('is-valid');
				$('ul li.validate-number i').removeClass('fa-circle');
				$('ul li.validate-number i').removeClass('fa-times-circle').addClass('fa-check-circle');
				$('ul li.validate-number i').removeClass('text-danger').addClass('text-success');
			} else {
				this.passwordField.removeClass('is-valid').addClass('is-invalid');
				$('ul li.validate-number i').removeClass('fa-circle');
				$('ul li.validate-number i').removeClass('fa-check-circle').addClass('fa-times-circle');
				$('ul li.validate-number i').removeClass('text-success').addClass('text-danger');
				result = false;
			}
		}

		// symbol
		if (this.reqSymbol) {
			if (pswd.match(/[@$!%*#?&]/)) {
				this.passwordField.removeClass('is-invalid').addClass('is-valid');
				$('ul li.validate-symbol i').removeClass('fa-circle');
				$('ul li.validate-symbol i').removeClass('fa-times-circle').addClass('fa-check-circle');
				$('ul li.validate-symbol i').removeClass('text-danger').addClass('text-success');
			} else {
				this.passwordField.removeClass('is-valid').addClass('is-invalid');
				$('ul li.validate-symbol i').removeClass('fa-circle');
				$('ul li.validate-symbol i').removeClass('fa-check-circle').addClass('fa-times-circle');
				$('ul li.validate-symbol i').removeClass('text-success').addClass('text-danger');
				result = false;
			}
		}

		return result;
	}
}