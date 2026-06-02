import { format, parseISO } from 'date-fns';

export const today = () => format(new Date(), 'yyyy-MM-dd');

export const formatShort = (date: string) =>
  format(parseISO(date), 'MMM d');
