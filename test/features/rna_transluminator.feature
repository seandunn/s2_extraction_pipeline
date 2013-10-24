Feature: Transluminator

  Scenario: Happy Path
    Given that I am known to the system
    And I am on the "RNA Quality Analysis - Transluminator" page
    When I click the "Begin Imager" button
    Then the "Begin Imager" button should be disabled
    And the "End Imager" button should be enabled

    When I click the "End Imager" button
    Then the "Select Image" button should be enabled

    When I click the "Select Image" button
    Then a file dialog should appear

    When I select an image file from the dialog
    Then the image file's name should be displayed
    And the "Upload" button should be enabled
    And click the "Upload" button

    Then the file is uploaded to the QC data store