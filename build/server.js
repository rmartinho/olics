"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express = require("express");
const rss_to_json_1 = require("rss-to-json");
const ical_generator_1 = require("ical-generator");
const luxon_1 = require("luxon");
const ical_timezones_1 = require("@touch4it/ical-timezones");
const feedUrl = 'https://www.otherland-berlin.de/share/otherland-events.xml';
const app = express();
app.use(express.static('public'));
app.get('/otherland-events.ics', async (_request, response) => {
    try {
        const content = await makeIcs();
        response.set('Content-Type', 'text/calendar');
        response.send(content);
    }
    catch (error) {
        response.send();
    }
});
app.listen(3000, () => {
    console.log('Server is listening on port 3000');
});
async function makeIcs() {
    const rss = await (0, rss_to_json_1.parse)(feedUrl);
    const calendar = (0, ical_generator_1.default)({ name: 'Otherland Events' });
    calendar.timezone({
        name: 'Europe/Berlin',
        generator: ical_timezones_1.getVtimezoneComponent,
    });
    const pattern = /(\d+). ([A-Z][a-zä][a-z]) (\d{4}) \((\d+):(\d+)\) (.*)/;
    rss.items.forEach((it) => {
        const match = it.title.match(pattern);
        if (!match)
            throw `bad match ${it.title}`;
        const year = Number(match[3]);
        const month = {
            Jan: 1,
            Feb: 2,
            Mär: 3,
            Apr: 4,
            Mai: 5,
            Jun: 6,
            Jul: 7,
            Aug: 8,
            Sep: 9,
            Okt: 10,
            Nov: 11,
            Dez: 12,
        }[match[2]];
        if (month == null)
            throw `bad month ${it.title}`;
        const day = Number(match[1]);
        const hour = Number(match[4]);
        const minute = Number(match[5]);
        const start = luxon_1.DateTime.fromObject({ year, month, day, hour, minute }, { zone: 'Europe/Berlin' });
        const summary = match[6];
        calendar.createEvent({
            start,
            summary,
            description: it.description,
            url: it.link,
            timezone: 'Europe/Berlin'
        });
    });
    return calendar.toString();
}
