export class Callback
{
    constructor()
    {
        this.callbacks = {}
        this.steamAPICallbacks = {}
    }

    addCallback(callbackName)
    {
        if (!(callbackName in this.callbacks))
            this.callbacks[callbackName] = []
    }

    addListener(callbackName, callbackFunc)
    {
        if (!(callbackName in this.callbacks))
            this.addCallback(callbackName)

        this.callbacks[callbackName].push(callbackFunc)
    }

    removeListener(callbackName, callbackFunc)
    {
        if (!(callbackName in this.callbacks))
            return

        let cb = this.callbacks[callbackName]
        let index = cb.indexOf(callbackFunc)
        if (index >= 0)
        {
            cb[index] = cb[cb.length - 1]
            cb.pop()
        }
    }

    steamAPI(callID)
    {
        if (!(callID in this.steamAPICallbacks))
        {
            let resolver
            let promise = new Promise(resolve => {
                resolver = resolve
            })
            this.steamAPICallbacks[callID] = [promise, resolver]
        }
        return this.steamAPICallbacks[callID][0]
    }

    triggerCallback(callbackName, result = null)
    {
        if (!(callbackName in this.callbacks))
            this.addCallback(callbackName)

        this.callbacks[callbackName].forEach(cb => cb(result))
    }

    triggerSteamAPICallback(callID, result = null)
    {
        if (callID in this.steamAPICallbacks)
        {
            this.steamAPICallbacks[callID][1](result)
            delete this.steamAPICallbacks[callID]
        }
    }
}