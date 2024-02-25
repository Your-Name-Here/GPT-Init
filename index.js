
// @ts-check
import 'dotenv/config'
import { getSteps, executeStep } from './LLM.js';
import {prompts} from './questions.js';
import chalk from 'chalk';

(async()=>{
  console.log()
  console.log(chalk.yellow('AI-Powered Project Bootstrapper'))
  console.log(chalk.gray('Answer the following questions to get started with your project.'))
  console.log()
  const answers = await prompts();

  // console.log(chalk.green('Project Name: '), answers.ProjectName);
  // console.log(chalk.green('Project Type: '), answers.ProjectType);
  // console.log(chalk.green('Project Description: '), answers.ProjectDescription);
  // console.log(chalk.green('Technology Stack: '), answers.technologyStack);
  console.log(chalk.yellow('Parsing steps to initialize your project...'));
  const steps = await getSteps(answers.ProjectType, answers.technologyStack);
  const parsedSteps = JSON.parse(steps.toString());
  parsedSteps.forEach((step, index) => {
    console.log(chalk.green(`Step ${index + 1}: `), step);
  })
  console.log(chalk.yellow('Executing steps...'));
  for(const step of parsedSteps){
    console.log(chalk.green('Executing step: '), step);
    await executeStep(step, answers.ProjectType, answers.technologyStack);
  }
} )();