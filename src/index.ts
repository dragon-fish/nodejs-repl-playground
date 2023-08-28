import intercept from 'intercept-stdout'
import ansi from 'ansi-escapes'
import readline from 'readline'
import { writeFileSync } from 'node:fs'
import { fileURLToPath } from 'url'
import { resolve } from 'path'

const __dirname = fileURLToPath(new URL('.', import.meta.url))
const LOG_FILE = resolve(__dirname, '../output.log')
function writeLog(content: string) {
  writeFileSync(LOG_FILE, content + '\n', { flag: 'a' })
}

// 假装有其他东西在控制台里搞输出
let i = 0
const interval = setInterval(() => {
  console.log(`BOT: whatever#${i++}`)
}, 1000)

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
  prompt: '> ',
})
const getInputLine = () => `> ${rl.line}`
process.stdout.write(getInputLine())

// 正确处理退出事件，否则一辈子都退出不了
rl.on('close', () => {
  process.stdout.write(ansi.cursorLeft + ansi.cursorNextLine + '\n\nBye~\n\n')
  process.exit(0)
})

// 拦截输出，确保用户输入行被置于最后一行
intercept((text) => {
  const trimedText = text.trim()
  writeLog('[OUTPUT_INTERCEPT]' + text)
  const cmdStr = getInputLine()

  // 如果输出是ansi控制字符/回车键，不做特殊处理
  if (
    (trimedText.startsWith('\u001B[') || trimedText === '\n') &&
    trimedText !== cmdStr
  ) {
    return
  }

  // readline会自己打印一次按键，如果用户输入的内容与按键一致，不要重复打印
  if (text === rl.line[rl.line.length - 1]) {
    return ''
  }

  // 清除用户输入行，重置光标到行首，打印最新输出，还原用户输入
  process.stdout.write(
    ansi.cursorLeft + ansi.eraseLine + trimedText + '\n' + cmdStr
  )

  return ''
})

// 当用户按下回车提交内容
rl.on('line', (text) => {
  process.stdout.write(ansi.cursorLeft + ansi.cursorPrevLine + ansi.eraseDown)
  console.info('USER:', text)
})

// 检查按键按下的情况
process.stdin.on('keypress', (str, key) => {
  if (key.name === 'backspace') {
    writeLog('[BACKSPACE]')
  } else if (
    !key.ctrl &&
    !key.meta &&
    key.name !== 'enter' &&
    key.name !== 'return'
  ) {
    process.stdout.write(ansi.eraseEndLine + str)
  }
})
