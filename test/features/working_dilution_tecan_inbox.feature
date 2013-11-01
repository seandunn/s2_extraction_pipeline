Feature: Working Dilution Tecan Inbox
  In order to create a working dilution, samples must be able to be
  batched together so they can be cherry picked from, and added to a 
  destination plate. Worksheets of what samples are required, and which
  plate is the destination plate, must be able to be printed off, so they
  can be used by users when in the laboratory.

  Scenario: Happy Path
    Given I am logged in to S2
    And I am on the "Working Dilution Tecan Inbox" page

    When I click on the "Create New Batch" button
    Then I should be taken to the "New Batch" page
    And I should see all the samples that are available to be batched

    When I click the arrow next to a plate 
    Then a plate showing those samples should be displayed

    When I click the "selected" checkbox
    Then all of the samples in that plate should be selected
    And the row should show how many samples have been selected
    And the "Total samples selected" label should update the total samples

    When I click a sample that has been selected
    Then that sample should no longer be selected
    And the row should show how many samples have been selected
    And the "Total samples selected" label should update the total samples

    When I click the "Batch" button
    Then the batch should be saved
    And I am taken to the "Batch Summary" page

    When I click the "Print Destination Plate Barcode" button
    Then the destination plate barcode is printed

    When I click the "Print Worksheet" button
    Then I am taken to the batch worksheet page
    And a barcode is generated and shown for the batch
    And a summary of the source plates is shown
    And the destination plate is shown with which samples are going where
    And the print dialog appears automatically

  Scenario: Selecting Too Many Sources
    Given I am logged in to S2
    And I am on the "Working Dilution Tecan Inbox" page
    And I have already selected 90 samples

    When I select another plate with 10 samples
    Then I get an error saying that there are too many samples for the destination plate

  Scenario: Selecting Too Many Source Plates
    Given I am logged in to S2
    And I am on the "Working Dilution Tecan Inbox" page
    And I have already selected samples from 26 different plates

    When I select some samples from another plate
    Then I get an error saying that too many source plates have been selected from    

