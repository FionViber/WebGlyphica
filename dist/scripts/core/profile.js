import { EntityFactory } from "./entityFactory.js"

let profilingEnabled = false
let verbose = false
export const profile = {
    start: () => {
        profilingEnabled = true
        for (const [classObject, name] of queuedMembers) {
            startProfiling(classObject, name)
        }
    },

    verbose: () => {
        verbose = true
    },

    print: () => {
        SSj.profiler_print()
    },

    reset: () => {
        SSj.profiler_reset()
    }
}

let profiledMembers = {}
let queuedMembers = []
export function profileMember(classObject, name) {
    if (profilingEnabled && !((classObject.name + name) in profiledMembers)) {
        startProfiling(classObject, name)
    }
    else {
        queuedMembers.push([classObject, name])
    }
}

function startProfiling(classObject, name) {
    if (verbose) {
        console.log(`profiling ${classObject.name} ${name}`)
    }

    if (profiledMembers[classObject.name + name]) {
        return
    }

    profiledMembers[classObject.name + name] = true

    try {
        SSj.profile(classObject.prototype, name)
    }
    catch (e) {
        console.log(`Error profiling ${classObject.name} ${name}: ${e}`)
    }
}