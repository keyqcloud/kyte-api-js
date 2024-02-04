## 1.1.1

* Add flag to `isSession` for disabling periodic session checks
* Add flag to `isSession` for disabling redirect behavior
* Add param to `isSession` for customizing interval for session timer
* Remove JavaScript alerts for ajax errors and replace with console.error
* Improve error messages for better clarity
* Add session handling in ajax call if response is 403

## 1.1.0

* Updated the session expiration message for clarity and better user experience.
* Fixed an issue where the session expiration message would incorrectly trigger every 30 minutes. Adjusted the session monitoring logic to prevent false positives and ensure timely notifications only upon actual session expiration.
* Introduced the Kyte Web Component class, enhancing UI flexibility and interactivity. This feature allows dynamic binding of data to templates with support for custom mutator functions. It significantly streamlines the process of rendering data-driven components, such as product cards, by automatically replacing placeholders in HTML templates with actual data from JSON objects.

## 1.0.24

* Display login redirect for 403 as it conflicts with callback

## 1.0.23

* Dismiss any loaders that may be open when session expires prior to redirect

## 1.0.22

* Fix issue with api not being defined for redirect

## 1.0.21

* Fix page redirect for expired session
* Add page redirect for 403

## 1.0.20

* Refactor: Convert class methods to arrow functions for consistent 'this' context
* Update session timeout to display message and include redir in url param
* Add dismiss flag to alert to toggle dismissable alerts.

## 1.0.19

* Update to bs 5.x
* Add selected row to callback param

## 1.0.18

* Add support for maxlength for text input and text area

## 1.0.17

* Allow for custom validation function to be called before submiting form

## 1.0.16

* Expose form object to click/change callback

## 1.0.15

* Wrap DT search with form with autocomplete off to prevent chrome from autofilling

## 1.0.14

* Check if callback is a function before calling it

## 1.0.13

* Add autocomplete off for DataTables to prevent chrome from attempting to autocomplete

## 1.0.12

* Update form element callback to include selector

## 1.0.11

* Fix bug where modal would not open for edit or be dismissed

## 1.0.10

* Fix bug where field id was not generating correctly for hidden fields

## 1.0.9

* Clean up KyteForm code base
* Add support for custom field IDs for form fields
* Add support for formatting col sizes for form fields
* Add unit tests

## 1.0.8

* Option to pass custom headers to table
* Refactor KyteTable initializer
* Update utility scripts

## 1.0.7

* fix typo with object class name

## 1.0.6

* Ability to toggle whether cookie should have domain

## 1.0.5

* Add version number constant
* rename function version() to apiVersion() for retrieving endpoint version

## 1.0.4

* Add domain to cookie so subdomains can also access cookie

## 1.0.3

* Send device information (user agent) via headers

## 1.0.2

* refrac: return null if cookie doesn't exist

## 1.0.1

* refrac: allow for non-expiring cookies to be set

## 1.0.0

* Initial release
