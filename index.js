'use strict';
const Queue = require('yocto-queue');


function pLimit(_concurrency) {
	let concurrency = _concurrency
	let activeCount = 0;
	if (!(Number.isInteger(concurrency) && concurrency > 0)) {
		throw new TypeError(`_concurrency type error`)
	}

	const q = new Queue();


	async function enqueue(fnWithArgs, resolve) {
		q.enqueue([fnWithArgs, resolve])

		await Promise.resolve();

		dequeue()
	}

	async function dequeue() {
		if (activeCount < concurrency && q.size > 0) {
			activeCount++;
			const [[promiseFn, fnArgs], resolve] = q.dequeue()
			const result = (async () => promiseFn(...fnArgs))();

			resolve(result);

			try {
				await result
			} catch { }

			activeCount--;

			dequeue()
		}
	}

	const limit = function (promiseFn, ...fnArgs) {
		return new Promise(resolve => {
			enqueue([promiseFn, fnArgs], resolve)
		})
	}

	Object.defineProperty(limit, 'pendingCount', {
		get() {
			return q.size
		}
	})

	Object.defineProperty(limit, 'clearQueue', {
		value: q.clear.bind(q)
	})

	Object.defineProperty(limit, 'activeCount', {
		get() {
			return activeCount
		}
	})

	return limit;
}

module.exports = pLimit;