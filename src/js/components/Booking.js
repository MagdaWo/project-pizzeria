import { select, templates, settings, classNames } from '../settings.js';
import utils from '../utils.js';
import AmountWidget from './AmountWidget.js';
import DatePicker from './DatePicker.js';
import HourPicker from './HourPicker.js';

class Booking {
    constructor(wrapper) {
        const thisBooking = this;

        thisBooking.selectedTable = null;

        thisBooking.render(wrapper);
        thisBooking.initWidgets();
        thisBooking.getData();
    }

    getData() {
        const thisBooking = this;

        const startDateParam = settings.db.dateStartParamKey + '=' + utils.dateToStr(thisBooking.datePicker.minDate);
        const endDateParam = settings.db.dateEndParamKey + '=' + utils.dateToStr(thisBooking.datePicker.maxDate);

        const params = {
            booking: [startDateParam, endDateParam],
            eventsCurrent: [settings.db.notRepeatParam, startDateParam, endDateParam],
            eventsRepeat: [settings.db.repeatParam, endDateParam],
        };

        const urls = {
            booking: settings.db.url + '/' + settings.db.bookings + '?' + params.booking.join('&'),
            eventsCurrent: settings.db.url + '/' + settings.db.events + '?' + params.eventsCurrent.join('&'),
            eventsRepeat: settings.db.url + '/' + settings.db.events + '?' + params.eventsRepeat.join('&'),
        };

        Promise.all([
                fetch(urls.booking),
                fetch(urls.eventsCurrent),
                fetch(urls.eventsRepeat),
            ])
            .then(responses => Promise.all(responses.map(res => res.json())))
            .then(([bookings, eventsCurrent, eventsRepeat]) => {
                thisBooking.parseData(bookings, eventsCurrent, eventsRepeat);
            })
            .catch(err => {
                console.error('Error loading booking data:', err);
            });
    }

    parseData(bookings, eventsCurrent, eventsRepeat) {
        const thisBooking = this;

        thisBooking.booked = {};

        for (let item of bookings) {
            thisBooking.makeBooked(item.date, item.hour, item.duration, item.table);
        }
        for (let item of eventsCurrent) {
            thisBooking.makeBooked(item.date, item.hour, item.duration, item.table);
        }

        const minDate = thisBooking.datePicker.minDate;
        const maxDate = thisBooking.datePicker.maxDate;

        for (let item of eventsRepeat) {
            if (item.repeat === 'daily') {
                for (let loopDate = minDate; loopDate <= maxDate; loopDate = utils.addDays(loopDate, 1)) {
                    thisBooking.makeBooked(utils.dateToStr(loopDate), item.hour, item.duration, item.table);
                }
            }
        }

        thisBooking.updateDOM();
    }

    makeBooked(date, hour, duration, table) {
        const thisBooking = this;

        if (!thisBooking.booked[date]) {
            thisBooking.booked[date] = {};
        }

        const startHour = utils.hourToNumber(hour);

        for (let hourBlock = startHour; hourBlock < startHour + duration; hourBlock += 0.5) {
            if (!thisBooking.booked[date][hourBlock]) {
                thisBooking.booked[date][hourBlock] = [];
            }
            thisBooking.booked[date][hourBlock].push(table);
        }
    }

    updateDOM() {
        const thisBooking = this;

        thisBooking.date = thisBooking.datePicker.value;
        thisBooking.hour = utils.hourToNumber(thisBooking.hourPicker.value);

        let allAvailable = false;

        if (!thisBooking.booked[thisBooking.date] || !thisBooking.booked[thisBooking.date][thisBooking.hour]) {
            allAvailable = true;
        }

        for (let table of thisBooking.dom.tables) {
            const tableId = parseInt(table.getAttribute(settings.booking.tableIdAttribute));

            if (!allAvailable && thisBooking.booked[thisBooking.date][thisBooking.hour].includes(tableId)) {
                table.classList.add(classNames.booking.tableBooked);
            } else {
                table.classList.remove(classNames.booking.tableBooked);
            }
        }

        if (thisBooking.selectedTable) {
            if (!thisBooking.dom.floor.contains(thisBooking.selectedTable) ||
                thisBooking.selectedTable.classList.contains(classNames.booking.tableBooked)
            ) {
                thisBooking.selectedTable.classList.remove(classNames.booking.tableSelected);
                thisBooking.selectedTable = null;
            }
        }
    }

    initTables(event) {
        console.log('Clicked in floor plan', event.target);
        const thisBooking = this;
        const clickedElement = event.target.closest(`.${classNames.booking.table}`);

        if (!clickedElement) return;

        if (clickedElement.classList.contains(classNames.booking.tableBooked)) {
            alert('Ten stolik jest już zarezerwowany!');
            return;
        }

        if (clickedElement.classList.contains(classNames.booking.tableSelected)) {
            clickedElement.classList.remove(classNames.booking.tableSelected);
            thisBooking.selectedTable = null;
            return;
        }

        const previous = thisBooking.dom.floor.querySelector(`.${classNames.booking.tableSelected}`);
        if (previous) previous.classList.remove(classNames.booking.tableSelected);

        clickedElement.classList.add(classNames.booking.tableSelected);
        thisBooking.selectedTable = clickedElement;
    }
    sendBooking() {
        const thisBooking = this;

        const tableId = thisBooking.selectedTable ?
            parseInt(thisBooking.selectedTable.getAttribute(settings.booking.tableIdAttribute)) :
            null;

        const payload = {
            date: thisBooking.datePicker.value,
            hour: thisBooking.hourPicker.value,
            table: tableId,
            duration: parseInt(thisBooking.hoursAmount.value),
            ppl: parseInt(thisBooking.peopleAmount.value),
            starters: [],
            phone: thisBooking.dom.wrapper.querySelector('[name="phone"]').value,
            address: thisBooking.dom.wrapper.querySelector('[name="address"]').value,
        };

        const startersInputs = thisBooking.dom.wrapper.querySelectorAll('[name="starter"]:checked');
        for (let input of startersInputs) {
            payload.starters.push(input.value);
        }

        const options = {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload),
        };

        fetch(`${settings.db.url}/${settings.db.bookings}`, options)
            .then(response => {
                if (!response.ok) {
                    throw new Error('Failed to send booking');
                }
                return response.json();
            })
            .then(() => {
                thisBooking.makeBooked(payload.date, payload.hour, payload.duration, payload.table);
                thisBooking.updateDOM();

                alert('Rezerwacja została potwierdzona!');
            })
            .catch(err => {
                console.error('Błąd podczas rezerwacji:', err);
                alert('Nie udało się zarezerwować stolika. Spróbuj ponownie.');
            });
    }

    render(element) {
        const thisBooking = this;

        const generatedHTML = templates.bookingWidget();
        thisBooking.dom = {};
        thisBooking.dom.wrapper = element;
        thisBooking.dom.wrapper.innerHTML = generatedHTML;

        thisBooking.dom.peopleAmount = thisBooking.dom.wrapper.querySelector(select.booking.peopleAmount);
        thisBooking.dom.hoursAmount = thisBooking.dom.wrapper.querySelector(select.booking.hoursAmount);
        thisBooking.dom.datePicker = thisBooking.dom.wrapper.querySelector(select.widgets.datePicker.wrapper);
        thisBooking.dom.hourPicker = thisBooking.dom.wrapper.querySelector(select.widgets.hourPicker.wrapper);
        thisBooking.dom.tables = thisBooking.dom.wrapper.querySelectorAll(select.booking.tables);
        thisBooking.dom.floor = thisBooking.dom.wrapper.querySelector(select.booking.floor);
    }

    initWidgets() {
        const thisBooking = this;

        thisBooking.peopleAmount = new AmountWidget(thisBooking.dom.peopleAmount);
        thisBooking.hoursAmount = new AmountWidget(thisBooking.dom.hoursAmount);
        thisBooking.datePicker = new DatePicker(thisBooking.dom.datePicker);
        thisBooking.hourPicker = new HourPicker(thisBooking.dom.hourPicker);

        thisBooking.dom.wrapper.addEventListener('updated', function() {
            thisBooking.updateDOM();
        });

        thisBooking.dom.floor.addEventListener('click', function(event) {
            thisBooking.initTables(event);
        });

        thisBooking.dom.wrapper.querySelector('.booking-form').addEventListener('submit', function(event) {
            event.preventDefault();
            thisBooking.sendBooking();
        });

        console.log('[booking] tables:', thisBooking.dom.tables);
    }
}

export default Booking;