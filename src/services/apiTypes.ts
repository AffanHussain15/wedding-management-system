/**
 * Wire types for the Smart Wedding API.
 *
 * These mirror the backend exactly and are deliberately kept separate from the
 * app's view models in `@types` — the mapping between them lives in
 * `services/mappers.ts`. Two serialization details matter:
 *
 *  - `DateTime` columns arrive as ISO-8601 strings, hence `IsoDate`.
 *  - Prisma `Decimal` columns serialize via `toJSON()`, so money arrives as a
 *    *string* ("220000") — never a number. Use `toNumber()` to read them.
 *    Fields the backend has already passed through `Number(...)` are typed as
 *    `number` below; the difference is intentional, not an oversight.
 */

/** ISO-8601 timestamp, e.g. "2027-02-14T00:00:00.000Z". */
export type IsoDate = string;

/** Decimal serialized as a string by Prisma, e.g. "220000". */
export type DecimalString = string;

// ---------------------------------------------------------------------------
// Enums (mirror prisma/schema.prisma)
// ---------------------------------------------------------------------------

export const WEDDING_ROLES = ['OWNER', 'CO_OWNER', 'FAMILY_MEMBER', 'VIEWER'] as const;
export type WeddingRole = (typeof WEDDING_ROLES)[number];

export const INVITE_STATUSES = ['PENDING', 'ACCEPTED', 'EXPIRED', 'REVOKED'] as const;
export type InviteStatus = (typeof INVITE_STATUSES)[number];

export const AUTH_PROVIDERS = ['EMAIL', 'GOOGLE'] as const;
export type AuthProvider = (typeof AUTH_PROVIDERS)[number];

export const API_VENDOR_CATEGORIES = [
  'CATERING',
  'PHOTOGRAPHY',
  'DECORATION',
  'SALON',
  'TRANSPORT',
  'BAND_DJ',
  'VENUE',
  'DRESS_DESIGNER',
  'JEWELLERY',
  'INVITATION_CARDS',
  'OTHER',
] as const;
export type ApiVendorCategory = (typeof API_VENDOR_CATEGORIES)[number];

export const PAYMENT_METHODS = ['CASH', 'BANK_TRANSFER', 'CARD', 'OTHER'] as const;
export type PaymentMethod = (typeof PAYMENT_METHODS)[number];

/** Derived server-side from payments vs totalPrice; never stored. */
export const VENDOR_PAYMENT_STATUSES = ['PENDING', 'ADVANCE', 'PAID'] as const;
export type VendorPaymentStatus = (typeof VENDOR_PAYMENT_STATUSES)[number];

export const API_GUEST_SIDES = ['BRIDE', 'GROOM', 'BOTH'] as const;
export type ApiGuestSide = (typeof API_GUEST_SIDES)[number];

export const GATHERING_TYPES = ['MARDANA', 'ZANANA', 'MIXED'] as const;
export type GatheringType = (typeof GATHERING_TYPES)[number];

export const API_RSVP_STATUSES = ['PENDING', 'CONFIRMED', 'DECLINED'] as const;
export type ApiRsvpStatus = (typeof API_RSVP_STATUSES)[number];

export const API_BUDGET_CATEGORIES = [
  'CATERING',
  'DECORATION',
  'DRESSES',
  'JEWELLERY',
  'PHOTOGRAPHY',
  'VENUE',
  'TRANSPORT',
  'INVITATION_CARDS',
  'SALON_MAKEUP',
  'GIFTS',
  'MISCELLANEOUS',
  'OTHER',
] as const;
export type ApiBudgetCategory = (typeof API_BUDGET_CATEGORIES)[number];

export const EVENT_STATUSES = ['UPCOMING', 'DONE', 'CANCELLED', 'POSTPONED'] as const;
export type EventStatus = (typeof EVENT_STATUSES)[number];

/** List/detail responses add 'NEXT' for the single nearest upcoming event. */
export type ComputedEventStatus = EventStatus | 'NEXT';

export const TASK_STATUSES = ['PENDING', 'IN_PROGRESS', 'DONE'] as const;
export type TaskStatus = (typeof TASK_STATUSES)[number];

export const TASK_PRIORITIES = ['LOW', 'MEDIUM', 'HIGH'] as const;
export type TaskPriority = (typeof TASK_PRIORITIES)[number];

export const NOTIFICATION_CHANNELS = ['SMS', 'WHATSAPP', 'EMAIL'] as const;
export type NotificationChannel = (typeof NOTIFICATION_CHANNELS)[number];

// ---------------------------------------------------------------------------
// Envelope
// ---------------------------------------------------------------------------

export interface PaginationMeta {
  page: number;
  limit: number;
  totalItems: number;
  totalPages: number;
}

/**
 * `meta` always carries timestamp/requestId. List endpoints add `pagination`;
 * a few endpoints add one-off keys (`warning`, `vendorSummary`) because the
 * backend's ResponseInterceptor spreads any non-`data` key into meta.
 */
export interface ResponseMeta {
  timestamp: string;
  requestId: string;
  pagination?: PaginationMeta;
  warning?: string | null;
  [key: string]: unknown;
}

/** A list payload plus its pagination metadata. */
export interface Paginated<T> {
  items: T[];
  pagination?: PaginationMeta;
}

/** Static `{ value, label }` reference lists (vendor/budget categories). */
export interface CategoryOption<T extends string = string> {
  value: T;
  label: string;
}

// ---------------------------------------------------------------------------
// Module 02 — Authentication
// ---------------------------------------------------------------------------

export interface PublicUser {
  id: string;
  fullName: string;
  email: string;
  isEmailVerified: boolean;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface AuthResult extends AuthTokens {
  user: PublicUser;
}

export interface MessageResponse {
  message: string;
}

export interface ActiveSession {
  id: string;
  deviceInfo: string | null;
  createdAt: IsoDate;
  expiresAt: IsoDate;
}

export interface RegisterPayload {
  fullName: string;
  email: string;
  /** Min 8 chars, at least one uppercase letter and one digit. */
  password: string;
  /** E.164 format, e.g. "+923001234567". */
  phone?: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface ResetPasswordPayload {
  email: string;
  token: string;
  newPassword: string;
}

// ---------------------------------------------------------------------------
// Module 03 — Users & Wedding Workspace
// ---------------------------------------------------------------------------

export interface WeddingMembershipSummary {
  id: string;
  name: string;
  role: WeddingRole;
}

export interface CurrentUser {
  id: string;
  fullName: string;
  email: string;
  phone: string | null;
  profileImageUrl: string | null;
  /** Every wedding the user belongs to — the source for picking an active one. */
  weddings: WeddingMembershipSummary[];
}

export interface UpdateProfilePayload {
  fullName?: string;
  phone?: string;
  profileImageUrl?: string;
}

export interface Wedding {
  id: string;
  name: string;
  weddingDate: IsoDate | null;
  venueCity: string | null;
  estimatedGuests: number | null;
  totalBudget: DecimalString | null;
  coverImageUrl: string | null;
  createdBy: string;
  createdAt: IsoDate;
  updatedAt: IsoDate;
  deletedAt: IsoDate | null;
}

/** `POST /weddings` — the created wedding plus the creator's role. */
export interface CreatedWedding extends Wedding {
  role: WeddingRole;
}

/** `GET /weddings/:id` — adds the caller's role and the member count. */
export interface WeddingDetail extends Wedding {
  memberCount: number;
  role: WeddingRole;
}

export interface CreateWeddingPayload {
  name: string;
  weddingDate?: IsoDate;
  venueCity?: string;
  estimatedGuests?: number;
  totalBudget?: number;
}

export type UpdateWeddingPayload = Partial<CreateWeddingPayload>;

export interface WeddingMember {
  userId: string;
  fullName: string;
  email: string;
  role: WeddingRole;
  joinedAt: IsoDate;
}

/** Only these three roles may be invited; OWNER cannot. */
export type InvitableRole = Exclude<WeddingRole, 'OWNER'>;

export interface InviteMemberPayload {
  email: string;
  role: InvitableRole;
}

export interface CreatedInvite {
  id: string;
  email: string;
  role: WeddingRole;
  status: InviteStatus;
}

export interface AcceptedInvite {
  weddingId: string;
  role: WeddingRole;
}

// ---------------------------------------------------------------------------
// Module 04 — Vendors
// ---------------------------------------------------------------------------

export interface VendorPayment {
  id: string;
  vendorId: string;
  amount: DecimalString;
  paymentDate: IsoDate;
  method: PaymentMethod;
  note: string | null;
  recordedBy: string;
  createdAt: IsoDate;
}

/** Raw Vendor row, as returned by create/update. */
export interface Vendor {
  id: string;
  weddingId: string;
  name: string;
  category: ApiVendorCategory;
  customCategory: string | null;
  contactName: string | null;
  phone: string | null;
  email: string | null;
  totalPrice: DecimalString | null;
  notes: string | null;
  imageUrl: string | null;
  eventId: string | null;
  createdBy: string;
  createdAt: IsoDate;
  updatedAt: IsoDate;
  deletedAt: IsoDate | null;
}

/** Trimmed row from `GET .../vendors` with derived payment fields. */
export interface VendorListItem {
  id: string;
  name: string;
  category: ApiVendorCategory;
  phone: string | null;
  totalPrice: DecimalString | null;
  totalPaid: number;
  balanceDue: number | null;
  status: VendorPaymentStatus;
  eventId: string | null;
  imageUrl: string | null;
  createdAt: IsoDate;
}

/** `GET .../vendors/:id` — the full row, its payments, and derived totals. */
export interface VendorDetail extends Vendor {
  payments: VendorPayment[];
  totalPaid: number;
  balanceDue: number | null;
  status: VendorPaymentStatus;
}

export interface CreateVendorPayload {
  name: string;
  category: ApiVendorCategory;
  /** Required when `category` is 'OTHER'. */
  customCategory?: string;
  contactName?: string;
  phone?: string;
  email?: string;
  totalPrice?: number;
  eventId?: string;
  notes?: string;
}

export type UpdateVendorPayload = Partial<CreateVendorPayload>;

export interface RecordPaymentPayload {
  amount: number;
  paymentDate?: IsoDate;
  method?: PaymentMethod;
  note?: string;
}

export interface VendorSummaryAfterPayment {
  totalPaid: number;
  totalPrice: number | null;
  balanceDue: number | null;
  status: VendorPaymentStatus;
}

/**
 * `POST .../payments`. The backend puts `warning` and `vendorSummary` in
 * `meta`, not `data`; the client re-attaches them here so callers see one
 * object.
 */
export interface RecordPaymentResult {
  payment: {
    id: string;
    amount: DecimalString;
    paymentDate: IsoDate;
    method: PaymentMethod;
  };
  /** Set when total paid now exceeds the agreed price (allowed, not blocked). */
  warning: string | null;
  vendorSummary: VendorSummaryAfterPayment | null;
}

export type VendorListQuery = {
  page?: number;
  limit?: number;
  sortBy?: 'name' | 'createdAt' | 'totalPrice';
  sortOrder?: 'asc' | 'desc';
  search?: string;
  category?: ApiVendorCategory;
  status?: VendorPaymentStatus;
  eventId?: string;
}

// ---------------------------------------------------------------------------
// Module 05 — Guests & RSVP
// ---------------------------------------------------------------------------

export interface Guest {
  id: string;
  weddingId: string;
  name: string;
  groupSize: number;
  confirmedCount: number | null;
  phone: string | null;
  email: string | null;
  side: ApiGuestSide;
  gathering: GatheringType;
  rsvpStatus: ApiRsvpStatus;
  rsvpToken: string;
  tableNumber: string | null;
  notes: string | null;
  lastInvitedAt: IsoDate | null;
  createdBy: string;
  createdAt: IsoDate;
  updatedAt: IsoDate;
  deletedAt: IsoDate | null;
}

/** Trimmed row from `GET .../guests`. */
export interface GuestListItem {
  id: string;
  name: string;
  groupSize: number;
  phone: string | null;
  side: ApiGuestSide;
  gathering: GatheringType;
  rsvpStatus: ApiRsvpStatus;
  tableNumber: string | null;
}

/** Head counts sum `groupSize`; `totalGroups` counts guest rows. */
export interface GuestSummary {
  totalGuests: number;
  confirmedHeads: number;
  pendingHeads: number;
  declinedHeads: number;
  totalGroups: number;
}

export interface CreateGuestPayload {
  name: string;
  /** 1–50. */
  groupSize: number;
  phone?: string;
  email?: string;
  side?: ApiGuestSide;
  gathering?: GatheringType;
  /** Omit to treat the guest as invited to every event. */
  eventIds?: string[];
}

export type UpdateGuestPayload = Partial<CreateGuestPayload>;

export interface ImportFailure {
  /** 1-based row number in the uploaded file (header is row 1). */
  row: number;
  reason: string;
}

export interface BulkImportResult {
  importedCount: number;
  failedCount: number;
  failures: ImportFailure[];
}

/** A file to upload, as produced by a document/image picker. */
export interface UploadFile {
  uri: string;
  name: string;
  type: string;
}

export interface SendInvitePayload {
  channel?: NotificationChannel;
  /** Bypasses the 24-hour resend cooldown. */
  force?: boolean;
}

export interface BulkSendInvitesPayload {
  guestIds: string[];
  channel?: NotificationChannel;
}

export type GuestListQuery = {
  page?: number;
  limit?: number;
  sortBy?: 'name' | 'createdAt' | 'groupSize';
  sortOrder?: 'asc' | 'desc';
  search?: string;
  rsvpStatus?: ApiRsvpStatus;
  side?: ApiGuestSide;
  gathering?: GatheringType;
  eventId?: string;
}

/** Public, unauthenticated invite lookup. */
export interface PublicInvite {
  weddingName: string;
  weddingDate: IsoDate | null;
  guestName: string;
  currentStatus: ApiRsvpStatus;
}

export interface SubmitRsvpPayload {
  response: 'CONFIRMED' | 'DECLINED';
  /** Must not exceed the guest's groupSize. */
  attendingCount?: number;
  message?: string;
}

// ---------------------------------------------------------------------------
// Module 06 — Budget
// ---------------------------------------------------------------------------

export interface BudgetCategoryTotal {
  category: ApiBudgetCategory;
  amount: number;
}

/** All numeric — the backend converts these out of Decimal before returning. */
export interface BudgetSummary {
  totalBudget: number | null;
  totalSpent: number;
  remaining: number | null;
  percentUsed: number | null;
  byCategory: BudgetCategoryTotal[];
}

export interface BudgetItem {
  id: string;
  weddingId: string;
  category: ApiBudgetCategory;
  customCategory: string | null;
  title: string;
  amount: DecimalString;
  expenseDate: IsoDate;
  /** Set when auto-created from a vendor payment; such items are read-only. */
  vendorId: string | null;
  vendorPaymentId: string | null;
  paymentMethod: PaymentMethod;
  notes: string | null;
  recordedBy: string;
  createdAt: IsoDate;
  updatedAt: IsoDate;
  deletedAt: IsoDate | null;
}

export interface CreateBudgetItemPayload {
  category: ApiBudgetCategory;
  /** Required when `category` is 'OTHER'. */
  customCategory?: string;
  title: string;
  amount: number;
  /** Cannot be more than one year in the future. */
  expenseDate?: IsoDate;
  paymentMethod?: PaymentMethod;
  notes?: string;
}

export type UpdateBudgetItemPayload = Partial<CreateBudgetItemPayload>;

export type BudgetItemListQuery = {
  page?: number;
  limit?: number;
  sortBy?: 'expenseDate' | 'amount' | 'createdAt';
  sortOrder?: 'asc' | 'desc';
  category?: ApiBudgetCategory;
  search?: string;
  dateFrom?: IsoDate;
  dateTo?: IsoDate;
  vendorId?: string;
}

// ---------------------------------------------------------------------------
// Module 07 — Events & Tasks
// ---------------------------------------------------------------------------

export interface Event {
  id: string;
  weddingId: string;
  name: string;
  eventDate: IsoDate;
  startTime: string | null;
  venueName: string | null;
  venueAddress: string | null;
  notes: string | null;
  manualStatus: EventStatus | null;
  createdBy: string;
  createdAt: IsoDate;
  updatedAt: IsoDate;
  deletedAt: IsoDate | null;
}

export interface EventListItem {
  id: string;
  name: string;
  eventDate: IsoDate;
  venueName: string | null;
  computedStatus: ComputedEventStatus;
}

export interface EventDetail {
  id: string;
  weddingId: string;
  name: string;
  eventDate: IsoDate;
  startTime: string | null;
  venueName: string | null;
  venueAddress: string | null;
  notes: string | null;
  manualStatus: EventStatus | null;
  computedStatus: ComputedEventStatus;
  linkedVendorsCount: number;
  /** Explicit invites only — guests invited to all events aren't counted. */
  invitedGuestsCount: number;
  openTasksCount: number;
  createdAt: IsoDate;
  updatedAt: IsoDate;
}

export interface CreateEventPayload {
  name: string;
  eventDate: IsoDate;
  /** "HH:mm", 24-hour. */
  startTime?: string;
  venueName?: string;
  venueAddress?: string;
  notes?: string;
}

export interface UpdateEventPayload extends Partial<CreateEventPayload> {
  /** Omit to auto-derive status from the date. */
  manualStatus?: EventStatus;
}

export type EventListQuery = {
  page?: number;
  limit?: number;
  sortBy?: 'eventDate' | 'name' | 'createdAt';
  sortOrder?: 'asc' | 'desc';
}

export interface Task {
  id: string;
  weddingId: string;
  eventId: string | null;
  title: string;
  description: string | null;
  assignedTo: string | null;
  dueDate: IsoDate | null;
  status: TaskStatus;
  priority: TaskPriority;
  createdBy: string;
  createdAt: IsoDate;
  updatedAt: IsoDate;
  deletedAt: IsoDate | null;
}

/** `null` when the task is unassigned; `false` when the assignee has left. */
export interface TaskListItem extends Task {
  assigneeIsActiveMember: boolean | null;
}

export interface CreateTaskPayload {
  title: string;
  description?: string;
  /** Must be a current member of the wedding. */
  assignedTo?: string;
  dueDate?: IsoDate;
  priority?: TaskPriority;
  eventId?: string;
}

export interface UpdateTaskPayload extends Partial<CreateTaskPayload> {
  status?: TaskStatus;
}

export type TaskListQuery = {
  page?: number;
  limit?: number;
  sortBy?: 'dueDate' | 'priority' | 'createdAt';
  sortOrder?: 'asc' | 'desc';
  status?: TaskStatus;
  priority?: TaskPriority;
  assignedTo?: string;
  eventId?: string;
  search?: string;
}

// ---------------------------------------------------------------------------
// Module 08 — Dashboard
// ---------------------------------------------------------------------------

export interface DashboardSummary {
  weddingName: string;
  /** Negative once the date has passed; null when no date is set. */
  daysUntilWedding: number | null;
  overallProgress: number;
  tasksCompleted: number;
  tasksTotal: number;
  budget: {
    totalBudget: number | null;
    totalSpent: number;
    percentUsed: number | null;
  };
  guests: {
    total: number;
    confirmed: number;
  };
  vendors: {
    totalCount: number;
    fullyPaidCount: number;
  };
  events: {
    totalCount: number;
    nextEvent: { id: string; name: string; eventDate: IsoDate } | null;
  };
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Reads a money field that may arrive as a Decimal string, a number, or null.
 * Returns `fallback` for null/undefined/unparseable input so callers never
 * propagate NaN into the UI.
 */
export function toNumber(
  value: DecimalString | number | null | undefined,
  fallback = 0,
): number {
  if (value === null || value === undefined) return fallback;
  const parsed = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

/** Same as `toNumber` but preserves null, for "not set" vs "zero". */
export function toNullableNumber(
  value: DecimalString | number | null | undefined,
): number | null {
  if (value === null || value === undefined) return null;
  const parsed = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

/** ISO timestamp → "YYYY-MM-DD" (the app's date format), or '' if absent. */
export function toDateOnly(value: IsoDate | null | undefined): string {
  if (!value) return '';
  const index = value.indexOf('T');
  return index === -1 ? value : value.slice(0, index);
}
