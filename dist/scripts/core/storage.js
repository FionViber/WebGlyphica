const hashSize = 4
export function mangleData(jsonData, key) {
    const jsonString = JSON.stringify(jsonData)

    let byteArray = new Uint8Array(jsonString.length + hashSize)

    for (let i = hashSize; i < byteArray.length; i++) {
        byteArray[i] = jsonString.charCodeAt(i - hashSize) ^ key
    }

    addHash(byteArray)

    return byteArray;
}

export function demangle(byteArray, key) {
    const view = new DataView(byteArray.buffer)
    const littleEndian = true
    const storedHash = view.getInt32(0, littleEndian)

    let hash = hashByteArray(byteArray);
    if (storedHash !== hash) {
        return undefined
    }

    let decipheredString = ''
    for (let i = hashSize; i < byteArray.length; i++) {
        decipheredString += String.fromCharCode(byteArray[i] ^ key)
    }

    try {
        return JSON.parse(decipheredString);
    } catch (e) {
        console.error("Error parsing JSON:", e)
        return undefined;
    }
}

function hashByteArray(byteArray) {
    let hash = 5381;
    for (let i = hashSize; i < byteArray.length; i++) {
        hash = ((hash << 5) + hash) + byteArray[i]
        hash = hash & hash
    }
    return hash;
}

function addHash(byteArray) {
    const hash = hashByteArray(byteArray)
    const view = new DataView(byteArray.buffer)
    const littleEndian = true
    view.setUint32(0, hash, littleEndian)
}

export function testUsage() {
    const key = 123
    let byteArray = mangleData({ foo: "bar" }, key)

    FS.writeFile("~/test.txt", byteArray);
    const content = FS.readFile("~/test.txt", DataType.Bytes)

    console.log(JSON.stringify(demangle(content, key)))
}