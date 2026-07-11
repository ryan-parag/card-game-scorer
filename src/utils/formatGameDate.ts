import moment from 'moment';

/**
 * Returns a relative date (eg. "3 days ago") for dates within the last week,
 * and an absolute "MMM D" date (eg. "Jul 11") for anything older.
 */
export function formatGameDate(date: moment.MomentInput): string {
  const momentDate = moment(date);
  return moment().diff(momentDate, 'days') > 7
    ? momentDate.format('MMM D')
    : momentDate.fromNow();
}
