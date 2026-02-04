## 1.4.0

* **CRITICAL FIX:** Fixed KyteTable/KyteForm integration bug
  - After KyteTable v1.3.0 rewrite, forms that updated/created records would throw errors
  - Update handler used old DataTables API: `obj.selectedRow.data(response.data[0]).draw()`
  - Create handler used old DataTables API: `obj.KyteTable.table.row.add(item).draw()`
  - Both now correctly call `obj.KyteTable.draw()` to refresh the table

* **MAJOR:** KyteForm modernization with new features (100% backward compatible)
  - All new features are opt-in with safe defaults
  - Existing forms continue to work without any changes

* **New Constructor Properties:**
  - `showLoadingOverlay` (default: true) - Show/hide loading spinner during submit
  - `loadingText` - Custom text for loading spinner
  - `showSuccessToast` (default: false) - Show Bootstrap 5 toast on successful save
  - `successMessage` - Custom success toast message
  - `autoCloseModal` (default: true) - Auto-close modal after submit
  - `autoCloseDelay` (default: 0) - Delay before auto-close (ms)
  - `resetOnSuccess` (default: true) - Reset form after successful submit
  - `validateOnBlur` (default: false) - Real-time field validation on blur
  - `showInlineErrors` (default: false) - Show error messages below invalid fields
  - `scrollToFirstError` (default: false) - Auto-scroll to first invalid field
  - `trackDirtyState` (default: false) - Track unsaved changes
  - `confirmDirtyClose` (default: false) - Warn before closing with unsaved changes
  - `disableSubmitOnProcess` (default: true) - Disable submit button during processing
  - `submitButtonLoadingText` - Custom text for submit button while processing
  - `focusFirstField` (default: true) - Auto-focus first field when modal opens
  - `debug` (default: false) - Log form events to console

* **New Event Hooks:**
  - `events.beforeInit` - Called before form initialization
  - `events.afterInit` - Called after form initialization
  - `events.beforeOpen` - Called before modal opens (return false to cancel)
  - `events.afterOpen` - Called after modal opens with data
  - `events.beforeClose` - Called before modal closes (return false to cancel)
  - `events.afterClose` - Called after modal closes
  - `events.beforeSubmit` - Called before form submits (return false to cancel)
  - `events.afterSubmit` - Called after successful submit
  - `events.beforeValidate` - Called before validation
  - `events.afterValidate` - Called after validation with results
  - `events.onFieldChange` - Called when field value changes
  - `events.onError` - Called when an error occurs
  - `events.onDirtyChange` - Called when dirty state changes

* **New Public Methods:**
  - `getData()` - Get all form data as object
  - `getFieldValue(fieldName)` - Get single field value
  - `setFieldValue(fieldName, value, triggerChange)` - Set single field value
  - `setData(data)` - Set multiple field values at once
  - `clearForm()` - Clear all form fields (alias for resetForm)
  - `isEditMode()` - Check if form is in edit mode
  - `isDirty()` - Check if form has unsaved changes
  - `markClean()` - Mark form as clean
  - `markDirty()` - Mark form as dirty
  - `submit()` - Programmatically submit form
  - `refreshSelects()` - Refresh AJAX select fields
  - `loadRecord(idx)` - Load record for editing
  - `validateForm()` - Validate form and return results
  - `setFieldError(fieldName, message)` - Set field as invalid
  - `clearFieldError(fieldName)` - Clear field error
  - `clearValidation()` - Clear all validation states
  - `resetForm()` - Reset form to initial state
  - `getFormElement()` - Get jQuery form element
  - `getModalElement()` - Get jQuery modal element
  - `addHiddenField(name, value)` - Add hidden field dynamically
  - `removeHiddenField(name)` - Remove hidden field
  - `setDisabled(disabled)` - Enable/disable entire form
  - `setFieldVisible(fieldName, visible)` - Show/hide specific field

* **Enhanced Methods:**
  - `showModal(idx)` - Now accepts optional idx parameter and emits events
  - `hideModal(force)` - Now supports dirty check and force parameter
  - `appendErrorMessage(message, dismissable)` - Now supports dismissable alerts and better error formatting

* **Internal Improvements:**
  - Added private helper methods for cleaner code
  - Better error message formatting
  - Consistent loading state management
  - Improved submit button handling during processing

## 1.3.0

* **MAJOR:** Complete KyteTable rewrite - no longer depends on DataTables library
  - Modern, self-contained table implementation with automatic style injection
  - Fully backwards compatible with existing KyteTable API
  - Improved performance with optimized rendering and data handling
  - Modern UI design with clean, professional styling
  - Smart action dropdown positioning with viewport-aware logic
    - Automatically positions dropdown to stay within viewport
    - Never hidden behind table footer or header
    - Supports long menus with internal scrolling (max-height: 400px)
    - Uses `position: fixed` for proper layering and visibility
  - Enhanced features:
    - Skeleton loading states with smooth animations
    - Real-time search with debouncing
    - Intelligent pagination with ellipsis for large page counts
    - Sortable columns with visual indicators
    - Responsive design for mobile/tablet
    - Customizable page sizes
    - Row hover effects and click handling
  - Reduces external dependencies (no DataTables CSS required)
  - Only requires jQuery and Font Awesome 5.x
  - Approximately 400 lines of injected CSS for complete styling
  - Works identically in new projects without additional stylesheets

## 1.2.24

* Update Bootstrap 4 classes to Bootstrap 5 for full compatibility
  - Fix modal close button: Changed from `class="close"` with `&times;` to `class="btn-close"` (fixes white square issue)
  - Update font weight: `font-weight-bold` → `fw-bold`
  - Update text alignment: `text-right` → `text-end`
  - Update button sizing: `btn-small` → `btn-sm` (corrects invalid class name)

## 1.2.23

* Fix issue with field name and missing quotation

## 1.2.22

* Store select value as a data attribute

## 1.2.21

* Fix issue with select
* Just assert library version

## 1.2.20

* Simply select update by triggering change

## 1.2.19

* Assert versions

## 1.2.18

* Make sure the selected option is also visually selected

## 1.2.17

* Fix issue with undeclared variable

## 1.2.16

* Allow for custom column names to be used as values for select options

## 1.2.15

* Fix issue with undeclared variable

## 1.2.14

* Fix issue where select doesn't have the correct value picked

## 1.2.13

* Fix issue with class names containing illegal characters

## 1.2.12

* Fix issue with select data not populating

## 1.2.11

* Fix bug where field name still contained `[]`.
* Add ability to define a custom field name if the input name doens't match db column names.

## 1.2.10

* Fix bug that prevented itemized data from an external table from loading if the external table feature is disabled or not defined in the backend.

## 1.2.9

* Enhance table row click handler to support nested property access  
  - Added a helper function that retrieves nested properties using dot-separated paths (e.g., "person.id")  
  - This update ensures robust access to deeply nested values in data objects without breaking existing functionality

## 1.2.8

* Fix bug where externalData wasn't defined

## 1.2.7

* Fix bug where custom headers were not sent for deletion from KyteTable
* Fix bug where custom headers were not sent when loading form data for updates.

## 1.2.6

* Add support for custom headers for KyteForm

## 1.2.5

* Fixes bug where `id` value was being added as an attribute and not a value of `id`

## 1.2.4

* Add `id` and `class` to nav and sidenav items
* URL encode field name and value in URL paths for API request

## 1.2.3

* Add logic to render nav items with different styles

## 1.2.2

* Fix issue where logout button in sidenav would navigate to 404 and logout

## 1.2.1

* Add logic to render side nav item if item is a logout button

## 1.2.0

* Clean up unused variable
* Add class variable to configure session controller name
* Bypass login redirect if 403 response comes from session controller
* Update to use classes for logout handler
* Add ability to make side nav label centered and icon block

## 1.1.2

* Clean up session validation and destroy code

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
