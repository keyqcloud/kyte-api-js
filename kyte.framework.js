function KytePage(title = 'Untitled Kyte Framework App', keyname = "index.html", path = null, lang = 'en', header = null, content = null, footer = null, addons = null, js = null) {
    this.title = title;
    this.keyname = keyname;
    this.path = path;
    this.lang = lang;
    this.addons = addons;
    this.header = header;
    this.content = content;
    this.footer = footer;
    this.js = js;
}
KytePage.prototype.render = function() {
    let html = '<!DOCTYPE html>';
    html += '<html lang="'+this.lang+'" class="">';
    html += '<head>';
    // meta tags
    html += '<meta charset="utf-8">'
    html += '<meta name="google" content="notranslate">'
    html += '<meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no">'
    html += '<meta http-equiv="x-ua-compatible" content="ie=edge">'
    // page title
    html += '<title>'+this.title+'</title>';
    // addons css
    if (this.addons) {
        this.addons.forEach(element => {
            html += (element.css ? '<link rel="stylesheet" href="'+element.css+'">' : '');
        });
    }
    html += '</head>'; // end html head
    // begin html body
    html += '<body>';
    // header and navbar
    if (this.header) html += this.header.render();
    // page content
    if (this.content) html += this.content.render();
    // footer
    if (this.footer) html += this.footer.render();
    // loading screen modal
    html += '<!-- loading modal -->';
    html += '<div id="loadingModal" class="modal hide" data-backdrop="static" data-keyboard="false" tabindex="-1">';
    html += '<div class="modal-dialog modal-sm">';
    html += '<div class="modal-content" style="width: 48px">';
    html += '<div class="spinner-wrapper text-center">';
    html += '<span class="fa fa-spinner fa-spin fa-3x"></span>';
    html += '</div>';
    html += '</div>';
    html += '</div>';
    html += '</div>';
    html += '<!-- loading modal -->';
    // addons js
    if (this.addons) {
        this.addons.forEach(element => {
            html += (element.js ? '<script type="text/javascript" src="'+element.js+'"></script>' : '');
        });
    }
    // custom js scripts such as session management
    html += (this.js ? '<script type="text/javascript">'+this.js+'</script>' : '');
    html += '</body>'; // end html body
    html += '</html>'; // end html
    return html;
}

function KyteNavbarItem(title, url, id = null) {
    this.title = title;
    this.url = (url ? url : '#');
    this.id = id;
}

function KyteNavbar(logo = null, url = null) {
    this.logo = logo;
    this.url = (url ? url : '#');
    this.heigth = 40;
    this.navbarItems = [];
    this.navbarItemsRight = [];
}
KyteNavbar.prototype.render = function(active = null) {
    let html = '<header>';
    html += '<nav class="navbar navbar-expand-lg navbar-dark fixed-top scrolling-navbar">';
    html += '<div class="container">';
    html += '<a class="navbar-brand" href="'+this.url+'">'+(this.logo ? '<img src="'+this.logo+'" height="'+this.heigth+'px">' : '')+'</a>';
    html += '<button class="navbar-toggler" type="button" data-toggle="collapse" data-target="#navbarSupportedContent-7" aria-controls="navbarSupportedContent-7" aria-expanded="false" aria-label="Toggle navigation"><span class="navbar-toggler-icon"></span></button>';
    html += '<div class="collapse navbar-collapse" id="navbarSupportedContent-7">';
    html += '<ul class="navbar-nav mr-auto">';
    this.navbarItems.forEach(element => {
        html += '<li class="nav-item'+(active ? (active == element.title ? ' active' : '') : '')+'">';
        html += '<a class="nav-link" href="'+element.url+'" id="'+(element.id ? element.id : '')+'">'+element.title;
        html += (active ? (active == element.title ? '<span class="sr-only">(current)</span>' : '') : '');
        html += '</a>';
        html += '</li>';
    });
    html += '</ul>';
    if (this.navbarItemsRight) {
        html += '<ul class="navbar-nav nav-flex-icons">';
            this.navbarItemsRight.forEach(element => {
                html += '<li class="nav-item">';
                html += '<a class="nav-link" href="'+element.url+'" id="'+(element.id ? element.id : '')+'">'+element.title+'</a>';
                html += '</li>';
            });
        html += '</ul>';
    }
    html += '</div>';
    html += '</div>';
    html += '</nav>';
    html += '</header>';
    return html;
};

function KyteFooter(title, paragraphs = null) {
    this.title = title;
    this.paragraphs = paragraphs;
}
KyteFooter.prototype.render = function() {
    let html = '<footer class="page-footer font-small mdb-color text-white py-4">';
    html += '<div class="container-fluid text-center text-md-left">';
    html += '<div class="row">';
    html += '<div class="col-md-6">';
    html += '<h4 class="text-uppercase">'+this.title+'</h4>';
    this.paragraphs.forEach(element => {
        html += '<p>'+element+'</p>';
    });
    html += '</div>';
    html += '</div>';
    html += '</div>';
    html += '</footer>';
    return html;
};

function KyteTableView(model, name, id, lang = 'English', controls = null) {
    this.model = model;
    this.name = name;
    this.id = id;
    this.lang = lang;   // language options: https://cdn.datatables.net/plug-ins/9dcbecd42ad/i18n/
    this.controls = controls;
}
KyteTableView.prototype.render = function() {
    let html = '<table id="'+this.id+'" class="table table-striped table-bordered" style="width:100%">';
    html += '<thead>';
    html += '<tr>';
    this.model.cols.forEach(element => {
        html += '<th>'+element.title+'</th>';
    });
    html += (this.controls ? '<th>&nbsp;</th>' : null);
    html += '</tr>';
    html += '</thead>';
    html += '<tbody>';
    html += '</tbody>';
    html += '</table>';
};
KyteTableView.prototype.generateJS = function() {
    let js = 'var '+this.name+' = $("#'+this.id+'").DataTable({';
    js += 'data: '+this.model.data+',';
    if (lang) {
        js += 'language: {"url": "https://cdn.datatables.net/plug-ins/9dcbecd42ad/i18n/'+this.lang+'.json"},';
    }
    js += 'columnDefs: [';
    let colCount = 0;
    this.model.cols.forEach(element => {
        js += '{';
        js += '"targets": ['+colCount+'],';
        js += '"visible": '+(element.visible ? 'true' : 'false')+',';
        js += '"data": "'+element.name+'",';
        js += '"sortable": '+(element.sortable ? 'true' : 'false')+',';
        js += 'render: function (data, type, row, meta) {'+(element.render ? element.render : 'return "";')+'}';
        js += '},';
        colCount++;
    });
    if (this.controls) {
        js += '{';
        js += '"targets": [-1],';
        js += '"visible": true,';
        js += '"data": "",';
        js += '"sortable": false,';
        js += 'render: function (data, type, row, meta) {'+this.controls+'}';
        js += '}';
    } else {
        js = js.slice(0, -1); // remove trailing comma from above loop
    }
    js += '],';
    js += 'initComplete: function () {'+(model.listner ? model.listner : '')+'}';
    js += '});';
};

function KyteTabView(view, title, id) {
    this.title = title;
    this.id = id;
    this.view = view;
}
KyteTabView.prototype.render = function() {
    let html = '<div class="kyteContentView">';
    html += this.view.render();
    html += '</div>';
    return html;
};

function KyteContentTabs(tabViews, id = null) {
    this.tabViews = tabViews;
    this.id = (id ? 'kyteTabContent' : null);
}
KyteContentTabs.prototype.render = function(active = null) {
    let html = '';
    let first = true;
    html += '<ul class="nav nav-tabs nav-justified md-tabs indigo" id="myTabJust" role="tablist">';
    this.tabViews.forEach(element => {
        html += '<li class="nav-item">';
        html += '<a class="nav-link'+(active ? (active == element.title ? ' active' : '') : '')+'" id="'+element.id+'-tab" data-toggle="tab" href="#'+element.id+'" role="tab" aria-controls="'+element.id+'"'+(active ? (active == element.title ? ' aria-selected="true"' : '') : '')+'>'+element.title+'</a>'
        html += '</li>';
    });
    html += '</ul>';
    html += '<div class="tab-content card pt-5" id="'+this.id+'">';
    this.tabViews.forEach(element => {
        html += '<div class="tab-pane fade'+(active ? (active == element.title ? ' show active' : '') : '')+'" id="'+element.id+'" role="tabpanel" aria-labelledby="'+element.id+'-tab">';
        html += element.render();
        html += '</div>';
    });
    return html;
};

function KyteContentView(html, js = null) {
    this.html = html;
    this.js = js;
}
KyteContentView.prototype.render = function() {
    let html = '<div class="kyteContentView">';
    html += this.html;
    html += '</div>';
    return html;
};

function KyteContentGrid() {
    this.contentViews = [];
}
KyteContentGrid.prototype.render = function() {
    let html = '';
    this.contentViews.forEach(element => {
        html += '<div class="col">';
        html += element.render();
        html += '</div>';
    });
    return html;
};

function KyteContentWrapper() {
    this.contentGrid = [];
}
KyteContentWrapper.prototype.render = function() {
    let html = '<main>';
    html += '<div class="container-fluid">';
    this.contentGrid.forEach(element => {
        html += '<div class="row">';
        html += element.render();
        html += '</div>';
    });
    html += '</div>';
    html += '</main>';
    return html;
};
