How to use components

Scan Barcode
------------

The presenter should be constructed using the presenter factory. The type argument should be the type of barcode expected (for validation purposes). For now, the only valid and accepted type is 'tube'. 

The barcode scanner will then send messages to it's owner presenter when a barcode has been scanned, and mark itself as busy while waiting for the owner to handle the barcode text. The parent is responsible for setting the child back to a ready state, or removing it as appropriate.

Tube Removal
------------

The presenter should be constructed using the presenter factory. The tube argument should be a tube object, and not the raw Json. The component will send messages upwards if the remove button is clicked. It is expected that the parent component, for example Selection Page, will handle this message, and deal with telling the presenter to remove itself from the screen.

Selection Page
--------------

This component allows the barcodes of new tubes to be scanned. It should be created with a seed model, which should contain just a user id and a batch number. The batch number should be undefined.

The selection page will pass a 'done' message to it's parent if a user clicks on the 'next' button on the page.