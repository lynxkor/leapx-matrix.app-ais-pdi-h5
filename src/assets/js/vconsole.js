let clickCount = 0
let lastClickTime = 0

const hasClass = (node, className) => {
  return node.className.match(new RegExp('(\\s|^)' + className + '(\\s|$)'))
}

const addClass = (node, className) => {
  if (className && !hasClass(node, className)) {
    node.className += (node.className ? ' ' : '') + className
  }
}

document.addEventListener('click', (event) => {
  const x = event.clientX
  const y = event.clientY

  // 检查点击是否在右上角200 * 200的区域内
  if (x <= 100 && y <= 100) {
    const currentTime = Date.now()
    const timeDifference = currentTime - lastClickTime

    if (timeDifference > 800) {
      clickCount = 1
      lastClickTime = currentTime
    } else {
      clickCount++
    }

    if (clickCount === 4) {
      console.log('连续点击了4下')
      // 在这里执行你的操作
      clickCount = 0
      lastClickTime = 0 // 重置点击次数和时间
      addClass(document.querySelector('#__vconsole'), 'show')
    }
  } else {
    clickCount = 0
    lastClickTime = 0 // 如果不在区域内，重置点击次数和时间
  }
})
