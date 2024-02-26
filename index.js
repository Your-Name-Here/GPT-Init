
// @ts-check
import 'dotenv/config'
import { getSteps, executeStep } from './LLM.js'
import {prompts} from './questions.js'
import chalk from 'chalk';

(async()=>{
	console.log()
	console.log(chalk.yellow('GPT-Init'), chalk.gray('AI-Powered Project Bootstrapper'))
	console.log(chalk.gray('Answer the following questions to get started with your project.'))
	console.log()
	// Ask initial Questions
	const answers = await prompts()
	
	console.log(chalk.yellow('Parsing steps to initialize your project...'))
	try {
		// Get the steps to initialize the project
		const steps = await getSteps(answers.ProjectType, answers.technologyStack)
		
		const parsedSteps = JSON.parse(steps.toString())
		
		parsedSteps.forEach((step, index) => {
			console.log(chalk.green(`Step ${index + 1}: `), step)
		})
		
		console.log(chalk.yellow('Executing steps...'))
		
		for(const step of parsedSteps){
			console.log(chalk.green('Executing step: '), step)
			await executeStep(step, answers.ProjectType, answers.technologyStack)
		}
	} catch (error) {
		console.log(chalk.red('Error: '), error)
	}
} )()