import api from "./api";
import type { BarberConfig } from "../types";

// GET  /barbershop/config
// PUT  /barbershop/config

export const configApi = {
  get: () =>
    api.get<{ success: true; data: BarberConfig }>("/barbershop/config"),

  upsert: (body: Partial<BarberConfig>) =>
    api.put<{ success: true; data: BarberConfig }>("/barbershop/config", body),
};
