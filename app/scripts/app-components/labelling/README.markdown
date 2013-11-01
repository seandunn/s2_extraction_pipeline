# Label Scanning
A simple component that deals with allowing the user to enter
a label, or scan in a barcode using a scanner.

The context should contain:
* `label` is the text to display next to the field, which is *Barcode* by default;
* `length` is the length of the barcode;
* `validation` predicate function is used to check the entered label.

It generates the following events:
* `scanned.barcode.s2` when a label has been entered, with the barcode as a parameter;
* `error.status.s2` if the label is invalid.

It responds to the following events:
* `reset_view.reception.s2` resets the view;
* `activate.s2` enables the field for label entry;
* `deactivate.s2` disables the field;
* `focus.s2` causes the field to be focused.

# Label Printing
TODO: Document this component
