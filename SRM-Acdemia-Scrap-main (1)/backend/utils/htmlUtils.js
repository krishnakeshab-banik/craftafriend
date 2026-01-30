function unescapeHtmlString(str) {
    return str
        .replace(/\\n/g, '\n')
        .replace(/\\r/g, '\r')
        .replace(/\\t/g, '\t')
        .replace(/\\'/g, "'")
        .replace(/\\"/g, '"')
        .replace(/\\\\/g, '\\');
}

function decodeHexSequences(str) {
    return str.replace(/\\x([0-9A-Fa-f]{2})/g, (match, hex) => {
        return String.fromCharCode(parseInt(hex, 16));
    });
}

function resolveHtmlEntities(str) {
    const entities = {
        '&amp;': '&',
        '&lt;': '<',
        '&gt;': '>',
        '&quot;': '"',
        '&#39;': "'",
        '&nbsp;': ' '
    };

    return str.replace(/&[a-z]+;|&#[0-9]+;/gi, (match) => {
        return entities[match] || match;
    });
}

function fetchElementText($html, selectors) {
    const result = {};
    for (const [key, selector] of Object.entries(selectors)) {
        result[key] = $html(selector).text().trim() || '';
    }
    return result;
}

function processCalendarHtml($html) {
    const calendar = {};
    const legend = {};
    let note = '';

    // Extract calendar events
    $html('table.calendar_tbl').each((_, table) => {
        const month = $html(table).find('caption').text().trim();
        if (month) {
            calendar[month] = [];

            $html(table).find('tbody tr').each((_, row) => {
                const cells = $html(row).find('td');
                cells.each((_, cell) => {
                    const $cell = $html(cell);
                    const date = $cell.find('strong').text().trim();
                    const event = $cell.text().replace(date, '').trim();

                    if (date && event) {
                        calendar[month].push({ date, event });
                    }
                });
            });
        }
    });

    // Extract legend
    $html('table.legend_tbl tr').each((_, row) => {
        const cells = $html(row).find('td');
        if (cells.length === 2) {
            const key = $html(cells[0]).text().trim();
            const value = $html(cells[1]).text().trim();
            if (key && value) {
                legend[key] = value;
            }
        }
    });

    // Extract note
    note = $html('div.note, p.note').text().trim();

    return { calendar, legend, note };
}

module.exports = {
    unescapeHtmlString,
    decodeHexSequences,
    resolveHtmlEntities,
    fetchElementText,
    processCalendarHtml
};
