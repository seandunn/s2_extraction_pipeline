Feature: Creating a Working Dilution plate in the DNA QC process
    
  Scenario: Scanning in a valid plate that has been batched
    Given that I am logged in to S2
    When I scan a plate in a working dilution batch
    Then I am on the "Working Dilution" page

    When I scan a robot barcode
    Then I see the number of beds for the number of plates in the batch
    And I see the bed for the destination plate
    And the first bed input is focused

    When I scan a bed on the robot
    And scan a source plate
    Then it should record that bed and plate together
    And it should provide visual and auidible feedback that the plate can be recorded there
    And it should focus on the next bed input

    When I scan the destination bed
    And I scan the destination plate
    Then it should record the bed and plate together
    And it should provide visual and audible feedback that the plate can be recorded there

    When I click the "Download" button
    Then it should download a new Tecan file

  Scenario: Hitting the reset button
    Given that I am logged in to S2
    And I have scanned in a robot barcode
    And I have filled in all the inputs
    When I click the "Reset" button
    Then all the inputs are cleared

  Scenario: Putting incorrect plate into destination bed
    Given that I am logged in to S2
    When I scan the destination bed
    And I scan a plate which isn't the desitination plate
    Then I receive a visual and audible error that the plate is not the destination plate

  Scenario: Scanning a plate that is not from the same batch
    Given that I am logged in to S2
    And I have scanned a volume checked plate in a working dilution batch
    And I am on the "Working Diltuion" page
    When I scan a plate that is from a different batch
    Then I receive a visual and audible error saying the plate is from a different batch