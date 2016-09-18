export function mode(array) {
  if (array.length == 0) {
    return null
  }
  const modeMap = {}
  let maxEl = array[0]
  let maxCount = 1
  array.forEach(x => {
    if (modeMap[x] == null) {
      modeMap[x] = 1
    } else {
      modeMap[x]++
    }
    if (modeMap[x] > maxCount) {
      maxEl = x
      maxCount = modeMap[x]
    }
  })
  return maxEl
}

export function timeout(delay){
  return new Promise((resolve, reject) => {
    setTimeout(resolve, delay)
  })
}
