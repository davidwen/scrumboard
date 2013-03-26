### scrumboard

#### Overview

This is a digital scrum board made in the Meteor framework.

#### Requirements

Install [Meteor](http://docs.meteor.com/#quickstart)

    $ curl https://install.meteor.com | /bin/sh

#### Usage

Once all the requirements are installed, run scrumboard locally by navigating to the scrumboard project directory and running

    $ meteor run

To deploy a scrumboard instance, run

    $ meteor deploy <your scrumboard name>.meteor.com

#### Features

* Drag/drop task cards into different stages (Not Started/In Progress/Done)
* View/edit tasks in scrumboard view or in table view
* View and maintain burndown chart
* Import sprints from Google spreadsheets

#### Spreadsheet Imports

One feature is the ability to import stories/tasks directly from a spreadsheet when creating a new sprint.

To use:

1. Follow the templates in [this sample spreadsheet](https://docs.google.com/a/dwen.me/spreadsheet/ccc?key=0AhL15z4cnYX5dHJad3RiVlZQQlZaZ1VtUnFHcndESHc#gid=0) and fill with your own data. Note: Keep the unused columns in the templates.
2. Click "Add Sprint" on the scrumboard homepage
3. Copy and paste the cells below the header row into the corresponding input areas in the "Add Sprint" prompt

