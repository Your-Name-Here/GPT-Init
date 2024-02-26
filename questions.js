import { input,  } from '@inquirer/prompts'
import checkbox, { Separator } from '@inquirer/checkbox'
import select  from '@inquirer/select'

export const ask = async (question) => {
	return await input({ message: question })
}

export async function prompts(){
	const ProjectName = await input({ message: 'What is the name of your project?' })

	const ProjectType = await select({
		message: 'What type of project are you creating?',
		choices: [
			{
				name: 'Node.js Project',
				value: 'node',
				description: 'Node.js is a JavaScript runtime built on Chrome\'s V8 JavaScript engine.',
			},
			{
				name: 'Web Project',
				value: 'web',
				description: 'A web project is a project that is meant to be run in a web browser.',
			},
			new Separator(),
			{
				name: 'Native Project',
				value: 'native',
				description: 'A native project is a project that is meant to be run on a native platform. Think iOS, Android, or Windows.',
			},
		]
	})

	const ProjectDescription = await input({ message: 'Please provide a description of your project.' })

	const technologyStack = await checkbox({
		message: 'What technology stack will you be using?',
		choices: [
			new Separator('Languages'),
			{ name: 'Typescript', value: 'typescript'},
			{ name: 'Javascript (ESM)', value: 'javascript (ESM)'},
			{ name: 'Javascript (CJS)', value: 'javascript (CJS)'},
			new Separator('Frontend Frameworks'),
			// { name: 'React', value: 'react' },
			// { name: 'Vue', value: 'vue' },
			// { name: 'Angular', value: 'angular' },
			{ name: 'Svelte', value: 'svelte' },
			{ name: 'Electron', value: 'electron' },
			{ name: 'Other Framework Option', value: 'Unknown Frontend Framework' },
			new Separator('Backend Frameworks'),
			{ name: 'Express', value: 'express' },
			// { name: 'Koa', value: 'koa' },
			// { name: 'Nest', value: 'nest' },
			new Separator('Databases'),
			{ name: 'MongoDB', value: 'mongodb' },
			{ name: 'MySQL', value: 'mysql' },
			// { name: 'PostgreSQL', value: 'postgresql' },
			{ name: 'Other DB Option', value: 'Unknown Database' },
			new Separator('Testing Frameworks'),
			// { name: 'Jest', value: 'jest' },
			{ name: 'Mocha', value: 'mocha' },
			{ name: 'Chai', value: 'chai' },
			{ name: 'Other Testing Framework Option', value: 'Unknown Testing Framework' },
			new Separator('CI/CD Tools'),
			{ name: 'Github Actions', value: 'github actions' },
			// { name: 'Travis CI', value: 'travis ci' },
			// { name: 'Jenkins', value: 'jenkins ci' },
			{ name: 'Other CI/CD Tool Option', value: 'Unknown CI/CD Tool' },
			// new Separator('Containerization Tools'),
			// { name: 'Docker', value: 'docker' },
			// { name: 'Kubernetes', value: 'kubernetes' },
			new Separator('Cloud Providers'),
			{ name: 'Redis', value: 'redis'},
			// { name: 'AWS', value: 'aws' },
			// { name: 'Azure', value: 'azure' },
			// { name: 'Google Cloud', value: 'google cloud' },
			new Separator('Other Tools'),
			{ name: 'ES Lint', value: 'eslint' },
			// { name: 'Prettier', value: 'prettier' },
			// { name: 'Husky', value: 'husky' },
		],
	})
	return {ProjectName, ProjectType, ProjectDescription, technologyStack}
}