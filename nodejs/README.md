# Alexa Skill: Duty Roster

Implemented in Node.js.

## Getting Started

### Local code

* Install dependencies with `npm install`.
* Run tests with `npm test`.
* Package the Lambda function to upload to AWS with `npm run zip`. This creates
  an `index.zip`.

### AWS Lambda Setup

* Go to the [AWS console](https://aws.amazon.com/console/) and create a Lambda
  function based on the blueprint "alexa-skill-kit-sdk-factskill".
* Select "Alexa Skills Kit" as trigger for the Lambda.
* Give the Lambda function the name `dutyRosterNode`.
* Use Node.js version 4.3 or 6.10 as runtime environment.
* Upload the `index.zip` in the code field.
* Configure the handler as `src/index.handler`.
* Choose as role `lambda_basic_execution` (created in [this tutorial](https://github.com/alexa/alexa-cookbook/tree/master/labs/HelloWorld))

### Alexa Skill Setup

* Go to the [Amazon Developer console](https://developer.amazon.com) and select
  the tab "Alexa" on the top.
* Select "Alexa Skill Kit" and create a new skill (top right).
* Copy the intents from [config/intents.json](config/intents.json).
* Copy utterances from [config/utterances.txt](config/utterance.txt).
* Configure the Lambda created before to be the corresponding function for this
  skill.
