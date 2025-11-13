import { pgTable, uuid, text, timestamp, integer, primaryKey } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

export const tenants = pgTable("tenants", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull().unique(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const agents = pgTable("agents", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  workflowId: text("workflow_id").notNull(),
  tenantId: uuid("tenant_id").references(() => tenants.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const dashboards = pgTable("dashboards", {
  id: uuid("id").primaryKey().defaultRandom(),
  title: text("title").notNull(),
  slug: text("slug").notNull().unique(),
  tenantId: uuid("tenant_id").references(() => tenants.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const dashboardAgents = pgTable(
  "dashboard_agents",
  {
    dashboardId: uuid("dashboard_id")
      .references(() => dashboards.id, { onDelete: "cascade" })
      .notNull(),
    agentId: uuid("agent_id")
      .references(() => agents.id, { onDelete: "cascade" })
      .notNull(),
    order: integer("order").notNull().default(0),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.dashboardId, table.agentId] }),
  })
);

// Relations
export const tenantsRelations = relations(tenants, ({ many }) => ({
  agents: many(agents),
  dashboards: many(dashboards),
}));

export const agentsRelations = relations(agents, ({ one, many }) => ({
  tenant: one(tenants, {
    fields: [agents.tenantId],
    references: [tenants.id],
  }),
  dashboardAgents: many(dashboardAgents),
}));

export const dashboardsRelations = relations(dashboards, ({ one, many }) => ({
  tenant: one(tenants, {
    fields: [dashboards.tenantId],
    references: [tenants.id],
  }),
  dashboardAgents: many(dashboardAgents),
}));

export const dashboardAgentsRelations = relations(dashboardAgents, ({ one }) => ({
  dashboard: one(dashboards, {
    fields: [dashboardAgents.dashboardId],
    references: [dashboards.id],
  }),
  agent: one(agents, {
    fields: [dashboardAgents.agentId],
    references: [agents.id],
  }),
}));

// Types
export type Tenant = typeof tenants.$inferSelect;
export type NewTenant = typeof tenants.$inferInsert;
export type Agent = typeof agents.$inferSelect;
export type NewAgent = typeof agents.$inferInsert;
export type Dashboard = typeof dashboards.$inferSelect;
export type NewDashboard = typeof dashboards.$inferInsert;
export type DashboardAgent = typeof dashboardAgents.$inferSelect;
export type NewDashboardAgent = typeof dashboardAgents.$inferInsert;
