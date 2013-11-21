Feature: RNA gel creation from working dilution on FX machine

  Scenario: Happy path
    Given that I am logged in to S2
    When I scan in a working dilution plate that has been batched for gel creation
    Then I am on the "RNA Gel" page
    
    When I scan a source bed
    And I scan in a working dilution
    Then it should focus on the destination bed input

    When I scan a destination bed
    And I scan a gel plate
    Then it should verify they are linked

    When I click the "Begin FX" button
    Then the "Begin FX" button should be disabled
    And the "Finished FX" button be enabled

    When I click the "Finish FX" button
    Then the page navigates back to "Homepage"

  Scenario: Scanning the incorrect Gel Plate (bed verification)
    Given that I am logged in to S2
    And I am on the "RNA Gel" page

    When I scan a source bed
    And I scan a working dilution
    And I scan a destination bed
    And I scan a gel plate that has not been tied to that working dilution
    Then I should receive a visiual and audible feedback of an error
    And the app should reset all the inputs