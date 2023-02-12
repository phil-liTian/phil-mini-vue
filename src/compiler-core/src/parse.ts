import { NodeTypes } from "./ast"

const enum TagType {
  Start,
  End
}

export const baseParse = (content: string) => {
  const context = createParserContext(content)

  return createRoot(parseChildren(context))
}

function parseChildren(context) {
  let nodes: any = []
  let node
  const s = context.source
  if(s.startsWith('{{')) {
    node = parseInterpolation(context)
  } else if(s[0] === '<') {
    if( /[a-z]/i.test(s[1]) ) {
      // 字母为开头
      node = parseElement(context)
    }
  } 

  if( !node ) {
    node = parseText(context)
  }

  nodes.push(node)
  return nodes
}

// 解析文本节点
function parseText(context) {
  const content = parseTextData(context, context.source.length)
  console.log('length', context.source.length);

  return {
    type: NodeTypes.TEXT,
    content
  }
}

function parseTextData(context, length) {
  const content = context.source.slice(0, length)
  advanceBy(context, length)

  return content
}

// 解析标签
function parseElement(context) {
  const element = parseTag(context, TagType.Start)
  parseTag(context, TagType.End)

  return element
}

function parseTag(context, type: TagType) {
  // <div></div> => div
  // 1.解析tag
  // 2.删除处理完成的代码
  const matches = context.source.match(/^<\/?([a-z]*)/)
  console.log('matches', matches);
  const tag = matches[1]
  advanceBy(context, matches[0].length + 1)
  console.log('source', context.source);

  if(type === TagType.End) return

  return {
    type: NodeTypes.ELEMENT,
    tag
  }
}

// 解析插值
function parseInterpolation(context) {
  // {{message}} => message
  const openDelimiter = '{{'
  const closeDeimiter = '}}'
  // 获取closeDeimiter的位置下标
  const closeIndex = context.source.indexOf(closeDeimiter, openDelimiter.length)
  // 原始内容的长度
  const rawContentLength = closeIndex - openDelimiter.length
  // 推进代码
  // context.source = context.source.slice(openDelimiter.length)
  advanceBy(context, openDelimiter.length)
  // 原始的内容
  const rawContent =  parseTextData(context, rawContentLength)
  // 去除两边的空格
  const content = rawContent.trim()
  // 继续推进
  advanceBy(context, closeDeimiter.length)
  // context.source = context.source.slice(rawContentLength + closeDeimiter.length)
  
  return {
    type: NodeTypes.INTERPOLATION,
    content: {
      type: NodeTypes.SIMPLE_EXPRESSION,
      content
    }
  }
}

const createParserContext = (content) => {
  console.log('创建一个 parserContext');
  return {
    source: content
  }
}

// 向前推进
const advanceBy = (context, length) => {
  console.log("推进代码", context, length);
  context.source = context.source.slice(length)
}

const createRoot = (children) => {
  return {
    children
  }
}


