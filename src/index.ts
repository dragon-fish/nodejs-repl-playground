import intercept from 'intercept-stdout'
import ansi from 'ansi-escapes'
import readline from 'readline'
import { writeFileSync } from 'node:fs'
import { fileURLToPath } from 'url'
import { resolve } from 'path'

const __dirname = fileURLToPath(new URL('.', import.meta.url))
const LOG_FILE = resolve(__dirname, '../output.log')

// 假装有其他东西在控制台里搞输出
let i = 0
const interval = setInterval(() => {
  console.log(`BOT: whatever#${i++}`)
}, 1000)

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
})

intercept((text) => {
  text = text.trim()

  if (text.startsWith('> ') || text.startsWith('\u001B[') || text === '\n') {
    return
  }

  writeFileSync(LOG_FILE, text + '\n', { flag: 'a' })
  // 清除用户输入行，重置光标到行首，打印最新输出，还原用户输入
  process.stdout.write(
    ansi.cursorLeft + ansi.eraseLine + text + '\n' + `> ${input}`
  )

  return ''
})

let input = ''
process.stdout.write('> ')
// process.stdin.setRawMode(true)
// Listen for keypress event
process.stdin.on('keypress', (str, key) => {
  if (key.ctrl && key.name === 'c') {
    process.stdout.write(ansi.cursorLeft + ansi.cursorNextLine + '\n\nBye~\n\n')
    process.exit(0)
  }

  if (key.name === 'return') {
    const content = input
    input = ''
    process.stdout.write(ansi.cursorLeft + ansi.cursorPrevLine + ansi.eraseDown)
    console.info('USER:', content)
  } else if (key.name === 'backspace') {
    if (input.length === 0) return
    input = input.slice(0, -1)
    process.stdout.write(ansi.cursorBackward(1) + ansi.eraseEndLine)
  } else {
    input += str
    process.stdout.write(
      ansi.cursorLeft + ansi.cursorPrevLine + ansi.eraseDown + `> ${input}`
    )
  }
})
