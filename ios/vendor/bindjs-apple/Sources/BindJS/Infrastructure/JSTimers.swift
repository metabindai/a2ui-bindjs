//
//  JSTimers.swift
//  JavaScriptCore Timer Bridge
//
//  Provides: setTimeout, clearTimeout, setInterval, clearInterval, sleep(ms)
//
import Foundation
import JavaScriptCore

final class JSTimers {

    private var timers: [Int: Timer] = [:]
    private var nextId: Int = 0

    // Install all timer functions into a JSContext.
    func install(in context: JSContext) {

        // MARK: setTimeout(callback, delay)
        let setTimeout: @convention(block) (JSValue, Double) -> Int = { [weak self] callback, delay in
            guard let self = self else { return 0 }

            self.nextId += 1
            let id = self.nextId

            let timer = Timer.scheduledTimer(withTimeInterval: delay / 1000.0, repeats: false) { _ in
                callback.call(withArguments: [])
                self.timers.removeValue(forKey: id)
            }

            self.timers[id] = timer
            return id
        }

        context.setObject(setTimeout, forKeyedSubscript: "setTimeout" as NSString)


        // MARK: clearTimeout(id)
        let clearTimeout: @convention(block) (Int) -> Void = { [weak self] id in
            guard let self = self else { return }
            self.timers[id]?.invalidate()
            self.timers.removeValue(forKey: id)
        }

        context.setObject(clearTimeout, forKeyedSubscript: "clearTimeout" as NSString)


        // MARK: setInterval(callback, delay)
        let setInterval: @convention(block) (JSValue, Double) -> Int = { [weak self] callback, delay in
            guard let self = self else { return 0 }

            self.nextId += 1
            let id = self.nextId

            let timer = Timer.scheduledTimer(withTimeInterval: delay / 1000.0, repeats: true) { _ in
                callback.call(withArguments: [])
            }

            self.timers[id] = timer
            return id
        }

        context.setObject(setInterval, forKeyedSubscript: "setInterval" as NSString)


        // MARK: clearInterval(id)
        context.setObject(clearTimeout, forKeyedSubscript: "clearInterval" as NSString)


        // MARK: sleep(ms) — async via Promises
        // JS: await sleep(1000)
        let sleepAsync: @convention(block) (Double, JSValue) -> Void = { ms, callback in
            DispatchQueue.main.asyncAfter(deadline: .now() + ms / 1000.0) {
                callback.call(withArguments: [])
            }
        }

        context.setObject(sleepAsync, forKeyedSubscript: "sleepAsync" as NSString)


        // Provide a Promise-friendly sleep() wrapper
        let sleepFn: @convention(block) (Double) -> JSValue = { ms in
            let promiseConstructor = context.globalObject.forProperty("Promise")!
            let resolver: @convention(block) (JSValue, JSValue) -> Void = { resolve, _ in
                sleepAsync(ms, resolve)
            }
            return promiseConstructor.construct(withArguments: [resolver])
        }

        context.setObject(sleepFn, forKeyedSubscript: "sleep" as NSString)
    }
}
