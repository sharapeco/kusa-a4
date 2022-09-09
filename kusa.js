const weekDayLabelWidth = 20
const textOffsetY = 8

function h(tag, attrs, children) {
	const el = document.createElement(tag)
	Object.keys(attrs).forEach(key => {
		el.setAttribute(key, attrs[key])
	})
	children = Array.isArray(children) ? children : [children]
	children.filter(c => c != null).forEach(child => {
		if (typeof child !== 'object') {
			child = document.createTextNode(child)
		}
		el.appendChild(child)
	})
	return el
}

/**
 *
 * @param {number} min
 * @param {number} max
 * @param {number} step
 * @returns {number[]}
 */
function range(min, max, step = 1) {
	const r = []
	for (i = min; i <= max; i += step) {
		r.push(i)
	}
	return r
}

function prevDay(date) {
	return new Date(date.getFullYear(), date.getMonth(), date.getDate() - 1)
}

function nextDay(date) {
	return new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1)
}

function nextMonthFirst(date) {
	return new Date(date.getFullYear(), date.getMonth() + 1, 1)
}

function nextYear(date) {
	return new Date(date.getFullYear() + 1, date.getMonth(), date.getDate())
}

function shortWeekday(date) {
	const keys = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat']
	return keys[date.getDay()]
}

function normalizedDate(date) {
	return [
		date.getFullYear(),
		String(date.getMonth() + 1).padStart(2, '0'),
		String(date.getDate()).padStart(2, '0'),
	].join('-')
}

function buildWeeks(begin) {
	const weeks = []
	const emptyCol = {
		str: '',
		num: '',
		class: '',
	}

	let week = range(0, begin.getDay() - 1).map(_ => emptyCol)
	const end = nextMonth(begin)
	for (let date = begin; date < end; date = nextDay(date)) {
		week.push({
			str: normalizedDate(date),
			num: date.getDate(),
			class: shortWeekday(date)
		})
		if (week.length >= 7) {
			weeks.push(week)
			week = []
		}
	}
	if (week.length > 0) {
		while (week.length < 7) {
			week.push(emptyCol)
		}
		weeks.push(week)
	}
	return weeks
}

/**
 *
 * @param {Date} begin
 * @returns
 */
function renderKusa(begin) {
	const days = (nextYear(begin).getTime() - begin.getTime()) / (1000 * 60 * 60 * 24)
	const rest = days - (7 * 52) + begin.getDay()

	const root = document.createDocumentFragment()

	root.appendChild(
		h('header', { class: 'header' }, [
			h('h1', { class: 'title' }, [
				h('span', {}, ['Activity of']),
				h('span', { class: 'input' }, []),
			]),
			h('p', { class: 'start-date' }, ['since '.concat(formatDate(begin))]),
		])
	)

	const scale = 2.5
	root.appendChild(
		h('svg', { class: 'field', width: (405 + weekDayLabelWidth) * scale, height: 255 * scale }, [
			h('g', { transform: `scale(${scale})` }, [
			// 1段目
			h('g', {}, [
				h('text', { x: 0, y: 30 + textOffsetY }, ['Mon']),
				h('text', { x: 0, y: 60 + textOffsetY }, ['Wed']),
				h('text', { x: 0, y: 90 + textOffsetY }, ['Fri']),
			]),
			// 2段目
			h('g', { transform: 'translate(0, 135)' }, [
				h('text', { x: 0, y: 30 + textOffsetY }, ['Mon']),
				h('text', { x: 0, y: 60 + textOffsetY }, ['Wed']),
				h('text', { x: 0, y: 90 + textOffsetY }, ['Fri']),
			]),
			// 最初の週
			h('g', {}, range(0, 6).slice(begin.getDay()).map((y) => createRect(0, 0, y))),
			// 51週間は固定
			...range(1, 26).map((x) =>
				h('g', {}, range(0, 6).map((y) => createRect(0, x, y)))
			),
			...range(0, 24).map((x) =>
				h('g', {}, range(0, 6).map((y) => createRect(1, x, y)))
			),
			// 最後の週
			h('g', {}, range(0, 6).slice(0, Math.min(7, rest)).map((y) => createRect(1, 25, y))),
			(rest > 7) ? h('g', {}, range(0, rest - 8).map((y) => createRect(1, 26, y))) : null,
			// 月ラベル
			h('g', {}, getMonthLabels(begin, rest > 7 ? 54 : 53).map((ml) => {
				const dan = Math.floor(ml.x / 27)
				const lx = ml.x - 27 * dan
				return h('text', {
					x: weekDayLabelWidth + 15 * lx,
					y: 15 * 9 * dan + textOffsetY,
				}, [ml.label])
			}))
		])
		])
	)

	return root
}

/**
 *
 * @param {number} dan
 * @param {number} x
 * @param {number} y
 * @returns {SVGRectElement}
 */
function createRect(dan, x, y) {
	return h('rect', {
		class: 'kusa',
		width: 11,
		height: 11,
		x: weekDayLabelWidth + 15 * x,
		y: 15 * (1 + y + 9 * dan),
		rx: 2,
		ry: 2,
	})
}

/**
 * @type {Object} Label
 * @property {number} x
 * @property {string} label
 */

/**
 *
 * @param {Date} begin
 * @param {number} weeks
 * @returns {Label[]}
 */
function getMonthLabels(begin, weeks) {
	const labels = []

	let friday = new Date(begin.getFullYear(), begin.getMonth(), begin.getDate() - begin.getDay() + 6)
	let prev = null
	for (let x = 0; x < weeks; x++) {
		const month = monthName(friday.getMonth())
		if (month !== prev) {
			labels.push({
				x,
				label: month
			})
		}

		friday = new Date(friday.getFullYear(), friday.getMonth(), friday.getDate() + 7)
		prev = month
	}

	if (labels.length >= 2 && labels[1].x - labels[0].x < 2) {
		labels.shift()
	}

	return labels
}

function monthName(m) {
	return ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][m]
}

function formatDate(date) {
	return [
		date.getDate(),
		['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'][date.getMonth()],
		date.getFullYear(),
	].join(' ')
}