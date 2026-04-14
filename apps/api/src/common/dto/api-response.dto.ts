export class ApiResponse<T> {
  success: boolean;
  data: T;
  timestamp: string;

  constructor(data: T) {
    this.success = true;
    this.data = data;
    this.timestamp = new Date().toISOString();
  }
}

export class ApiErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
  timestamp: string;

  constructor(code: string, message: string, details?: unknown) {
    this.success = false;
    this.error = { code, message, ...(details !== undefined && { details }) };
    this.timestamp = new Date().toISOString();
  }
}

export class PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: {
    nextCursor: string | null;
    hasNext: boolean;
    totalCount?: number;
  };
  timestamp: string;

  constructor(
    data: T[],
    pagination: { nextCursor: string | null; hasNext: boolean; totalCount?: number },
  ) {
    this.success = true;
    this.data = data;
    this.pagination = pagination;
    this.timestamp = new Date().toISOString();
  }
}
