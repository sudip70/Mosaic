import { format, parseISO, isToday } from 'date-fns';

export const today = () => format(new Date(), 'yyyy-MM-dd');

export const formatDisplay = (date: string) =>
  format(parseISO(date), 'MMMM d, yyyy');

export const formatShort = (date: string) =>
  format(parseISO(date), 'MMM d');

export const isTodayDate = (date: string) => isToday(parseISO(date));
