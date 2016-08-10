function mode(array) {
    if (array.length == 0) {
    	return null
    }
    let modeMap = {}
    let maxEl = array[0], maxCount = 1;
    array.forEach(x => {
    	if(modeMap[x] == null) {
    		modeMap[x] = 1
        }
    	else {
    		modeMap[x]++;	
        }
    	if(modeMap[x] > maxCount){
    		maxEl = x
    		maxCount = modeMap[x]
    	}
    })
    return maxEl
}


export { mode }