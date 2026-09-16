import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
} from "react";

import { departmentService, userService, messageService } from "~/services";

import {
  departmentFromDTO,
  userFromDTO,
  alertFromDTO,
  toCreateDepartmentDTO,
  toCreateUserDTO,
  toUpdateUserDTO,
  toCreateMessageDTO,
} from "~/dto/mappers";

import type {
  Department,
  User,
  Alert,
  DeptStatus,
  UserRole,
  UserStatus,
  AlertPriority,
  AlertStatus,
  DeliveryStatus,
  CreateDepartmentInput,
  UpdateDepartmentInput,
  CreateUserInput,
  UpdateUserInput,
  CreateAlertInput,
} from "~/types";

// Re-export types so existing page imports keep working.
export type {
  Department,
  User,
  Alert,
  AlertDeptDelivery,
  DeptStatus,
  UserStatus,
  UserRole,
  AlertPriority,
  AlertStatus,
  DeliveryStatus,
} from "~/types";

// ===== SEED DATA (offline fallback) =====
const SEED_DEPARTMENTS: Department[] = [
  { id: "d1", name: "Colombo Police Division", code: "CPD", description: "Main police division covering Colombo district and surrounding areas.", status: "Active", createdAt: "2024-01-15", userCount: 0 },
  { id: "d2", name: "Traffic Police Division", code: "TPD", description: "Responsible for traffic regulation and road safety enforcement.", status: "Active", createdAt: "2024-01-15", userCount: 0 },
  { id: "d3", name: "Criminal Investigation Department", code: "CID", description: "Handles serious criminal investigations and intelligence gathering.", status: "Active", createdAt: "2024-01-20", userCount: 0 },
  { id: "d4", name: "Police Emergency Division", code: "PED", description: "Rapid response unit for emergency situations and critical incidents.", status: "Active", createdAt: "2024-02-01", userCount: 0 },
  { id: "d5", name: "Special Task Force", code: "STF", description: "Elite counter-terrorism and special operations unit.", status: "Active", createdAt: "2024-02-10", userCount: 0 },
  { id: "d6", name: "Women and Children Bureau", code: "WCB", description: "Specialized unit handling cases involving women and children.", status: "Active", createdAt: "2024-02-15", userCount: 0 },
];

const SEED_USERS: User[] = [
  { id: "u1", fullName: "Sunil Perera", email: "sunil.perera@police.lk", phone: "+94 71 234 5678", departmentId: "d1", role: "Admin", status: "Active", createdAt: "2024-01-20", lastActive: "2026-09-12" },
  { id: "u2", fullName: "Amara Silva", email: "amara.silva@police.lk", phone: "+94 77 345 6789", departmentId: "d2", role: "Police Officer", status: "Active", createdAt: "2024-02-10", lastActive: "2026-09-11" },
  { id: "u3", fullName: "Kamal Fernando", email: "kamal.fernando@police.lk", phone: "+94 76 456 7890", departmentId: "d3", role: "Department Officer", status: "Active", createdAt: "2024-02-15", lastActive: "2026-09-10" },
  { id: "u4", fullName: "Nimal Wickramasinghe", email: "nimal.w@police.lk", phone: "+94 70 567 8901", departmentId: "d4", role: "Police Officer", status: "Inactive", createdAt: "2024-03-01", lastActive: "2026-08-01" },
  { id: "u5", fullName: "Dilani Jayasuriya", email: "dilani.j@police.lk", phone: "+94 75 678 9012", departmentId: "d5", role: "Department Officer", status: "Active", createdAt: "2024-03-10", lastActive: "2026-09-12" },
  { id: "u6", fullName: "Priyanka Ranasinghe", email: "priyanka.r@police.lk", phone: "+94 71 789 0123", departmentId: "d6", role: "Police Officer", status: "Active", createdAt: "2024-03-15", lastActive: "2026-09-09" },
  { id: "u7", fullName: "Chamara Bandara", email: "chamara.b@police.lk", phone: "+94 77 890 1234", departmentId: "d1", role: "Police Officer", status: "Active", createdAt: "2024-04-01", lastActive: "2026-09-12" },
  { id: "u8", fullName: "Iresha Kumari", email: "iresha.k@police.lk", phone: "+94 76 901 2345", departmentId: "d2", role: "Department Officer", status: "Inactive", createdAt: "2024-04-10", lastActive: "2026-07-15" },
];

const SEED_ALERTS: Alert[] = [
  {
    id: "a1", title: "Major Road Accident — Galle Road", description: "Multiple vehicle collision reported near Wellawatte junction. Casualties reported. Officers requested to respond immediately and manage traffic diversion.", priority: "Critical", status: "Delivered", imageUrl: null, sentBy: "Sunil Perera",
    departments: [{ departmentId: "d2", status: "Delivered" }, { departmentId: "d4", status: "Delivered" }],
    createdAt: "2026-09-12T08:30:00"
  },
  {
    id: "a2", title: "Armed Robbery — Colombo Fort", description: "Armed robbery reported at a bank in Colombo Fort area. Suspects believed to be armed and dangerous. Immediate response required.", priority: "Critical", status: "Delivered", imageUrl: null, sentBy: "Sunil Perera",
    departments: [{ departmentId: "d1", status: "Delivered" }, { departmentId: "d3", status: "Delivered" }, { departmentId: "d5", status: "Delivered" }],
    createdAt: "2026-09-12T06:15:00"
  },
  {
    id: "a3", title: "Flood Warning — Kelani River", description: "Rising water levels in Kelani River. Residential areas along the banks to be evacuated. All available units to assist in evacuation efforts.", priority: "High", status: "Delivered", imageUrl: null, sentBy: "Sunil Perera",
    departments: [{ departmentId: "d1", status: "Delivered" }, { departmentId: "d4", status: "Delivered" }],
    createdAt: "2026-09-11T20:00:00"
  },
  {
    id: "a4", title: "Missing Child Alert — Nugegoda", description: "8-year-old child reported missing in Nugegoda area. Last seen wearing red shirt and blue shorts near the local park.", priority: "High", status: "Delivered", imageUrl: null, sentBy: "Sunil Perera",
    departments: [{ departmentId: "d6", status: "Delivered" }, { departmentId: "d1", status: "Pending" }],
    createdAt: "2026-09-11T15:30:00"
  },
  {
    id: "a5", title: "Drug Raid Operation — Wellawatte", description: "Intelligence report confirmed drug trafficking operation. All CID officers to coordinate for the scheduled operation at 22:00 hrs.", priority: "Medium", status: "Delivered", imageUrl: null, sentBy: "Sunil Perera",
    departments: [{ departmentId: "d3", status: "Delivered" }, { departmentId: "d5", status: "Delivered" }],
    createdAt: "2026-09-10T18:00:00"
  },
  {
    id: "a6", title: "Road Safety Campaign — A1 Highway", description: "Scheduled road safety awareness campaign on A1 Highway. Traffic police to be deployed at designated checkpoints from 08:00 to 18:00.", priority: "Low", status: "Delivered", imageUrl: null, sentBy: "Sunil Perera",
    departments: [{ departmentId: "d2", status: "Delivered" }],
    createdAt: "2026-09-09T07:00:00"
  },
];

// ===== CONTEXT =====
interface AppContextType {
  departments: Department[];
  users: User[];
  alerts: Alert[];
  loading: boolean;
  connected: boolean;
  addDepartment: (data: CreateDepartmentInput) => Promise<void>;
  updateDepartment: (id: string, data: UpdateDepartmentInput) => Promise<void>;
  deleteDepartment: (id: string) => Promise<void>;
  addUser: (input: CreateUserInput) => Promise<void>;
  updateUser: (id: string, data: UpdateUserInput) => Promise<void>;
  deleteUser: (id: string) => Promise<void>;
  addAlert: (data: CreateAlertInput) => Promise<void>;
  deleteAlert: (id: string) => Promise<void>;
  getDepartmentById: (id: string) => Department | undefined;
  getUserById: (id: string) => User | undefined;
  getAlertById: (id: string) => Alert | undefined;
}

const AppContext = createContext<AppContextType | null>(null);

function computeUserCounts(depts: Department[], users: User[]): Department[] {
  return depts.map(d => ({
    ...d,
    userCount: users.filter(u => u.departmentId === d.id).length,
  }));
}

function toDeptIdMap(depts: Department[]): Map<string, string> {
  return new Map(depts.map(d => [d.name, d.id]));
}

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [rawDepts, setRawDepts] = useState<Department[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [connected, setConnected] = useState(true);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function loadAll() {
      try {
        const [deptDtos, userDtos, messageDtos] = await Promise.all([
          departmentService.findAll(),
          userService.findAll(),
          messageService.findAll(),
        ]);

        const nameToId = new Map<string, string>();
        deptDtos.forEach(d => nameToId.set(d.name, String(d.d_id)));

        const loadedUsers = userDtos.map(u => userFromDTO(u, nameToId));
        const loadedDepts = deptDtos.map(d =>
          departmentFromDTO(d, loadedUsers.filter(u => u.departmentId === String(d.d_id)).length)
        );
        const loadedAlerts = messageDtos.map(m => alertFromDTO(m));

        if (cancelled) return;
        setUsers(loadedUsers);
        setRawDepts(loadedDepts);
        setAlerts(loadedAlerts);
        setConnected(true);
      } catch {
        if (cancelled) return;
        setRawDepts(SEED_DEPARTMENTS);
        setUsers(SEED_USERS);
        setAlerts(SEED_ALERTS);
        setConnected(false);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadAll();

    return () => {
      cancelled = true;
    };
  }, []);

  // Compute departments with live user counts
  const departments = computeUserCounts(rawDepts, users);
  const deptNameOf = (id: string): string => rawDepts.find(d => d.id === id)?.name ?? "";

  const addDepartment = useCallback(async (data: CreateDepartmentInput) => {
    const dto = await departmentService.create(toCreateDepartmentDTO(data));
    const created = departmentFromDTO(dto);
    setRawDepts(prev => [...prev, created]);
  }, []);

  const updateDepartment = useCallback(async (id: string, data: UpdateDepartmentInput) => {
    const updated = departmentFromDTO(await departmentService.update(id, data));
    setRawDepts(prev => prev.map(d => (d.id === id ? { ...d, ...updated } : d)));
  }, []);

  const deleteDepartment = useCallback(async (id: string) => {
    await departmentService.remove(id);
    setRawDepts(prev => prev.filter(d => d.id !== id));
  }, []);

  const addUser = useCallback(async (input: CreateUserInput) => {
    const departmentName = deptNameOf(input.departmentId);
    const dto = await userService.create(toCreateUserDTO(input, departmentName));
    const created = userFromDTO(dto, new Map([[departmentName, input.departmentId]]));
    setUsers(prev => [...prev, created]);
  }, [deptNameOf]);

  const updateUser = useCallback(async (id: string, data: UpdateUserInput) => {
    const departmentName = data.departmentId ? deptNameOf(data.departmentId) : undefined;
    const dto = await userService.update(id, toUpdateUserDTO(data, departmentName));
    const updated = departmentName
      ? userFromDTO(dto, new Map([[departmentName, data.departmentId!]]))
      : userFromDTO(dto, toDeptIdMap(rawDepts));
    setUsers(prev => prev.map(u => (u.id === id ? { ...u, ...updated } : u)));
  }, [deptNameOf, rawDepts]);

  const deleteUser = useCallback(async (id: string) => {
    await userService.remove(id);
    setUsers(prev => prev.filter(u => u.id !== id));
  }, []);

  const addAlert = useCallback(async (data: CreateAlertInput) => {
    const dto = await messageService.create(toCreateMessageDTO(data));
    const created = alertFromDTO(dto);
    setAlerts(prev => [created, ...prev]);
  }, []);

  const deleteAlert = useCallback(async (id: string) => {
    await messageService.remove(id);
    setAlerts(prev => prev.filter(a => a.id !== id));
  }, []);

  const getDepartmentById = useCallback((id: string) => departments.find(d => d.id === id), [departments]);
  const getUserById = useCallback((id: string) => users.find(u => u.id === id), [users]);
  const getAlertById = useCallback((id: string) => alerts.find(a => a.id === id), [alerts]);

  return (
    <AppContext.Provider value={{
      departments, users, alerts, loading, connected,
      addDepartment, updateDepartment, deleteDepartment,
      addUser, updateUser, deleteUser,
      addAlert, deleteAlert,
      getDepartmentById, getUserById, getAlertById,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
}