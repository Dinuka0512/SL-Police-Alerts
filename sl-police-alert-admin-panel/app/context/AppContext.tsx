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
        setRawDepts([]);
        setUsers([]);
        setAlerts([]);
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