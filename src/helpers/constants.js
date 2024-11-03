const INITIATIVE_STATUS = {
  PENDING: 'Pending',
  ONGOING: 'Ongoing',
  COMPLETED: 'Completed',
};

const ROLE = {
  PROMOTER: 'Promoter',
  SUPERVISOR: 'Supervisor',
  CLIENT: 'Client',
  ADMIN: 'Admin',
  SUPER_ADMIN: 'Super Admin',
  AGENCY: 'Agency',
  BASIC_SUBUSER: 'Basic Subuser',
};

const MODEL_NAME = {
  ADMIN: 'Admin',
  EMPLOYEE: 'Employee',
  CLIENT: 'Client',
  AGENCY: 'Agency',
  SUBUSER: 'Subuser',
  MESSAGE: 'Message',
};

const ROLE_TO_MODEL_MAPPING = {
  [ROLE.ADMIN]: MODEL_NAME.ADMIN,
  [ROLE.SUPER_ADMIN]: MODEL_NAME.ADMIN,
  [ROLE.CLIENT]: MODEL_NAME.CLIENT,
  [ROLE.PROMOTER]: MODEL_NAME.EMPLOYEE,
  [ROLE.SUPERVISOR]: MODEL_NAME.EMPLOYEE,
  [ROLE.AGENCY]: MODEL_NAME.AGENCY,
  [ROLE.BASIC_SUBUSER]: MODEL_NAME.SUBUSER,
  // Add more role-to-model mappings as needed
};

const CLOCK_IN_MIN_DIST_METERS = 150;

const EXCEL_MAX_DOWNLOAD_RANGE = 50_000;

const TICKET_STATUS = {
  OPEN: 'open',
  IN_PROGRESS: 'in_progress',
  RECTIFIED: 'rectified',
  INVALID: 'invalid',
};

const TICKET_STATUS_ENUMS = Object.values(TICKET_STATUS);

const TICKET_STATUS_SUBJECT_MAP = {
  [TICKET_STATUS.OPEN]: 'Support Ticket Created',
  [TICKET_STATUS.IN_PROGRESS]: 'Support Ticket In Progress',
  [TICKET_STATUS.RECTIFIED]: 'Support Ticket Resolved',
  [TICKET_STATUS.INVALID]: 'Support Ticket Marked as Invalid',
};

const EXCEL_ROW_LIMIT = 1048574;

const DB_FILTERING_EXCLUDED_PROPS = [
  'page',
  'sort',
  'limit',
  'fields',
  'search',
  'statesFilterGroupId',
  'productsFilterGroupId',
  'initiativeStoresFilterGroupId',
];

module.exports = {
  INITIATIVE_STATUS,
  ROLE,
  MODEL_NAME,
  ROLE_TO_MODEL_MAPPING,
  CLOCK_IN_MIN_DIST_METERS,
  EXCEL_MAX_DOWNLOAD_RANGE,
  TICKET_STATUS,
  TICKET_STATUS_ENUMS,
  TICKET_STATUS_SUBJECT_MAP,
  EXCEL_ROW_LIMIT,
  DB_FILTERING_EXCLUDED_PROPS,
};
