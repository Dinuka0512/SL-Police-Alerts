import { useSyncExternalStore } from 'react';

export type Penalty = {
  id: string;
  code: string;
  violation: string;
  fee: string;
  vehicle: string;
  nic: string;
  location: string;
  date: string;
};

const INITIAL_PENALTIES: Penalty[] = [
  {
    id: '1',
    code: 'A-101',
    violation: 'Speeding (exceeding limit)',
    fee: 'LKR 30,000',
    vehicle: 'CAB-1234',
    nic: '901234567V',
    location: 'Galle Road, Bambalapitiya',
    date: '2026-09-12',
  },
  {
    id: '2',
    code: 'B-115',
    violation: 'Driving under the influence',
    fee: 'LKR 50,000',
    vehicle: 'KBC-7788',
    nic: '871122334V',
    location: 'Kandy Road, Kadawatha',
    date: '2026-09-11',
  },
  {
    id: '3',
    code: 'C-402',
    violation: 'Ignoring traffic signals',
    fee: 'LKR 15,000',
    vehicle: 'PBB-5566',
    nic: '950050667V',
    location: 'Marine Drive, Colombo 03',
    date: '2026-09-10',
  },
];

let penalties: Penalty[] = INITIAL_PENALTIES;
const listeners = new Set<() => void>();

function getSnapshot(): Penalty[] {
  return penalties;
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function usePenalties(): Penalty[] {
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}

export function addPenalty(penalty: Penalty): void {
  penalties = [penalty, ...penalties];
  listeners.forEach(listener => listener());
}