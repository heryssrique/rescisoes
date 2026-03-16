import { addDays, isWeekend, isSameDay, parseISO, format } from 'date-fns';

const FERIADOS_FIXOS = [
  '01-01', // Ano Novo
  '21-04', // Tiradentes
  '01-05', // Dia do Trabalho
  '07-09', // Independência
  '12-10', // Nossa Sra Aparecida
  '02-11', // Finados
  '15-11', // Proclamação da República
  '20-11', // Consciência Negra
  '25-12', // Natal
];

function getEaster(year) {
  const f = Math.floor,
    G = year % 19,
    C = f(year / 100),
    H = (C - f(C / 4) - f((8 * C + 13) / 25) + 19 * G + 15) % 30,
    I = H - f(H / 28) * (1 - f(29 / (H + 1)) * f((21 - G) / 11)),
    J = (year + f(year / 4) + I + 2 - C + f(C / 4)) % 7,
    L = I - J,
    month = 3 + f((L + 40) / 44),
    day = L + 28 - 31 * f(month / 4);
  return new Date(year, month - 1, day);
}

export function isHoliday(date) {
  const monthDay = format(date, 'dd-MM');
  if (FERIADOS_FIXOS.includes(monthDay)) return true;

  const year = date.getFullYear();
  const easter = getEaster(year);
  
  // Carnaval (47 dias antes da páscoa) - Terça de carnaval
  const carnaval = addDays(easter, -47);
  // Sexta-feira Santa (2 dias antes da páscoa)
  const sextaSanta = addDays(easter, -2);
  // Corpus Christi (60 dias após a páscoa)
  const corpusChristi = addDays(easter, 60);

  if (isSameDay(date, carnaval)) return true;
  if (isSameDay(date, sextaSanta)) return true;
  if (isSameDay(date, corpusChristi)) return true;

  return false;
}

/**
 * Calcula a data de pagamento: conta dias corridos e antecipa se cair em fim de semana ou feriado.
 */
export function getPaymentDate(startDateStr, days) {
  if (!startDateStr) return '';
  let date = addDays(parseISO(startDateStr), parseInt(days));

  // Enquanto for fim de semana ou feriado, antecipa 1 dia
  while (isWeekend(date) || isHoliday(date)) {
    date = addDays(date, -1);
  }

  return format(date, 'yyyy-MM-dd');
}
