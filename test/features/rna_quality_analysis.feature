Feature: RNA Quality Analysis on E-Base from RNA Gel creation

  Scenario: Happy Path
    Given I am on the "DNA Quality Analysis - E-base" page
    When I scan an e-base on the machine
    And I scan a gel plate
    Then it ties the e-base to the gel plate
    And it focuses on the next e-base input

    When I click the "Begin E-Base" button
    Then the "Begin E-Base" button becomes disabled
    And the "End E-Base" button becomes enabled

    When I click the "End E-Base" button
    Then the page navigates to "DNA Quality Analysis - Transluminator" page