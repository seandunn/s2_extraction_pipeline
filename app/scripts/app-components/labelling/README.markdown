# Label Scanning
A simple component that deals with allowing the user to enter
a label, or scan in a barcode using a scanner.

The context should contain:
* `label` is the text to display next to the field, which is *Barcode* by default;
* `length` is the length of the barcode;
* `validation` predicate function is used to check the entered label.

It generates the following events:
* `s2.barcode.scanned` when a label has been entered, with the barcode as a parameter;
* `s2.status.error` if the label is invalid.

It responds to the following events:
* `s2.reception.reset_view` resets the view;
* `s2.activate` enables the field for label entry;
* `s2.deactivate` disables the field;
* `s2.focus` causes the field to be focused.

# Label Printing
TODO: Document this component
