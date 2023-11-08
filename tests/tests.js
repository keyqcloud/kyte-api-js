let endpoint = 'localhost'; // point to local for testing
let publickey = 'b55664edc1229731089ef61bf126f6e915cd5c37';
let identifier = '63add78526df6';
let account = '5c2a99d7ebb9af3b5dc3';

// test endpoint
k = new Kyte(endpoint, publickey, identifier, account);

k.init();

$(document).ready(function() {
    let elements = [
        [
            {
                'field':'name',
                'type':'text',
                'label':'App Name',
                'required':true,
                'col':8,
                'change': function(obj, selector, e) {
                    // do some validation
                    let isInvalid = false;
                    if (isInvalid) {
                        obj.appendErrorMessage("Validation failed because of missing...");
                        selector.addClass('is-invalid');
                    }
                }
            },
            {
                'field':'obfuscate_kyte_connect',
                'type':'select',
                'label':'Obfuscate Kyte Connect',
                'required':true,
                'col':4,
                'option': {
                    'ajax': false,
                    'data': {
                        1: 'Yes',
                        0: 'No'
                    }
                }
            },
        ],
        [
            {
                'field':'aws_username',
                'type':'text',
                'label':'AWS Username',
                'required':true
            },
            {
                'field':'aws_public_key',
                'type':'text',
                'label':'AWS Public Key',
                'required':true
            },
            {
                'field':'aws_private_key',
                'type':'text',
                'label':'AWS Secret Key',
                'required':true
            }
        ],
        [
            {
                'field':'comment',
                'type':'textarea',
                'label':'Comment',
                'required':false,
            }
        ]
    ];
    var modalForm = new KyteForm(k, $("#testModalForm"), 'Test', null, elements, 'Test Form', null, true, $("#testAddButton"));
    modalForm.init();
});
