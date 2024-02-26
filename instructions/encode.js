import 'dotenv/config'
import { readFileSync } from 'fs'
import { MemoryVectorStore } from 'langchain/vectorstores/memory'
import { OpenAIEmbeddings } from '@langchain/openai'
import { ScoreThresholdRetriever } from 'langchain/retrievers/score_threshold'

function splitDocumentIntoSections(documentContent) {
	const sections = documentContent.split(/\n\d+\. /).filter(Boolean)
	return sections.map(section => section.trim())
}

export class Instructions {
	constructor() {}
	async embedInstructions() {
		const instructions = await readFileSync('instructions/instructions.txt', 'utf8')
		const texts = splitDocumentIntoSections(instructions)
		const metadata = texts.map((text, index) => ({ id: index + 1 }))	
		this.vectorStore = await MemoryVectorStore.fromTexts(
			texts,
			metadata,
			new OpenAIEmbeddings()
		)
		this.retriever = ScoreThresholdRetriever.fromVectorStore(this.vectorStore, {
			minSimilarityScore: 0.5, // Finds results with at least this similarity score
			maxK: 1, // The maximum K value to use. Use it based to your chunk size to make sure you don't run out of tokens
			kIncrement: 2, // How much to increase K by each time. It'll fetch N results, then N + kIncrement, then N + kIncrement * 2, etc.
		})
	}
	async search(query) {
		if(query.length < 10) throw new Error('Query must be at least 10 character long')
		// const results = await this.vectorStore.similaritySearchVectorWithScore(query, n)
		// return results.filter(doc=>!isNaN(doc[1])).map(result => result.pageContent)
		const result = await this.retriever.getRelevantDocuments(query)
		return result.map(doc => doc.pageContent)
	}
}