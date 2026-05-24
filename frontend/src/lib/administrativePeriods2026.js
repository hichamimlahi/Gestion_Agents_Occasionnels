const PERIOD_DEFINITIONS_2026 = [
  {
    id: 'PERIODE_1_2026',
    seasonLabel: 'Période 1 : Janvier, Février, Mars',
    labelKey: 'application_form.periods.labels.p1',
    start: '2026-01-01',
    end: '2026-03-31',
  },
  {
    id: 'PERIODE_2_2026',
    seasonLabel: 'Période 2 : Avril, Mai, Juin',
    labelKey: 'application_form.periods.labels.p2',
    start: '2026-04-01',
    end: '2026-06-30',
  },
  {
    id: 'PERIODE_3_2026',
    seasonLabel: 'Période 3 : Juillet, Août, Septembre',
    labelKey: 'application_form.periods.labels.p3',
    start: '2026-07-01',
    end: '2026-09-30',
  },
  {
    id: 'PERIODE_4_2026',
    seasonLabel: 'Période 4 : Octobre, Novembre, Décembre',
    labelKey: 'application_form.periods.labels.p4',
    start: '2026-10-01',
    end: '2026-12-31',
  },
]

const HOLIDAYS_2026 = [
  { date: '2026-01-01', labelKey: 'application_form.periods.holidays.new_year' },
  { date: '2026-01-14', labelKey: 'application_form.periods.holidays.amazigh_new_year' },
  { date: '2026-03-20', labelKey: 'application_form.periods.holidays.eid_fitr_day_1' },
  { date: '2026-03-21', labelKey: 'application_form.periods.holidays.eid_fitr_day_2' },
  { date: '2026-05-01', labelKey: 'application_form.periods.holidays.labour_day' },
  { date: '2026-05-27', labelKey: 'application_form.periods.holidays.eid_adha_day_1' },
  { date: '2026-05-28', labelKey: 'application_form.periods.holidays.eid_adha_day_2' },
  { date: '2026-06-17', labelKey: 'application_form.periods.holidays.hijri_new_year' },
  { date: '2026-07-30', labelKey: 'application_form.periods.holidays.throne_day' },
  { date: '2026-08-14', labelKey: 'application_form.periods.holidays.oued_eddahab' },
  { date: '2026-08-20', labelKey: 'application_form.periods.holidays.king_revolution' },
  { date: '2026-08-21', labelKey: 'application_form.periods.holidays.youth_day' },
  { date: '2026-08-25', labelKey: 'application_form.periods.holidays.mawlid' },
  { date: '2026-11-06', labelKey: 'application_form.periods.holidays.green_march' },
  { date: '2026-11-18', labelKey: 'application_form.periods.holidays.independence_day' },
]

function toUtcDate(isoDate) {
  return new Date(`${isoDate}T00:00:00Z`)
}

function formatIsoDate(utcDate) {
  return utcDate.toISOString().slice(0, 10)
}

function isWeekend(utcDate) {
  const day = utcDate.getUTCDay()
  return day === 0 || day === 6
}

function formatDisplayDate(isoDate) {
  const [year, month, day] = isoDate.split('-')
  return `${day}/${month}/${year}`
}

function calculateWorkingDays(period, holidaysByDate, t) {
  const start = toUtcDate(period.start)
  const end = toUtcDate(period.end)
  const removedHolidays = []
  const weekendHolidayOverlaps = []
  let workedDays = 0

  for (let current = new Date(start.getTime()); current <= end; current.setUTCDate(current.getUTCDate() + 1)) {
    const iso = formatIsoDate(current)
    const holiday = holidaysByDate.get(iso)
    const weekend = isWeekend(current)

    if (weekend) {
      if (holiday) {
        weekendHolidayOverlaps.push({
          date: iso,
          dateDisplay: formatDisplayDate(iso),
          label: t(holiday.labelKey),
        })
      }
      continue
    }

    if (holiday) {
      removedHolidays.push({
        date: iso,
        dateDisplay: formatDisplayDate(iso),
        label: t(holiday.labelKey),
      })
      continue
    }

    workedDays += 1
  }

  return { workedDays, removedHolidays, weekendHolidayOverlaps }
}

export function getAdministrativePeriods2026(t) {
  const holidaysByDate = new Map(HOLIDAYS_2026.map((holiday) => [holiday.date, holiday]))

  return PERIOD_DEFINITIONS_2026.map((period) => {
    const computed = calculateWorkingDays(period, holidaysByDate, t)

    return {
      ...period,
      label: t(period.labelKey),
      startDisplay: formatDisplayDate(period.start),
      endDisplay: formatDisplayDate(period.end),
      workedDays: computed.workedDays,
      removedHolidays: computed.removedHolidays,
      weekendHolidayOverlaps: computed.weekendHolidayOverlaps,
    }
  })
}
