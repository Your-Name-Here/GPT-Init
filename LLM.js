import { PromptTemplate } from '@langchain/core/prompts'
import { RunnableSequence } from '@langchain/core/runnables'
import fs from 'fs'
import { resolve,  } from 'path'
import { ChatOpenAI } from '@langchain/openai'
import OpenAI from 'openai'
import { exec } from 'child_process'
import chalk from 'chalk'
import { ask } from './questions.js'
import { Instructions } from './instructions/encode.js'

const openai = new OpenAI({
	apiKey: process.env['OPENAI_API_KEY'], // This is the default and can be omitted
})

const llm = new ChatOpenAI({
	openAIApiKey: process.env.OPENAI_API_KEY,
	temperature: 0.35,
	model: 'gpt-3.5-turbo',
})
const instructions = new Instructions()
instructions.embedInstructions()
const JSONFormater = 'You will need to return only valid JSON and nothing else.'

const SystemPrompt = (type)=>`You are a professional programmer. You need set up a new ${type} project. You need to configure the project and install the necessary dependencies. Assume npm init has been called already and do not suggest command line commands like"Initialize typescript config: tsc --init" would just be "Initialize typescript config". Don't make assumptions about what values to plug into functions. Ask for clarification if a user request is ambiguous`

const stepsTemplate = PromptTemplate.fromTemplate(`Please return an array (not an object) of steps to complete the setup of each of these technologies: {techs}
For example, "create config file for eslint" or "create a directory called 'src'" or "create a file named 'src/example.ts'".
${JSONFormater}`)

const executeStepTemplate = PromptTemplate.fromTemplate(`This is the list of technologies that are going to be used: {techs}.
The step you are on is: {step}.
Assume that you are in the root directory of the project`)

// Tools

/**
* Represents a file in the directory structure.
* @typedef {Object} File
* @property {string} name - The name of the file.
* @property {"file"} type
*/

/**
* Represents a directory in the directory structure.
* @typedef {Object} Directory
* @property {string} path - The absolute path to the directory.
* @property {string} name - The name of the directory.
* @property {"directory"} type
* @property {Array<File|Directory>} children - The files and subdirectories of the directory.
*/

/**
* Recursively retrieves files and directories from the specified path.
* @param {string} path - The path to the directory to retrieve files and directories from.
* @returns {Array<File|Directory>} An array of objects representing files and directories.
*/
async function getFiles(path) {
	const files = []
	const directories = []

	const items = fs.readdirSync(resolve(path))
	for (let item of items) {
		try {
			const itemPath = resolve(path, item)
			if (fs.lstatSync(itemPath).isFile()) {
				files.push({ name: item, type: 'file' })
			} else {
				if (item !== 'node_modules') {
					const nestedFiles = getFiles(itemPath)
					directories.push({ path: itemPath, name: item, type: 'directory', children: nestedFiles })
				}
			}
		} catch (error) {
			console.error('Error reading file ' + item)
		}
	}

	return [...files, ...directories]
}
async function getFileStructure(opts = { path: './'}) {
	return await getFiles(opts.path)
}
async function writeToFile(opts = {}) {
	if(fs.existsSync(opts.filepath)){
		console.log(chalk.yellow(`File ${opts.filepath} already exists. Overwriting...`))
	} else {
		console.log(chalk.yellow(`File ${opts.filepath} does not exist. Creating...`))
	}
	fs.writeFileSync(opts.filepath, opts.data)
	return opts.filepath
}
async function getFileContents(opts = { path: './'}) {
	return fs.readFileSync(opts.path, 'utf8')
}
async function installNPMPackage(packageName, opts = {
	dev: false,
}) {
	return new Promise((resolve, reject) => {
		const command = `npm install ${packageName} ${(opts.dev ? '--save-dev' : '-s' )}`
		exec(command, (error, stdout, stderr) => {
			if (error) {
				console.error(chalk.red(`Error installing package ${packageName}: ${error.message} - ${stderr}`))
				reject(error)
			} else {
				console.log(stdout)
				resolve(`${packageName} installed`)
			}
		})
	})
}
/**
 * @typedef {Object} ParameterDefinition
 * @property {'string'|'array'|'object'} type The data type of the parameter.
 * @property {string} [description] The description of the parameter (optional).
 * @property {string[]} [enum] An array of allowed values for the parameter (optional).
 */

/**
 * @typedef {Object} FunctionDefinition
 * @property {string} name The name of the function.
 * @property {string} description The description of the function.
 * @property {Object.<string, ParameterDefinition>} parameters The parameters of the function.
 * @property {string[]} required The required parameters of the function.
 */
export async function getSteps(type, techs){
	// const prompt = await stepsTemplate.format({type, techs: techs.join(', ')});
	const stepsChain = RunnableSequence.from([
		// functions: fileTools,
		stepsTemplate,
		llm,
	])
	const steps = await stepsChain.invoke({
		type,
		techs
	})
	return steps.content
}
/**
 * Array of function definitions.
 * @type {FunctionDefinition[]}
 */
export const fileTools = [
	{
		type: 'function',
		function: {
			name: 'getFileStructure',
			description: 'Recursively retrieves files and directories from the specified path.',
			parameters: {
				type: 'object',
				properties: {
					path: { type: 'string', description: 'The path to the directory to retrieve files and directories from. "./" will get all of the files ignoring node_modules' }
				}
			},
			required: ['path'],
		}
	},
	{
		type: 'function',
		function: {
			name: 'writeToFile',
			description: 'Writes data to a file.',
			parameters: {
				type: 'object',
				properties: {
					filepath: { type: 'string', description: 'The path to the file to write to.' },
					data: { type: 'string', description: 'The data to write to the file.' }
				}
			},
			required: ['filepath', 'data'],
		}
	},
	{
		type: 'function',
		function: {
			name: 'getFileContents',
			description: 'Reads the contents of a file.',
			parameters: {
				type: 'object',
				properties: {
					path: { type: 'string', description: 'The path to the file to read.' }
				}
			},
			required: ['path'],
		}
	},
	{
		type: 'function',
		function: {
			name: 'installNPMPackage',
			description: 'Installs a package from NPM.',
			parameters: {
				type: 'object',
				properties: {
					packageName: {
						type: 'string',
						description: 'The package to install.'
					},
					dev: {
						type: 'boolean',
						description: 'Should this be a dev dependency?'
					}
				}
			},
			required: ['packageName', 'dev']
		}
	},
	{
		type: 'function',
		function: {
			name: 'ask',
			description: 'Asks a question get get a clarifying answer.',
			parameters: {
				type: 'object',
				properties: {
					question: {
						type: 'string',
						description: 'The question to ask.'
					}
				}
			},
			required: ['question']
		}
	}
]
export async function executeStep(step, type, techs){
	// get instructions for the step
	const customInstructions = await instructions.search(`How do I ${step}`)
	const prompt = await executeStepTemplate.format({step, type, techs: techs.join(', ')})
	const messages = [
		{ role: 'system', content: SystemPrompt(type) + (customInstructions.length ? `\nAdditional instructions: ${ customInstructions.join('\n' )}` : '') },
		{ role: 'user', content: prompt }
	]
	let stepInference = await openai.chat.completions.create({
		messages,
		model: 'gpt-3.5-turbo',
		tools: fileTools,
		temperature: 0.1,
		tool_choice: 'auto',
	})
	let done = false
	while(stepInference.choices[0].message?.tool_calls?.length > 0 || !done){
		for(const toolCall of stepInference.choices[0].message.tool_calls){
			const tool = fileTools.find(tool => tool.function.name === toolCall.function.name)
			if(!tool) return `Function not found: ${toolCall.function.name}`
			const args = JSON.parse(toolCall.function.arguments)
			
			try {
				let result=null
				switch (tool.function.name) {
				case 'writeToFile':
					result = await writeToFile(args)
					break
				case 'installNPMPackage':
					result = await installNPMPackage(args.packageName, { dev: args.dev })
					break
				case 'getFileStructure':
					result = getFileStructure(JSON.parse(args))
					messages.push({ role: 'function', name: 'getFileStructure', content: JSON.stringify(result)})
					stepInference = await openai.chat.completions.create({
						messages,
						model: 'gpt-3.5-turbo',
						tools: fileTools,
						temperature: 0.1,
						tool_choice: 'auto',
					})
					break
				case 'getFileContents':
					result = await getFileContents(args)
					messages.push({ role: 'function', name: 'getFileContents', content: result})
					stepInference = await openai.chat.completions.create({
						messages,
						model: 'gpt-3.5-turbo',
						tools: fileTools,
						temperature: 0.1,
						tool_choice: 'auto',
					})
					break
				case 'ask':
					result = await ask(args.question)
					messages.push({ role: 'assistant', content: args.question })
					messages.push({ role: 'user', content: result })
					stepInference = await openai.chat.completions.create({
						messages,
						model: 'gpt-3.5-turbo',
						tools: fileTools,
						temperature: 0.1,
						tool_choice: 'auto',
					})
					break
				default:
					throw new Error('Function not found')
				}
				stepInference.choices[0].message.tool_calls = stepInference.choices[0].message.tool_calls.filter(call => call.function.name !== tool.function.name)
				// const result = await functions[funcName](args);
				// messages.push({ role: 'function', name: tool.function.name , content: JSON.stringify(result, 0, 2) });
			} catch (error) {
				console.error('Error calling function: ', error.message)
				// messages.push({ role: 'function', name: tool.name , content: `Error calling function: ${error}` });
			}
		}
		done = true
	}
	console.log(chalk.green('✔'), chalk.bold(`Step completed: ${step}`))
}