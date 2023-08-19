import {array_union} from './util'
import {checkAnswer} from './parser'
import ExamJSON1 from './privateData/test.json'

declare module 'koishi' {
	interface User {
		exam_ongoing: number,
		exam_passed: string[]
	}
}

import { Context, Bot, Session, Schema } from 'koishi'

export const name = 'choice-rating'

export interface Config {}

// export const Config: Schema<Config> = Schema.object({})

export function apply(ctx: Context) {
	ctx.model.extend('user', {
		exam_ongoing: "unsigned",
		exam_passed: "list",
	})

	ctx.on('guild-member-request', async (session) => {
		console.log('database')
		if (session.guildId == '') {
			let uid = session.userId
			let aid = await ctx.database.get('binding', {pid: uid}, ['aid'])
			let res = await ctx.database.get('user', {id: aid[0].aid}, ['exam_passed'])
			let passed = res[0].exam_passed
			// console.log(session)
			// console.log(res)
			// console.log(res[0].exam_passed)
			if (passed.some((elem) => elem === '1')) {
				session.bot.handleGuildMemberRequest(session.messageId, true) 
			} else {
				session.bot.handleGuildMemberRequest(session.messageId, false, 'Pass Exam First.') 
			}
		}
	})

	ctx.command('exam [arg:number]')
		.userFields(['exam_ongoing'])
		.action(({session}, arg) => {
			if(0 < arg && arg < 2) {
				session.user.exam_ongoing = arg
			} else {
				return 'Exam 1: Group 114514 Entrance Exam'
			}
		})

	ctx.command('show')
		.userFields(['exam_ongoing'])
		.action(({session}) => JSON.stringify(session.user.exam_ongoing))

	ctx.command('submit <answer:text>')
		.userFields(['exam_ongoing', 'exam_passed'])
		.action(({session}, answer) => process_exam(
			answer,
			session.user
		))
}

function process_exam(answer: string, user): string {
	let exam_id = user.exam_ongoing
	let exam_object, problem_object
	switch (exam_id) {
		case 1: {
			exam_object = ExamJSON1
			break
		}
		default: {
			return 'Exam ID does not exist.'
		}
	}
	problem_object = exam_object.problem;
	try {
		let score = checkAnswer(answer, problem_object)
		// console.log(answer+score)
		if (score >= exam_object.requirement) {
			user.exam_passed.push(exam_id.toString())
			user.exam_passed = array_union(user.exam_passed)
			return JSON.stringify(user.exam_passed)+JSON.stringify(score)
		} else {
			return JSON.stringify(user.exam_passed)+JSON.stringify(score)
		}
	} catch(e) {
		return e
	}
}